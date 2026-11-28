'use client'

import { useEffect, useRef } from 'react'
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, Color3, Color4, StandardMaterial, Mesh, VertexData, TransformNode, GlowLayer,
} from '@babylonjs/core'
import { tuneOrbitCamera, zoomBy } from '@/components/viewer/orbit'
import ZoomControls from '@/components/viewer/ZoomControls'

export type KPart = {
  key: string; count: number; color: string; mirror: boolean; explode: [number, number, number]
  positions: Float32Array; indices: Uint32Array; glow?: Uint32Array
}
export type KScene = { parts: KPart[]; center: [number, number, number]; radius: number }
export type KatanaViewerApi = {
  setScene(s: KScene): void
  setExplode(e: number): void
  setVisible(key: string, on: boolean): void
  setGlow(on: boolean): void
  setSpin(on: boolean): void
  zoom(f: number): void
  resetView(): void
  focus(c: [number, number, number], r: number): void
  snapshot(): string
}

const hex = (h: string) => Color3.FromHexString(h)

// Las piezas están en coordenadas matemáticas (x a lo largo de la hoja, y hacia el lomo, z el espesor). Se
// usan tal cual: en Babylon (mano izquierda) quedan reflejadas en z, y como la hoja es simétrica en z da igual.
function toMesh(name: string, P0: Float32Array, I0: Uint32Array, scene: Scene, flipZ: boolean): Mesh {
  const P = new Float32Array(P0.length)
  for (let i = 0; i < P.length; i += 3) { P[i] = P0[i]; P[i + 1] = P0[i + 1]; P[i + 2] = flipZ ? -P0[i + 2] : P0[i + 2] }
  const I = new Uint32Array(I0.length)
  // Babylon usa mano izquierda: las mismas coordenadas piden el orden de triángulos contrario al de las mallas de
  // aquí (medido: con el orden original se ve el interior de las piezas). La copia reflejada en z ya trae el suyo.
  for (let i = 0; i < I.length; i += 3) { I[i] = I0[i]; I[i + 1] = flipZ ? I0[i + 1] : I0[i + 2]; I[i + 2] = flipZ ? I0[i + 2] : I0[i + 1] }
  const m = new Mesh(name, scene)
  const vd = new VertexData(); vd.positions = P; vd.indices = I
  const N = new Float32Array(P.length); VertexData.ComputeNormals(P, I, N); vd.normals = N
  vd.applyToMesh(m)
  return m
}

