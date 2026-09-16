// ===== Filtro estilo "punk chaos" — maquillaje + mechones sobre tracking facial =====
// Dibujo 2D directo sobre canvas, sin modelos 3D — mucho más simple que el
// pipeline de la máscara. Todo el color/forma se genera en código, no se
// reproduce ningún asset con copyright de nadie.

import {
  FaceLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const ambient = document.getElementById('ambient');
const actx = ambient.getContext('2d');
const container = document.getElementById('container');
const hud = document.getElementById('hud');
const startBtn = document.getElementById('startBtn');
const switchBtn = document.getElementById('switchBtn');
const styleBtn = document.getElementById('styleBtn');
const styleLabel = document.getElementById('styleLabel');
const modeBtn = document.getElementById('modeBtn');
const modeLabel = document.getElementById('modeLabel');

// ---- Modos de cámara: filtros reales aplicados al <video> ----
const MODES = [
  { name: 'NORMAL', filter: 'none', grain: false, scan: false },
  {
    name: 'TÉRMICA',
    // Aproximación de falso color térmico vía cadena de filtros CSS:
    // pasamos a gris, "coloreamos" con sepia y giramos el matiz para
    // que las zonas claras salgan amarillo/blanco y las oscuras
    // rojo/violeta — no es una cámara térmica real, pero da el look.
    filter: 'grayscale(1) contrast(2) brightness(1.05) sepia(1) hue-rotate(-50deg) saturate(6)',
    grain: false, scan: true
  },
  {
    name: 'NOCTURNA',
    filter: 'grayscale(1) brightness(1.7) contrast(1.3) sepia(1) hue-rotate(70deg) saturate(3.5)',
    grain: true, scan: false
  }
];
let modeIndex = 0;
let MODE = MODES[modeIndex];

function applyMode() {
  MODE = MODES[modeIndex];
  video.style.filter = MODE.filter;
  modeLabel.textContent = `MODO: ${MODE.name}`;
}

// ---- Reactividad al movimiento: cuanto más te movés, más intenso todo ----
let prevMotionPoint = null;
let motionEnergy = 0; // suavizado 0..~3

function updateMotionEnergy(landmarks, w, h) {
  const nose = toPx(landmarks[1], w, h); // punta de la nariz, punto estable y sensible
  if (prevMotionPoint) {
    const d = Math.hypot(nose.x - prevMotionPoint.x, nose.y - prevMotionPoint.y);
    const normalized = Math.min(d / (w * 0.03), 3); // normalizado al ancho del cuadro
    motionEnergy = motionEnergy * 0.85 + normalized * 0.15;
  }
  prevMotionPoint = nose;
}

// ---- 6 estilos NeoProxy — cada uno cambia paleta y comportamiento ----
const STYLES = [
  {
    name: 'NEOPROXY CORE',
    particleColors: ['0,212,255', '102,68,170', '0,255,204'],
    ambient1: ['rgba(0,212,255,1)', 'rgba(102,68,170,0.6)', 'rgba(0,255,204,1)'],
    ambient2: ['rgba(0,255,204,0.35)', 'rgba(102,68,170,0.35)'],
    streak: ['20,180,255,1', '150,80,255,0.4'],
    glitch: ['rgba(0,212,255,0.35)', 'rgba(150,80,255,0.35)'],
    particleMul: 1, glitchMul: 1, phaseSpeed: 0.012, vignette: 0.7
  },
  {
    name: 'MAGENTA CHAOS',
    particleColors: ['255,20,210', '20,220,255', '210,40,255', '255,120,0'],
    ambient1: ['rgba(255,0,210,1)', 'rgba(120,0,180,0.6)', 'rgba(0,220,255,1)'],
    ambient2: ['rgba(255,140,0,0.35)', 'rgba(150,0,255,0.35)'],
    streak: ['20,150,255,1', '120,60,255,0.4'],
    glitch: ['rgba(255,0,180,0.35)', 'rgba(0,220,255,0.35)'],
    particleMul: 1, glitchMul: 1, phaseSpeed: 0.012, vignette: 0.75
  },
  {
    name: 'TOXIC MATRIX',
    particleColors: ['0,255,90', '150,255,180', '0,180,60'],
    ambient1: ['rgba(0,255,90,0.9)', 'rgba(0,40,10,0.6)', 'rgba(0,120,40,0.9)'],
    ambient2: ['rgba(0,255,120,0.25)', 'rgba(0,60,20,0.25)'],
    streak: ['0,255,100,1', '0,120,40,0.4'],
    glitch: ['rgba(0,255,90,0.4)', 'rgba(0,80,30,0.4)'],
    particleMul: 0.6, glitchMul: 1.8, phaseSpeed: 0.02, vignette: 0.85
  },
  {
    name: 'INFERNO',
    particleColors: ['255,90,0', '255,190,0', '255,30,30'],
    ambient1: ['rgba(255,60,0,1)', 'rgba(120,10,0,0.6)', 'rgba(255,190,0,1)'],
    ambient2: ['rgba(255,0,60,0.35)', 'rgba(255,140,0,0.35)'],
    streak: ['255,140,0,1', '255,30,30,0.4'],
    glitch: ['rgba(255,90,0,0.4)', 'rgba(255,190,0,0.4)'],
    particleMul: 1.3, glitchMul: 0.8, phaseSpeed: 0.015, vignette: 0.7
  },
  {
    name: 'VOID MONO',
    particleColors: ['255,255,255', '180,180,180', '90,90,90'],
    ambient1: ['rgba(255,255,255,0.5)', 'rgba(0,0,0,0.3)', 'rgba(200,200,200,0.5)'],
    ambient2: ['rgba(255,255,255,0.15)', 'rgba(0,0,0,0.15)'],
    streak: ['255,255,255,1', '120,120,120,0.4'],
    glitch: ['rgba(255,255,255,0.45)', 'rgba(0,0,0,0.45)'],
    particleMul: 0.4, glitchMul: 2.2, phaseSpeed: 0.008, vignette: 0.9
  },
  {
    name: 'RAINBOW GLITCH',
    rainbow: true,
    particleMul: 1.4, glitchMul: 2.5, phaseSpeed: 0.03, vignette: 0.65
  }
];
let styleIndex = 0;
let STYLE = STYLES[styleIndex];

function applyStyle() {
  STYLE = STYLES[styleIndex];
  styleLabel.textContent = `ESTILO: ${STYLE.name}`;
}

function hueColor(offsetDeg, alpha) {
  const hue = (ambientPhase * 60 + offsetDeg) % 360;
  return `hsla(${hue}, 100%, 55%, ${alpha})`;
}

let faceLandmarker;
let mpRunning = false;
let currentStream = null;
let currentFacing = 'user';
let availableFacings = ['user'];
let lastSeen = 0;
let lastFaceBox = null; // {x,y,w,h} en px del canvas — para spawnear partículas alrededor

// ---- Sistema de partículas (chispas — color según estilo activo) ----
const particles = [];

function spawnParticle(box) {
  if (!box) return;
  const edge = Math.floor(Math.random() * 4); // 0=arriba,1=der,2=abajo,3=izq
  let x, y;
  const pad = box.w * 0.15;
  if (edge === 0) { x = box.x + Math.random() * box.w; y = box.y - pad; }
  else if (edge === 1) { x = box.x + box.w + pad; y = box.y + Math.random() * box.h; }
  else if (edge === 2) { x = box.x + Math.random() * box.w; y = box.y + box.h + pad; }
  else { x = box.x - pad; y = box.y + Math.random() * box.h; }

  const color = STYLE.rainbow
    ? null
    : STYLE.particleColors[Math.floor(Math.random() * STYLE.particleColors.length)];

  particles.push({
    x, y,
    vx: (Math.random() - 0.5) * 0.6,
    vy: -0.4 - Math.random() * 0.8,
    r: 2.5 + Math.random() * 4,
    life: 1,
    decay: 0.008 + Math.random() * 0.012,
    color,
    hueOffset: Math.random() * 360
  });
}

function updateAndDrawParticles(ctx) {
  ctx.globalCompositeOperation = 'lighter';
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    ctx.fillStyle = p.color
      ? `rgba(${p.color}, ${p.life * 0.9})`
      : hueColor(p.hueOffset, p.life * 0.9);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

// ---- Glitch ocasional (destello de barras con corte RGB) ----
let nextGlitchAt = performance.now() + 800 + Math.random() * 1200;
let glitchUntil = 0;

function maybeTriggerGlitch(now, motionMul) {
  if (now > nextGlitchAt && glitchUntil < now) {
    glitchUntil = now + 120 + Math.random() * 160;
    const baseGap = 900 + Math.random() * 1800;
    nextGlitchAt = now + baseGap / (STYLE.glitchMul * (motionMul || 1));
  }
}

function drawGlitch(ctx, now, w, h) {
  if (now > glitchUntil) return;
  ctx.globalCompositeOperation = 'screen';
  const bars = 2 + Math.floor(Math.random() * 3);
  const [g1, g2] = STYLE.rainbow ? [hueColor(0, 0.4), hueColor(180, 0.4)] : STYLE.glitch;
  for (let i = 0; i < bars; i++) {
    const by = Math.random() * h;
    const bh = 4 + Math.random() * 18;
    const shift = (Math.random() - 0.5) * 30;
    ctx.fillStyle = g1;
    ctx.fillRect(shift, by, w, bh);
    ctx.fillStyle = g2;
    ctx.fillRect(-shift, by, w, bh);
  }
  ctx.globalCompositeOperation = 'source-over';
}

// ---- Ambiente: lavado de color animado + viñeta ----
let ambientPhase = 0;

function drawAmbient(ctx, w, h) {
  ambientPhase += STYLE.phaseSpeed;
  ctx.clearRect(0, 0, w, h);

  const angle = ambientPhase;
  const dx = Math.cos(angle) * w * 0.6;
  const dy = Math.sin(angle) * h * 0.6;
  const grad = ctx.createLinearGradient(w / 2 - dx, h / 2 - dy, w / 2 + dx, h / 2 + dy);
  if (STYLE.rainbow) {
    grad.addColorStop(0, hueColor(0, 1));
    grad.addColorStop(0.5, hueColor(120, 0.6));
    grad.addColorStop(1, hueColor(240, 1));
  } else {
    grad.addColorStop(0, STYLE.ambient1[0]);
    grad.addColorStop(0.5, STYLE.ambient1[1]);
    grad.addColorStop(1, STYLE.ambient1[2]);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Segundo pulso de color cruzado para más caos/movimiento
  const angle2 = -ambientPhase * 1.4;
  const grad2 = ctx.createLinearGradient(
    w / 2 - Math.cos(angle2) * w * 0.5, h / 2 - Math.sin(angle2) * h * 0.5,
    w / 2 + Math.cos(angle2) * w * 0.5, h / 2 + Math.sin(angle2) * h * 0.5
  );
  if (STYLE.rainbow) {
    grad2.addColorStop(0, hueColor(60, 0.35));
    grad2.addColorStop(1, hueColor(300, 0.35));
  } else {
    grad2.addColorStop(0, STYLE.ambient2[0]);
    grad2.addColorStop(1, STYLE.ambient2[1]);
  }
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, w, h);

  // Viñeta oscura en los bordes para más atmósfera
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, h * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, `rgba(0,0,0,${STYLE.vignette})`);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}


function fitStage() {
  if (!video.videoWidth || !video.videoHeight) return;
  container.style.width = video.videoWidth + 'px';
  container.style.height = video.videoHeight + 'px';
  const scale = Math.min(
    window.innerWidth / video.videoWidth,
    window.innerHeight / video.videoHeight
  );
  const mirror = currentFacing === 'user' ? -1 : 1;
  container.style.transform = `scaleX(${mirror}) scale(${scale})`;
}

// Índices de landmarks de MediaPipe Face Mesh que usamos.
const IDX = {
  rightEyeOuter: 33, rightEyeInner: 133, rightEyeUpper: 159, rightEyeLower: 145,
  leftEyeOuter: 263, leftEyeInner: 362, leftEyeUpper: 386, leftEyeLower: 374,
  rightBrow: [70, 63, 105, 66, 107],
  leftBrow: [336, 296, 334, 293, 300],
  rightIris: 468, leftIris: 473,
  foreheadTop: 10,
  templeRight: 127, templeLeft: 356,
  cheekRight: 234, cheekLeft: 454,
  chin: 152
};

function toPx(lm, w, h) {
  return { x: lm.x * w, y: lm.y * h };
}

function drawEyeMakeup(ctx, corner, inner, upper, lower, browPts, w, h, side) {
  // "side" es 1 para el ojo derecho (en pantalla) y -1 para el izquierdo,
  // así el ala del delineado apunta hacia afuera en cada lado.
  const c = toPx(corner, w, h);
  const inr = toPx(inner, w, h);
  const up = toPx(upper, w, h);
  const lo = toPx(lower, w, h);
  const brow = browPts.map((i) => toPx(i, w, h));
  const browMid = brow[Math.floor(brow.length / 2)];
  const browOuter = side === 1 ? brow[0] : brow[brow.length - 1];

  const eyeW = Math.hypot(inr.x - c.x, inr.y - c.y);

  // --- Sombra magenta/violeta siguiendo el contorno párpado→ceja ---
  ctx.globalCompositeOperation = 'lighter';
  ctx.beginPath();
  ctx.moveTo(inr.x, up.y);
  ctx.quadraticCurveTo((inr.x + c.x) / 2, up.y - eyeW * 0.15, c.x, c.y);
  ctx.lineTo(browOuter.x, browOuter.y);
  ctx.quadraticCurveTo(browMid.x, browMid.y - eyeW * 0.05, brow[0] === browOuter ? brow[brow.length - 1].x : brow[0].x, (brow[0] === browOuter ? brow[brow.length - 1] : brow[0]).y);
  ctx.lineTo(inr.x, up.y);
  ctx.closePath();
  const grad = ctx.createLinearGradient(inr.x, up.y, browMid.x, browMid.y);
  grad.addColorStop(0, 'rgba(255, 30, 210, 0.85)');
  grad.addColorStop(0.6, 'rgba(210, 20, 240, 0.65)');
  grad.addColorStop(1, 'rgba(110, 40, 255, 0.35)');
  ctx.fillStyle = grad;
  ctx.fill();

  // --- Delineado alado (winged eyeliner) — trazo afilado, no un gancho ---
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = '#0a0a0a';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const wingLen = eyeW * 0.75;
  const wingAngle = -0.55; // radianes hacia arriba-afuera
  const wingDx = Math.cos(wingAngle) * wingLen * side;
  const wingDy = Math.sin(wingAngle) * wingLen;
  const wingTip = { x: c.x + wingDx, y: c.y + wingDy };

  // Línea base pegada a la línea de pestañas, de adentro hacia afuera
  ctx.lineWidth = Math.max(2.2, eyeW * 0.09);
  ctx.beginPath();
  ctx.moveTo(inr.x, up.y);
  ctx.quadraticCurveTo(up.x, up.y - eyeW * 0.06, c.x, c.y);
  ctx.stroke();

  // El ala: trazo grueso que se afina hacia la punta (dos capas de grosor)
  ctx.lineWidth = Math.max(2.5, eyeW * 0.11);
  ctx.beginPath();
  ctx.moveTo(c.x, c.y);
  ctx.lineTo(wingTip.x, wingTip.y);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, eyeW * 0.04);
  ctx.beginPath();
  ctx.moveTo(c.x, c.y - eyeW * 0.08);
  ctx.lineTo(wingTip.x, wingTip.y);
  ctx.stroke();

  // Marquita fina bajo el ojo (línea de "war paint", sutil)
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'rgba(20, 10, 30, 0.55)';
  ctx.lineWidth = Math.max(1, eyeW * 0.035);
  ctx.beginPath();
  ctx.moveTo(inr.x, lo.y + eyeW * 0.1);
  ctx.quadraticCurveTo((inr.x + c.x) / 2, lo.y + eyeW * 0.22, c.x, lo.y + eyeW * 0.12);
  ctx.stroke();
}

