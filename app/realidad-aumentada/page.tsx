'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import * as BABYLON from '@babylonjs/core'
import { GLTFFileLoader } from '@babylonjs/loaders/glTF'

const mono = "'Space Mono', monospace"

// --- Parametros ajustables del tracking (ver nota mas abajo) ------------
// MediaPipe entrega una matriz 4x4 column-major (convencion WebGL/three.js)
// con la pose de la cara relativa a una camara virtual. Estos valores son
// el punto de partida razonable; probablemente necesiten un ajuste fino
// una vez probado en un dispositivo real con camara (este sandbox no tiene
// camara, asi que esto no se pudo verificar visualmente).
const MASK_CAMERA_FOV_DEG = 63
const MASK_SCALE_MULT = 1.0
const MASK_OFFSET_Y = 0
const MASK_OFFSET_Z = 0
const FLIP_Y_ROTATION = false
const FLIP_Z_POSITION = false
// -------------------------------------------------------------------------

const MASK_MODEL_PATH = '/models/kitsune.glb'

type Status = 'idle' | 'loading-model' | 'requesting-camera' | 'tracking' | 'no-face' | 'error'

type DecomposedTransform = {
  position: BABYLON.Vector3
  quaternion: BABYLON.Quaternion
  scaling: BABYLON.Vector3
}

// Descompone una matriz 4x4 column-major (formato MediaPipe/WebGL) en
// posicion + rotacion (quaternion) + escala, sin depender de que el layout
// interno de BABYLON.Matrix coincida byte a byte con el de MediaPipe.
function decomposeMediaPipeMatrix(data: Float32Array | number[]): DecomposedTransform {
  const d = data
  // columnas 0,1,2 = ejes rotados+escalados; columna 3 = traslacion
  const c0 = [d[0], d[1], d[2]]
  const c1 = [d[4], d[5], d[6]]
  const c2 = [d[8], d[9], d[10]]

  const len = (v: number[]) => Math.hypot(v[0], v[1], v[2]) || 1
  const sx = len(c0)
  const sy = len(c1)
  const sz = len(c2)

  const m00 = c0[0] / sx, m10 = c0[1] / sx, m20 = c0[2] / sx
  const m01 = c1[0] / sy, m11 = c1[1] / sy, m21 = c1[2] / sy
  const m02 = c2[0] / sz, m12 = c2[1] / sz, m22 = c2[2] / sz

  // matriz de rotacion pura -> quaternion (metodo estandar por traza)
  const trace = m00 + m11 + m22
  let qw: number, qx: number, qy: number, qz: number
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1.0)
    qw = 0.25 / s
    qx = (m21 - m12) * s
    qy = (m02 - m20) * s
    qz = (m10 - m01) * s
  } else if (m00 > m11 && m00 > m22) {
    const s = 2.0 * Math.sqrt(1.0 + m00 - m11 - m22)
    qw = (m21 - m12) / s
    qx = 0.25 * s
    qy = (m01 + m10) / s
    qz = (m02 + m20) / s
  } else if (m11 > m22) {
    const s = 2.0 * Math.sqrt(1.0 + m11 - m00 - m22)
    qw = (m02 - m20) / s
    qx = (m01 + m10) / s
    qy = 0.25 * s
    qz = (m12 + m21) / s
  } else {
    const s = 2.0 * Math.sqrt(1.0 + m22 - m00 - m11)
    qw = (m10 - m01) / s
    qx = (m02 + m20) / s
    qy = (m12 + m21) / s
    qz = 0.25 * s
  }

  let py = d[13]
  let pz = d[14]
  if (FLIP_Y_ROTATION) qy = -qy
  if (FLIP_Z_POSITION) pz = -pz

  return {
    position: new BABYLON.Vector3(d[12], py + MASK_OFFSET_Y, pz + MASK_OFFSET_Z),
    quaternion: new BABYLON.Quaternion(qx, qy, qz, qw),
    scaling: new BABYLON.Vector3(sx * MASK_SCALE_MULT, sy * MASK_SCALE_MULT, sz * MASK_SCALE_MULT),
  }
}

