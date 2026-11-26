'use client'

import { useEffect, useRef } from 'react'
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, Color3, Color4, StandardMaterial, Mesh, VertexData,
  TransformNode, Matrix, Quaternion, type AbstractMesh,
} from '@babylonjs/core'
import { tuneOrbitCamera, zoomBy } from '@/components/viewer/orbit'
import ZoomControls from '@/components/viewer/ZoomControls'
import type { Frame } from '@/lib/antesis/layout'

export type ViewerPart = { key: string; positions: Float32Array; indices: Uint32Array }
export type ViewerScene = {
  parts: ViewerPart[]
  framesA: Frame[]; framesB: Frame[]
  NA: number; NB: number
  bounds: number
  explodeStep: number // mm por unidad de explosión
}
export type AntesisViewerApi = {
  setScene(s: ViewerScene): void
  setColors(c: Record<string, string>): void
  setSpin(radPerSec: number): void
  setExplode(e: number): void
  setVisible(key: string, on: boolean): void
  nudge(rad: number): void
  zoom(f: number): void
  resetView(): void
  // modo reel: la cámara la mueve una coreografía (órbita, altura, encuadre)
  setReel(on: boolean): void
  setOrbit(radPerSec: number): void
  setBeta(beta: number): void
  setFraming(scale: number, up: number): void
}

const hex = (h: string) => Color3.FromHexString(h)

// Malla en coordenadas matemáticas (z = eje) → Babylon (y arriba, mano izquierda):
// (x, y, z) → (x, z, y), que es una reflexión, así que se invierte el orden de los
// triángulos para que las normales sigan hacia afuera.
function toBabylon(name: string, p: ViewerPart, scene: Scene, flat: boolean): Mesh {
  const P = new Float32Array(p.positions.length)
  for (let i = 0; i < P.length; i += 3) { P[i] = p.positions[i]; P[i + 1] = p.positions[i + 2]; P[i + 2] = p.positions[i + 1] }
  const I = new Uint32Array(p.indices.length)
  for (let i = 0; i < I.length; i += 3) { I[i] = p.indices[i]; I[i + 1] = p.indices[i + 2]; I[i + 2] = p.indices[i + 1] }
  const m = new Mesh(name, scene)
  const vd = new VertexData(); vd.positions = P; vd.indices = I
  const N = new Float32Array(P.length); VertexData.ComputeNormals(P, I, N); vd.normals = N
  vd.applyToMesh(m)
  if (flat) m.convertToFlatShadedMesh()
  m.isVisible = false // las copias son instancias
  return m
}

// Rotación del marco (columnas x, y, z en coordenadas matemáticas) en Babylon.
function frameQuat(f: Frame): Quaternion {
  const c = (v: number[]) => [v[0], v[2], v[1]]
  const r0 = c(f.x), r1 = c(f.z), r2 = c(f.y)
  const m = Matrix.FromValues(r0[0], r0[1], r0[2], 0, r1[0], r1[1], r1[2], 0, r2[0], r2[1], r2[2], 0, 0, 0, 0, 1)
  return Quaternion.FromRotationMatrix(m)
}

