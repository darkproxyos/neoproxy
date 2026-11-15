'use client'

// PRIMER CUERPO — generador real del Espécimen 001 (ver blueprint). No es el
// render de Leonardo.ai: esto construye la malla de verdad, en el navegador,
// con el mismo motor de space colonization que ya usa /lab/proxygenesis
// (engine/spaceColonization.ts), combinado con una retícula de Cubo de
// Metatrón geométricamente exacta (12 vértices + 30 aristas reales de un
// icosaedro regular, no una forma libre). Exporta a .STL para imprimir.
//
// La semilla y el curl del coral NO son random: se derivan de datos reales
// de los 5 agentes donantes de Grietas (color hex + percentHuman de
// agents.ts) — documentado en el blueprint "NeoProxy — Espécimen 001:
// Primer Cuerpo". Mismo orden que GRIETA_DONOR_IDS en identity.ts.

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import * as BABYLON from 'babylonjs'
import { runSpaceColonization, computeRadii, type SkeletonNode, type Vec3 } from '@/app/lab/proxygenesis/engine/spaceColonization'
import { exportMeshToSTL } from '@/app/lab/proxygenesis/engine/stl'
import { agents } from '@/components/proxyverse/agents'

const mono = "'Space Mono', monospace"
const GREEN = '#00ff9d'

const DONOR_IDS = ['metatron', 'd', 'snake', 'genos', 'trickster'] as const

function parsePercent(s: string): number {
  const m = s.match(/(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : 25
}
function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16) || 0
}

type DonorData = { id: string; name: string; color: string; percent: number; colorNum: number }

function getDonorData(): DonorData[] {
  return DONOR_IDS.map(id => {
    const a = agents.find(x => x.id === id)!
    return { id, name: a.name, color: a.color, percent: parsePercent(a.percentHuman), colorNum: hexToNum(a.color) }
  })
}

function deriveSeedParams(donors: DonorData[]) {
  let seedAcc = 0
  donors.forEach((d, i) => { seedAcc += (d.colorNum % 997) * (i + 1) + Math.round(d.percent * 37) })
  const seed = (seedAcc % 2147483647) || 1
  const avgPercent = donors.reduce((a, b) => a + b.percent, 0) / donors.length
  const curl = 0.1 + Math.min(0.26, (avgPercent / 100) * 0.3)
  return { seed, curl }
}

// Cubo de Metatrón real: 12 vértices de un icosaedro regular (fórmula de
// razón áurea), conectados por sus 30 aristas reales -- se calculan por
// distancia mínima entre vértices, no a mano, así queda geométricamente
// exacto sin importar el radio que se elija.
function icosahedronVertices(radius: number): Vec3[] {
  const phi = (1 + Math.sqrt(5)) / 2
  const raw: Vec3[] = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
  ]
  const n = Math.hypot(1, phi, 0)
  return raw.map(([x, y, z]) => [x / n * radius, y / n * radius, z / n * radius] as Vec3)
}
function icosahedronEdges(vertices: Vec3[]): [number, number][] {
  const d = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
  let minD = Infinity
  for (let i = 0; i < vertices.length; i++) for (let j = i + 1; j < vertices.length; j++) {
    const dd = d(vertices[i], vertices[j]); if (dd < minD) minD = dd
  }
  const edges: [number, number][] = []
  for (let i = 0; i < vertices.length; i++) for (let j = i + 1; j < vertices.length; j++) {
    if (d(vertices[i], vertices[j]) < minD * 1.05) edges.push([i, j])
  }
  return edges
}

function alignCylinder(cyl: BABYLON.Mesh, a: BABYLON.Vector3, b: BABYLON.Vector3) {
  const seg = b.subtract(a)
  cyl.position = BABYLON.Vector3.Lerp(a, b, 0.5)
  const dirN = seg.normalize()
  const up = new BABYLON.Vector3(0, 1, 0)
  const dot = BABYLON.Vector3.Dot(up, dirN)
  if (dot < -0.9999) cyl.rotationQuaternion = BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(1, 0, 0), Math.PI)
  else if (dot < 0.9999) {
    const axis = BABYLON.Vector3.Cross(up, dirN).normalize()
    cyl.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, Math.acos(dot))
  }
}

