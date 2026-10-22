'use client'
import { useEffect, useRef, useState } from 'react'

// Modelo 3D de un agente para el visor del perfil en /proxyverse/[id]. Un
// agente sin entrada acá simplemente no tiene visor (la página cae al
// retrato 2D o al placeholder "SIN REGISTRO VISUAL") — agregar uno nuevo es
// solo sumar una entrada en AGENT_MODELS (page.tsx) con el nombre de los
// AnimationGroup del glTF, sin tocar este componente.
export type Agent3DConfig = {
  path: string
  file: string
  idleAnim: string
  walkAnim: string
  actionAnims?: string[]
  scale?: number
}

const mono = "'Space Mono', monospace"

// Mismo helper que components/proxyverse usa en el juego de Trickster, para
// girar hacia el rumbo nuevo por el camino corto en vez de dar la vuelta larga.
function wrapAngle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

export default function Agent3DViewer({ config, color }: { config: Agent3DConfig; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return
    let engine: any
    let disposed = false

    const init = async () => {
      const B = await import('@babylonjs/core')
      await import('@babylonjs/loaders/glTF')
      if (disposed) return

      engine = new B.Engine(canvasRef.current!, true)
      const scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0, 0.008, 0.02, 1)

      let camAlpha = Math.PI / 2.4
      const camera = new B.ArcRotateCamera('cam', camAlpha, 1.18, 4.2, new B.Vector3(0, 1, 0), scene)

      const fill = new B.HemisphericLight('fill', new B.Vector3(0, 1, 0.3), scene)
      fill.intensity = 0.65
      fill.diffuse = new B.Color3(0.75, 0.85, 1)
      fill.groundColor = new B.Color3(0.05, 0.05, 0.1)

      const rim = new B.PointLight('rim', new B.Vector3(0, 2.4, -1.5), scene)
      rim.diffuse = B.Color3.FromHexString(color)
      rim.intensity = 1.4

      // Plataforma — solo referencia de piso con el color del agente; sin
      // esto el personaje queda flotando en el vacío del visor.
      const ground = B.MeshBuilder.CreateDisc('groundDisc', { radius: 2.2, tessellation: 48 }, scene)
      ground.rotation.x = Math.PI / 2
      const groundMat = new B.StandardMaterial('groundMat', scene)
      groundMat.diffuseColor = B.Color3.FromHexString(color).scale(0.08)
      groundMat.emissiveColor = B.Color3.FromHexString(color).scale(0.05)
      groundMat.alpha = 0.5
      ground.material = groundMat

      let characterRoot: any = null
      let facing = 0
      let posX = 0
      let posZ = 0

      type Mode = 'idle' | 'walk' | 'action'
      let mode: Mode = 'idle'
      let waitTimer = 60
      let targetX = 0
      let targetZ = 0
      const WALK_RADIUS = 1.5
      const SPEED = 0.03
      const TURN_LERP = 0.15

      let idleAnim: any = null
      let walkAnim: any = null
      let actionAnims: any[] = []
      let currentAnim: any = null

      function playAnim(anim: any, loop: boolean) {
        if (!anim || currentAnim === anim) return
        currentAnim?.stop()
        currentAnim = anim
        currentAnim.start(loop)
      }

      // 1.5–4.5s de pausa entre decisiones — dt normalizado a ~60 unidades
      // por segundo, mismo criterio que BOSS_ATTACK_INTERVAL etc. en el juego.
      function randomWaitFrames() {
        return (1.5 + Math.random() * 3) * 60
      }

      // Punto uniforme dentro del disco (no solo en el borde): sqrt(random)
      // compensa que el área crece con el radio al cuadrado.
      function pickWalkTarget() {
        const ang = Math.random() * Math.PI * 2
        const r = Math.sqrt(Math.random()) * WALK_RADIUS
        targetX = Math.cos(ang) * r
        targetZ = Math.sin(ang) * r
      }

      B.SceneLoader.ImportMeshAsync('', config.path, config.file, scene)
        .then((res: any) => {
          if (disposed) return
          characterRoot = res.meshes[0]
          // Mismo bug de Babylon + glTF que en el juego: si rotationQuaternion
          // queda seteado, .rotation.y se ignora por completo al armar la
          // world matrix y el personaje nunca gira hacia donde camina.
          characterRoot.rotationQuaternion = null
          if (config.scale) characterRoot.scaling.setAll(config.scale)
          idleAnim = res.animationGroups.find((a: any) => a.name === config.idleAnim) ?? null
          walkAnim = res.animationGroups.find((a: any) => a.name === config.walkAnim) ?? null
          actionAnims = (config.actionAnims ?? [])
            .map((name) => res.animationGroups.find((a: any) => a.name === name))
            .filter(Boolean)
          res.animationGroups.forEach((a: any) => {
            a.stop()
            a.loopAnimation = a === idleAnim || a === walkAnim
          })
          playAnim(idleAnim, true)
          setLoading(false)
        })
        .catch(() => {
          if (disposed) return
          setLoadError(true)
          setLoading(false)
        })

      scene.registerBeforeRender(() => {
        const dt = Math.min(engine.getDeltaTime() / 16.67, 3)
        camAlpha += 0.0012 * dt
        camera.alpha = camAlpha
        if (!characterRoot) return

        if (mode === 'idle') {
          waitTimer -= dt
          if (waitTimer <= 0) {
            const doAction = actionAnims.length > 0 && Math.random() < 0.4
            if (doAction) {
              const anim = actionAnims[Math.floor(Math.random() * actionAnims.length)]
              mode = 'action'
              playAnim(anim, false)
              anim.onAnimationGroupEndObservable.addOnce(() => {
                mode = 'idle'
                waitTimer = randomWaitFrames()
                playAnim(idleAnim, true)
              })
            } else {
              pickWalkTarget()
              mode = 'walk'
              playAnim(walkAnim, true)
            }
          }
        } else if (mode === 'walk') {
          const dx = targetX - posX
          const dz = targetZ - posZ
          const dist = Math.hypot(dx, dz)
          if (dist < 0.08) {
            mode = 'idle'
            waitTimer = randomWaitFrames()
            playAnim(idleAnim, true)
          } else {
            const nx = dx / dist, nz = dz / dist
            posX += nx * SPEED * dt
            posZ += nz * SPEED * dt
            // +PI: con rotation.y=0 el rig mira de frente a la cámara, así
            // que sin este offset camina de espaldas a su propio rumbo.
            const target = Math.atan2(nx, nz) + Math.PI
            facing += wrapAngle(target - facing) * TURN_LERP
            characterRoot.position.x = posX
            characterRoot.position.z = posZ
            characterRoot.rotation.y = facing
          }
        }
        // mode === 'action': se queda plantado, la animación corre sola —
        // onAnimationGroupEndObservable dispara la vuelta a 'idle'.
      })

      engine.runRenderLoop(() => scene.render())
      window.addEventListener('resize', () => engine.resize())
    }

    init()
    return () => {
      disposed = true
      if (engine) engine.dispose()
    }
  }, [config, color])

  return (
    <div style={{
      maxWidth: 420, height: 420, margin: '0 auto 32px', border: `1px solid ${color}33`,
      position: 'relative', background: `${color}08`, overflow: 'hidden',
    }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', top: 10, left: 12, fontFamily: mono, fontSize: 8,
        letterSpacing: 2, color: `${color}99`, pointerEvents: 'none',
      }}>
        VISOR 3D // EN VIVO
      </div>
      {loading && !loadError && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: mono, fontSize: 10, letterSpacing: 2, color: `${color}aa`, background: '#000205cc',
        }}>
          CARGANDO MODELO...
        </div>
      )}
      {loadError && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: mono, fontSize: 10, letterSpacing: 2, color: '#8fb8d6', background: '#000205',
        }}>
          NO SE PUDO CARGAR EL MODELO
        </div>
      )}
    </div>
  )
}
