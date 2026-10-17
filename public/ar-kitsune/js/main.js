// ===== AR Kitsune Mask 3D — Babylon.js + MediaPipe Tasks FaceLandmarker =====
// La máscara es un mesh 3D real (GLB), no un sticker 2D: sigue la pose
// completa de la cabeza (yaw/pitch/roll + traslación) frame a frame.

import {
  FaceLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

const video = document.getElementById('video');
const canvas = document.getElementById('renderCanvas');
const container = document.getElementById('container');
const hud = document.getElementById('hud');
const startBtn = document.getElementById('startBtn');
const switchBtn = document.getElementById('switchBtn');
const calibToggle = document.getElementById('calibToggle');
const calibPanel = document.getElementById('calibPanel');

// ---- Calibración (ajustable en vivo desde el panel ⚙) ----
// MODEL_SCALE es una estimación inicial: la matriz de pose de MediaPipe
// está en la escala "métrica" de su modelo facial canónico (cara real
// ~0.15 unidades de ancho). El GLB tiene su propia escala arbitraria de
// exportación, así que hay que reescalarlo para que ambos calcen. Se
// arrancó con 0.2 como estimación razonable — usá el slider para afinar.
let CALIB = {
  scale: 0.226,
  offsetX: 0,
  offsetY: -0.022,
  offsetZ: 0,
  invYaw: true,
  invPitch: true,
  invRoll: false
};

let engine, scene, camera, maskRoot;
let faceLandmarker;
let mpRunning = false;
let currentStream = null;
let currentFacing = 'user';
let availableFacings = ['user'];
let lastSeen = 0;

function initBabylon() {
  engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    alpha: true,
    premultipliedAlpha: false
  });
  scene = new BABYLON.Scene(engine);
  scene.useRightHandedSystem = true; // coincide con la convención de MediaPipe
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

  // Cámara virtual calibrada al mismo FOV que usa el pipeline de
  // geometría facial de MediaPipe (63° vertical), parada en el origen
  // mirando hacia -Z — el "ojo" de la cámara real.
  camera = new BABYLON.FreeCamera('cam', BABYLON.Vector3.Zero(), scene);
  camera.setTarget(new BABYLON.Vector3(0, 0, -1));
  camera.fovMode = BABYLON.Camera.FOVMODE_VERTICAL_FIXED;
  camera.fov = BABYLON.Tools.ToRadians(63);
  camera.minZ = 0.01;
  camera.maxZ = 1000;

  const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0.3), scene);
  light.intensity = 1.1;
  const light2 = new BABYLON.DirectionalLight('light2', new BABYLON.Vector3(0.3, -0.4, 1), scene);
  light2.intensity = 0.5;

  maskRoot = new BABYLON.TransformNode('maskRoot', scene);
  maskRoot.setEnabled(false);

  BABYLON.SceneLoader.ImportMeshAsync('', '/', 'mask3d.glb', scene).then((result) => {
    result.meshes.forEach((m) => {
      if (!m.parent) m.parent = maskRoot;
      // Aseguramos doble cara por las dudas — si el modelo aparece "al
      // revés" (mostrando el interior), al menos no se va a ver negro
      // por back-face culling; el problema de orientación real se
      // corrige con los checkboxes de espejo en el panel ⚙.
      if (m.material) m.material.backFaceCulling = false;
    });
    hud.textContent = 'MODELO 3D CARGADO — TOCÁ "ACTIVAR CÁMARA"';
  }).catch((err) => {
    hud.textContent = 'ERROR CARGANDO GLB: ' + err.message;
    console.error(err);
  });

  engine.runRenderLoop(() => scene.render());
  window.addEventListener('resize', () => {
    fitStage();
    engine.resize();
  });
}