function drawHairStreaks(ctx, forehead, templeR, templeL, w, h, motionMul) {
  const mul = motionMul || 1;
  const f = toPx(forehead, w, h);
  const tr = toPx(templeR, w, h);
  const tl = toPx(templeL, w, h);
  const faceWidth = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const streakLen = faceWidth * 1.1 * (0.85 + mul * 0.25);

  ctx.globalCompositeOperation = 'source-over';
  ctx.lineCap = 'round';

  // Mechones que salen de cada sien hacia arriba y afuera (nunca cruzan
  // hacia el otro lado de la cara) — enmarcan en vez de tachar la frente.
  // El grosor crece un poco con el movimiento, para que se sientan "vivos".
  const streaksPerSide = [
    { along: -0.05, out: 0.35, width: 7 * (0.8 + mul * 0.2), len: 1.0 },
    { along: 0.12, out: 0.55, width: 5 * (0.8 + mul * 0.2), len: 0.85 },
    { along: 0.28, out: 0.25, width: 4 * (0.8 + mul * 0.2), len: 0.7 }
  ];

  [
    { origin: tl, dir: -1 },
    { origin: tr, dir: 1 }
  ].forEach(({ origin, dir }) => {
    streaksPerSide.forEach((s) => {
      const sx = origin.x + dir * faceWidth * 0.02;
      const sy = origin.y - faceWidth * (0.05 + s.along * 0.15);
      const ex = sx + dir * faceWidth * s.out;
      const ey = sy - streakLen * s.len;
      const midx = sx + dir * faceWidth * s.out * 0.3;
      const midy = sy - streakLen * s.len * 0.5;

      const grad = ctx.createLinearGradient(sx, sy, ex, ey);
      if (STYLE.rainbow) {
        grad.addColorStop(0, hueColor(90, 1));
        grad.addColorStop(1, hueColor(270, 0.4));
      } else {
        grad.addColorStop(0, `rgba(${STYLE.streak[0]})`);
        grad.addColorStop(1, `rgba(${STYLE.streak[1]})`);
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(midx, midy, ex, ey);
      ctx.stroke();
    });
  });
}

function drawNightGrain(ctx, w, h) {
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, 0, w, h);
  // Ruido: puntitos random, baratos (no por pixel, por performance)
  ctx.fillStyle = 'rgba(150,255,180,0.5)';
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  // Scanlines horizontales sutiles
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  for (let y = 0; y < h; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}

let scanY = 0;
function drawThermalScan(ctx, w, h) {
  scanY = (scanY + 3) % h;
  ctx.globalCompositeOperation = 'screen';
  const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
  grad.addColorStop(0, 'rgba(255,220,120,0)');
  grad.addColorStop(0.5, 'rgba(255,220,120,0.25)');
  grad.addColorStop(1, 'rgba(255,220,120,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, scanY - 30, w, 60);
  ctx.globalCompositeOperation = 'source-over';
}

function drawFrame(landmarks, w, h) {
  const now = performance.now();
  ctx.clearRect(0, 0, w, h);

  updateMotionEnergy(landmarks, w, h);
  // El movimiento multiplica todo: quieto ≈ factor 1, moviéndote fuerte
  // puede llegar a factor ~4 — más partículas, más glitch, mechones más largos.
  const motionMul = 1 + motionEnergy * 1.2;

  // Bounding box aproximado de la cara (sienes + frente + mentón) para
  // saber dónde spawnear las partículas alrededor de la cabeza.
  const f = toPx(landmarks[IDX.foreheadTop], w, h);
  const chin = toPx(landmarks[IDX.chin], w, h);
  const tr = toPx(landmarks[IDX.templeRight], w, h);
  const tl = toPx(landmarks[IDX.templeLeft], w, h);
  const minX = Math.min(tr.x, tl.x), maxX = Math.max(tr.x, tl.x);
  lastFaceBox = { x: minX, y: f.y - (chin.y - f.y) * 0.3, w: maxX - minX, h: chin.y - f.y };

  drawAmbient(actx, ambient.width, ambient.height);

  drawHairStreaks(ctx, landmarks[IDX.foreheadTop], landmarks[IDX.templeRight], landmarks[IDX.templeLeft], w, h, motionMul);

  maybeTriggerGlitch(now, motionMul);
  const pRate = STYLE.particleMul * motionMul;
  if (Math.random() < 0.9 * pRate) spawnParticle(lastFaceBox);
  if (Math.random() < 0.9 * pRate) spawnParticle(lastFaceBox);
  if (Math.random() < 0.5 * pRate) spawnParticle(lastFaceBox);
  if (motionMul > 2 && Math.random() < 0.6) spawnParticle(lastFaceBox); // ráfaga extra si te movés fuerte
  updateAndDrawParticles(ctx);
  drawGlitch(ctx, now, w, h);

  if (MODE.grain) drawNightGrain(actx, ambient.width, ambient.height);
  if (MODE.scan) drawThermalScan(actx, ambient.width, ambient.height);

  ctx.globalCompositeOperation = 'source-over';
}

async function initFaceLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  );
  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU'
    },
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
    runningMode: 'VIDEO',
    numFaces: 1
  });
}

