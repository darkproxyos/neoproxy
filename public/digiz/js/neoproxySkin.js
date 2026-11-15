// Pase visual NeoProxy -- Digiz 0.2. No toca ninguno de los 29 archivos de
// nivel: se engancha al create() real de cada estado (ver el patch de
// Phaser.StateManager.prototype.add más abajo) y reconoce sprites por su
// KEY de textura real (confirmado contra los game.load.image/spritesheet
// de cada nivel), no por nombre de variable -- esas varían entre archivos
// (bolapuas, bolapuas2..10, boomerang, boomerang10b, etc.) pero las keys de
// textura son un set chico y fijo. Así el mismo script cubre los 29
// niveles sin mantener una lista por archivo.
//
// Carga ANTES que menu.js/menunivel.js/index.js (ver index.html) -- el
// patch tiene que existir antes de que se llame game.state.add() la
// primera vez.
(function () {
  var PLAYER_TINT = 0x00d4ff; // cian -- mismo lenguaje de color que el resto del sitio
  var HAZARD_TINT = 0xff2d55; // rojo peligro
  var ACCENT_TINT = 0xffb800; // ambar
  var PORTAL_TINT = 0x00ffcc; // verde señal

  var TINT_BY_KEY = {
    arrow: PLAYER_TINT,
    bolapuas: HAZARD_TINT,
    bolapuaslvl1: HAZARD_TINT,
    bolarapida: HAZARD_TINT,
    bolalenta: HAZARD_TINT,
    sierra: HAZARD_TINT,
    sierralvl1: HAZARD_TINT,
    sierralvl3: HAZARD_TINT,
    aplastador: HAZARD_TINT,
    aplastadorlvl3: HAZARD_TINT,
    canon: HAZARD_TINT,
    bullet: HAZARD_TINT,
    boomerang: ACCENT_TINT,
    boomeranglvl1: ACCENT_TINT,
    boomeranglvl2: ACCENT_TINT,
    boomeranglvl3: ACCENT_TINT,
    baseboomerang: ACCENT_TINT,
    baseboomeranglvl1: ACCENT_TINT,
    baseboomeranglvl2: ACCENT_TINT,
    baseboomeranglvl3: ACCENT_TINT,
    portalwin: PORTAL_TINT,
    portalfinal: PORTAL_TINT,
    medalla: PORTAL_TINT,
  };

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

  function applyTints(gameRef) {
    forEachSprite(gameRef.world, function (obj) {
      var key = obj.key;
      if (typeof key !== 'string') return;
      var tint = TINT_BY_KEY[key];
      if (tint !== undefined && obj.tint !== undefined) obj.tint = tint;
    });
  }

  // --- geometría nueva: grilla diagonal sutil sobre todo el canvas, mismo
  // lenguaje visual que el resto de NeoProxy (líneas finas, bajo alpha) --
  // dibujada con Phaser.Graphics, no es un asset nuevo. De paso tapa con
  // algo de textura la franja que antes quedaba negra en pantallas anchas.
  function drawGeometryOverlay(gameRef) {
    var g = gameRef.add.graphics(0, 0);
    // ADD en vez de alpha normal -- contra el fondo saturado de los
    // niveles (tiles verde/naranja a pleno), una línea semitransparente
    // normal se mezclaba y desaparecía; en modo aditivo el cian se suma
    // y brilla encima de cualquier color de base, visible pero sutil.
    g.blendMode = Phaser.blendModes.ADD;
    g.lineStyle(1, 0x00d4ff, 0.3);
    var step = 80;
    var w = gameRef.width, h = gameRef.height;
    for (var x = -h; x < w + h; x += step) { g.moveTo(x, 0); g.lineTo(x + h, h); }
    for (var x2 = 0; x2 < w + h; x2 += step) { g.moveTo(x2, 0); g.lineTo(x2 - h, h); }
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
    applyTints(gameRef);
    drawGeometryOverlay(gameRef);
    if (trailTimer) { gameRef.time.events.remove(trailTimer); trailTimer = null; }
    if (window.sprite) {
      trailTimer = gameRef.time.events.loop(60, function () { spawnTrailDot(gameRef); });
    }
  }

  // Antes esto se enganchaba a game.state.onStateChange con un setTimeout
  // fijo (60ms) -- esa señal dispara apenas arranca la transición, ANTES
  // de que termine el preload del nivel nuevo (que varía según cuántos
  // assets tenga cada uno), así que la grilla a veces se dibujaba sobre un
  // mundo todavía vacío y quedaba tapada por todo lo que create() agregaba
  // después. Parchear create() mismo (justo cuando Phaser lo registra con
  // state.add) corre el setup como el último paso real de cada nivel, sin
  // importar cuánto tardó su carga.
  var realAdd = Phaser.StateManager.prototype.add;
  Phaser.StateManager.prototype.add = function (key, state, autoStart) {
    if (state && typeof state.create === 'function' && !state.__neoproxySkinned) {
      var originalCreate = state.create;
      var gameRef = this.game;
      state.create = function () {
        var result = originalCreate.apply(this, arguments);
        setupLevel(gameRef);
        return result;
      };
      state.__neoproxySkinned = true;
    }
    return realAdd.call(this, key, state, autoStart);
  };
})();
