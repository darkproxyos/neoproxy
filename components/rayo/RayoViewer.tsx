'use client'

import { useEffect, useRef } from 'react'
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, Color3, Color4, StandardMaterial, Mesh, VertexData,
  ShaderMaterial, Effect, Constants, MeshBuilder, FresnelParameters, GlowLayer, PointerEventTypes, TransformNode,
} from '@babylonjs/core'
import { tuneOrbitCamera, zoomBy } from '@/components/viewer/orbit'
import ZoomControls from '@/components/viewer/ZoomControls'

export type RayoMode = 'descarga' | 'pieza'
export type RayoViewerApi = {
  reset(nx: number, ny: number, nz: number): void
  addSites(from: number, xyz: Int16Array, parent: Int32Array): void
  finish(main: Int32Array, size: Int32Array): void
  setReveal(n: number): void
  flash(): void
  setSolid(P: Float32Array | null, I: Uint32Array | null, palette: 'rayo' | 'resina'): void
  setMode(m: RayoMode): void
  zoom(f: number): void
  resetView(): void
  setAutoRotate(speed: number): void
  setFraming(scale: number, up: number): void
}

const CELL = 1 / 24 // una celda de la simulación en unidades de pantalla
const PER_SEG = 4 // puntos por tramo

// Cada punto lleva su orden de llegada y su peso (1 en el canal principal). Los que aún no
// llegaron no se dibujan; las puntas recién llegadas arden blancas; tras el impacto, el
// canal principal queda encendido y el resto se apaga.
Effect.ShadersStore['rayoVertexShader'] = `precision highp float;
attribute vec3 position; attribute vec2 info;
uniform mat4 worldViewProjection; uniform float reveal, decay, flash, pointSize;
varying vec4 vColor;
void main() {
  float ord = info.x, w = info.y;
  if (ord > reveal) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vColor = vec4(0.0); return; }
  gl_Position = worldViewProjection * vec4(position, 1.0);
  float age = reveal - ord;
  float tip = exp(-age / 18.0);
  float mainC = step(0.99, w);
  float b = (0.32 + 0.68 * w) * (1.0 - decay) + decay * (mainC * 1.55 + (1.0 - mainC) * 0.3 * (0.35 + w));
  b = b + tip * 1.2 + flash * (0.6 + 1.2 * w);
  vec3 cold = vec3(0.45, 0.5, 1.0), hot = vec3(0.92, 0.95, 1.0);
  vec3 c = mix(cold, hot, clamp(0.25 + 0.75 * w + tip + mainC * decay, 0.0, 1.0));
  gl_PointSize = max(1.5, pointSize * (0.55 + 1.1 * w + 0.8 * tip + 0.6 * mainC * decay) / gl_Position.w);
  vColor = vec4(c * b, clamp(b, 0.0, 1.0));
}`
Effect.ShadersStore['rayoFragmentShader'] = `precision highp float;
varying vec4 vColor; uniform float fade;
void main() { vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; float a = (1.0 - r) * (1.0 - r) * fade; gl_FragColor = vec4(vColor.rgb * a, vColor.a * a); }`