function detectLoop() {
  if (!mpRunning) return;
  if (faceLandmarker && video.readyState >= 2) {
    const result = faceLandmarker.detectForVideo(video, performance.now());
    if (result.faceLandmarks && result.faceLandmarks.length > 0) {
      lastSeen = Date.now();
      hud.textContent = 'ROSTRO DETECTADO';
      drawFrame(result.faceLandmarks[0], canvas.width, canvas.height);
    } else if (Date.now() - lastSeen > 400) {
      hud.textContent = 'BUSCANDO ROSTRO...';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawAmbient(actx, ambient.width, ambient.height);
      updateAndDrawParticles(ctx);
      drawGlitch(ctx, performance.now(), canvas.width, canvas.height);
    }
  }
  requestAnimationFrame(detectLoop);
}

async function detectAvailableFacings() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === 'videoinput');
    availableFacings = cams.length > 1 ? ['user', 'environment'] : ['user'];
  } catch (e) {
    availableFacings = ['user'];
  }
  switchBtn.style.display = availableFacings.length > 1 ? 'flex' : 'none';
}

async function setCameraStream(facingMode) {
  if (currentStream) currentStream.getTracks().forEach((t) => t.stop());
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: facingMode }, width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false
  });
  currentStream = stream;
  currentFacing = facingMode;
  video.srcObject = stream;
  await new Promise((resolve) => {
    video.onloadedmetadata = () => { video.play(); resolve(); };
  });
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ambient.width = video.videoWidth;
  ambient.height = video.videoHeight;
  fitStage();
}

