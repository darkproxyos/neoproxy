'use client'

// ARSENAL — visor de espadas. Las piezas llegan de a una desde los hilos de cálculo, ya con una
// normal por esquina (los cantos quedan vivos) y sus trazos. La escena usa el sistema diestro,
// el mismo de las mallas: así lo grabado se lee al derecho.

import { useEffect, useRef } from 'react'
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, Color3, Color4, StandardMaterial, Mesh, VertexData,
  TransformNode, GlowLayer, MeshBuilder, LinesMesh,
} from '@babylonjs/core'
import { tuneOrbitCamera, zoomBy } from '@/components/viewer/orbit'
import ZoomControls from '@/components/viewer/ZoomControls'
import type { ViewData } from '@/lib/arsenal/vertice/worker'

export type ViewPart = { key: string; group: string; explode: [number, number, number]; view: ViewData }
export type Palette = Record<string, string>
export type SwordViewerApi = {
  begin(center: [number, number, number], radius: number): void
  addPart(p: ViewPart): void
  removePart(key: string): void
  setPalette(p: Palette): void
  setExplode(e: number): void
  setVisible(group: string, on: boolean): void
  setGlow(on: boolean): void
  setLines(on: boolean): void
  setSpin(on: boolean): void
  zoom(f: number): void
  resetView(): void
  focus(c: [number, number, number], r: number): void
  view(alpha: number, beta: number): void
  snapshot(): string
}

// brillo y dureza de cada material
const FINISH: Record<string, { spec: number; pow: number; emis: number }> = {
  nucleo: { spec: 0.62, pow: 56, emis: 0.05 }, filo: { spec: 0.85, pow: 110, emis: 0.08 }, blindaje: { spec: 0.32, pow: 22, emis: 0.04 },
  guarda: { spec: 0.55, pow: 48, emis: 0.05 }, pomo: { spec: 0.55, pow: 48, emis: 0.05 }, mango: { spec: 0.16, pow: 10, emis: 0.03 },
  dial: { spec: 0.7, pow: 80, emis: 0.35 }, manguera: { spec: 0.35, pow: 30, emis: 0.02 }, varilla: { spec: 0.7, pow: 70, emis: 0.02 },
}

