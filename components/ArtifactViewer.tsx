'use client'

import { useEffect, useRef, useState } from 'react'

interface ArtifactViewerProps {
  modelPath: string
}

export default function ArtifactViewer({ modelPath }: ArtifactViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const init = async () => {
      try {
        // Import Babylon.js and loaders
        const B = await import('@babylonjs/core')
        const { GLTFFileLoader } = await import('@babylonjs/loaders/glTF')

        // Register GLTF loader with Draco support
        GLTFFileLoader.IncrementalLoading = false
        B.SceneLoader.RegisterPlugin(new GLTFFileLoader())

        const engine = new B.Engine(canvasRef.current, true)
        const scene = new B.Scene(engine)
        scene.clearColor = new B.Color4(0.06, 0.06, 0.06, 1) // #0a0a0a with slight alpha

        // Camera - ArcRotate for orbit controls
        const camera = new B.ArcRotateCamera(
          'camera',
          Math.PI / 4,
          Math.PI / 3,
          3,
          B.Vector3.Zero(),
          scene
        )
        camera.attachControl(canvasRef.current, true)
        camera.wheelPrecision = 50
        camera.minZ = 0.1

        // Lighting
        const ambient = new B.HemisphericLight('ambient', new B.Vector3(0, 1, 0), scene)
        ambient.intensity = 0.4
        ambient.diffuse = new B.Color3(0.8, 0.8, 0.9)

        const rimLight = new B.DirectionalLight('rim', new B.Vector3(-1, 1, -1), scene)
        rimLight.intensity = 0.6
        rimLight.diffuse = new B.Color3(0.9, 0.95, 1)

        const fillLight = new B.PointLight('fill', new B.Vector3(1, 0.5, 1), scene)
        fillLight.intensity = 0.3

        // Load model
        const result = await B.SceneLoader.ImportMeshAsync('', '', modelPath, scene)
        
        if (result.meshes.length === 0) {
          throw new Error('No meshes loaded')
        }

        // Center and scale model
        const rootMesh = result.meshes[0]
        const boundingInfo = rootMesh.getHierarchyBoundingVectors()
        const center = boundingInfo.min.add(boundingInfo.max).scale(0.5)
        const size = boundingInfo.max.subtract(boundingInfo.min)
        const maxDimension = Math.max(size.x, size.y, size.z)
        const scale = 2 / maxDimension
        
        rootMesh.scaling = new B.Vector3(scale, scale, scale)
        rootMesh.position = center.negate()

        // Enable shadows
        const shadowGenerator = new B.ShadowGenerator(1024, rimLight)
        result.meshes.forEach(mesh => {
          if (mesh.name !== '__root__') {
            shadowGenerator.addShadowCaster(mesh)
            mesh.receiveShadows = true
          }
        })

        // Auto-rotation when idle
        let isInteracting = false
        let autoRotate = true
        
        scene.onBeforeRenderObservable.add(() => {
          if (autoRotate && !isInteracting) {
            rootMesh.rotation.y += 0.003
          }
        })

        // Detect user interaction
        camera.onViewMatrixChangedObservable.add(() => {
          isInteracting = true
          setTimeout(() => { isInteracting = false }, 2000)
        })

        setLoading(false)
        engine.runRenderLoop(() => scene.render())
        window.addEventListener('resize', () => engine.resize())

        return () => {
          engine.dispose()
          window.removeEventListener('resize', () => engine.resize())
        }
      } catch (err) {
        console.error('Error loading model:', err)
        setError('Failed to load artifact')
        setLoading(false)
      }
    }

    init()
  }, [modelPath])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: '"JetBrains Mono", "Space Mono", monospace',
          fontSize: 12,
          color: '#71717a'
        }}>
          {'> LOADING ARTIFACT...'}
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: '"JetBrains Mono", "Space Mono", monospace',
          fontSize: 12,
          color: '#ef4444'
        }}>
          {error}
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  )
}
