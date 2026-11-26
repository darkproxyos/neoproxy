'use client'

// MÖBIUS — plataformero sobre una cinta de Möbius real (ver
// ./engine/mobius.ts): no es una pista circular con un efecto visual de
// giro pegado encima, es la superficie matemática real -- la cámara usa
// la normal real de la superficie como "arriba", así que el giro que se
// siente al pasar por la mitad del recorrido es consecuencia directa de
// la geometría, no una animación escrita a mano. Dar una vuelta completa
// (u: 0→2π) te deja en el mismo punto del anillo pero con el mundo
// rotado 180° a tu alrededor -- recién la segunda vuelta (u: 2π→4π)
// cierra el bucle de verdad.
//
// Mismo patrón imperativo de Babylon.js que /games/shooter (import
// dinámico, engine en el scope del efecto, sin SSR), y mismo esquema de
// input que /games/wired (TouchDPad por e.code, así que ArrowLeft/
// ArrowRight/Space funcionan igual en touch y en teclado sin ramas
// separadas).

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { TouchDPad, TouchActionButton, useIsTouchDevice } from '@/components/games/TouchControls'
import {
  mobiusPoint, mobiusFrame, generateCourse, RING_RADIUS, HALF_WIDTH, RAIL_MARGIN, TOTAL_U, LAP_U,
  type CourseItem,
} from './engine/mobius'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'
const MAGENTA = '#ff2ecb'
const GOLD = '#ffc93d'
const RED = '#ff3b3b'

type Status = 'playing' | 'gameover' | 'win'

const FORWARD_SPEED = 0.34 // rad/s de u -- toda la pista (4π) en ~37s
const STRAFE_SPEED = 3.6
const EYE_HEIGHT = 0.95
const JUMP_DURATION = 0.55
const JUMP_HEIGHT = 1.35
const ORB_RADIUS = 1.15
const OBSTACLE_RADIUS = 1.05