export default function AntesisViewer({ onReady }: { onReady: (api: AntesisViewerApi | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const apiRef = useRef<AntesisViewerApi | null>(null)
  const readyRef = useRef(onReady)
  useEffect(() => { readyRef.current = onReady }, [onReady])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true })
    const scene = new Scene(engine)
    scene.clearColor = new Color4(0.012, 0.012, 0.02, 1)
    const cam = new ArcRotateCamera('cam', -Math.PI / 3, 1.05, 200, Vector3.Zero(), scene)
    tuneOrbitCamera(cam, { min: 20, max: 900 }, 3)
    cam.minZ = 0.5; cam.maxZ = 5000
    cam.attachControl(canvas, true)
    cam.useAutoRotationBehavior = true
    if (cam.autoRotationBehavior) { cam.autoRotationBehavior.idleRotationSpeed = 0.12; cam.autoRotationBehavior.idleRotationWaitTime = 3000 }
    const hemi = new HemisphericLight('h', new Vector3(0.2, 1, 0.1), scene); hemi.intensity = 0.62; hemi.groundColor = new Color3(0.12, 0.1, 0.16)
    const key = new DirectionalLight('k', new Vector3(-0.5, -0.9, 0.35), scene); key.intensity = 0.85
    const rim = new DirectionalLight('r', new Vector3(0.7, 0.2, -0.8), scene); rim.intensity = 0.45; rim.diffuse = new Color3(0.75, 0.8, 1)

    const mats: Record<string, StandardMaterial> = {}
    const mat = (k: string) => {
      if (!mats[k]) { const m = new StandardMaterial(k, scene); m.specularColor = new Color3(0.32, 0.32, 0.34); m.specularPower = 48; m.backFaceCulling = true; mats[k] = m }
      return mats[k]
    }
    let colors: Record<string, string> = {}
    const applyColors = () => { for (const [k, v] of Object.entries(colors)) { const m = mat(k); m.diffuseColor = hex(v); m.emissiveColor = hex(v).scale(0.07) } }

    type Unit = { spin: TransformNode; gear?: AbstractMesh; deco?: AbstractMesh; pin?: AbstractMesh; cls: 'A' | 'B' }
    let root: TransformNode | null = null, units: Unit[] = [], base: Mesh[] = [], core: AbstractMesh | null = null
    let ratio = 1, step = 6, spin = 0.6, angle = 0, explode = 0, explodeT = 0, bounds = 50, follow = true, userZoom = 1
    let reel = false, orbit = 0, betaT = 1.05, frameScale = 1, frameUp = 0
    const hidden = new Set<string>()

    const layout = () => {
      for (const u of units) {
        const e = explode * step
        if (u.gear) u.gear.position.y = e * 1
        if (u.deco) u.deco.position.y = e * 2.9
        if (u.pin) u.pin.position.y = e * 1.9
      }
    }

    const api: AntesisViewerApi = {
      setScene(s) {
        root?.dispose(); for (const m of base) m.dispose(); base = []; units = []; core = null
        root = new TransformNode('flor', scene)
        const meshes: Record<string, Mesh> = {}
        for (const p of s.parts) {
          const flat = p.key.startsWith('engranaje') || p.key.startsWith('pasador')
          const m = toBabylon(p.key, p, scene, flat); m.material = mat(p.key); base.push(m); meshes[p.key] = m
        }
        if (meshes.nucleo) { const c = meshes.nucleo.createInstance('nucleo-0'); c.parent = root; core = c }
        const mk = (f: Frame, cls: 'A' | 'B', i: number) => {
          const fr = new TransformNode(`marco-${cls}${i}`, scene); fr.parent = root; fr.rotationQuaternion = frameQuat(f)
          const sp = new TransformNode(`giro-${cls}${i}`, scene); sp.parent = fr
          const k = cls === 'A' ? 'a' : 'b'
          const u: Unit = { spin: sp, cls }
          if (meshes[`engranaje-${k}`]) { u.gear = meshes[`engranaje-${k}`].createInstance(`e${cls}${i}`); u.gear.parent = sp }
          if (meshes[`deco-${k}`]) { u.deco = meshes[`deco-${k}`].createInstance(`d${cls}${i}`); u.deco.parent = sp }
          if (meshes[`pasador-${k}`]) { u.pin = meshes[`pasador-${k}`].createInstance(`p${cls}${i}`); u.pin.parent = fr }
          units.push(u)
        }
        s.framesA.forEach((f, i) => mk(f, 'A', i)); s.framesB.forEach((f, i) => mk(f, 'B', i))
        ratio = s.NA / s.NB; step = s.explodeStep; bounds = s.bounds
        applyColors(); layout()
        for (const k of hidden) api.setVisible(k, false)
      },
      setColors(c) { colors = { ...colors, ...c }; applyColors() },
      setSpin(v) { spin = v },
      setExplode(e) { explodeT = e },
      setVisible(k, on) {
        if (on) hidden.delete(k); else hidden.add(k)
        for (const u of units) {
          const kk = u.cls === 'A' ? 'a' : 'b'
          if (u.gear && k === `engranaje-${kk}`) u.gear.isVisible = on
          if (u.deco && k === `deco-${kk}`) u.deco.isVisible = on
          if (u.pin && k === `pasador-${kk}`) u.pin.isVisible = on
        }
        if (core && k === 'nucleo') core.isVisible = on
      },
      nudge(rad) { angle += rad },
      zoom(f) { userZoom = Math.min(4, Math.max(0.25, userZoom * f)); if (!follow) zoomBy(cam, f) },
      resetView() { userZoom = 1; follow = true },
      setReel(on) {
        reel = on; follow = true; userZoom = 1; frameScale = 1; frameUp = 0
        if (cam.autoRotationBehavior) cam.autoRotationBehavior.idleRotationSpeed = on ? 0 : 0.12
        // en pantalla completa vertical, nítido (hasta 2× la densidad de la pantalla)
        engine.setHardwareScalingLevel(on ? 1 / Math.min(2, window.devicePixelRatio || 1) : 1)
        engine.resize()
      },
      setOrbit(v) { orbit = v },
      setBeta(b) { betaT = b },
      setFraming(sc, up) { frameScale = sc; frameUp = up },
    }
    apiRef.current = api
    readyRef.current(api)
    scene.onPointerObservable.add((pi) => { if (pi.type === 1) follow = false })

    let last = performance.now()
    scene.onBeforeRenderObservable.add(() => {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now
      angle += spin * dt
      // A gira α; B gira −α·NA/NB (los dos vistos desde afuera, sobre su propio eje)
      for (const u of units) u.spin.rotation.y = u.cls === 'A' ? -angle : angle * ratio
      if (Math.abs(explode - explodeT) > 1e-4) { explode += (explodeT - explode) * Math.min(1, dt * 5); layout() }
      if (reel) {
        cam.alpha += orbit * dt
        cam.beta += (betaT - cam.beta) * Math.min(1, dt * 1.2)
      }
      if (follow) {
        const asp = Math.min(1, engine.getAspectRatio(cam))
        const want = (frameScale * (bounds + explode * step * 3) * 1.18) / Math.tan(cam.fov / 2) / asp
        cam.radius += (want * userZoom - cam.radius) * Math.min(1, dt * 2)
        // subir el objeto en pantalla: bajar el punto que mira la cámara
        const ty = -frameUp * cam.radius * Math.tan(cam.fov / 2)
        cam.target.y += (ty - cam.target.y) * Math.min(1, dt * 2)
      }
      canvas.dataset.angle = angle.toFixed(3)
    })
    engine.runRenderLoop(() => scene.render())
    const ro = new ResizeObserver(() => engine.resize())
    ro.observe(canvas as unknown as Element)
    return () => { apiRef.current = null; readyRef.current(null); ro.disconnect(); engine.stopRenderLoop(); scene.dispose(); engine.dispose() }
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none', outline: 'none' }} />
      <ZoomControls onZoom={(f) => apiRef.current?.zoom(f)} onReset={() => apiRef.current?.resetView()} />
    </div>
  )
}
