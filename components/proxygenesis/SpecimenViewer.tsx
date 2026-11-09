'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  Color3,
  Color4,
  StandardMaterial,
  SceneLoader,
  TransformNode,
  VertexData,
  VertexBuffer,
  type Mesh,
} from '@babylonjs/core'
import '@babylonjs/loaders/STL'
import type { CuratedMode } from './curated'

const mono = "'Space Mono', monospace"
const PALETTE = ['#00d4ff', '#ff5e9e', '#00ff9d', '#ffb800', '#ffffff']
type ViewPreset = 'iso' | 'frente' | 'lateral' | 'arriba'

// muda y retazos (y red, nunca "resuelta" — ver su propia lectura en
// especimenes.json) son procesos que la propia lectura de cada espécimen
// describe como sin forma final ("no hay una corrida que termine"). Los
// demás (arbol, coral, concha) sí llegan a una forma asentada, aunque
// algunos corten antes del límite de iteraciones. Esta distinción decide
// si el visor, una vez crecido del todo, se queda quieto o vuelve a
// encogerse y crecer — no es un adorno, viene de lo que el propio dato
// de cada espécimen ya afirma sobre sí mismo.
const NEVER_SETTLES = new Set<CuratedMode>(['muda', 'retazos', 'red'])

const GROW_MS = 4200
const HOLD_MS = 1400
const SHRINK_MS = 1100

function smoothstep(t: number) {
  const c = Math.max(0, Math.min(1, t))
  return c * c * (3 - 2 * c)
}

type GrowthPhase = 'growing' | 'holding' | 'shrinking' | 'done'

type GrowthState = {
  meshes: Mesh[]
  totals: number[]
  elapsed: number
  phase: GrowthPhase
  neverSettles: boolean
  lastPct: number
}

// Revela los meshes en el mismo orden en que sus triángulos quedaron
// escritos en el índice — y ese orden no es arbitrario: tanto el
// constructor de árbol/coral (nodos empujados al array en el orden real
// en que el algoritmo de colonización espacial los fue agregando) como el
// de concha (barrido de ángulo creciente), muda (segmento a segmento por
// índice de cadena) y retazos (fragmento a fragmento por orden de
// adherencia) hacen merge de las piezas en ese mismo orden de
// construcción — confirmado leyendo cada exportador. Truncar el índice
// prefijo a prefijo reproduce, literalmente, el orden real de
// crecimiento, no una animación inventada encima de la forma final.
function applyGrowth(state: GrowthState, progress: number) {
  const totalAll = state.totals.reduce((a, b) => a + b, 0)
  let remaining = Math.floor(totalAll * progress)
  for (let i = 0; i < state.meshes.length; i++) {
    const total = state.totals[i]
    const reveal = Math.max(0, Math.min(total, remaining))
    const sub = state.meshes[i].subMeshes?.[0]
    if (sub) sub.indexCount = reveal - (reveal % 3)
    remaining -= total
  }
}

export type AudioFrame = { rms: number; bass: number; treble: number; hex: string }
export type SpecimenViewerHandle = { pushAudioFrame: (frame: AudioFrame) => void }

