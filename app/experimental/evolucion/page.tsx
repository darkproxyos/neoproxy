'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { entries } from '@/components/knowledge/entries'
import { runSpaceColonization, computeRadii, type SkeletonNode } from '@/app/lab/proxygenesis/engine/spaceColonization'
import {
  type Genome, GENE_RANGES, GENE_LABELS, mulberry32, randomGenome, mutateGenome,
  genomeToParams, measureSpecimen, fitnessOf, evolveGeneration, projectToGrid, silhouetteFitness,
} from './engine/genome'
import { PATTERN_DEFS, patternFromRows, GRID_SIZE as SIL_GRID_SIZE } from '@/app/experimental/memoria/engine/hopfield'

// NPX-XP-EVOLUCIÓN — sexto modo del laboratorio, el más complejo de los
// seis: reusa el motor de Space Colonization (Proxygenesis/Workbench) como
// "fenotipo", pero acá el objeto no es una forma ni un comportamiento — es
// una POBLACIÓN cambiando a través de generaciones. Dos paradigmas reales,
// deliberadamente puestos uno al lado del otro:
//
//   SELECCIÓN — Dawkins, Biomorfos (1986): no hay fitness, el criterio sos
//   vos. 9 variantes en una repisa, elegís una, se mutan 8 hijos de esa.
//
//   GENÉTICO — Holland (1975): una población compite por una función de
//   fitness real y medible (altura y cantidad de ramas objetivo), con
//   selección por torneo, cruza y mutación — nadie mira nada hasta que
//   termina la corrida completa.

const mono = "'Space Mono', monospace"
const RED = '#cc0000'
const CYAN = '#00d4ff'

type Mode = 'seleccion' | 'genetico' | 'sintesis'
const GENE_KEYS = Object.keys(GENE_RANGES) as (keyof Genome)[]