function fitStage() {
  if (!video.videoWidth || !video.videoHeight) return;
  container.style.width = video.videoWidth + 'px';
  container.style.height = video.videoHeight + 'px';

  const scale = Math.min(
    window.innerWidth / video.videoWidth,
    window.innerHeight / video.videoHeight
  );
  // El contenedor solo escala para encajar en pantalla — SIN espejar.
  // El espejo del efecto selfie se aplica nada más al <video> (abajo),
  // y la matemática de la máscara ya lo compensa en applyFacialMatrix.
  container.style.transform = `scale(${scale})`;
  video.style.transform = currentFacing === 'user' ? 'scaleX(-1)' : 'none';
}

// Convierte la matriz 4x4 (16 floats, row-major) que entrega MediaPipe en
// una Matrix de Babylon (column-major) y la aplica al TransformNode.
const debugEl = document.getElementById('debugLine');

function applyFacialMatrix(matrixData) {
  // OJO: transpose() en NUEVA matriz, nunca transposeToRef(m) sobre sí
  // misma — eso corrompe los datos (se pisan a mitad de la conversión)
  // y era la causa de que la máscara nunca apareciera.
  const raw = BABYLON.Matrix.FromArray(matrixData);
  const m = raw.transpose();

  const scaling = new BABYLON.Vector3();
  const rotation = new BABYLON.Quaternion();
  const translation = new BABYLON.Vector3();
  m.decompose(scaling, rotation, translation);

  if (!isFinite(translation.x) || !isFinite(translation.y) || !isFinite(translation.z)) {
    if (debugEl) debugEl.textContent = 'matriz inválida este frame (descartado)';
    return;
  }

  // Mantenemos el espejo de posición (X) — eso sí es sólido y esperable.
  if (currentFacing === 'user') {
    translation.x = -translation.x;
  }

  // El sentido del giro (qué eje corresponde a "izq/der", "arriba/abajo",
  // "inclinación") depende de una convención de MediaPipe que no logré
  // confirmar en teoría sin poder probar en vivo. En vez de seguir
  // adivinando, cada eje es un toggle INDEPENDIENTE — probá de a uno.
  if (CALIB.invYaw) rotation.y = -rotation.y;
  if (CALIB.invPitch) rotation.x = -rotation.x;
  if (CALIB.invRoll) rotation.z = -rotation.z;

  maskRoot.rotationQuaternion = rotation;

  // El offset de calibración tiene que moverse SOLIDARIO con la cabeza
  // (como si fuera parte rígida de la máscara), no quedar fijo en el
  // espacio de la cámara — si no, al girar o mover la cabeza a los
  // costados el ajuste fino se desalinea de los ojos. Por eso rotamos
  // el offset por la misma rotación de la cabeza antes de sumarlo.
  const localOffset = new BABYLON.Vector3(CALIB.offsetX, CALIB.offsetY, CALIB.offsetZ);
  const rotMatrix = new BABYLON.Matrix();
  BABYLON.Matrix.FromQuaternionToRef(rotation, rotMatrix);
  const rotatedOffset = BABYLON.Vector3.TransformNormal(localOffset, rotMatrix);

  maskRoot.position.set(
    translation.x + rotatedOffset.x,
    translation.y + rotatedOffset.y,
    translation.z + rotatedOffset.z
  );
  maskRoot.scaling.set(CALIB.scale, CALIB.scale, CALIB.scale);
  maskRoot.setEnabled(true);

  if (debugEl) {
    debugEl.textContent =
      `pos: ${maskRoot.position.x.toFixed(3)}, ${maskRoot.position.y.toFixed(3)}, ${maskRoot.position.z.toFixed(3)}  ` +
      `escala: ${CALIB.scale.toFixed(3)}`;
  }
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
    outputFacialTransformationMatrixes: true,
    runningMode: 'VIDEO',
    numFaces: 1
  });
}

