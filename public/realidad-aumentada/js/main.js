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

let faceLandmarker;
let mpRunning = false;
let currentStream = null;
let currentFacing = 'user';
let availableFacings = ['user'];
let lastSeen = 0;
let lastFaceBox = null; // {x,y,w,h} en px del canvas — para spawnear partículas alrededor

// ---- Sistema de partículas (chispas magenta/cian) ----
const particles = [];
const PARTICLE_COLORS = ['255,20,210', '20,220,255', '210,40,255', '255,120,0'];

function spawnParticle(box) {
  if (!box) return;
  const edge = Math.floor(Math.random() * 4); // 0=arriba,1=der,2=abajo,3=izq
  let x, y;
  const pad = box.w * 0.15;
  if (edge === 0) { x = box.x + Math.random() * box.w; y = box.y - pad; }
  else if (edge === 1) { x = box.x + box.w + pad; y = box.y + Math.random() * box.h; }
  else if (edge === 2) { x = box.x + Math.random() * box.w; y = box.y + box.h + pad; }
  else { x = box.x - pad; y = box.y + Math.random() * box.h; }

  particles.push({
    x, y,
    vx: (Math.random() - 0.5) * 0.6,
    vy: -0.4 - Math.random() * 0.8,
    r: 2.5 + Math.random() * 4,
    life: 1,
    decay: 0.008 + Math.random() * 0.012,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
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
    ctx.fillStyle = `rgba(${p.color}, ${p.life * 0.9})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

// ---- Glitch ocasional (destello de barras con corte RGB) ----
let nextGlitchAt = performance.now() + 800 + Math.random() * 1200;
let glitchUntil = 0;

function maybeTriggerGlitch(now) {
  if (now > nextGlitchAt && glitchUntil < now) {
    glitchUntil = now + 120 + Math.random() * 160;
    nextGlitchAt = now + 900 + Math.random() * 1800;
  }
}

function drawGlitch(ctx, now, w, h) {
  if (now > glitchUntil) return;
  ctx.globalCompositeOperation = 'screen';
  const bars = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < bars; i++) {
    const by = Math.random() * h;
    const bh = 4 + Math.random() * 18;
    const shift = (Math.random() - 0.5) * 30;
    ctx.fillStyle = 'rgba(255, 0, 180, 0.35)';
    ctx.fillRect(shift, by, w, bh);
    ctx.fillStyle = 'rgba(0, 220, 255, 0.35)';
    ctx.fillRect(-shift, by, w, bh);
  }
  ctx.globalCompositeOperation = 'source-over';
}

// ---- Ambiente: lavado de color animado + viñeta ----
let ambientPhase = 0;

function drawAmbient(ctx, w, h) {
  ambientPhase += 0.012;
  ctx.clearRect(0, 0, w, h);

  const angle = ambientPhase;
  const dx = Math.cos(angle) * w * 0.6;
  const dy = Math.sin(angle) * h * 0.6;
  const grad = ctx.createLinearGradient(w / 2 - dx, h / 2 - dy, w / 2 + dx, h / 2 + dy);
  grad.addColorStop(0, 'rgba(255, 0, 210, 1)');
  grad.addColorStop(0.5, 'rgba(120, 0, 180, 0.6)');
  grad.addColorStop(1, 'rgba(0, 220, 255, 1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Segundo pulso de color cruzado para más caos/movimiento
  const angle2 = -ambientPhase * 1.4;
  const grad2 = ctx.createLinearGradient(
    w / 2 - Math.cos(angle2) * w * 0.5, h / 2 - Math.sin(angle2) * h * 0.5,
    w / 2 + Math.cos(angle2) * w * 0.5, h / 2 + Math.sin(angle2) * h * 0.5
  );
  grad2.addColorStop(0, 'rgba(255, 140, 0, 0.35)');
  grad2.addColorStop(1, 'rgba(150, 0, 255, 0.35)');
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, w, h);

  // Viñeta oscura en los bordes para más atmósfera
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, h * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.75)');
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

function drawHairStreaks(ctx, forehead, templeR, templeL, w, h) {
  const f = toPx(forehead, w, h);
  const tr = toPx(templeR, w, h);
  const tl = toPx(templeL, w, h);
  const faceWidth = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const streakLen = faceWidth * 1.1;

  ctx.globalCompositeOperation = 'source-over';
  ctx.lineCap = 'round';

  // Mechones que salen de cada sien hacia arriba y afuera (nunca cruzan
  // hacia el otro lado de la cara) — enmarcan en vez de tachar la frente.
  const streaksPerSide = [
    { along: -0.05, out: 0.35, width: 7, len: 1.0 },
    { along: 0.12, out: 0.55, width: 5, len: 0.85 },
    { along: 0.28, out: 0.25, width: 4, len: 0.7 }
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
      grad.addColorStop(0, 'rgba(20, 150, 255, 1)');
      grad.addColorStop(1, 'rgba(120, 60, 255, 0.4)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(midx, midy, ex, ey);
      ctx.stroke();
    });
  });
}

function drawFrame(landmarks, w, h) {
  const now = performance.now();
  ctx.clearRect(0, 0, w, h);

  // Bounding box aproximado de la cara (sienes + frente + mentón) para
  // saber dónde spawnear las partículas alrededor de la cabeza.
  const f = toPx(landmarks[IDX.foreheadTop], w, h);
  const chin = toPx(landmarks[IDX.chin], w, h);
  const tr = toPx(landmarks[IDX.templeRight], w, h);
  const tl = toPx(landmarks[IDX.templeLeft], w, h);
  const minX = Math.min(tr.x, tl.x), maxX = Math.max(tr.x, tl.x);
  lastFaceBox = { x: minX, y: f.y - (chin.y - f.y) * 0.3, w: maxX - minX, h: chin.y - f.y };

  drawAmbient(actx, ambient.width, ambient.height);

  drawHairStreaks(ctx, landmarks[IDX.foreheadTop], landmarks[IDX.templeRight], landmarks[IDX.templeLeft], w, h);

  maybeTriggerGlitch(now);
  if (Math.random() < 0.9) spawnParticle(lastFaceBox);
  if (Math.random() < 0.9) spawnParticle(lastFaceBox);
  if (Math.random() < 0.5) spawnParticle(lastFaceBox);
  updateAndDrawParticles(ctx);
  drawGlitch(ctx, now, w, h);

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

window.addEventListener('resize', () => fitStage());
