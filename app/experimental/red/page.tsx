'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { entries } from '@/components/knowledge/entries'
import {
  generateErdosRenyi, generateBarabasiAlbert, layoutForceDirected, degreeOf, type Graph,
} from './engine/randomGraph'
import {
  infer, NODE_ORDER, NODE_LABEL, EDGES, type NodeId, type Evidence,
} from './engine/bayesNet'

// NPX-XP-RED — cuarto modo del laboratorio, el único donde el objeto no es
// una forma ni un comportamiento en el tiempo ni una discusión: es una
// estructura de relaciones. Dos motores reales, deliberadamente puestos uno
// al lado del otro para que se note la diferencia:
//   ALEATORIA — Erdős–Rényi vs Barabási-Albert: misma cantidad de nodos,
//   distribución de grado radicalmente distinta.
//   BAYESIANA — Pearl: una red fija con inferencia EXACTA (enumeración
//   completa de las 16 asignaciones posibles), no una animación de mentira.

const mono = "'Space Mono', monospace"
const RED = '#cc0000'
const CYAN = '#00d4ff'

type Mode = 'aleatoria' | 'bayesiana'
type GraphType = 'er' | 'ba'

const BAYES_POS: Record<NodeId, [number, number, number]> = {
  nublado: [0, 1.7, 0],
  aspersor: [-1.7, 0, 0],
  lluvia: [1.7, 0, 0],
  pasto: [0, -1.7, 0],
}

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

