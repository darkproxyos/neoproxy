'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { entries } from '@/components/knowledge/entries'
import { initBoids, stepBoids, type Boid, type BoidsParams } from './engine/boids'
import { createSandpile, stepSandpileRandom, mulberry32, type SandpileGrid } from './engine/sandpile'
import { SonifyEngine } from '../engine/audio'

// NPX-XP-ENJAMBRE — segundo modo del laboratorio, estructuralmente distinto
// del Workbench: ahí se generaba UNA vez y se inspeccionaba el resultado;
// acá el objeto de estudio es el comportamiento en el tiempo — agentes
// autónomos (Reynolds, 1987) y una grilla que deriva sola al borde del
// colapso (Bak, Tang & Wiesenfeld, 1987). Las dos corren en vivo, no una
// sola vez.

const mono = "'Space Mono', monospace"
const RED = '#cc0000'
const AMBER = '#ffb800'

type Mode = 'boids' | 'sandpile'

function Slider({ label, value, min, max, step, onChange, accent }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; accent: string
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#4a6080', marginBottom: 4, letterSpacing: 0.5 }}>
        <span>{label}</span>
        <span style={{ color: accent }}>{value.toFixed(step < 0.01 ? 3 : step < 1 ? 2 : 0)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: accent }}
      />
    </div>
  )
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

const SANDPILE_SIZE = 40
const SANDPILE_SPACING = 0.16