export default function MobiusGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const [score, setScore] = useState(0)
  const [lap, setLap] = useState(0)
  const [status, setStatus] = useState<Status>('playing')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [runId, setRunId] = useState(0)
  const isTouch = useIsTouchDevice()

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.()
        await (screen as any).orientation?.lock?.('landscape')
      } else {
        await document.exitFullscreen?.()
      }
    } catch {
      // Sin soporte o el usuario lo rechazó -- se sigue jugando igual.
    }
  }

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  useEffect(() => {
    if (isTouch === null || !canvasRef.current) return
    let engine: any
    let scene: any
    let disposed = false
    const cleanupFns: Array<() => void> = []

    const init = async () => {
      const B = await import('@babylonjs/core')
      if (disposed) return
      const canvas = canvasRef.current!
      engine = new B.Engine(canvas, true)
      scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0.01, 0.008, 0.02, 1)
      scene.fogMode = B.Scene.FOGMODE_EXP2
      scene.fogDensity = 0.012
      scene.fogColor = new B.Color3(0.015, 0.01, 0.025)

      const camera = new B.FreeCamera('cam', new B.Vector3(RING_RADIUS, EYE_HEIGHT, 0), scene)
      camera.minZ = 0.05
      camera.fov = 1.05
      camera.inputs.clear()

      const hemi = new B.HemisphericLight('h', new B.Vector3(0, 1, 0), scene)
      hemi.intensity = 0.4
      hemi.diffuse = new B.Color3(0.6, 0.6, 0.85)
      const glow = new B.GlowLayer('glow', scene)
      glow.intensity = 0.9

      // --- vacío estrellado de fondo ---
      const starMat = new B.StandardMaterial('starMat', scene)
      starMat.diffuseColor = B.Color3.Black()
      starMat.emissiveColor = new B.Color3(0.8, 0.8, 0.9)
      for (let i = 0; i < 160; i++) {
        const star = B.MeshBuilder.CreateSphere(`star_${i}`, { diameter: 0.08 + Math.random() * 0.1 }, scene)
        const r = 60 + Math.random() * 60
        const theta = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI
        star.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta))
        star.material = starMat
      }

      // --- la cinta real: dos bordes (v = ±HALF_WIDTH) como paths de un
      // ribbon -- eso es, literalmente, la construcción clásica de
      // superficie reglada de una cinta de Möbius (un segmento recto que
      // rota mientras recorre el anillo), no una aproximación. ---
      const STEPS = 260
      const leftPath: any[] = []
      const rightPath: any[] = []
      const leftRailPath: any[] = []
      const rightRailPath: any[] = []
      const railV = HALF_WIDTH - RAIL_MARGIN
      for (let i = 0; i <= STEPS; i++) {
        const u = (i / STEPS) * TOTAL_U
        const pL = mobiusPoint(u, -HALF_WIDTH)
        const pR = mobiusPoint(u, HALF_WIDTH)
        leftPath.push(new B.Vector3(pL.x, pL.y, pL.z))
        rightPath.push(new B.Vector3(pR.x, pR.y, pR.z))
        const rL = mobiusPoint(u, -railV)
        const rR = mobiusPoint(u, railV)
        leftRailPath.push(new B.Vector3(rL.x, rL.y, rL.z))
        rightRailPath.push(new B.Vector3(rR.x, rR.y, rR.z))
      }

      const ribbon = B.MeshBuilder.CreateRibbon('ribbon', {
        pathArray: [leftPath, rightPath], sideOrientation: B.Mesh.DOUBLESIDE,
      }, scene)
      const ribbonMat = new B.StandardMaterial('ribbonMat', scene)
      ribbonMat.diffuseColor = new B.Color3(0.05, 0.04, 0.09)
      ribbonMat.specularColor = new B.Color3(0.08, 0.08, 0.1)
      ribbonMat.alpha = 0.92
      ribbon.material = ribbonMat

      // malla fina encima, mismo mesh, para que la superficie no se lea
      // como un plano liso sin referencia de movimiento
      const wire = B.MeshBuilder.CreateRibbon('ribbonWire', {
        pathArray: [leftPath, rightPath], sideOrientation: B.Mesh.DOUBLESIDE,
      }, scene)
      const wireMat = new B.StandardMaterial('wireMat', scene)
      wireMat.wireframe = true
      wireMat.emissiveColor = new B.Color3(0.1, 0.25, 0.3)
      wireMat.diffuseColor = B.Color3.Black()
      wire.material = wireMat

      // --- los dos bordes, en colores que SE VEN cambiar de lado al dar
      // la vuelta: es la prueba visual más directa de que el giro es real ---
      const leftRailMat = new B.StandardMaterial('leftRailMat', scene)
      leftRailMat.diffuseColor = B.Color3.Black()
      leftRailMat.emissiveColor = B.Color3.FromHexString(CYAN)
      const rightRailMat = new B.StandardMaterial('rightRailMat', scene)
      rightRailMat.diffuseColor = B.Color3.Black()
      rightRailMat.emissiveColor = B.Color3.FromHexString(MAGENTA)

      const leftRail = B.MeshBuilder.CreateTube('leftRail', { path: leftRailPath, radius: 0.12, cap: B.Mesh.CAP_ALL }, scene)
      leftRail.material = leftRailMat
      const rightRail = B.MeshBuilder.CreateTube('rightRail', { path: rightRailPath, radius: 0.12, cap: B.Mesh.CAP_ALL }, scene)
      rightRail.material = rightRailMat

      // --- marcador de inicio/meta: un anillo fijo en el espacio real en
      // u=0. El jugador lo va a volver a ver en u=2π (mismo lugar en 3D,
      // pero con la cámara invertida respecto de la primera vez) y de
      // nuevo en u=4π (ahí sí, igual que al principio). ---
      const marker = B.MeshBuilder.CreateTorus('marker', { diameter: HALF_WIDTH * 2 + 1, thickness: 0.15, tessellation: 48 }, scene)
      const pMarker = mobiusPoint(0, 0)
      marker.position.set(pMarker.x, pMarker.y, pMarker.z)
      marker.rotation.x = Math.PI / 2
      const markerMat = new B.StandardMaterial('markerMat', scene)
      markerMat.diffuseColor = B.Color3.Black()
      markerMat.emissiveColor = B.Color3.FromHexString(GOLD)
      marker.material = markerMat

      // --- ítems del recorrido: orbes (recolectar) y obstáculos (saltar) ---
      const course = generateCourse(7)
      const itemMeshes: { item: CourseItem; mesh: any; done: boolean }[] = []
      const orbMat = new B.StandardMaterial('orbMat', scene)
      orbMat.diffuseColor = B.Color3.Black()
      orbMat.emissiveColor = B.Color3.FromHexString(GOLD)
      const obstacleMat = new B.StandardMaterial('obstacleMat', scene)
      obstacleMat.diffuseColor = B.Color3.Black()
      obstacleMat.emissiveColor = B.Color3.FromHexString(RED)

      for (const item of course) {
        const frame = mobiusFrame(item.u, item.v)
        const float = item.kind === 'orb' ? 0.9 : 0.55
        const mesh = item.kind === 'orb'
          ? B.MeshBuilder.CreateSphere(`orb_${item.u.toFixed(2)}`, { diameter: 0.55 }, scene)
          : B.MeshBuilder.CreateBox(`obs_${item.u.toFixed(2)}`, { size: 0.9 }, scene)
        mesh.position.set(
          frame.position.x + frame.normal.x * float,
          frame.position.y + frame.normal.y * float,
          frame.position.z + frame.normal.z * float,
        )
        mesh.material = item.kind === 'orb' ? orbMat : obstacleMat
        itemMeshes.push({ item, mesh, done: false })
      }

      // --- estado del jugador, fuera de React (perf: se actualiza cada
      // frame, no tiene sentido pagar un re-render por eso) ---
      const player = { u: 0.001, v: 0, targetV: 0, jumpT: -1 }
      let localScore = 0
      let localStatus: Status = 'playing'
      let lastLapShown = 0

      const onKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true }
      const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      cleanupFns.push(() => window.removeEventListener('keydown', onKeyDown))
      cleanupFns.push(() => window.removeEventListener('keyup', onKeyUp))

      const onResize = () => engine.resize()
      window.addEventListener('resize', onResize)
      cleanupFns.push(() => window.removeEventListener('resize', onResize))

      let last = performance.now()
      engine.runRenderLoop(() => {
        const now = performance.now()
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now

        if (localStatus === 'playing') {
          let strafe = 0
          if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) strafe -= 1
          if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) strafe += 1
          player.targetV = Math.max(-1, Math.min(1, player.targetV + strafe * dt * 2.2)) * (HALF_WIDTH - RAIL_MARGIN - 0.5)
          player.v += (player.targetV - player.v) * Math.min(1, dt * 6)

          if ((keysRef.current['Space'] || keysRef.current['Jump']) && player.jumpT < 0) {
            player.jumpT = 0
          }
          if (player.jumpT >= 0) {
            player.jumpT += dt
            if (player.jumpT > JUMP_DURATION) player.jumpT = -1
          }

          player.u += FORWARD_SPEED * dt

          const newLap = Math.min(2, Math.floor(player.u / LAP_U))
          if (newLap !== lastLapShown) {
            lastLapShown = newLap
            setLap(newLap)
          }

          if (player.u >= TOTAL_U) {
            player.u = TOTAL_U
            localStatus = 'win'
            setStatus('win')
          }
        }

        const jumpOffset = player.jumpT >= 0
          ? JUMP_HEIGHT * Math.sin((player.jumpT / JUMP_DURATION) * Math.PI)
          : 0

        const frame = mobiusFrame(player.u, player.v)
        const up = frame.normal
        const eyeX = frame.position.x + up.x * (EYE_HEIGHT + jumpOffset)
        const eyeY = frame.position.y + up.y * (EYE_HEIGHT + jumpOffset)
        const eyeZ = frame.position.z + up.z * (EYE_HEIGHT + jumpOffset)

        camera.upVector.set(up.x, up.y, up.z)
        camera.position.set(eyeX, eyeY, eyeZ)
        camera.setTarget(new B.Vector3(
          eyeX + frame.forward.x * 5,
          eyeY + frame.forward.y * 5,
          eyeZ + frame.forward.z * 5,
        ))

        if (localStatus === 'playing') {
          for (const entry of itemMeshes) {
            if (entry.done) continue
            const dx = entry.mesh.position.x - eyeX
            const dy = entry.mesh.position.y - eyeY
            const dz = entry.mesh.position.z - eyeZ
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
            if (entry.item.kind === 'orb') {
              if (dist < ORB_RADIUS) {
                entry.done = true
                entry.mesh.setEnabled(false)
                localScore += 1
                setScore(localScore)
              }
            } else {
              // saltando lo suficientemente alto, el obstáculo no te toca
              if (dist < OBSTACLE_RADIUS && jumpOffset < 0.6) {
                entry.done = true
                localStatus = 'gameover'
                setStatus('gameover')
              }
            }
          }
        }

        scene.render()
      })
    }

    init()

    return () => {
      disposed = true
      cleanupFns.forEach((fn) => fn())
      scene?.dispose()
      engine?.dispose()
    }
  }, [isTouch, runId])

  const restart = () => {
    setScore(0)
    setLap(0)
    setStatus('playing')
    setRunId(r => r + 1)
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100vh', display: 'block', touchAction: 'none' }} />

      {isTouch && <TouchDPad keysRef={keysRef} bottom={28} />}
      {isTouch && (
        <TouchActionButton
          keysRef={keysRef} code="Jump" label="SALTAR"
          style={{ bottom: 100, right: 28, width: 82, height: 82, borderRadius: '50%' }}
        />
      )}

      <Link className="tap-ext" href="/games" style={{
        position: 'fixed', top: 16, left: 16, zIndex: 25,
        fontFamily: mono, fontSize: 9, letterSpacing: 2, color: `${CYAN}aa`, textDecoration: 'none',
        border: `1px solid ${CYAN}44`, padding: '6px 12px', background: '#00050aaa',
      }}>
        ← PROXYGAMES
      </Link>

      <div style={{
        position: 'fixed', top: 16, right: 16, zIndex: 25, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
      }}>
        <div style={{
          fontFamily: mono, fontSize: 11, letterSpacing: 2, color: GOLD,
          border: `1px solid ${GOLD}44`, padding: '6px 14px', background: '#0a0800aa',
        }}>
          ORBES: {score}
        </div>
        <div style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 2, color: `${CYAN}cc`,
          border: `1px solid ${CYAN}33`, padding: '4px 12px', background: '#00050aaa',
        }}>
          VUELTA {lap} / 2
        </div>
        <button onClick={toggleFullscreen} style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 2, cursor: 'pointer', padding: '4px 12px',
          background: isFullscreen ? `${CYAN}22` : '#00050aaa',
          border: `1px solid ${isFullscreen ? CYAN : '#ffffff33'}`, color: isFullscreen ? CYAN : '#8892a4',
        }}>
          {isFullscreen ? '⛶ SALIR' : '⛶ PANTALLA COMPLETA'}
        </button>
      </div>

      {status !== 'playing' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,2,5,0.78)',
        }}>
          <div style={{
            textAlign: 'center', fontFamily: mono, padding: '32px 40px',
            border: `1px solid ${status === 'win' ? GOLD : RED}66`, background: '#000a',
          }}>
            <div style={{
              fontSize: 22, letterSpacing: 4, color: status === 'win' ? GOLD : RED, marginBottom: 16,
              textShadow: `0 0 24px ${status === 'win' ? GOLD : RED}88`,
            }}>
              {status === 'win' ? 'COMPLETASTE EL BUCLE' : 'TE CHOCASTE'}
            </div>
            <p style={{ fontSize: 11, color: '#8fb8d6', lineHeight: 1.9, maxWidth: 360, margin: '0 0 24px' }}>
              {status === 'win'
                ? 'Dos vueltas para volver al mismo lugar, no una. En la primera, el mundo giró 180° a tu alrededor sin que lo sintieras como una caída -- esa es la cinta de Möbius de verdad, no un efecto.'
                : 'Un giro real no perdona distracción. Volvé a intentarlo.'}
            </p>
            <div style={{ fontSize: 11, color: GOLD, marginBottom: 20 }}>ORBES RECOLECTADOS: {score}</div>
            <button onClick={restart} style={{
              fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '10px 24px', cursor: 'pointer',
              background: `${CYAN}14`, border: `1px solid ${CYAN}88`, color: CYAN,
            }}>
              ◆ REINTENTAR
            </button>
          </div>
        </div>
      )}

      {!isTouch && status === 'playing' && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 25,
          fontFamily: mono, fontSize: 9, letterSpacing: 1, color: `${CYAN}cc`, textAlign: 'center',
          border: `1px solid ${CYAN}33`, padding: '8px 16px', background: '#00050aaa',
        }}>
          ←→ / A D PARA MOVERTE DE CARRIL — ESPACIO PARA SALTAR OBSTÁCULOS
        </div>
      )}

      {!isTouch && (
        <div style={{
          position: 'fixed', bottom: 6, left: 6, zIndex: 25,
          fontFamily: mono, fontSize: 8, letterSpacing: 0.5, color: `${CYAN}55`,
        }}>
          NPX-GAME-MOBIUS // v1 — cinta de Möbius real, no un efecto. Ver /archivo/autoorganizacion y /archivo/cibernetica.
        </div>
      )}
    </div>
  )
}
