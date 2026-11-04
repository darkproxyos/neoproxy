'use client'

import { useEffect, useRef, useState } from 'react'
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
  VertexData,
  VertexBuffer,
} from '@babylonjs/core'
import '@babylonjs/loaders/STL'

const mono = "'Space Mono', monospace"
const PALETTE = ['#00d4ff', '#ff5e9e', '#00ff9d', '#ffb800', '#ffffff']
type ViewPreset = 'iso' | 'frente' | 'lateral' | 'arriba'

// Visor de un STL curado, cargado tal cual (sin reconstruir geometría —
// a diferencia del generador en vivo de /lab/proxygenesis, acá el mesh
// ya viene resuelto desde una corrida local, este componente solo lo
// muestra). Mismo patrón de ArsenalGallery.tsx (@babylonjs/core + loader
// plugin), no el babylonjs global que usa page.tsx.
export default function SpecimenViewer({ stlPath, color }: { stlPath: string; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cameraRef = useRef<ArcRotateCamera | null>(null)
  const matRef = useRef<StandardMaterial | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [view, setView] = useState<ViewPreset>('iso')
  const [wireframe, setWireframe] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)
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
        setLoading(false)
      })
      .catch(() => { if (!disposed) { setError(true); setLoading(false) } })

    engine.runRenderLoop(() => scene.render())
    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)

    return () => {
      disposed = true
      window.removeEventListener('resize', onResize)
      cameraRef.current = null
      matRef.current = null
      engine.dispose()
    }
  }, [stlPath, color])

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
}