export default function EnjambrePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const BRef = useRef<any>(null)
  const boidsMeshRef = useRef<any>(null)
  const sandMeshRef = useRef<any>(null)
  const boidsRef = useRef<Boid[]>([])
  const sandGridRef = useRef<SandpileGrid | null>(null)
  const sandRandRef = useRef<() => number>(() => Math.random())
  const disposedRef = useRef(false)

  const [mode, setMode] = useState<Mode>('boids')
  const modeRef = useRef<Mode>('boids')
  useEffect(() => { modeRef.current = mode }, [mode])

  const [boidCount, setBoidCount] = useState(80)
  const [perception, setPerception] = useState(1.2)
  const [separationWeight, setSeparationWeight] = useState(1.5)
  const [alignmentWeight, setAlignmentWeight] = useState(1.0)
  const [cohesionWeight, setCohesionWeight] = useState(1.0)
  const [maxSpeed, setMaxSpeed] = useState(2.5)
  const [boundsRadius, setBoundsRadius] = useState(4)
  const [boidsRunning, setBoidsRunning] = useState(true)
  const boidsParamsRef = useRef<BoidsParams>({
    perception, separationWeight, alignmentWeight, cohesionWeight, maxSpeed, maxForce: 0.09, boundsRadius,
  })
  useEffect(() => {
    boidsParamsRef.current = { perception, separationWeight, alignmentWeight, cohesionWeight, maxSpeed, maxForce: 0.09, boundsRadius }
  }, [perception, separationWeight, alignmentWeight, cohesionWeight, maxSpeed, boundsRadius])
  const boidsRunningRef = useRef(true)
  useEffect(() => { boidsRunningRef.current = boidsRunning }, [boidsRunning])

  const [dropRate, setDropRate] = useState(6)
  const dropRateRef = useRef(6)
  useEffect(() => { dropRateRef.current = dropRate }, [dropRate])
  const [sandRunning, setSandRunning] = useState(true)
  const sandRunningRef = useRef(true)
  useEffect(() => { sandRunningRef.current = sandRunning }, [sandRunning])
  const [lastAvalanche, setLastAvalanche] = useState(0)
  const [maxAvalanche, setMaxAvalanche] = useState(0)
  const [totalDrops, setTotalDrops] = useState(0)
  const [avalancheLog, setAvalancheLog] = useState<number[]>([])

  // Sonificación: un drone de fondo modulado por la velocidad/dispersión
  // real de la bandada (no por los sliders — por lo que los boids están
  // haciendo de verdad cuadro a cuadro), y un golpe corto por cada
  // avalancha del sandpile, con tono y volumen según su tamaño.
  const [audioOn, setAudioOn] = useState(false)
  const audioOnRef = useRef(false)
  useEffect(() => { audioOnRef.current = audioOn }, [audioOn])
  const sonifyRef = useRef<SonifyEngine | null>(null)
  const toggleAudio = () => {
    if (!sonifyRef.current) sonifyRef.current = new SonifyEngine()
    const engine = sonifyRef.current
    if (!audioOn) {
      engine.start()
      engine.ensureDrone(90)
      setAudioOn(true)
    } else {
      engine.setDrone({ gain: 0 })
      setAudioOn(false)
    }
  }

  const rebuildBoids = () => {
    boidsRef.current = initBoids(boidCount, Math.floor(Math.random() * 1e6), boundsRadius * 0.6)
    const mesh = boidsMeshRef.current
    const B = BRef.current
    if (!mesh || !B) return
    const n = boidsRef.current.length
    mesh.thinInstanceCount = n
    const matrices = new Float32Array(n * 16)
    for (let i = 0; i < n; i++) {
      const m = B.Matrix.Translation(0, 1000, 0) // fuera de vista hasta el primer paso real
      m.copyToArray(matrices, i * 16)
    }
    mesh.thinInstanceSetBuffer('matrix', matrices, 16, false)
  }

  const resetSandpile = () => {
    sandGridRef.current = createSandpile(SANDPILE_SIZE, SANDPILE_SIZE)
    sandRandRef.current = mulberry32(Math.floor(Math.random() * 1e6))
    setLastAvalanche(0); setMaxAvalanche(0); setTotalDrops(0); setAvalancheLog([])
    const mesh = sandMeshRef.current
    if (!mesh) return
    const n = SANDPILE_SIZE * SANDPILE_SIZE
    const colors = new Float32Array(n * 4)
    for (let i = 0; i < n; i++) { colors[i * 4 + 3] = 1 }
    mesh.thinInstanceSetBuffer('color', colors, 4, false)
  }

  useEffect(() => {
    if (!canvasRef.current) return
    disposedRef.current = false
    let engine: any
    let frameCounter = 0

    const init = async () => {
      const B = await import('@babylonjs/core')
      if (disposedRef.current) return
      BRef.current = B
      engine = new B.Engine(canvasRef.current!, true)
      const scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0.004, 0.008, 0.016, 1)

      const camera = new B.ArcRotateCamera('en-cam', -Math.PI / 2.4, 1.1, 13, new B.Vector3(0, 0, 0), scene)
      camera.attachControl(canvasRef.current, true)
      camera.wheelPrecision = 35
      camera.lowerRadiusLimit = 2
      camera.upperRadiusLimit = 22
      camera.minZ = 0.05

      const fill = new B.HemisphericLight('en-fill', new B.Vector3(0, 1, 0.2), scene)
      fill.intensity = 0.6
      fill.groundColor = new B.Color3(0.05, 0.05, 0.1)
      const key = new B.PointLight('en-key', new B.Vector3(4, 5, -3), scene)
      key.intensity = 0.8

      // --- Boids: cono base, orientado por defecto a +Y, cada thin
      // instance lo reorienta hacia su propia velocidad ---
      const boidBase = B.MeshBuilder.CreateCylinder('boidBase', { diameterTop: 0, diameterBottom: 0.2, height: 0.5, tessellation: 6 }, scene)
      const boidMat = new B.StandardMaterial('boidMat', scene)
      boidMat.diffuseColor = B.Color3.FromHexString(RED)
      boidMat.emissiveColor = B.Color3.FromHexString(RED).scale(0.4)
      boidBase.material = boidMat
      // Sin esto, Babylon calcula el bounding box de la malla UNA sola vez
      // a partir del buffer de matrices inicial (todas estacionadas en
      // y=1000 antes del primer paso) y nunca lo vuelve a actualizar —
      // thinInstanceSetMatrixAt mueve a cada boid de verdad cuadro a
      // cuadro, pero el frustum culling sigue mirando ese bounding box
      // viejo y descarta la malla ENTERA por "estar fuera de cámara",
      // aunque las posiciones reales estén justo enfrente.
      boidBase.alwaysSelectAsActiveMesh = true
      boidsMeshRef.current = boidBase

      const boundsSphere = B.MeshBuilder.CreateSphere('bounds', { diameter: boundsRadius * 2, segments: 16 }, scene)
      const boundsMat = new B.StandardMaterial('boundsMat', scene)
      boundsMat.wireframe = true
      boundsMat.emissiveColor = new B.Color3(0.3, 0.05, 0.05)
      boundsMat.alpha = 0.25
      boundsSphere.material = boundsMat

      // --- Sandpile: una sola caja base, una thin instance fija por
      // celda (posición constante) — solo el color cambia por paso ---
      const sandBase = B.MeshBuilder.CreateBox('sandBase', { size: SANDPILE_SPACING * 0.92 }, scene)
      const sandMat = new B.StandardMaterial('sandMat', scene)
      sandMat.diffuseColor = new B.Color3(1, 1, 1)
      sandBase.material = sandMat
      sandMeshRef.current = sandBase

      const n = SANDPILE_SIZE * SANDPILE_SIZE
      const matrices = new Float32Array(n * 16)
      const half = (SANDPILE_SIZE - 1) / 2
      for (let y = 0; y < SANDPILE_SIZE; y++) {
        for (let x = 0; x < SANDPILE_SIZE; x++) {
          const i = y * SANDPILE_SIZE + x
          const m = B.Matrix.Translation((x - half) * SANDPILE_SPACING, 0, (y - half) * SANDPILE_SPACING)
          m.copyToArray(matrices, i * 16)
        }
      }
      sandBase.thinInstanceCount = n
      sandBase.thinInstanceSetBuffer('matrix', matrices, 16, true)

      rebuildBoids()
      resetSandpile()

      const up = new B.Vector3(0, 1, 0)
      scene.registerBeforeRender(() => {
        const dt = Math.min(engine.getDeltaTime() / 1000, 0.05)
        boundsSphere.setEnabled(modeRef.current === 'boids')
        boidBase.setEnabled(modeRef.current === 'boids')
        sandBase.setEnabled(modeRef.current === 'sandpile')

        if (modeRef.current === 'boids' && boidsRunningRef.current && boidsRef.current.length) {
          boidsRef.current = stepBoids(boidsRef.current, boidsParamsRef.current, dt * 2)
          const mesh = boidsMeshRef.current
          const bArr = boidsRef.current
          for (let i = 0; i < bArr.length; i++) {
            const b = bArr[i]
            const velLen = Math.hypot(b.vel[0], b.vel[1], b.vel[2])
            const dirN = velLen > 1e-4
              ? new B.Vector3(b.vel[0] / velLen, b.vel[1] / velLen, b.vel[2] / velLen)
              : new B.Vector3(0, 1, 0)
            let rot = B.Quaternion.Identity()
            const dot = B.Vector3.Dot(up, dirN)
            if (dot < -0.9999) rot = B.Quaternion.RotationAxis(new B.Vector3(1, 0, 0), Math.PI)
            else if (dot < 0.9999) rot = B.Quaternion.RotationAxis(B.Vector3.Cross(up, dirN).normalize(), Math.acos(dot))
            const m = B.Matrix.Compose(B.Vector3.One(), rot, new B.Vector3(b.pos[0], b.pos[1], b.pos[2]))
            mesh.thinInstanceSetMatrixAt(i, m, false)
          }
          mesh.thinInstanceBufferUpdated('matrix')

          const sonify = sonifyRef.current
          if (sonify?.running) {
            if (audioOnRef.current) {
              let sumSpeed = 0
              let cx = 0, cy = 0, cz = 0
              for (const b of bArr) {
                sumSpeed += Math.hypot(b.vel[0], b.vel[1], b.vel[2])
                cx += b.pos[0]; cy += b.pos[1]; cz += b.pos[2]
              }
              const n = bArr.length || 1
              const avgSpeed = sumSpeed / n
              cx /= n; cy /= n; cz /= n
              let spread = 0
              for (const b of bArr) spread += Math.hypot(b.pos[0] - cx, b.pos[1] - cy, b.pos[2] - cz)
              spread /= n
              // más rápido = filtro más abierto (más brillante); más
              // dispersa la bandada, más "detune" entre voces — un
              // enjambre apretado suena afinado, uno disperso suena roto.
              sonify.setDrone({
                cutoff: 180 + avgSpeed * 260,
                detune: Math.min(40, spread * 18),
                gain: 0.16,
              })
            } else {
              sonify.setDrone({ gain: 0 })
            }
          }
        }

        if (modeRef.current === 'sandpile' && sandRunningRef.current && sandGridRef.current) {
          frameCounter++
          if (frameCounter >= Math.max(1, dropRateRef.current)) {
            frameCounter = 0
            const { avalanche } = stepSandpileRandom(sandGridRef.current, sandRandRef.current)
            const grid = sandGridRef.current
            const colors = new Float32Array(grid.grains.length * 4)
            for (let i = 0; i < grid.grains.length; i++) {
              const g = grid.grains[i]
              const t = g / 3
              colors[i * 4] = 0.04 + t * 0.5
              colors[i * 4 + 1] = 0.04 + t * 0.1
              colors[i * 4 + 2] = 0.08 + t * (g >= 3 ? 0.9 : 0.3)
              colors[i * 4 + 3] = 1
            }
            sandMeshRef.current?.thinInstanceSetBuffer('color', colors, 4, false)
            setLastAvalanche(avalanche)
            setMaxAvalanche((m) => Math.max(m, avalanche))
            setTotalDrops((t) => t + 1)
            setAvalancheLog((log) => [...log.slice(-39), avalanche])

            if (avalanche > 0 && audioOnRef.current && sonifyRef.current?.running) {
              // avalanchas chicas son frecuentes y agudas; una grande (ley
              // de potencias, no campana) baja de tono y dura más — se
              // escucha la diferencia de escala, no solo se ve en el gráfico.
              sonifyRef.current.hit({
                freq: Math.max(70, 480 - avalanche * 9),
                duration: Math.min(1.1, 0.18 + avalanche * 0.018),
                gain: Math.min(0.55, 0.12 + avalanche * 0.01),
                type: 'triangle',
              })
            }
          }
        }
      })

      engine.runRenderLoop(() => scene.render())
      window.addEventListener('resize', () => engine.resize())
    }

    init()
    return () => {
      disposedRef.current = true
      if (engine) engine.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => { sonifyRef.current?.stop() }
  }, [])

  const accent = mode === 'boids' ? RED : AMBER
  const maxLog = Math.max(1, ...avalancheLog)

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#020408', fontFamily: mono }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 44, background: 'rgba(5,10,20,0.9)',
        borderBottom: `1px solid ${RED}33`, display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 18px', zIndex: 100, backdropFilter: 'blur(6px)',
      }}>
        <Link href="/experimental" style={{ fontSize: 9, letterSpacing: 2, color: '#4a6080', textDecoration: 'none' }}>
          ← EXPERIMENTAL
        </Link>
        <div style={{ fontSize: 11, letterSpacing: 3, color: RED, fontWeight: 700 }}>NPX-XP-ENJAMBRE</div>
        <div style={{ fontSize: 9, letterSpacing: 1, color: '#4a6080' }}>sistemas que corren solos, no se generan una vez</div>
        <button onClick={toggleAudio} title="Sonificar la simulación en vivo" style={{
          marginLeft: 'auto', fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '6px 10px', cursor: 'pointer',
          background: audioOn ? `${accent}22` : 'transparent', border: `1px solid ${audioOn ? accent : '#2a3a50'}`,
          color: audioOn ? accent : '#4a6080',
        }}>
          {audioOn ? '♫ AUDIO ON' : '♪ AUDIO'}
        </button>
      </div>

      <div style={{
        position: 'absolute', top: 44, left: 0, bottom: 0, width: 300, overflowY: 'auto',
        background: 'rgba(5,10,20,0.92)', borderRight: `1px solid ${RED}22`, padding: 16, zIndex: 90,
      }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['boids', 'sandpile'] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, fontFamily: mono, fontSize: 9, padding: '8px 6px', letterSpacing: 0.5, cursor: 'pointer',
              background: mode === m ? `${m === 'boids' ? RED : AMBER}22` : 'transparent',
              border: `1px solid ${mode === m ? (m === 'boids' ? RED : AMBER) : '#2a3a50'}`,
              color: mode === m ? (m === 'boids' ? RED : AMBER) : '#4a6080',
            }}>
              {m === 'boids' ? 'BANDADA (BOIDS)' : 'MONTÍCULO (SANDPILE)'}
            </button>
          ))}
        </div>

        {mode === 'boids' ? (
          <>
            <div style={{ fontSize: 10, letterSpacing: 3, color: RED, marginBottom: 10 }}>REGLAS LOCALES</div>
            <Slider label="PERCEPCIÓN" value={perception} min={0.3} max={3} step={0.05} onChange={setPerception} accent={accent} />
            <Slider label="SEPARACIÓN" value={separationWeight} min={0} max={3} step={0.05} onChange={setSeparationWeight} accent={accent} />
            <Slider label="ALINEACIÓN" value={alignmentWeight} min={0} max={3} step={0.05} onChange={setAlignmentWeight} accent={accent} />
            <Slider label="COHESIÓN" value={cohesionWeight} min={0} max={3} step={0.05} onChange={setCohesionWeight} accent={accent} />
            <Slider label="VELOCIDAD MÁX" value={maxSpeed} min={0.5} max={6} step={0.1} onChange={setMaxSpeed} accent={accent} />
            <Slider label="RADIO DE VUELO" value={boundsRadius} min={1.5} max={8} step={0.1} onChange={setBoundsRadius} accent={accent} />
            <Slider label="CANTIDAD (reiniciar p/aplicar)" value={boidCount} min={10} max={200} step={5} onChange={setBoidCount} accent={accent} />
            <div style={{ display: 'flex', gap: 6, marginTop: 4, marginBottom: 6 }}>
              <button onClick={() => setBoidsRunning((r) => !r)} style={{
                flex: 1, fontFamily: mono, fontSize: 9, padding: 9, cursor: 'pointer', letterSpacing: 1,
                background: 'transparent', border: `1px solid ${accent}`, color: accent,
              }}>
                {boidsRunning ? '❙❙ PAUSAR' : '▶ CONTINUAR'}
              </button>
              <button onClick={rebuildBoids} style={{
                flex: 1, fontFamily: mono, fontSize: 9, padding: 9, cursor: 'pointer', letterSpacing: 1,
                background: 'transparent', border: '1px solid #2a3a50', color: '#8fb8d6',
              }}>
                ↺ REINICIAR
              </button>
            </div>
            <AuthorCard entryId="reynolds" accent={accent} />
          </>
        ) : (
          <>
            <div style={{ fontSize: 10, letterSpacing: 3, color: AMBER, marginBottom: 10 }}>CRITICALIDAD</div>
            <Slider label="RITMO (frames/grano — menos = más rápido)" value={dropRate} min={1} max={30} step={1} onChange={setDropRate} accent={accent} />
            <div style={{ display: 'flex', gap: 6, marginTop: 4, marginBottom: 14 }}>
              <button onClick={() => setSandRunning((r) => !r)} style={{
                flex: 1, fontFamily: mono, fontSize: 9, padding: 9, cursor: 'pointer', letterSpacing: 1,
                background: 'transparent', border: `1px solid ${accent}`, color: accent,
              }}>
                {sandRunning ? '❙❙ PAUSAR' : '▶ CONTINUAR'}
              </button>
              <button onClick={resetSandpile} style={{
                flex: 1, fontFamily: mono, fontSize: 9, padding: 9, cursor: 'pointer', letterSpacing: 1,
                background: 'transparent', border: '1px solid #2a3a50', color: '#8fb8d6',
              }}>
                ↺ REINICIAR
              </button>
            </div>

            <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 1, marginBottom: 8 }}>
              GRANOS CAÍDOS: <span style={{ color: accent }}>{totalDrops}</span> · ÚLTIMA AVALANCHA: <span style={{ color: accent }}>{lastAvalanche}</span> · MÁXIMA: <span style={{ color: accent }}>{maxAvalanche}</span>
            </div>
            <div style={{ fontSize: 8, color: '#4a6080', letterSpacing: 1, marginBottom: 4 }}>ÚLTIMAS 40 AVALANCHAS (ley de potencias, no campana)</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 50, marginBottom: 14, border: `1px solid ${accent}22`, padding: '4px 4px 0' }}>
              {avalancheLog.map((v, i) => (
                <div key={i} style={{
                  flex: 1, background: accent, opacity: 0.3 + 0.7 * (v / maxLog),
                  height: `${Math.max(2, (v / maxLog) * 100)}%`,
                }} />
              ))}
            </div>
            <AuthorCard entryId="perbak" accent={accent} />
          </>
        )}
      </div>

      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', position: 'absolute', top: 0, left: 0 }} />
    </div>
  )
}
