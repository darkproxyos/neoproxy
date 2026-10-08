'use client'
import { useEffect, useRef, useState } from 'react'
import { TouchDPad, TouchActionButton, useIsTouchDevice } from '@/components/games/TouchControls'
import { agents } from '@/components/proxyverse/agents'

const trickster = agents.find(a => a.id === 'trickster')!
const VIOLET = '#b400ff'

// Normaliza un ángulo al rango (-PI, PI] para interpolar por el camino corto.
function wrapAngle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

export default function TricksterGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const isTouch = useIsTouchDevice()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

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

      const camera = new B.ArcRotateCamera('cam', -Math.PI / 2.3, Math.PI / 2.5, 7, new B.Vector3(0, 1, 0), scene)
      camera.attachControl(canvasRef.current!, true)
      camera.lowerRadiusLimit = 3
      camera.upperRadiusLimit = 16
      camera.wheelPrecision = 40
      camera.minZ = 0.05

      new B.HemisphericLight('hemi', new B.Vector3(0, 1, 0), scene).intensity = 0.4
      const rim = new B.PointLight('rim', new B.Vector3(3, 4, -3), scene)
      rim.diffuse = B.Color3.FromHexString(VIOLET)
      rim.intensity = 1.1
      const rim2 = new B.PointLight('rim2', new B.Vector3(-3, 3, 3), scene)
      rim2.diffuse = new B.Color3(0.6, 0.8, 1)
      rim2.intensity = 0.4

      const glow = new B.GlowLayer('glow', scene)
      glow.intensity = 0.6

      // Piso — misma estética wireframe que el visor de Arsenal.
      const ground = B.MeshBuilder.CreateGround('ground', { width: 60, height: 60, subdivisions: 30 }, scene)
      const groundMat = new B.StandardMaterial('groundMat', scene)
      groundMat.wireframe = true
      groundMat.emissiveColor = B.Color3.FromHexString(VIOLET)
      groundMat.alpha = 0.14
      ground.material = groundMat

      // Motas ambientales — decorativas, sin colisión ni recolección (todavía).
      for (let i = 0; i < 60; i++) {
        const dust = B.MeshBuilder.CreateSphere('dust' + i, { diameter: 0.04 + Math.random() * 0.05 }, scene)
        dust.position = new B.Vector3((Math.random() - 0.5) * 50, Math.random() * 6 + 0.2, (Math.random() - 0.5) * 50)
        const dm = new B.StandardMaterial('dm' + i, scene)
        dm.emissiveColor = Math.random() > 0.5 ? B.Color3.FromHexString(VIOLET) : new B.Color3(0.5, 0.8, 1)
        dust.material = dm
      }

      // Personaje — sin esqueleto todavía (ver panel "ESTADO"), así que el
      // caminar/saltar es animación procedural sobre el mesh completo: bob
      // senoidal al moverse, arco parabólico al saltar, giro hacia el rumbo.
      keysRef.current = {}
      const keys = keysRef.current
      const onKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; if (e.code === 'Space') e.preventDefault() }
      const onKeyUp = (e: KeyboardEvent) => { keys[e.code] = false }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)

      let characterRoot: any = null
      let runAnim: any = null
      let jumpAnim: any = null
      let runPlaying = false
      let jumpPlaying = false
      let posX = 0, posZ = 0, baseY = 0, velY = 0
      let facing = 0
      let grounded = true
      let walkPhase = 0
      let idlePhase = 0
      let spacePrev = false

      B.SceneLoader.ImportMeshAsync('', '/models/trickster/', 'trickzter.glb', scene)
        .then((res) => {
          if (disposed) return
          characterRoot = res.meshes[0]
          baseY = characterRoot.position.y
          // Esqueleto y ambos clips vienen de Mixamo (mismo rig): Run para
          // caminar/correr, Jump para el salto. La física del arco (posY)
          // la seguimos calculando nosotros — el clip solo aporta la pose.
          runAnim = res.animationGroups.find((a: any) => a.name === 'Run') ?? null
          jumpAnim = res.animationGroups.find((a: any) => a.name === 'Jump') ?? null
          if (runAnim) runAnim.stop()
          if (jumpAnim) { jumpAnim.stop(); jumpAnim.loopAnimation = false }
          setLoading(false)
        })
        .catch(() => {
          if (disposed) return
          setLoadError(true)
          setLoading(false)
        })

      const BOUND = 27
      const SPEED = 0.09
      const TURN_LERP = 0.18
      const JUMP_VELOCITY = 0.15
      const GRAVITY = 0.0065

      scene.registerBeforeRender(() => {
        const dt = engine.getDeltaTime() / 16.67 // normalizado a ~60fps

        let dx = 0, dz = 0
        if (keys['ArrowUp'] || keys['KeyW']) dz += 1
        if (keys['ArrowDown'] || keys['KeyS']) dz -= 1
        if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1
        if (keys['ArrowRight'] || keys['KeyD']) dx += 1
        const moving = dx !== 0 || dz !== 0

        if (moving) {
          const len = Math.hypot(dx, dz)
          dx /= len; dz /= len
          posX = Math.max(-BOUND, Math.min(BOUND, posX + dx * SPEED * dt))
          posZ = Math.max(-BOUND, Math.min(BOUND, posZ + dz * SPEED * dt))
          const target = Math.atan2(dx, dz)
          facing += wrapAngle(target - facing) * TURN_LERP
          walkPhase += 0.28 * dt
        } else {
          idlePhase += 0.03 * dt
        }

        // Salto — flanco de subida de Space, solo si está en el piso. La
        // física del arco (posY) la seguimos calculando nosotros; el clip
        // Jump de Mixamo solo aporta la pose mientras dura el arco.
        const spaceDown = !!keys['Space']
        if (spaceDown && !spacePrev && grounded) {
          velY = JUMP_VELOCITY
          grounded = false
          if (runAnim && runPlaying) { runAnim.stop(); runPlaying = false }
          if (jumpAnim) { jumpAnim.start(false, 1.3); jumpPlaying = true }
        }
        spacePrev = spaceDown

        if (!grounded) {
          velY -= GRAVITY * dt
        } else if (jumpPlaying) {
          jumpAnim?.stop()
          jumpPlaying = false
        }

        // Corre con el clip real de Mixamo mientras camina en el piso; en
        // idle vuelve al bob procedural. El salto usa el clip Jump (arriba).
        const running = grounded && moving
        if (runAnim) {
          if (running && !runPlaying && !jumpPlaying) { runAnim.start(true); runPlaying = true }
          else if (!running && runPlaying) { runAnim.stop(); runPlaying = false }
        }

        const bob = grounded && !running ? Math.sin(idlePhase) * 0.02 : 0

        if (characterRoot) {
          characterRoot.position.x = posX
          characterRoot.position.z = posZ
          characterRoot.rotation.y = facing
          if (grounded) {
            characterRoot.position.y = baseY + bob
            characterRoot.rotation.z = running ? 0 : (moving ? Math.sin(walkPhase) * 0.04 : 0)
          } else {
            characterRoot.position.y += velY * dt
            characterRoot.rotation.z = 0
            if (characterRoot.position.y <= baseY) {
              characterRoot.position.y = baseY
              grounded = true
              velY = 0
            }
          }
        }

        // Cámara sigue al personaje con suavizado.
        const targetPos = new B.Vector3(posX, (characterRoot?.position.y ?? baseY) + 0.9, posZ)
        camera.target.x += (targetPos.x - camera.target.x) * 0.12
        camera.target.y += (targetPos.y - camera.target.y) * 0.12
        camera.target.z += (targetPos.z - camera.target.z) * 0.12
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

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />

      <div style={{
        position: 'absolute', top: 20, left: 20, maxWidth: isTouch ? 200 : 300,
        fontFamily: 'Space Mono, monospace', fontSize: 10,
        letterSpacing: 3, lineHeight: 2.2, color: VIOLET,
        pointerEvents: 'none', textShadow: `0 0 10px ${VIOLET}`,
      }}>
        <div style={{ fontSize: 13, marginBottom: 4 }}>TRICKSTER // CAMPO DE PRUEBA</div>
        <div style={{ color: '#aaaaaa', fontSize: 9, maxWidth: 260, lineHeight: 1.8 }}>
          "{trickster.quote}"
        </div>
        <div style={{ color: '#ffb80099', fontSize: 8, marginTop: 10, letterSpacing: 1.5 }}>
          CORRER Y SALTAR: ESQUELETO Y ANIMACIÓN REAL (MIXAMO)
        </div>
        <div style={{ color: '#ffffff33', fontSize: 9, marginTop: 8 }}>
          {isTouch ? 'D-PAD MOVER // BOTÓN SALTAR' : 'WASD / FLECHAS — ESPACIO SALTA'}
        </div>
      </div>

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

      <a href="/games" style={isTouch ? {
        // top-right en touch: bottom-right ya lo ocupan el botón de salto y el Chat global
        position: 'absolute', top: 20, right: 20,
        fontFamily: 'monospace', color: `${VIOLET}66`,
        fontSize: 10, letterSpacing: 3, textDecoration: 'none',
      } : {
        position: 'absolute', bottom: 20, left: 20,
        fontFamily: 'monospace', color: `${VIOLET}44`,
        fontSize: 10, letterSpacing: 3, textDecoration: 'none',
      }}>← EXIT</a>

      {isTouch && (
        <>
          <TouchDPad keysRef={keysRef} />
          {/* bottom:100 para despejar el botón de Chat global (bottom:24,right:24) */}
          <TouchActionButton keysRef={keysRef} code="Space" label="SALTAR" style={{ bottom: 100, right: 20, width: 72, height: 72, borderRadius: '50%' }} />
        </>
      )}
    </div>
  )
}
