// Carga perezosa de los 3 modelos de MediaPipe que usa NeoCam: cara (para
// ubicar la cabeza — "postura" en el spec original), segmentación de persona
// (silueta, base de la mayoría de los modos) y manos (para el minijuego).
// Mismo patrón que ya usa /realidad-aumentada/mascara (modelos públicos de
// Google en CDN, delegate GPU, carga diferida on-demand).

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'

let filesetPromise: Promise<any> | null = null
function getFileset() {
  if (!filesetPromise) {
    filesetPromise = import('@mediapipe/tasks-vision').then(vision =>
      vision.FilesetResolver.forVisionTasks(WASM_URL).then(fs => ({ vision, fs }))
    )
  }
  return filesetPromise
}

export async function createFaceLandmarker() {
  const { vision, fs } = await getFileset()
  return vision.FaceLandmarker.createFromOptions(fs, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU',
    },
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
    runningMode: 'VIDEO',
    numFaces: 1,
  })
}

export async function createSegmenter() {
  const { vision, fs } = await getFileset()
  return vision.ImageSegmenter.createFromOptions(fs, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    outputCategoryMask: false,
    outputConfidenceMasks: true,
  })
}

export async function createHandLandmarker() {
  const { vision, fs } = await getFileset()
  return vision.HandLandmarker.createFromOptions(fs, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
  })
}

export type FaceBox = { x: number; y: number; w: number; h: number; cx: number; cy: number }

// Mismo set de landmarks que ya usa el filtro "modo clásico" (frente, mentón,
// sienes) para armar una caja aproximada de la cabeza.
const FACE_IDX = { forehead: 10, chin: 152, templeR: 127, templeL: 356 }

export function faceBoxFromLandmarks(landmarks: { x: number; y: number }[] | undefined, w: number, h: number): FaceBox | null {
  if (!landmarks || landmarks.length === 0) return null
  const f = landmarks[FACE_IDX.forehead]
  const chin = landmarks[FACE_IDX.chin]
  const tr = landmarks[FACE_IDX.templeR]
  const tl = landmarks[FACE_IDX.templeL]
  if (!f || !chin || !tr || !tl) return null
  const minX = Math.min(tr.x, tl.x) * w
  const maxX = Math.max(tr.x, tl.x) * w
  const topY = f.y * h - (chin.y - f.y) * h * 0.35
  const botY = chin.y * h
  return { x: minX, y: topY, w: maxX - minX, h: Math.max(1, botY - topY), cx: (minX + maxX) / 2, cy: (topY + botY) / 2 }
}

export type HandPoint = { x: number; y: number } // en px de canvas, punta del índice

export function fingertipsFromHands(handLandmarks: { x: number; y: number }[][] | undefined, w: number, h: number): HandPoint[] {
  if (!handLandmarks) return []
  return handLandmarks.map(lm => ({ x: lm[8].x * w, y: lm[8].y * h }))
}
