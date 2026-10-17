"use client";

import { useEffect, useRef, useState, useCallback } from 'react'
import * as BABYLON from 'babylonjs'
import Link from 'next/link'
import { runSpaceColonization, computeRadii, type SkeletonNode, type Vec3 as SkVec3 } from './engine/spaceColonization'
import { generateShell, normalizeToViewSize } from './engine/shell'
import { exportMeshToSTL } from './engine/stl'
import { saveSpecimenToGallery, consumePendingLoad } from './engine/gallery'
import { decodeAudioBlob, computeEnergyEnvelope, recordMicClip } from './engine/audioAnalysis'

type Mode = 'coral' | 'arbol' | 'concha'
type Quality = 'baja' | 'media' | 'alta' | 'extrema'

const QUALITY_LABEL: Record<Quality, string> = {
  baja: 'RÁPIDA (~0.5s)', media: 'MEDIA (~1-3s)', alta: 'ALTA (~8-10s)', extrema: 'EXTREMA (~20s+)',
}
// Puntos de atracción e iteraciones por nivel de calidad — rangos medidos
// antes de exponerlos (script aparte): "extrema" puede tardar 20s+ en
// generar, por eso corre en chunks (ver runGeneration) y nunca bloquea el
// hilo principal del navegador, solo tarda más en terminar.
const QUALITY_ATTRACTORS: Record<Quality, number> = { baja: 250, media: 500, alta: 1000, extrema: 1700 }
const QUALITY_ITERATIONS: Record<Quality, number> = { baja: 200, media: 350, alta: 450, extrema: 550 }

type BranchParams = {
  seed: number
  quality: Quality
  canopyWidth: number
  canopyHeight: number
  curl: number
  thickness: number
  flat: number // 0 = copa esférica, 1 = copa achatada (coral tipo mesa)
}

type ShellParamsUI = { W: number; D: number; T: number; whorls: number; thickness: number }

const TREE_DEFAULT: BranchParams = { seed: 1, quality: 'media', canopyWidth: 4, canopyHeight: 6, curl: 0.06, thickness: 2.4, flat: 0 }
const CORAL_DEFAULT: BranchParams = { seed: 1, quality: 'media', canopyWidth: 5, canopyHeight: 2.5, curl: 0.22, thickness: 1.8, flat: 0.5 }
const SHELL_DEFAULT: ShellParamsUI = { W: 2.2, D: 0.9, T: 0.5, whorls: 5, thickness: 0.11 }

const TREE_PRESETS: Record<string, Partial<BranchParams>> = {
  'Pino': { canopyWidth: 2.2, canopyHeight: 7, curl: 0.03, thickness: 2.8, flat: 0 },
  'Roble': { canopyWidth: 5.5, canopyHeight: 4.5, curl: 0.1, thickness: 2.0, flat: 0.3 },
  'Sauce': { canopyWidth: 4.5, canopyHeight: 4, curl: 0.3, thickness: 2.2, flat: 0.1 },
}
const CORAL_PRESETS: Record<string, Partial<BranchParams>> = {
  'Cuerno de Ciervo': { canopyWidth: 3, canopyHeight: 4.5, curl: 0.18, thickness: 1.6, flat: 0 },
  'Coral Mesa': { canopyWidth: 6, canopyHeight: 1.4, curl: 0.12, thickness: 2.0, flat: 0.9 },
  'Coral Cerebro': { canopyWidth: 3.5, canopyHeight: 3, curl: 0.35, thickness: 1.5, flat: 0.4 },
}
const SHELL_PRESETS: Record<string, ShellParamsUI> = {
  'Nautilus': { W: 1.6, D: 0.28, T: 0.05, whorls: 6, thickness: 0.09 },
  'Caracol de Torre': { W: 1.7, D: 0.75, T: 1.1, whorls: 6, thickness: 0.1 },
  'Amonite': { W: 1.9, D: 1.3, T: 0, whorls: 4.5, thickness: 0.08 },
  'Caracol de Jardín': { W: 2.3, D: 1.0, T: 0.45, whorls: 4, thickness: 0.14 },
}