function detectLoop() {
  if (!mpRunning) return;
  if (faceLandmarker && video.readyState >= 2) {
    const result = faceLandmarker.detectForVideo(video, performance.now());
    if (result.facialTransformationMatrixes && result.facialTransformationMatrixes.length > 0) {
      lastSeen = Date.now();
      hud.textContent = 'ROSTRO DETECTADO — TRACKING 3D ACTIVO';
      applyFacialMatrix(result.facialTransformationMatrixes[0].data);
    } else if (Date.now() - lastSeen > 400) {
      maskRoot.setEnabled(false);
      hud.textContent = 'BUSCANDO ROSTRO...';
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
  if (currentStream) {
    currentStream.getTracks().forEach((t) => t.stop());
  }
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
  fitStage();
  engine.resize();
}

async function startAR() {
  startBtn.style.display = 'none';
  hud.textContent = 'SOLICITANDO CÁMARA...';
  await setCameraStream(currentFacing);
  await detectAvailableFacings();

  hud.textContent = 'CARGANDO MODELO FACIAL (MediaPipe)...';
  if (!faceLandmarker) await initFaceLandmarker();

  mpRunning = true;
  hud.textContent = 'BUSCANDO ROSTRO...';
  detectLoop();
}

async function switchCamera() {
  if (availableFacings.length < 2) return;
  switchBtn.disabled = true;
  hud.textContent = 'CAMBIANDO DE CÁMARA...';
  maskRoot.setEnabled(false);
  const next = currentFacing === 'user' ? 'environment' : 'user';
  try {
    await setCameraStream(next);
  } catch (e) {
    hud.textContent = 'ERROR AL CAMBIAR DE CÁMARA: ' + e.message;
    try { await setCameraStream(currentFacing === 'user' ? 'environment' : 'user'); } catch (_) {}
  }
  switchBtn.disabled = false;
}

// ---- UI de calibración ----
function bindSlider(id, valId, key, decimals) {
  const el = document.getElementById(id);
  const valEl = document.getElementById(valId);
  el.value = CALIB[key];
  valEl.textContent = Number(CALIB[key]).toFixed(decimals);
  el.addEventListener('input', () => {
    CALIB[key] = parseFloat(el.value);
    valEl.textContent = CALIB[key].toFixed(decimals);
  });
}

calibToggle.addEventListener('click', () => {
  calibPanel.style.display = calibPanel.style.display === 'block' ? 'none' : 'block';
});

document.getElementById('cInvYaw').addEventListener('change', (e) => {
  CALIB.invYaw = e.target.checked;
});
document.getElementById('cInvPitch').addEventListener('change', (e) => {
  CALIB.invPitch = e.target.checked;
});
document.getElementById('cInvRoll').addEventListener('change', (e) => {
  CALIB.invRoll = e.target.checked;
});

document.getElementById('resetCalib').addEventListener('click', () => {
  CALIB = { scale: 0.226, offsetX: 0, offsetY: -0.022, offsetZ: 0, invYaw: true, invPitch: true, invRoll: false };
  bindSlider('sScale', 'vScale', 'scale', 3);
  bindSlider('sOffX', 'vOffX', 'offsetX', 3);
  bindSlider('sOffY', 'vOffY', 'offsetY', 3);
  bindSlider('sOffZ', 'vOffZ', 'offsetZ', 3);
  document.getElementById('cInvYaw').checked = true;
  document.getElementById('cInvPitch').checked = true;
  document.getElementById('cInvRoll').checked = false;
});

bindSlider('sScale', 'vScale', 'scale', 3);
bindSlider('sOffX', 'vOffX', 'offsetX', 3);
bindSlider('sOffY', 'vOffY', 'offsetY', 3);
bindSlider('sOffZ', 'vOffZ', 'offsetZ', 3);

startBtn.addEventListener('click', () => {
  startAR().catch((err) => {
    hud.textContent = 'ERROR: ' + err.message;
    startBtn.style.display = 'block';
    console.error(err);
  });
});

switchBtn.addEventListener('click', () => switchCamera());

initBabylon();
hud.textContent = 'CARGANDO MODELO 3D...';
