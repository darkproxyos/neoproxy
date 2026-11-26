'use client'

import { useEffect, useRef } from 'react'
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, Color3, Color4, StandardMaterial, Mesh, VertexData,
  ShaderMaterial, Effect, Constants, MeshBuilder, FresnelParameters, GlowLayer, PointerEventTypes,
} from '@babylonjs/core'
import { tuneOrbitCamera, zoomBy } from '@/components/viewer/orbit'
import ZoomControls from '@/components/viewer/ZoomControls'
import type { Lines } from '@/lib/trenza/worker'

export type TrenzaMode = 'danza' | 'trenza' | 'pieza' | 'caos'
export type SolidView = { positions: Float32Array; indices: Uint32Array; strand: Uint8Array; world: { scale: number; hOffset: number } }
export type TrenzaViewerApi = {
  setLines(L: Lines, tScale: number): void
  setGhost(L: Lines | null): void
  setSolid(s: SolidView | null, palette: 'trenza' | 'resina'): void
  setMode(m: TrenzaMode): void
  setHead(t: number): void
  setRate(simPerSecond: number): void
  setPlaying(on: boolean): void
  zoom(f: number): void
  reset(): void
  setAutoRotate(speed: number): void
  // margen extra y cuánto subir el objeto en el cuadro (fracción de la mitad visible): el reel deja lugar a los textos
  setFraming(scale: number, up: number): void
}
export const STRAND_COLORS: [number, number, number][] = [[0.37, 0.89, 1], [1, 0.31, 0.64], [1, 0.78, 0.35]]
const GHOST: [number, number, number] = [1, 0.22, 0.16]

// Cada punto lleva (x, y, t). El sombreador decide su altura (t · tScale · lift: el tiempo
// se levanta como eje vertical), si ya existe (t ≤ cabezal) y cuánto brilla según su edad.
// En la danza el cabezal da vueltas al período y la estela cruza el cierre sin cortarse.
Effect.ShadersStore['trenzaVertexShader'] = `precision highp float;
attribute vec3 position; attribute vec4 color;
uniform mat4 viewProjection; uniform float head, lift, tScale, tail, wrap, pointSize;
varying vec4 vColor;
void main() {
  float t = position.z; float age = head - t;
  if (wrap > 0.0) age = mod(age + wrap, wrap);
  if (age < 0.0 || (tail > 0.0 && age > tail)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vColor = vec4(0.0); return; }
  vec3 w = vec3(position.x, lift * t * tScale, position.y);
  gl_Position = viewProjection * vec4(w, 1.0);
  float a = tail > 0.0 ? 1.0 - age / tail : 1.0;
  float hot = exp(-age * 6.0);
  gl_PointSize = max(1.5, pointSize * (1.0 + 1.2 * hot) / gl_Position.w);
  vColor = vec4(mix(color.rgb, vec3(1.0), 0.35 * hot), min(1.0, color.a * (1.0 + 1.5 * hot)) * a * a);
}`
Effect.ShadersStore['trenzaFragmentShader'] = `precision highp float;
varying vec4 vColor; uniform float fade;
void main() { vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; float a = (1.0 - r) * vColor.a * fade; gl_FragColor = vec4(vColor.rgb * a, a); }`

