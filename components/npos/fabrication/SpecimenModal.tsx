import { useEffect, useRef, useState } from 'react'
import * as BABYLON from 'babylonjs'
import 'babylonjs-loaders'
import MintingPortal from './MintingPortal'

interface Specimen {
  name: string
  path: string
  size: string
  modified: string
  tokenId?: number
  txHash?: string
}

interface SpecimenModalProps {
  specimen: Specimen
  onClose: () => void
  onUpdate: (updated: Specimen) => void
}

export default function SpecimenModal({ specimen: initialSpecimen, onClose, onUpdate }: SpecimenModalProps) {
  const [specimen, setSpecimen] = useState(initialSpecimen)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<BABYLON.Engine | null>(null)

  const handleMintSuccess = (data: any) => {
    const updated = {
      ...specimen,
      tokenId: data.tokenId,
      txHash: data.txHash
    }
    setSpecimen(updated)
    onUpdate(updated)
  }

  useEffect(() => {
    if (!canvasRef.current) return
// ... existing useEffect content ...

    const engine = new BABYLON.Engine(canvasRef.current, true)
    engineRef.current = engine
    const scene = new BABYLON.Scene(engine)
    
    // Cyberpunk/Dark theme background
    scene.clearColor = new BABYLON.Color4(0.01, 0.02, 0.04, 1)

    // Environment Lighting (PRO)
    const envHelper = scene.createDefaultEnvironment({
      createSkybox: true,
      skyboxSize: 100,
      skyboxColor: new BABYLON.Color3(0.01, 0.02, 0.04),
      createGround: true,
      groundSize: 100,
      groundColor: new BABYLON.Color3(0.01, 0.02, 0.04),
      enableGroundMirror: true,
      groundMirrorAmount: 0.3,
      groundMirrorBlurKernel: 64
    })

    // Camera with enhanced fluidity
    const camera = new BABYLON.ArcRotateCamera(
      'modalCam',
      Math.PI / 4,
      Math.PI / 3,
      5,
      BABYLON.Vector3.Zero(),
      scene
    )
    camera.attachControl(canvasRef.current, true)
    camera.wheelPrecision = 100
    camera.lowerRadiusLimit = 2
    camera.upperRadiusLimit = 15
    camera.useAutoRotationBehavior = true
    if (camera.autoRotationBehavior) {
      camera.autoRotationBehavior.idleRotationSpeed = 0.05
    }

    // Advanced Lighting
    const hemiLight = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene)
    hemiLight.intensity = 0.2
    
    // Accent Lights
    const blueLight = new BABYLON.PointLight('blueLight', new BABYLON.Vector3(5, 5, 5), scene)
    blueLight.intensity = 1.0
    blueLight.diffuse = new BABYLON.Color3(0, 0.8, 1)
    
    const purpleLight = new BABYLON.PointLight('purpleLight', new BABYLON.Vector3(-5, 5, -5), scene)
    purpleLight.intensity = 0.5
    purpleLight.diffuse = new BABYLON.Color3(0.5, 0, 1)

    // Post-Processing (Bloom / Glow)
    const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera])
    pipeline.bloomEnabled = true
    pipeline.bloomThreshold = 0.6
    pipeline.bloomWeight = 0.4
    pipeline.bloomKernel = 64
    pipeline.fxaaEnabled = true
    pipeline.chromaticAberrationEnabled = true
    pipeline.chromaticAberration.aberrationAmount = 5

    // Priority: Try loading GLB from /models/, fallback to STL from /stls/
    // Use the provided path as primary
    const modelUrl = specimen.path;
    
    const loadModel = async () => {
      try {
        BABYLON.SceneLoader.ImportMesh('', '', modelUrl, scene, (meshes) => {
          // Flatten meshes and apply premium material
          const rootMesh = meshes[0];
          
          meshes.forEach(m => {
            if (m.getTotalVertices() > 0) {
              const pbr = new BABYLON.PBRMaterial("pbr", scene);
              pbr.metallic = 0.9;
              pbr.roughness = 0.2;
              pbr.albedoColor = new BABYLON.Color3(0.1, 0.2, 0.3);
              pbr.emissiveColor = new BABYLON.Color3(0, 0.1, 0.2);
              pbr.enableSpecularAntiAliasing = true;
              pbr.clearCoat.isEnabled = true;
              pbr.clearCoat.intensity = 0.5;
              
              m.material = pbr;
            }
          })

          if (rootMesh) {
            rootMesh.normalizeToUnitCube()
            rootMesh.computeWorldMatrix(true)
            const extend = rootMesh.getHierarchyBoundingVectors()
            const center = extend.max.add(extend.min).scale(0.5)
            rootMesh.position.subtractInPlace(center)

            // Subtle float animation
            let alpha = 0
            scene.registerBeforeRender(() => {
              alpha += 0.01
              rootMesh.position.y = Math.sin(alpha) * 0.05
            })
          }
        })
      } catch (e) {
        console.warn("Failed to load model", e)
      }
    }

    loadModel()

    engine.runRenderLoop(() => scene.render())

    const handleResize = () => engine.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      engine.dispose()
    }
  }, [specimen])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ fontSize: '10px', color: '#4a6080', letterSpacing: '2px' }}>// SPECIMEN_DETAIL_VIEW</div>
            <h2 className="specimen-title">{specimen.name}</h2>
          </div>
          <button 
            onClick={onClose}
            className="close-btn"
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            [ CLOSE_X ]
          </button>
        </div>

        {/* 3D Viewer */}
        <div className="viewport-container">
          <canvas ref={canvasRef} className="babylon-canvas" />
          
          {/* Overlay info */}
          <div className="info-panel">
            <div className="info-line"><span className="label">SPECIMEN_METADATA</span></div>
            <div className="info-line"><span className="label">SIZE:</span> <span className="value">{specimen.size}</span></div>
            <div className="info-line"><span className="label">MODIFIED:</span> <span className="value">{specimen.modified}</span></div>
            <div className="info-line"><span className="label">TYPE:</span> <span className="value">GLB_OPTIMIZED</span></div>
            
            {specimen.tokenId && (
              <>
                <div className="info-line" style={{ marginTop: '10px' }}>
                  <span className="label" style={{ color: '#5ef0c0' }}>TOKEN_ID:</span> 
                  <span className="value" style={{ color: '#5ef0c0' }}>#{specimen.tokenId}</span>
                </div>
                <div className="info-line">
                  <span className="label" style={{ color: '#5ef0c0' }}>TX_HASH:</span> 
                  <span className="value" style={{ color: '#5ef0c0', fontSize: '6px' }} title={specimen.txHash}>
                    {specimen.txHash?.substring(0, 20)}...
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="action-panel">
            {!specimen.tokenId && (
              <MintingPortal specimen={specimen} onSuccess={handleMintSuccess} />
            )}
          </div>

          <div style={{
            position: 'absolute',
            bottom: '25px',
            right: '25px',
            fontSize: '9px',
            color: '#00d4ff88',
            pointerEvents: 'none',
            fontFamily: 'Space Mono, monospace'
          }}>
            [ DRAG_ROTATE // PINCH_ZOOM ]
          </div>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .modal-content {
            background: #020408;
            border: 1px solid rgba(0, 212, 255, 0.3);
            width: 100%;
            max-width: 900px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 0 50px rgba(0, 212, 255, 0.1);
          }
          .modal-header {
            padding: 20px;
            border-bottom: 1px solid rgba(0, 212, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .specimen-title {
            margin: 5px 0 0 0;
            font-size: 1.2rem;
            color: #00d4ff;
            letter-spacing: 1px;
          }
          .close-btn {
            background: transparent;
            border: 1px solid rgba(0, 212, 255, 0.3);
            color: #4a6080;
            padding: 5px 15px;
            cursor: pointer;
            font-family: 'Space Mono', monospace;
            font-size: 0.7rem;
            transition: all 0.2s;
          }
          .viewport-container {
            position: relative;
            height: 500px;
            background: #000;
          }
          .babylon-canvas {
            width: 100%;
            height: 100%;
            outline: none;
          }
          .info-panel {
            position: absolute;
            top: 25px;
            left: 25px;
            background: rgba(2, 4, 8, 0.8);
            border: 1px solid rgba(0, 212, 255, 0.2);
            padding: 15px;
            pointer-events: none;
            min-width: 180px;
          }
          .info-line {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            font-size: 0.65rem;
            margin-bottom: 4px;
          }
          .label { color: #4a6080; }
          .value { color: #00d4ff; font-family: 'Space Mono', monospace; }
          
          .action-panel {
            position: absolute;
            bottom: 25px;
            left: 25px;
            width: 300px;
          }

          @media (max-width: 768px) {
            .viewport-container { height: 400px; }
            .info-panel { top: 15px; left: 15px; min-width: 140px; }
            .action-panel { bottom: 15px; left: 15px; width: calc(100% - 30px); }
          }
        `}</style>
      </div>
    </div>
  )
}
