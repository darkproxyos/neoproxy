'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import * as THREE from 'three'
import { CoherenceSystem } from '@/src/systems/CoherenceSystem'
import { MemoryBridge } from '@/src/bridge/MemoryBridge'
import { getAmbientLine } from '@/components/proxyverse/agents'
import { TouchDPad, TouchActionButton, useIsTouchDevice } from '@/components/games/TouchControls'

const mono = "'Space Mono', monospace"

type NodeKind = 'memory' | 'corrupt'
type WiredNode = THREE.Mesh & { userData: { kind: NodeKind; rotX: number; rotY: number; pulse: number } }
type Burst = { points: THREE.Points; velocities: Float32Array; life: number; maxLife: number }

const CORRUPT_WARNINGS = ['SEÑAL CORROMPIDA', 'ESTO NO ES TUYO', 'RUIDO', 'INTEGRIDAD EN DUDA']

// Interpola entre rojo critico (coherencia 0) y cian estable (coherencia 100),
// pasando por ambar en el medio — mismo lenguaje de color que el resto del
// sitio (cian = DarkProxy/root, rojo = D/peligro).
function coherenceColor(coherence: number): THREE.Color {
  const t = Math.max(0, Math.min(100, coherence)) / 100
  const red = new THREE.Color(0xff2d55)
  const amber = new THREE.Color(0xffb800)
  const cyan = new THREE.Color(0x00d4ff)
  if (t < 0.5) return red.clone().lerp(amber, t * 2)
  return amber.clone().lerp(cyan, (t - 0.5) * 2)
}