async function startAR() {
  startBtn.style.display = 'none';
  hud.textContent = 'SOLICITANDO CÁMARA...';
  await setCameraStream(currentFacing);
  await detectAvailableFacings();

  hud.textContent = 'CARGANDO MODELO FACIAL...';
  if (!faceLandmarker) await initFaceLandmarker();

  mpRunning = true;
  hud.textContent = 'BUSCANDO ROSTRO...';
  detectLoop();
}

async function switchCamera() {
  if (availableFacings.length < 2) return;
  const next = currentFacing === 'user' ? 'environment' : 'user';
  try {
    await setCameraStream(next);
  } catch (e) {
    hud.textContent = 'ERROR AL CAMBIAR DE CÁMARA: ' + e.message;
  }
}

startBtn.addEventListener('click', () => {
  startAR().catch((err) => {
    hud.textContent = 'ERROR: ' + err.message;
    startBtn.style.display = 'block';
    console.error(err);
  });
});

switchBtn.addEventListener('click', () => switchCamera());

styleBtn.addEventListener('click', () => {
  styleIndex = (styleIndex + 1) % STYLES.length;
  applyStyle();
});

modeBtn.addEventListener('click', () => {
  modeIndex = (modeIndex + 1) % MODES.length;
  applyMode();
});

applyStyle();
applyMode();

window.addEventListener('resize', () => fitStage());