function GeneBars({ genome, accent }: { genome: Genome; accent: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {GENE_KEYS.map((k) => {
        const [lo, hi] = GENE_RANGES[k]
        const t = (genome[k] - lo) / (hi - lo)
        return (
          <div key={k} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#4a6080', marginBottom: 2 }}>
              <span>{GENE_LABELS[k]}</span>
            </div>
            <div style={{ height: 4, background: '#111a28' }}>
              <div style={{ height: '100%', width: `${t * 100}%`, background: accent }} />
            </div>
          </div>
        )
      })}
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

const GRID_SPACING = 3.6

export default function EvolucionPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const BRef = useRef<any>(null)
  const sceneRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const specimenMeshesRef = useRef<any[]>([])
  const hitboxMeshesRef = useRef<any[]>([])
  const disposedRef = useRef(false)
  const timersRef = useRef<number[]>([])

  const [mode, setMode] = useState<Mode>('seleccion')
  const modeRef = useRef<Mode>('seleccion')
  useEffect(() => { modeRef.current = mode }, [mode])

  // --- selección artificial (Dawkins) ---
  const [selGeneration, setSelGeneration] = useState(0)
  const [selParent, setSelParent] = useState<Genome | null>(null)
  const [selBuilding, setSelBuilding] = useState(false)
  const selGenomesRef = useRef<Genome[]>([])

  // --- algoritmo genético (Holland) ---
  const [targetHeight, setTargetHeight] = useState(3.2)
  const [targetNodes, setTargetNodes] = useState(550)
  const [popSize, setPopSize] = useState(16)
  const [genCount, setGenCount] = useState(20)
  const [evolving, setEvolving] = useState(false)
  const [currentGen, setCurrentGen] = useState(0)
  const [fitnessHistory, setFitnessHistory] = useState<number[]>([])
  const [bestGenome, setBestGenome] = useState<Genome | null>(null)
  const [bestMeasured, setBestMeasured] = useState<{ height: number; nodeCount: number } | null>(null)

  // --- síntesis (Alsing): evolucionar hacia la silueta de un patrón de Memoria ---
  const [targetPatternId, setTargetPatternId] = useState(PATTERN_DEFS[0].id)
  const [silEvolving, setSilEvolving] = useState(false)
  const [silCurrentGen, setSilCurrentGen] = useState(0)
  const [silFitnessHistory, setSilFitnessHistory] = useState<number[]>([])
  const [silBestGenome, setSilBestGenome] = useState<Genome | null>(null)
  const [silBestGrid, setSilBestGrid] = useState<number[] | null>(null)
  const SIL_HALF_EXTENT = 2.5

  const clearTimers = () => { timersRef.current.forEach((t) => window.clearTimeout(t)); timersRef.current = [] }

  const buildSpecimenMesh = (B: any, scene: any, nodes: SkeletonNode[], colorHex: string, name: string) => {
    const radii = computeRadii(nodes, { leafRadius: 0.03, exponent: 2.3, maxRadius: 0.35 })
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
      const cyl = B.MeshBuilder.CreateCylinder(`${name}_${i}`, {
        diameterTop: Math.max(0.02, radii[i] * 2), diameterBottom: Math.max(0.02, radii[child.parent] * 2),
        height: h, tessellation: 6,
      }, scene)
      cyl.position = B.Vector3.Lerp(from3, to3, 0.5)
      const dot = B.Vector3.Dot(up, dirN)
      if (dot < -0.9999) cyl.rotationQuaternion = B.Quaternion.RotationAxis(new B.Vector3(1, 0, 0), Math.PI)
      else if (dot < 0.9999) cyl.rotationQuaternion = B.Quaternion.RotationAxis(B.Vector3.Cross(up, dirN).normalize(), Math.acos(dot))
      parts.push(cyl)
    }
    if (parts.length === 0) return null
    const merged = B.Mesh.MergeMeshes(parts, true, true, undefined, false, true)
    if (merged) {
      const mat = new B.StandardMaterial(`${name}_mat`, scene)
      mat.diffuseColor = B.Color3.FromHexString(colorHex)
      mat.specularColor = new B.Color3(0.12, 0.12, 0.12)
      merged.material = mat
    }
    return merged
  }

  const disposeSpecimens = () => {
    specimenMeshesRef.current.forEach((m) => m?.dispose())
    specimenMeshesRef.current = []
    hitboxMeshesRef.current.forEach((m) => m?.dispose())
    hitboxMeshesRef.current = []
  }

  // --- SELECCIÓN: 9 especímenes (índice 4 = padre sin mutar, centro) ---
  const buildShelf = (parent: Genome) => {
    const B = BRef.current; const scene = sceneRef.current
    if (!B || !scene) return
    setSelBuilding(true)
    disposeSpecimens()

    const rand = mulberry32(Math.floor(Math.random() * 1e6))
    const genomes: Genome[] = []
    for (let i = 0; i < 9; i++) genomes[i] = i === 4 ? parent : mutateGenome(parent, rand, 0.14)
    selGenomesRef.current = genomes

    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3), col = i % 3
      const seed = Math.floor(Math.random() * 1e6)
      const gen = runSpaceColonization(genomeToParams(genomes[i], seed, 'eval'))
      let result = gen.next()
      while (!result.done) result = gen.next()
      const mesh = buildSpecimenMesh(B, scene, result.value.nodes, i === 4 ? CYAN : RED, `sel${i}`)
      const posX = (col - 1) * GRID_SPACING
      const posZ = (1 - row) * GRID_SPACING
      if (mesh) {
        mesh.position.x = posX
        mesh.position.z = posZ
        mesh.scaling.setAll(0.55)
        mesh.metadata = { specimenIndex: i }
        mesh.isPickable = false // la caja invisible de abajo es el blanco real del click
        specimenMeshesRef.current[i] = mesh
      }
      // Las ramas son finas — clickear el mesh real a mano falla seguido.
      // Esta caja invisible, del tamaño de toda la celda de la grilla,
      // es el blanco real del click (visibility 0 no afecta isPickable
      // en Babylon, sigue siendo un objetivo válido para el picking).
      const hitbox = B.MeshBuilder.CreateBox(`hit${i}`, { width: GRID_SPACING * 0.9, height: 3.2, depth: GRID_SPACING * 0.9 }, scene)
      hitbox.position.set(posX, 0.6, posZ)
      hitbox.visibility = 0
      hitbox.metadata = { specimenIndex: i }
      hitboxMeshesRef.current[i] = hitbox
    }
    setSelBuilding(false)
  }

  const selectSpecimen = (i: number) => {
    if (selBuilding || mode !== 'seleccion') return
    const picked = selGenomesRef.current[i]
    if (!picked) return
    setSelParent(picked)
    setSelGeneration((g) => g + 1)
    buildShelf(picked)
  }

  const restartLineage = () => {
    if (selBuilding) return
    const rand = mulberry32(Date.now() % 1e6)
    const fresh = randomGenome(rand)
    setSelParent(fresh)
    setSelGeneration(0)
    buildShelf(fresh)
  }

  // --- GENÉTICO: corrida animada, generación por generación ---
  const evolve = () => {
    if (evolving) return
    clearTimers()
    setEvolving(true)
    setCurrentGen(0)
    setFitnessHistory([])
    disposeSpecimens()

    const rand = mulberry32(Date.now() % 1e6)
    let population = Array.from({ length: popSize }, () => randomGenome(rand))

    const runGeneration = (gen: number) => {
      const fitnesses: number[] = []
      const measurements: { height: number; nodeCount: number }[] = []
      for (const genome of population) {
        const seed = Math.floor(rand() * 1e6)
        const sim = runSpaceColonization(genomeToParams(genome, seed, 'eval'))
        let r = sim.next()
        while (!r.done) r = sim.next()
        const m = measureSpecimen(r.value.nodes)
        measurements.push(m)
        fitnesses.push(fitnessOf(m, targetHeight, targetNodes))
      }
      const bestIdx = fitnesses.indexOf(Math.max(...fitnesses))
      const best = population[bestIdx]

      setCurrentGen(gen + 1)
      setFitnessHistory((h) => [...h, fitnesses[bestIdx]])
      setBestGenome(best)
      setBestMeasured(measurements[bestIdx])

      // Render del mejor de esta generación a mejor calidad — solo 1
      // malla por generación, no toda la población, así es viable mostrar
      // la evolución en vivo sin construir cientos de mallas de más.
      const B = BRef.current; const scene = sceneRef.current
      if (B && scene) {
        disposeSpecimens()
        const dispSim = runSpaceColonization(genomeToParams(best, Math.floor(rand() * 1e6), 'display'))
        let r = dispSim.next()
        while (!r.done) r = dispSim.next()
        const mesh = buildSpecimenMesh(B, scene, r.value.nodes, CYAN, 'best')
        if (mesh) specimenMeshesRef.current[0] = mesh
      }

      population = evolveGeneration(population, fitnesses, rand, 1)

      if (gen + 1 < genCount && !disposedRef.current) {
        const t = window.setTimeout(() => runGeneration(gen + 1), 260)
        timersRef.current.push(t)
      } else {
        setEvolving(false)
      }
    }
    runGeneration(0)
  }

  // Mismo bucle generacional que evolve(), pero la fitness no mide altura
  // ni cantidad de nodos — mide qué tan parecida es la silueta del
  // espécimen (proyectada desde arriba) a un patrón real de Memoria.
  const evolveSynthesis = () => {
    if (silEvolving) return
    clearTimers()
    setSilEvolving(true)
    setSilCurrentGen(0)
    setSilFitnessHistory([])
    disposeSpecimens()

    const targetDef = PATTERN_DEFS.find((d) => d.id === targetPatternId) ?? PATTERN_DEFS[0]
    const target = patternFromRows(targetDef.rows)
    const rand = mulberry32(Date.now() % 1e6)
    let population = Array.from({ length: popSize }, () => randomGenome(rand))

    const runGeneration = (gen: number) => {
      const fitnesses: number[] = []
      for (const genome of population) {
        const seed = Math.floor(rand() * 1e6)
        const sim = runSpaceColonization(genomeToParams(genome, seed, 'eval'))
        let r = sim.next()
        while (!r.done) r = sim.next()
        const grid = projectToGrid(r.value.nodes, SIL_GRID_SIZE, SIL_HALF_EXTENT)
        fitnesses.push(silhouetteFitness(grid, target))
      }
      const bestIdx = fitnesses.indexOf(Math.max(...fitnesses))
      const best = population[bestIdx]

      setSilCurrentGen(gen + 1)
      setSilFitnessHistory((h) => [...h, fitnesses[bestIdx]])
      setSilBestGenome(best)

      const B = BRef.current; const scene = sceneRef.current
      if (B && scene) {
        disposeSpecimens()
        const dispSeed = Math.floor(rand() * 1e6)
        const dispSim = runSpaceColonization(genomeToParams(best, dispSeed, 'display'))
        let r = dispSim.next()
        while (!r.done) r = dispSim.next()
        const mesh = buildSpecimenMesh(B, scene, r.value.nodes, CYAN, 'sil')
        if (mesh) specimenMeshesRef.current[0] = mesh
        // La grilla que se muestra en el panel usa la MISMA corrida que se
        // ve en 3D (calidad display), no la de evaluación — así lo que el
        // usuario ve comparado contra el objetivo es exactamente lo que
        // tiene adelante, no una aproximación de otra corrida.
        setSilBestGrid(projectToGrid(r.value.nodes, SIL_GRID_SIZE, SIL_HALF_EXTENT))
      }

      population = evolveGeneration(population, fitnesses, rand, 1)

      if (gen + 1 < genCount && !disposedRef.current) {
        const t = window.setTimeout(() => runGeneration(gen + 1), 260)
        timersRef.current.push(t)
      } else {
        setSilEvolving(false)
      }
    }
    runGeneration(0)
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

      const camera = new B.ArcRotateCamera('ev-cam', -Math.PI / 2.3, 1.0, 16, new B.Vector3(0, 0.3, 0), scene)
      camera.attachControl(canvasRef.current, true)
      camera.wheelPrecision = 30
      camera.lowerRadiusLimit = 3
      camera.upperRadiusLimit = 30
      camera.minZ = 0.05
      cameraRef.current = camera

      const fill = new B.HemisphericLight('ev-fill', new B.Vector3(0, 1, 0.2), scene)
      fill.intensity = 0.6
      fill.groundColor = new B.Color3(0.05, 0.05, 0.1)
      const key = new B.PointLight('ev-key', new B.Vector3(4, 6, -3), scene)
      key.intensity = 0.85

      scene.onPointerObservable.add((pointerInfo: any) => {
        if (pointerInfo.type !== B.PointerEventTypes.POINTERPICK) return
        if (modeRef.current !== 'seleccion') return
        const mesh = pointerInfo.pickInfo?.pickedMesh
        const idx = mesh?.metadata?.specimenIndex
        if (typeof idx === 'number') selectSpecimen(idx)
      })

      const rand0 = mulberry32(Date.now() % 1e6)
      const firstParent = randomGenome(rand0)
      setSelParent(firstParent)
      buildShelf(firstParent)

      engine.runRenderLoop(() => scene.render())
      window.addEventListener('resize', () => engine.resize())
    }

    init()
    return () => {
      disposedRef.current = true
      clearTimers()
      if (engine) engine.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const switchMode = (m: Mode) => {
    if (m === mode) return
    clearTimers()
    setEvolving(false)
    setSilEvolving(false)
    setMode(m)
    disposeSpecimens()
    const cam = cameraRef.current
    if (m === 'seleccion') {
      if (cam) { cam.radius = 16; cam.beta = 1.0 }
      if (selParent) buildShelf(selParent)
    } else if (m === 'genetico') {
      if (cam) { cam.radius = 8; cam.beta = 1.15 }
      setFitnessHistory([]); setBestGenome(null); setBestMeasured(null); setCurrentGen(0)
    } else {
      if (cam) { cam.radius = 8; cam.beta = 1.15 }
      setSilFitnessHistory([]); setSilBestGenome(null); setSilBestGrid(null); setSilCurrentGen(0)
    }
  }

  const maxFitness = Math.max(0.01, ...fitnessHistory.map((f) => f + 2))
  const targetGrid = patternFromRows((PATTERN_DEFS.find((d) => d.id === targetPatternId) ?? PATTERN_DEFS[0]).rows)
  const silMaxFitness = Math.max(0.05, ...silFitnessHistory)

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
        <div style={{ fontSize: 11, letterSpacing: 3, color: RED, fontWeight: 700 }}>NPX-XP-EVOLUCIÓN</div>
        <div style={{ fontSize: 9, letterSpacing: 1, color: '#4a6080' }}>una población, no una forma</div>
      </div>

      <div style={{
        position: 'absolute', top: 44, left: 0, bottom: 0, width: 310, overflowY: 'auto',
        background: 'rgba(5,10,20,0.92)', borderRight: `1px solid ${RED}22`, padding: 16, zIndex: 90,
      }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['seleccion', 'genetico', 'sintesis'] as Mode[]).map((m) => (
            <button key={m} onClick={() => switchMode(m)} style={{
              flex: 1, fontFamily: mono, fontSize: 8, padding: '8px 4px', letterSpacing: 0.3, cursor: 'pointer',
              background: mode === m ? `${RED}22` : 'transparent',
              border: `1px solid ${mode === m ? RED : '#2a3a50'}`,
              color: mode === m ? RED : '#4a6080',
            }}>
              {m === 'seleccion' ? 'SELECCIÓN' : m === 'genetico' ? 'GENÉTICO' : 'SÍNTESIS'}
            </button>
          ))}
        </div>

        {mode === 'seleccion' ? (
          <>
            <p style={{ fontSize: 10, color: '#8fb8d6', lineHeight: 1.8, marginBottom: 14 }}>
              El del centro (cian) es el padre actual, sin mutar. Los otros 8 son mutaciones suyas.
              Hacé clic en el que más te interese — no el más alto, el que te llame la atención — y
              se convierte en el padre de la próxima generación.
            </p>
            <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 1, marginBottom: 14 }}>
              GENERACIÓN: <span style={{ color: RED }}>{selGeneration}</span>
              {selBuilding ? ' · creciendo...' : ''}
            </div>
            <button onClick={restartLineage} disabled={selBuilding} style={{
              width: '100%', fontFamily: mono, fontSize: 10, fontWeight: 700, padding: 10, marginBottom: 16,
              cursor: selBuilding ? 'default' : 'pointer', background: 'transparent', border: `1px solid ${RED}`, color: RED,
              opacity: selBuilding ? 0.5 : 1, letterSpacing: 1,
            }}>
              ↺ REINICIAR LINAJE
            </button>
            {selParent && (
              <>
                <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 1, marginBottom: 8 }}>GENOMA DEL PADRE ACTUAL</div>
                <GeneBars genome={selParent} accent={CYAN} />
              </>
            )}
            <AuthorCard entryId="dawkins" accent={RED} />
          </>
        ) : mode === 'genetico' ? (
          <>
            <p style={{ fontSize: 10, color: '#8fb8d6', lineHeight: 1.8, marginBottom: 14 }}>
              Acá no elegís nada — una población compite por una función de fitness real: qué tan
              cerca está cada espécimen de la altura y cantidad de ramas que fijes abajo.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#4a6080', marginBottom: 4 }}>
              <span>ALTURA OBJETIVO</span><span style={{ color: RED }}>{targetHeight.toFixed(1)}</span>
            </div>
            <input type="range" min={1.5} max={5} step={0.1} value={targetHeight} disabled={evolving}
              onChange={(e) => setTargetHeight(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: RED, marginBottom: 10 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#4a6080', marginBottom: 4 }}>
              <span>RAMAS OBJETIVO (nodos)</span><span style={{ color: RED }}>{targetNodes}</span>
            </div>
            <input type="range" min={150} max={1200} step={10} value={targetNodes} disabled={evolving}
              onChange={(e) => setTargetNodes(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: RED, marginBottom: 10 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#4a6080', marginBottom: 4 }}>
              <span>POBLACIÓN</span><span style={{ color: RED }}>{popSize}</span>
            </div>
            <input type="range" min={6} max={24} step={1} value={popSize} disabled={evolving}
              onChange={(e) => setPopSize(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: RED, marginBottom: 10 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#4a6080', marginBottom: 4 }}>
              <span>GENERACIONES</span><span style={{ color: RED }}>{genCount}</span>
            </div>
            <input type="range" min={5} max={40} step={1} value={genCount} disabled={evolving}
              onChange={(e) => setGenCount(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: RED, marginBottom: 14 }} />

            <button onClick={evolve} disabled={evolving} style={{
              width: '100%', fontFamily: mono, fontSize: 10, fontWeight: 700, padding: 11, marginBottom: 14,
              cursor: evolving ? 'default' : 'pointer', background: RED, color: '#020408', border: 'none',
              opacity: evolving ? 0.6 : 1, letterSpacing: 1,
            }}>
              {evolving ? `EVOLUCIONANDO... GEN ${currentGen}/${genCount}` : '▶ EVOLUCIONAR'}
            </button>

            {fitnessHistory.length > 0 && (
              <>
                <div style={{ fontSize: 8, color: '#4a6080', letterSpacing: 1, marginBottom: 4 }}>
                  FITNESS DEL MEJOR POR GENERACIÓN (más alto = más cerca del objetivo)
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 44, marginBottom: 14, border: `1px solid ${RED}22`, padding: '3px 3px 0' }}>
                  {fitnessHistory.map((f, i) => (
                    <div key={i} style={{ flex: 1, background: RED, opacity: 0.4 + 0.6 * (i / Math.max(1, fitnessHistory.length - 1)), height: `${Math.max(4, ((f + 2) / maxFitness) * 100)}%` }} />
                  ))}
                </div>
              </>
            )}

            {bestMeasured && (
              <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 1, marginBottom: 14, lineHeight: 1.8 }}>
                MEJOR ESPÉCIMEN: altura <span style={{ color: RED }}>{bestMeasured.height.toFixed(2)}</span> (obj. {targetHeight.toFixed(1)})
                {' · '}nodos <span style={{ color: RED }}>{bestMeasured.nodeCount}</span> (obj. {targetNodes})
              </div>
            )}
            {bestGenome && (
              <>
                <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 1, marginBottom: 8 }}>GENOMA DEL MEJOR ENCONTRADO</div>
                <GeneBars genome={bestGenome} accent={RED} />
              </>
            )}
            <AuthorCard entryId="holland" accent={RED} />
          </>
        ) : (
          <>
            <p style={{ fontSize: 10, color: '#8fb8d6', lineHeight: 1.8, marginBottom: 14 }}>
              Cruza con Memoria: el fitness no mide altura ni ramas — mide qué tan parecida es la
              silueta del espécimen, vista desde arriba, a un patrón real guardado en /experimental/memoria.
              Mismo principio que evolucionar polígonos hasta que se parezcan a la Mona Lisa.
            </p>

            <div style={{ fontSize: 9, color: RED, letterSpacing: 2, marginBottom: 8 }}>PATRÓN OBJETIVO</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {PATTERN_DEFS.map((d) => (
                <button key={d.id} onClick={() => setTargetPatternId(d.id)} disabled={silEvolving} style={{
                  flex: 1, fontFamily: mono, fontSize: 8, padding: '6px 2px', cursor: silEvolving ? 'default' : 'pointer', letterSpacing: 0.3,
                  background: targetPatternId === d.id ? `${RED}22` : 'transparent',
                  border: `1px solid ${targetPatternId === d.id ? RED : '#2a3a50'}`,
                  color: targetPatternId === d.id ? RED : '#4a6080', opacity: silEvolving ? 0.6 : 1,
                }}>
                  {d.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 8, color: '#4a6080', letterSpacing: 1, marginBottom: 4 }}>OBJETIVO</div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SIL_GRID_SIZE}, 1fr)`, gap: 1, width: 120, height: 120 }}>
                  {targetGrid.map((v, i) => (
                    <div key={i} style={{ background: v === 1 ? RED : '#0a1018' }} />
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 8, color: '#4a6080', letterSpacing: 1, marginBottom: 4 }}>PROYECCIÓN ACTUAL</div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SIL_GRID_SIZE}, 1fr)`, gap: 1, width: 120, height: 120 }}>
                  {(silBestGrid ?? new Array(SIL_GRID_SIZE * SIL_GRID_SIZE).fill(-1)).map((v, i) => (
                    <div key={i} style={{ background: v === 1 ? CYAN : '#0a1018' }} />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#4a6080', marginBottom: 4 }}>
              <span>POBLACIÓN</span><span style={{ color: RED }}>{popSize}</span>
            </div>
            <input type="range" min={6} max={24} step={1} value={popSize} disabled={silEvolving}
              onChange={(e) => setPopSize(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: RED, marginBottom: 10 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#4a6080', marginBottom: 4 }}>
              <span>GENERACIONES</span><span style={{ color: RED }}>{genCount}</span>
            </div>
            <input type="range" min={5} max={40} step={1} value={genCount} disabled={silEvolving}
              onChange={(e) => setGenCount(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: RED, marginBottom: 14 }} />

            <button onClick={evolveSynthesis} disabled={silEvolving} style={{
              width: '100%', fontFamily: mono, fontSize: 10, fontWeight: 700, padding: 11, marginBottom: 14,
              cursor: silEvolving ? 'default' : 'pointer', background: RED, color: '#020408', border: 'none',
              opacity: silEvolving ? 0.6 : 1, letterSpacing: 1,
            }}>
              {silEvolving ? `EVOLUCIONANDO... GEN ${silCurrentGen}/${genCount}` : '▶ EVOLUCIONAR HACIA LA SILUETA'}
            </button>

            {silFitnessHistory.length > 0 && (
              <>
                <div style={{ fontSize: 8, color: '#4a6080', letterSpacing: 1, marginBottom: 4 }}>
                  COINCIDENCIA (ÍNDICE DE JACCARD) DEL MEJOR POR GENERACIÓN
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 44, marginBottom: 10, border: `1px solid ${RED}22`, padding: '3px 3px 0' }}>
                  {silFitnessHistory.map((f, i) => (
                    <div key={i} style={{ flex: 1, background: RED, opacity: 0.4 + 0.6 * (i / Math.max(1, silFitnessHistory.length - 1)), height: `${Math.max(4, (f / silMaxFitness) * 100)}%` }} />
                  ))}
                </div>
                <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 1, marginBottom: 14 }}>
                  MEJOR COINCIDENCIA: <span style={{ color: RED }}>{Math.round(silFitnessHistory[silFitnessHistory.length - 1] * 100)}%</span>
                </div>
              </>
            )}

            {silBestGenome && (
              <>
                <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 1, marginBottom: 8 }}>GENOMA DEL MEJOR ENCONTRADO</div>
                <GeneBars genome={silBestGenome} accent={RED} />
              </>
            )}
            <AuthorCard entryId="alsing" accent={RED} />
          </>
        )}
      </div>

      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', position: 'absolute', top: 0, left: 0 }} />
    </div>
  )
}
