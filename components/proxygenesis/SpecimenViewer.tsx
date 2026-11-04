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
} from '@babylonjs/core'
import '@babylonjs/loaders/STL'

// Visor de un STL curado, cargado tal cual (sin reconstruir geometría —
// a diferencia del generador en vivo de /lab/proxygenesis, acá el mesh
// ya viene resuelto desde una corrida local, este componente solo lo
// muestra). Mismo patrón de ArsenalGallery.tsx (@babylonjs/core + loader
// plugin), no el babylonjs global que usa page.tsx.
export default function SpecimenViewer({ stlPath, color }: { stlPath: string; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true })
    const scene = new Scene(engine)
    scene.clearColor = Color4.FromHexString('#000205ff')

    const camera = new ArcRotateCamera('cam', Math.PI / 2.3, Math.PI / 2.4, 10, Vector3.Zero(), scene)
    camera.attachControl(canvasRef.current, true)
    camera.wheelPrecision = 30
    camera.lowerRadiusLimit = 0.5

    new HemisphericLight('hemi', new Vector3(0, 1, 0), scene).intensity = 0.6
    const dir = new DirectionalLight('dir', new Vector3(-1, -1.5, -1), scene)
    dir.intensity = 0.5

    let disposed = false
    SceneLoader.ImportMeshAsync('', '', stlPath, scene)
      .then((res) => {
        if (disposed) return
        const mat = new StandardMaterial('mat', scene)
        const c = Color3.FromHexString(color)
        mat.diffuseColor = c
        mat.emissiveColor = c.scale(0.3)
        mat.specularColor = new Color3(0.1, 0.1, 0.1)
        res.meshes.forEach((m) => { m.material = mat })

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
      engine.dispose()
    }
  }, [stlPath, color])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      {loading && !error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, fontSize: 11, letterSpacing: 2, fontFamily: "'Space Mono', monospace",
        }}>
          CARGANDO MODELO://...
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ff2d55', fontSize: 11, letterSpacing: 1, fontFamily: "'Space Mono', monospace", textAlign: 'center', padding: 24,
        }}>
          NO SE PUDO CARGAR EL MODELO
        </div>
      )}
    </div>
  )
}
