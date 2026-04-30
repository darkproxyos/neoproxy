"use client";

import { useEffect, useRef, useState, useCallback } from 'react'
import * as BABYLON from 'babylonjs'
import Link from 'next/link'
import { useAesthetics } from '@/components/npos/AestheticProvider'

// PRNG Mulberry32
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const attractors: Record<string, {
  name: string
  equations: string
  params: Record<string, number> | null
  init: (rand: () => number) => Record<string, number>
  step: (p: Record<string, number>, rand: () => number, state: Record<string, number>) => { x: number; y: number; z: number }
  scale: number
}> = {
  lorenz: {
    name: 'Lorenz',
    equations: 'dx/dt = σ(y−x)\ndy/dt = x(ρ−z)−y\ndz/dt = xy−βz',
    params: { sigma: 10, rho: 28, beta: 8 / 3, dt: 0.005 },
    init: () => ({ x: 0.1, y: 0, z: 0 }),
    step: (p, _, s) => {
      const dx = p.sigma * (s.y - s.x); const dy = s.x * (p.rho - s.z) - s.y; const dz = s.x * s.y - p.beta * s.z
      return { x: s.x + dx * p.dt, y: s.y + dy * p.dt, z: s.z + dz * p.dt }
    },
    scale: 0.1
  },
  thomas: {
    name: 'Thomas',
    equations: 'dx/dt = sin(y)−bx\ndy/dt = sin(z)−by\ndz/dt = sin(x)−bz',
    params: { b: 0.208, dt: 0.05 },
    init: () => ({ x: 0.1, y: 0, z: 0 }),
    step: (p, _, s) => ({
      x: s.x + (Math.sin(s.y) - p.b * s.x) * p.dt,
      y: s.y + (Math.sin(s.z) - p.b * s.y) * p.dt,
      z: s.z + (Math.sin(s.x) - p.b * s.z) * p.dt,
    }),
    scale: 2.0
  },
  aizawa: {
    name: 'Aizawa',
    equations: 'dx/dt = (z-b)x - dy\ndy/dt = dx + (z-b)y\ndz/dt = c + az - z³/3...',
    params: { a: 0.95, b: 0.7, c: 0.6, d: 3.5, e: 0.25, f: 0.1, dt: 0.01 },
    init: () => ({ x: 0.1, y: 0, z: 0 }),
    step: (p, _, s) => ({
      x: s.x + ((s.z - p.b) * s.x - p.d * s.y) * p.dt,
      y: s.y + (p.d * s.x + (s.z - p.b) * s.y) * p.dt,
      z: s.z + (p.c + p.a * s.z - (s.z ** 3 / 3) - (s.x ** 2 + s.y ** 2) * (1 + p.e * s.z) + p.f * s.z * s.x ** 3) * p.dt
    }),
    scale: 4.0
  },
  dejong: {
    name: 'De Jong',
    equations: 'x = sin(ay) - cos(bx)\ny = sin(cx) - cos(dy)',
    params: { a: 1.4, b: -2.3, c: 2.4, d: -2.1, dt: 0.1 },
    init: () => ({ x: 0.1, y: 0, z: 0 }),
    step: (p, _, s) => {
      const nx = Math.sin(p.a * s.y) - Math.cos(p.b * s.x)
      const ny = Math.sin(p.c * s.x) - Math.cos(p.d * s.y)
      return { x: nx, y: ny, z: s.z + Math.sin(nx * ny) * 0.1 }
    },
    scale: 5.0
  },
  chen: {
    name: 'Chen',
    equations: 'dx/dt = a(y-x)\ndy/dt = (c-a)x - xz + cy\ndz/dt = xy - bz',
    params: { a: 35, b: 3, c: 28, dt: 0.002 },
    init: () => ({ x: 5, y: 10, z: 10 }),
    step: (p, _, s) => ({
      x: s.x + (p.a * (s.y - s.x)) * p.dt,
      y: s.y + ((p.c - p.a) * s.x - s.x * s.z + p.c * s.y) * p.dt,
      z: s.z + (s.x * s.y - p.b * s.z) * p.dt
    }),
    scale: 0.15
  },
  halvorsen: {
    name: 'Halvorsen',
    equations: 'dx/dt = -ax - 4y - 4z - y²\ndy/dt = -ay - 4z - 4x - z²...',
    params: { a: 1.89, dt: 0.005 },
    init: () => ({ x: -1, y: 0, z: 0 }),
    step: (p, _, s) => ({
      x: s.x + (-p.a * s.x - 4 * s.y - 4 * s.z - s.y * s.y) * p.dt,
      y: s.y + (-p.a * s.y - 4 * s.z - 4 * s.x - s.z * s.z) * p.dt,
      z: s.z + (-p.a * s.z - 4 * s.x - 4 * s.y - s.x * s.x) * p.dt
    }),
    scale: 0.4
  },
  l_system: {
    name: 'L-System Plant',
    equations: 'F -> FF\nX -> F[+X][-X]FX',
    params: { angle: 25, dt: 1 },
    init: () => ({ x: 0, y: 0, z: 0, angle: 0 }),
    step: (p, rand, s) => {
      // Pseudo-atractor para simular L-System en un atractor visual
      const r = rand()
      return {
        x: s.x + Math.sin(s.angle) * 0.2,
        y: s.y + Math.cos(s.angle) * 0.2,
        z: s.z + (r - 0.5) * 0.1,
        angle: s.angle + (r > 0.5 ? p.angle : -p.angle) * 0.01
      }
    },
    scale: 5.0
  },
  clifford: {
    name: 'Clifford',
    equations: 'x = sin(ay) + c cos(ax)\ny = sin(bx) + d cos(by)',
    params: { a: 1.5, b: -1.8, c: 1.6, d: 2.0, dt: 0.1 },
    init: () => ({ x: 0.1, y: 0.1, z: 0 }),
    step: (p, _, s) => {
      const nx = Math.sin(p.a * s.y) + p.c * Math.cos(p.a * s.x)
      const ny = Math.sin(p.b * s.x) + p.d * Math.cos(p.b * s.y)
      return { x: nx, y: ny, z: s.z + Math.cos(nx + ny) * 0.05 }
    },
    scale: 4.0
  },
  rossler: {
    name: 'Rössler',
    equations: 'dx/dt = −y−z\ndy/dt = x+ay\ndz/dt = b+z(x−c)',
    params: { a: 0.2, b: 0.2, c: 5.7, dt: 0.01 },
    init: () => ({ x: 0.1, y: 0, z: 0 }),
    step: (p, _, s) => ({
      x: s.x + (-s.y - s.z) * p.dt,
      y: s.y + (s.x + p.a * s.y) * p.dt,
      z: s.z + (p.b + s.z * (s.x - p.c)) * p.dt,
    }),
    scale: 0.5
  },
  torus_knot: {
    name: 'Torus Knot',
    equations: 'r = cos(q*phi) + 2\nx = r * cos(p*phi)\ny = r * sin(p*phi)\nz = -sin(q*phi)',
    params: { p: 3, q: 7, dt: 0.01, phi: 0 },
    init: () => ({ x: 0, y: 0, z: 0, phi: 0 }),
    step: (p, _, s) => {
      const phi = s.phi + p.dt
      const r = Math.cos(p.q * phi) + 2
      return {
        x: r * Math.cos(p.p * phi),
        y: r * Math.sin(p.p * phi),
        z: -Math.sin(p.q * phi),
        phi: phi
      }
    },
    scale: 2.5
  }
}