export default function RayoViewer({ onReady }: { onReady: (api: RayoViewerApi | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const apiRef = useRef<RayoViewerApi | null>(null)
  const readyRef = useRef(onReady); readyRef.current = onReady

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true })
    const scene = new Scene(engine)
    const bg = new Color4(0.008, 0.01, 0.022, 1)
    scene.clearColor = bg.clone()
    const cam = new ArcRotateCamera('cam', -Math.PI / 2, 1.38, 8, new Vector3(0, 2, 0), scene)
    tuneOrbitCamera(cam, { min: 1, max: 40 }, 40)
    cam.minZ = 0.02
    cam.attachControl(canvas, true)
    cam.useAutoRotationBehavior = true
    if (cam.autoRotationBehavior) { cam.autoRotationBehavior.idleRotationSpeed = 0.08; cam.autoRotationBehavior.idleRotationWaitTime = 2500 }
    const hemi = new HemisphericLight('h', new Vector3(0, 1, 0), scene); hemi.intensity = 0.55; hemi.groundColor = new Color3(0.06, 0.05, 0.1)
    const key = new DirectionalLight('k', new Vector3(-0.4, -1, -0.5), scene); key.intensity = 0.95
    const rimL = new DirectionalLight('r', new Vector3(0.6, 0.25, 0.9), scene); rimL.intensity = 0.55
    const glow = new GlowLayer('glow', scene, { mainTextureSamples: 2 }); glow.intensity = 0.8

    // el escenario: nube arriba, suelo abajo (y las dos se van al pasar a la pieza)
    let H = 4, W = 2.67
    const rig = new TransformNode('rig', scene)
    const cloud = MeshBuilder.CreateDisc('nube', { radius: 1, tessellation: 96 }, scene); cloud.rotation.x = Math.PI / 2
    const cMat = new StandardMaterial('cm', scene); cMat.emissiveColor = new Color3(0.16, 0.2, 0.45); cMat.disableLighting = true; cMat.alpha = 0.22; cMat.backFaceCulling = false; cloud.material = cMat
    const ground = MeshBuilder.CreateDisc('suelo', { radius: 1, tessellation: 96 }, scene); ground.rotation.x = Math.PI / 2
    const gMat = new StandardMaterial('gm', scene); gMat.diffuseColor = new Color3(0.05, 0.06, 0.09); gMat.specularColor = Color3.Black(); gMat.backFaceCulling = false; ground.material = gMat
    glow.addExcludedMesh(ground)

    // la descarga
    const bolt = new Mesh('rayo', scene); bolt.parent = rig; bolt.alwaysSelectAsActiveMesh = true
    const bMat = new ShaderMaterial('rayo', scene, { vertex: 'rayo', fragment: 'rayo' }, { attributes: ['position', 'info'], uniforms: ['worldViewProjection', 'reveal', 'decay', 'flash', 'pointSize', 'fade'], needAlphaBlending: true })
    bMat.pointsCloud = true; bMat.alphaMode = Constants.ALPHA_ADD; bMat.disableDepthWrite = true; bMat.backFaceCulling = false
    bolt.material = bMat; glow.addExcludedMesh(bolt)
    let nx = 64, ny = 64, nz = 96, cap = 0
    let pos = new Float32Array(0), info = new Float32Array(0), siteXYZ = new Float32Array(0), count = 0
    const ensure = (n: number) => {
      if (n <= cap) return
      cap = Math.max(n, cap * 2, 2048)
      const p2 = new Float32Array(cap * PER_SEG * 3), i2 = new Float32Array(cap * PER_SEG * 2), s2 = new Float32Array(cap * 3)
      p2.set(pos); i2.set(info); s2.set(siteXYZ); pos = p2; info = i2; siteXYZ = s2
      // puntos sin usar: orden infinito (no se dibujan)
      for (let k = count * PER_SEG; k < cap * PER_SEG; k++) info[2 * k] = 1e9
      upload(true)
    }
    const upload = (full: boolean) => {
      if (full) {
        const vd = new VertexData(); vd.positions = pos; vd.indices = Uint32Array.from({ length: cap * PER_SEG }, (_, i) => i); vd.applyToMesh(bolt, true)
        bolt.setVerticesData('info', info, true, 2)
      } else { bolt.updateVerticesData('position', pos); bolt.updateVerticesData('info', info) }
    }
    let reveal = 0, decay = 0, decayT = 0, flashV = 0, dirty = false

    // la pieza
    let solid: Mesh | null = null
    const mat = new StandardMaterial('pieza', scene)
    mat.diffuseColor = Color3.White(); mat.specularColor = new Color3(0.45, 0.45, 0.5); mat.specularPower = 80
    mat.emissiveFresnelParameters = new FresnelParameters(); mat.emissiveFresnelParameters.bias = 0.25; mat.emissiveFresnelParameters.power = 2.2
    mat.emissiveFresnelParameters.leftColor = new Color3(0.55, 0.6, 1); mat.emissiveFresnelParameters.rightColor = Color3.Black()
    mat.backFaceCulling = false; mat.twoSidedLighting = true; mat.alpha = 0
    let mode: RayoMode = 'descarga', flip = 1, solidFade = 0, stageFade = 1
    let follow = true, userZoom = 1, frameScale = 1, frameUp = 0

    const layoutStage = () => {
      W = Math.max(nx, ny) * CELL; H = (nz - 1) * CELL
      cloud.scaling.setAll(W * 0.75); cloud.position.y = H + 0.01
      ground.scaling.setAll(W * 0.75); ground.position.y = -0.01
      rig.position.y = H / 2 // pivote al centro, para dar vuelta la escena
    }

    const api: RayoViewerApi = {
      reset(a, b, c) {
        nx = a; ny = b; nz = c; count = 0; reveal = 0; decay = 0; decayT = 0
        for (let k = 0; k < cap * PER_SEG; k++) info[2 * k] = 1e9
        if (cap) upload(false)
        layoutStage()
      },
      addSites(from, xyz, parent) {
        const n = xyz.length / 3
        ensure(from + n)
        for (let k = 0; k < n; k++) {
          const s = from + k, x = (xyz[3 * k] - (nx - 1) / 2) * CELL, y = xyz[3 * k + 2] * CELL - H / 2, z = (xyz[3 * k + 1] - (ny - 1) / 2) * CELL
          siteXYZ[3 * s] = x; siteXYZ[3 * s + 1] = y; siteXYZ[3 * s + 2] = z
          const p = parent[k], px = p >= 0 ? siteXYZ[3 * p] : x, py = p >= 0 ? siteXYZ[3 * p + 1] : y, pz = p >= 0 ? siteXYZ[3 * p + 2] : z
          for (let q = 0; q < PER_SEG; q++) {
            const t = q / PER_SEG, o = s * PER_SEG + q
            pos[3 * o] = x + (px - x) * t; pos[3 * o + 1] = y + (py - y) * t; pos[3 * o + 2] = z + (pz - z) * t
            info[2 * o] = s; info[2 * o + 1] = 0.35
          }
        }
        count = Math.max(count, from + n); dirty = true
      },
      finish(main, size) {
        let mx = 1; for (let k = 0; k < count; k++) mx = Math.max(mx, size[k])
        const onMain = new Uint8Array(count); for (const k of main) onMain[k] = 1
        for (let s = 0; s < count; s++) { const w = onMain[s] ? 1 : Math.min(0.95, Math.cbrt(size[s] / mx) * 1.4); for (let q = 0; q < PER_SEG; q++) info[2 * (s * PER_SEG + q) + 1] = w }
        dirty = true
      },
      setReveal(n) { reveal = n },
      flash() { flashV = 1; decayT = 1 },
      setSolid(P, I, palette) {
        solid?.dispose(); solid = null
        if (!P || !I) return
        // la pieza en el mismo lugar que la descarga: altura de la descarga + base, raíz abajo
        let zMax = 0, n = P.length / 3; for (let i = 0; i < n; i++) zMax = Math.max(zMax, P[3 * i + 2])
        let top = -Infinity, bottom = Infinity; for (let s = 0; s < count; s++) { top = Math.max(top, siteXYZ[3 * s + 1]); bottom = Math.min(bottom, siteXYZ[3 * s + 1]) }
        const worldH = top - bottom + 3.5 * CELL, sc = worldH / Math.max(1e-6, zMax), y0 = bottom - 2.7 * CELL
        const Q = new Float32Array(P.length), col = new Float32Array(n * 4)
        for (let i = 0; i < n; i++) {
          Q[3 * i] = P[3 * i] * sc; Q[3 * i + 1] = P[3 * i + 2] * sc + y0; Q[3 * i + 2] = P[3 * i + 1] * sc
          const u = P[3 * i + 2] / zMax
          const c = palette === 'resina' ? [0.88, 0.88, 0.92] : [0.5 + 0.45 * u, 0.55 + 0.4 * u, 1]
          col.set([c[0], c[1], c[2], 1], 4 * i)
        }
        const idx = new Uint32Array(I.length); for (let i = 0; i < I.length; i += 3) { idx[i] = I[i]; idx[i + 1] = I[i + 2]; idx[i + 2] = I[i + 1] }
        const nrm = new Float32Array(Q.length); VertexData.ComputeNormals(Q, idx, nrm)
        solid = new Mesh('pieza', scene); solid.parent = rig
        const vd = new VertexData(); vd.positions = Q; vd.indices = idx; vd.normals = nrm; vd.colors = col; vd.applyToMesh(solid)
        solid.material = mat; glow.addExcludedMesh(solid)
        mat.emissiveFresnelParameters!.leftColor = palette === 'resina' ? new Color3(0.22, 0.22, 0.28) : new Color3(0.55, 0.6, 1)
      },
      setMode(m) {
        mode = m; follow = true
        if (cam.autoRotationBehavior) cam.autoRotationBehavior.idleRotationSpeed = m === 'pieza' ? 0.4 : 0.08
      },
      zoom(f) { userZoom = Math.min(4, Math.max(0.25, userZoom * f)); if (!follow) zoomBy(cam, f) },
      resetView() { userZoom = 1; follow = true },
      setAutoRotate(speed) { if (cam.autoRotationBehavior) { cam.autoRotationBehavior.idleRotationSpeed = speed; cam.autoRotationBehavior.idleRotationWaitTime = speed > 0.2 ? 0 : 2500 } },
      setFraming(sc, up) { frameScale = sc; frameUp = up },
    }
    layoutStage()
    apiRef.current = api
    readyRef.current(api)
    scene.onPointerObservable.add((pi) => { if (pi.type === PointerEventTypes.POINTERDOWN) follow = false })

    let last = performance.now(), tFlick = 0
    scene.onBeforeRenderObservable.add(() => {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now
      const ease = (c: number, t: number, k: number) => c + (t - c) * Math.min(1, dt * k)
      if (dirty) { upload(false); dirty = false }
      // relámpago: el cielo se ilumina y se apaga; después el canal principal queda solo
      flashV = Math.max(0, flashV - dt * 3.2)
      decay = ease(decay, decayT, 1.6)
      tFlick += dt
      const growing = mode === 'descarga' && decayT === 0 && count > 0
      const flick = growing ? 0.25 + 0.2 * Math.abs(Math.sin(tFlick * 23) * Math.sin(tFlick * 7.3)) : 0.2
      cMat.emissiveColor.set(0.12 + 0.5 * flashV + 0.15 * flick, 0.15 + 0.55 * flashV + 0.15 * flick, 0.38 + 0.6 * flashV + 0.2 * flick)
      scene.clearColor.set(bg.r + 0.35 * flashV, bg.g + 0.38 * flashV, bg.b + 0.55 * flashV, 1)
      glow.intensity = 0.8 + 1.6 * flashV
      // dar vuelta: la descarga baja de la nube; la pieza, al revés, se para sobre su base
      flip = ease(flip, mode === 'pieza' ? 0 : 1, 1.8)
      rig.rotation.x = Math.PI * flip
      stageFade = ease(stageFade, mode === 'pieza' ? 0 : 1, 2)
      cMat.alpha = (0.18 + 0.5 * flashV) * stageFade; cloud.isVisible = stageFade > 0.02; ground.isVisible = stageFade > 0.02
      solidFade = ease(solidFade, solid && mode === 'pieza' ? 1 : 0, 1.6)
      mat.alpha = Math.min(1, solidFade * 1.05); if (solid) solid.isVisible = solidFade > 0.01
      bMat.setFloat('reveal', reveal); bMat.setFloat('decay', decay); bMat.setFloat('flash', flashV)
      bMat.setFloat('pointSize', (16 * engine.getRenderHeight()) / 720); bMat.setFloat('fade', Math.max(0.05, 1 - 0.95 * solidFade))
      bolt.isVisible = count > 0 && solidFade < 0.99
      if (follow) {
        const asp = Math.min(1, engine.getAspectRatio(cam))
        cam.beta += ((mode === 'pieza' ? 1.25 : 1.42) - cam.beta) * Math.min(1, dt * 1.6)
        const vert = (H / 2) * Math.sin(cam.beta) + (W / 2) * Math.abs(Math.cos(cam.beta)) + 0.1
        const want = (frameScale * 1.08 * Math.max(vert, (W * 0.62) / asp)) / Math.tan(cam.fov / 2)
        cam.radius += (want * userZoom - cam.radius) * Math.min(1, dt * 1.5)
        const halfVis = cam.radius * Math.tan(cam.fov / 2)
        cam.target.y += (H / 2 - frameUp * halfVis - cam.target.y) * Math.min(1, dt * 2)
      }
      canvas.dataset.camRadius = cam.radius.toFixed(2)
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
