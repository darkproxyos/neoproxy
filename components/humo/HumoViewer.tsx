'use client'

import { useEffect, useRef } from 'react'
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, Color3, Color4, StandardMaterial, Mesh, VertexData,
  VertexBuffer, ShaderMaterial, Effect, Constants, MeshBuilder, LinesMesh, FresnelParameters,
} from '@babylonjs/core'
import { tuneOrbitCamera, zoomBy } from '@/components/viewer/orbit'
import ZoomControls from '@/components/viewer/ZoomControls'

export type HumoViewerApi = {
  setParticles(pos: Float32Array, colors: Float32Array | null): void // colores solo cuando cambian (al iniciar)
  setCores(cores: Float32Array, counts: Int32Array): void
  setSolid(sim: { positions: Float32Array; indices: Uint32Array; mix: Float32Array } | null, palette: 'humo' | 'resina'): void
  setShowCores(on: boolean): void
  setSmokeVisible(on: boolean): void
  zoom(f: number): void
  reset(): void
  setAutoRotate(speed: number): void
}

// La simulación usa z como eje de avance; Babylon, y hacia arriba: (x, y, z) → (x, z, y)
Effect.ShadersStore['humoVertexShader'] = `precision highp float;
attribute vec3 position; attribute vec4 color; uniform mat4 worldViewProjection; uniform float pointSize; varying vec4 vColor;
void main() { gl_Position = worldViewProjection * vec4(position, 1.0); gl_PointSize = max(1.5, pointSize / gl_Position.w); vColor = color; }`
Effect.ShadersStore['humoFragmentShader'] = `precision highp float;
varying vec4 vColor; uniform float fade;
void main() { vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; float a = (1.0 - r) * (1.0 - r) * vColor.a * fade; gl_FragColor = vec4(vColor.rgb * a, a); }`

