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
//
// Revisión de código cruzada (3 IA externas) aplicada acá: aristas del
// icosaedro hardcodeadas (eran correctas por umbral, pero frágiles a futuro
// ruido orgánico en los vértices), stepping del generador presupuestado por
// tiempo real en vez de pasos fijos, cadencia de rebuild del coral bajada
// para no saturar el hilo principal, y el fallback de 25% de D/Trickster
// reemplazado por valores derivados de datos reales (nunca se tocan las
// bios shipeadas en agents.ts, que ya cumplen otra función en el resto del
// sitio). El export de STL se reconstruye desde los datos crudos (vértices
// del icosaedro + nodos del esqueleto del coral) en vez de clonar los mesh
// en vivo: Babylon.Mesh.clone() comparte la geometría subyacente con el
// original, y disponer el clon mergeado corrompía la malla visible en
// pantalla (confirmado con un stack trace real en
// `_renderTransparentSorted` que persistía en casi todos los frames
// siguientes, no en uno solo — intentar "arreglarlo" con un try/catch en el
// render loop solo tapaba el síntoma, la escena seguía sin poder renderizar
// nada nuevo después de exportar).

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import * as BABYLON from 'babylonjs'
import { runSpaceColonization, computeRadii, type SkeletonNode, type Vec3 } from '@/app/lab/proxygenesis/engine/spaceColonization'
import { exportMeshToSTL } from '@/app/lab/proxygenesis/engine/stl'
import { agents } from '@/components/proxyverse/agents'

const mono = "'Space Mono', monospace"
const GREEN = '#00ff9d'

// Tamaño objetivo real de impresión (ver blueprint "Primer Cuerpo", ~70-80mm
// en resina) — el STL no tiene unidades propias, así que el export escala el
// bounding box real de la malla hasta esta altura en mm antes de grabar el
// archivo. No es un factor fijo adivinado: se calcula contra la malla real
// en el momento del export.
const TARGET_HEIGHT_MM = 75

const DONOR_IDS = ['metatron', 'd', 'snake', 'genos', 'trickster'] as const

// 'd' nunca tuvo un número real ("¿Humano? Pregunta mal planteada.") — un
// fallback de 25% era arbitrario y no decía nada; 0 es el valor que esa
// pregunta efectivamente "contesta", coherente con el resto de su bio.
// 'trickster' ("variable — nunca es el mismo número dos veces") tampoco
// tiene número propio -- en vez de otro fallback fijo, su valor se deriva
// de la suma de los otros cuatro (sigue siendo determinístico para que el
// STL sea reproducible, pero "variable" ahora significa algo real: depende
// de los demás, no de él mismo).
function parseKnownPercent(id: string, raw: string): number | null {
  const m = raw.match(/(\d+(?:\.\d+)?)/)
  if (m) return parseFloat(m[1])
  if (id === 'd') return 0
  return null // trickster: se resuelve en getDonorData, depende de los otros 4
}
function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16) || 0
}

type DonorData = { id: string; name: string; color: string; percent: number; colorNum: number }

