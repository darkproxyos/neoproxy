'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { entries } from '@/components/knowledge/entries'
import { initChain, stepChain, type ChainState, type ChainParams } from './engine/chain'

// MUDA — tercera criatura. Enjambre (Trickster) fue forrajeo activo local,
// Acecho (D) fue sit-and-wait + pursuit. Esta es un paradigma de movimiento
// nuevo otra vez: una cadena articulada de distancia fija (FABRIK sin base,
// ver engine/chain.ts), no partículas sueltas con reglas de vecindario.

const mono = "'Space Mono', monospace"
const SNAKE_GREEN = '#00ff9d'

const ARENA_HALF = 4.2
const SEGMENT_COUNT = 16
const SEGMENT_LENGTH = 0.22

const CHAIN_PARAMS: ChainParams = {
  arenaHalf: ARENA_HALF,
  maxSpeed: 1.6,
  maxForce: 0.09,
  wanderRadius: 0.6,
  wanderDist: 1.1,
  wanderJitter: 0.9,
  segmentLength: SEGMENT_LENGTH,
  moltCooldown: 2.2,
}

function hslToHex(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x } else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x } else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c } else { r = c; b = x }
  return [r + m, g + m, b + m]
}

function AuthorCard({ entryId, accent }: { entryId: string; accent: string }) {
  const entry = entries.find((e) => e.id === entryId)
  if (!entry) return null
  return (
    <Link href={`/knowledge?entry=${entry.id}`} style={{
      display: 'block', marginTop: 10, padding: '10px 12px', border: `1px solid ${accent}33`,
      background: `${accent}0a`, textDecoration: 'none',
    }}>
      <div style={{ fontSize: 9, color: accent, letterSpacing: 1, marginBottom: 4 }}>
        {entry.name.toUpperCase()} · {entry.years}
      </div>
      <div style={{ fontSize: 9, color: '#8fb8d6', letterSpacing: 0.5, marginBottom: 6 }}>{entry.role}</div>
      <div style={{ fontSize: 9, color: '#4a6080', fontStyle: 'italic', lineHeight: 1.6 }}>{entry.formulaLabel}</div>
    </Link>
  )
}

