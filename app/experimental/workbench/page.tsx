'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { entries } from '@/components/knowledge/entries'
import {
  runSpaceColonization, computeRadii, type SkeletonNode, type Vec3,
} from '@/app/lab/proxygenesis/engine/spaceColonization'
import { generateShell, normalizeToViewSize } from '@/app/lab/proxygenesis/engine/shell'
import { attractors, runAttractor } from '@/app/lab/atractores/engine/attractors'
import { runRD, sampleRD, RD_PRESETS, type RDGrid } from './engine/reactionDiffusion'
import { exportMeshToSTL } from './engine/stl'

// NPX-XP-WORKBENCH — un banco de trabajo real, no una galería de botones:
// una sola forma 3D que acumula capas de teorías distintas, cada una citada
// con su autor real, igual que un stack de modificadores de Blender pero
// con ciencia en vez de geometría decorativa.
//   BASE      — qué genera el esqueleto (Space Colonization o Raup)
//   PATRÓN    — reacción-difusión de Turing pintada sobre la superficie
//   CAOS      — un sistema dinámico real desplaza los nodos del esqueleto
// Las tres capas comparten una sola malla final — mezclar teorías es
// literal, no una metáfora de marketing.

const mono = "'Space Mono', monospace"
const RED = '#cc0000'
const CYAN = '#00d4ff'

type BaseType = 'colonization' | 'shell'

const COLONIZATION_DEFAULTS = { numAttractors: 380, curl: 0.1, seed: 1 }
const SHELL_DEFAULTS = { W: 2.2, D: 0.9, T: 0.5, whorls: 5 }

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

