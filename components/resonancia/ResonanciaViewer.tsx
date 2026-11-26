'use client'

import { useEffect, useRef } from 'react'
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, Color3, Color4, StandardMaterial, Mesh, VertexData,
  ShaderMaterial, Effect, MeshBuilder, FresnelParameters, GlowLayer, PointerEventTypes, VertexBuffer,
} from '@babylonjs/core'
import { tuneOrbitCamera, zoomBy } from '@/components/viewer/orbit'
import ZoomControls from '@/components/viewer/ZoomControls'

export type ResMode = 'arena' | 'placa' | 'columna'
export type ResViewerApi = {
  setField(G: number, re: Float32Array): void
  setSand(x: Float32Array, y: Float32Array): void
  setDrive(x: number, y: number): void
  setPiece(kind: 'placa' | 'columna', positions: Float32Array, indices: Uint32Array, palette: 'color' | 'resina'): void
  clearPiece(): void
  setMode(m: ResMode): void
  setVibration(on: boolean): void
  zoom(f: number): void
  reset(): void
  setAutoRotate(speed: number): void
  setFraming(scale: number, up: number): void
}

// Arena: puntos redondos de tamaño fijo en pantalla, opacos (granos, no luz)
Effect.ShadersStore['arenaVertexShader'] = `precision highp float;
attribute vec3 position; uniform mat4 viewProjection; uniform float size;
void main() { gl_Position = viewProjection * vec4(position, 1.0); gl_PointSize = size; }`
Effect.ShadersStore['arenaFragmentShader'] = `precision highp float;
uniform vec3 tint; uniform float alpha;
void main() { vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; float l = 0.82 + 0.18 * (1.0 - r); gl_FragColor = vec4(tint * l, alpha); }`

const V = 97 // vértices por lado de la placa en pantalla