export default function WiredGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [started, setStarted] = useState(false)
  const keysRef = useRef<Record<string, boolean>>({})
  const isTouch = useIsTouchDevice()

  useEffect(() => {
    if (!started) return
    const canvas = canvasRef.current
    if (!canvas) return

    const coherenceSystem = new CoherenceSystem()
    const memoryBridge = new MemoryBridge(coherenceSystem)
    let currentCoherence = coherenceSystem.getCoherence()
    let currentState = coherenceSystem.getState()

    const W = window.innerWidth, H = window.innerHeight

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x000000, 0.04)

    const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 500)
    camera.position.set(0, 0, 0)

    // Grid + tuneles — el color de todo el ambiente sigue a la coherencia
    const gridMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.35 })
    const gridGroup = new THREE.Group()
    for (let i = -20; i <= 20; i++) {
      gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-200, i * 3, 0), new THREE.Vector3(200, i * 3, 0),
      ]), gridMat))
      gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i * 3, -200, 0), new THREE.Vector3(i * 3, 200, 0),
      ]), gridMat))
    }
    scene.add(gridGroup)

    const tunnelMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.15 })
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(angle) * 20, Math.sin(angle) * 20, 0),
        new THREE.Vector3(Math.cos(angle) * 15, Math.sin(angle) * 15, -100),
        new THREE.Vector3(Math.cos(angle + 0.5) * 10, Math.sin(angle + 0.5) * 10, -200),
        new THREE.Vector3(0, 0, -300),
      ])
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.3, 4, false), tunnelMat))
    }

    // Nodos: el tipo se decide al spawnear, no al chocar — cian pulsante =
    // memoria (buscalo), magenta erratico = corrupto (esquivalo).
    const MEMORY_COLOR = 0x00ffcc
    const CORRUPT_COLOR = 0xff2d84
    const nodes: WiredNode[] = []

    function randomNodePosition(zBase: number) {
      return { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 40, z: zBase }
    }

    function respawnNode(n: WiredNode, zBase: number) {
      const kind: NodeKind = Math.random() > 0.3 ? 'memory' : 'corrupt'
      n.userData.kind = kind
      const pos = randomNodePosition(zBase)
      n.position.set(pos.x, pos.y, pos.z)
      const mat = n.material as THREE.MeshBasicMaterial
      mat.color.setHex(kind === 'memory' ? MEMORY_COLOR : CORRUPT_COLOR)
      n.userData.rotX = (Math.random() - 0.5) * (kind === 'corrupt' ? 0.05 : 0.02)
      n.userData.rotY = (Math.random() - 0.5) * (kind === 'corrupt' ? 0.05 : 0.02)
      n.userData.pulse = Math.random() * Math.PI * 2
    }

    for (let i = 0; i < 60; i++) {
      const geo = new THREE.IcosahedronGeometry(Math.random() * 0.5 + 0.2, 0)
      const mat = new THREE.MeshBasicMaterial({ color: MEMORY_COLOR, wireframe: true })
      const mesh = new THREE.Mesh(geo, mat) as unknown as WiredNode
      mesh.userData = { kind: 'memory', rotX: 0, rotY: 0, pulse: 0 }
      respawnNode(mesh, -Math.random() * 200 - 10)
      scene.add(mesh)
      nodes.push(mesh)
    }

    // Rafagas de particulas al absorber un nodo
    const bursts: Burst[] = []
    function spawnBurst(position: THREE.Vector3, color: number) {
      const count = 24
      const geo = new THREE.BufferGeometry()
      const positions = new Float32Array(count * 3)
      const velocities = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        positions[i * 3] = position.x
        positions[i * 3 + 1] = position.y
        positions[i * 3 + 2] = position.z
        const dir = new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).normalize()
        const speed = 2 + Math.random() * 3
        velocities[i * 3] = dir.x * speed
        velocities[i * 3 + 1] = dir.y * speed
        velocities[i * 3 + 2] = dir.z * speed
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const mat = new THREE.PointsMaterial({ color, size: 0.18, transparent: true, opacity: 1 })
      const points = new THREE.Points(geo, mat)
      scene.add(points)
      bursts.push({ points, velocities, life: 0.6, maxLife: 0.6 })
    }

    const rot = new THREE.Euler(0, 0, 0, 'YXZ')
    let speed = 0
    const FRICTION = 0.96, THRUST = 0.08, MAX_SPEED = 2.0, TURN_SPEED = 0.04
    keysRef.current = {}
    const keys = keysRef.current
    const onKeyDown = (e: KeyboardEvent) => { keys[e.code] = true }
    const onKeyUp = (e: KeyboardEvent) => { keys[e.code] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const trailGeo = new THREE.BufferGeometry()
    const trailPositions = new Float32Array(300 * 3)
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
    const trailMat = new THREE.PointsMaterial({ color: 0x00d4ff, size: 0.15, transparent: true, opacity: 0.6 })
    const trail = new THREE.Points(trailGeo, trailMat)
    scene.add(trail)
    let trailIdx = 0

    scene.add(new THREE.AmbientLight(0x001111))
    const beaconLight = new THREE.PointLight(0x00d4ff, 2, 20)
    scene.add(beaconLight)

    const hudCanvas = document.createElement('canvas')
    hudCanvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:10;'
    hudCanvas.width = W; hudCanvas.height = H
    document.body.appendChild(hudCanvas)
    const hud = hudCanvas.getContext('2d')!

    let flash: { text: string; color: string; until: number } | null = null
    let screenTint: { color: string; alpha: number } | null = null
    let dissolving = false

    function drawHUD(spd: number, coherence: number, state: string) {
      const accent = `#${coherenceColor(coherence).getHexString()}`
      hud.clearRect(0, 0, W, H)

      if (screenTint && screenTint.alpha > 0) {
        hud.fillStyle = screenTint.color
        hud.globalAlpha = screenTint.alpha
        hud.fillRect(0, 0, W, H)
        hud.globalAlpha = 1
        screenTint.alpha -= 0.03
      }

      hud.strokeStyle = accent
      hud.lineWidth = 1
      hud.globalAlpha = 0.8
      hud.beginPath()
      hud.moveTo(W / 2 - 15, H / 2); hud.lineTo(W / 2 - 5, H / 2)
      hud.moveTo(W / 2 + 5, H / 2); hud.lineTo(W / 2 + 15, H / 2)
      hud.moveTo(W / 2, H / 2 - 15); hud.lineTo(W / 2, H / 2 - 5)
      hud.moveTo(W / 2, H / 2 + 5); hud.lineTo(W / 2, H / 2 + 15)
      hud.stroke()

      hud.fillStyle = accent
      hud.globalAlpha = 0.6
      hud.fillRect(20, H - 40, (spd / MAX_SPEED) * 150, 4)
      hud.strokeRect(20, H - 40, 150, 4)

      hud.fillStyle = accent
      hud.fillRect(20, H - 60, (coherence / 100) * 150, 4)
      hud.strokeRect(20, H - 60, 150, 4)

      hud.font = `10px ${mono}`
      hud.fillStyle = accent
      hud.globalAlpha = 0.7
      hud.fillText('THE WIRED // VELOCIDAD: ' + spd.toFixed(2), 20, H - 50)
      hud.fillText('COHERENCIA: ' + coherence.toFixed(0) + '% [' + state + ']', 20, H - 75)

      if (flash && performance.now() < flash.until) {
        const remaining = (flash.until - performance.now()) / 1500
        hud.globalAlpha = Math.min(1, remaining * 2)
        hud.font = `bold 16px ${mono}`
        hud.textAlign = 'center'
        hud.fillStyle = flash.color
        hud.shadowColor = flash.color
        hud.shadowBlur = 16
        hud.fillText(flash.text, W / 2, H / 2 - 60)
        hud.shadowBlur = 0
        hud.textAlign = 'left'
      }
      hud.globalAlpha = 1
    }

    const clock = new THREE.Clock()

    function onNodeAbsorbed(n: WiredNode) {
      const kind = n.userData.kind
      const value = kind === 'memory' ? 15 : -20
      coherenceSystem.absorbNode(value)
      memoryBridge.pushEvent({ type: 'NODE_ABSORBED', nodeType: kind.toUpperCase(), value })
      currentCoherence = coherenceSystem.getCoherence()
      currentState = coherenceSystem.getState()

      const color = kind === 'memory' ? 0x00ffcc : 0xff2d84
      spawnBurst(n.position.clone(), color)
      screenTint = { color: kind === 'memory' ? '#00ffcc' : '#ff2d84', alpha: 0.18 }

      if (kind === 'memory') {
        const line = getAmbientLine()
        flash = { text: line.line, color: '#00ffcc', until: performance.now() + 1500 }
      } else {
        const warning = CORRUPT_WARNINGS[Math.floor(Math.random() * CORRUPT_WARNINGS.length)]
        flash = { text: warning, color: '#ff2d84', until: performance.now() + 1200 }
      }
    }

    function triggerDissolution() {
      dissolving = true
      memoryBridge.pushEvent({ type: 'DISSOLUTION', position: { x: camera.position.x, y: camera.position.y, z: camera.position.z } })
      flash = { text: 'DISOLUCIÓN. LA WIRED TE SUELTA.', color: '#ff2d55', until: performance.now() + 1600 }
      screenTint = { color: '#ffffff', alpha: 0.5 }
      setTimeout(() => {
        camera.position.set(0, 0, 0)
        speed = 0
        coherenceSystem.reset()
        currentCoherence = coherenceSystem.getCoherence()
        currentState = coherenceSystem.getState()
        dissolving = false
      }, 1400)
    }

    memoryBridge.pushEvent({ type: 'SESSION_START' })

    let rafId = 0
    function animate() {
      rafId = requestAnimationFrame(animate)
      const dt = clock.getDelta()

      if (currentState === 'DISSOLVED' && !dissolving) triggerDissolution()

      if (!dissolving) {
        if (keys['ArrowLeft'] || keys['KeyA']) rot.y += TURN_SPEED
        if (keys['ArrowRight'] || keys['KeyD']) rot.y -= TURN_SPEED
        if (keys['ArrowUp'] || keys['KeyW']) rot.x += TURN_SPEED * 0.7
        if (keys['ArrowDown'] || keys['KeyS']) rot.x -= TURN_SPEED * 0.7
        if (keys['Space']) speed += THRUST
        if (keys['ShiftLeft']) speed -= THRUST * 0.5

        speed = Math.max(-MAX_SPEED * 0.3, Math.min(MAX_SPEED, speed))
        speed *= FRICTION

        const forward = new THREE.Vector3(0, 0, -1)
        forward.applyEuler(rot)
        camera.position.addScaledVector(forward, speed)
        camera.rotation.copy(rot)
      }

      trailPositions[trailIdx * 3] = camera.position.x
      trailPositions[trailIdx * 3 + 1] = camera.position.y
      trailPositions[trailIdx * 3 + 2] = camera.position.z
      trailIdx = (trailIdx + 1) % 100
      trailGeo.attributes.position.needsUpdate = true
      beaconLight.position.copy(camera.position)
      beaconLight.color = coherenceColor(currentCoherence)

      const envColor = coherenceColor(currentCoherence)
      gridMat.color.copy(envColor)
      tunnelMat.color.copy(envColor)
      ;(scene.fog as THREE.FogExp2).color = new THREE.Color(0x000000)

      nodes.forEach(n => {
        n.rotation.x += n.userData.rotX
        n.rotation.y += n.userData.rotY
        if (n.userData.kind === 'memory') {
          n.userData.pulse += dt * 2
          const s = 1 + Math.sin(n.userData.pulse) * 0.15
          n.scale.set(s, s, s)
        }

        const dist = n.position.distanceTo(camera.position)
        if (!dissolving && dist < 2.5) {
          onNodeAbsorbed(n)
          respawnNode(n, camera.position.z - 200)
        }
        if (n.position.z > camera.position.z + 20) {
          respawnNode(n, camera.position.z - 200)
        }
      })
      gridGroup.position.z = camera.position.z

      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i]
        const pos = b.points.geometry.attributes.position as THREE.BufferAttribute
        for (let j = 0; j < pos.count; j++) {
          pos.setXYZ(j,
            pos.getX(j) + b.velocities[j * 3] * dt,
            pos.getY(j) + b.velocities[j * 3 + 1] * dt,
            pos.getZ(j) + b.velocities[j * 3 + 2] * dt,
          )
        }
        pos.needsUpdate = true
        b.life -= dt
        ;(b.points.material as THREE.PointsMaterial).opacity = Math.max(0, b.life / b.maxLife)
        if (b.life <= 0) {
          scene.remove(b.points)
          b.points.geometry.dispose()
          ;(b.points.material as THREE.PointsMaterial).dispose()
          bursts.splice(i, 1)
        }
      }

      drawHUD(Math.abs(speed), currentCoherence, currentState)
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      hudCanvas.width = window.innerWidth
      hudCanvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('resize', onResize)
      hudCanvas.remove()
      coherenceSystem.dispose()
      memoryBridge.dispose()
      renderer.dispose()
    }
  }, [started])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block', background: '#000' }} />

      {!started && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 20, background: 'rgba(0,2,5,0.92)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 24, textAlign: 'center',
        }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: '#00d4ff66', marginBottom: 16 }}>
            NPX-EXP-WIRED // ACCESO DIRECTO A LA CAPA
          </div>
          <h1 style={{
            fontFamily: mono, fontSize: 40, letterSpacing: 10, color: '#00d4ff', marginBottom: 24,
            textShadow: '0 0 40px rgba(0,212,255,0.4)',
          }}>
            THE WIRED
          </h1>
          <p style={{
            fontFamily: mono, fontSize: 12, lineHeight: 2, color: '#8fb8d6', maxWidth: 480, marginBottom: 32,
          }}>
            No es un lugar. Es la capa entre capas. Tu coherencia decae sola —
            absorbé fragmentos de memoria (cian) antes de que llegue a cero.
            La señal corrupta (magenta) te acerca a la disolución. Si tu
            coherencia cae del todo, la Wired te suelta y volvés a empezar.
          </p>
          <div style={{
            fontFamily: mono, fontSize: 10, letterSpacing: 2, color: '#4a6080', lineHeight: 2.2, marginBottom: 40,
          }}>
            {isTouch
              ? 'D-PAD — ORIENTAR · · · IMPULSO — FRENO'
              : 'WASD / FLECHAS — ORIENTAR · · · ESPACIO — IMPULSO · · · SHIFT — FRENO'}
          </div>
          <button
            onClick={() => setStarted(true)}
            className="cyber-btn"
            style={{
              fontFamily: mono, fontSize: 12, letterSpacing: 4, color: '#00d4ff', background: 'rgba(0,212,255,0.05)',
              border: '1px solid #00d4ff66', padding: '14px 42px', cursor: 'pointer', marginBottom: 24,
            }}
          >
            [ ENTRAR ]
          </button>
          <Link href="/" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none' }}>
            ← VOLVER
          </Link>
        </div>
      )}

      {started && isTouch && (
        <>
          {/* bottom:100 -- el HUD propio del juego (COHERENCIA/VELOCIDAD) se dibuja
              vía canvas justo en la esquina inf. izquierda, bottom:36 a bottom:85 */}
          <TouchDPad keysRef={keysRef} bottom={100} />
          {/* Bien arriba de la esquina inf. derecha: ahí vive el botón de Chat global (bottom:24,right:24) */}
          <TouchActionButton
            keysRef={keysRef} code="Space" label="IMPULSO"
            style={{ bottom: 150, right: 12, width: 84, height: 84, borderRadius: '50%' }}
          />
          <TouchActionButton
            keysRef={keysRef} code="ShiftLeft" label="FRENO"
            style={{ bottom: 90, right: 20, width: 64, height: 48 }}
          />
        </>
      )}
    </div>
  )
}