export default function RealidadAumentadaPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const engineRef = useRef<BABYLON.Engine | null>(null)
  const maskMeshRef = useRef<BABYLON.AbstractMesh | null>(null)
  const faceLandmarkerRef = useRef<any>(null)

  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  const [maskStatus, setMaskStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [maskError, setMaskError] = useState('')

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      engineRef.current?.dispose()
      faceLandmarkerRef.current?.close?.()
    }
  }, [])

  const start = async () => {
    setErrorMessage('')
    try {
      setStatus('loading-model')

      if (!faceLandmarkerRef.current) {
        const vision = await import('@mediapipe/tasks-vision')
        const filesetResolver = await vision.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        )
        faceLandmarkerRef.current = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: true,
          runningMode: 'VIDEO',
          numFaces: 1,
        })
      }

      setStatus('requesting-camera')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()

      await initBabylon(video)
      setStatus('tracking')
    } catch (err: any) {
      console.error('Error iniciando RA:', err)
      setErrorMessage(err?.message || 'No se pudo iniciar la camara o el tracking.')
      setStatus('error')
    }
  }

  const initBabylon = async (video: HTMLVideoElement) => {
    const canvas = canvasRef.current!
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const engine = new BABYLON.Engine(canvas, true, { alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true })
    engineRef.current = engine
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0)
    scene.useRightHandedSystem = true

    const camera = new BABYLON.FreeCamera('cam', BABYLON.Vector3.Zero(), scene)
    camera.fov = (MASK_CAMERA_FOV_DEG * Math.PI) / 180
    camera.minZ = 0.01
    camera.maxZ = 100

    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0.3), scene)
    light.intensity = 0.9

    setMaskStatus('loading')
    try {
      GLTFFileLoader.IncrementalLoading = false
      BABYLON.SceneLoader.RegisterPlugin(new GLTFFileLoader())

      const pathParts = MASK_MODEL_PATH.split('/')
      const filename = pathParts[pathParts.length - 1]
      const rootUrl = pathParts.slice(0, -1).join('/') + '/'

      const result = await BABYLON.SceneLoader.ImportMeshAsync('', rootUrl, filename, scene)
      if (result.meshes.length === 0) throw new Error('El archivo cargo pero no tiene mallas (0 meshes)')

      const root = result.meshes[0]
      root.rotationQuaternion = BABYLON.Quaternion.Identity()
      maskMeshRef.current = root
      root.setEnabled(false)
      setMaskStatus('loaded')
    } catch (err: any) {
      console.error('No se pudo cargar la mascara:', MASK_MODEL_PATH, err)
      setMaskStatus('error')
      setMaskError(err?.message || String(err))
    }

    scene.onBeforeRenderObservable.add(() => {
      const faceLandmarker = faceLandmarkerRef.current
      const mask = maskMeshRef.current
      if (!faceLandmarker || !mask) return

      const results = faceLandmarker.detectForVideo(video, performance.now())
      const matrix = results?.facialTransformationMatrixes?.[0]?.data

      if (matrix) {
        const { position, quaternion, scaling } = decomposeMediaPipeMatrix(matrix)
        mask.position = position
        mask.rotationQuaternion = quaternion
        mask.scaling = scaling
        mask.setEnabled(true)
        setStatus('tracking')
        if (showDebug) {
          setDebugInfo(
            `pos ${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)} // ` +
            `scale ${scaling.x.toFixed(2)}`
          )
        }
      } else {
        mask.setEnabled(false)
        setStatus(prev => (prev === 'tracking' || prev === 'no-face' ? 'no-face' : prev))
      }
    })

    engine.runRenderLoop(() => scene.render())
    const handleResize = () => {
      canvas.width = video.videoWidth || canvas.width
      canvas.height = video.videoHeight || canvas.height
      engine.resize()
    }
    window.addEventListener('resize', handleResize)
  }

  const isActive = status === 'tracking' || status === 'no-face'

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 48, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
        background: 'rgba(5, 10, 20, 0.8)', borderBottom: '1px solid rgba(0, 212, 255, 0.4)',
        backdropFilter: 'blur(5px)',
      }}>
        <span style={{ fontFamily: mono, fontSize: 12, letterSpacing: 2, color: '#00d4ff' }}>
          NEOPROXY // REALIDAD_AUMENTADA
        </span>
        <Link href="/" style={{ color: '#00d4ff', textDecoration: 'none', fontFamily: mono, fontSize: 10, border: '1px solid rgba(0,212,255,0.4)', padding: '2px 8px' }}>
          EXIT_PROTOCOL
        </Link>
      </div>

      <div style={{
        position: 'relative', width: '100%', height: '100vh', transform: 'scaleX(-1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <video ref={videoRef} playsInline muted style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
        <canvas ref={canvasRef} style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }} />
      </div>

      {!isActive && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 20, background: status === 'idle' ? '#000205' : 'rgba(0,2,5,0.85)',
        }}>
          {status === 'idle' && (
            <>
              <div style={{ fontFamily: mono, fontSize: 10, color: '#8fb8d6', letterSpacing: 1, maxWidth: 280, textAlign: 'center', lineHeight: 1.8 }}>
                MÁSCARA KITSUNE // TRACKING FACIAL EN VIVO. REQUIERE CÁMARA FRONTAL.
              </div>
              <button
                onClick={start}
                className="cyber-btn"
                style={{
                  fontFamily: mono, fontSize: 12, letterSpacing: 3, color: '#00d4ff', background: 'rgba(0,212,255,0.05)',
                  border: '1px solid #00d4ff66', padding: '14px 32px', cursor: 'pointer', minHeight: 44,
                }}
              >
                ACTIVAR CÁMARA
              </button>
            </>
          )}
          {status === 'loading-model' && (
            <div style={{ fontFamily: mono, fontSize: 11, color: '#00d4ff', letterSpacing: 2 }}>
              CARGANDO MODELO DE TRACKING FACIAL...
            </div>
          )}
          {status === 'requesting-camera' && (
            <div style={{ fontFamily: mono, fontSize: 11, color: '#00d4ff', letterSpacing: 2 }}>
              SOLICITANDO ACCESO A LA CÁMARA...
            </div>
          )}
          {status === 'error' && (
            <>
              <div style={{ fontFamily: mono, fontSize: 11, color: '#ff4444', letterSpacing: 1, maxWidth: 280, textAlign: 'center' }}>
                {errorMessage}
              </div>
              <button
                onClick={start}
                style={{
                  fontFamily: mono, fontSize: 10, letterSpacing: 2, color: '#00d4ff', background: 'none',
                  border: '1px solid #00d4ff66', padding: '10px 24px', cursor: 'pointer', minHeight: 44,
                }}
              >
                REINTENTAR
              </button>
            </>
          )}
        </div>
      )}

      {isActive && maskStatus === 'loading' && (
        <div style={{
          position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', zIndex: 15,
          fontFamily: mono, fontSize: 9, color: '#00d4ff', letterSpacing: 2, background: 'rgba(0,4,10,0.7)',
          padding: '6px 14px', border: '1px solid rgba(0,212,255,0.3)',
        }}>
          CARGANDO MÁSCARA...
        </div>
      )}

      {isActive && maskStatus === 'error' && (
        <div style={{
          position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', zIndex: 15, maxWidth: 320,
          fontFamily: mono, fontSize: 9, color: '#ff4444', letterSpacing: 1, background: 'rgba(20,0,0,0.85)',
          padding: '10px 16px', border: '1px solid rgba(255,68,68,0.4)', textAlign: 'center',
        }}>
          MÁSCARA NO CARGÓ: {maskError}
        </div>
      )}

      {status === 'no-face' && maskStatus === 'loaded' && (
        <div style={{
          position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 15,
          fontFamily: mono, fontSize: 10, color: '#00d4ff', letterSpacing: 2, background: 'rgba(0,4,10,0.7)',
          padding: '8px 16px', border: '1px solid rgba(0,212,255,0.3)',
        }}>
          BUSCANDO ROSTRO...
        </div>
      )}

      {isActive && (
        <button
          onClick={() => setShowDebug(v => !v)}
          style={{
            position: 'absolute', bottom: 56, left: 20, zIndex: 20,
            background: 'rgba(0,4,10,0.7)', border: '1px solid #00d4ff44', color: '#00d4ff',
            fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '8px 12px', cursor: 'pointer', minHeight: 40,
          }}
        >
          DEBUG
        </button>
      )}
      {showDebug && (
        <div style={{
          position: 'absolute', bottom: 104, left: 20, zIndex: 20, maxWidth: 260,
          fontFamily: mono, fontSize: 9, color: '#00ffcc', letterSpacing: 0.5, background: 'rgba(0,4,10,0.85)',
          padding: '10px 14px', border: '1px solid rgba(0,255,204,0.3)',
        }}>
          {debugInfo || 'sin datos aun'}
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 20, left: 20, zIndex: 15,
        fontFamily: mono, fontSize: 8, letterSpacing: 1, color: '#00d4ff55',
      }}>
        <a href="/realidad-aumentada/index.html" style={{ color: 'inherit', textDecoration: 'none' }}>
          MODO CLÁSICO (FILTROS DE CÁMARA) →
        </a>
      </div>
    </div>
  )
}
