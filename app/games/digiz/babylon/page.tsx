'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'
const DANGER = '#ff2d55'
const ACCENT = '#ffb800'
const PORTAL = '#00ffcc'

// Reconstrucción libre del concepto de Digiz (el juego Phaser original vive
// en public/digiz/, ningún archivo de ahí se usa acá) -- esfera que
// persigue al puntero esquivando obstáculos hasta un portal, pero en 3D de
// verdad: geometría, texturas y niveles generados en código, sin un solo
// asset importado. CORE_SCALE/paleta comparten lenguaje con el resto del
// sitio (cian=jugador, rojo=peligro, ámbar=acento, verde=portal).
const TOTAL_LEVELS = 8

type Hazard = {
  type: 'spike' | 'orbit' | 'patrol'
  base: [number, number]
  // orbit
  radius?: number
  speed?: number
  // patrol
  to?: [number, number]
}

type LevelDef = {
  arenaHalf: number
  spawn: [number, number]
  portal: [number, number]
  hazards: Hazard[]
}

// LCG determinístico -- mismo nivel siempre da el mismo layout, sin
// depender de Math.random (reproducible, fácil de ajustar a mano si hace
// falta más adelante).
function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function buildLevel(index: number): LevelDef {
  const rng = makeRng(index * 7919 + 13)
  const arenaHalf = 11 + index * 1.4
  const spawn: [number, number] = [-arenaHalf + 2.5, -arenaHalf + 2.5]
  const portal: [number, number] = [arenaHalf - 2.5, arenaHalf - 2.5]
  const minClear = 3.2
  const farEnough = (p: [number, number]) => {
    const dS = Math.hypot(p[0] - spawn[0], p[1] - spawn[1])
    const dP = Math.hypot(p[0] - portal[0], p[1] - portal[1])
    return dS > minClear && dP > minClear
  }
  const randPoint = (): [number, number] => {
    for (let tries = 0; tries < 30; tries++) {
      const p: [number, number] = [
        (rng() * 2 - 1) * (arenaHalf - 2),
        (rng() * 2 - 1) * (arenaHalf - 2),
      ]
      if (farEnough(p)) return p
    }
    return [0, 0]
  }

  const hazards: Hazard[] = []
  const spikeCount = 2 + Math.floor(index * 1.1)
  for (let i = 0; i < spikeCount; i++) hazards.push({ type: 'spike', base: randPoint() })

  const orbitCount = Math.floor(index / 2)
  for (let i = 0; i < orbitCount; i++) {
    hazards.push({
      type: 'orbit',
      base: randPoint(),
      radius: 2 + rng() * 2.5,
      speed: 0.6 + rng() * 0.8,
    })
  }

  const patrolCount = Math.floor((index + 1) / 2)
  for (let i = 0; i < patrolCount; i++) {
    const from = randPoint()
    const to: [number, number] = [
      Math.max(-arenaHalf + 1.5, Math.min(arenaHalf - 1.5, from[0] + (rng() * 2 - 1) * 8)),
      Math.max(-arenaHalf + 1.5, Math.min(arenaHalf - 1.5, from[1] + (rng() * 2 - 1) * 8)),
    ]
    hazards.push({ type: 'patrol', base: from, to, speed: 0.4 + rng() * 0.5 })
  }

  return { arenaHalf, spawn, portal, hazards }
}