function getDonorData(): DonorData[] {
  const base = DONOR_IDS.map(id => {
    const a = agents.find(x => x.id === id)!
    return { id, name: a.name, color: a.color, colorNum: hexToNum(a.color), known: parseKnownPercent(id, a.percentHuman) }
  })
  const sumKnown = base.reduce((acc, d) => acc + (d.known ?? 0), 0)
  return base.map(d => ({
    id: d.id, name: d.name, color: d.color, colorNum: d.colorNum,
    percent: d.known ?? (sumKnown % 100),
  }))
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
// razón áurea). Las 30 aristas son una constante geométrica (cada vértice
// conecta con sus 5 vecinos más cercanos) -- antes se detectaban por umbral
// de distancia; funcionaba (el salto real es de ~2.0 a ~3.236, un margen
// enorme), pero quedaba frágil si algún día los vértices se perturban con
// ruido orgánico. Hardcodeada, la conectividad no depende de la geometría.
// Verificada a mano: 30 aristas, los 12 vértices con grado 5 cada uno.
const ICOSAHEDRON_EDGES: [number, number][] = [
  [0, 1], [0, 5], [0, 7], [0, 10], [0, 11],
  [1, 5], [1, 7], [1, 8], [1, 9],
  [2, 3], [2, 4], [2, 6], [2, 10], [2, 11],
  [3, 4], [3, 6], [3, 8], [3, 9],
  [4, 5], [4, 9], [4, 11],
  [5, 9], [5, 11],
  [6, 7], [6, 8], [6, 10],
  [7, 8], [7, 10],
  [8, 9],
  [10, 11],
]
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

// Partes sin mergear de la retícula y del coral -- funciones puras, cada
// llamada crea geometría nueva e independiente. Las usan tanto la escena en
// vivo (una vez cada una) como el export de STL (de nuevo, fresco, nunca
// clonando lo que ya está en pantalla).
function buildLatticeParts(scene: BABYLON.Scene): BABYLON.Mesh[] {
  const verts = icosahedronVertices(1.6)
  const parts: BABYLON.Mesh[] = []
  for (const [i, j] of ICOSAHEDRON_EDGES) {
    const a = new BABYLON.Vector3(...verts[i])
    const b = new BABYLON.Vector3(...verts[j])
    const h = BABYLON.Vector3.Distance(a, b)
    if (h < 1e-5) continue
    const cyl = BABYLON.MeshBuilder.CreateCylinder(`edge${i}_${j}`, { diameter: 0.045, height: h, tessellation: 6 }, scene)
    alignCylinder(cyl, a, b)
    parts.push(cyl)
  }
  for (const v of verts) {
    const sph = BABYLON.MeshBuilder.CreateSphere('node', { diameter: 0.08, segments: 8 }, scene)
    sph.position = new BABYLON.Vector3(...v)
    parts.push(sph)
  }
  return parts
}

function buildCoralParts(scene: BABYLON.Scene, nodes: SkeletonNode[]): BABYLON.Mesh[] {
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
  return parts
}

export default function PrimerCuerpoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<BABYLON.Scene | null>(null)
  const lastCoralNodesRef = useRef<SkeletonNode[]>([])
  const autoRotateRef = useRef(true)
  const [isClient, setIsClient] = useState(false)
  const [growPct, setGrowPct] = useState(0)
  const [done, setDone] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)

  const donors = useMemo(() => getDonorData(), [])
  const { seed, curl } = useMemo(() => deriveSeedParams(donors), [donors])

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

    const lattice = BABYLON.Mesh.MergeMeshes(buildLatticeParts(scene), true, true, undefined, false, true)
    if (lattice) {
      lattice.name = 'Lattice_Metatron'
      const mat = new BABYLON.StandardMaterial('latticeMat', scene)
      mat.diffuseColor = BABYLON.Color3.FromHexString(GREEN).scale(0.2)
      mat.emissiveColor = BABYLON.Color3.FromHexString(GREEN).scale(0.45)
      mat.specularColor = BABYLON.Color3.FromHexString(GREEN)
      mat.alpha = 0.55
      mat.backFaceCulling = false
      lattice.material = mat
    }

    engine.runRenderLoop(() => {
      if (autoRotateRef.current) camera.alpha += 0.0022
      scene.render()
    })
    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      scene.dispose()
      engine.dispose()
      sceneRef.current = null
    }
  }, [isClient])

  // crecimiento del coral — motor real de space colonization. Presupuesto
  // de tiempo real por frame (no un número fijo de pasos: a distinto
  // framerate, un conteo fijo de pasos corre a distinta velocidad real) y
  // la malla se reconstruye cada 15 frames en vez de cada 5 -- sigue
  // viéndose crecer, pero sin saturar el hilo principal con miles de
  // cilindros creados/dispuestos por segundo cerca del final.
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
      const merged = BABYLON.Mesh.MergeMeshes(buildCoralParts(scene, nodes), true, true, undefined, false, true)
      if (merged) {
        merged.name = 'Coral_Primer_Cuerpo'
        const mat = new BABYLON.StandardMaterial('coralMat', scene)
        mat.diffuseColor = BABYLON.Color3.FromHexString(GREEN).scale(0.3)
        mat.emissiveColor = BABYLON.Color3.FromHexString(GREEN).scale(0.55)
        mat.specularColor = BABYLON.Color3.FromHexString(GREEN)
        mat.alpha = 0.72
        merged.material = mat
      }
      lastCoralNodesRef.current = nodes
    }

    const FRAME_BUDGET_MS = 8
    const REBUILD_EVERY_N_FRAMES = 15
    let frame = 0
    const step = () => {
      if (cancelled) return
      const t0 = performance.now()
      let result = gen.next()
      while (!result.done && performance.now() - t0 < FRAME_BUDGET_MS) {
        result = gen.next()
      }
      if (result.value) {
        const v = result.value
        setGrowPct(Math.min(99, Math.round((v.iteration / v.maxIterations) * 100)))
        if (frame % REBUILD_EVERY_N_FRAMES === 0 || result.done) buildCoral(v.nodes)
      }
      frame++
      if (!result.done) requestAnimationFrame(step)
      else { setGrowPct(100); setDone(true) }
    }
    requestAnimationFrame(step)

    return () => { cancelled = true }
  }, [isClient, seed, curl])

  // El export reconstruye la malla desde cero (vértices del icosaedro +
  // últimos nodos del esqueleto del coral) en vez de clonar lo que está en
  // pantalla -- ver nota de arriba sobre por qué clonar corrompía la escena
  // en vivo. Estas partes nunca comparten geometría con nada visible, así
  // que disponerlas después de exportar es seguro.
  const handleExport = useCallback(() => {
    const scene = sceneRef.current
    const nodes = lastCoralNodesRef.current
    if (!scene || nodes.length === 0) return

    const exportParts = [...buildLatticeParts(scene), ...buildCoralParts(scene, nodes)]
    if (exportParts.length === 0) return

    let merged: BABYLON.Mesh | null = null
    try {
      merged = BABYLON.Mesh.MergeMeshes(exportParts, true, true, undefined, false, true)
      if (!merged) return
      // El STL no tiene unidades propias -- se escala el bounding box real
      // de la malla hasta TARGET_HEIGHT_MM antes de exportar. exportMeshToSTL
      // lee los buffers de vértices locales (getVerticesData), así que
      // bakeCurrentTransformIntoVertices es necesario: sin esto, .scaling no
      // afecta el archivo exportado.
      merged.computeWorldMatrix(true)
      const bounds = merged.getBoundingInfo().boundingBox
      const heightWorld = bounds.maximum.y - bounds.minimum.y
      const scaleFactor = heightWorld > 1e-6 ? TARGET_HEIGHT_MM / heightWorld : 1
      merged.scaling.setAll(scaleFactor)
      merged.bakeCurrentTransformIntoVertices()
      exportMeshToSTL(merged, 'neoproxy-primer-cuerpo.stl')
    } finally {
      merged?.dispose(false, true)
      exportParts.forEach(p => { if (!p.isDisposed()) p.dispose(false, true) })
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
            EXPORTAR .STL ({TARGET_HEIGHT_MM}mm)
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