export default function KatanaViewer({ onReady }: { onReady: (api: KatanaViewerApi | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const apiRef = useRef<KatanaViewerApi | null>(null)
  const readyRef = useRef(onReady)
  useEffect(() => { readyRef.current = onReady }, [onReady])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true })
    const scene = new Scene(engine)
    scene.clearColor = new Color4(0.008, 0.01, 0.016, 1)
    const cam = new ArcRotateCamera('cam', -Math.PI / 2 - 0.35, 1.28, 600, Vector3.Zero(), scene)
    tuneOrbitCamera(cam, { min: 30, max: 2400 }, 3)
    cam.minZ = 1; cam.maxZ = 8000
    cam.attachControl(canvas, true)
    cam.useAutoRotationBehavior = true
    if (cam.autoRotationBehavior) { cam.autoRotationBehavior.idleRotationSpeed = 0.1; cam.autoRotationBehavior.idleRotationWaitTime = 2500 }
    const hemi = new HemisphericLight('h', new Vector3(0.1, 1, -0.2), scene); hemi.intensity = 0.55; hemi.groundColor = new Color3(0.08, 0.1, 0.14)
    const key = new DirectionalLight('k', new Vector3(-0.4, -0.8, 0.55), scene); key.intensity = 0.95
    const rim = new DirectionalLight('r', new Vector3(0.8, 0.3, -0.5), scene); rim.intensity = 0.55; rim.diffuse = new Color3(0.6, 0.8, 1)
    const fill = new DirectionalLight('f', new Vector3(0.2, -0.3, -1), scene); fill.intensity = 0.3
    const glow = new GlowLayer('glow', scene, { blurKernelSize: 24 }); glow.intensity = 1.4

    const mats = new Map<string, StandardMaterial>()
    const mat = (color: string) => {
      let m = mats.get(color)
      if (!m) {
        m = new StandardMaterial(`m${color}`, scene)
        m.diffuseColor = hex(color); m.specularColor = new Color3(0.55, 0.58, 0.62); m.specularPower = 64; m.emissiveColor = hex(color).scale(0.06)
        mats.set(color, m)
      }
      return m
    }
    const glowMat = new StandardMaterial('luz', scene)
    glowMat.diffuseColor = new Color3(0, 0, 0); glowMat.emissiveColor = new Color3(0.0, 0.95, 1); glowMat.specularColor = new Color3(0, 0, 0)

    type Unit = { node: TransformNode; ex: [number, number, number]; sign: number; key: string; meshes: Mesh[]; glowMeshes: Mesh[] }
    let root: TransformNode | null = null, units: Unit[] = [], explode = 0, explodeT = 0, step = 80
    let goalT: Vector3 | null = null, goalR = 0 // encuadre animado hacia un detalle
    const hidden = new Set<string>()
    let home: { c: Vector3; r: number } | null = null

    const layout = () => {
      for (const u of units) u.node.position.set(u.ex[0] * explode * step, u.ex[1] * explode * step, u.ex[2] * u.sign * explode * step)
    }

    const api: KatanaViewerApi = {
      setScene(s) {
        root?.dispose(); root = new TransformNode('katana', scene); units = []
        for (const p of s.parts) {
          for (const mirror of p.mirror ? [false, true] : [false]) {
            const node = new TransformNode(`${p.key}${mirror ? '-m' : ''}`, scene); node.parent = root
            const m = toMesh(p.key, p.positions, p.indices, scene, mirror); m.material = mat(p.color); m.parent = node
            const glowMeshes: Mesh[] = []
            if (p.glow && p.glow.length) { const g = toMesh(`${p.key}-luz`, p.positions, p.glow, scene, mirror); g.material = glowMat; g.parent = node; glowMeshes.push(g) }
            units.push({ node, ex: p.explode, sign: mirror ? -1 : 1, key: p.key, meshes: [m], glowMeshes })
          }
        }
        step = Math.max(40, s.radius * 0.28)
        cam.target.set(s.center[0], s.center[1], s.center[2])
        cam.radius = s.radius * 1.55
        cam.upperRadiusLimit = s.radius * 6; cam.lowerRadiusLimit = 30
        home = { c: new Vector3(s.center[0], s.center[1], s.center[2]), r: s.radius * 1.55 }; goalT = null
        layout()
        for (const k of hidden) api.setVisible(k, false)
      },
      setExplode(e) { explodeT = e },
      setVisible(k, on) {
        if (on) hidden.delete(k); else hidden.add(k)
        for (const u of units) if (u.key === k) { u.node.setEnabled(on) }
      },
      setGlow(on) { glowMat.emissiveColor = on ? new Color3(0, 0.95, 1) : new Color3(0.08, 0.18, 0.2); glow.intensity = on ? 1.4 : 0 },
      setSpin(on) { if (cam.autoRotationBehavior) cam.autoRotationBehavior.idleRotationSpeed = on ? 0.1 : 0 },
      zoom(f) { zoomBy(cam, f) },
      resetView() { cam.alpha = -Math.PI / 2 - 0.35; cam.beta = 1.28; if (home) { goalT = home.c.clone(); goalR = home.r } },
      focus(c, r) { goalT = new Vector3(c[0], c[1], c[2]); goalR = r },
      snapshot() { return canvas.toDataURL('image/png') },
    }
    apiRef.current = api
    readyRef.current(api)

    scene.onBeforeRenderObservable.add(() => {
      // las animaciones dependen del tiempo, no de los cuadros: igual de rápidas en un teléfono lento
      const k = 1 - Math.exp(-Math.min(0.1, engine.getDeltaTime() / 1000) * 7)
      if (Math.abs(explode - explodeT) > 1e-4) { explode += (explodeT - explode) * k; layout() }
      if (goalT) {
        // en el sitio: asignar cam.target recalcularía alpha y beta (la cámara espiraría hacia el nuevo punto)
        cam.target.x += (goalT.x - cam.target.x) * k; cam.target.y += (goalT.y - cam.target.y) * k; cam.target.z += (goalT.z - cam.target.z) * k
        cam.radius += (goalR - cam.radius) * k
        if (Vector3.DistanceSquared(cam.target, goalT) < 0.01 && Math.abs(goalR - cam.radius) < 0.2) goalT = null
      }
    })
    engine.runRenderLoop(() => scene.render())
    const ro = new ResizeObserver(() => engine.resize())
    ro.observe(canvas as unknown as Element)
    return () => { apiRef.current = null; readyRef.current(null); ro.disconnect(); engine.stopRenderLoop(); scene.dispose(); engine.dispose() }
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={canvasRef} data-katana="viewer" style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none', outline: 'none' }} />
      <ZoomControls onZoom={(f) => apiRef.current?.zoom(f)} onReset={() => apiRef.current?.resetView()} />
    </div>
  )
}
