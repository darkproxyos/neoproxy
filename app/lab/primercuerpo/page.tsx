'use client'

// PRIMER CUERPO — generador real del Espécimen 001 (ver blueprint). No es el
// render de Leonardo.ai: esto construye la malla de verdad, en el navegador,
// con el mismo motor de space colonization que ya usa /lab/proxygenesis
// (engine/spaceColonization.ts), combinado con una retícula de Cubo de
// Metatrón geométricamente exacta (12 vértices + 30 aristas reales de un
// icosaedro regular, no una forma libre). Exporta a .STL para imprimir.
//
// El coral crece desde 5 raíces simultáneas, una por vértice de la jaula,
// cada una asignada a uno de los 5 agentes donantes de Grietas (en vez de
// un solo tronco recto desde abajo): evita el tronco grueso único y hace que
// la jaula se vea atravesada por 5 brotes reales, no tapada por un bloque.
// La semilla, el curl y la raíz de cada brote NO son random: se derivan de
// datos reales de esos 5 agentes (color hex + percentHuman de agents.ts) —
// documentado en el blueprint "NeoProxy — Espécimen 001: Primer Cuerpo".
// Mismo orden que GRIETA_DONOR_IDS en identity.ts.
//
// Aristas del icosaedro hardcodeadas (verificadas a mano, 30 aristas, grado
// 5 por vértice) por robustez a futuro ruido orgánico en los vértices.
// Stepping del generador presupuestado por tiempo real, no por pasos fijos.
// Fallback de 25% de D/Trickster reemplazado por valores derivados de datos
// reales, solo en esta capa (nunca se tocan las bios shipeadas en
// agents.ts). El export reconstruye la malla desde datos crudos en vez de
// clonar los mesh en vivo -- ver comentario en handleExport.
//
// Brillo selectivo: la jaula no tiene emissive (queda nítida, sin glow) --
// solo el coral emite, así no se funden en un blob de luz verde.

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
  // Base más alta que antes: con el promedio real de los 5 donantes (~5%,
  // tras el fix de D/Trickster) la fórmula vieja daba un curl casi recto.
  const curl = 0.22 + Math.min(0.18, (avgPercent / 100) * 0.3)
  return { seed, curl }
}

// Reparte las 5 raíces del coral entre los 12 vértices de la jaula, una por
// donante, derivado de su color real (no al azar). Colisión -> siguiente
// vértice libre, determinístico.
function assignDonorVertices(donors: DonorData[]): number[] {
  const used = new Set<number>()
  return donors.map(d => {
    let idx = d.colorNum % 12
    while (used.has(idx)) idx = (idx + 1) % 12
    used.add(idx)
    return idx
  })
}
function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
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
const ICOSAHEDRON_RADIUS = 1.9

function buildLatticeParts(scene: BABYLON.Scene): BABYLON.Mesh[] {
  const verts = icosahedronVertices(ICOSAHEDRON_RADIUS)
  const parts: BABYLON.Mesh[] = []
  for (const [i, j] of ICOSAHEDRON_EDGES) {
    const a = new BABYLON.Vector3(...verts[i])
    const b = new BABYLON.Vector3(...verts[j])
    const h = BABYLON.Vector3.Distance(a, b)
    if (h < 1e-5) continue
    const cyl = BABYLON.MeshBuilder.CreateCylinder(`edge${i}_${j}`, { diameter: 0.05, height: h, tessellation: 8 }, scene)
    alignCylinder(cyl, a, b)
    parts.push(cyl)
  }
  for (const v of verts) {
    const sph = BABYLON.MeshBuilder.CreateSphere('node', { diameter: 0.09, segments: 8 }, scene)
    sph.position = new BABYLON.Vector3(...v)
    parts.push(sph)
  }
  return parts
}

// exponent alto + maxRadius bajo = ramas que se afinan de verdad hacia las
// puntas en vez de un tronco uniforme grueso (pipe model de da Vinci).
function buildCoralParts(scene: BABYLON.Scene, nodes: SkeletonNode[]): BABYLON.Mesh[] {
  const radii = computeRadii(nodes, { leafRadius: 0.03, exponent: 2.6, maxRadius: 0.28 })
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
      height: h, tessellation: 8,
    }, scene)
    alignCylinder(cyl, a, b)
    parts.push(cyl)
  }
  return parts
}