export default function DigizBabylon() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [screen, setScreen] = useState<'menu' | 'playing' | 'win'>('menu')
  const [levelDisplay, setLevelDisplay] = useState(1)
  const [deaths, setDeaths] = useState(0)
  const stateRef = useRef({ levelIndex: 0, deaths: 0 })
  const controlRef = useRef<{ goToLevel: (i: number) => void } | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    let disposed = false
    let engine: any

    const init = async () => {
      const B = await import('@babylonjs/core')
      if (disposed || !canvasRef.current) return

      engine = new B.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true })
      const scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0.01, 0.015, 0.03, 1)
      scene.fogMode = B.Scene.FOGMODE_EXP2
      scene.fogColor = new B.Color3(0.01, 0.015, 0.03)
      scene.fogDensity = 0.018

      const camera = new B.ArcRotateCamera('cam', -Math.PI / 2, 1.0, 22, B.Vector3.Zero(), scene)
      camera.fov = 0.75

      new B.HemisphericLight('fill', new B.Vector3(0, 1, 0.2), scene).intensity = 0.7
      const sun = new B.DirectionalLight('sun', new B.Vector3(-0.4, -1, -0.3), scene)
      sun.intensity = 0.8

      const glow = new B.GlowLayer('glow', scene, { mainTextureFixedSize: 1024, blurKernelSize: 48 })
      glow.intensity = 0.9

      // --- piso: grilla procedural dibujada en un DynamicTexture, nada
      // de imágenes importadas. Un plano por nivel, reconstruido al
      // cambiar de arena (tamaño distinto por nivel). ---
      let ground: any = null
      let groundMat: any = null
      function buildGround(half: number) {
        if (ground) ground.dispose()
        if (groundMat) groundMat.dispose()
        const size = half * 2 + 4
        ground = B.MeshBuilder.CreateGround('ground', { width: size, height: size }, scene)
        groundMat = new B.StandardMaterial('groundMat', scene)
        const texSize = 512
        const dt = new B.DynamicTexture('groundTex', texSize, scene, false)
        const ctx = dt.getContext() as CanvasRenderingContext2D
        ctx.fillStyle = '#050810'
        ctx.fillRect(0, 0, texSize, texSize)
        ctx.strokeStyle = 'rgba(0,212,255,0.35)'
        ctx.lineWidth = 1.5
        const step = texSize / 16
        for (let i = 0; i <= 16; i++) {
          ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, texSize); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(texSize, i * step); ctx.stroke()
        }
        ctx.strokeStyle = 'rgba(0,212,255,0.08)'
        ctx.lineWidth = 6
        ctx.strokeRect(3, 3, texSize - 6, texSize - 6)
        dt.update()
        groundMat.diffuseTexture = dt
        groundMat.emissiveTexture = dt
        groundMat.specularColor = new B.Color3(0, 0, 0)
        ground.material = groundMat
        ground.isPickable = true
        ground.receiveShadows = true
      }

      // --- jugador: esfera cian con glow + estela de partículas ---
      const player = B.MeshBuilder.CreateSphere('player', { diameter: 1.1, segments: 16 }, scene)
      const playerMat = new B.StandardMaterial('playerMat', scene)
      playerMat.diffuseColor = B.Color3.FromHexString(CYAN)
      playerMat.emissiveColor = B.Color3.FromHexString(CYAN)
      player.material = playerMat
      player.position.y = 0.55

      const trail = new B.ParticleSystem('trail', 300, scene)
      const trailDt = new B.DynamicTexture('trailTex', 32, scene, false)
      const tctx = trailDt.getContext() as CanvasRenderingContext2D
      const grad = tctx.createRadialGradient(16, 16, 0, 16, 16, 16)
      grad.addColorStop(0, 'rgba(0,212,255,1)')
      grad.addColorStop(1, 'rgba(0,212,255,0)')
      tctx.fillStyle = grad
      tctx.fillRect(0, 0, 32, 32)
      trailDt.update()
      trail.particleTexture = trailDt
      trail.emitter = player
      trail.minEmitBox = new B.Vector3(0, 0, 0)
      trail.maxEmitBox = new B.Vector3(0, 0, 0)
      trail.color1 = new B.Color4(0, 0.83, 1, 0.8)
      trail.color2 = new B.Color4(0, 0.83, 1, 0.3)
      trail.minSize = 0.25
      trail.maxSize = 0.55
      trail.minLifeTime = 0.25
      trail.maxLifeTime = 0.45
      trail.emitRate = 40
      trail.blendMode = B.ParticleSystem.BLENDMODE_ADD
      trail.gravity = new B.Vector3(0, 0, 0)
      trail.direction1 = new B.Vector3(0, 0.2, 0)
      trail.direction2 = new B.Vector3(0, 0.4, 0)
      trail.minEmitPower = 0.1
      trail.maxEmitPower = 0.3
      trail.start()

      // --- portal: anillo vertical pulsante, verde señal ---
      const portalMesh = B.MeshBuilder.CreateTorus('portal', { diameter: 2.6, thickness: 0.22, tessellation: 32 }, scene)
      portalMesh.rotation.x = Math.PI / 2
      const portalMat = new B.StandardMaterial('portalMat', scene)
      portalMat.diffuseColor = B.Color3.FromHexString(PORTAL)
      portalMat.emissiveColor = B.Color3.FromHexString(PORTAL)
      portalMesh.material = portalMat
      portalMesh.position.y = 1.3

      // --- hazards: se reconstruyen por nivel ---
      type LiveHazard = { def: Hazard; mesh: any; t: number }
      let liveHazards: LiveHazard[] = []

      function makeSpikeMesh() {
        const mesh = B.MeshBuilder.CreateSphere('spike', { diameter: 1.3, segments: 8 }, scene)
        // desplaza los vértices hacia afuera al azar para que lea "punzante"
        // sin usar una textura ni un asset importado
        const positions = mesh.getVerticesData(B.VertexBuffer.PositionKind)!
        const rng = makeRng(Math.floor(Math.random() * 1e6))
        for (let i = 0; i < positions.length; i += 3) {
          const len = Math.hypot(positions[i], positions[i + 1], positions[i + 2]) || 1
          const spike = 1 + (rng() > 0.6 ? rng() * 0.5 : 0)
          positions[i] = (positions[i] / len) * len * spike
          positions[i + 1] = (positions[i + 1] / len) * len * spike
          positions[i + 2] = (positions[i + 2] / len) * len * spike
        }
        mesh.updateVerticesData(B.VertexBuffer.PositionKind, positions)
        mesh.createNormals(true)
        const mat = new B.StandardMaterial('spikeMat', scene)
        mat.diffuseColor = B.Color3.FromHexString(DANGER)
        mat.emissiveColor = B.Color3.FromHexString(DANGER).scale(0.6)
        mesh.material = mat
        return mesh
      }
      function makeOrbitMesh() {
        const mesh = B.MeshBuilder.CreateTorus('orbit', { diameter: 1.1, thickness: 0.3, tessellation: 20 }, scene)
        const mat = new B.StandardMaterial('orbitMat', scene)
        mat.diffuseColor = B.Color3.FromHexString(ACCENT)
        mat.emissiveColor = B.Color3.FromHexString(ACCENT).scale(0.7)
        mesh.material = mat
        return mesh
      }
      function makePatrolMesh() {
        const mesh = B.MeshBuilder.CreatePolyhedron('patrol', { type: 2, size: 0.75 }, scene)
        const mat = new B.StandardMaterial('patrolMat', scene)
        mat.diffuseColor = B.Color3.FromHexString(DANGER)
        mat.emissiveColor = B.Color3.FromHexString(DANGER).scale(0.5)
        mesh.material = mat
        return mesh
      }

      function clearHazards() {
        liveHazards.forEach(h => h.mesh.dispose())
        liveHazards = []
      }

      function loadLevel(index: number) {
        clearHazards()
        const def = buildLevel(index)
        buildGround(def.arenaHalf)
        player.position.x = def.spawn[0]
        player.position.z = def.spawn[1]
        targetX = def.spawn[0]
        targetZ = def.spawn[1]
        portalMesh.position.x = def.portal[0]
        portalMesh.position.z = def.portal[1]
        camera.target.set(player.position.x, 0, player.position.z)

        for (const hz of def.hazards) {
          let mesh: any
          if (hz.type === 'spike') mesh = makeSpikeMesh()
          else if (hz.type === 'orbit') mesh = makeOrbitMesh()
          else mesh = makePatrolMesh()
          mesh.position.y = hz.type === 'spike' ? 0.6 : 0.9
          liveHazards.push({ def: hz, mesh, t: Math.random() * 10 })
        }
      }

      // --- control: el puntero define un objetivo en el piso, el jugador
      // lo persigue a velocidad constante -- mismo mecanismo de fondo que
      // moveToPointer del original, reimplementado desde cero. ---
      let targetX = 0
      let targetZ = 0
      const PLAYER_SPEED = 9 // unidades/seg

      scene.onPointerObservable.add((pi: any) => {
        if (pi.type !== B.PointerEventTypes.POINTERMOVE && pi.type !== B.PointerEventTypes.POINTERDOWN) return
        const pick = scene.pick(scene.pointerX, scene.pointerY, (m: any) => m === ground)
        if (pick?.hit && pick.pickedPoint) {
          targetX = pick.pickedPoint.x
          targetZ = pick.pickedPoint.z
        }
      })

      let levelCompleteLock = false
      function resetToSpawn() {
        const def = currentDef
        player.position.x = def.spawn[0]
        player.position.z = def.spawn[1]
        targetX = def.spawn[0]
        targetZ = def.spawn[1]
      }

      let currentDef: LevelDef = buildLevel(0)
      function goToLevel(index: number) {
        currentDef = buildLevel(index)
        stateRef.current.levelIndex = index
        levelCompleteLock = false
        loadLevel(index)
      }
      controlRef.current = { goToLevel }

      let last = performance.now()
      engine.runRenderLoop(() => {
        const now = performance.now()
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now

        // jugador persigue el target a velocidad constante (no un lerp
        // exponencial -- así se siente "manejado", no "pegado al mouse")
        const dx = targetX - player.position.x
        const dz = targetZ - player.position.z
        const dist = Math.hypot(dx, dz)
        if (dist > 0.02) {
          const step = Math.min(dist, PLAYER_SPEED * dt)
          player.position.x += (dx / dist) * step
          player.position.z += (dz / dist) * step
          player.rotation.y = Math.atan2(dx, dz)
        }
        player.rotation.x += dt * 2
        player.rotation.z += dt * 1.3

        camera.target.x += (player.position.x - camera.target.x) * 0.08
        camera.target.z += (player.position.z - camera.target.z) * 0.08

        portalMesh.rotation.z += dt * 0.8
        const portalPulse = 1 + Math.sin(now * 0.004) * 0.08
        portalMesh.scaling.set(portalPulse, portalPulse, portalPulse)

        for (const h of liveHazards) {
          h.t += dt
          if (h.def.type === 'spike') {
            h.mesh.rotation.y += dt * 0.6
            h.mesh.position.x = h.def.base[0]
            h.mesh.position.z = h.def.base[1]
          } else if (h.def.type === 'orbit') {
            const ang = h.t * (h.def.speed || 0.7)
            h.mesh.position.x = h.def.base[0] + Math.cos(ang) * (h.def.radius || 2)
            h.mesh.position.z = h.def.base[1] + Math.sin(ang) * (h.def.radius || 2)
            h.mesh.rotation.y += dt * 2
          } else if (h.def.type === 'patrol' && h.def.to) {
            const phase = (Math.sin(h.t * (h.def.speed || 0.5)) + 1) / 2
            h.mesh.position.x = h.def.base[0] + (h.def.to[0] - h.def.base[0]) * phase
            h.mesh.position.z = h.def.base[1] + (h.def.to[1] - h.def.base[1]) * phase
            h.mesh.rotation.y += dt * 3
          }

          const dHaz = Math.hypot(player.position.x - h.mesh.position.x, player.position.z - h.mesh.position.z)
          if (dHaz < 1.1 && !levelCompleteLock) {
            stateRef.current.deaths += 1
            setDeaths(stateRef.current.deaths)
            resetToSpawn()
          }
        }

        const dPortal = Math.hypot(player.position.x - portalMesh.position.x, player.position.z - portalMesh.position.z)
        if (dPortal < 1.4 && !levelCompleteLock) {
          levelCompleteLock = true
          const next = stateRef.current.levelIndex + 1
          if (next >= TOTAL_LEVELS) {
            setScreen('win')
          } else {
            setTimeout(() => {
              goToLevel(next)
              setLevelDisplay(next + 1)
            }, 500)
          }
        }

        scene.render()
      })

      window.addEventListener('resize', () => engine.resize())
      goToLevel(0)
    }

    init()

    return () => {
      disposed = true
      engine?.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startGame = () => {
    stateRef.current = { levelIndex: 0, deaths: 0 }
    setDeaths(0)
    setLevelDisplay(1)
    setScreen('playing')
    controlRef.current?.goToLevel(0)
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#00030a' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />

      <Link
        href="/games/digiz"
        style={{
          position: 'absolute', top: 14, left: 14, zIndex: 10,
          fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#c8daf0',
          background: 'rgba(0,2,5,0.72)', border: '1px solid #4a608066',
          padding: '6px 12px', textDecoration: 'none', backdropFilter: 'blur(4px)',
        }}
      >
        ← VOLVER
      </Link>

      {screen === 'playing' && (
        <div style={{
          position: 'absolute', top: 14, right: 14, zIndex: 10,
          fontFamily: mono, fontSize: 10, letterSpacing: 2, color: CYAN,
          background: 'rgba(0,2,5,0.72)', border: `1px solid ${CYAN}44`,
          padding: '8px 14px', backdropFilter: 'blur(4px)', textAlign: 'right',
        }}>
          <div>NIVEL {levelDisplay} / {TOTAL_LEVELS}</div>
          <div style={{ color: '#4a6080', fontSize: 9, marginTop: 4 }}>CAÍDAS: {deaths}</div>
        </div>
      )}

      {screen === 'menu' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: 'rgba(0,3,8,0.88)',
          backdropFilter: 'blur(6px)', textAlign: 'center', padding: 24,
        }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${CYAN}aa`, marginBottom: 14 }}>
            // DIGIZ -- RECONSTRUCCIÓN 3D
          </div>
          <h1 style={{
            fontFamily: mono, fontSize: 40, fontWeight: 700, letterSpacing: 6, color: CYAN,
            textShadow: `0 0 40px ${CYAN}66`, marginBottom: 18,
          }}>
            DIGIZ // BABYLON
          </h1>
          <p style={{ fontFamily: mono, fontSize: 12, color: '#8fb8d6', maxWidth: 480, lineHeight: 1.9, marginBottom: 36 }}>
            Mismo concepto que el original -- una esfera que persigue tu mouse o tu dedo,
            esquivando peligros hasta el portal -- pero reconstruido desde cero en Babylon.js:
            geometría, niveles y texturas generados en código, nada importado.
          </p>
          <button
            onClick={startGame}
            className="cyber-btn"
            style={{
              fontFamily: mono, fontSize: 13, letterSpacing: 4, color: CYAN, background: 'rgba(0,212,255,0.06)',
              border: `1px solid ${CYAN}88`, padding: '14px 44px', cursor: 'pointer', marginBottom: 20,
            }}
          >
            [ JUGAR ]
          </button>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#4a6080' }}>
            MOUSE / DEDO SOBRE EL PISO — TE SIGUE HASTA EL PORTAL
          </div>
        </div>
      )}

      {screen === 'win' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: 'rgba(0,3,8,0.9)',
          backdropFilter: 'blur(6px)', textAlign: 'center', padding: 24,
        }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${PORTAL}aa`, marginBottom: 14 }}>
            // SEÑAL ESTABLE
          </div>
          <h1 style={{
            fontFamily: mono, fontSize: 36, fontWeight: 700, letterSpacing: 6, color: PORTAL,
            textShadow: `0 0 40px ${PORTAL}66`, marginBottom: 18,
          }}>
            COMPLETADO
          </h1>
          <p style={{ fontFamily: mono, fontSize: 12, color: '#8fb8d6', marginBottom: 10 }}>
            {TOTAL_LEVELS} niveles, {deaths} caídas.
          </p>
          <button
            onClick={startGame}
            style={{
              fontFamily: mono, fontSize: 12, letterSpacing: 3, color: PORTAL, background: 'rgba(0,255,204,0.06)',
              border: `1px solid ${PORTAL}88`, padding: '12px 36px', cursor: 'pointer', marginTop: 18,
            }}
          >
            [ DE NUEVO ]
          </button>
        </div>
      )}
    </div>
  )
}
