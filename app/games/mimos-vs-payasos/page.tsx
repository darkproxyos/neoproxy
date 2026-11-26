'use client'

// MIMOS VS PAYASOS — idea vieja del usuario, de hace años, retomada a
// pedido explícito ahora: "haz tu la primera versión". Geometría
// placeholder a propósito (mismo criterio que /games/shooter y
// /games/mobius -- cajas y esferas con proporciones pensadas, no el
// asset final).
//
// El contraste real entre los dos arquetipos es el motor del diseño:
// el mimo es silencioso y preciso (dos habilidades, cada una un gesto
// de mimo real -- el empujón contra resistencia invisible, y la pared
// invisible en la que queda "atrapado" -- reusada acá como mecánica de
// bloqueo/rebote), los payasos son ruidosos y numerosos (vienen en
// oleada, cuerpo a cuerpo o tirando tortas a distancia). Vista cenital
// fija sobre un ring de circo, no primera persona -- mucho más fácil
// de leer un combate de esquivar/bloquear contra varios enemigos que
// se acercan, que un FPS con IA de persecución en primera persona.
//
// v1.1 ("mejoralo", a pedido): SFX propio (components/games/
// mimosAudio.ts, mismo patrón Web Audio puro que shooterAudio.ts),
// vignette roja de pantalla completa al recibir daño (.mimos-hurt-flash
// en globals.css), ráfaga de confetti con gravedad y fade por partícula
// al derrotar un payaso, y un tercer tipo de enemigo -- Payaso Globo:
// rápido, de un solo golpe, con bamboleo perpendicular real en vez de
// acercarse en línea recta -- para que las oleadas más altas no sean
// solo "más de lo mismo".
//
// Mismo patrón imperativo de Babylon.js que /games/shooter (import
// dinámico, sin SSR) y mismo esquema de input por e.code que /games/
// wired -- TouchJoystick/TouchActionButton funcionan igual en touch y
// teclado.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { TouchJoystick, TouchActionButton, useIsTouchDevice } from '@/components/games/TouchControls'
import { MimosSfx } from '@/components/games/mimosAudio'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'
const RED = '#ff3b3b'
const ORANGE = '#ff8c1a'
const MAGENTA = '#ff2ecb'
const GREEN = '#7bff3d'
const WHITE = '#f0f0f5'

type Status = 'playing' | 'gameover'
type EnemyKind = 'bocina' | 'pastelero' | 'globo'
type Enemy = {
  mesh: any; kind: EnemyKind; hp: number; maxHp: number
  stunT: number; hitCooldown: number; throwCooldown: number; wobbleSeed: number
}
type Pie = { mesh: any; vx: number; vz: number; ttl: number }
type Burst = { mesh: any; mat: any; vx: number; vy: number; vz: number; ttl: number }

const ARENA_RADIUS = 13
const PLAYER_SPEED = 6.6
const PLAYER_MAX_HEALTH = 100
const PUSH_RANGE = 3.4
const PUSH_ARC_COS = Math.cos((70 * Math.PI) / 180) // media apertura del cono de empuje
const PUSH_COOLDOWN = 0.5
const PUSH_DAMAGE = 34
const PUSH_KNOCKBACK = 6.5
const WALL_COOLDOWN = 4.5
const WALL_DURATION = 1.3
const WALL_DISTANCE = 2.1
const WALL_HALF_WIDTH = 1.7
const WALL_BAND = 0.85
const BOCINA_HP = 46
const BOCINA_SPEED = 3.1
const BOCINA_CONTACT_RANGE = 1.35
const BOCINA_DAMAGE = 7
const BOCINA_HIT_INTERVAL = 0.6
const PASTELERO_HP = 30
const PASTELERO_PREF_RANGE = 6.5
const PASTELERO_THROW_INTERVAL = 1.9
const PASTELERO_DAMAGE = 11
const PIE_SPEED = 7.4
const GLOBO_HP = 16
const GLOBO_SPEED = 4.7
const GLOBO_CONTACT_RANGE = 1.1
const GLOBO_DAMAGE = 5
const GLOBO_HIT_INTERVAL = 0.5
const GLOBO_WOBBLE_FREQ = 3.4
const GLOBO_WOBBLE_AMP = 1.9