export default function WorkbenchPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<any>(null)
  const engineRef = useRef<any>(null)
  const BRef = useRef<any>(null)
  const currentMeshRef = useRef<any>(null)
  const disposedRef = useRef(false)

  const [baseType, setBaseType] = useState<BaseType>('colonization')
  const [numAttractors, setNumAttractors] = useState(COLONIZATION_DEFAULTS.numAttractors)
  const [curl, setCurl] = useState(COLONIZATION_DEFAULTS.curl)
  const [seed, setSeed] = useState(COLONIZATION_DEFAULTS.seed)
  const [shellW, setShellW] = useState(SHELL_DEFAULTS.W)
  const [shellD, setShellD] = useState(SHELL_DEFAULTS.D)
  const [shellT, setShellT] = useState(SHELL_DEFAULTS.T)
  const [shellWhorls, setShellWhorls] = useState(SHELL_DEFAULTS.whorls)

  const [patternEnabled, setPatternEnabled] = useState(false)
  const [patternPreset, setPatternPreset] = useState<keyof typeof RD_PRESETS>('coral')
  const [patternSteps, setPatternSteps] = useState(350)

  const [chaosEnabled, setChaosEnabled] = useState(false)
  const [chaosSystem, setChaosSystem] = useState('lorenz')
  const [chaosStrength, setChaosStrength] = useState(0.4)

  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [segmentCount, setSegmentCount] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return
    disposedRef.current = false
    let engine: any

    const init = async () => {
      const B = await import('@babylonjs/core')
      if (disposedRef.current) return
      BRef.current = B
      engine = new B.Engine(canvasRef.current!, true)
      engineRef.current = engine
      const scene = new B.Scene(engine)
      sceneRef.current = scene
      scene.clearColor = new B.Color4(0.004, 0.008, 0.016, 1)

      const camera = new B.ArcRotateCamera('wb-cam', -Math.PI / 2.6, 1.15, 7.5, new B.Vector3(0, 0.2, 0), scene)
      camera.attachControl(canvasRef.current, true)
      camera.wheelPrecision = 40
      camera.lowerRadiusLimit = 2.5
      camera.upperRadiusLimit = 18
      camera.minZ = 0.05

      const fill = new B.HemisphericLight('wb-fill', new B.Vector3(0, 1, 0.2), scene)
      fill.intensity = 0.55
      fill.groundColor = new B.Color3(0.05, 0.05, 0.1)
      const key = new B.PointLight('wb-key', new B.Vector3(3, 4, -3), scene)
      key.intensity = 0.9
      key.diffuse = new B.Color3(1, 0.96, 0.9)

      const grid = B.MeshBuilder.CreateGround('wb-grid', { width: 10, height: 10, subdivisions: 10 }, scene)
      grid.position.y = -2.1
      const gridMat = new B.StandardMaterial('wb-gridmat', scene)
      gridMat.wireframe = true
      gridMat.emissiveColor = new B.Color3(0.1, 0.15, 0.2)
      gridMat.alpha = 0.35
      grid.material = gridMat

      engine.runRenderLoop(() => scene.render())
      window.addEventListener('resize', () => engine.resize())
    }

    init()
    return () => {
      disposedRef.current = true
      if (engine) engine.dispose()
    }
  }, [])

  const regenerate = async () => {
    const B = BRef.current
    const scene = sceneRef.current
    if (!B || !scene || generating) return
    setGenerating(true)
    setProgress(0)

    // 1. Esqueleto base — las dos teorías devuelven cosas de forma distinta
    //    (un árbol de nodos con padres vs. una curva lineal), así que acá
    //    se normalizan las dos a lo único que el resto del pipeline
    //    necesita: una lista de nodos con padre + un radio por nodo.
    let nodes: SkeletonNode[]
    let radii: number[]

    if (baseType === 'colonization') {
      const gen = runSpaceColonization({
        seed, numAttractors,
        canopyCenter: [0, 1, 0], canopyRadius: [1.6, 2, 1.6],
        rootPos: [0, -1.8, 0], influenceRadius: 0.85, killDistance: 0.17,
        stepSize: 0.12, maxIterations: 260, curl,
      })
      let result = gen.next()
      const frameBudgetMs = 12
      await new Promise<void>((resolve) => {
        const step = () => {
          if (disposedRef.current) return resolve()
          const t0 = performance.now()
          while (!result.done && performance.now() - t0 < frameBudgetMs) result = gen.next()
          if (!result.value.done) {
            setProgress(result.value.iteration / result.value.maxIterations)
            requestAnimationFrame(step)
          } else resolve()
        }
        requestAnimationFrame(step)
      })
      if (disposedRef.current) return
      nodes = result.value.nodes
      radii = computeRadii(nodes, { leafRadius: 0.035, exponent: 2.3, maxRadius: 0.4 })
    } else {
      const raw = generateShell({ W: shellW, D: shellD, T: shellT, whorls: shellWhorls, tubeRadius: 0.11, pointsPerWhorl: 26 })
      const norm = normalizeToViewSize(raw.points, raw.radii, 3.2)
      nodes = norm.points.map((pos, i) => ({ pos, parent: i - 1 }))
      radii = norm.radii
    }

    // 2. Caos — un sistema dinámico real (no Math.random) desplaza cada
    //    nodo; la trayectoria ya viene escalada por el propio sistema
    //    (mismo `scale` que usa /lab/atractores), así que chaosStrength
    //    es nomás un multiplicador adicional sobre eso.
    if (chaosEnabled) {
      const traj = runAttractor(chaosSystem, nodes.length, seed)
      const mag = chaosStrength * 0.12
      nodes = nodes.map((n, i) => {
        const t = traj[Math.min(i, traj.length - 1)] ?? { x: 0, y: 0, z: 0 }
        return { pos: [n.pos[0] + t.x * mag, n.pos[1] + t.y * mag, n.pos[2] + t.z * mag] as Vec3, parent: n.parent }
      })
    }

    // 3. Patrón — reacción-difusión de Turing en una grilla (t, φ): t es la
    //    posición a lo largo del esqueleto, φ el ángulo alrededor del tubo
    //    en ese punto. Se muestrea por vértice al armar cada segmento.
    let rdGrid: RDGrid | null = null
    if (patternEnabled) {
      const preset = RD_PRESETS[patternPreset]
      rdGrid = runRD(72, 18, { width: 72, height: 18, Du: 1, Dv: 0.5, feed: preset.feed, kill: preset.kill, seed }, patternSteps)
    }

    // 4. Malla — mismo truco de cilindros-y-merge que ya se usa en
    //    Proxygenesis y en el jefe orgánico de Trickster, pero acá cada
    //    segmento, antes de mergear, se pinta vértice a vértice con el
    //    campo de Turing muestreado en su (t, φ).
    const up = new B.Vector3(0, 1, 0)
    const parts: any[] = []
    for (let i = 1; i < nodes.length; i++) {
      const child = nodes[i]
      const parent = nodes[child.parent]
      if (!parent) continue
      const from3 = new B.Vector3(parent.pos[0], parent.pos[1], parent.pos[2])
      const to3 = new B.Vector3(child.pos[0], child.pos[1], child.pos[2])
      const seg = to3.subtract(from3)
      const h = seg.length()
      if (h < 1e-5) continue
      const dirN = seg.normalize()
      const cyl = B.MeshBuilder.CreateCylinder(`wbSeg${i}`, {
        diameterTop: Math.max(0.03, radii[i] * 2), diameterBottom: Math.max(0.03, radii[child.parent] * 2),
        height: h, tessellation: 8,
      }, scene)

      if (rdGrid) {
        const localPos = cyl.getVerticesData(B.VertexBuffer.PositionKind)
        if (localPos) {
          const vCount = localPos.length / 3
          const colors = new Float32Array(vCount * 4)
          const t = i / nodes.length
          const dark = 0.05
          for (let vi = 0; vi < vCount; vi++) {
            const lx = localPos[vi * 3], lz = localPos[vi * 3 + 2]
            const phi = (Math.atan2(lz, lx) + Math.PI) / (Math.PI * 2)
            const val = sampleRD(rdGrid, phi, t)
            colors[vi * 4] = dark
            colors[vi * 4 + 1] = dark + val * (0.85 - dark)
            colors[vi * 4 + 2] = dark + val * (1.0 - dark)
            colors[vi * 4 + 3] = 1
          }
          cyl.setVerticesData(B.VertexBuffer.ColorKind, colors)
        }
      }

      cyl.position = B.Vector3.Lerp(from3, to3, 0.5)
      const dot = B.Vector3.Dot(up, dirN)
      if (dot < -0.9999) {
        cyl.rotationQuaternion = B.Quaternion.RotationAxis(new B.Vector3(1, 0, 0), Math.PI)
      } else if (dot < 0.9999) {
        const axis = B.Vector3.Cross(up, dirN).normalize()
        cyl.rotationQuaternion = B.Quaternion.RotationAxis(axis, Math.acos(dot))
      }
      parts.push(cyl)
    }

    currentMeshRef.current?.dispose()
    currentMeshRef.current = null
    const merged = parts.length ? B.Mesh.MergeMeshes(parts, true, true, undefined, false, true) : null
    if (merged) {
      const mat = new B.StandardMaterial('wbMat', scene)
      mat.diffuseColor = rdGrid ? new B.Color3(1, 1, 1) : B.Color3.FromHexString(RED)
      mat.specularColor = new B.Color3(0.15, 0.15, 0.15)
      merged.material = mat
      currentMeshRef.current = merged
    }

    setSegmentCount(parts.length)
    setReady(true)
    setGenerating(false)
    setProgress(1)
  }

  const handleExportSTL = () => {
    if (!currentMeshRef.current) return
    exportMeshToSTL(currentMeshRef.current, `workbench-${baseType}-${Date.now()}.stl`)
  }

  const accent = baseType === 'colonization' ? RED : CYAN
  const chaosInfo = attractors[chaosSystem]

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
        <div style={{ fontSize: 11, letterSpacing: 3, color: RED, fontWeight: 700 }}>NPX-XP-WORKBENCH</div>
        <div style={{ fontSize: 9, letterSpacing: 1, color: '#4a6080' }}>mezclá teorías sobre un mismo objeto</div>
      </div>

      <div style={{
        position: 'absolute', top: 44, left: 0, bottom: 0, width: 300, overflowY: 'auto',
        background: 'rgba(5,10,20,0.92)', borderRight: `1px solid ${RED}22`, padding: 16, zIndex: 90,
      }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: RED, marginBottom: 10 }}>BASE // ESQUELETO</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {(['colonization', 'shell'] as BaseType[]).map((bt) => (
            <button key={bt} onClick={() => setBaseType(bt)} style={{
              flex: 1, fontFamily: mono, fontSize: 9, padding: '8px 6px', letterSpacing: 0.5, cursor: 'pointer',
              background: baseType === bt ? `${accent}22` : 'transparent',
              border: `1px solid ${baseType === bt ? accent : '#2a3a50'}`,
              color: baseType === bt ? accent : '#4a6080',
            }}>
              {bt === 'colonization' ? 'COLONIZACIÓN' : 'CONCHA (RAUP)'}
            </button>
          ))}
        </div>

        {baseType === 'colonization' ? (
          <>
            <Slider label="ATRACTORES" value={numAttractors} min={100} max={700} step={10} onChange={setNumAttractors} accent={accent} />
            <Slider label="CURVATURA" value={curl} min={0} max={0.4} step={0.01} onChange={setCurl} accent={accent} />
            <Slider label="SEMILLA" value={seed} min={1} max={999} step={1} onChange={setSeed} accent={accent} />
            <AuthorCard entryId="runions-lane-prusinkiewicz" accent={accent} />
          </>
        ) : (
          <>
            <Slider label="W — EXPANSIÓN" value={shellW} min={1.05} max={3} step={0.01} onChange={setShellW} accent={accent} />
            <Slider label="D — DISTANCIA AL EJE" value={shellD} min={0.15} max={2} step={0.01} onChange={setShellD} accent={accent} />
            <Slider label="T — ALTURA DE ESPIRA" value={shellT} min={0} max={1.5} step={0.01} onChange={setShellT} accent={accent} />
            <Slider label="VUELTAS" value={shellWhorls} min={2} max={9} step={0.1} onChange={setShellWhorls} accent={accent} />
            <AuthorCard entryId="raup" accent={accent} />
          </>
        )}

        <div style={{ fontSize: 10, letterSpacing: 3, color: RED, margin: '22px 0 10px', borderTop: `1px solid ${RED}22`, paddingTop: 18 }}>
          MODIFICADORES
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: '#c8daf0', marginBottom: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={patternEnabled} onChange={(e) => setPatternEnabled(e.target.checked)} />
          PATRÓN — reacción-difusión (Turing)
        </label>
        {patternEnabled && (
          <div style={{ marginBottom: 16, paddingLeft: 4 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {Object.entries(RD_PRESETS).map(([key, p]) => (
                <button key={key} onClick={() => setPatternPreset(key as keyof typeof RD_PRESETS)} style={{
                  fontFamily: mono, fontSize: 8, padding: '5px 8px', cursor: 'pointer', letterSpacing: 0.5,
                  background: patternPreset === key ? `${CYAN}22` : 'transparent',
                  border: `1px solid ${patternPreset === key ? CYAN : '#2a3a50'}`,
                  color: patternPreset === key ? CYAN : '#4a6080',
                }}>
                  {p.label}
                </button>
              ))}
            </div>
            <Slider label="ITERACIONES" value={patternSteps} min={50} max={900} step={10} onChange={setPatternSteps} accent={CYAN} />
            <AuthorCard entryId="turing" accent={CYAN} />
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: '#c8daf0', marginBottom: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={chaosEnabled} onChange={(e) => setChaosEnabled(e.target.checked)} />
          CAOS — sistema dinámico real
        </label>
        {chaosEnabled && (
          <div style={{ marginBottom: 16, paddingLeft: 4 }}>
            <select value={chaosSystem} onChange={(e) => setChaosSystem(e.target.value)} style={{
              width: '100%', fontFamily: mono, fontSize: 9, padding: 6, marginBottom: 10,
              background: '#020c18', border: '1px solid #2a3a50', color: '#c8daf0',
            }}>
              {Object.entries(attractors).map(([key, a]) => (
                <option key={key} value={key}>{a.name}</option>
              ))}
            </select>
            <Slider label="FUERZA" value={chaosStrength} min={0} max={1} step={0.01} onChange={setChaosStrength} accent="#ff2d55" />
            {chaosSystem === 'lorenz' ? (
              <AuthorCard entryId="lorenz" accent="#ff2d55" />
            ) : (
              <div style={{ marginTop: 10, padding: '10px 12px', border: '1px solid #ff2d5533', background: '#ff2d550a' }}>
                <div style={{ fontSize: 9, color: '#ff2d55', letterSpacing: 1, marginBottom: 6 }}>{chaosInfo.name.toUpperCase()}</div>
                <div style={{ fontSize: 8, color: '#4a6080', whiteSpace: 'pre-line', lineHeight: 1.7 }}>{chaosInfo.equations}</div>
              </div>
            )}
          </div>
        )}

        <button onClick={regenerate} disabled={generating} style={{
          width: '100%', fontFamily: mono, fontSize: 10, fontWeight: 700, padding: 11, marginTop: 8,
          cursor: generating ? 'default' : 'pointer', background: accent, color: '#020408', border: 'none',
          opacity: generating ? 0.5 : 1, letterSpacing: 1,
        }}>
          {generating ? `COMPONIENDO... ${Math.round(progress * 100)}%` : '▲ GENERAR'}
        </button>
        <button onClick={handleExportSTL} disabled={!ready || generating} style={{
          width: '100%', fontFamily: mono, fontSize: 10, fontWeight: 700, padding: 10, marginTop: 8,
          cursor: (!ready || generating) ? 'default' : 'pointer', background: 'transparent',
          border: `1px solid ${accent}`, color: accent, opacity: (!ready || generating) ? 0.4 : 1, letterSpacing: 1,
        }}>
          ▽ EXPORTAR .STL
        </button>
      </div>

      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', position: 'absolute', top: 0, left: 0 }} />

      {ready && !generating && (
        <div style={{
          position: 'absolute', bottom: 16, right: 16, textAlign: 'right', pointerEvents: 'none',
          background: 'rgba(5,10,20,0.85)', padding: '8px 12px', border: `1px solid ${accent}44`, backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: 9, color: '#4a6080', marginBottom: 4 }}>ESPÉCIMEN</div>
          <div style={{ fontSize: 10, color: accent, letterSpacing: 1 }}>
            {segmentCount} SEGMENTOS
            {patternEnabled ? ' · PATRÓN' : ''}
            {chaosEnabled ? ' · CAOS' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
