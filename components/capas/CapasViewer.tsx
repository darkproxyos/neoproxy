'use client'

import { useEffect, useRef } from 'react'
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, Color3, Color4, StandardMaterial, Mesh,
  VertexData, VertexBuffer, MeshBuilder, Plane, RawTexture, Texture, InstancedMesh,
} from '@babylonjs/core'
import { rampColor, type Rgb } from '@/lib/capas/style'
import { tuneOrbitCamera, zoomBy } from '@/components/viewer/orbit'
import ZoomControls from '@/components/viewer/ZoomControls'
import type { LawId } from '@/lib/capas/laws'
import type { EventKind } from '@/lib/capas/events'

export type ViewerMesh = {
  positions: Float32Array; indices: Uint32Array; times: Float32Array
  planned: number                      // capas de la pieza completa
  sliceOfZ: { k: number; s0: number }  // capa = z_mm · k + s0
  fullHeightMm: number                 // altura de la pieza completa (para encuadrar)
  boxMm: number                        // lado del mundo cuadrado
}
export type ViewerEvent = { kind: EventKind; slice: number; x: number; y: number }
export type ViewerApi = {
  setMesh(m: ViewerMesh | null, law: LawId): void
  setCut(slice: number | null): void
  setSlice(rgba: Uint8Array | null, w: number, h: number): void
  setEvents(ev: ViewerEvent[]): void
  setMarkers(on: boolean): void
  setPalette(p: 'tiempo' | 'resina'): void
  zoom(factor: number): void
  reset(): void
  snapshot(): string | null
}

const KIND_COLOR: Record<EventKind, Color3> = {
  birth: new Color3(1, 0.25, 0.35), split: new Color3(0.3, 0.9, 1), merge: new Color3(1, 0.8, 0.25), death: new Color3(0.75, 0.8, 0.9),
}
const BAND_MM = 0.7