export default function MudaPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const disposedRef = useRef(false)
  const chainRef = useRef<ChainState>(initChain(SEGMENT_COUNT, 1, ARENA_HALF, SEGMENT_LENGTH))
  const clockRef = useRef(0)

  const [moltCount, setMoltCount] = useState(0)
  const [hue, setHue] = useState(0)
  const [speed, setSpeed] = useState(0)

  useEffect(() => {
    if (!canvasRef.current) return
    disposedRef.current = false
    chainRef.current = initChain(SEGMENT_COUNT, Math.floor(Math.random() * 1e6), ARENA_HALF, SEGMENT_LENGTH)
    clockRef.current = 0
    let engine: any

    const init = async () => {
      const B = await import('@babylonjs/core')
      if (disposedRef.current) return
      engine = new B.Engine(canvasRef.current!, true)
      const scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0.004, 0.008, 0.016, 1)

      const camera = new B.ArcRotateCamera('mu-cam', -Math.PI / 2.6, 1.15, 12.5, new B.Vector3(0, 0, 0), scene)
      camera.attachControl(canvasRef.current, true)
      camera.wheelPrecision = 35
      camera.lowerRadiusLimit = 2
      camera.upperRadiusLimit = 22
      camera.minZ = 0.05

      const fill = new B.HemisphericLight('mu-fill', new B.Vector3(0, 1, 0.2), scene)
      fill.intensity = 0.55
      fill.groundColor = new B.Color3(0.02, 0.05, 0.04)
      const key = new B.PointLight('mu-key', new B.Vector3(4, 5, -3), scene)
      key.intensity = 0.6

      const boundsBox = B.MeshBuilder.CreateBox('bounds', { size: ARENA_HALF * 2 }, scene)
      const boundsMat = new B.StandardMaterial('boundsMat', scene)
      boundsMat.wireframe = true
      boundsMat.emissiveColor = B.Color3.FromHexString(SNAKE_GREEN).scale(0.3)
      boundsMat.alpha = 0.18
      boundsBox.material = boundsMat

      // Segmentos: thin instances de una sola esfera, escala decreciente
      // de cabeza a cola — sin necesidad de orientar cada una (son
      // simétricas), la cadena se lee sola por la posición + el tapering.
      const segSphere = B.MeshBuilder.CreateSphere('segBase', { diameter: 1, segments: 10 }, scene)
      const segMat = new B.StandardMaterial('segMat', scene)
      segMat.specularColor = new B.Color3(0.1, 0.12, 0.1)
      segSphere.material = segMat
      segSphere.thinInstanceCount = SEGMENT_COUNT
      segSphere.alwaysSelectAsActiveMesh = true
      const initialMatrices = new Float32Array(SEGMENT_COUNT * 16)
      for (let i = 0; i < SEGMENT_COUNT; i++) B.Matrix.Identity().copyToArray(initialMatrices, i * 16)
      segSphere.thinInstanceSetBuffer('matrix', initialMatrices, 16, true)
      const colorBuffer = new Float32Array(SEGMENT_COUNT * 4)
      segSphere.thinInstanceSetBuffer('color', colorBuffer, 4, true)

      let moltFlashUntil = 0
      scene.registerBeforeRender(() => {
        const dt = Math.min(engine.getDeltaTime() / 1000, 0.05)
        clockRef.current += dt
        const now = clockRef.current

        const molted = stepChain(chainRef.current, dt, now, CHAIN_PARAMS)
        if (molted) moltFlashUntil = now + 0.3

        const chain = chainRef.current
        const [r, g, b] = hslToHex(chain.hue, 0.85, 0.5)
        const flash = now < moltFlashUntil ? 1 : 0

        const matrices = new Float32Array(SEGMENT_COUNT * 16)
        const colors = new Float32Array(SEGMENT_COUNT * 4)
        for (let i = 0; i < SEGMENT_COUNT; i++) {
          const t = i / (SEGMENT_COUNT - 1)
          const s = SEGMENT_LENGTH * (2.2 - t * 1.5)
          const pos = chain.segments[i]
          const m = B.Matrix.Compose(new B.Vector3(s, s, s), B.Quaternion.Identity(), new B.Vector3(pos[0], pos[1], pos[2]))
          m.copyToArray(matrices, i * 16)
          const k = 0.35 + (1 - t) * 0.35 + flash * 0.4
          colors[i * 4] = r * k; colors[i * 4 + 1] = g * k; colors[i * 4 + 2] = b * k; colors[i * 4 + 3] = 1
        }
        segSphere.thinInstanceSetBuffer('matrix', matrices, 16, false)
        segSphere.thinInstanceSetBuffer('color', colors, 4, false)

        setMoltCount(chain.moltCount)
        setHue(Math.round(chain.hue))
        setSpeed(Math.hypot(chain.headVel[0], chain.headVel[1], chain.headVel[2]))
      })

      engine.runRenderLoop(() => scene.render())
    }

    init()
    const onResize = () => engine?.resize()
    window.addEventListener('resize', onResize)
    return () => {
      disposedRef.current = true
      window.removeEventListener('resize', onResize)
      engine?.dispose()
    }
  }, [])

  const hueHex = (() => {
    const [r, g, b] = hslToHex(hue, 0.85, 0.5)
    const h2 = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0')
    return `#${h2(r)}${h2(g)}${h2(b)}`
  })()

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/experimental" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A EXPERIMENTAL
        </Link>

        <div style={{ fontSize: 9, color: `${SNAKE_GREEN}66`, letterSpacing: 6, marginBottom: 16 }}>
          // NPX-XP-MUDA — TERCERA CRIATURA, CADENA ARTICULADA
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 700, letterSpacing: 6, color: SNAKE_GREEN,
          textShadow: `0 0 40px ${SNAKE_GREEN}44`, marginBottom: 16, lineHeight: 1,
        }}>
          MUDA
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 720, marginBottom: 32 }}>
          Ni partículas con reglas de vecindario (Enjambre) ni un cuerpo rígido lanzándose una vez
          (Acecho) — una cadena de {SEGMENT_COUNT} segmentos a distancia fija, cada uno persiguiendo en
          línea recta al anterior (FABRIK sin base fija, ver tarjeta abajo). "No tiene una forma fija
          — cambia de piel cada vez que un entorno lo obliga": la muda no es un timer, se dispara
          cuando la cabeza empuja de verdad contra el límite del espacio.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(260px, 1fr)', gap: 24 }}>
          <div style={{ aspectRatio: '4 / 3', position: 'relative', border: `1px solid ${SNAKE_GREEN}33` }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>

          <div>
            <div style={{ border: `1px solid ${SNAKE_GREEN}33`, background: `${SNAKE_GREEN}08`, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: `${SNAKE_GREEN}cc`, marginBottom: 10 }}>// ESTADO</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: hueHex, boxShadow: `0 0 10px ${hueHex}` }} />
                <span style={{ fontSize: 10, color: '#c8daf0' }}>PIEL ACTUAL</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 10 }}>
                <div style={{ color: '#4a6080' }}>MUDAS</div>
                <div style={{ color: '#c8daf0', textAlign: 'right' }}>{moltCount}</div>
                <div style={{ color: '#4a6080' }}>MATIZ (HUE)</div>
                <div style={{ color: '#c8daf0', textAlign: 'right' }}>{hue}°</div>
                <div style={{ color: '#4a6080' }}>VELOCIDAD</div>
                <div style={{ color: SNAKE_GREEN, textAlign: 'right' }}>{speed.toFixed(2)}</div>
                <div style={{ color: '#4a6080' }}>SEGMENTOS</div>
                <div style={{ color: '#c8daf0', textAlign: 'right' }}>{SEGMENT_COUNT}</div>
              </div>
            </div>

            <p style={{ fontSize: 9, color: '#4a6080', letterSpacing: 0.5, lineHeight: 1.9, marginBottom: 4 }}>
              Cada segmento se mueve en línea recta hacia el anterior y se frena a distancia fija —
              sin ángulos, sin trigonometría.
            </p>
            <AuthorCard entryId="aristidou-fabrik" accent={SNAKE_GREEN} />
          </div>
        </div>
      </div>
    </div>
  )
}