export default function PrimerCuerpoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<BABYLON.Scene | null>(null)
  const lastCoralNodesRef = useRef<SkeletonNode[][]>([])
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

    const camera = new BABYLON.ArcRotateCamera('cam', Math.PI / 3, Math.PI / 2.4, 8.2, new BABYLON.Vector3(0, 1.2, 0), scene)
    camera.attachControl(canvasRef.current, true)
    camera.wheelPrecision = 50
    camera.lowerRadiusLimit = 3
    camera.upperRadiusLimit = 22

    const hemi = new BABYLON.HemisphericLight('h', new BABYLON.Vector3(0, 1, 0), scene)
    hemi.intensity = 0.55
    const dirLight = new BABYLON.DirectionalLight('dl', new BABYLON.Vector3(-0.5, -1, -0.3), scene)
    dirLight.intensity = 0.7

    const gl = new BABYLON.GlowLayer('glow', scene)
    gl.intensity = 0.35

    const lattice = BABYLON.Mesh.MergeMeshes(buildLatticeParts(scene), true, true, undefined, false, true)
    if (lattice) {
      lattice.name = 'Lattice_Metatron'
      const mat = new BABYLON.StandardMaterial('latticeMat', scene)
      mat.diffuseColor = BABYLON.Color3.FromHexString(GREEN).scale(0.5)
      // Sin emissive: así el GlowLayer no la toma y la jaula queda nítida,
      // el glow es solo para el coral (brillo selectivo).
      mat.emissiveColor = BABYLON.Color3.Black()
      mat.specularColor = BABYLON.Color3.FromHexString(GREEN)
      mat.alpha = 0.82
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

    // 5 raíces, una por donante, ancladas en su vértice de la jaula -- no
    // un solo tronco recto desde abajo (eso era lo que se veía como un
    // bloque). Cada canopy apunta del vértice hacia el centro, así los 5
    // brotes se cruzan en el medio en vez de quedar aislados en la cáscara.
    const CENTER: Vec3 = [0, 1.1, 0]
    const vertices = icosahedronVertices(ICOSAHEDRON_RADIUS)
    const vertexIdx = assignDonorVertices(donors)
    const growths = donors.map((d, i) => {
      const rootPos = vertices[vertexIdx[i]]
      const canopyCenter = lerpVec3(rootPos, CENTER, 0.55)
      const rootSeed = ((seed + vertexIdx[i] * 104729) % 2147483647) || 1
      const rootCurl = curl + (d.percent / 100) * 0.08
      const gen = runSpaceColonization({
        seed: rootSeed,
        numAttractors: 240,
        canopyCenter,
        canopyRadius: [1.0, 1.4, 1.0] as Vec3,
        rootPos,
        influenceRadius: 0.75,
        killDistance: 0.15,
        stepSize: 0.1,
        maxIterations: 300,
        curl: rootCurl,
      })
      return { gen, nodes: [] as SkeletonNode[], iteration: 0, maxIterations: 300, done: false }
    })

    const buildCoral = (perRootNodes: SkeletonNode[][]) => {
      const old = scene.getMeshByName('Coral_Primer_Cuerpo')
      if (old) old.dispose()
      const parts = perRootNodes.flatMap(nodes => buildCoralParts(scene, nodes))
      const merged = parts.length ? BABYLON.Mesh.MergeMeshes(parts, true, true, undefined, false, true) : null
      if (merged) {
        merged.name = 'Coral_Primer_Cuerpo'
        const mat = new BABYLON.StandardMaterial('coralMat', scene)
        mat.diffuseColor = BABYLON.Color3.FromHexString(GREEN).scale(0.3)
        mat.emissiveColor = BABYLON.Color3.FromHexString(GREEN).scale(0.5)
        mat.specularColor = BABYLON.Color3.FromHexString(GREEN)
        mat.alpha = 0.6
        merged.material = mat
      }
      lastCoralNodesRef.current = perRootNodes
    }

    const FRAME_BUDGET_MS = 8
    const REBUILD_EVERY_N_FRAMES = 15
    let frame = 0
    const step = () => {
      if (cancelled) return
      const t0 = performance.now()
      while (performance.now() - t0 < FRAME_BUDGET_MS) {
        let anyActive = false
        for (const g of growths) {
          if (g.done) continue
          anyActive = true
          const result = g.gen.next()
          g.nodes = result.value.nodes
          g.iteration = result.value.iteration
          g.maxIterations = result.value.maxIterations
          g.done = result.done === true
          if (performance.now() - t0 >= FRAME_BUDGET_MS) break
        }
        if (!anyActive) break
      }
      const totalIter = growths.reduce((a, g) => a + g.iteration, 0)
      const totalMax = growths.reduce((a, g) => a + g.maxIterations, 0)
      setGrowPct(Math.min(99, Math.round((totalIter / totalMax) * 100)))
      const allDone = growths.every(g => g.done)
      if (frame % REBUILD_EVERY_N_FRAMES === 0 || allDone) buildCoral(growths.map(g => g.nodes))
      frame++
      if (!allDone) requestAnimationFrame(step)
      else { setGrowPct(100); setDone(true) }
    }
    requestAnimationFrame(step)

    return () => { cancelled = true }
  }, [isClient, seed, curl, donors])

  // No clonar el mesh vivo: Babylon.Mesh.clone() comparte la geometría con
  // el original, y disponer el clon corrompe la malla en pantalla. Por eso
  // esto reconstruye desde cero (vértices del icosaedro + últimos nodos del
  // esqueleto) en vez de clonar lo que ya está en escena.
  const handleExport = useCallback(() => {
    const scene = sceneRef.current
    const perRootNodes = lastCoralNodesRef.current
    if (!scene || perRootNodes.length === 0) return

    const exportParts = [...buildLatticeParts(scene), ...perRootNodes.flatMap(nodes => buildCoralParts(scene, nodes))]
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
