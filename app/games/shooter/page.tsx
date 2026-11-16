'use client'

// SHOOTER — primer corte de un FPS mobile-first, estilo COD Mobile: joystick
// analógico para moverse + arrastre con el dedo para apuntar + botón de
// disparo, todo sobre teclado+mouse con pointer lock en desktop. Arranca
// como "campo de tiro": blancos con vaivén simple, sin IA.
//
// El arma y los brazos en primera persona son PLACEHOLDER a propósito —
// cajas y cilindros con proporciones pensadas, no el asset final. El plan
// (confirmado con el usuario) es reemplazar esta geometría por un modelo
// real generado en Hunyuan3D más adelante; por eso el viewmodel entero
// cuelga de un único TransformNode (vmRoot) con el sway/recoil manejado
// por transform puro, sin rig — el reemplazo solo necesita calzar un mesh
// nuevo bajo ese mismo nodo, no reescribir la animación.
//
// Mismo patrón imperativo de Babylon.js que /games/spaceship (import
// dinámico, engine en el scope del efecto, sin SSR).

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { TouchJoystick, TouchActionButton, useIsTouchDevice } from '@/components/games/TouchControls'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'
const GREEN = '#00ff9d'

export default function ShooterGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const moveVecRef = useRef({ x: 0, y: 0 })
  const yawPitchRef = useRef({ yaw: 0, pitch: 0 })
  const shootFnRef = useRef<() => void>(() => {})
  const lookDragId = useRef<number | null>(null)
  const lookLast = useRef({ x: 0, y: 0 })
  const [score, setScore] = useState(0)
  const [locked, setLocked] = useState(false)
  const isTouch = useIsTouchDevice()

  useEffect(() => {
    if (!canvasRef.current) return
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
      scene.clearColor = new B.Color4(0.008, 0.012, 0.015, 1)
      scene.fogMode = B.Scene.FOGMODE_EXP2
      scene.fogDensity = 0.01
      scene.fogColor = new B.Color3(0.01, 0.015, 0.018)

      const camera = new B.FreeCamera('cam', new B.Vector3(0, 1.7, -14), scene)
      camera.minZ = 0.05
      camera.fov = 1.0
      camera.inputs.clear() // control manual -- joystick/arrastre propios, no el default de Babylon

      // Paleta de callejón neón (referencia visual del usuario: violeta/magenta
      // con acentos cian, no el verde industrial de /lab/primercuerpo) --
      // luz de relleno fría + una luz puntual magenta y otra cian para que el
      // ambiente lea "alley" y no "laboratorio".
      const hemi = new B.HemisphericLight('h', new B.Vector3(0, 1, 0), scene)
      hemi.intensity = 0.35
      hemi.diffuse = new B.Color3(0.6, 0.55, 0.8)
      const magentaLight = new B.PointLight('magenta', new B.Vector3(-8, 3, 12), scene)
      magentaLight.diffuse = B.Color3.FromHexString('#c026ff')
      magentaLight.intensity = 0.8
      const cyanLight = new B.PointLight('cyan', new B.Vector3(8, 3, 20), scene)
      cyanLight.diffuse = B.Color3.FromHexString('#19c2ff')
      cyanLight.intensity = 0.8

      const glow = new B.GlowLayer('glow', scene)
      glow.intensity = 0.7

      // --- campo de tiro: piso + pared de fondo + señas de neón simples ---
      const ground = B.MeshBuilder.CreateGround('ground', { width: 44, height: 70 }, scene)
      ground.position.z = 18
      const groundMat = new B.StandardMaterial('groundMat', scene)
      groundMat.diffuseColor = new B.Color3(0.05, 0.04, 0.07)
      groundMat.specularColor = B.Color3.Black()
      ground.material = groundMat

      const backWall = B.MeshBuilder.CreateBox('backWall', { width: 44, height: 10, depth: 0.5 }, scene)
      backWall.position.set(0, 5, 26)
      const wallMat = new B.StandardMaterial('wallMat', scene)
      wallMat.diffuseColor = new B.Color3(0.025, 0.02, 0.04)
      backWall.material = wallMat

      const neonColors = ['#c026ff', '#19c2ff', '#ff2d6b']
      for (let i = 0; i < 7; i++) {
        const sign = B.MeshBuilder.CreateBox(`sign_${i}`, { width: 0.15, height: 1.6 + (i % 3) * 0.6, depth: 0.9 }, scene)
        const side = i % 2 === 0 ? -1 : 1
        sign.position.set(side * 12.5, 2.4, 4 + i * 3.2)
        const sm = new B.StandardMaterial(`signMat_${i}`, scene)
        sm.diffuseColor = B.Color3.Black()
        sm.emissiveColor = B.Color3.FromHexString(neonColors[i % neonColors.length]).scale(0.7)
        sign.material = sm
      }

      // --- viewmodel: brazos + arma (ver nota de placeholder arriba) ---
      const vmRoot = new B.TransformNode('vmRoot', scene)
      vmRoot.parent = camera
      vmRoot.position.set(0.22, -0.32, 0.75)
      const vmBaseY = -0.32

      // Cuerpo claro + cruz roja/rosa de acento, siguiendo la referencia
      // visual del usuario (arma blanca con marcas rojas en cruz) en vez del
      // metal oscuro genérico de la primera versión.
      const metalMat = new B.StandardMaterial('metalMat', scene)
      metalMat.diffuseColor = new B.Color3(0.78, 0.8, 0.84)
      metalMat.specularColor = new B.Color3(0.5, 0.5, 0.55)

      const accentMat = new B.StandardMaterial('accentMat', scene)
      accentMat.diffuseColor = B.Color3.Black()
      accentMat.emissiveColor = B.Color3.FromHexString('#ff2d6b')

      const muzzleMat = new B.StandardMaterial('muzzleMat', scene)
      muzzleMat.diffuseColor = B.Color3.Black()
      muzzleMat.emissiveColor = B.Color3.FromHexString('#bfe9ff')

      const forearm = B.MeshBuilder.CreateBox('forearm', { width: 0.1, height: 0.1, depth: 0.5 }, scene)
      forearm.material = metalMat
      forearm.position.set(-0.16, -0.05, -0.08)
      forearm.rotation.x = 0.3
      forearm.parent = vmRoot

      const gunBody = B.MeshBuilder.CreateBox('gunBody', { width: 0.12, height: 0.14, depth: 0.55 }, scene)
      gunBody.material = metalMat
      gunBody.parent = vmRoot
      const barrel = B.MeshBuilder.CreateCylinder('barrel', { diameter: 0.05, height: 0.4, tessellation: 8 }, scene)
      barrel.rotation.x = Math.PI / 2
      barrel.position.set(0, 0.01, 0.42)
      barrel.material = metalMat
      barrel.parent = vmRoot
      // Cruz de acento sobre el cuerpo del arma -- dos barras, no una sola
      // franja, para que se lea como cruz (igual que la referencia) y no
      // como una simple línea decorativa.
      const accentLong = B.MeshBuilder.CreateBox('accentLong', { width: 0.025, height: 0.025, depth: 0.42 }, scene)
      accentLong.position.set(0, 0.07, 0.02)
      accentLong.material = accentMat
      accentLong.parent = vmRoot
      const accentCross = B.MeshBuilder.CreateBox('accentCross', { width: 0.14, height: 0.025, depth: 0.025 }, scene)
      accentCross.position.set(0, 0.07, 0.1)
      accentCross.material = accentMat
      accentCross.parent = vmRoot
      const grip = B.MeshBuilder.CreateBox('grip', { width: 0.08, height: 0.22, depth: 0.1 }, scene)
      grip.material = metalMat
      grip.position.set(0, -0.14, -0.15)
      grip.rotation.x = 0.3
      grip.parent = vmRoot

      const muzzleFlash = B.MeshBuilder.CreateSphere('muzzle', { diameter: 0.12 }, scene)
      muzzleFlash.material = muzzleMat
      muzzleFlash.position.set(0, 0.01, 0.65)
      muzzleFlash.parent = vmRoot
      muzzleFlash.setEnabled(false)

      // --- blancos: vaivén simple, sin IA (a propósito -- ver alcance v1) ---
      type Target = { mesh: any; baseX: number; phase: number }
      const targets: Target[] = []
      for (let i = 0; i < 6; i++) {
        const t = B.MeshBuilder.CreateBox(`target_${i}`, { size: 0.9 }, scene)
        const tm = new B.StandardMaterial(`targetMat_${i}`, scene)
        tm.diffuseColor = new B.Color3(0.04, 0.04, 0.04)
        tm.emissiveColor = B.Color3.FromHexString(GREEN).scale(0.45)
        t.material = tm
        const baseX = (i - 2.5) * 4.4
        const baseZ = 10 + (i % 3) * 4.5
        t.position.set(baseX, 1.2, baseZ)
        targets.push({ mesh: t, baseX, phase: i * 1.3 })
      }

      // --- input: teclado/mouse en desktop, joystick+arrastre en touch ---
      const onKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true }
      const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      cleanupFns.push(() => window.removeEventListener('keydown', onKeyDown))
      cleanupFns.push(() => window.removeEventListener('keyup', onKeyUp))

      const SENSITIVITY = 0.0024
      const onMouseMove = (e: MouseEvent) => {
        if (document.pointerLockElement !== (canvas as unknown as Element)) return
        yawPitchRef.current.yaw += e.movementX * SENSITIVITY
        yawPitchRef.current.pitch -= e.movementY * SENSITIVITY
        yawPitchRef.current.pitch = Math.max(-1.3, Math.min(1.3, yawPitchRef.current.pitch))
      }
      window.addEventListener('mousemove', onMouseMove)
      cleanupFns.push(() => window.removeEventListener('mousemove', onMouseMove))

      const onLockChange = () => setLocked(document.pointerLockElement === (canvas as unknown as Element))
      document.addEventListener('pointerlockchange', onLockChange)
      cleanupFns.push(() => document.removeEventListener('pointerlockchange', onLockChange))

      let lastShot = 0
      let recoil = 0
      const shootOnce = () => {
        const now = performance.now()
        if (now - lastShot < 160) return // cadencia de disparo -- evita vaciar un click en un frame
        lastShot = now
        recoil = 1
        muzzleFlash.setEnabled(true)
        window.setTimeout(() => { if (!disposed) muzzleFlash.setEnabled(false) }, 50)

        const ray = camera.getForwardRay(200)
        const hit = scene.pickWithRay(ray, (m: any) => m.name.startsWith('target_'))
        if (hit?.hit && hit.pickedMesh) {
          setScore((s) => s + 1)
          const idx = targets.findIndex((tg) => tg.mesh === hit.pickedMesh)
          if (idx >= 0) {
            const tg = targets[idx]
            tg.mesh.position.x = (Math.random() - 0.5) * 18
            tg.mesh.position.y = 0.8 + Math.random() * 2.2
            tg.baseX = tg.mesh.position.x
          }
        }
      }
      shootFnRef.current = shootOnce

      const onCanvasClick = () => {
        if (!isTouch && document.pointerLockElement !== (canvas as unknown as Element)) { canvas.requestPointerLock?.(); return }
        shootOnce()
      }
      canvas.addEventListener('click', onCanvasClick)
      cleanupFns.push(() => canvas.removeEventListener('click', onCanvasClick))

      let last = performance.now()
      engine.runRenderLoop(() => {
        const now = performance.now()
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now

        camera.rotation.y = yawPitchRef.current.yaw
        camera.rotation.x = yawPitchRef.current.pitch

        let mx = 0
        let my = 0
        if (isTouch) {
          mx = moveVecRef.current.x
          my = moveVecRef.current.y
          if (keysRef.current['Fire']) shootOnce()
        } else {
          if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) my += 1
          if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) my -= 1
          if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) mx -= 1
          if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) mx += 1
          if (keysRef.current['Space']) shootOnce()
          const len = Math.hypot(mx, my)
          if (len > 1) { mx /= len; my /= len }
        }

        const yaw = yawPitchRef.current.yaw
        const forward = new B.Vector3(Math.sin(yaw), 0, Math.cos(yaw))
        const right = new B.Vector3(Math.cos(yaw), 0, -Math.sin(yaw))
        const speed = 4.2
        camera.position.addInPlace(forward.scale(my * speed * dt))
        camera.position.addInPlace(right.scale(mx * speed * dt))
        camera.position.x = Math.max(-20, Math.min(20, camera.position.x))
        camera.position.z = Math.max(-16, Math.min(22, camera.position.z))

        // sway + recoil del viewmodel -- transform puro, ver nota de arriba
        const t = now / 1000
        const moveAmt = Math.min(1, Math.hypot(mx, my))
        vmRoot.position.x = 0.22 + Math.sin(t * 6) * 0.01 * moveAmt
        vmRoot.position.y = vmBaseY + Math.abs(Math.sin(t * 7)) * 0.012 * moveAmt - recoil * 0.05
        vmRoot.rotation.x = -recoil * 0.25
        recoil *= 0.85

        for (const tg of targets) {
          tg.mesh.position.x = tg.baseX + Math.sin(t * 0.8 + tg.phase) * 1.4
        }

        scene.render()
      })

      const onResize = () => engine.resize()
      window.addEventListener('resize', onResize)
      cleanupFns.push(() => window.removeEventListener('resize', onResize))
    }

    init()

    return () => {
      disposed = true
      cleanupFns.forEach((fn) => fn())
      if (document.pointerLockElement === canvasRef.current) document.exitPointerLock?.()
      scene?.dispose()
      engine?.dispose()
    }
  }, [isTouch])

  // Arrastre con el dedo en la mitad derecha de la pantalla para apuntar --
  // separado del joystick (izquierda, movimiento) y del botón de disparo,
  // igual que en un shooter mobile real: tres gestos, tres zonas.
  const onLookDown = (e: React.PointerEvent) => {
    lookDragId.current = e.pointerId
    lookLast.current = { x: e.clientX, y: e.clientY }
  }
  const onLookMove = (e: React.PointerEvent) => {
    if (lookDragId.current !== e.pointerId) return
    const dx = e.clientX - lookLast.current.x
    const dy = e.clientY - lookLast.current.y
    lookLast.current = { x: e.clientX, y: e.clientY }
    const SENS = 0.0042
    yawPitchRef.current.yaw += dx * SENS
    yawPitchRef.current.pitch -= dy * SENS
    yawPitchRef.current.pitch = Math.max(-1.3, Math.min(1.3, yawPitchRef.current.pitch))
  }
  const onLookUp = (e: React.PointerEvent) => {
    if (lookDragId.current === e.pointerId) lookDragId.current = null
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100vh', display: 'block', touchAction: 'none' }} />

      {isTouch && (
        <div
          onPointerDown={onLookDown}
          onPointerMove={onLookMove}
          onPointerUp={onLookUp}
          onPointerCancel={onLookUp}
          style={{
            position: 'fixed', top: 0, right: 0, width: '55%', height: '100%', zIndex: 20,
            touchAction: 'none',
          }}
        />
      )}

      {isTouch && <TouchJoystick vecRef={moveVecRef} style={{ bottom: 36, left: 28 }} />}
      {isTouch && (
        // bottom:100 -- despeja el botón de Chat global (bottom:24,right:24),
        // mismo margen que usan /games/trickster y /games/wired.
        <TouchActionButton
          keysRef={keysRef}
          code="Fire"
          label="DISPARAR"
          style={{ bottom: 100, right: 28, width: 82, height: 82, borderRadius: '50%' }}
        />
      )}

      {/* mira */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 18, height: 18, zIndex: 15, pointerEvents: 'none',
      }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 1, background: `${GREEN}cc` }} />
        <div style={{ position: 'absolute', left: '50%', top: 0, height: '100%', width: 1, background: `${GREEN}cc` }} />
      </div>

      <Link href="/games" style={{
        position: 'fixed', top: 16, left: 16, zIndex: 25,
        fontFamily: mono, fontSize: 9, letterSpacing: 2, color: `${CYAN}aa`, textDecoration: 'none',
        border: `1px solid ${CYAN}44`, padding: '6px 12px', background: '#00050aaa',
      }}>
        ← PROXYGAMES
      </Link>

      <div style={{
        position: 'fixed', top: 16, right: 16, zIndex: 25,
        fontFamily: mono, fontSize: 11, letterSpacing: 2, color: GREEN,
        border: `1px solid ${GREEN}44`, padding: '6px 14px', background: '#00120aaa',
      }}>
        BLANCOS: {score}
      </div>

      {!isTouch && !locked && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 25,
          fontFamily: mono, fontSize: 9, letterSpacing: 1, color: `${CYAN}cc`, textAlign: 'center',
          border: `1px solid ${CYAN}33`, padding: '8px 16px', background: '#00050aaa',
        }}>
          CLIC PARA CAPTURAR EL MOUSE — WASD MOVER, MOUSE APUNTAR, CLIC/ESPACIO DISPARAR
        </div>
      )}

      {!isTouch && (
        <div style={{
          position: 'fixed', bottom: 6, left: 6, zIndex: 25,
          fontFamily: mono, fontSize: 8, letterSpacing: 0.5, color: `${CYAN}55`,
        }}>
          NPX-GAME-SHOOTER // v1 — campo de tiro. Arma/brazos: geometría placeholder, pendiente asset real.
        </div>
      )}
    </div>
  )
}
