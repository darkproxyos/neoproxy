'use client'

import { useEffect, useRef, useState } from 'react'

// Mock Babylon.js for SSR compatibility
const BABYLON = typeof window !== 'undefined' ? require('babylonjs') : {
  Engine: class {},
  Scene: class {},
  ArcRotateCamera: class {},
  HemisphericLight: class {},
  PointLight: class {},
  GlowLayer: class {},
  Color4: class {},
  Vector3: class {},
  MeshBuilder: class {},
  StandardMaterial: class {},
  Texture: class {},
  CreateFromHeightMap: () => {},
  AbstractMesh: class {}
};

if (typeof window !== 'undefined') {
  require('babylonjs-loaders');
}

interface Specimen {
  name: string
  path: string
  size: string
  modified: string
  tokenId?: number
  txHash?: string
}

export default function SpecimenCard({ specimen, onView }: { specimen: Specimen, onView: (s: Specimen) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const engineRef = useRef<BABYLON.Engine | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.05 }
    )

    if (canvasRef.current) {
      observer.observe(canvasRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible || !canvasRef.current) {
      if (engineRef.current) {
        engineRef.current.dispose()
        engineRef.current = null
      }
      return
    }

    // Small delay to prevent flashing/heavy load while scrolling fast
    const timer = setTimeout(() => {
      if (!canvasRef.current || engineRef.current) return

      const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true }, true)
      engineRef.current = engine
      const scene = new BABYLON.Scene(engine)
      scene.clearColor = new BABYLON.Color4(0, 0, 0, 0)

      const camera = new BABYLON.ArcRotateCamera('cam', Math.PI / 2, Math.PI / 3, 3, BABYLON.Vector3.Zero(), scene)
      camera.wheelPrecision = 100
      
      const hemi = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene)
      hemi.intensity = 0.3
      
      const rim = new BABYLON.PointLight('rim', new BABYLON.Vector3(2, 2, 2), scene)
      rim.intensity = 0.8
      rim.diffuse = new BABYLON.Color3(0, 0.8, 1)

      const glow = new BABYLON.GlowLayer("glow", scene)
      glow.intensity = 0.6

      const modelUrl = specimen.path;
      
      const loadModel = async () => {
        try {
          BABYLON.SceneLoader.ImportMesh('', '', modelUrl, scene, (meshes: any[]) => {
            const rootMesh = meshes[0]
            
            meshes.forEach((m: any) => {
              if (m.getTotalVertices() > 0) {
                const pbr = new BABYLON.PBRMaterial("pbr", scene)
                pbr.metallic = 0.8
                pbr.roughness = 0.3
                pbr.albedoColor = new BABYLON.Color3(0.05, 0.1, 0.15)
                pbr.emissiveColor = new BABYLON.Color3(0, 0.2, 0.3)
                m.material = pbr
              }
            })

            if (rootMesh) {
              rootMesh.normalizeToUnitCube()
              rootMesh.computeWorldMatrix(true)
              const extend = rootMesh.getHierarchyBoundingVectors()
              const center = extend.max.add(extend.min).scale(0.5)
              rootMesh.position.subtractInPlace(center)

              scene.registerBeforeRender(() => {
                rootMesh.rotation.y += 0.01
              })
            }
          }, null, (scene: any, message: any) => {
            console.warn("Failed to load mesh", message);
          })
        } catch (e) {
          console.warn("Failed to load model in card", e)
        }
      }

      loadModel()
      engine.runRenderLoop(() => {
        if (scene.activeCamera) scene.render()
      })
    }, 300)

    return () => {
      clearTimeout(timer)
      if (engineRef.current) {
        engineRef.current.dispose()
        engineRef.current = null
      }
    }
  }, [isVisible, specimen.path])

  return (
    <div 
      onClick={() => onView(specimen)}
      style={{ 
        background: 'rgba(5, 15, 25, 0.6)', 
        border: '1px solid rgba(0, 212, 255, 0.2)',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        height: '300px',
        transition: 'all 0.3s',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.5)'
        e.currentTarget.style.background = 'rgba(5, 25, 45, 0.8)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.2)'
        e.currentTarget.style.background = 'rgba(5, 15, 25, 0.6)'
      }}
    >
      <div style={{ height: '180px', background: '#000', position: 'relative', overflow: 'hidden', pointerEvents: 'none' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
        {isVisible && specimen.tokenId && (
          <div style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            background: '#5ef0c0', 
            color: '#020408', 
            fontSize: '8px', 
            padding: '2px 6px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            boxShadow: '0 0 10px #5ef0c044'
          }}>
            MINTED_#{specimen.tokenId}
          </div>
        )}
        {!isVisible && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d4ff44', fontSize: '10px' }}>
            SCANNING...
          </div>
        )}
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#00d4ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={specimen.name}>
            {specimen.name}
          </div>
          <div style={{ fontSize: '9px', color: '#4a6080', marginTop: '4px' }}>
            SIZE: {specimen.size}
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '8px', color: '#1a3040' }}>{specimen.modified}</span>
          <button style={{ 
            background: 'transparent', 
            border: '1px solid #00d4ff44', 
            color: '#00d4ff', 
            fontSize: '9px', 
            padding: '2px 8px',
            cursor: 'pointer',
            pointerEvents: 'none' // Let the parent div handle the click
          }}>
            [ VIEW_UNIT ]
          </button>
        </div>
      </div>
    </div>
  )
}