export default function GenerativeLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedAlgo, setSelectedAlgo] = useState<string>('lorenz')
  const [isClient, setIsClient] = useState(false)
  const [windowWidth, setWindowWidth] = useState(1024)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { tokens } = useAesthetics()

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

  useEffect(() => {
    if (!isClient || !canvasRef.current) return
    const engine = new BABYLON.Engine(canvasRef.current, true)
    engineRef.current = engine
    const scene = new BABYLON.Scene(engine)
    sceneRef.current = scene
    
    // Initial theme setup from tokens if available
    const bgColor = tokens ? BABYLON.Color3.FromHexString(tokens.palette.background) : new BABYLON.Color3(0.02, 0.03, 0.045)
    scene.clearColor = new BABYLON.Color4(bgColor.r, bgColor.g, bgColor.b, 1)

    const camera = new BABYLON.ArcRotateCamera('cam', Math.PI / 4, Math.PI / 3, 20, BABYLON.Vector3.Zero(), scene)
    camera.attachControl(canvasRef.current, true)
    camera.wheelPrecision = 50

    const hemi = new BABYLON.HemisphericLight('h', new BABYLON.Vector3(0, 1, 0), scene)
    hemi.intensity = tokens ? tokens.lighting.intensity * 0.5 : 0.4
    
    const gl = new BABYLON.GlowLayer('glow', scene)
    gl.intensity = tokens ? tokens.lighting.intensity * 0.8 : 0.6

    engine.runRenderLoop(() => scene.render())
    const resize = () => engine.resize()
    window.addEventListener('resize', resize)

    return () => { engine.dispose(); window.removeEventListener('resize', resize) }
  }, [isClient])

  // Reaction to aesthetic changes
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene || !tokens) return

    const bgColor = BABYLON.Color3.FromHexString(tokens.palette.background)
    scene.clearColor = new BABYLON.Color4(bgColor.r, bgColor.g, bgColor.b, 1)
    
    const hemi = scene.getLightByName('h') as BABYLON.HemisphericLight
    if (hemi) hemi.intensity = tokens.lighting.intensity * 0.5

    const gl = scene.getGlowLayerByName('glow')
    if (gl) gl.intensity = tokens.lighting.intensity * 0.8

    // Update existing specimen material if it exists
    const mesh = scene.getMeshByName('Specimen_Core')
    if (mesh && mesh.material) {
      const mat = mesh.material as BABYLON.StandardMaterial
      mat.emissiveColor = BABYLON.Color3.FromHexString(tokens.palette.primary).scale(0.2)
      mat.specularColor = BABYLON.Color3.FromHexString(tokens.palette.primary)
      mat.diffuseColor = BABYLON.Color3.FromHexString(tokens.palette.secondary).scale(0.1)
    }
  }, [tokens])

  // Reaction to algorithm change
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

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
      const primaryStr = tokens ? tokens.palette.primary : '#00d4ff'
      const secondaryStr = tokens ? tokens.palette.secondary : '#111111'
      
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
  }, [selectedAlgo])

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
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40px', background: 'rgba(5, 10, 20, 0.8)', borderBottom: '1px solid var(--neo-glow)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100, backdropFilter: 'blur(5px)' }}>
        <span style={{ fontSize: '12px', letterSpacing: '2px', color: 'var(--neo-primary)' }}>NEOPROXY // R&D // GENERATIVE_LAB.v3</span>
        <Link href="/npos" style={{ color: 'var(--neo-primary)', textDecoration: 'none', fontSize: '10px', border: '1px solid var(--neo-glow)', padding: '2px 8px' }}>EXIT_PROTOCOL</Link>
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
                    marginBottom: '10px',
                    maxHeight: '80px',
                    overflow: 'auto'
                  }}>
                    {attractors[selectedAlgo].equations}
                  </div>

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
                marginBottom: '15px', 
                overflow: 'hidden'
              }}>
                {attractors[selectedAlgo].equations}
              </div>

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
              color: 'var(--neo-primary)',
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
            borderRadius: 'var(--neo-rounding)',
            border: 'var(--neo-border-width) solid var(--neo-glow)',
            backdropFilter: 'blur(var(--neo-blur))'
          }}>
            <div style={{ fontSize: isMobile ? '9px' : '10px', color: '#4a6080', marginBottom: '4px' }}>SPECIMEN_STATUS</div>
            <div style={{ fontSize: isMobile ? '14px' : '18px', color: 'var(--neo-primary)', marginBottom: '4px', textShadow: '0 0 10px var(--neo-glow)' }}>RESONANT_ACTIVE</div>
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