export default function PrimerCuerpoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<BABYLON.Scene | null>(null)
  const coralMeshRef = useRef<BABYLON.Mesh | null>(null)
  const latticeMeshRef = useRef<BABYLON.Mesh | null>(null)
  const autoRotateRef = useRef(true)
  const [isClient, setIsClient] = useState(false)
  const [growPct, setGrowPct] = useState(0)
  const [done, setDone] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)

  const donors = getDonorData()
  const { seed, curl } = deriveSeedParams(donors)

  useEffect(() => { setIsClient(true) }, [])
  useEffect(() => { autoRotateRef.current = autoRotate }, [autoRotate])

  // escena + retícula (fija, se arma una sola vez)
  useEffect(() => {
    if (!isClient || !canvasRef.current) return
    const engine = new BABYLON.Engine(canvasRef.current, true)
    const scene = new BABYLON.Scene(engine)
    sceneRef.current = scene
    scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.015, 1)

    const camera = new BABYLON.ArcRotateCamera('cam', Math.PI / 3, Math.PI / 2.4, 7.5, new BABYLON.Vector3(0, 1.2, 0), scene)
    camera.attachControl(canvasRef.current, true)
    camera.wheelPrecision = 50
    camera.lowerRadiusLimit = 3
    camera.upperRadiusLimit = 20

    const hemi = new BABYLON.HemisphericLight('h', new BABYLON.Vector3(0, 1, 0), scene)
    hemi.intensity = 0.5
    const dirLight = new BABYLON.DirectionalLight('dl', new BABYLON.Vector3(-0.5, -1, -0.3), scene)
    dirLight.intensity = 0.6

    const gl = new BABYLON.GlowLayer('glow', scene)
    gl.intensity = 0.7

    const verts = icosahedronVertices(1.6)
    const edges = icosahedronEdges(verts)
    const latticeParts: BABYLON.Mesh[] = []
    for (const [i, j] of edges) {
      const a = new BABYLON.Vector3(...verts[i])
      const b = new BABYLON.Vector3(...verts[j])
      const h = BABYLON.Vector3.Distance(a, b)
      if (h < 1e-5) continue
      const cyl = BABYLON.MeshBuilder.CreateCylinder(`edge${i}_${j}`, { diameter: 0.045, height: h, tessellation: 6 }, scene)
      alignCylinder(cyl, a, b)
      latticeParts.push(cyl)
    }
    for (const v of verts) {
      const sph = BABYLON.MeshBuilder.CreateSphere('node', { diameter: 0.08, segments: 8 }, scene)
      sph.position = new BABYLON.Vector3(...v)
      latticeParts.push(sph)
    }
    const lattice = BABYLON.Mesh.MergeMeshes(latticeParts, true, true, undefined, false, true)
    if (lattice) {
      lattice.name = 'Lattice_Metatron'
      const mat = new BABYLON.StandardMaterial('latticeMat', scene)
      mat.diffuseColor = BABYLON.Color3.FromHexString(GREEN).scale(0.2)
      mat.emissiveColor = BABYLON.Color3.FromHexString(GREEN).scale(0.45)
      mat.specularColor = BABYLON.Color3.FromHexString(GREEN)
      mat.alpha = 0.55
      mat.backFaceCulling = false
      lattice.material = mat
      latticeMeshRef.current = lattice
    }

    engine.runRenderLoop(() => {
      if (autoRotateRef.current) camera.alpha += 0.0022
      scene.render()
    })
    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)

    return () => {
      engine.dispose()
      sceneRef.current = null
      window.removeEventListener('resize', onResize)
    }
  }, [isClient])

  // crecimiento del coral — motor real de space colonization, en chunks por
  // requestAnimationFrame para no congelar la pestaña
  useEffect(() => {
    if (!isClient || !sceneRef.current) return
    const scene = sceneRef.current
    let cancelled = false

    const gen = runSpaceColonization({
      seed,
      numAttractors: 650,
      canopyCenter: [0, 1.1, 0],
      canopyRadius: [1.75, 2.5, 1.75],
      rootPos: [0, -1.5, 0],
      influenceRadius: 0.85,
      killDistance: 0.17,
      stepSize: 0.12,
      maxIterations: 420,
      curl,
    })

    const buildCoral = (nodes: SkeletonNode[]) => {
      const old = scene.getMeshByName('Coral_Primer_Cuerpo')
      if (old) old.dispose()
      const radii = computeRadii(nodes, { leafRadius: 0.022, exponent: 2.3, maxRadius: 0.4 })
      const parts: BABYLON.Mesh[] = []
      for (let i = 1; i < nodes.length; i++) {
        const child = nodes[i]
        const parent = nodes[child.parent]
        const a = new BABYLON.Vector3(...parent.pos)
        const b = new BABYLON.Vector3(...child.pos)
        const h = BABYLON.Vector3.Distance(a, b)
        if (h < 1e-5) continue
        const cyl = BABYLON.MeshBuilder.CreateCylinder(`coral${i}`, {
          diameterTop: Math.max(0.01, radii[i] * 2),
          diameterBottom: Math.max(0.01, radii[child.parent] * 2),
          height: h, tessellation: 6,
        }, scene)
        alignCylinder(cyl, a, b)
        parts.push(cyl)
      }
      const merged = BABYLON.Mesh.MergeMeshes(parts, true, true, undefined, false, true)
      if (merged) {
        merged.name = 'Coral_Primer_Cuerpo'
        const mat = new BABYLON.StandardMaterial('coralMat', scene)
        mat.diffuseColor = BABYLON.Color3.FromHexString(GREEN).scale(0.3)
        mat.emissiveColor = BABYLON.Color3.FromHexString(GREEN).scale(0.55)
        mat.specularColor = BABYLON.Color3.FromHexString(GREEN)
        mat.alpha = 0.72
        merged.material = mat
        coralMeshRef.current = merged
      }
    }

    let frame = 0
    const step = () => {
      if (cancelled) return
      let result = gen.next()
      let stepsThisFrame = 0
      while (!result.done && stepsThisFrame < 6) {
        result = gen.next()
        stepsThisFrame++
      }
      if (result.value) {
        const v = result.value
        setGrowPct(Math.min(99, Math.round((v.iteration / v.maxIterations) * 100)))
        if (frame % 5 === 0 || result.done) buildCoral(v.nodes)
      }
      frame++
      if (!result.done) requestAnimationFrame(step)
      else { setGrowPct(100); setDone(true) }
    }
    requestAnimationFrame(step)

    return () => { cancelled = true }
  }, [isClient, seed, curl])

  const handleExport = useCallback(() => {
    if (!latticeMeshRef.current || !coralMeshRef.current) return
    const clones = [latticeMeshRef.current.clone('latticeClone', null), coralMeshRef.current.clone('coralClone', null)].filter(Boolean) as BABYLON.Mesh[]
    const merged = BABYLON.Mesh.MergeMeshes(clones, true, true, undefined, false, true)
    if (merged) {
      exportMeshToSTL(merged, 'neoproxy-primer-cuerpo.stl')
      merged.dispose()
    }
  }, [])

  return (
    <div style={{ background: '#000503', minHeight: '100vh', color: '#c8f0da', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '100px 24px 100px' }}>
        <Link href="/proxyverse/prototype" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a8058', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A PR0T0??
        </Link>

        <div style={{ fontSize: 9, color: `${GREEN}66`, letterSpacing: 6, marginBottom: 16 }}>
          NPX-LAB-PRIMERCUERPO // GENERADOR REAL — ESPÉCIMEN 001
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, letterSpacing: 5, color: GREEN,
          textShadow: `0 0 40px ${GREEN}55`, marginBottom: 14, lineHeight: 1.05,
        }}>
          PRIMER CUERPO
        </h1>
        <p style={{ fontSize: 11, color: '#8fd6b0', lineHeight: 2, maxWidth: 620, marginBottom: 32 }}>
          Retícula de Cubo de Metatrón (icosaedro real, 12 vértices / 30 aristas) + coral de space
          colonization creciendo a través de ella y desbordándola — la misma jaula y la misma fuga
          que la "Fricción Metatrón↔DarkProxy" de la lore. La semilla y el curl del coral salen de
          datos reales de los 5 agentes que le prestaron un fragmento a Prototype, no de un número
          al azar.
        </p>

        <div style={{ border: `1px solid ${GREEN}33`, position: 'relative', marginBottom: 20 }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: 480, display: 'block' }} />
          <div style={{
            position: 'absolute', top: 12, right: 12, fontSize: 10, letterSpacing: 1,
            color: GREEN, border: `1px solid ${GREEN}55`, padding: '6px 12px', background: '#00120aaa',
          }}>
            {done ? 'CRECIMIENTO COMPLETO' : `CRECIENDO://${growPct}%`}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
          <button
            onClick={() => setAutoRotate(r => !r)}
            style={{
              fontFamily: mono, fontSize: 10, letterSpacing: 2, padding: '10px 18px', cursor: 'pointer',
              background: autoRotate ? `${GREEN}22` : 'transparent', border: `1px solid ${GREEN}66`, color: GREEN,
            }}
          >
            GIRO AUTO {autoRotate ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleExport}
            disabled={!done}
            style={{
              fontFamily: mono, fontSize: 10, letterSpacing: 2, padding: '10px 18px',
              cursor: done ? 'pointer' : 'default', opacity: done ? 1 : 0.4,
              background: `${GREEN}22`, border: `1px solid ${GREEN}`, color: GREEN,
            }}
          >
            EXPORTAR .STL
          </button>
        </div>

        <div style={{ fontSize: 9, letterSpacing: 3, color: `${GREEN}88`, marginBottom: 14 }}>
          DATOS REALES QUE ALIMENTAN LA SEMILLA — LOS 5 DONANTES DE GRIETAS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 40 }}>
          {donors.map(d => (
            <div key={d.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              border: `1px solid ${d.color}55`, background: `${d.color}0a`,
            }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: 10, letterSpacing: 1, color: '#dff5e8' }}>
                {d.name} <span style={{ color: '#4a8058' }}>— {d.color} · {d.percent}%</span>
              </span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 10, color: '#4a8058', lineHeight: 1.9, maxWidth: 620 }}>
          Semilla derivada: {seed} · curl: {curl.toFixed(3)}. Esto no es el render de referencia —
          es la malla real, exportable, que se imprime en resina. El blueprint completo (materiales,
          litofanía, NFC, edición) vive aparte, documentado antes de fabricar nada.
        </p>
      </div>
    </div>
  )
}