// Visor de un STL curado, cargado tal cual (sin reconstruir geometría —
// a diferencia del generador en vivo de /lab/proxygenesis, acá el mesh
// ya viene resuelto desde una corrida local, este componente solo lo
// muestra). Mismo patrón de ArsenalGallery.tsx (@babylonjs/core + loader
// plugin), no el babylonjs global que usa page.tsx.
//
// El mesh llega completo pero no se muestra así de una: arranca en 0
// triángulos y se revela prefijo a prefijo del buffer de índices (ver
// applyGrowth) hasta formarse del todo — y como ese orden de índice ES el
// orden real de construcción de cada exportador, no es una animación
// inventada. Los modos sin forma final (NEVER_SETTLES) después se
// encogen y vuelven a crecer en loop; el resto se queda formado.
//
// pushAudioFrame (expuesto vía ref): si un espécimen trae audioPath, el
// reproductor de arriba llama esto en cada frame de reproducción con la
// energía real del audio (RMS + bandas graves/agudas + color de banda
// dominante). El pulso de escala y el color siguen el audio en vivo,
// frame a frame, vía un TransformNode que envuelve el mesh cargado —
// independiente del crecimiento, que actúa sobre el índice del mesh.
const SpecimenViewer = forwardRef<SpecimenViewerHandle, { stlPath: string; color: string; mode: CuratedMode }>(
  function SpecimenViewer({ stlPath, color, mode }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cameraRef = useRef<ArcRotateCamera | null>(null)
  const matRef = useRef<StandardMaterial | null>(null)
  const rootNodeRef = useRef<TransformNode | null>(null)
  const growthRef = useRef<GrowthState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [view, setView] = useState<ViewPreset>('iso')
  const [wireframe, setWireframe] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)
  const [growthPhase, setGrowthPhase] = useState<GrowthPhase>('growing')
  const [growthPct, setGrowthPct] = useState(0)
  const [activeColor, setActiveColor] = useState(color)

  // Nuevo espécimen: reseteá los controles a su estado por defecto en vez
  // de arrastrar wireframe/giro/color del anterior.
  useEffect(() => {
    setView('iso')
    setWireframe(false)
    setAutoRotate(false)
    setActiveColor(color)
  }, [stlPath, color])

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true })
    const scene = new Scene(engine)
    scene.clearColor = Color4.FromHexString('#000205ff')

    const camera = new ArcRotateCamera('cam', Math.PI / 2.3, Math.PI / 2.4, 10, Vector3.Zero(), scene)
    camera.attachControl(canvasRef.current, true)
    camera.wheelPrecision = 30
    camera.lowerRadiusLimit = 0.5
    cameraRef.current = camera

    new HemisphericLight('hemi', new Vector3(0, 1, 0), scene).intensity = 0.6
    const dir = new DirectionalLight('dir', new Vector3(-1, -1.5, -1), scene)
    dir.intensity = 0.5

    let disposed = false
    // ImportMeshAsync espera rootUrl y sceneFilename separados — pasar la
    // ruta completa como sceneFilename con rootUrl vacío rompe el loader
    // ("Wrong sceneFilename parameter"), confirmado probándolo de verdad.
    const slash = stlPath.lastIndexOf('/')
    const rootUrl = stlPath.slice(0, slash + 1)
    const filename = stlPath.slice(slash + 1)
    SceneLoader.ImportMeshAsync('', rootUrl, filename, scene)
      .then((res) => {
        if (disposed) return
        const mat = new StandardMaterial('mat', scene)
        const c = Color3.FromHexString(color)
        mat.diffuseColor = c
        mat.emissiveColor = c.scale(0.3)
        mat.specularColor = new Color3(0.1, 0.1, 0.1)
        matRef.current = mat
        res.meshes.forEach((m) => {
          m.material = mat
          // Los STL exportados por grow.ts escriben la normal de cada
          // triángulo en cero ("un visor la recalcula" — ver stl.ts). El
          // loader de Babylon las deja tal cual en vez de recalcularlas, y
          // una normal (0,0,0) rompe el shader de iluminación (sale blanco
          // lavado, confirmado probándolo). Las recomputamos acá siempre,
          // sea cual sea el STL de origen.
          const positions = m.getVerticesData(VertexBuffer.PositionKind)
          const indices = m.getIndices()
          if (positions && indices) {
            const normals: number[] = []
            VertexData.ComputeNormals(positions, indices, normals)
            m.setVerticesData(VertexBuffer.NormalKind, normals)
          }
        })

        // Encuadre automático: cada espécimen trae su propia escala (copas
        // de distinto tamaño, distinta cantidad de iteraciones) — en vez de
        // asumir un radio fijo de cámara, lo calculamos desde el bounding
        // box real del mesh recién cargado.
        let min = res.meshes[0]?.getBoundingInfo().boundingBox.minimumWorld
        let max = res.meshes[0]?.getBoundingInfo().boundingBox.maximumWorld
        for (const m of res.meshes) {
          const bb = m.getBoundingInfo().boundingBox
          min = Vector3.Minimize(min, bb.minimumWorld)
          max = Vector3.Maximize(max, bb.maximumWorld)
        }
        if (min && max) {
          const center = min.add(max).scale(0.5)
          const size = max.subtract(min).length()
          camera.target = center
          camera.radius = Math.max(1, size * 1.3)
          camera.lowerRadiusLimit = size * 0.1
          camera.upperRadiusLimit = size * 5
        }

        // Parentamos todo a un TransformNode recién después de encuadrar la
        // cámara (que lee bounding boxes en world space con escala 1) — así
        // pushAudioFrame puede pulsar la escala sin desarmar el encuadre.
        const root = new TransformNode('audioRoot', scene)
        res.meshes.forEach((m) => m.setParent(root))
        rootNodeRef.current = root

        // Arranca en 0 triángulos — el primer frame ya sale así, nunca se
        // llega a pintar la forma completa antes de que el loop de abajo
        // empiece a revelarla.
        const totals = res.meshes.map((m) => m.getTotalIndices())
        const state: GrowthState = {
          meshes: res.meshes as Mesh[],
          totals,
          elapsed: 0,
          phase: 'growing',
          neverSettles: NEVER_SETTLES.has(mode),
          lastPct: -1,
        }
        applyGrowth(state, 0)
        growthRef.current = state
        setGrowthPhase('growing')
        setGrowthPct(0)

        setLoading(false)
      })
      .catch(() => { if (!disposed) { setError(true); setLoading(false) } })

    engine.runRenderLoop(() => {
      const g = growthRef.current
      if (g && g.phase !== 'done') {
        g.elapsed += engine.getDeltaTime()
        let progress = 1
        if (g.phase === 'growing') {
          progress = smoothstep(g.elapsed / GROW_MS)
          if (g.elapsed >= GROW_MS) {
            g.phase = g.neverSettles ? 'holding' : 'done'
            g.elapsed = 0
            progress = 1
            setGrowthPhase(g.phase)
          }
        } else if (g.phase === 'holding') {
          progress = 1
          if (g.elapsed >= HOLD_MS) {
            g.phase = 'shrinking'
            g.elapsed = 0
            setGrowthPhase('shrinking')
          }
        } else if (g.phase === 'shrinking') {
          progress = 1 - smoothstep(g.elapsed / SHRINK_MS)
          if (g.elapsed >= SHRINK_MS) {
            g.phase = 'growing'
            g.elapsed = 0
            progress = 0
            setGrowthPhase('growing')
          }
        }
        applyGrowth(g, progress)
        const pct = Math.round(progress * 100)
        if (pct !== g.lastPct) { g.lastPct = pct; setGrowthPct(pct) }
      }
      scene.render()
    })
    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)

    return () => {
      disposed = true
      window.removeEventListener('resize', onResize)
      cameraRef.current = null
      matRef.current = null
      rootNodeRef.current = null
      growthRef.current = null
      engine.dispose()
    }
  }, [stlPath, color, mode])

  useImperativeHandle(ref, () => ({
    pushAudioFrame(frame: AudioFrame) {
      const root = rootNodeRef.current
      if (root) {
        const target = 1 + Math.min(0.35, frame.rms * 0.3 + frame.bass * 0.25)
        const next = root.scaling.x + (target - root.scaling.x) * 0.25
        root.scaling.set(next, next, next)
      }
      const mat = matRef.current
      if (mat) {
        const target = Color3.FromHexString(frame.hex)
        mat.diffuseColor = Color3.Lerp(mat.diffuseColor, target, 0.12)
        mat.emissiveColor = mat.diffuseColor.scale(0.3 + Math.min(0.55, frame.rms * 0.7 + frame.treble * 0.2))
      }
    },
  }), [])

  // Vista: solo rota la cámara alrededor del target ya encuadrado — no
  // toca radio ni centro, esos los decide el bounding box real del mesh.
  useEffect(() => {
    const cam = cameraRef.current
    if (!cam) return
    if (view === 'frente') { cam.alpha = Math.PI / 2; cam.beta = Math.PI / 2.2 }
    if (view === 'lateral') { cam.alpha = 0; cam.beta = Math.PI / 2.2 }
    if (view === 'arriba') { cam.alpha = Math.PI / 2; cam.beta = 0.05 }
    if (view === 'iso') { cam.alpha = Math.PI / 2.3; cam.beta = Math.PI / 2.4 }
  }, [view, loading])

  useEffect(() => {
    if (matRef.current) matRef.current.wireframe = wireframe
  }, [wireframe, loading])

  useEffect(() => {
    const cam = cameraRef.current
    if (!cam) return
    cam.useAutoRotationBehavior = autoRotate
    if (cam.autoRotationBehavior) {
      cam.autoRotationBehavior.idleRotationSpeed = 0.25
      cam.autoRotationBehavior.idleRotationWaitTime = 1500
    }
  }, [autoRotate, loading])

  useEffect(() => {
    if (!matRef.current) return
    const c = Color3.FromHexString(activeColor)
    matRef.current.diffuseColor = c
    matRef.current.emissiveColor = c.scale(0.3)
  }, [activeColor, loading])

  // Volver a crecer desde 0 a pedido — no reinicia el engine ni recarga
  // el STL, solo el estado de revelación. Sirve tanto para los que se
  // quedan formados (volver a ver el crecimiento) como para los que
  // nunca se asientan (saltar directo a otro ciclo).
  const replayGrowth = () => {
    const g = growthRef.current
    if (!g) return
    g.phase = 'growing'
    g.elapsed = 0
    g.lastPct = -1
    setGrowthPhase('growing')
  }

  const growthLabel = (() => {
    const neverSettles = growthRef.current?.neverSettles ?? false
    if (growthPhase === 'growing') return `CRECIENDO://${String(growthPct).padStart(2, '0')}%`
    if (growthPhase === 'shrinking') return 'DISOLVIÉNDOSE://'
    if (growthPhase === 'holding') return 'FORMADO — PROCESO SIN FIN'
    return neverSettles ? 'FORMADO' : 'FORMADO POR COMPLETO'
  })()

  const btnStyle = (active: boolean) => ({
    fontFamily: mono, fontSize: 8, letterSpacing: 1, padding: '5px 9px', cursor: 'pointer',
    background: active ? `${color}26` : 'rgba(0,4,10,0.7)',
    border: `1px solid ${active ? color : '#2a3a50'}`,
    color: active ? color : '#8fb8d6',
  })

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {!loading && !error && (
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', flexWrap: 'wrap', gap: 6, zIndex: 3 }}>
          {(['iso', 'frente', 'lateral', 'arriba'] as ViewPreset[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={btnStyle(view === v)}>
              {v.toUpperCase()}
            </button>
          ))}
          <button onClick={() => setWireframe(w => !w)} style={btnStyle(wireframe)}>WIREFRAME</button>
          <button onClick={() => setAutoRotate(r => !r)} style={btnStyle(autoRotate)}>GIRO AUTO</button>
          <button onClick={replayGrowth} style={btnStyle(false)} title="Volver a crecer desde 0">⟲ CRECER</button>
        </div>
      )}

      {!loading && !error && (
        <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 6, zIndex: 3 }}>
          {PALETTE.map(c => (
            <button
              key={c}
              onClick={() => setActiveColor(c)}
              title={c}
              style={{
                width: 18, height: 18, borderRadius: '50%', background: c, cursor: 'pointer', padding: 0,
                border: activeColor.toLowerCase() === c.toLowerCase() ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)',
                boxShadow: activeColor.toLowerCase() === c.toLowerCase() ? `0 0 8px ${c}` : 'none',
              }}
            />
          ))}
        </div>
      )}

      {!loading && !error && (
        <div style={{
          position: 'absolute', bottom: 12, right: 12, zIndex: 3,
          fontFamily: mono, fontSize: 8, letterSpacing: 1.5, padding: '5px 9px',
          color, background: 'rgba(0,4,10,0.7)', border: `1px solid ${color}44`,
        }}>
          {growthLabel}
        </div>
      )}

      {loading && !error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, fontSize: 11, letterSpacing: 2, fontFamily: mono,
        }}>
          CARGANDO MODELO://...
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ff2d55', fontSize: 11, letterSpacing: 1, fontFamily: mono, textAlign: 'center', padding: 24,
        }}>
          NO SE PUDO CARGAR EL MODELO
        </div>
      )}
    </div>
  )
})

export default SpecimenViewer
