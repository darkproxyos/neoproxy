// Pase visual NeoProxy -- Digiz 0.2/0.3. No toca ninguno de los 29 archivos
// de nivel: se engancha al create()/update() real de cada estado (ver el
// patch de Phaser.StateManager.prototype.add más abajo) y reconoce sprites
// por su KEY de textura real (confirmado contra los game.load.image/
// spritesheet de cada nivel), no por nombre de variable -- esas varían
// entre archivos (bolapuas, bolapuas2..10, boomerang, boomerang10b, etc.)
// pero las keys de textura son un set chico y fijo. Así el mismo script
// cubre los 29 niveles sin mantener una lista por archivo.
//
// IMPORTANTE: la cámara sigue al jugador (game.camera.follow(sprite) en
// cada nivel) y el mundo es más grande que la pantalla (fondo de hasta
// 2560x1920 contra un canvas de ~1400x900) -- todo lo que tiene que leerse
// como "HUD" (grilla, viñeta, scanlines) va con fixedToCamera=true, si no
// se desalinea del viewport en cuanto el jugador se mueve y la cámara
// scrollea. El degradado de fondo y los halos de glow sí van en espacio de
// mundo (se mueven con lo que iluminan).
//
// Carga ANTES que menu.js/menunivel.js/index.js (ver index.html) -- el
// patch tiene que existir antes de que se llame game.state.add() la
// primera vez.
(function () {
  var PLAYER_COLOR = 0x00d4ff; // cian -- mismo lenguaje de color que el resto del sitio
  var HAZARD_COLOR = 0xff2d55; // rojo peligro
  var ACCENT_COLOR = 0xffb800; // ambar
  var PORTAL_COLOR = 0x00ffcc; // verde señal

  var PLAYER_KEYS = { arrow: 1 };
  var HAZARD_KEYS = {
    bolapuas: 1, bolapuaslvl1: 1, bolarapida: 1, bolalenta: 1,
    sierra: 1, sierralvl1: 1, sierralvl3: 1,
    aplastador: 1, aplastadorlvl3: 1, canon: 1, bullet: 1,
  };
  var ACCENT_KEYS = {
    boomerang: 1, boomeranglvl1: 1, boomeranglvl2: 1, boomeranglvl3: 1,
    baseboomerang: 1, baseboomeranglvl1: 1, baseboomeranglvl2: 1, baseboomeranglvl3: 1,
  };
  var PORTAL_KEYS = { portalwin: 1, portalfinal: 1, medalla: 1 };

  // recorre el display list entero (world + grupos anidados) en vez de
  // depender de variables globales por nivel
  function forEachSprite(container, fn) {
    if (!container || !container.children) return;
    for (var i = 0; i < container.children.length; i++) {
      var child = container.children[i];
      fn(child);
      if (child.children && child.children.length) forEachSprite(child, fn);
    }
  }

  function categorize(gameRef) {
    var groups = { player: [], hazard: [], accent: [], portal: [], fondo: null };
    forEachSprite(gameRef.world, function (obj) {
      var key = obj.key;
      if (typeof key !== 'string') return;
      if (key === 'fondo' && !groups.fondo) groups.fondo = obj;
      else if (PLAYER_KEYS[key]) groups.player.push(obj);
      else if (HAZARD_KEYS[key]) groups.hazard.push(obj);
      else if (ACCENT_KEYS[key]) groups.accent.push(obj);
      else if (PORTAL_KEYS[key]) groups.portal.push(obj);
    });
    return groups;
  }

  function applyTints(groups) {
    function tint(list, color) {
      for (var i = 0; i < list.length; i++) if (list[i].tint !== undefined) list[i].tint = color;
    }
    tint(groups.player, PLAYER_COLOR);
    tint(groups.hazard, HAZARD_COLOR);
    tint(groups.accent, ACCENT_COLOR);
    tint(groups.portal, PORTAL_COLOR);
  }

  // --- halos de glow (radiales, generados en código con BitmapData, no
  // assets nuevos) -- lo que pedía "glow a los peligros": un tinte normal
  // casi no se nota contra sprites ya oscuros (multiplica sobre negro), un
  // halo de luz detrás sí se ve siempre, sin importar cuán oscuro sea el
  // sprite real. ---
  var glowTexCache = {};
  function rgba(colorHex, a) {
    var r = (colorHex >> 16) & 0xff, g = (colorHex >> 8) & 0xff, b = colorHex & 0xff;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function getGlowTexture(gameRef, colorHex, size) {
    var cacheKey = colorHex + '_' + size;
    if (glowTexCache[cacheKey]) return glowTexCache[cacheKey];
    var bmd = gameRef.add.bitmapData(size, size);
    var ctx = bmd.context;
    var r = size / 2;
    var grad = ctx.createRadialGradient(r, r, 0, r, r, r);
    // núcleo casi blanco en vez de arrancar directo en el color -- un halo
    // de color puro contra un fondo que ya comparte ese tono (rojo sobre
    // tierra marrón, por ejemplo) casi no sube de contraste aunque el alpha
    // sea alto. Un centro muy brillante sí lee como foco de luz real contra
    // cualquier fondo, sea cual sea su tono.
    var r8 = (colorHex >> 16) & 0xff, g8 = (colorHex >> 8) & 0xff, b8 = colorHex & 0xff;
    var hot = 'rgba(' + Math.min(255, r8 + 120) + ',' + Math.min(255, g8 + 120) + ',' + Math.min(255, b8 + 120) + ',1)';
    grad.addColorStop(0, hot);
    grad.addColorStop(0.22, rgba(colorHex, 0.95));
    grad.addColorStop(0.55, rgba(colorHex, 0.45));
    grad.addColorStop(1, rgba(colorHex, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    bmd.dirty = true;
    glowTexCache[cacheKey] = bmd;
    return bmd;
  }

  var activeGlows = [];
  function clearGlows() {
    for (var i = 0; i < activeGlows.length; i++) {
      var gl = activeGlows[i].glow;
      if (gl && gl.destroy) gl.destroy();
    }
    activeGlows = [];
  }
  function addGlow(gameRef, target, colorHex, size, baseAlpha) {
    var tex = getGlowTexture(gameRef, colorHex, size);
    var glow = gameRef.add.sprite(target.x, target.y, tex);
    glow.anchor.setTo(0.5);
    glow.blendMode = Phaser.blendModes.ADD;
    glow.alpha = baseAlpha;
    // insertado en el mismo padre que el blanco (world o un Group anidado),
    // justo antes -- queda "detrás" del sprite real en vez de taparlo
    var parent = target.parent || gameRef.world;
    var idx = parent.getChildIndex(target);
    parent.addChildAt(glow, idx >= 0 ? idx : 0);
    activeGlows.push({ glow: glow, target: target, baseAlpha: baseAlpha, phase: Math.random() * Math.PI * 2 });
  }
  function updateGlows(t) {
    for (var i = 0; i < activeGlows.length; i++) {
      var g = activeGlows[i];
      if (!g.target.exists || !g.target.alive) { g.glow.visible = false; continue; }
      g.glow.visible = true;
      g.glow.x = g.target.x;
      g.glow.y = g.target.y;
      // pulso de alpha Y de tamaño -- un halo que solo cambia de brillo se
      // siente estático; que además "respire" de escala lo hace leer como
      // energía activa, no una textura pegada atrás.
      var pulse = 0.6 + 0.4 * Math.sin(t * 0.0035 + g.phase);
      g.glow.alpha = g.baseAlpha * pulse;
      var s = 0.82 + 0.3 * pulse;
      g.glow.scale.set(s, s);
    }
  }

  // --- anillo de mira girando sobre el jugador -- el "cambio radical" más
  // visible y el más barato: una sola textura (BitmapData, un hexágono +
  // un círculo fino) que gira sola cada frame detrás del sprite real.
  var reticleTex = null;
  var reticleSprite = null;
  function ensureReticleTexture(gameRef) {
    if (reticleTex) return reticleTex;
    var size = 72;
    reticleTex = gameRef.add.bitmapData(size, size);
    var ctx = reticleTex.context;
    var cx = size / 2, cy = size / 2, r = size / 2 - 4;
    ctx.strokeStyle = 'rgba(0,212,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var ang = (Math.PI / 3) * i - Math.PI / 2;
      var px = cx + r * Math.cos(ang), py = cy + r * Math.sin(ang);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,212,255,0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
    reticleTex.dirty = true;
    return reticleTex;
  }
  function setupReticle(gameRef, player) {
    if (reticleSprite && reticleSprite.destroy) reticleSprite.destroy();
    reticleSprite = null;
    if (!player) return;
    var tex = ensureReticleTexture(gameRef);
    reticleSprite = gameRef.add.sprite(player.x, player.y, tex);
    reticleSprite.anchor.setTo(0.5);
    reticleSprite.blendMode = Phaser.blendModes.ADD;
    var parent = player.parent || gameRef.world;
    parent.addChildAt(reticleSprite, parent.getChildIndex(player));
  }
  function updateReticle(player) {
    if (!reticleSprite) return;
    if (!player || !player.exists) { reticleSprite.visible = false; return; }
    reticleSprite.visible = true;
    reticleSprite.x = player.x;
    reticleSprite.y = player.y;
    reticleSprite.rotation += 0.02;
  }

  // --- degradado de fondo: oscurece el tileSprite original (muy saturado
  // -- verde/naranja a pleno) para que el cian de peligros/jugador/halos
  // resalte en vez de competir. Va en espacio de MUNDO, del tamaño real
  // del fondo (varía de nivel a nivel, hasta 2560x1920), insertado justo
  // encima del propio 'fondo' -- así tapa solo el piso, nunca a los
  // sprites que ya estaban por encima en el create() original. ---
  function drawBackgroundGrade(gameRef, groups) {
    if (!groups.fondo) return;
    var g = gameRef.add.graphics(0, 0);
    // 0.46 dejaba el verde/naranja original demasiado presente, compitiendo
    // con los acentos cian/rojo/ámbar -- más oscuro empuja el fondo a
    // "silueta", que es lo que hace que el glow lea como la fuente de luz
    // real de la escena en vez de una capa más encima de un fondo a pleno.
    g.beginFill(0x05070e, 0.7);
    g.drawRect(0, 0, groups.fondo.width, groups.fondo.height);
    g.endFill();
    var parent = groups.fondo.parent || gameRef.world;
    var idx = parent.getChildIndex(groups.fondo);
    parent.addChildAt(g, idx >= 0 ? idx + 1 : 0);
  }

  // --- capa HUD: grilla geométrica + viñeta + scanlines, todo fixed a
  // cámara (sobrevive al scroll) -- mismo lenguaje visual que el resto del
  // sitio (grilla fina, scanlines CRT, viñeta de encuadre). ---
  function drawHud(gameRef) {
    var w = gameRef.width, h = gameRef.height;

    var grid = gameRef.add.graphics(0, 0);
    grid.blendMode = Phaser.blendModes.ADD;
    grid.lineStyle(1, 0x00d4ff, 0.3);
    var step = 80;
    for (var x = -h; x < w + h; x += step) { grid.moveTo(x, 0); grid.lineTo(x + h, h); }
    for (var x2 = 0; x2 < w + h; x2 += step) { grid.moveTo(x2, 0); grid.lineTo(x2 - h, h); }
    grid.fixedToCamera = true;

    var scan = gameRef.add.graphics(0, 0);
    scan.lineStyle(1, 0x000000, 0.12);
    for (var y = 0; y < h; y += 3) { scan.moveTo(0, y); scan.lineTo(w, y); }
    scan.fixedToCamera = true;

    // viñeta: 4 gradientes lineales cortos en cada borde (Graphics no tiene
    // gradiente radial nativo en Canvas mode) -- suficiente para que los
    // bordes se sientan "enmarcados" sin un asset nuevo.
    var vig = gameRef.add.bitmapData(w, h);
    var ctx = vig.context;
    var grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.85);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,2,5,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    vig.dirty = true;
    var vigSprite = gameRef.add.sprite(0, 0, vig);
    vigSprite.fixedToCamera = true;
  }

  // --- estela del jugador: siempre la misma variable global `sprite` en
  // los 29 niveles (confirmado -- todas usan moveToPointer sobre `sprite`)
  var trailDotBmd = null;
  var trailTimer = null;

  function ensureTrailTexture(gameRef) {
    if (trailDotBmd) return;
    trailDotBmd = gameRef.add.bitmapData(10, 10);
    trailDotBmd.circle(5, 5, 5, 'rgba(0,212,255,1)');
  }

  function spawnTrailDot(gameRef) {
    if (!window.sprite || !sprite.alive || !sprite.exists) return;
    ensureTrailTexture(gameRef);
    var dot = gameRef.add.sprite(sprite.x, sprite.y, trailDotBmd);
    dot.anchor.setTo(0.5);
    dot.blendMode = Phaser.blendModes.ADD;
    var tween = gameRef.add.tween(dot);
    tween.to({ alpha: 0 }, 420, Phaser.Easing.Quadratic.Out);
    tween.onComplete.add(function () { dot.destroy(); });
    tween.start();
    gameRef.add.tween(dot.scale).to({ x: 0.3, y: 0.3 }, 420, Phaser.Easing.Quadratic.Out).start();
  }

  function setupLevel(gameRef) {
    clearGlows();
    var groups = categorize(gameRef);
    applyTints(groups);

    drawBackgroundGrade(gameRef, groups);

    for (var i = 0; i < groups.hazard.length; i++) addGlow(gameRef, groups.hazard[i], HAZARD_COLOR, 170, 1);
    for (var j = 0; j < groups.accent.length; j++) addGlow(gameRef, groups.accent[j], ACCENT_COLOR, 120, 0.75);
    for (var k = 0; k < groups.portal.length; k++) addGlow(gameRef, groups.portal[k], PORTAL_COLOR, 210, 0.85);
    for (var m = 0; m < groups.player.length; m++) addGlow(gameRef, groups.player[m], PLAYER_COLOR, 110, 0.8);

    setupReticle(gameRef, groups.player[0]);
    drawHud(gameRef);

    if (trailTimer) { gameRef.time.events.remove(trailTimer); trailTimer = null; }
    if (window.sprite) {
      trailTimer = gameRef.time.events.loop(60, function () { spawnTrailDot(gameRef); });
    }
  }

  // Antes esto se enganchaba a game.state.onStateChange con un setTimeout
  // fijo (60ms) -- esa señal dispara apenas arranca la transición, ANTES
  // de que termine el preload del nivel nuevo (que varía según cuántos
  // assets tenga cada uno), así que el setup a veces corría sobre un mundo
  // todavía vacío y quedaba tapado por todo lo que create() agregaba
  // después. Parchear create() mismo (justo cuando Phaser lo registra con
  // state.add) corre el setup como el último paso real de cada nivel, sin
  // importar cuánto tardó su carga. Mismo patch cubre update() para el
  // pulso de los halos de glow (algunos estados, como Menu, ni siquiera
  // definen update -- se les agrega uno nuevo sin problema).
  var realAdd = Phaser.StateManager.prototype.add;
  Phaser.StateManager.prototype.add = function (key, state, autoStart) {
    if (state && typeof state.create === 'function' && !state.__neoproxySkinned) {
      var originalCreate = state.create;
      var originalUpdate = typeof state.update === 'function' ? state.update : null;
      var gameRef = this.game;
      state.create = function () {
        var result = originalCreate.apply(this, arguments);
        setupLevel(gameRef);
        return result;
      };
      state.update = function () {
        var result = originalUpdate ? originalUpdate.apply(this, arguments) : undefined;
        updateGlows(gameRef.time.now);
        updateReticle(window.sprite);
        return result;
      };
      state.__neoproxySkinned = true;
    }
    return realAdd.call(this, key, state, autoStart);
  };
})();