export default function TrenzaViewer({ onReady, onTick }: { onReady: (api: TrenzaViewerApi | null) => void; onTick?: (head: number, span: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const apiRef = useRef<TrenzaViewerApi | null>(null)
  const readyRef = useRef(onReady); readyRef.current = onReady
  const tickRef = useRef(onTick); tickRef.current = onTick

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true })
    const scene = new Scene(engine)
    scene.clearColor = new Color4(0.006, 0.008, 0.016, 1)
    const cam = new ArcRotateCamera('cam', -Math.PI / 2, 0.2, 8, Vector3.Zero(), scene)
    tuneOrbitCamera(cam, { min: 0.8, max: 80 }, 40)
    cam.minZ = 0.02
    cam.attachControl(canvas, true)
    cam.useAutoRotationBehavior = true
    if (cam.autoRotationBehavior) { cam.autoRotationBehavior.idleRotationSpeed = 0.1; cam.autoRotationBehavior.idleRotationWaitTime = 2500 }
    const hemi = new HemisphericLight('h', new Vector3(0, 1, 0), scene); hemi.intensity = 0.55; hemi.groundColor = new Color3(0.07, 0.05, 0.1)
    const key = new DirectionalLight('k', new Vector3(-0.4, -1, -0.5), scene); key.intensity = 0.95
    const rim = new DirectionalLight('r', new Vector3(0.7, 0.25, 0.8), scene); rim.intensity = 0.55
    const glow = new GlowLayer('glow', scene, { mainTextureSamples: 2 }); glow.intensity = 1.1

    // ---- líneas de mundo (principal y fantasma) ----
    const mkCloud = (name: string) => {
      const m = new Mesh(name, scene); m.alwaysSelectAsActiveMesh = true
      const sm = new ShaderMaterial(name, scene, { vertex: 'trenza', fragment: 'trenza' }, { attributes: ['position', 'color'], uniforms: ['viewProjection', 'head', 'lift', 'tScale', 'tail', 'wrap', 'pointSize', 'fade'], needAlphaBlending: true })
      sm.pointsCloud = true; sm.alphaMode = Constants.ALPHA_ADD; sm.disableDepthWrite = true; sm.backFaceCulling = false
      m.material = sm; m.isVisible = false
      return { m, sm }
    }
    const main = mkCloud('lineas'), ghost = mkCloud('fantasma')
    glow.addExcludedMesh(main.m); glow.addExcludedMesh(ghost.m)
    const fill = (c: ReturnType<typeof mkCloud>, L: Lines, colorOf: (b: number) => [number, number, number], alpha: number) => {
      let n = 0; for (const p of L.pts) n += p.length / 3
      const P = new Float32Array(n * 3), C = new Float32Array(n * 4); let o = 0
      L.pts.forEach((p, b) => { const col = colorOf(b); P.set(p, o * 3); for (let i = 0; i < p.length / 3; i++) { C[4 * (o + i)] = col[0]; C[4 * (o + i) + 1] = col[1]; C[4 * (o + i) + 2] = col[2]; C[4 * (o + i) + 3] = alpha } o += p.length / 3 })
      const vd = new VertexData(); vd.positions = P; vd.colors = C; vd.indices = Uint32Array.from({ length: n }, (_, i) => i)
      vd.applyToMesh(c.m, false); c.m.isVisible = true
    }

    // ---- cuerpos ----
    const bodies = STRAND_COLORS.map((c, i) => {
      const s = MeshBuilder.CreateSphere(`cuerpo${i}`, { diameter: 1, segments: 16 }, scene)
      const m = new StandardMaterial(`cm${i}`, scene); m.emissiveColor = new Color3(...c).scale(1.25); m.diffuseColor = Color3.Black(); m.disableLighting = true
      s.material = m; s.isVisible = false
      return s
    })
    // plano del presente: un disco tenue que sube con el tiempo
    const now = MeshBuilder.CreateDisc('presente', { radius: 1, tessellation: 96 }, scene)
    now.rotation.x = Math.PI / 2
    const nowMat = new StandardMaterial('pm', scene); nowMat.emissiveColor = new Color3(0.35, 0.75, 1); nowMat.disableLighting = true; nowMat.alpha = 0; nowMat.backFaceCulling = false
    now.material = nowMat
    const ring = MeshBuilder.CreateTorus('anillo', { diameter: 2, thickness: 0.012, tessellation: 128 }, scene)
    const ringMat = new StandardMaterial('rm', scene); ringMat.emissiveColor = new Color3(0.55, 0.9, 1); ringMat.disableLighting = true; ringMat.alpha = 0
    ring.material = ringMat
    glow.addExcludedMesh(now) // el disco solo insinúa el plano; brilla el anillo

    // ---- sólido ----
    let solid: Mesh | null = null
    const mat = new StandardMaterial('solido', scene)
    mat.diffuseColor = Color3.White(); mat.specularColor = new Color3(0.4, 0.4, 0.45); mat.specularPower = 70
    mat.emissiveFresnelParameters = new FresnelParameters(); mat.emissiveFresnelParameters.bias = 0.22; mat.emissiveFresnelParameters.power = 2.4
    mat.emissiveFresnelParameters.leftColor = new Color3(0.5, 0.8, 1); mat.emissiveFresnelParameters.rightColor = Color3.Black()
    mat.backFaceCulling = false; mat.twoSidedLighting = true; mat.alpha = 0

    // ---- estado ----
    let L: Lines | null = null, G: Lines | null = null, tScale = 1
    let head = 0, rate = 1, playing = true, mode: TrenzaMode = 'danza'
    let lift = 0, liftT = 0, tail = 0, tailT = 0, lineFade = 1, lineFadeT = 1, solidFade = 0, nowA = 0
    let follow = true, userZoom = 1, frameScale = 1, frameUp = 0
    const span = () => (L ? L.T * L.periods : 1)
    const ext = () => (L ? L.extent : 1.2)

    const applyMode = () => {
      const T = L ? L.T : 1
      liftT = mode === 'danza' ? 0 : 1
      tailT = mode === 'danza' ? 0.4 * T : Infinity // en la trenza se ve toda la historia
      if (mode === 'danza') tail = tailT
      lineFadeT = mode === 'pieza' ? (solid ? 0.12 : 1) : 1
      follow = true
      if (cam.autoRotationBehavior) cam.autoRotationBehavior.idleRotationSpeed = mode === 'danza' ? 0.05 : mode === 'pieza' ? 0.35 : 0.14
    }

    const api: TrenzaViewerApi = {
      setLines(l, ts) {
        L = l; tScale = ts
        fill(main, l, (b) => STRAND_COLORS[b], 0.42)
        const r = Math.max(0.03, l.extent * 0.045)
        bodies.forEach((b) => { b.scaling.setAll(r * 2); b.isVisible = true })
        now.scaling.setAll(l.extent * 1.2); ring.scaling.setAll(l.extent * 1.2)
        head = 0; applyMode()
      },
      setGhost(g) {
        G = g
        if (!g) { ghost.m.isVisible = false; return }
        fill(ghost, g, () => GHOST, 0.5)
      },
      setSolid(s, palette) {
        solid?.dispose(); solid = null
        if (s) {
          const n = s.positions.length / 3, P = new Float32Array(s.positions.length), col = new Float32Array(n * 4)
          const { scale, hOffset } = s.world
          for (let i = 0; i < n; i++) {
            P[3 * i] = s.positions[3 * i] * scale; P[3 * i + 1] = s.positions[3 * i + 2] * scale + hOffset; P[3 * i + 2] = s.positions[3 * i + 1] * scale
            const st = s.strand[i], c = palette === 'resina' ? [0.86, 0.87, 0.9] : st < 3 ? STRAND_COLORS[st] : [0.16, 0.19, 0.26]
            col[4 * i] = c[0]; col[4 * i + 1] = c[1]; col[4 * i + 2] = c[2]; col[4 * i + 3] = 1
          }
          const idx = new Uint32Array(s.indices.length)
          for (let i = 0; i < idx.length; i += 3) { idx[i] = s.indices[i]; idx[i + 1] = s.indices[i + 2]; idx[i + 2] = s.indices[i + 1] }
          const nrm = new Float32Array(P.length); VertexData.ComputeNormals(P, idx, nrm)
          solid = new Mesh('solido', scene)
          const vd = new VertexData(); vd.positions = P; vd.indices = idx; vd.normals = nrm; vd.colors = col; vd.applyToMesh(solid)
          solid.material = mat
          mat.emissiveFresnelParameters!.leftColor = palette === 'resina' ? new Color3(0.22, 0.22, 0.26) : new Color3(0.5, 0.8, 1)
          glow.addExcludedMesh(solid)
        }
        applyMode()
      },
      setMode(m) { mode = m; applyMode() },
      setHead(t) { head = t },
      setRate(r) { rate = r },
      setPlaying(on) { playing = on },
      zoom(f) { userZoom = Math.min(4, Math.max(0.2, userZoom * f)); if (!follow) zoomBy(cam, f) },
      reset() { userZoom = 1; follow = true },
      setFraming(sc, up) { frameScale = sc; frameUp = up },
      setAutoRotate(speed) { if (cam.autoRotationBehavior) { cam.autoRotationBehavior.idleRotationSpeed = speed; cam.autoRotationBehavior.idleRotationWaitTime = speed > 0.2 ? 0 : 2500 } },
    }
    apiRef.current = api
    readyRef.current(api)

    // si la persona arrastra, la cámara deja de seguir hasta el próximo cambio de modo
    scene.onPointerObservable.add((pi) => { if (pi.type === PointerEventTypes.POINTERDOWN) follow = false })

    let last = performance.now(), tickAcc = 0
    const tmpT = new Vector3()
    scene.onBeforeRenderObservable.add(() => {
      const nowMs = performance.now(), dt = Math.min(0.1, (nowMs - last) / 1000); last = nowMs
      const S = span()
      if (playing && L) {
        head += dt * rate
        if (mode === 'danza') { if (head > S) head -= L.T * Math.floor(head / L.T) }
        else head = Math.min(head, S)
      }
      const ease = (cur: number, to: number, k: number) => cur + (to - cur) * Math.min(1, dt * k)
      lift = ease(lift, liftT, 1.4)
      // al pasar a la trenza la estela se alarga (no aparece de golpe toda la historia)
      if (tailT === Infinity) tail = Math.min(2 * S, tail + dt * 1.5 * (L ? L.T : 1))
      lineFade = ease(lineFade, lineFadeT, 2.5)
      solidFade = ease(solidFade, solid && mode === 'pieza' ? 1 : 0, 2.2)
      mat.alpha = Math.min(1, solidFade * 1.05); if (solid) solid.isVisible = solidFade > 0.01
      const showLines = mode !== 'pieza' || solidFade < 0.98 || !solid
      for (const c of [main, ghost]) {
        c.sm.setFloat('head', head); c.sm.setFloat('lift', lift); c.sm.setFloat('tScale', tScale)
        c.sm.setFloat('tail', tail < S ? tail : 0); c.sm.setFloat('wrap', mode === 'danza' && L ? L.T : 0)
        c.sm.setFloat('pointSize', (13 * engine.getRenderHeight()) / 720); c.sm.setFloat('fade', lineFade)
      }
      main.m.isVisible = !!L && showLines; ghost.m.isVisible = !!G && mode === 'caos'
      // cuerpos en el cabezal (tabla uniforme en el tiempo)
      if (L) {
        const u = Math.max(0, Math.min(1, head / S)) * (L.tableN - 1), k = Math.min(L.tableN - 2, Math.floor(u)), f = u - k
        const h = lift * head * tScale
        bodies.forEach((b, i) => {
          b.position.set(L!.table[6 * k + 2 * i] * (1 - f) + L!.table[6 * (k + 1) + 2 * i] * f, h, L!.table[6 * k + 2 * i + 1] * (1 - f) + L!.table[6 * (k + 1) + 2 * i + 1] * f)
          b.isVisible = mode !== 'pieza' || solidFade < 0.5
        })
        now.position.y = h; ring.position.y = h
        nowA = ease(nowA, mode === 'trenza' || mode === 'caos' ? 1 : 0, 2)
        nowMat.alpha = 0.05 * nowA * lift; ringMat.alpha = 0.55 * nowA * lift
        now.isVisible = ring.isVisible = nowMat.alpha > 0.002
      }
      // cámara: desde arriba en la danza, de costado en la trenza
      if (follow && L) {
        const asp = Math.min(1, engine.getAspectRatio(cam))
        // se encuadra la trenza completa desde el comienzo: crece dentro de un cuadro quieto
        const shownH = S * tScale * lift
        const halfVis = cam.radius * Math.tan(cam.fov / 2)
        tmpT.set(0, shownH / 2 - frameUp * halfVis, 0)
        cam.target.addInPlace(tmpT.subtract(cam.target).scale(Math.min(1, dt * 1.6)))
        const betaT = 0.12 + (1.28 - 0.12) * lift
        cam.beta += (betaT - cam.beta) * Math.min(1, dt * 1.8)
        // mitad visible necesaria en vertical y en horizontal (la cámara gira: el ancho es el radio)
        const vert = Math.max(ext() * Math.cos(cam.beta) + (shownH / 2) * Math.sin(cam.beta), ext() * Math.sin(Math.max(0.12, Math.PI / 2 - cam.beta))) + (mode === 'pieza' ? 0.22 * ext() : 0.06 * ext())
        const want = (frameScale * 1.12 * Math.max(vert, (ext() * 1.12) / asp)) / Math.tan(cam.fov / 2)
        cam.radius += (want * userZoom - cam.radius) * Math.min(1, dt * 1.4)
      }
      canvas.dataset.camRadius = cam.radius.toFixed(2)
      tickAcc += dt; if (tickAcc > 0.1) { tickAcc = 0; tickRef.current?.(head, S) }
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