const mono = "'Space Mono', monospace"
const MODE_COLOR: Record<Mode, string> = { coral: '#ff5e9e', arbol: '#00ff9d', concha: '#ffb800' }

export default function ProxygenesisPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<BABYLON.Scene | null>(null)
  const engineRef = useRef<BABYLON.Engine | null>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [windowWidth, setWindowWidth] = useState(1024)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const [mode, setMode] = useState<Mode>('coral')
  const [treeParams, setTreeParams] = useState<BranchParams>(TREE_DEFAULT)
  const [coralParams, setCoralParams] = useState<BranchParams>(CORAL_DEFAULT)
  const [shellParams, setShellParams] = useState<ShellParamsUI>(SHELL_DEFAULT)

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [specimenInfo, setSpecimenInfo] = useState<{ nodes: number; faces: number } | null>(null)

  const ENVELOPE_SEGMENTS = 32
  const [audioEnvelope, setAudioEnvelope] = useState<number[] | null>(null)
  const [audioStatus, setAudioStatus] = useState<'idle' | 'loading' | 'recording' | 'ready' | 'error'>('idle')
  const [audioErrorMsg, setAudioErrorMsg] = useState('')

  const handleAudioFile = async (file: File) => {
    setAudioStatus('loading')
    setAudioErrorMsg('')
    try {
      const buffer = await decodeAudioBlob(file)
      setAudioEnvelope(computeEnergyEnvelope(buffer, ENVELOPE_SEGMENTS))
      setAudioStatus('ready')
    } catch (err) {
      console.error('No se pudo decodificar el audio:', err)
      setAudioErrorMsg('No se pudo leer ese archivo de audio.')
      setAudioStatus('error')
    }
  }

  const handleRecordMic = async () => {
    setAudioStatus('recording')
    setAudioErrorMsg('')
    try {
      const blob = await recordMicClip(4)
      const buffer = await decodeAudioBlob(blob)
      setAudioEnvelope(computeEnergyEnvelope(buffer, ENVELOPE_SEGMENTS))
      setAudioStatus('ready')
    } catch (err) {
      console.error('No se pudo grabar del micrófono:', err)
      setAudioErrorMsg('No se pudo grabar del micrófono (¿diste permiso?).')
      setAudioStatus('error')
    }
  }

  const clearAudio = () => { setAudioEnvelope(null); setAudioStatus('idle') }
  const generationToken = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsClient(true)
    setWindowWidth(window.innerWidth)
    const onResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const isMobile = windowWidth <= 768

  // Si venís de la galería local con "CARGAR", aplica esos parámetros antes
  // de que arranque la primera generación (corre apenas isClient es true,
  // bien antes de que sceneReady dispare la generación inicial).
  useEffect(() => {
    if (!isClient) return
    const pending = consumePendingLoad()
    if (!pending) return
    if (pending.mode === 'concha') {
      setShellParams(p => ({ ...p, ...(pending.params as Partial<ShellParamsUI>) }))
    } else {
      const setter = pending.mode === 'coral' ? setCoralParams : setTreeParams
      setter(p => ({ ...p, ...(pending.params as Partial<BranchParams>) }))
    }
    setMode(pending.mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient])

  // Setup de la escena — una sola vez
  useEffect(() => {
    if (!isClient || !canvasRef.current) return
    const engine = new BABYLON.Engine(canvasRef.current, true)
    engineRef.current = engine
    const scene = new BABYLON.Scene(engine)
    sceneRef.current = scene
    scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.045, 1)

    const camera = new BABYLON.ArcRotateCamera('cam', Math.PI / 3, Math.PI / 2.6, 9, new BABYLON.Vector3(0, 1.5, 0), scene)
    camera.attachControl(canvasRef.current, true)
    camera.wheelPrecision = 50
    camera.lowerRadiusLimit = 2
    camera.upperRadiusLimit = 40

    const hemi = new BABYLON.HemisphericLight('h', new BABYLON.Vector3(0, 1, 0), scene)
    hemi.intensity = 0.55
    const dir = new BABYLON.DirectionalLight('d', new BABYLON.Vector3(-0.5, -1, -0.3), scene)
    dir.intensity = 0.5

    const gl = new BABYLON.GlowLayer('glow', scene)
    gl.intensity = 0.5

    engine.runRenderLoop(() => scene.render())
    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)
    setSceneReady(true)

    return () => {
      engine.dispose()
      sceneRef.current = null
      setSceneReady(false)
      window.removeEventListener('resize', onResize)
    }
  }, [isClient])

  // ---- construcción de mallas ----

  const clearSpecimen = useCallback(() => {
    const scene = sceneRef.current
    if (!scene) return
    const old = scene.getMeshByName('Specimen_Core')
    if (old) old.dispose()
  }, [])

  const buildSkeletonMesh = useCallback((nodes: SkeletonNode[], color: string) => {
    const scene = sceneRef.current
    if (!scene) return
    clearSpecimen()

    const radii = computeRadii(nodes, { leafRadius: 0.025, exponent: 2.3, maxRadius: 0.5 })
    const up = new BABYLON.Vector3(0, 1, 0)
    const parts: BABYLON.Mesh[] = []

    for (let i = 1; i < nodes.length; i++) {
      const child = nodes[i]
      const parent = nodes[child.parent]
      const from3 = new BABYLON.Vector3(parent.pos[0], parent.pos[1], parent.pos[2])
      const to3 = new BABYLON.Vector3(child.pos[0], child.pos[1], child.pos[2])
      const seg = to3.subtract(from3)
      const h = seg.length()
      if (h < 1e-5) continue
      const dirN = seg.normalize()

      const cyl = BABYLON.MeshBuilder.CreateCylinder(`seg${i}`, {
        diameterTop: Math.max(0.006, radii[i] * 2),
        diameterBottom: Math.max(0.006, radii[child.parent] * 2),
        height: h, tessellation: 6,
      }, scene)
      cyl.position = BABYLON.Vector3.Lerp(from3, to3, 0.5)

      const dot = BABYLON.Vector3.Dot(up, dirN)
      if (dot < -0.9999) {
        cyl.rotationQuaternion = BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(1, 0, 0), Math.PI)
      } else if (dot < 0.9999) {
        const axis = BABYLON.Vector3.Cross(up, dirN).normalize()
        cyl.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, Math.acos(dot))
      }
      parts.push(cyl)
    }

    const merged = BABYLON.Mesh.MergeMeshes(parts, true, true, undefined, false, true)
    if (merged) {
      merged.name = 'Specimen_Core'
      const mat = new BABYLON.StandardMaterial('specimenMat', scene)
      mat.diffuseColor = BABYLON.Color3.FromHexString(color).scale(0.25)
      mat.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.35)
      mat.specularColor = BABYLON.Color3.FromHexString(color)
      merged.material = mat

      const anim = new BABYLON.Animation('rot', 'rotation.y', 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE)
      anim.setKeys([{ frame: 0, value: 0 }, { frame: 900, value: Math.PI * 2 }])
      merged.animations = [anim]
      scene.beginAnimation(merged, 0, 900, true)

      setSpecimenInfo({ nodes: nodes.length, faces: (merged.getTotalIndices() || 0) / 3 })
    }
  }, [clearSpecimen])

  const buildShellMesh = useCallback((params: ShellParamsUI) => {
    const scene = sceneRef.current
    if (!scene) return
    clearSpecimen()

    const raw = generateShell({ W: params.W, D: params.D, T: params.T, whorls: params.whorls, tubeRadius: params.thickness, pointsPerWhorl: 72 })
    const { points, radii } = normalizeToViewSize(raw.points, raw.radii, 3.2)
    const path = points.map((p) => new BABYLON.Vector3(p[0], p[1], p[2]))

    const tube = BABYLON.MeshBuilder.CreateTube('Specimen_Core', {
      path, radiusFunction: (i: number) => radii[Math.min(i, radii.length - 1)],
      tessellation: 20, cap: BABYLON.Mesh.CAP_ALL,
    }, scene)

    const mat = new BABYLON.StandardMaterial('specimenMat', scene)
    const color = MODE_COLOR.concha
    mat.diffuseColor = BABYLON.Color3.FromHexString(color).scale(0.3)
    mat.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.3)
    mat.specularColor = BABYLON.Color3.FromHexString(color)
    tube.material = mat

    const anim = new BABYLON.Animation('rot', 'rotation.y', 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE)
    anim.setKeys([{ frame: 0, value: 0 }, { frame: 900, value: Math.PI * 2 }])
    tube.animations = [anim]
    scene.beginAnimation(tube, 0, 900, true)

    setSpecimenInfo({ nodes: points.length, faces: (tube.getTotalIndices() || 0) / 3 })
  }, [clearSpecimen])

  // ---- generación por chunks (no bloquea el hilo principal) ----

  const runGeneration = useCallback((branchMode: Mode, params: BranchParams) => {
    if (!sceneReady) return
    const myToken = ++generationToken.current
    setIsGenerating(true)
    setProgress(0)

    const numAttractors = QUALITY_ATTRACTORS[params.quality]
    const maxIterations = QUALITY_ITERATIONS[params.quality]
    const canopyY = branchMode === 'coral' ? params.canopyHeight * 0.6 : params.canopyHeight
    const canopyRadius: SkVec3 = [
      params.canopyWidth,
      params.canopyHeight * (1 - params.flat * 0.75),
      params.canopyWidth,
    ]

    const gen = runSpaceColonization({
      seed: params.seed,
      numAttractors,
      canopyCenter: [0, canopyY, 0],
      canopyRadius,
      rootPos: [0, 0, 0],
      influenceRadius: Math.max(0.9, params.canopyWidth * 0.5),
      killDistance: Math.max(0.18, params.canopyWidth * 0.5 * 0.2),
      stepSize: Math.max(0.1, params.canopyWidth * 0.5 * 0.14),
      maxIterations,
      curl: params.curl,
      // 0 (silencio) -> x0.2 de curl, 1 (pico del clip) -> x2.8 — incluso un
      // tramo mudo deja algo de textura, el pico real empuja bien fuerte.
      curlEnvelope: audioEnvelope ? audioEnvelope.map(e => 0.2 + e * 2.6) : undefined,
    })

    let result = gen.next()
    const frameBudgetMs = 12

    const step = () => {
      if (myToken !== generationToken.current) return // se canceló (cambió de modo/params mientras corría)
      const t0 = performance.now()
      while (!result.done && performance.now() - t0 < frameBudgetMs) {
        result = gen.next()
      }
      if (!result.done) {
        setProgress(result.value.iteration / result.value.maxIterations)
        requestAnimationFrame(step)
      } else {
        buildSkeletonMesh(result.value.nodes, MODE_COLOR[branchMode])
        setIsGenerating(false)
        setProgress(1)
      }
    }
    requestAnimationFrame(step)
  }, [sceneReady, buildSkeletonMesh, audioEnvelope])

  // regenerar cuando cambia de modo o (para coral/arbol) cuando se toca
  // "GENERAR" explícitamente -- la concha, al ser una fórmula cerrada
  // instantánea, se regenera sola con cada cambio de slider. Invalida
  // cualquier generación de coral/árbol en curso ANTES de ramificar: sin
  // esto, cambiar a "Concha" mientras un árbol todavía está creciendo en
  // background no la cancela -- puede terminar más tarde y pisar la malla
  // de la concha que se acaba de mostrar.
  useEffect(() => {
    if (!sceneReady) return
    generationToken.current++
    setIsGenerating(false)
    if (mode === 'concha') buildShellMesh(shellParams)
    else runGeneration(mode, mode === 'coral' ? coralParams : treeParams)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneReady, mode])

  useEffect(() => {
    if (!sceneReady || mode !== 'concha') return
    buildShellMesh(shellParams)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shellParams])

  const handleExportSTL = () => {
    const scene = sceneRef.current
    if (!scene) return
    const mesh = scene.getMeshByName('Specimen_Core') as BABYLON.Mesh | null
    if (!mesh) return
    exportMeshToSTL(mesh, `NeoProxy_proxygenesis_${mode}_specimen.stl`)
  }

  const [savingToGallery, setSavingToGallery] = useState(false)
  const handleSaveToGallery = async () => {
    const scene = sceneRef.current
    const engine = engineRef.current
    if (!scene || !engine || !scene.activeCamera || !specimenInfo) return
    setSavingToGallery(true)
    try {
      const thumbnail = await BABYLON.Tools.CreateScreenshotAsync(
        engine, scene.activeCamera, { width: 220, height: 160 }, 'image/jpeg', 0.5,
      )
      saveSpecimenToGallery({
        mode,
        params: (mode === 'concha' ? shellParams : branchParams) as unknown as Record<string, number | string>,
        nodes: specimenInfo.nodes,
        faces: specimenInfo.faces,
        thumbnail,
      })
    } catch (err) {
      console.error('No se pudo guardar en la galería local:', err)
    } finally {
      setSavingToGallery(false)
    }
  }

  const randomizeSeed = () => {
    const seed = Math.floor(Math.random() * 1_000_000)
    if (mode === 'coral') setCoralParams((p) => ({ ...p, seed }))
    else if (mode === 'arbol') setTreeParams((p) => ({ ...p, seed }))
  }

  const branchParams = mode === 'coral' ? coralParams : treeParams
  const setBranchParams = mode === 'coral' ? setCoralParams : setTreeParams
  const presets = mode === 'coral' ? CORAL_PRESETS : mode === 'arbol' ? TREE_PRESETS : SHELL_PRESETS
  const accent = MODE_COLOR[mode]

  const Slider = ({ label, value, min, max, step, onChange, suffix = '' }: {
    label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; suffix?: string
  }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#4a6080', marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: accent }}>{value.toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)}{suffix}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: accent }}
      />
    </div>
  )

  return (
    <div className="lab-page main-content" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#020408', fontFamily: mono }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 40, background: 'rgba(5,10,20,0.85)',
        borderBottom: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', zIndex: 100, backdropFilter: 'blur(5px)',
      }}>
        <span style={{ fontSize: 11, letterSpacing: 2, color: accent }}>NEOPROXY // R&D // PROXYGENESIS.v1</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/lab/proxygenesis/galeria" style={{ color: accent, textDecoration: 'none', fontSize: 10, border: `1px solid ${accent}44`, padding: '2px 8px' }}>
            GALERÍA ▸
          </Link>
          <Link href="/lab" style={{ color: accent, textDecoration: 'none', fontSize: 10, border: `1px solid ${accent}44`, padding: '2px 8px' }}>
            ← LABORATORIO
          </Link>
        </div>
      </div>

      {isClient && (
        <>
          {/* Selector de modo */}
          <div style={{
            position: 'absolute', top: 50, left: isMobile ? 10 : 20, zIndex: 100,
            display: 'flex', gap: 6,
          }}>
            {(['coral', 'arbol', 'concha'] as Mode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                fontFamily: mono, fontSize: 10, letterSpacing: 1, padding: '8px 14px', cursor: 'pointer',
                background: mode === m ? `${MODE_COLOR[m]}22` : 'rgba(5,10,20,0.85)',
                border: `1px solid ${mode === m ? MODE_COLOR[m] : '#2a3a50'}`,
                color: mode === m ? MODE_COLOR[m] : '#8fb8d6',
              }}>
                {m === 'coral' ? 'CORAL' : m === 'arbol' ? 'ÁRBOL' : 'CONCHA'}
              </button>
            ))}
          </div>

          {/* Panel de parámetros */}
          <div style={{
            position: 'absolute', top: isMobile ? 96 : 92, left: isMobile ? 10 : 20, right: isMobile ? 10 : 'auto',
            width: isMobile ? 'auto' : 240, zIndex: 100,
            background: 'rgba(5,10,20,0.92)', border: `1px solid ${accent}33`, backdropFilter: 'blur(15px)',
          }}>
            <button onClick={() => setIsPanelOpen((v) => !v)} style={{
              width: '100%', background: 'transparent', border: 'none', color: accent, padding: 10, fontSize: 10,
              cursor: 'pointer', display: isMobile ? 'flex' : 'none', justifyContent: 'space-between', fontFamily: mono,
            }}>
              <span>PARÁMETROS</span><span>{isPanelOpen ? '▼' : '▶'}</span>
            </button>

            {(!isMobile || isPanelOpen) && (
              <div style={{ padding: 16, maxHeight: isMobile ? '55vh' : '72vh', overflowY: 'auto' }}>
                <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 2, marginBottom: 10 }}>
                  {mode === 'concha' ? 'MODELO DE COILING (RAUP, 1962)' : 'SPACE COLONIZATION (RUNIONS ET AL., 2007)'}
                </div>

                {/* Presets */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                  {Object.entries(presets).map(([name, p]) => (
                    <button key={name} onClick={() => {
                      if (mode === 'concha') setShellParams({ ...SHELL_DEFAULT, ...(p as ShellParamsUI) })
                      else setBranchParams((prev) => ({ ...prev, ...(p as Partial<BranchParams>) }))
                    }} style={{
                      fontFamily: mono, fontSize: 8, padding: '4px 8px', cursor: 'pointer',
                      background: 'transparent', border: `1px solid ${accent}44`, color: accent,
                    }}>
                      {name}
                    </button>
                  ))}
                </div>

                {mode !== 'concha' ? (
                  <>
                    <Slider label="ANCHO DE COPA" value={branchParams.canopyWidth} min={1.5} max={7} step={0.1}
                      onChange={(v) => setBranchParams((p) => ({ ...p, canopyWidth: v }))} />
                    <Slider label="ALTURA DE COPA" value={branchParams.canopyHeight} min={1.5} max={8} step={0.1}
                      onChange={(v) => setBranchParams((p) => ({ ...p, canopyHeight: v }))} />
                    <Slider label="ACHATADO (MESA)" value={branchParams.flat} min={0} max={0.9} step={0.05}
                      onChange={(v) => setBranchParams((p) => ({ ...p, flat: v }))} />
                    <Slider label="CURVATURA ORGÁNICA" value={branchParams.curl} min={0} max={0.4} step={0.01}
                      onChange={(v) => setBranchParams((p) => ({ ...p, curl: v }))} />
                    <Slider label="GROSOR DE RAMAS" value={branchParams.thickness} min={1.5} max={3.2} step={0.1}
                      onChange={(v) => setBranchParams((p) => ({ ...p, thickness: v }))} />

                    <div style={{ marginBottom: 14, borderTop: `1px solid ${accent}22`, paddingTop: 12 }}>
                      <div style={{ fontSize: 9, color: '#4a6080', marginBottom: 6 }}>
                        MODULACIÓN SONORA {audioEnvelope && <span style={{ color: accent }}>● ACTIVA</span>}
                      </div>
                      {!audioEnvelope ? (
                        <>
                          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                            <label style={{
                              flex: 1, fontFamily: mono, fontSize: 8, padding: '6px 4px', textAlign: 'center', cursor: 'pointer',
                              background: 'transparent', border: `1px solid ${accent}44`, color: accent,
                            }}>
                              ⬆ SUBIR AUDIO
                              <input type="file" accept="audio/*" style={{ display: 'none' }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleAudioFile(f) }} />
                            </label>
                            <button onClick={handleRecordMic} disabled={audioStatus === 'recording' || audioStatus === 'loading'} style={{
                              flex: 1, fontFamily: mono, fontSize: 8, padding: '6px 4px', cursor: 'pointer',
                              background: 'transparent', border: `1px solid ${accent}44`, color: accent,
                              opacity: (audioStatus === 'recording' || audioStatus === 'loading') ? 0.5 : 1,
                            }}>
                              {audioStatus === 'recording' ? '● GRABANDO...' : '● MIC (4s)'}
                            </button>
                          </div>
                          <div style={{ fontSize: 7, color: '#3a4a60', lineHeight: 1.6 }}>
                            Modula la curvatura orgánica a lo largo del crecimiento según el volumen del clip — un tramo fuerte sale más ondulado.
                          </div>
                          {audioErrorMsg && <div style={{ fontSize: 8, color: '#ff4444', marginTop: 4 }}>{audioErrorMsg}</div>}
                        </>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 28, marginBottom: 6 }}>
                            {audioEnvelope.map((e, i) => (
                              <div key={i} style={{ flex: 1, height: `${Math.max(4, e * 100)}%`, background: accent, opacity: 0.4 + e * 0.6 }} />
                            ))}
                          </div>
                          <button onClick={clearAudio} style={{
                            width: '100%', fontFamily: mono, fontSize: 8, padding: '6px 0', cursor: 'pointer',
                            background: 'transparent', border: '1px solid #ff444466', color: '#ff4444',
                          }}>
                            ✕ QUITAR AUDIO
                          </button>
                        </>
                      )}
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 9, color: '#4a6080', marginBottom: 4 }}>CALIDAD // DETALLE</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {(['baja', 'media', 'alta', 'extrema'] as Quality[]).map((q) => (
                          <button key={q} onClick={() => setBranchParams((p) => ({ ...p, quality: q }))} style={{
                            fontFamily: mono, fontSize: 8, padding: '5px 8px', textAlign: 'left', cursor: 'pointer',
                            background: branchParams.quality === q ? `${accent}22` : 'transparent',
                            border: `1px solid ${branchParams.quality === q ? accent : '#2a3a50'}`,
                            color: branchParams.quality === q ? accent : '#4a6080',
                          }}>
                            {QUALITY_LABEL[q]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ fontSize: 8, color: '#3a4a60', marginBottom: 10 }}>SEMILLA: 0x{branchParams.seed.toString(16)}</div>

                    <button onClick={randomizeSeed} disabled={isGenerating} style={{
                      width: '100%', fontFamily: mono, fontSize: 9, padding: 8, marginBottom: 8, cursor: isGenerating ? 'default' : 'pointer',
                      background: 'transparent', border: `1px solid ${accent}66`, color: accent, opacity: isGenerating ? 0.4 : 1,
                    }}>
                      ⟲ NUEVA SEMILLA
                    </button>
                    <button onClick={() => runGeneration(mode, branchParams)} disabled={isGenerating} style={{
                      width: '100%', fontFamily: mono, fontSize: 10, fontWeight: 700, padding: 10, marginBottom: 8,
                      cursor: isGenerating ? 'default' : 'pointer', background: accent, color: '#020408', border: 'none',
                      opacity: isGenerating ? 0.5 : 1, letterSpacing: 1,
                    }}>
                      {isGenerating ? `CRECIENDO... ${Math.round(progress * 100)}%` : '▲ GENERAR'}
                    </button>
                  </>
                ) : (
                  <>
                    <Slider label="W — EXPANSIÓN POR VUELTA" value={shellParams.W} min={1.05} max={3} step={0.01}
                      onChange={(v) => setShellParams((p) => ({ ...p, W: v }))} />
                    <Slider label="D — DISTANCIA AL EJE" value={shellParams.D} min={0.15} max={2} step={0.01}
                      onChange={(v) => setShellParams((p) => ({ ...p, D: v }))} />
                    <Slider label="T — ALTURA DE LA ESPIRA" value={shellParams.T} min={0} max={1.5} step={0.01}
                      onChange={(v) => setShellParams((p) => ({ ...p, T: v }))} />
                    <Slider label="VUELTAS" value={shellParams.whorls} min={2} max={9} step={0.1}
                      onChange={(v) => setShellParams((p) => ({ ...p, whorls: v }))} />
                    <Slider label="GROSOR DEL TUBO" value={shellParams.thickness} min={0.04} max={0.3} step={0.005}
                      onChange={(v) => setShellParams((p) => ({ ...p, thickness: v }))} />
                  </>
                )}

                <button onClick={handleExportSTL} disabled={isGenerating || !specimenInfo} style={{
                  width: '100%', fontFamily: mono, fontSize: 10, fontWeight: 700, padding: 10, marginTop: 6,
                  cursor: (isGenerating || !specimenInfo) ? 'default' : 'pointer', background: 'transparent',
                  border: `1px solid ${accent}`, color: accent, opacity: (isGenerating || !specimenInfo) ? 0.4 : 1, letterSpacing: 1,
                }}>
                  ▽ EXPORTAR .STL
                </button>
                <button onClick={handleSaveToGallery} disabled={isGenerating || !specimenInfo || savingToGallery} style={{
                  width: '100%', fontFamily: mono, fontSize: 9, padding: 9, marginTop: 6,
                  cursor: (isGenerating || !specimenInfo || savingToGallery) ? 'default' : 'pointer', background: 'transparent',
                  border: `1px solid ${accent}66`, color: accent, opacity: (isGenerating || !specimenInfo || savingToGallery) ? 0.4 : 1, letterSpacing: 1,
                }}>
                  {savingToGallery ? 'GUARDANDO...' : '✦ GUARDAR EN GALERÍA'}
                </button>
              </div>
            )}
          </div>

          {/* Overlay de carga con progreso real */}
          {isGenerating && mode !== 'concha' && (
            <div style={{
              position: 'absolute', bottom: isMobile ? 70 : 20, left: isMobile ? 10 : 20,
              right: isMobile ? 10 : 'auto', width: isMobile ? 'auto' : 240, zIndex: 100,
              background: 'rgba(5,10,20,0.92)', border: `1px solid ${accent}44`, padding: '10px 14px',
            }}>
              <div style={{ fontSize: 9, color: accent, letterSpacing: 1, marginBottom: 6 }}>
                CRECIENDO ORGANISMO...
              </div>
              <div style={{ height: 3, background: '#1a2436' }}>
                <div style={{ height: '100%', width: `${progress * 100}%`, background: accent, transition: 'width 0.1s linear' }} />
              </div>
            </div>
          )}

          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none', position: 'absolute', top: 0, left: 0 }} />

          {/* Status */}
          <div style={{
            position: 'absolute', bottom: isMobile ? 10 : 20, right: isMobile ? 10 : 20, textAlign: 'right',
            pointerEvents: 'none', background: 'rgba(5,10,20,0.85)', padding: '8px 12px', border: `1px solid ${accent}44`,
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: 9, color: '#4a6080', marginBottom: 4 }}>SPECIMEN_STATUS</div>
            <div style={{ fontSize: isMobile ? 13 : 16, color: accent, marginBottom: 4, textShadow: `0 0 10px ${accent}44` }}>
              {isGenerating ? 'CRECIENDO' : specimenInfo ? 'RESONANT_ACTIVE' : 'INICIALIZANDO'}
            </div>
            {specimenInfo && (
              <div style={{ fontSize: 8, color: '#4a6080' }}>
                NODOS: {specimenInfo.nodes.toLocaleString()} // CARAS: {Math.round(specimenInfo.faces).toLocaleString()}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