export default function SwordViewer({ onReady, initialAlpha = Math.PI / 2 - 0.3 }: { onReady: (api: SwordViewerApi | null) => void; initialAlpha?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const apiRef = useRef<SwordViewerApi | null>(null)
  const readyRef = useRef(onReady)
  useEffect(() => { readyRef.current = onReady }, [onReady])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true })
    const scene = new Scene(engine)
    scene.useRightHandedSystem = true
    scene.clearColor = new Color4(0.008, 0.01, 0.016, 1)
    const BETA = 1.36
    const cam = new ArcRotateCamera('cam', initialAlpha, BETA, 900, Vector3.Zero(), scene)
    tuneOrbitCamera(cam, { min: 25, max: 4000 }, 2)
    cam.minZ = 1; cam.maxZ = 12000; cam.fov = 0.7
    cam.attachControl(canvas, true)
    cam.useAutoRotationBehavior = true
    if (cam.autoRotationBehavior) { cam.autoRotationBehavior.idleRotationSpeed = 0.08; cam.autoRotationBehavior.idleRotationWaitTime = 3000 }
    const hemi = new HemisphericLight('h', new Vector3(0.1, 1, 0.25), scene); hemi.intensity = 0.42; hemi.groundColor = new Color3(0.07, 0.08, 0.12)
    const key = new DirectionalLight('k', new Vector3(-0.35, -0.75, -0.55), scene); key.intensity = 0.78
    const rim = new DirectionalLight('r', new Vector3(0.7, 0.25, 0.6), scene); rim.intensity = 0.45; rim.diffuse = new Color3(0.65, 0.8, 1)
    const fill = new DirectionalLight('f', new Vector3(0.15, -0.35, 1), scene); fill.intensity = 0.22
    const glow = new GlowLayer('glow', scene, { blurKernelSize: 18 }); glow.intensity = 0.7
    // brillan solo la fibra y el dial; las demás piezas entran negras al mapa de brillo, así lo tapan
    const glowing = new Set<Mesh>()
    glow.customEmissiveColorSelector = (mesh, _sub, material, result) => {
      if (glowing.has(mesh as Mesh) && glowOn) { const e = (material as StandardMaterial).emissiveColor; result.set(e.r, e.g, e.b, 1) }
      else result.set(0, 0, 0, 0)
    }

    let palette: Palette = {}
    const mats = new Map<string, StandardMaterial>()
    const mat = (group: string) => {
      let m = mats.get(group)
      if (!m) {
        m = new StandardMaterial(`m-${group}`, scene)
        const f = FINISH[group] ?? FINISH.nucleo
        m.specularColor = new Color3(f.spec, f.spec, f.spec * 1.04); m.specularPower = f.pow
        mats.set(group, m)
      }
      return m
    }
    const luz = new StandardMaterial('luz', scene)
    luz.diffuseColor = new Color3(0, 0, 0); luz.specularColor = new Color3(0, 0, 0); luz.disableLighting = true
    let glowOn = true
    const paint = () => {
      for (const [g, m] of mats) {
        const c = Color3.FromHexString(palette[g] ?? '#808890'), f = FINISH[g] ?? FINISH.nucleo
        m.diffuseColor = c
        m.emissiveColor = c.scale(g === 'dial' ? (glowOn ? f.emis : 0.06) : f.emis)
      }
      const l = Color3.FromHexString(palette.luz ?? '#00e0ff')
      luz.emissiveColor = glowOn ? l : l.scale(0.18)
    }

    type Unit = { node: TransformNode; ex: [number, number, number]; key: string; group: string; lines: LinesMesh | null; meshes: Mesh[] }
    let root: TransformNode | null = null, units: Unit[] = [], explode = 0, explodeT = 0, step = 80, linesOn = true
    let goalT: Vector3 | null = null, goalR = 0
    const hidden = new Set<string>()
    let home: { c: Vector3; r: number } | null = null

    const layout = () => { for (const u of units) u.node.position.set(u.ex[0] * explode * step, u.ex[1] * explode * step, u.ex[2] * explode * step) }
    const build = (name: string, P: Float32Array, N: Float32Array) => {
      const m = new Mesh(name, scene), vd = new VertexData()
      // Babylon toma como cara de adelante el orden contrario al de estas mallas (medido: con el orden
      // original se ven las caras de adentro, también con el sistema diestro); las normales van aparte
      const I = new Uint32Array(P.length / 3); for (let i = 0; i < I.length; i += 3) { I[i] = i; I[i + 1] = i + 2; I[i + 2] = i + 1 }
      vd.positions = P; vd.normals = N; vd.indices = I; vd.applyToMesh(m)
      return m
    }
    // radio para que el largo quepa también en una pantalla angosta
    const fitRadius = (r: number) => {
      const asp = engine.getRenderWidth() / Math.max(1, engine.getRenderHeight())
      const hHalf = Math.atan(Math.tan(cam.fov / 2) * asp)
      return Math.max(r * 0.9, (r * 0.94) / Math.tan(Math.min(hHalf, cam.fov / 2)))
    }

    const api: SwordViewerApi = {
      begin(center, radius) {
        root?.dispose(); root = new TransformNode('espada', scene); units = []; glowing.clear()
        step = Math.max(40, radius * 0.16)
        const r = fitRadius(radius)
        cam.target.set(center[0], center[1], center[2]); cam.radius = r
        cam.upperRadiusLimit = r * 4; cam.lowerRadiusLimit = 25
        home = { c: new Vector3(center[0], center[1], center[2]), r }; goalT = null
      },
      addPart(p) {
        api.removePart(p.key)
        const node = new TransformNode(p.key, scene); node.parent = root
        const meshes: Mesh[] = []
        if (p.view.P.length) { const m = build(p.key, p.view.P, p.view.N); m.material = mat(p.group); m.parent = node; meshes.push(m) }
        if (p.view.gP.length) { const g = build(`${p.key}-luz`, p.view.gP, p.view.gN); g.material = luz; g.parent = node; glowing.add(g); meshes.push(g) }
        if (p.group === 'dial') for (const m of meshes) glowing.add(m)
        let lines: LinesMesh | null = null
        if (p.view.lines.length) {
          const L = p.view.lines, segs: Vector3[][] = []
          for (let i = 0; i < L.length; i += 6) segs.push([new Vector3(L[i], L[i + 1], L[i + 2]), new Vector3(L[i + 3], L[i + 4], L[i + 5])])
          lines = MeshBuilder.CreateLineSystem(`${p.key}-trazo`, { lines: segs }, scene)
          lines.color = new Color3(0.01, 0.015, 0.02); lines.alpha = 0.55; lines.parent = node; lines.isPickable = false
          lines.setEnabled(linesOn)
        }
        units.push({ node, ex: p.explode, key: p.key, group: p.group, lines, meshes })
        paint(); layout()
        if (hidden.has(p.group)) node.setEnabled(false)
      },
      removePart(k) {
        const i = units.findIndex((u) => u.key === k)
        if (i >= 0) { for (const m of units[i].meshes) glowing.delete(m); units[i].node.dispose(); units.splice(i, 1) }
      },
      setPalette(p) { palette = p; paint() },
      setExplode(e) { explodeT = e },
      setVisible(g, on) {
        if (on) hidden.delete(g); else hidden.add(g)
        for (const u of units) if (u.group === g) u.node.setEnabled(on)
      },
      setGlow(on) { glowOn = on; glow.intensity = on ? 0.7 : 0; paint() },
      setLines(on) { linesOn = on; for (const u of units) u.lines?.setEnabled(on) },
      setSpin(on) { if (cam.autoRotationBehavior) cam.autoRotationBehavior.idleRotationSpeed = on ? 0.08 : 0 },
      zoom(f) { zoomBy(cam, f) },
      resetView() { cam.alpha = initialAlpha; cam.beta = BETA; if (home) { goalT = home.c.clone(); goalR = home.r } },
      focus(c, r) { goalT = new Vector3(c[0], c[1], c[2]); goalR = r },
      view(a, b) { cam.alpha = a; cam.beta = b },
      snapshot() { return canvas.toDataURL('image/png') },
    }
    apiRef.current = api
    readyRef.current(api)
    // para las pruebas automáticas en desarrollo
    if (process.env.NODE_ENV !== 'production') (window as unknown as { __sword?: SwordViewerApi }).__sword = api

    scene.onBeforeRenderObservable.add(() => {
      const k = 1 - Math.exp(-Math.min(0.1, engine.getDeltaTime() / 1000) * 7)
      if (Math.abs(explode - explodeT) > 1e-4) { explode += (explodeT - explode) * k; layout() }
      if (goalT) {
        cam.target.x += (goalT.x - cam.target.x) * k; cam.target.y += (goalT.y - cam.target.y) * k; cam.target.z += (goalT.z - cam.target.z) * k
        cam.radius += (goalR - cam.radius) * k
        if (Vector3.DistanceSquared(cam.target, goalT) < 0.01 && Math.abs(goalR - cam.radius) < 0.3) goalT = null
      }
    })
    engine.runRenderLoop(() => scene.render())
    const ro = new ResizeObserver(() => engine.resize())
    ro.observe(canvas as unknown as Element)
    return () => { apiRef.current = null; readyRef.current(null); ro.disconnect(); engine.stopRenderLoop(); scene.dispose(); engine.dispose() }
  }, [initialAlpha])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={canvasRef} data-arsenal="viewer" style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none', outline: 'none' }} />
      <ZoomControls onZoom={(f) => apiRef.current?.zoom(f)} onReset={() => apiRef.current?.resetView()} />
    </div>
  )
}