export default function ResonanciaViewer({ onReady }: { onReady: (api: ResViewerApi | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const apiRef = useRef<ResViewerApi | null>(null)
  const readyRef = useRef(onReady); readyRef.current = onReady

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true })
    const scene = new Scene(engine)
    scene.clearColor = new Color4(0.008, 0.01, 0.018, 1)
    const cam = new ArcRotateCamera('cam', -Math.PI / 2, 0.62, 4, Vector3.Zero(), scene)
    tuneOrbitCamera(cam, { min: 0.6, max: 30 }, 60)
    cam.minZ = 0.01
    cam.attachControl(canvas, true)
    cam.useAutoRotationBehavior = true
    if (cam.autoRotationBehavior) { cam.autoRotationBehavior.idleRotationSpeed = 0; cam.autoRotationBehavior.idleRotationWaitTime = 2500 }
    const hemi = new HemisphericLight('h', new Vector3(0, 1, 0), scene); hemi.intensity = 0.6; hemi.groundColor = new Color3(0.06, 0.05, 0.09)
    const key = new DirectionalLight('k', new Vector3(-0.5, -1, -0.35), scene); key.intensity = 1.0
    const rim = new DirectionalLight('r', new Vector3(0.6, 0.2, 0.9), scene); rim.intensity = 0.5
    const glow = new GlowLayer('glow', scene, { mainTextureSamples: 2 }); glow.intensity = 0.9

    // ---- placa: superficie que vibra + canto ----
    const plate = new Mesh('placa', scene)
    const pPos = new Float32Array(V * V * 3), pCol = new Float32Array(V * V * 4), pIdx: number[] = []
    for (let j = 0; j < V; j++) for (let i = 0; i < V; i++) { const o = j * V + i; pPos.set([-1 + (2 * i) / (V - 1), 0, -1 + (2 * j) / (V - 1)], 3 * o); pCol.set([0.16, 0.18, 0.22, 1], 4 * o) }
    for (let j = 0; j < V - 1; j++) for (let i = 0; i < V - 1; i++) { const a = j * V + i; pIdx.push(a, a + V, a + 1, a + 1, a + V, a + V + 1) }
    const pvd = new VertexData(); pvd.positions = pPos; pvd.indices = pIdx; pvd.colors = pCol
    const pNrm = new Float32Array(pPos.length); VertexData.ComputeNormals(pPos, pIdx, pNrm); pvd.normals = pNrm
    pvd.applyToMesh(plate, true)
    const pMat = new StandardMaterial('pm', scene); pMat.diffuseColor = Color3.White(); pMat.specularColor = new Color3(0.5, 0.5, 0.55); pMat.specularPower = 90; pMat.backFaceCulling = false
    plate.material = pMat
    glow.addExcludedMesh(plate)
    const edge = MeshBuilder.CreateBox('canto', { width: 2.004, height: 0.03, depth: 2.004 }, scene); edge.position.y = -0.0165
    const eMat = new StandardMaterial('em', scene); eMat.diffuseColor = new Color3(0.1, 0.11, 0.14); eMat.specularColor = new Color3(0.3, 0.3, 0.35); edge.material = eMat
    glow.addExcludedMesh(edge)
    // varilla del parlante bajo el punto de empuje, y un anillo de luz donde toca
    const rod = MeshBuilder.CreateCylinder('varilla', { height: 0.7, diameter: 0.07 }, scene); rod.position.y = -0.38
    const rMat = new StandardMaterial('rdm', scene); rMat.diffuseColor = new Color3(0.08, 0.09, 0.11); rod.material = rMat
    const spk = MeshBuilder.CreateCylinder('parlante', { height: 0.14, diameterTop: 0.5, diameterBottom: 0.62, tessellation: 48 }, scene); spk.position.y = -0.78; spk.material = rMat
    const dot = MeshBuilder.CreateTorus('empuje', { diameter: 0.11, thickness: 0.012, tessellation: 48 }, scene); dot.position.y = 0.006
    const dMat = new StandardMaterial('dm', scene); dMat.emissiveColor = new Color3(0.35, 0.9, 1); dMat.disableLighting = true; dot.material = dMat

    // ---- arena ----
    const sand = new Mesh('arena', scene); sand.alwaysSelectAsActiveMesh = true
    const sMat = new ShaderMaterial('arena', scene, { vertex: 'arena', fragment: 'arena' }, { attributes: ['position'], uniforms: ['viewProjection', 'size', 'tint', 'alpha'], needAlphaBlending: true })
    sMat.pointsCloud = true; sMat.backFaceCulling = false
    sMat.setColor3('tint', new Color3(1, 0.95, 0.84)); sMat.setFloat('alpha', 0.92)
    sand.material = sMat; glow.addExcludedMesh(sand)
    let sandN = 0, sandBuf = new Float32Array(0)

    // ---- pieza ----
    let piece: Mesh | null = null, pieceKind: 'placa' | 'columna' = 'placa', pieceH = 0.1
    const mat = new StandardMaterial('pieza', scene)
    mat.diffuseColor = Color3.White(); mat.specularColor = new Color3(0.4, 0.4, 0.45); mat.specularPower = 70
    mat.emissiveFresnelParameters = new FresnelParameters(); mat.emissiveFresnelParameters.bias = 0.2; mat.emissiveFresnelParameters.power = 2.5
    mat.emissiveFresnelParameters.leftColor = new Color3(0.45, 0.8, 1); mat.emissiveFresnelParameters.rightColor = Color3.Black()
    mat.backFaceCulling = false; mat.twoSidedLighting = true; mat.alpha = 0

    // ---- estado ----
    let field: Float32Array | null = null, FG = 0, vib = false, vibA = 0, mode: ResMode = 'arena', pieceFade = 0, plateFade = 1
    let follow = true, userZoom = 1, frameScale = 1, frameUp = 0, phase = 0
    const tgt = new Vector3()

    const sampleField = (x: number, y: number) => {
      if (!field) return 0
      const s = (FG - 1) / 2, gx = (x + 1) * s, gy = (y + 1) * s, ix = Math.min(FG - 2, Math.floor(gx)), iy = Math.min(FG - 2, Math.floor(gy)), fx = gx - ix, fy = gy - iy, o = iy * FG + ix
      return (field[o] * (1 - fx) + field[o + 1] * fx) * (1 - fy) + (field[o + FG] * (1 - fx) + field[o + FG + 1] * fx) * fy
    }
    const fieldV = new Float32Array(V * V)
    const refreshPlate = () => {
      for (let j = 0; j < V; j++) for (let i = 0; i < V; i++) fieldV[j * V + i] = sampleField(-1 + (2 * i) / (V - 1), -1 + (2 * j) / (V - 1))
    }

    const api: ResViewerApi = {
      setField(G, re) { field = re; FG = G; refreshPlate() },
      setSand(x, y) {
        const n = x.length
        if (n !== sandN) { sandBuf = new Float32Array(n * 3); const vd = new VertexData(); vd.positions = sandBuf; vd.indices = Uint32Array.from({ length: n }, (_, i) => i); vd.applyToMesh(sand, true); sandN = n }
        for (let i = 0; i < n; i++) { sandBuf[3 * i] = x[i]; sandBuf[3 * i + 1] = 0.006; sandBuf[3 * i + 2] = y[i] }
        sand.updateVerticesData(VertexBuffer.PositionKind, sandBuf)
      },
      setDrive(x, y) { dot.position.x = x; dot.position.z = y; rod.position.x = x; rod.position.z = y; spk.position.x = x; spk.position.z = y },
      setPiece(kind, P, I, palette) {
        piece?.dispose(); piece = null; pieceKind = kind
        const n = P.length / 3, Q = new Float32Array(P.length), col = new Float32Array(n * 4)
        let mx = 0, hz = 0; for (let i = 0; i < n; i++) { mx = Math.max(mx, Math.abs(P[3 * i]), Math.abs(P[3 * i + 1])); hz = Math.max(hz, P[3 * i + 2]) }
        const s = 1 / Math.max(1e-6, mx) // el lado de la pieza ocupa el de la placa
        pieceH = hz * s
        for (let i = 0; i < n; i++) {
          Q[3 * i] = P[3 * i] * s; Q[3 * i + 1] = P[3 * i + 2] * s; Q[3 * i + 2] = P[3 * i + 1] * s
          const u = hz > 0 ? P[3 * i + 2] / hz : 0
          const c = palette === 'resina' ? [0.88, 0.88, 0.9] : kind === 'placa' ? (u > 0.62 ? [1, 0.93, 0.8] : [0.2, 0.24, 0.3]) : [0.37 + 0.63 * u, 0.89 - 0.58 * u, 1 - 0.36 * u]
          col.set([c[0], c[1], c[2], 1], 4 * i)
        }
        const idx = new Uint32Array(I.length); for (let i = 0; i < I.length; i += 3) { idx[i] = I[i]; idx[i + 1] = I[i + 2]; idx[i + 2] = I[i + 1] }
        const nrm = new Float32Array(Q.length); VertexData.ComputeNormals(Q, idx, nrm)
        piece = new Mesh('pieza', scene)
        const vd = new VertexData(); vd.positions = Q; vd.indices = idx; vd.normals = nrm; vd.colors = col; vd.applyToMesh(piece)
        piece.material = mat; glow.addExcludedMesh(piece)
        mat.emissiveFresnelParameters!.leftColor = palette === 'resina' ? new Color3(0.2, 0.2, 0.24) : new Color3(0.45, 0.8, 1)
        follow = true
      },
      clearPiece() { piece?.dispose(); piece = null },
      setMode(m) {
        mode = m; follow = true
        if (cam.autoRotationBehavior) cam.autoRotationBehavior.idleRotationSpeed = m === 'arena' ? 0 : m === 'placa' ? 0.25 : 0.35
      },
      setVibration(on) { vib = on },
      zoom(f) { userZoom = Math.min(4, Math.max(0.25, userZoom * f)); if (!follow) zoomBy(cam, f) },
      reset() { userZoom = 1; follow = true; cam.alpha = -Math.PI / 2 },
      setAutoRotate(speed) { if (cam.autoRotationBehavior) { cam.autoRotationBehavior.idleRotationSpeed = speed; cam.autoRotationBehavior.idleRotationWaitTime = speed > 0.2 ? 0 : 2500 } },
      setFraming(sc, up) { frameScale = sc; frameUp = up },
    }
    apiRef.current = api
    readyRef.current(api)
    scene.onPointerObservable.add((pi) => { if (pi.type === PointerEventTypes.POINTERDOWN) follow = false })

    let last = performance.now()
    scene.onBeforeRenderObservable.add(() => {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now
      const ease = (c: number, t: number, k: number) => c + (t - c) * Math.min(1, dt * k)
      const showPiece = mode !== 'arena' && !!piece
      pieceFade = ease(pieceFade, showPiece ? 1 : 0, 2.4); plateFade = ease(plateFade, showPiece ? 0 : 1, 2.4)
      mat.alpha = Math.min(1, pieceFade * 1.05); if (piece) piece.isVisible = pieceFade > 0.01
      const plateOn = plateFade > 0.02
      plate.isVisible = edge.isVisible = rod.isVisible = spk.isVisible = dot.isVisible = sand.isVisible = plateOn
      sMat.setFloat('alpha', 0.92 * plateFade); sMat.setFloat('size', Math.max(1.3, (2.0 * Math.min(engine.getRenderHeight(), engine.getRenderWidth() * 1.3)) / 820))
      // placa: brillo de la vibración (cian en fase, magenta en contrafase) y un leve temblor
      vibA = ease(vibA, vib ? 1 : 0.0, 3)
      phase += dt * 2 * Math.PI * 1.6
      if (plateOn && field) {
        const c = Math.cos(phase)
        for (let o = 0; o < V * V; o++) {
          const w = fieldV[o], a = Math.min(1, Math.abs(w) * 1.7) * vibA
          pPos[3 * o + 1] = 0.022 * w * c * (0.35 + 0.65 * vibA)
          const base = [0.16, 0.18, 0.22], hot = w > 0 ? [0.25, 0.85, 1] : [1, 0.3, 0.62]
          pCol[4 * o] = base[0] + (hot[0] - base[0]) * a; pCol[4 * o + 1] = base[1] + (hot[1] - base[1]) * a; pCol[4 * o + 2] = base[2] + (hot[2] - base[2]) * a
        }
        plate.updateVerticesData(VertexBuffer.PositionKind, pPos); plate.updateVerticesData(VertexBuffer.ColorKind, pCol)
      }
      if (follow) {
        const asp = Math.min(1, engine.getAspectRatio(cam))
        const betaT = mode === 'columna' ? 0.98 : mode === 'placa' ? 0.78 : 0.62
        cam.beta += (betaT - cam.beta) * Math.min(1, dt * 2)
        const H = mode === 'columna' && piece ? pieceH : 0.05
        const vert = Math.cos(cam.beta) * 1.42 + (H / 2) * Math.sin(cam.beta) + (mode === 'arena' ? 0.1 : 0.05)
        const want = (frameScale * (mode === 'columna' ? 1.2 : 1.08) * Math.max(vert, 1.42 / asp)) / Math.tan(cam.fov / 2)
        cam.radius += (want * userZoom - cam.radius) * Math.min(1, dt * 1.6)
        const halfVis = cam.radius * Math.tan(cam.fov / 2)
        tgt.set(0, H / 2 - frameUp * halfVis, 0)
        cam.target.addInPlace(tgt.subtract(cam.target).scale(Math.min(1, dt * 2)))
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
      <ZoomControls onZoom={(f) => apiRef.current?.zoom(f)} onReset={() => apiRef.current?.reset()} />
    </div>
  )
}
