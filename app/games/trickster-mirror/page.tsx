'use client'
import { useEffect, useRef, useState } from 'react'

const VIOLET = '#b400ff'

// Normaliza un ángulo al rango (-PI, PI] para que una interpolación o resta
// de ángulos tome siempre el camino corto.
function wrapAngle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

// Índices de MediaPipe Pose (BlazePose, 33 puntos) — solo usamos los del
// torso superior: hombros, codos, muñecas y nariz.
const LM = { NOSE: 0, L_SHOULDER: 11, R_SHOULDER: 12, L_ELBOW: 13, R_ELBOW: 14, L_WRIST: 15, R_WRIST: 16 }

type CameraState = 'idle' | 'requesting' | 'denied' | 'ready'

export default function TricksterMirrorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [modelLoading, setModelLoading] = useState(false)
  const [calibrating, setCalibrating] = useState(false)
  const poseRef = useRef<any>(null) // último resultado de PoseLandmarker, leído por el loop de Babylon
  const disposedRef = useRef(false)
  useEffect(() => () => { disposedRef.current = true }, [])

  useEffect(() => {
    if (!canvasRef.current) return
    let engine: any
    let disposed = false

    const init = async () => {
      const B = await import('@babylonjs/core')
      await import('@babylonjs/loaders/glTF')

      engine = new B.Engine(canvasRef.current!, true)
      const scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0, 0.006, 0.016, 1)

      // Cámara fija de frente — el personaje no se mueve con WASD acá, solo
      // refleja al usuario, así que no hace falta el control de órbita
      // completo del campo de prueba. Verificado con captura: a diferencia
      // de /games/trickster (que reorienta el rig con un offset de +PI al
      // moverse), acá el personaje queda con su rotation.y=0 de importación
      // tal cual, y ese "cero" de fábrica mira hacia +Z — por eso la cámara
      // va del lado -Z.
      const camera = new B.ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 2.15, 3.4, new B.Vector3(0, 1.25, 0), scene)
      camera.attachControl(canvasRef.current!, true)
      camera.lowerRadiusLimit = 2
      camera.upperRadiusLimit = 8
      camera.wheelPrecision = 60
      camera.minZ = 0.05

      new B.HemisphericLight('hemi', new B.Vector3(0, 1, 0), scene).intensity = 0.45
      const rim = new B.PointLight('rim', new B.Vector3(2, 3, 3), scene)
      rim.diffuse = B.Color3.FromHexString(VIOLET)
      rim.intensity = 1
      const rim2 = new B.PointLight('rim2', new B.Vector3(-2, 2, -2), scene)
      rim2.diffuse = new B.Color3(0.6, 0.8, 1)
      rim2.intensity = 0.35

      const glow = new B.GlowLayer('glow', scene)
      glow.intensity = 0.6

      const ground = B.MeshBuilder.CreateGround('ground', { width: 40, height: 40, subdivisions: 24 }, scene)
      const groundMat = new B.StandardMaterial('groundMat', scene)
      groundMat.wireframe = true
      groundMat.emissiveColor = B.Color3.FromHexString(VIOLET)
      groundMat.alpha = 0.14
      ground.material = groundMat

      let characterRoot: any = null
      let skinnedMesh: any = null
      let idleAnim: any = null
      let headBone: any = null, neckBone: any = null
      let leftArmBone: any = null, leftForeArmBone: any = null
      let rightArmBone: any = null, rightForeArmBone: any = null

      B.SceneLoader.ImportMeshAsync('', '/models/trickster/', 'trickzter.glb', scene)
        .then((res) => {
          if (disposed) return
          characterRoot = res.meshes[0]
          characterRoot.rotationQuaternion = null
          characterRoot.rotation.y = 0 // de cara a la cámara — ver comentario de la cámara arriba
          skinnedMesh = res.meshes.find((m: any) => m.skeleton) ?? res.meshes[1]
          const bones = res.skeletons[0]?.bones ?? []
          const byName = (n: string) => bones.find((b: any) => b.name === n) ?? null
          headBone = byName('mixamorig:Head')
          neckBone = byName('mixamorig:Neck')
          leftArmBone = byName('mixamorig:LeftArm')
          leftForeArmBone = byName('mixamorig:LeftForeArm')
          rightArmBone = byName('mixamorig:RightArm')
          rightForeArmBone = byName('mixamorig:RightForeArm')
          idleAnim = res.animationGroups.find((a: any) => a.name === 'Idle') ?? null
          res.animationGroups.forEach((a: any) => a.stop())
          idleAnim?.start(true)
          setLoading(false)
        })
        .catch(() => {
          if (disposed) return
          setLoadError(true)
          setLoading(false)
        })

      // Calibración: el ángulo de cada segmento (hombro→codo, codo→muñeca)
      // en el primer frame con detección válida queda como referencia "en
      // reposo". Cuadro a cuadro solo aplicamos la DIFERENCIA respecto a esa
      // referencia, como una rotación de mundo encima de la pose Idle que ya
      // puso la animación — así no hace falta saber la convención de ejes
      // local de cada hueso (la causa de casi todos los dolores de cabeza
      // anteriores con el rifle), solo que el signo del delta sea consistente.
      let calib: { lu: number; lf: number; ru: number; rf: number; yaw: number; pitch: number } | null = null
      const ARM_AXIS = new B.Vector3(0, 0, 1) // perpendicular a la cámara — gira dentro del plano que la webcam ve
      const YAW_AXIS = new B.Vector3(0, 1, 0)
      const PITCH_AXIS = new B.Vector3(1, 0, 0)
      const HEAD_SENSITIVITY = 2.2 // la cabeza se mueve poco en pantalla — hace falta amplificar para que se note

      function angleOf(a: any, b: any) {
        // y de imagen crece hacia abajo; se invierte para que "arriba" sea positivo, como en el mundo 3D.
        return Math.atan2(-(b.y - a.y), b.x - a.x)
      }

      scene.onAfterAnimationsObservable.add(() => {
        if (!skinnedMesh || !leftArmBone || !rightArmBone) return
        const lm = poseRef.current
        if (!lm) { calib = null; return }

        // Espejo: el lado DERECHO del usuario mueve el brazo IZQUIERDO del
        // avatar y viceversa — así el reflejo se comporta como un espejo de
        // verdad (ver la nota en el mensaje al usuario sobre esta convención).
        const lu = angleOf(lm[LM.R_SHOULDER], lm[LM.R_ELBOW])
        const lf = angleOf(lm[LM.R_ELBOW], lm[LM.R_WRIST])
        const ru = angleOf(lm[LM.L_SHOULDER], lm[LM.L_ELBOW])
        const rf = angleOf(lm[LM.L_ELBOW], lm[LM.L_WRIST])
        const shoulderMidX = (lm[LM.L_SHOULDER].x + lm[LM.R_SHOULDER].x) / 2
        const shoulderMidY = (lm[LM.L_SHOULDER].y + lm[LM.R_SHOULDER].y) / 2
        const yaw = lm[LM.NOSE].x - shoulderMidX
        const pitch = lm[LM.NOSE].y - shoulderMidY

        if (!calib) {
          calib = { lu, lf, ru, rf, yaw, pitch }
          return
        }

        const dLU = wrapAngle(lu - calib.lu)
        const dLF = wrapAngle(lf - calib.lf)
        const dRU = wrapAngle(ru - calib.ru)
        const dRF = wrapAngle(rf - calib.rf)
        const dYaw = (yaw - calib.yaw) * HEAD_SENSITIVITY
        const dPitch = (pitch - calib.pitch) * HEAD_SENSITIVITY

        // El antebrazo es hijo del brazo: ya hereda la rotación del brazo
        // por jerarquía, así que acá solo se aplica la flexión del codo en
        // sí (la diferencia entre cuánto giró el antebrazo y cuánto giró
        // el brazo), no el ángulo completo — si no, se cuenta dos veces.
        leftArmBone.rotate(ARM_AXIS, dLU, B.Space.WORLD, skinnedMesh)
        leftForeArmBone?.rotate(ARM_AXIS, dLF - dLU, B.Space.WORLD, skinnedMesh)
        rightArmBone.rotate(ARM_AXIS, dRU, B.Space.WORLD, skinnedMesh)
        rightForeArmBone?.rotate(ARM_AXIS, dRF - dRU, B.Space.WORLD, skinnedMesh)
        if (neckBone) {
          neckBone.rotate(YAW_AXIS, dYaw, B.Space.WORLD, skinnedMesh)
          neckBone.rotate(PITCH_AXIS, dPitch, B.Space.WORLD, skinnedMesh)
        } else if (headBone) {
          headBone.rotate(YAW_AXIS, dYaw, B.Space.WORLD, skinnedMesh)
          headBone.rotate(PITCH_AXIS, dPitch, B.Space.WORLD, skinnedMesh)
        }
      })

      engine.runRenderLoop(() => scene.render())
      window.addEventListener('resize', () => engine.resize())
    }

    init()
    return () => {
      disposed = true
      if (engine) engine.dispose()
    }
  }, [])

  // Cámara + MediaPipe Pose — separado del efecto de Babylon porque arranca
  // recién cuando el usuario toca "ACTIVAR CÁMARA" (gesto explícito, no
  // auto-pedimos permiso de cámara al cargar la página).
  async function activateCamera() {
    setCameraState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      if (!videoRef.current) return
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setCameraState('ready')
      setModelLoading(true)

      // WASM y el modelo .task se sirven desde /public/mediapipe — NO desde
      // el CDN de Google que usan los ejemplos oficiales. Ya nos pasó una
      // vez (el decoder de meshopt de Babylon) que un CDN externo se cae en
      // ciertas redes y rompe producción; acá se evita desde el vamos.
      const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
      const filesetResolver = await FilesetResolver.forVisionTasks('/mediapipe')
      const poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: '/mediapipe/pose_landmarker_lite.task' },
        runningMode: 'VIDEO',
        numPoses: 1,
      })
      setModelLoading(false)
      setCalibrating(true)
      setTimeout(() => setCalibrating(false), 2000)

      const overlayCtx = overlayRef.current?.getContext('2d') ?? null
      let lastT = 0
      const loop = () => {
        if (disposedRef.current) return
        const video = videoRef.current
        if (video && video.readyState >= 2) {
          const now = performance.now()
          if (now - lastT > 33) { // ~30fps, de sobra para esto y no satura la CPU
            lastT = now
            const result = poseLandmarker.detectForVideo(video, now)
            const raw = result.landmarks?.[0] ?? null
            // Filtro de confianza: si hombros/codos/muñecas/nariz no se ven
            // con suficiente seguridad (poca luz, fuera de cuadro, nadie
            // en pantalla), se trata como "sin detección" en vez de mover
            // el avatar con ruido.
            const CONFIDENCE_MIN = 0.5
            const trackedIdx = [LM.NOSE, LM.L_SHOULDER, LM.R_SHOULDER, LM.L_ELBOW, LM.R_ELBOW, LM.L_WRIST, LM.R_WRIST]
            const lm = raw && trackedIdx.every((i) => (raw[i]?.visibility ?? 0) >= CONFIDENCE_MIN) ? raw : null
            poseRef.current = lm

            if (overlayCtx && overlayRef.current) {
              const w = overlayRef.current.width, h = overlayRef.current.height
              overlayCtx.clearRect(0, 0, w, h)
              if (lm) {
                overlayCtx.fillStyle = VIOLET
                for (const p of lm) {
                  overlayCtx.beginPath()
                  overlayCtx.arc(p.x * w, p.y * h, 3, 0, Math.PI * 2)
                  overlayCtx.fill()
                }
              }
            }
          }
        }
        requestAnimationFrame(loop)
      }
      loop()
    } catch {
      setCameraState('denied')
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />

      {loading && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          fontFamily: 'Space Mono, monospace', color: VIOLET, fontSize: 12, letterSpacing: 4,
          textShadow: `0 0 10px ${VIOLET}`,
        }}>
          CARGANDO TRICKSTER...
        </div>
      )}

      {loadError && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          fontFamily: 'Space Mono, monospace', color: '#ff4444', fontSize: 11, letterSpacing: 2,
          textAlign: 'center', maxWidth: 280,
        }}>
          NO SE PUDO CARGAR EL MODELO. Reintentá recargando la página.
        </div>
      )}

      <a href="/games" style={{
        position: 'absolute', top: 20, right: 20,
        fontFamily: 'monospace', color: `${VIOLET}66`,
        fontSize: 10, letterSpacing: 3, textDecoration: 'none',
      }}>← EXIT</a>

      <div style={{
        position: 'absolute', top: 20, left: 20, maxWidth: 260,
        fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 2,
        color: VIOLET, textShadow: `0 0 10px ${VIOLET}`,
      }}>
        TRICKSTER // ESPEJO
      </div>

      {!loading && cameraState === 'idle' && (
        <button onClick={activateCamera} style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 2,
          background: `${VIOLET}22`, border: `1px solid ${VIOLET}`, color: VIOLET,
          padding: '14px 28px', borderRadius: 8, cursor: 'pointer',
        }}>
          ACTIVAR CÁMARA
        </button>
      )}

      {cameraState === 'requesting' && (
        <div style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 2, color: `${VIOLET}aa`,
        }}>
          ESPERANDO PERMISO DE CÁMARA...
        </div>
      )}

      {cameraState === 'denied' && (
        <div style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 2, color: '#ff6666',
          textAlign: 'center', maxWidth: 280,
        }}>
          NO SE PUDO ACCEDER A LA CÁMARA. Revisá los permisos del navegador.
        </div>
      )}

      {modelLoading && (
        <div style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 2, color: `${VIOLET}aa`,
        }}>
          CARGANDO MODELO DE POSE...
        </div>
      )}

      {calibrating && (
        <div style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 2, color: '#00ffccaa',
        }}>
          CALIBRANDO — QUEDATE QUIETO/A UN SEGUNDO
        </div>
      )}

      {/* Preview espejado de la webcam, con los puntos de pose encima — sirve
          para confirmar que el tracking está andando, no solo decorativo. */}
      <div style={{
        position: 'absolute', bottom: cameraState === 'ready' ? 130 : 0, right: 20,
        width: 160, height: 120, borderRadius: 8, overflow: 'hidden',
        border: `1px solid ${VIOLET}66`, opacity: cameraState === 'ready' ? 1 : 0,
        transition: 'opacity 0.3s, bottom 0.3s', pointerEvents: 'none',
      }}>
        <video ref={videoRef} muted playsInline style={{
          width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)',
        }} />
        <canvas ref={overlayRef} width={160} height={120} style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)',
        }} />
      </div>
    </div>
  )
}