export default function CapasViewer({ onReady }: { onReady: (api: ViewerApi | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const apiRef = useRef<ViewerApi | null>(null)
  const readyRef = useRef(onReady)
  readyRef.current = onReady

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true })
    const scene = new Scene(engine)
    scene.clearColor = new Color4(0.012, 0.02, 0.035, 1)
    scene.setRenderingAutoClearDepthStencil(1, true) // los marcadores de eventos se ven a través del sólido

    const cam = new ArcRotateCamera('cam', -Math.PI / 3, Math.PI / 2.55, 130, new Vector3(0, 25, 0), scene)
    tuneOrbitCamera(cam, { min: 30, max: 320 }, 5)
    cam.minZ = 1; cam.maxZ = 2000
    const home = { alpha: -Math.PI / 3, beta: Math.PI / 2.55, radius: 130, targetY: 25 } // encuadre al que vuelve ⟲
    cam.attachControl(canvas, true)
    cam.useAutoRotationBehavior = true
    if (cam.autoRotationBehavior) { cam.autoRotationBehavior.idleRotationSpeed = 0.28; cam.autoRotationBehavior.idleRotationWaitTime = 2200 }

    const hemi = new HemisphericLight('h', new Vector3(0, 1, 0), scene); hemi.intensity = 0.7; hemi.groundColor = new Color3(0.1, 0.12, 0.2)
    const key = new DirectionalLight('k', new Vector3(-0.5, -1, -0.4), scene); key.intensity = 0.85
    const rim = new DirectionalLight('r', new Vector3(0.6, -0.25, 0.8), scene); rim.intensity = 0.4

    const bed = MeshBuilder.CreateDisc('bed', { radius: 42, tessellation: 72 }, scene)
    bed.rotation.x = Math.PI / 2; bed.position.y = -0.15
    const bedMat = new StandardMaterial('bedm', scene); bedMat.diffuseColor = new Color3(0.035, 0.055, 0.09); bedMat.specularColor = Color3.Black(); bedMat.alpha = 0.92
    bed.material = bedMat
    const ring = MeshBuilder.CreateTorus('ring', { diameter: 84, thickness: 0.25, tessellation: 96 }, scene)
    ring.position.y = -0.1
    const ringMat = new StandardMaterial('ringm', scene); ringMat.emissiveColor = new Color3(0.18, 0.5, 0.65); ringMat.disableLighting = true; ring.material = ringMat

    const mat = new StandardMaterial('body', scene)
    mat.diffuseColor = Color3.White(); mat.specularColor = new Color3(0.3, 0.3, 0.32); mat.specularPower = 40
    mat.emissiveColor = new Color3(0.05, 0.05, 0.06); mat.backFaceCulling = false; mat.twoSidedLighting = true
    const bandMat = new StandardMaterial('band', scene)
    bandMat.diffuseColor = Color3.Black(); bandMat.specularColor = Color3.Black(); bandMat.emissiveColor = new Color3(1, 0.97, 0.9)
    bandMat.disableLighting = true; bandMat.backFaceCulling = false; bandMat.zOffset = -3

    const sliceMat = new StandardMaterial('slice', scene)
    sliceMat.disableLighting = true; sliceMat.backFaceCulling = false; sliceMat.specularColor = Color3.Black(); sliceMat.zOffset = -6
    const slicePlane = MeshBuilder.CreatePlane('slice', { size: 1, sideOrientation: Mesh.DOUBLESIDE }, scene)
    slicePlane.rotation.x = Math.PI / 2
    slicePlane.material = sliceMat; slicePlane.isVisible = false
    let sliceTex: RawTexture | null = null, sliceW = 0, sliceH = 0

    const markerTpl: Record<EventKind, Mesh> = {} as Record<EventKind, Mesh>
    for (const k of Object.keys(KIND_COLOR) as EventKind[]) {
      const m = MeshBuilder.CreateSphere(`tpl-${k}`, { diameter: 1, segments: 8 }, scene)
      const mm = new StandardMaterial(`mk-${k}`, scene); mm.emissiveColor = KIND_COLOR[k]; mm.disableLighting = true; mm.alpha = 0.92
      m.material = mm; m.isVisible = false; m.renderingGroupId = 1
      markerTpl[k] = m
    }

    let body: Mesh | null = null, band: Mesh | null = null
    let info: ViewerMesh | null = null
    let cut: number | null = null
    let markers: { inst: InstancedMesh; slice: number }[] = []
    let eventsRaw: ViewerEvent[] = []
    let markersOn = true
    let palette: 'tiempo' | 'resina' = 'tiempo'
    let lastMesh: ViewerMesh | null = null, lastLaw: LawId = 'coral'
    let fitted = false, lastH = 0

    const yOf = (slice: number) => (info ? (slice - info.sliceOfZ.s0) / info.sliceOfZ.k : 0)
    const applyCut = () => {
      const hi = info && cut !== null && cut < info.planned - 1 ? yOf(cut) : 1e5
      const pl = new Plane(0, 1, 0, -hi), lo = new Plane(0, -1, 0, hi - BAND_MM)
      mat.clipPlane = pl; bandMat.clipPlane = pl; bandMat.clipPlane2 = lo
      if (band) band.isVisible = cut !== null && !!info && cut < info.planned - 1 + 1e-6
      slicePlane.position.y = (hi > 1e4 ? (info ? yOf(info.planned - 1) : 0) : hi) + 0.06
      for (const m of markers) m.inst.setEnabled(markersOn && (cut === null || m.slice <= cut + 0.5))
    }
    const rebuildMarkers = () => {
      for (const m of markers) m.inst.dispose()
      markers = []
      if (!info) return
      const top = eventsRaw.slice(0, 90)
      for (const e of top) {
        const inst = markerTpl[e.kind].createInstance(`e${markers.length}`)
        inst.position.set((e.x - 0.5) * info.boxMm, yOf(e.slice), (e.y - 0.5) * info.boxMm)
        const s = e.kind === 'death' ? 0.9 : 1.3
        inst.scaling.setAll(s); inst.renderingGroupId = 1
        markers.push({ inst, slice: e.slice })
      }
      applyCut()
    }

    const api: ViewerApi = {
      setMesh(m, law) {
        const prev = body, prevBand = band
        info = m; lastMesh = m; lastLaw = law
        if (!m) { body = null; band = null; prev?.dispose(); prevBand?.dispose(); slicePlane.isVisible = false; applyCut(); return }
        const n = m.positions.length / 3
        const pos = new Float32Array(m.positions.length), col = new Float32Array(n * 4), tmp: Rgb = [0, 0, 0]
        for (let i = 0; i < n; i++) {
          pos[i * 3] = m.positions[i * 3]; pos[i * 3 + 1] = m.positions[i * 3 + 2]; pos[i * 3 + 2] = m.positions[i * 3 + 1]
          if (palette === 'resina') { tmp[0] = 206; tmp[1] = 209; tmp[2] = 214 } else rampColor(law, m.times[i] / Math.max(1, m.planned - 1), tmp)
          col[i * 4] = tmp[0] / 255; col[i * 4 + 1] = tmp[1] / 255; col[i * 4 + 2] = tmp[2] / 255; col[i * 4 + 3] = 1
        }
        const idx = new Uint32Array(m.indices.length)
        for (let i = 0; i < idx.length; i += 3) { idx[i] = m.indices[i]; idx[i + 1] = m.indices[i + 2]; idx[i + 2] = m.indices[i + 1] }
        const nrm = new Float32Array(pos.length)
        VertexData.ComputeNormals(pos, idx, nrm)
        const mesh = new Mesh('capas', scene)
        const vd = new VertexData(); vd.positions = pos; vd.indices = idx; vd.normals = nrm; vd.colors = col
        vd.applyToMesh(mesh)
        mesh.material = mat
        const bandMesh = mesh.clone('capas-band')
        bandMesh.material = bandMat
        body = mesh; band = bandMesh
        prev?.dispose(); prevBand?.dispose()
        slicePlane.scaling.set(m.boxMm, m.boxMm, 1)
        if (!fitted || Math.abs(m.fullHeightMm - lastH) / Math.max(1, lastH) > 0.04) {
          cam.target.y = m.fullHeightMm * 0.45
          const needed = Math.max(m.fullHeightMm, m.boxMm) * 1.75 + 14
          if (!fitted || needed > cam.radius * 1.12) cam.radius = needed // que la pieza completa siempre quepa
          fitted = true; lastH = m.fullHeightMm
          home.radius = cam.radius; home.targetY = cam.target.y
        }
        rebuildMarkers()
        applyCut()
      },
      setCut(s) { cut = s; applyCut() },
      setSlice(data, w, h) {
        if (!data) { slicePlane.isVisible = false; return }
        if (!sliceTex || sliceW !== w || sliceH !== h) {
          sliceTex?.dispose()
          sliceTex = RawTexture.CreateRGBATexture(data, w, h, scene, false, false, Texture.BILINEAR_SAMPLINGMODE)
          sliceTex.hasAlpha = true; sliceTex.wrapU = Texture.CLAMP_ADDRESSMODE; sliceTex.wrapV = Texture.CLAMP_ADDRESSMODE
          sliceW = w; sliceH = h
          sliceMat.diffuseTexture = sliceTex; sliceMat.emissiveTexture = sliceTex; sliceMat.opacityTexture = null
          sliceMat.useAlphaFromDiffuseTexture = true
        } else sliceTex.update(data)
        slicePlane.isVisible = !!info
      },
      setEvents(ev) { eventsRaw = ev; rebuildMarkers() },
      setMarkers(on) { markersOn = on; applyCut() },
      setPalette(p) {
        palette = p
        mat.specularColor = p === 'resina' ? new Color3(0.55, 0.55, 0.6) : new Color3(0.3, 0.3, 0.32)
        mat.specularPower = p === 'resina' ? 70 : 40
        if (lastMesh) api.setMesh(lastMesh, lastLaw) // recolorea la malla que ya está
      },
      zoom(factor) { zoomBy(cam, factor) },
      reset() { cam.alpha = home.alpha; cam.beta = home.beta; cam.radius = home.radius; cam.target.set(0, home.targetY, 0) },
      snapshot() { try { return canvas.toDataURL('image/png') } catch { return null } },
    }
    apiRef.current = api
    readyRef.current(api)

    const t0 = performance.now()
    scene.onBeforeRenderObservable.add(() => {
      const k = 0.78 + 0.22 * Math.sin((performance.now() - t0) / 260)
      bandMat.emissiveColor.set(k, k * 0.96, k * 0.9)
      canvas.dataset.camRadius = cam.radius.toFixed(2) // gancho de pruebas: el radio de la cámara
    })
    engine.runRenderLoop(() => scene.render())
    const ro = new ResizeObserver(() => engine.resize())
    ro.observe(canvas as unknown as Element) // Babylon amplía Element.requestPointerLock y rompe la compatibilidad de tipos
    return () => {
      apiRef.current = null
      readyRef.current(null)
      ro.disconnect(); engine.stopRenderLoop(); scene.dispose(); engine.dispose()
    }
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none', outline: 'none' }} />
      <ZoomControls onZoom={(f) => apiRef.current?.zoom(f)} onReset={() => apiRef.current?.reset()} />
    </div>
  )
}