export default function RedPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const BRef = useRef<any>(null)
  const sceneRef = useRef<any>(null)
  const nodeMeshRef = useRef<any>(null)
  const edgeMeshRef = useRef<any>(null)
  const bayesTexturesRef = useRef<Partial<Record<NodeId, any>>>({})
  const disposedRef = useRef(false)

  const [mode, setMode] = useState<Mode>('aleatoria')
  const modeRef = useRef<Mode>('aleatoria')
  useEffect(() => { modeRef.current = mode }, [mode])

  const [graphType, setGraphType] = useState<GraphType>('er')
  const [nodeCount, setNodeCount] = useState(50)
  const [erP, setErP] = useState(0.06)
  const [baM, setBaM] = useState(2)
  const [generating, setGenerating] = useState(false)
  const [graphReady, setGraphReady] = useState(false)
  const [degrees, setDegrees] = useState<number[]>([])
  const [edgeCount, setEdgeCount] = useState(0)

  const [evidence, setEvidence] = useState<Evidence>({})
  const posterior = infer(evidence)

  const redrawBayesNode = (B: any, id: NodeId, ev: Evidence, post: Record<NodeId, number>) => {
    const tex = bayesTexturesRef.current[id]
    if (!tex) return
    const size = 256
    const ctx = tex.getContext()
    const state = ev[id]
    const color = state === true ? '#00ff9d' : state === false ? '#ff2d55' : CYAN
    const prob = post[id]
    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = '#05080f'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = `${color}33`
    const barH = (size - 24) * prob
    ctx.fillRect(12, size - 12 - barH, size - 24, barH)
    ctx.strokeStyle = color
    ctx.lineWidth = 5
    ctx.strokeRect(3, 3, size - 6, size - 6)
    ctx.textAlign = 'center'
    ctx.fillStyle = color
    ctx.font = 'bold 19px monospace'
    ctx.fillText(NODE_LABEL[id], size / 2, 40)
    ctx.font = 'bold 30px monospace'
    ctx.fillText(`${Math.round(prob * 100)}%`, size / 2, size / 2 + 10)
    ctx.font = '13px monospace'
    ctx.fillStyle = '#8fb8d6'
    ctx.fillText(state === true ? 'EVIDENCIA: SÍ' : state === false ? 'EVIDENCIA: NO' : 'CLIC PARA FIJAR', size / 2, size - 18)
    tex.update()
  }

  const redrawAllBayesNodes = (ev: Evidence) => {
    const B = BRef.current
    if (!B) return
    const post = infer(ev)
    for (const id of NODE_ORDER) redrawBayesNode(B, id, ev, post)
  }

  const cycleEvidence = (id: NodeId) => {
    setEvidence((prev) => {
      const cur = prev[id]
      const next: Evidence = { ...prev }
      if (cur === undefined) next[id] = true
      else if (cur === true) next[id] = false
      else delete next[id]
      redrawAllBayesNodes(next)
      return next
    })
  }

  const regenerateGraph = () => {
    const B = BRef.current
    const scene = sceneRef.current
    if (!B || !scene || generating) return
    setGenerating(true)

    const seed = Math.floor(Math.random() * 1e6)
    const raw: Graph = graphType === 'er'
      ? generateErdosRenyi(nodeCount, erP, seed)
      : generateBarabasiAlbert(nodeCount, baM, seed)
    const laidOut = layoutForceDirected(raw, 160, 3.5, seed)
    const degs = degreeOf(laidOut)
    const maxDeg = Math.max(1, ...degs)

    nodeMeshRef.current?.dispose()
    edgeMeshRef.current?.dispose()

    const n = laidOut.nodes.length
    const nodeBase = B.MeshBuilder.CreateSphere('redNodeBase', { diameter: 0.17, segments: 8 }, scene)
    const nodeMat = new B.StandardMaterial('redNodeMat', scene)
    nodeMat.diffuseColor = new B.Color3(1, 1, 1)
    nodeBase.material = nodeMat
    nodeBase.alwaysSelectAsActiveMesh = true
    nodeBase.thinInstanceCount = n
    const nodeMatrices = new Float32Array(n * 16)
    const nodeColors = new Float32Array(n * 4)
    for (let i = 0; i < n; i++) {
      const p = laidOut.nodes[i].pos
      B.Matrix.Translation(p[0], p[1], p[2]).copyToArray(nodeMatrices, i * 16)
      const t = degs[i] / maxDeg
      nodeColors[i * 4] = 0.15 + t * 0.85
      nodeColors[i * 4 + 1] = 0.02
      nodeColors[i * 4 + 2] = 0.02 + t * 0.1
      nodeColors[i * 4 + 3] = 1
    }
    nodeBase.thinInstanceSetBuffer('matrix', nodeMatrices, 16, true)
    nodeBase.thinInstanceSetBuffer('color', nodeColors, 4, true)
    nodeMeshRef.current = nodeBase

    const up = new B.Vector3(0, 1, 0)
    const eCount = laidOut.edges.length
    const edgeBase = B.MeshBuilder.CreateCylinder('redEdgeBase', { diameter: 0.022, height: 1, tessellation: 5 }, scene)
    const edgeMat = new B.StandardMaterial('redEdgeMat', scene)
    edgeMat.emissiveColor = new B.Color3(0.35, 0.08, 0.08)
    edgeMat.alpha = 0.55
    edgeBase.material = edgeMat
    edgeBase.alwaysSelectAsActiveMesh = true
    if (eCount > 0) {
      edgeBase.thinInstanceCount = eCount
      const edgeMatrices = new Float32Array(eCount * 16)
      for (let i = 0; i < eCount; i++) {
        const e = laidOut.edges[i]
        const from3 = new B.Vector3(...laidOut.nodes[e.a].pos)
        const to3 = new B.Vector3(...laidOut.nodes[e.b].pos)
        const seg = to3.subtract(from3)
        const h = seg.length() || 0.001
        const dirN = seg.normalize()
        let rot = B.Quaternion.Identity()
        const dot = B.Vector3.Dot(up, dirN)
        if (dot < -0.9999) rot = B.Quaternion.RotationAxis(new B.Vector3(1, 0, 0), Math.PI)
        else if (dot < 0.9999) rot = B.Quaternion.RotationAxis(B.Vector3.Cross(up, dirN).normalize(), Math.acos(dot))
        const mid = B.Vector3.Lerp(from3, to3, 0.5)
        B.Matrix.Compose(new B.Vector3(1, h, 1), rot, mid).copyToArray(edgeMatrices, i * 16)
      }
      edgeBase.thinInstanceSetBuffer('matrix', edgeMatrices, 16, true)
    } else {
      edgeBase.thinInstanceCount = 0
    }
    edgeMeshRef.current = edgeBase

    setDegrees([...degs].sort((a, b) => b - a))
    setEdgeCount(eCount)
    setGraphReady(true)
    setGenerating(false)
  }

  useEffect(() => {
    if (!canvasRef.current) return
    disposedRef.current = false
    let engine: any

    const init = async () => {
      const B = await import('@babylonjs/core')
      if (disposedRef.current) return
      BRef.current = B
      engine = new B.Engine(canvasRef.current!, true)
      const scene = new B.Scene(engine)
      sceneRef.current = scene
      scene.clearColor = new B.Color4(0.004, 0.008, 0.016, 1)

      const camera = new B.ArcRotateCamera('red-cam', -Math.PI / 2.4, 1.1, 9, new B.Vector3(0, 0, 0), scene)
      camera.attachControl(canvasRef.current, true)
      camera.wheelPrecision = 35
      camera.lowerRadiusLimit = 1.5
      camera.upperRadiusLimit = 22
      camera.minZ = 0.05

      const fill = new B.HemisphericLight('red-fill', new B.Vector3(0, 1, 0.2), scene)
      fill.intensity = 0.6
      fill.groundColor = new B.Color3(0.05, 0.05, 0.1)
      const key = new B.PointLight('red-key', new B.Vector3(4, 5, -3), scene)
      key.intensity = 0.8

      // --- red bayesiana: 4 nodos fijos, cada uno un plano con su propia
      // DynamicTexture (nombre + probabilidad posterior + estado de
      // evidencia), redibujada en vivo al hacer clic — no se regenera
      // nunca, solo cambia lo que muestra ---
      for (const id of NODE_ORDER) {
        const tex = new B.DynamicTexture(`bn-tex-${id}`, { width: 256, height: 256 }, scene, true)
        bayesTexturesRef.current[id] = tex
        const plane = B.MeshBuilder.CreatePlane(`bn-plane-${id}`, { size: 1.15 }, scene)
        plane.position.set(...BAYES_POS[id])
        plane.billboardMode = B.Mesh.BILLBOARDMODE_ALL
        const mat = new B.StandardMaterial(`bn-mat-${id}`, scene)
        mat.diffuseTexture = tex
        mat.emissiveTexture = tex
        mat.disableLighting = true
        mat.backFaceCulling = false
        plane.material = mat
        plane.metadata = { bayesId: id }
      }
      const edgeMat = new B.StandardMaterial('bn-edgemat', scene)
      edgeMat.emissiveColor = new B.Color3(0.2, 0.3, 0.4)
      for (const [from, to] of EDGES) {
        const from3 = new B.Vector3(...BAYES_POS[from])
        const to3 = new B.Vector3(...BAYES_POS[to])
        const seg = to3.subtract(from3)
        const h = seg.length()
        const dirN = seg.normalize()
        const cyl = B.MeshBuilder.CreateCylinder(`bn-edge-${from}-${to}`, { diameter: 0.035, height: h, tessellation: 6 }, scene)
        cyl.position = B.Vector3.Lerp(from3, to3, 0.5)
        const up = new B.Vector3(0, 1, 0)
        const dot = B.Vector3.Dot(up, dirN)
        if (dot < -0.9999) cyl.rotationQuaternion = B.Quaternion.RotationAxis(new B.Vector3(1, 0, 0), Math.PI)
        else if (dot < 0.9999) cyl.rotationQuaternion = B.Quaternion.RotationAxis(B.Vector3.Cross(up, dirN).normalize(), Math.acos(dot))
        cyl.material = edgeMat
        cyl.isPickable = false
      }
      redrawAllBayesNodes({})

      scene.onPointerObservable.add((pointerInfo: any) => {
        if (pointerInfo.type !== B.PointerEventTypes.POINTERPICK) return
        const mesh = pointerInfo.pickInfo?.pickedMesh
        const id = mesh?.metadata?.bayesId as NodeId | undefined
        if (id) cycleEvidence(id)
      })

      scene.registerBeforeRender(() => {
        const inAleatoria = modeRef.current === 'aleatoria'
        nodeMeshRef.current?.setEnabled(inAleatoria)
        edgeMeshRef.current?.setEnabled(inAleatoria)
        for (const id of NODE_ORDER) {
          scene.getMeshByName(`bn-plane-${id}`)?.setEnabled(!inAleatoria)
        }
        for (const [from, to] of EDGES) {
          scene.getMeshByName(`bn-edge-${from}-${to}`)?.setEnabled(!inAleatoria)
        }
      })

      regenerateGraph()

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

  const accent = graphType === 'er' ? RED : CYAN
  const maxDegree = Math.max(1, ...degrees)

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
        <div style={{ fontSize: 11, letterSpacing: 3, color: RED, fontWeight: 700 }}>NPX-XP-RED</div>
        <div style={{ fontSize: 9, letterSpacing: 1, color: '#4a6080' }}>el objeto es la relación, no la forma</div>
      </div>

      <div style={{
        position: 'absolute', top: 44, left: 0, bottom: 0, width: 300, overflowY: 'auto',
        background: 'rgba(5,10,20,0.92)', borderRight: `1px solid ${RED}22`, padding: 16, zIndex: 90,
      }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['aleatoria', 'bayesiana'] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, fontFamily: mono, fontSize: 9, padding: '8px 6px', letterSpacing: 0.5, cursor: 'pointer',
              background: mode === m ? `${RED}22` : 'transparent',
              border: `1px solid ${mode === m ? RED : '#2a3a50'}`,
              color: mode === m ? RED : '#4a6080',
            }}>
              {m === 'aleatoria' ? 'ALEATORIA' : 'BAYESIANA'}
            </button>
          ))}
        </div>

        {mode === 'aleatoria' ? (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {(['er', 'ba'] as GraphType[]).map((gt) => (
                <button key={gt} onClick={() => setGraphType(gt)} style={{
                  flex: 1, fontFamily: mono, fontSize: 8, padding: '7px 5px', cursor: 'pointer', letterSpacing: 0.5,
                  background: graphType === gt ? `${gt === 'er' ? RED : CYAN}22` : 'transparent',
                  border: `1px solid ${graphType === gt ? (gt === 'er' ? RED : CYAN) : '#2a3a50'}`,
                  color: graphType === gt ? (gt === 'er' ? RED : CYAN) : '#4a6080',
                }}>
                  {gt === 'er' ? 'ERDŐS–RÉNYI' : 'BARABÁSI-ALBERT'}
                </button>
              ))}
            </div>
            <Slider label="NODOS" value={nodeCount} min={10} max={120} step={1} onChange={setNodeCount} accent={accent} />
            {graphType === 'er' ? (
              <Slider label="P (probabilidad por arista)" value={erP} min={0.01} max={0.2} step={0.005} onChange={setErP} accent={accent} />
            ) : (
              <Slider label="M (aristas por nodo nuevo)" value={baM} min={1} max={6} step={1} onChange={setBaM} accent={accent} />
            )}
            <button onClick={regenerateGraph} disabled={generating} style={{
              width: '100%', fontFamily: mono, fontSize: 10, fontWeight: 700, padding: 11, marginTop: 6, marginBottom: 14,
              cursor: generating ? 'default' : 'pointer', background: accent, color: '#020408', border: 'none',
              opacity: generating ? 0.5 : 1, letterSpacing: 1,
            }}>
              {generating ? 'ARMANDO RED...' : '▲ GENERAR'}
            </button>

            {graphReady && (
              <>
                <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 1, marginBottom: 8 }}>
                  {nodeCount} NODOS · <span style={{ color: accent }}>{edgeCount} ARISTAS</span>
                </div>
                <div style={{ fontSize: 8, color: '#4a6080', letterSpacing: 1, marginBottom: 4 }}>
                  DISTRIBUCIÓN DE GRADO (ordenada, mayor a menor)
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 50, marginBottom: 14, border: `1px solid ${accent}22`, padding: '4px 4px 0' }}>
                  {degrees.map((d, i) => (
                    <div key={i} style={{ flex: 1, background: accent, opacity: 0.3 + 0.7 * (d / maxDegree), height: `${Math.max(2, (d / maxDegree) * 100)}%` }} />
                  ))}
                </div>
              </>
            )}
            <AuthorCard entryId={graphType === 'er' ? 'erdos-renyi' : 'barabasi'} accent={accent} />
          </>
        ) : (
          <>
            <p style={{ fontSize: 10, color: '#8fb8d6', lineHeight: 1.8, marginBottom: 14 }}>
              Hacé clic en un nodo de la red (NUBLADO, ASPERSOR, LLUVIA, PASTO MOJADO) para fijarlo
              como evidencia — SÍ, NO, o sin evidencia otra vez. Las probabilidades de los demás
              se recalculan al instante, por inferencia exacta.
            </p>
            <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 1, marginBottom: 14 }}>
              EVIDENCIA ACTUAL: {Object.keys(evidence).length === 0 ? 'ninguna' : NODE_ORDER.filter(id => id in evidence).map(id => `${NODE_LABEL[id]}=${evidence[id] ? 'SÍ' : 'NO'}`).join(', ')}
            </div>
            <button onClick={() => { setEvidence({}); redrawAllBayesNodes({}) }} style={{
              width: '100%', fontFamily: mono, fontSize: 10, fontWeight: 700, padding: 10, marginBottom: 14,
              cursor: 'pointer', background: 'transparent', border: `1px solid ${CYAN}`, color: CYAN, letterSpacing: 1,
            }}>
              ↺ LIMPIAR EVIDENCIA
            </button>
            <AuthorCard entryId="pearl" accent={CYAN} />
          </>
        )}
      </div>

      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', position: 'absolute', top: 0, left: 0 }} />
    </div>
  )
}