export default function MimosVsPayasosGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const moveVecRef = useRef({ x: 0, y: 0 })
  const sfxRef = useRef<MimosSfx | null>(null)
  const [health, setHealth] = useState(PLAYER_MAX_HEALTH)
  const [score, setScore] = useState(0)
  const [wave, setWave] = useState(1)
  const [status, setStatus] = useState<Status>('playing')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [runId, setRunId] = useState(0)
  const [wallPct, setWallPct] = useState(100)
  const [pushPct, setPushPct] = useState(100)
  const [hitFlash, setHitFlash] = useState(0)
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
      // sin soporte o rechazado -- se sigue jugando igual
    }
  }

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  useEffect(() => () => {
    sfxRef.current?.dispose()
    try { (screen as any).orientation?.unlock?.() } catch { /* sin soporte */ }
  }, [])

  useEffect(() => {
    if (isTouch === null || !canvasRef.current) return
    if (!sfxRef.current) sfxRef.current = new MimosSfx()
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
      scene.clearColor = new B.Color4(0.015, 0.01, 0.02, 1)
      scene.fogMode = B.Scene.FOGMODE_EXP2
      scene.fogDensity = 0.016
      scene.fogColor = new B.Color3(0.02, 0.015, 0.03)

      const camera = new B.FreeCamera('cam', new B.Vector3(0, 15.5, -11.5), scene)
      camera.setTarget(new B.Vector3(0, 0, 1.5))
      camera.fov = 0.78
      camera.inputs.clear()

      const hemi = new B.HemisphericLight('h', new B.Vector3(0, 1, 0), scene)
      hemi.intensity = 0.55
      hemi.diffuse = new B.Color3(0.75, 0.68, 0.8)
      const spot = new B.PointLight('spot', new B.Vector3(0, 10, 0), scene)
      spot.diffuse = B.Color3.FromHexString('#ffd9f0')
      spot.intensity = 0.6
      const glow = new B.GlowLayer('glow', scene)
      glow.intensity = 0.8

      // --- el ring ---
      const ring = B.MeshBuilder.CreateDisc('ring', { radius: ARENA_RADIUS, tessellation: 64 }, scene)
      ring.rotation.x = Math.PI / 2
      const ringMat = new B.StandardMaterial('ringMat', scene)
      ringMat.diffuseColor = new B.Color3(0.05, 0.035, 0.06)
      ringMat.specularColor = B.Color3.Black()
      ring.material = ringMat

      const border = B.MeshBuilder.CreateTorus('border', { diameter: ARENA_RADIUS * 2, thickness: 0.28, tessellation: 64 }, scene)
      border.position.y = 0.05
      const borderMat = new B.StandardMaterial('borderMat', scene)
      borderMat.diffuseColor = B.Color3.Black()
      borderMat.emissiveColor = B.Color3.FromHexString(CYAN).scale(0.55)
      border.material = borderMat

      // postes de carpa alrededor, puro ambiente
      const poleMat = new B.StandardMaterial('poleMat', scene)
      poleMat.diffuseColor = new B.Color3(0.08, 0.06, 0.1)
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2
        const pole = B.MeshBuilder.CreateCylinder(`pole_${i}`, { diameter: 0.4, height: 7 }, scene)
        pole.position.set(Math.cos(ang) * (ARENA_RADIUS + 2.5), 3.5, Math.sin(ang) * (ARENA_RADIUS + 2.5))
        pole.material = poleMat
        const flag = B.MeshBuilder.CreateBox(`flag_${i}`, { width: 0.9, height: 0.9, depth: 0.05 }, scene)
        flag.position.set(pole.position.x, 7.3, pole.position.z)
        const flagMat = new B.StandardMaterial(`flagMat_${i}`, scene)
        flagMat.diffuseColor = B.Color3.Black()
        flagMat.emissiveColor = B.Color3.FromHexString(i % 2 === 0 ? MAGENTA : CYAN).scale(0.5)
        flag.material = flagMat
      }

      // --- el mimo ---
      const player = new B.TransformNode('playerRoot', scene)
      player.position.set(0, 0, 0)
      const body = B.MeshBuilder.CreateCapsule('mimoBody', { height: 1.7, radius: 0.42 }, scene)
      body.position.y = 0.85
      body.parent = player
      const bodyMat = new B.StandardMaterial('mimoBodyMat', scene)
      bodyMat.diffuseColor = B.Color3.FromHexString('#141418')
      bodyMat.emissiveColor = new B.Color3(0.03, 0.03, 0.04)
      body.material = bodyMat
      const face = B.MeshBuilder.CreateSphere('mimoFace', { diameter: 0.46 }, scene)
      face.position.set(0, 1.62, 0.1)
      face.parent = player
      const faceMat = new B.StandardMaterial('mimoFaceMat', scene)
      faceMat.diffuseColor = B.Color3.Black()
      faceMat.emissiveColor = B.Color3.FromHexString(WHITE).scale(0.8)
      face.material = faceMat
      const stripe = B.MeshBuilder.CreateBox('mimoStripe', { width: 0.86, height: 0.22, depth: 0.5 }, scene)
      stripe.position.set(0, 1.0, 0.12)
      stripe.parent = player
      const stripeMat = new B.StandardMaterial('mimoStripeMat', scene)
      stripeMat.diffuseColor = B.Color3.Black()
      stripeMat.emissiveColor = B.Color3.FromHexString(RED).scale(0.6)
      stripe.material = stripeMat
      const facingMarker = B.MeshBuilder.CreateCylinder('facingMarker', { diameterTop: 0, diameterBottom: 0.3, height: 0.5 }, scene)
      facingMarker.rotation.x = Math.PI / 2
      facingMarker.position.set(0, 0.85, 0.7)
      facingMarker.parent = player
      const facingMat = new B.StandardMaterial('facingMat', scene)
      facingMat.diffuseColor = B.Color3.Black()
      facingMat.emissiveColor = B.Color3.FromHexString(CYAN).scale(0.6)
      facingMarker.material = facingMat

      // --- pared invisible: visible solo mientras está activa ---
      const wall = B.MeshBuilder.CreatePlane('wall', { width: WALL_HALF_WIDTH * 2, height: 2.2 }, scene)
      const wallMat = new B.StandardMaterial('wallMat', scene)
      wallMat.diffuseColor = B.Color3.Black()
      wallMat.emissiveColor = B.Color3.FromHexString(WHITE)
      wallMat.alpha = 0.22
      wallMat.backFaceCulling = false
      wall.material = wallMat
      wall.setEnabled(false)

      // --- shockwave del empujón ---
      const shock = B.MeshBuilder.CreateTorus('shock', { diameter: 1, thickness: 0.08, tessellation: 24 }, scene)
      const shockMat = new B.StandardMaterial('shockMat', scene)
      shockMat.diffuseColor = B.Color3.Black()
      shockMat.emissiveColor = B.Color3.FromHexString(CYAN)
      shock.material = shockMat
      shock.rotation.x = Math.PI / 2
      shock.setEnabled(false)
      let shockT = -1

      // --- estado de juego (fuera de React, cuadro a cuadro) ---
      const pPos = { x: 0, z: 0 }
      let facing = Math.PI // mirando hacia +z al arrancar (ver facingMarker)
      let pHealth = PLAYER_MAX_HEALTH
      let pScore = 0
      let waveNum = 1
      let enemiesThisWave = 4
      let killsThisWave = 0
      let localStatus: Status = 'playing'
      let pushCd = 0
      let wallCd = 0
      let wallT = -1
      const enemies: Enemy[] = []
      const pies: Pie[] = []

      const bocinaMat = new B.StandardMaterial('bocinaMat', scene)
      bocinaMat.diffuseColor = B.Color3.Black()
      bocinaMat.emissiveColor = B.Color3.FromHexString(ORANGE).scale(0.75)
      const pasteleroMat = new B.StandardMaterial('pasteleroMat', scene)
      pasteleroMat.diffuseColor = B.Color3.Black()
      pasteleroMat.emissiveColor = B.Color3.FromHexString(MAGENTA).scale(0.75)
      const globoMat = new B.StandardMaterial('globoMat', scene)
      globoMat.diffuseColor = B.Color3.Black()
      globoMat.emissiveColor = B.Color3.FromHexString(GREEN).scale(0.8)
      const pieMat = new B.StandardMaterial('pieMat', scene)
      pieMat.diffuseColor = B.Color3.Black()
      pieMat.emissiveColor = B.Color3.FromHexString('#ffe6a8').scale(0.8)

      const enemyHp: Record<EnemyKind, number> = { bocina: BOCINA_HP, pastelero: PASTELERO_HP, globo: GLOBO_HP }
      const enemyMat: Record<EnemyKind, any> = { bocina: bocinaMat, pastelero: pasteleroMat, globo: globoMat }
      const enemyColor: Record<EnemyKind, string> = { bocina: ORANGE, pastelero: MAGENTA, globo: GREEN }

      function spawnEnemy(kind: EnemyKind) {
        const ang = Math.random() * Math.PI * 2
        const name = `e_${Date.now()}_${Math.random()}`
        const mesh = kind === 'bocina'
          ? B.MeshBuilder.CreateCapsule(name, { height: 1.5, radius: 0.46 }, scene)
          : kind === 'globo'
            ? B.MeshBuilder.CreateSphere(name, { diameter: 0.8 }, scene)
            : B.MeshBuilder.CreateBox(name, { size: 0.9 }, scene)
        const y = kind === 'bocina' ? 0.75 : kind === 'globo' ? 0.65 : 0.5
        mesh.position.set(Math.cos(ang) * (ARENA_RADIUS - 0.5), y, Math.sin(ang) * (ARENA_RADIUS - 0.5))
        mesh.material = enemyMat[kind]
        enemies.push({
          mesh, kind, hp: enemyHp[kind], maxHp: enemyHp[kind],
          stunT: 0, hitCooldown: 0, throwCooldown: 1 + Math.random(), wobbleSeed: Math.random() * 1000,
        })
      }

      function pickKind(waveN: number): EnemyKind {
        const r = Math.random()
        const globoChance = Math.min(0.3, 0.08 + waveN * 0.02)
        const pasteleroChance = Math.min(0.35, 0.18 + waveN * 0.015)
        if (r < globoChance) return 'globo'
        if (r < globoChance + pasteleroChance) return 'pastelero'
        return 'bocina'
      }

      // --- ráfaga de confetti al derrotar un payaso: unas pocas esferas
      // chicas saliendo disparadas y cayendo, cada una con su propio
      // material clonado para poder apagarla sola (alpha por partícula,
      // no por tipo entero). ---
      const bursts: Burst[] = []
      function spawnBurst(x: number, y: number, z: number, colorHex: string) {
        for (let i = 0; i < 7; i++) {
          const mesh = B.MeshBuilder.CreateSphere(`burst_${Date.now()}_${i}`, { diameter: 0.16 }, scene)
          mesh.position.set(x, y, z)
          const mat = new B.StandardMaterial(`burstMat_${Date.now()}_${i}`, scene)
          mat.diffuseColor = B.Color3.Black()
          mat.emissiveColor = B.Color3.FromHexString(colorHex)
          mat.alpha = 1
          mesh.material = mat
          const ang = Math.random() * Math.PI * 2
          const speed = 2.2 + Math.random() * 2.4
          bursts.push({ mesh, mat, vx: Math.cos(ang) * speed, vy: 2.6 + Math.random() * 2, vz: Math.sin(ang) * speed, ttl: 0.5 })
        }
      }

      for (let i = 0; i < enemiesThisWave; i++) spawnEnemy(pickKind(1))

      const onKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true }
      const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      cleanupFns.push(() => window.removeEventListener('keydown', onKeyDown))
      cleanupFns.push(() => window.removeEventListener('keyup', onKeyUp))

      const doPush = () => {
        if (localStatus !== 'playing' || pushCd > 0) return
        pushCd = PUSH_COOLDOWN
        shockT = 0
        sfxRef.current?.push()
        let anyHit = false
        for (const en of enemies) {
          const dx = en.mesh.position.x - pPos.x
          const dz = en.mesh.position.z - pPos.z
          const dist = Math.hypot(dx, dz) || 0.0001
          if (dist > PUSH_RANGE) continue
          const dot = (dx / dist) * Math.sin(facing) + (dz / dist) * Math.cos(facing)
          if (dot < PUSH_ARC_COS) continue
          en.hp -= PUSH_DAMAGE
          en.mesh.position.x += (dx / dist) * PUSH_KNOCKBACK * 0.12
          en.mesh.position.z += (dz / dist) * PUSH_KNOCKBACK * 0.12
          en.stunT = Math.max(en.stunT, 0.35)
          anyHit = true
        }
        if (anyHit) sfxRef.current?.honk()
      }
      const doWall = () => {
        if (localStatus !== 'playing' || wallCd > 0) return
        wallCd = WALL_COOLDOWN
        wallT = WALL_DURATION
        sfxRef.current?.wall()
      }
      const onCanvasClick = () => doPush()
      canvas.addEventListener('click', onCanvasClick)
      cleanupFns.push(() => canvas.removeEventListener('click', onCanvasClick))

      const onResize = () => engine.resize()
      window.addEventListener('resize', onResize)
      cleanupFns.push(() => window.removeEventListener('resize', onResize))

      let last = performance.now()
      engine.runRenderLoop(() => {
        const now = performance.now()
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now

        pushCd = Math.max(0, pushCd - dt)
        wallCd = Math.max(0, wallCd - dt)
        if (wallT >= 0) { wallT -= dt; if (wallT < 0) wallT = -1 }
        setPushPct(Math.round(100 - (pushCd / PUSH_COOLDOWN) * 100))
        setWallPct(Math.round(100 - (wallCd / WALL_COOLDOWN) * 100))

        if (localStatus === 'playing') {
          let mx = 0, mz = 0
          if (isTouch) {
            mx = moveVecRef.current.x
            mz = moveVecRef.current.y
            if (keysRef.current['Push']) doPush()
            if (keysRef.current['Wall']) doWall()
          } else {
            if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) mz += 1
            if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) mz -= 1
            if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) mx -= 1
            if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) mx += 1
            if (keysRef.current['Space']) doPush()
            if (keysRef.current['ShiftLeft'] || keysRef.current['KeyF']) doWall()
            const len = Math.hypot(mx, mz)
            if (len > 1) { mx /= len; mz /= len }
          }

          if (Math.hypot(mx, mz) > 0.05) facing = Math.atan2(mx, mz)
          pPos.x += mx * PLAYER_SPEED * dt
          pPos.z += mz * PLAYER_SPEED * dt
          const r = Math.hypot(pPos.x, pPos.z)
          if (r > ARENA_RADIUS - 0.6) {
            const k = (ARENA_RADIUS - 0.6) / r
            pPos.x *= k; pPos.z *= k
          }
          player.position.x = pPos.x
          player.position.z = pPos.z
          player.rotation.y = facing

          // pared: posicionarla si está activa
          if (wallT >= 0) {
            wall.setEnabled(true)
            const wx = pPos.x + Math.sin(facing) * WALL_DISTANCE
            const wz = pPos.z + Math.cos(facing) * WALL_DISTANCE
            wall.position.set(wx, 1.1, wz)
            wall.rotation.y = facing
            wallMat.alpha = 0.14 + Math.abs(Math.sin(now / 90)) * 0.18
          } else {
            wall.setEnabled(false)
          }

          // enemigos: moverse, atacar, chequear pared
          for (let i = enemies.length - 1; i >= 0; i--) {
            const en = enemies[i]
            if (en.hp <= 0) {
              pScore += 1; killsThisWave += 1
              setScore(pScore)
              sfxRef.current?.clownDown()
              spawnBurst(en.mesh.position.x, en.mesh.position.y, en.mesh.position.z, enemyColor[en.kind])
              en.mesh.dispose()
              enemies.splice(i, 1)
              continue
            }
            if (en.stunT > 0) { en.stunT -= dt; continue }

            const dx = pPos.x - en.mesh.position.x
            const dz = pPos.z - en.mesh.position.z
            const dist = Math.hypot(dx, dz) || 0.0001

            // bloqueo por la pared: si está activa y el enemigo cruza su banda
            let blocked = false
            if (wallT >= 0) {
              const wx = pPos.x + Math.sin(facing) * WALL_DISTANCE
              const wz = pPos.z + Math.cos(facing) * WALL_DISTANCE
              const relX = en.mesh.position.x - wx
              const relZ = en.mesh.position.z - wz
              const lateral = relX * Math.cos(facing) - relZ * Math.sin(facing)
              const depth = relX * Math.sin(facing) + relZ * Math.cos(facing)
              if (Math.abs(lateral) < WALL_HALF_WIDTH && Math.abs(depth) < WALL_BAND) {
                blocked = true
                en.stunT = 0.9
                en.mesh.position.x -= (dx / dist) * 0.6
                en.mesh.position.z -= (dz / dist) * 0.6
              }
            }
            if (blocked) continue

            if (en.kind === 'bocina') {
              if (dist > BOCINA_CONTACT_RANGE) {
                en.mesh.position.x += (dx / dist) * BOCINA_SPEED * dt
                en.mesh.position.z += (dz / dist) * BOCINA_SPEED * dt
              } else {
                en.hitCooldown -= dt
                if (en.hitCooldown <= 0) {
                  en.hitCooldown = BOCINA_HIT_INTERVAL
                  pHealth -= BOCINA_DAMAGE
                  setHealth(Math.max(0, pHealth))
                  setHitFlash((h) => h + 1)
                  sfxRef.current?.hurt()
                }
              }
            } else if (en.kind === 'globo') {
              // erratico a proposito: avanza hacia el jugador pero con un
              // bamboleo perpendicular real (globo de verdad no camina
              // derecho), distinto del acercamiento recto de bocina.
              const perpX = -dz / dist
              const perpZ = dx / dist
              const wobble = Math.sin(now / 1000 * GLOBO_WOBBLE_FREQ + en.wobbleSeed) * GLOBO_WOBBLE_AMP
              if (dist > GLOBO_CONTACT_RANGE) {
                en.mesh.position.x += ((dx / dist) * GLOBO_SPEED + perpX * wobble) * dt
                en.mesh.position.z += ((dz / dist) * GLOBO_SPEED + perpZ * wobble) * dt
              } else {
                en.hitCooldown -= dt
                if (en.hitCooldown <= 0) {
                  en.hitCooldown = GLOBO_HIT_INTERVAL
                  pHealth -= GLOBO_DAMAGE
                  setHealth(Math.max(0, pHealth))
                  setHitFlash((h) => h + 1)
                  sfxRef.current?.hurt()
                }
              }
            } else {
              if (dist > PASTELERO_PREF_RANGE + 0.5) {
                en.mesh.position.x += (dx / dist) * BOCINA_SPEED * 0.9 * dt
                en.mesh.position.z += (dz / dist) * BOCINA_SPEED * 0.9 * dt
              } else if (dist < PASTELERO_PREF_RANGE - 0.5) {
                en.mesh.position.x -= (dx / dist) * BOCINA_SPEED * 0.7 * dt
                en.mesh.position.z -= (dz / dist) * BOCINA_SPEED * 0.7 * dt
              }
              en.throwCooldown -= dt
              if (en.throwCooldown <= 0) {
                en.throwCooldown = PASTELERO_THROW_INTERVAL
                const pie = B.MeshBuilder.CreateSphere(`pie_${Date.now()}_${Math.random()}`, { diameter: 0.5 }, scene)
                pie.position.set(en.mesh.position.x, 0.9, en.mesh.position.z)
                pie.material = pieMat
                pies.push({ mesh: pie, vx: (dx / dist) * PIE_SPEED, vz: (dz / dist) * PIE_SPEED, ttl: 3 })
                sfxRef.current?.pieThrow()
              }
            }
            en.mesh.lookAt(new B.Vector3(pPos.x, en.mesh.position.y, pPos.z))
          }

          // tortas voladoras
          for (let i = pies.length - 1; i >= 0; i--) {
            const pie = pies[i]
            pie.ttl -= dt
            pie.mesh.position.x += pie.vx * dt
            pie.mesh.position.z += pie.vz * dt

            let destroyed = false
            if (wallT >= 0) {
              const wx = pPos.x + Math.sin(facing) * WALL_DISTANCE
              const wz = pPos.z + Math.cos(facing) * WALL_DISTANCE
              const relX = pie.mesh.position.x - wx
              const relZ = pie.mesh.position.z - wz
              const lateral = relX * Math.cos(facing) - relZ * Math.sin(facing)
              const depth = relX * Math.sin(facing) + relZ * Math.cos(facing)
              if (Math.abs(lateral) < WALL_HALF_WIDTH && Math.abs(depth) < WALL_BAND) destroyed = true
            }
            const dHit = Math.hypot(pie.mesh.position.x - pPos.x, pie.mesh.position.z - pPos.z)
            if (!destroyed && dHit < 0.9) {
              pHealth -= PASTELERO_DAMAGE
              setHealth(Math.max(0, pHealth))
              setHitFlash((h) => h + 1)
              sfxRef.current?.hurt()
              destroyed = true
            }
            if (destroyed) sfxRef.current?.splat()
            if (destroyed || pie.ttl <= 0) {
              pie.mesh.dispose()
              pies.splice(i, 1)
            }
          }

          if (pHealth <= 0) {
            localStatus = 'gameover'
            setStatus('gameover')
          }

          if (killsThisWave >= enemiesThisWave && enemies.length === 0) {
            waveNum += 1
            killsThisWave = 0
            enemiesThisWave = Math.min(16, 4 + waveNum * 2)
            setWave(waveNum)
            sfxRef.current?.wave()
            const toSpawn = Math.min(enemiesThisWave, 5 + waveNum)
            for (let i = 0; i < toSpawn; i++) spawnEnemy(pickKind(waveNum))
          }
        }

        // ráfagas de confetti y shockwave del empujón -- corren siempre
        // (incluso en game over, se apagan solas) para que una muerte o un
        // empujón justo antes del fin no quede cortado a mitad de animación.
        for (let i = bursts.length - 1; i >= 0; i--) {
          const b = bursts[i]
          b.ttl -= dt
          b.vy -= 9 * dt
          b.mesh.position.x += b.vx * dt
          b.mesh.position.y += b.vy * dt
          b.mesh.position.z += b.vz * dt
          b.mat.alpha = Math.max(0, b.ttl / 0.5)
          if (b.ttl <= 0 || b.mesh.position.y < -1) {
            b.mesh.dispose(); b.mat.dispose()
            bursts.splice(i, 1)
          }
        }
        if (shockT >= 0) {
          shockT += dt
          const t = shockT / 0.3
          if (t >= 1) { shock.setEnabled(false); shockT = -1 }
          else {
            shock.setEnabled(true)
            shock.position.set(pPos.x, 0.5, pPos.z)
            shock.rotation.y = facing
            const scale = 0.4 + t * (PUSH_RANGE * 1.6)
            shock.scaling.set(scale, scale, 1)
            shockMat.alpha = 1 - t
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
    setHealth(PLAYER_MAX_HEALTH)
    setScore(0)
    setWave(1)
    setStatus('playing')
    setRunId((r) => r + 1)
  }

  const healthColor = health > 50 ? '#39ff8a' : health > 20 ? ORANGE : RED

  return (
    <div style={{ background: '#000', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100vh', display: 'block', touchAction: 'none' }} />

      {hitFlash > 0 && <div key={hitFlash} className="mimos-hurt-flash" />}

      {isTouch && <TouchJoystick vecRef={moveVecRef} style={{ bottom: 36, left: 28 }} />}
      {isTouch && (
        <>
          <TouchActionButton
            keysRef={keysRef} code="Push" label="EMPUJAR"
            style={{ bottom: 150, right: 28, width: 76, height: 76, borderRadius: '50%' }}
          />
          <TouchActionButton
            keysRef={keysRef} code="Wall" label="PARED"
            style={{ bottom: 60, right: 118, width: 76, height: 76, borderRadius: '50%', background: `${CYAN}22` }}
          />
        </>
      )}

      <Link className="tap-ext" href="/games" style={{
        position: 'fixed', top: 16, left: 16, zIndex: 25,
        fontFamily: mono, fontSize: 9, letterSpacing: 2, color: `${CYAN}aa`, textDecoration: 'none',
        border: `1px solid ${CYAN}44`, padding: '6px 12px', background: '#00050aaa',
      }}>
        ← PROXYGAMES
      </Link>

      <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 25, width: 220 }}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1, color: healthColor, marginBottom: 4, textAlign: 'center' }}>
          SILENCIO: {Math.round(health)}%
        </div>
        <div style={{ width: '100%', height: 8, background: '#1a1a1a', border: `1px solid ${healthColor}66` }}>
          <div style={{ width: `${health}%`, height: '100%', background: healthColor, transition: 'width 0.2s' }} />
        </div>
      </div>

      <div style={{
        position: 'fixed', top: 16, right: 16, zIndex: 25, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
      }}>
        <div style={{
          fontFamily: mono, fontSize: 11, letterSpacing: 2, color: ORANGE,
          border: `1px solid ${ORANGE}44`, padding: '6px 14px', background: '#0a0500aa',
        }}>
          PAYASOS CALLADOS: {score}
        </div>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: `${CYAN}cc`, border: `1px solid ${CYAN}33`, padding: '4px 12px', background: '#00050aaa' }}>
          OLEADA {wave}
        </div>
        <button onClick={toggleFullscreen} style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 2, cursor: 'pointer', padding: '4px 12px',
          background: isFullscreen ? `${CYAN}22` : '#00050aaa',
          border: `1px solid ${isFullscreen ? CYAN : '#ffffff33'}`, color: isFullscreen ? CYAN : '#8892a4',
        }}>
          {isFullscreen ? '⛶ SALIR' : '⛶ PANTALLA COMPLETA'}
        </button>
      </div>

      {!isTouch && (
        <div style={{
          position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 25,
          display: 'flex', gap: 14, alignItems: 'center',
        }}>
          <div style={{ width: 90, fontFamily: mono, fontSize: 8.5, color: `${CYAN}cc`, textAlign: 'center' }}>
            ESPACIO EMPUJAR
            <div style={{ height: 4, background: '#1a1a1a', marginTop: 3 }}>
              <div style={{ width: `${pushPct}%`, height: '100%', background: CYAN }} />
            </div>
          </div>
          <div style={{ width: 90, fontFamily: mono, fontSize: 8.5, color: `${WHITE}cc`, textAlign: 'center' }}>
            SHIFT/F PARED
            <div style={{ height: 4, background: '#1a1a1a', marginTop: 3 }}>
              <div style={{ width: `${wallPct}%`, height: '100%', background: WHITE }} />
            </div>
          </div>
        </div>
      )}

      {status === 'gameover' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(5,0,2,0.8)',
        }}>
          <div style={{ textAlign: 'center', fontFamily: mono, padding: '32px 40px', border: `1px solid ${RED}66`, background: '#000a' }}>
            <div style={{ fontSize: 22, letterSpacing: 4, color: RED, marginBottom: 16, textShadow: `0 0 24px ${RED}88` }}>
              EL SILENCIO SE ROMPIÓ
            </div>
            <p style={{ fontSize: 11, color: '#c8aab8', lineHeight: 1.9, maxWidth: 360, margin: '0 0 24px' }}>
              Demasiada bocina, muy poca pared. Payasos callados: {score} — oleada {wave}.
            </p>
            <button onClick={restart} style={{
              fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '10px 24px', cursor: 'pointer',
              background: `${CYAN}14`, border: `1px solid ${CYAN}88`, color: CYAN,
            }}>
              ◆ REINTENTAR
            </button>
          </div>
        </div>
      )}

      {!isTouch && (
        <div style={{ position: 'fixed', bottom: 6, left: 6, zIndex: 25, fontFamily: mono, fontSize: 8, letterSpacing: 0.5, color: `${CYAN}55` }}>
          NPX-GAME-MIMOS // v1.1 — mimo (empujón + pared invisible) contra oleadas de payasos (bocina, pastelero, globo). Geometría placeholder.
        </div>
      )}
    </div>
  )
}