export default function HumoViewer({ onReady }: { onReady: (api: HumoViewerApi | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const apiRef = useRef<HumoViewerApi | null>(null)
  const readyRef = useRef(onReady); readyRef.current = onReady

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true })
    const scene = new Scene(engine)
    scene.clearColor = new Color4(0.008, 0.01, 0.02, 1)
    const cam = new ArcRotateCamera('cam', -Math.PI / 2.6, Math.PI / 2.3, 9, Vector3.Zero(), scene)
    tuneOrbitCamera(cam, { min: 1.5, max: 60 }, 40)
    cam.minZ = 0.05
    cam.attachControl(canvas, true)
    cam.useAutoRotationBehavior = true
    if (cam.autoRotationBehavior) { cam.autoRotationBehavior.idleRotationSpeed = 0.12; cam.autoRotationBehavior.idleRotationWaitTime = 2500 }
    const home = { alpha: cam.alpha, beta: cam.beta }
    const hemi = new HemisphericLight('h', new Vector3(0, 1, 0), scene); hemi.intensity = 0.55; hemi.groundColor = new Color3(0.08, 0.06, 0.12)
    const key = new DirectionalLight('k', new Vector3(-0.4, -1, -0.5), scene); key.intensity = 0.9
    const rim = new DirectionalLight('r', new Vector3(0.7, 0.2, 0.8), scene); rim.intensity = 0.5

    // humo
    const smoke = new Mesh('humo', scene)
    smoke.alwaysSelectAsActiveMesh = true
    const smat = new ShaderMaterial('humo', scene, { vertex: 'humo', fragment: 'humo' }, { attributes: ['position', 'color'], uniforms: ['worldViewProjection', 'pointSize', 'fade'], needAlphaBlending: true })
    smat.pointsCloud = true; smat.alphaMode = Constants.ALPHA_ADD; smat.disableDepthWrite = true; smat.backFaceCulling = false
    smat.setFloat('fade', 1)
    smoke.material = smat
    let nPts = 0
    // núcleos
    let cores: LinesMesh | null = null, showCores = true
    // sólido
    let solid: Mesh | null = null
    const mat = new StandardMaterial('solido', scene)
    mat.diffuseColor = Color3.White(); mat.specularColor = new Color3(0.35, 0.35, 0.4); mat.specularPower = 60
    mat.emissiveFresnelParameters = new FresnelParameters(); mat.emissiveFresnelParameters.bias = 0.25; mat.emissiveFresnelParameters.power = 2.2
    mat.emissiveFresnelParameters.leftColor = new Color3(0.55, 0.85, 1); mat.emissiveFresnelParameters.rightColor = Color3.Black()
    mat.backFaceCulling = false; mat.twoSidedLighting = true
    let smokeFade = 1, smokeTarget = 1, solidFade = 0
    const target = new Vector3(0, 0, 0), want = new Vector3(0, 0, 0)
    // encuadre: extensión horizontal (radial alrededor del eje vertical, porque la cámara gira)
    // y vertical por separado, para que en una pantalla vertical (reel) quepa a lo ancho
    let wantH = 3, wantV = 3, wantK = 2.4, follow = true, userZoom = 1

    const api: HumoViewerApi = {
      setParticles(pos, colors) {
        const n = pos.length / 3, P = new Float32Array(pos.length)
        let cx = 0, cy = 0, cz = 0
        for (let i = 0; i < n; i++) { P[3 * i] = pos[3 * i]; P[3 * i + 1] = pos[3 * i + 2]; P[3 * i + 2] = pos[3 * i + 1]; cx += P[3 * i]; cy += P[3 * i + 1]; cz += P[3 * i + 2] }
        if (n !== nPts || colors) {
          const vd = new VertexData(); vd.positions = P; vd.indices = Uint32Array.from({ length: n }, (_, i) => i)
          vd.colors = colors ?? new Float32Array(n * 4).fill(1)
          vd.applyToMesh(smoke, true); nPts = n
        } else smoke.updateVerticesData(VertexBuffer.PositionKind, P)
        // la cámara sigue a la nube y abre el encuadre si crece
        cx /= n; cy /= n; cz /= n
        // encuadre por el percentil 92 de la distancia, no por el máximo: la estela de humo
        // que queda atrás alejaría la cámara hasta que la nube principal fuese un punto
        const dh: number[] = [], dv: number[] = []
        for (let i = 0; i < n; i += 7) { dh.push(Math.hypot(P[3 * i] - cx, P[3 * i + 2] - cz)); dv.push(Math.abs(P[3 * i + 1] - cy)) }
        const q = (a: number[]) => { a.sort((u, v) => u - v); return a.length ? a[Math.floor(0.92 * (a.length - 1))] * 1.2 : 1 }
        want.set(cx, cy, cz); wantH = q(dh); wantV = q(dv); wantK = 2.4; follow = true
      },
      setCores(c, counts) {
        const lines: Vector3[][] = []; let o = 0
        for (const n of counts) { const l: Vector3[] = []; for (let i = 0; i <= n; i++) { const j = o + 3 * (i % n); l.push(new Vector3(c[j], c[j + 2], c[j + 1])) } lines.push(l); o += 3 * n }
        cores?.dispose()
        cores = MeshBuilder.CreateLineSystem('nucleos', { lines }, scene)
        cores.color = new Color3(1, 0.95, 0.85); cores.alpha = 0.55; cores.isVisible = showCores && smokeTarget > 0
      },
      setSolid(m, palette) {
        solid?.dispose(); solid = null
        if (!m) { smokeTarget = 1; if (cores) cores.isVisible = showCores; return }
        const n = m.positions.length / 3, P = new Float32Array(m.positions.length), col = new Float32Array(n * 4)
        const A = [0.37, 0.89, 1], B = [1, 0.31, 0.64], R = [0.86, 0.87, 0.9]
        let cx = 0, cy = 0, cz = 0, eh = 0, ev = 0
        for (let i = 0; i < n; i++) {
          P[3 * i] = m.positions[3 * i]; P[3 * i + 1] = m.positions[3 * i + 2]; P[3 * i + 2] = m.positions[3 * i + 1]
          cx += P[3 * i]; cy += P[3 * i + 1]; cz += P[3 * i + 2]
          const t = m.mix[i]
          for (let k = 0; k < 3; k++) col[4 * i + k] = palette === 'resina' ? R[k] : A[k] * (1 - t) + B[k] * t
          col[4 * i + 3] = 1
        }
        cx /= n; cy /= n; cz /= n
        for (let i = 0; i < n; i += 5) { eh = Math.max(eh, Math.hypot(P[3 * i] - cx, P[3 * i + 2] - cz)); ev = Math.max(ev, Math.abs(P[3 * i + 1] - cy)) }
        const idx = new Uint32Array(m.indices.length)
        for (let i = 0; i < idx.length; i += 3) { idx[i] = m.indices[i]; idx[i + 1] = m.indices[i + 2]; idx[i + 2] = m.indices[i + 1] }
        const nrm = new Float32Array(P.length); VertexData.ComputeNormals(P, idx, nrm)
        solid = new Mesh('solido', scene)
        const vd = new VertexData(); vd.positions = P; vd.indices = idx; vd.normals = nrm; vd.colors = col; vd.applyToMesh(solid)
        solid.material = mat; mat.alpha = solidFade
        mat.emissiveFresnelParameters!.leftColor = palette === 'resina' ? new Color3(0.25, 0.25, 0.28) : new Color3(0.55, 0.85, 1)
        smokeTarget = 0; if (cores) cores.isVisible = false
        want.set(cx, cy, cz); wantH = eh; wantV = ev; wantK = 2.6; follow = true
      },
      setShowCores(on) { showCores = on; if (cores) cores.isVisible = on && smokeTarget > 0 },
      setSmokeVisible(on) { smokeTarget = on ? 1 : 0 },
      zoom(f) { userZoom = Math.min(4, Math.max(0.2, userZoom * f)); if (!follow) zoomBy(cam, f) },
      reset() { cam.alpha = home.alpha; cam.beta = home.beta; userZoom = 1; follow = true },
      setAutoRotate(speed) { if (cam.autoRotationBehavior) { cam.autoRotationBehavior.idleRotationSpeed = speed; cam.autoRotationBehavior.idleRotationWaitTime = speed > 0.2 ? 0 : 2500 } },
    }
    apiRef.current = api
    readyRef.current(api)

    let last = performance.now()
    scene.onBeforeRenderObservable.add(() => {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now
      // transición humo → sólido
      smokeFade += (smokeTarget - smokeFade) * Math.min(1, dt * 3)
      smat.setFloat('fade', smokeFade); smoke.isVisible = smokeFade > 0.01
      solidFade += ((solid ? 1 : 0) - solidFade) * Math.min(1, dt * 2.5)
      if (solid) mat.alpha = Math.min(1, solidFade * 1.05)
      const asp = Math.min(1, engine.getAspectRatio(cam))
      // en vertical la cámara se aleja para caber a lo ancho: los puntos crecen un poco para
      // que el humo no se vuelva polvo (y escalan con la altura real del lienzo)
      smat.setFloat('pointSize', (26 * engine.getRenderHeight()) / 720 * Math.pow(1 / asp, 0.6))
      if (follow) {
        target.addInPlace(want.subtract(target).scale(Math.min(1, dt * 2)))
        cam.target.copyFrom(target)
        const wantRadius = Math.max(4, wantK * Math.max(wantV, wantH / asp))
        cam.radius += (wantRadius * userZoom - cam.radius) * Math.min(1, dt * 1.2)
      }
      canvas.dataset.camRadius = cam.radius.toFixed(2)
    })
    cam.onViewMatrixChangedObservable.add(() => { /* el usuario puede orbitar; el encuadre sigue */ })
    engine.runRenderLoop(() => scene.render())
    const ro = new ResizeObserver(() => engine.resize())
    ro.observe(canvas as unknown as Element)
    return () => { apiRef.current = null; readyRef.current(null); ro.disconnect(); engine.stopRenderLoop(); scene.dispose(); engine.dispose() }
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none', outline: 'none' }} />
      <ZoomControls onZoom={(f) => apiRef.current?.zoom(f)} onReset={() => apiRef.current?.reset()} />
    </div>
  )
}
