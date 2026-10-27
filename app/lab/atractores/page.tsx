"use client";

import { useEffect, useRef, useState, useCallback } from 'react'
import * as BABYLON from 'babylonjs'
import Link from 'next/link'
import { mulberry32, attractors } from './engine/attractors'

export default function GenerativeLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedAlgo, setSelectedAlgo] = useState<string>('lorenz')
  const [isClient, setIsClient] = useState(false)
  const [windowWidth, setWindowWidth] = useState(1024)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Handle window resize safely
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true)
      setWindowWidth(window.innerWidth)
      
      const handleResize = () => {
        setWindowWidth(window.innerWidth)
      }
      
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  const isMobile = windowWidth <= 768
  const sceneRef = useRef<BABYLON.Scene | null>(null)
  const engineRef = useRef<BABYLON.Engine | null>(null)
  const [sceneReady, setSceneReady] = useState(false)

  useEffect(() => {
    if (!isClient || !canvasRef.current) return
    const engine = new BABYLON.Engine(canvasRef.current, true)
    engineRef.current = engine
    const scene = new BABYLON.Scene(engine)
    sceneRef.current = scene

    // Theme fijo (cian/verde de NeoProxy), sin AestheticProvider
    const bgColor = new BABYLON.Color3(0.02, 0.03, 0.045)
    scene.clearColor = new BABYLON.Color4(bgColor.r, bgColor.g, bgColor.b, 1)

    const camera = new BABYLON.ArcRotateCamera('cam', Math.PI / 4, Math.PI / 3, 20, BABYLON.Vector3.Zero(), scene)
    camera.attachControl(canvasRef.current, true)
    camera.wheelPrecision = 50

    const hemi = new BABYLON.HemisphericLight('h', new BABYLON.Vector3(0, 1, 0), scene)
    hemi.intensity = 0.4

    const gl = new BABYLON.GlowLayer('glow', scene)
    gl.intensity = 0.6

    engine.runRenderLoop(() => scene.render())
    const resize = () => engine.resize()
    window.addEventListener('resize', resize)
    setSceneReady(true)

    return () => { engine.dispose(); sceneRef.current = null; setSceneReady(false); window.removeEventListener('resize', resize) }
  }, [isClient])

  // Reaction to algorithm change
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene || !sceneReady) return

    setIsLoading(true)

    // Give time for the UI to show the loading state
    const timer = setTimeout(() => {
      // Clean previous specimen
      const oldSpecimen = scene.getMeshByName('Specimen_Core')
      if (oldSpecimen) oldSpecimen.dispose()

      const algo = attractors[selectedAlgo]
      const rand = mulberry32(42)
      let state = algo.init(rand)
      const p = algo.params!

      // Warm up
      for (let i = 0; i < 500; i++) { state = algo.step(p, rand, state) as typeof state }
      
      const raw: {x:number,y:number,z:number}[] = []
      for (let i = 0; i < 50000; i++) {
        state = algo.step(p, rand, state) as typeof state
        if (i % 3 === 0) raw.push({ x: state.x, y: state.y, z: state.z })
      }

      let cx = 0, cy = 0, cz = 0
      raw.forEach(pt => { cx += pt.x; cy += pt.y; cz += pt.z })
      cx /= raw.length; cy /= raw.length; cz /= raw.length

      const pts = raw.map(pt => new BABYLON.Vector3((pt.x - cx) * algo.scale, (pt.y - cy) * algo.scale, (pt.z - cz) * algo.scale))

      const mat = new BABYLON.StandardMaterial('m', scene)
      const primaryStr = '#00d4ff'
      const secondaryStr = '#111111'
      
      mat.diffuseColor = BABYLON.Color3.FromHexString(secondaryStr).scale(0.1)
      mat.emissiveColor = BABYLON.Color3.FromHexString(primaryStr).scale(0.2)
      mat.specularColor = BABYLON.Color3.FromHexString(primaryStr)

      const tubes: BABYLON.Mesh[] = []
      // Increased chunk size for faster merging
      for (let i = 0; i < pts.length; i += 200) {
        const chunk = pts.slice(i, Math.min(i + 202, pts.length))
        if (chunk.length < 2) continue
        const tube = BABYLON.MeshBuilder.CreateTube('t' + i, { path: chunk, radius: 0.05, tessellation: 4, cap: BABYLON.Mesh.CAP_ALL }, scene)
        tubes.push(tube)
      }

      const merged = BABYLON.Mesh.MergeMeshes(tubes, true, true, undefined, false, true)
      if (merged) {
        merged.material = mat
        merged.name = 'Specimen_Core'
        
        // Animation
        const anim = new BABYLON.Animation("rot", "rotation.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE)
        anim.setKeys([{frame: 0, value: 0}, {frame: 360, value: Math.PI * 2}])
        merged.animations = [anim]
        scene.beginAnimation(merged, 0, 360, true)
      }
      setIsLoading(false)
    }, 50)

    return () => clearTimeout(timer)
  }, [selectedAlgo, sceneReady])

  const handleExportSTL = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    const mesh = scene.getMeshByName('Specimen_Core') as BABYLON.Mesh;
    if (!mesh) return;

    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const indices = mesh.getIndices();
    if (!positions || !indices) return;

    const triangleCount = indices.length / 3;
    const bufferSize = 84 + triangleCount * 50;
    const buffer = new ArrayBuffer(bufferSize);
    const dv = new DataView(buffer);

    // 80-byte Header
    for (let i = 0; i < 80; i++) dv.setUint8(i, 0);

    // Triangle Count
    dv.setUint32(80, triangleCount, true);

    let offset = 84;
    for (let i = 0; i < indices.length; i += 3) {
      dv.setFloat32(offset, 0, true);
      dv.setFloat32(offset + 4, 0, true);
      dv.setFloat32(offset + 8, 0, true);
      offset += 12;

      for (let v = 0; v < 3; v++) {
        const index = indices[i + v] * 3;
        dv.setFloat32(offset, positions[index], true);
        dv.setFloat32(offset + 4, positions[index + 1], true);
        dv.setFloat32(offset + 8, positions[index + 2], true);
        offset += 12;
      }
      dv.setUint16(offset, 0, true);
      offset += 2;
    }

    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NeoProxy_${selectedAlgo}_specimen.stl`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="lab-page main-content" data-theme="lab" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Top Bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40px', background: 'rgba(5, 10, 20, 0.8)', borderBottom: '1px solid var(--neo-glow, rgba(0, 212, 255, 0.4))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100, backdropFilter: 'blur(5px)' }}>
        <span style={{ fontSize: '12px', letterSpacing: '2px', color: 'var(--neo-primary, #00d4ff)' }}>NEOPROXY // R&D // GENERATIVE_LAB.v3</span>
        <Link href="/" style={{ color: 'var(--neo-primary, #00d4ff)', textDecoration: 'none', fontSize: '10px', border: '1px solid var(--neo-glow, rgba(0, 212, 255, 0.4))', padding: '2px 8px' }}>EXIT_PROTOCOL</Link>
      </div>

      {isClient && (
        <>
          {/* Mobile Algorithm Selector - Collapsible */}
          {isMobile ? (
            <div style={{ 
              position: 'absolute', 
              top: '50px', 
              left: '10px', 
              right: '10px', 
              zIndex: 100, 
              background: 'rgba(5, 10, 20, 0.95)', 
              border: '1px solid #00d4ff22', 
              backdropFilter: 'blur(15px)', 
              borderRadius: '4px'
            }}>
              {/* Algorithm Selector Header */}
              <button
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#00d4ff',
                  padding: '10px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: "'Space Mono', monospace"
                }}
              >
                <span>SELECT_ALGORITHM</span>
                <span>{isPanelOpen ? '▼' : '▶'}</span>
              </button>

              {/* Collapsible Panel Content */}
              {isPanelOpen && (
                <div style={{ padding: '0 10px 10px', borderTop: '1px solid #00d4ff22', marginTop: '5px' }}>
                  {/* Algorithm List */}
                  <div style={{ marginBottom: '10px', maxHeight: '150px', overflowY: 'auto' }} className="custom-scroll">
                    {Object.keys(attractors).map(key => (
                      <button 
                        key={key}
                        onClick={() => {
                          setSelectedAlgo(key)
                          setIsPanelOpen(false) // Close after selection
                        }}
                        style={{ 
                          display: 'block', width: '100%', textAlign: 'left', background: selectedAlgo === key ? '#00d4ff22' : 'transparent',
                          border: 'none', color: selectedAlgo === key ? '#00d4ff' : '#4a6080', padding: '8px 10px', marginBottom: '4px',
                          cursor: 'pointer', fontSize: '10px', transition: 'all 0.2s', borderLeft: selectedAlgo === key ? '2px solid #00d4ff' : '2px solid transparent',
                          fontFamily: "'Space Mono', monospace"
                        }}
                      >
                        {attractors[key].name.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* Current Algorithm Info */}
                  <div style={{
                    padding: '8px',
                    background: '#00000044',
                    fontSize: '8px',
                    color: '#00d4ff88',
                    whiteSpace: 'pre-wrap',
                    marginBottom: selectedAlgo === 'lorenz' ? '6px' : '10px',
                    maxHeight: '80px',
                    overflow: 'auto'
                  }}>
                    {attractors[selectedAlgo].equations}
                  </div>

                  {selectedAlgo === 'lorenz' && (
                    <Link href="/knowledge?entry=lorenz" style={{
                      display: 'block', fontSize: '8px', color: '#00d4ff', letterSpacing: '1px',
                      textDecoration: 'none', marginBottom: '10px',
                    }}>
                      EDWARD LORENZ, 1917–2008 →
                    </Link>
                  )}

                  {/* Export Button */}
                  <button 
                    onClick={handleExportSTL}
                    style={{ 
                      width: '100%', 
                      background: '#00d4ff', 
                      color: '#020408', 
                      border: 'none', 
                      padding: '8px', 
                      fontWeight: 'bold', 
                      fontSize: '9px', 
                      cursor: 'pointer', 
                      letterSpacing: '1px',
                      boxShadow: '0 0 15px #00d4ff33',
                      fontFamily: "'Space Mono', monospace"
                    }}
                  >
                    ▲ EXPORT_SPECIMEN (.STL)
                  </button>
                </div>
              )}

              <style>{`
                .custom-scroll {
                  scrollbar-width: thin;
                  scrollbar-color: #00d4ff33 transparent;
                }
                .custom-scroll::-webkit-scrollbar { width: 2px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #00d4ff33; border-radius: 10px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: #00d4ff66; }
              `}</style>
            </div>
          ) : (
            /* Desktop Algorithm Panel - Always Visible */
            <div style={{ 
              position: 'absolute', 
              top: '60px', 
              left: '20px', 
              width: '220px', 
              bottom: '20px', 
              zIndex: 100, 
              background: 'rgba(5, 10, 20, 0.85)', 
              border: '1px solid #00d4ff22', 
              padding: '15px', 
              backdropFilter: 'blur(15px)', 
              display: 'flex', 
              flexDirection: 'column' 
            }}>
              <div style={{ fontSize: '10px', color: '#4a6080', marginBottom: '10px', flexShrink: 0 }}>SELECT_ALGORITHM</div>
              
              <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '15px', paddingRight: '5px' }} className="custom-scroll">
                {Object.keys(attractors).map(key => (
                  <button 
                    key={key}
                    onClick={() => setSelectedAlgo(key)}
                    style={{ 
                      display: 'block', width: '100%', textAlign: 'left', background: selectedAlgo === key ? '#00d4ff22' : 'transparent',
                      border: 'none', color: selectedAlgo === key ? '#00d4ff' : '#4a6080', padding: '10px 12px', marginBottom: '4px',
                      cursor: 'pointer', fontSize: '11px', transition: 'all 0.2s', borderLeft: selectedAlgo === key ? '2px solid #00d4ff' : '2px solid transparent'
                    }}
                  >
                    {attractors[key].name.toUpperCase()}
                  </button>
                ))}
              </div>
              
              <div style={{
                padding: '10px',
                background: '#00000044',
                fontSize: '9px',
                color: '#00d4ff88',
                whiteSpace: 'pre-wrap',
                marginBottom: selectedAlgo === 'lorenz' ? '6px' : '15px',
                overflow: 'hidden'
              }}>
                {attractors[selectedAlgo].equations}
              </div>

              {selectedAlgo === 'lorenz' && (
                <Link href="/knowledge?entry=lorenz" style={{
                  display: 'block', fontSize: '9px', color: '#00d4ff', letterSpacing: '1px',
                  textDecoration: 'none', marginBottom: '15px',
                }}>
                  EDWARD LORENZ, 1917–2008 →
                </Link>
              )}

              <button
                onClick={handleExportSTL}
                style={{ 
                  width: '100%', 
                  background: '#00d4ff', 
                  color: '#020408', 
                  border: 'none', 
                  padding: '12px', 
                  fontWeight: 'bold', 
                  fontSize: '10px', 
                  cursor: 'pointer', 
                  letterSpacing: '1px',
                  boxShadow: '0 0 15px #00d4ff33', 
                  flexShrink: 0
                }}
              >
                ▲ EXPORT_SPECIMEN (.STL)
              </button>

              <style>{`
                .custom-scroll {
                  scrollbar-width: thin;
                  scrollbar-color: #00d4ff33 transparent;
                }
                .custom-scroll::-webkit-scrollbar { width: 3px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #00d4ff33; border-radius: 10px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: #00d4ff66; }
              `}</style>
            </div>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(2, 4, 8, 0.7)',
              backdropFilter: 'blur(5px)',
              zIndex: 200,
              color: 'var(--neo-primary, #00d4ff)',
              fontFamily: "'Space Mono', monospace",
              fontSize: '12px',
              letterSpacing: '4px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div>GENERATING_MESH...</div>
                <div style={{ marginTop: '10px', fontSize: '8px', opacity: 0.6 }}>// ATTRACTOR_DATA_PROCESSING</div>
              </div>
            </div>
          )}

          {/* Babylon Canvas - Full Width */}
          <canvas 
            ref={canvasRef} 
            style={{ 
              width: '100%', 
              height: '100%', 
              outline: 'none',
              position: 'absolute',
              top: 0,
              left: 0
            }} 
          />
          
          {/* Status Overlay */}
          <div style={{ 
            position: 'absolute', 
            bottom: isMobile ? '10px' : '20px', 
            right: isMobile ? '10px' : '20px', 
            textAlign: 'right', 
            pointerEvents: 'none',
            background: 'rgba(5, 10, 20, 0.8)',
            padding: '8px 12px',
            borderRadius: 'var(--neo-rounding, 0px)',
            border: 'var(--neo-border-width, 1px) solid var(--neo-glow, rgba(0, 212, 255, 0.4))',
            backdropFilter: 'blur(var(--neo-blur, 10px))'
          }}>
            <div style={{ fontSize: isMobile ? '9px' : '10px', color: '#4a6080', marginBottom: '4px' }}>SPECIMEN_STATUS</div>
            <div style={{ fontSize: isMobile ? '14px' : '18px', color: 'var(--neo-primary, #00d4ff)', marginBottom: '4px', textShadow: '0 0 10px var(--neo-glow, rgba(0, 212, 255, 0.4))' }}>RESONANT_ACTIVE</div>
            <div style={{ 
              fontSize: isMobile ? '8px' : '9px', 
              color: '#4a6080',
              maxWidth: isMobile ? '150px' : 'auto',
              wordBreak: 'break-word'
            }}>
              ALGO: {attractors[selectedAlgo].name.toUpperCase()} // SEED: 0x42
            </div>
          </div>
        </>
      )}
    </div>
  )
}
