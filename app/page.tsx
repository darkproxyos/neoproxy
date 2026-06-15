'use client'
import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [booted, setBooted] = useState(false)
  const [bootText, setBootText] = useState('')
  const [showMask, setShowMask] = useState(false)

  useEffect(() => {
    const lines = [
      '> INITIALIZING PROXY CORE...',
      '> ROMDO KERNEL LOADED',
      '> RELIC-001 DETECTED',
      '> THE FIRST PROXY AWAKENS',
    ]
    let i = 0
    const interval = setInterval(() => {
      if (i < lines.length) {
        setBootText(prev => prev + lines[i] + '\n')
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => { setBooted(true); setTimeout(() => setShowMask(true), 800) }, 500)
      }
    }, 600)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!booted || !canvasRef.current) return
    const init = async () => {
      const B = await import('@babylonjs/core')
      const engine = new B.Engine(canvasRef.current!, true)
      const isMobile = window.innerWidth < 768
      engine.setHardwareScalingLevel(isMobile ? 1.5 : 1)
      const scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0.01, 0.01, 0.03, 1)
      scene.fogMode = B.Scene.FOGMODE_EXP2
      scene.fogColor = new B.Color3(0.02, 0.05, 0.1)
      scene.fogDensity = 0.02
      const camera = new B.FreeCamera('cam', new B.Vector3(0, 8, -25), scene)
      camera.setTarget(new B.Vector3(0, 0, 0))
      const ambient = new B.HemisphericLight('amb', new B.Vector3(0, 1, 0), scene)
      ambient.intensity = 0.15
      ambient.diffuse = new B.Color3(0.3, 0.2, 0.8)
      const coreLight = new B.PointLight('core', new B.Vector3(0, 2, 0), scene)
      coreLight.diffuse = new B.Color3(0, 0.8, 1)
      coreLight.intensity = 3
      const glow = new B.GlowLayer('glow', scene)
      glow.intensity = isMobile ? 0.5 : 0.8
      const core = B.MeshBuilder.CreateSphere('core', { diameter: 2.5, segments: 32 }, scene)
      core.position.y = 2
      const coreMat = new B.PBRMaterial('coreMat', scene)
      coreMat.albedoColor = new B.Color3(0, 0.9, 1)
      coreMat.emissiveColor = new B.Color3(0, 0.5, 0.8)
      coreMat.metallic = 1
      coreMat.roughness = 0.05
      core.material = coreMat
      for (let i = 0; i < 3; i++) {
        const ring = B.MeshBuilder.CreateTorus('ring'+i, { diameter:4+i*2, thickness:0.05, tessellation:64 }, scene)
        ring.position.y = 2
        ring.rotation.x = Math.PI/3*i
        const ringMat = new B.PBRMaterial('rm'+i, scene)
        ringMat.albedoColor = new B.Color3(0, 0.7, 1)
        ringMat.emissiveColor = new B.Color3(0, 0.3, 0.6)
        ringMat.metallic = 1
        ringMat.roughness = 0.1
        ring.material = ringMat
        const idx = i
        scene.registerBeforeRender(() => { ring.rotation.y += 0.003*(idx+1) })
      }
      const cols = [[-8,0,-8],[8,0,-8],[-8,0,8],[8,0,8],[0,0,-15]]
      cols.forEach(([x,,z], i) => {
        const col = B.MeshBuilder.CreateCylinder('col'+i, { height:12, diameter:0.4, tessellation:8 }, scene)
        col.position.set(x, 6, z)
        const mat = new B.PBRMaterial('cm'+i, scene)
        mat.albedoColor = new B.Color3(0.05, 0.08, 0.12)
        mat.emissiveColor = new B.Color3(0, 0.1, 0.2)
        mat.metallic = 0.95
        mat.roughness = 0.2
        col.material = mat
      })
      let angle = 0
      scene.registerBeforeRender(() => {
        angle += 0.002
        camera.position.x = Math.sin(angle)*25
        camera.position.z = Math.cos(angle)*25
        camera.position.y = 8+Math.sin(angle*0.5)*3
        camera.setTarget(new B.Vector3(0,2,0))
        const pulse = Math.sin(Date.now()*0.002)*0.3+1
        coreLight.intensity = 3*pulse
        core.scaling.setAll(pulse*0.9+0.1)
      })
      engine.runRenderLoop(() => scene.render())
      window.addEventListener('resize', () => engine.resize())
    }
    init()
  }, [booted])

  const mono = "'Space Mono', monospace"

  return (
    <div style={{ background:'#000205', minHeight:'100vh', overflow:'hidden' }}>

      <div style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:0 }}>
        {!booted ? (
          <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center',
            justifyContent:'center', flexDirection:'column', padding:'0 16px' }}>
            <div className="boot-text" style={{ fontFamily:mono, fontSize:11, color:'#00d4ff',
              letterSpacing:4, lineHeight:2.5, whiteSpace:'pre-wrap', textAlign:'center' }}>{bootText}</div>
            <div style={{ marginTop:32, width:200, height:1, background:'#00d4ff11', overflow:'hidden' }}>
              <div style={{ height:'100%', background:'linear-gradient(to right, #00d4ff, #00ffcc)',
                animation:'load 2.4s ease forwards' }}/>
            </div>
          </div>
        ) : (
          <canvas ref={canvasRef} style={{ width:'100%', height:'100%', display:'block' }}/>
        )}
      </div>

      {booted && (
        <div className="info-panel" style={{ position:'fixed', top:80, left:24, zIndex:10,
          fontFamily:mono, fontSize:10, letterSpacing:3, lineHeight:2.5,
          color:'#00d4ff', pointerEvents:'none' }}>
          <div style={{ fontSize:13, color:'#00ffcc', textShadow:'0 0 20px #00ffcc' }}>NEOPROXY OS // v0.2</div>
          <div style={{ color:'#6644aa' }}>ROMDO KERNEL :: ACTIVE</div>
          <div>INTEGRITY: <span style={{ color:'#00ff88' }}>99%</span></div>
          <div style={{ color:'#ffffff33', fontSize:8, marginTop:8 }}>COGITO ERGO SUM</div>
        </div>
      )}

      {booted && (
        <div style={{ position:'fixed', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)', zIndex:10, textAlign:'center',
          fontFamily:mono, width:'100%', padding:'0 16px', boxSizing:'border-box' }}>
          <div className="neo-title" style={{ fontSize:42, fontWeight:700, letterSpacing:12, color:'#00d4ff',
            textShadow:'0 0 40px #00d4ff, 0 0 80px #6644aa', marginBottom:8 }}>
            NEOPROXY
          </div>
          <div className="neo-subtitle" style={{ fontSize:10, letterSpacing:8, color:'#6644aa', marginBottom:40 }}>
            SISTEMA AUTÓNOMO // REALIDAD ZERO
          </div>
          <div className="nav-buttons" style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            {[
              { label:'INIT SESSION', href:'/login' },
              { label:'MODULES', href:'/artifacts' },
              { label:'CORE', href:'/kernel' },
              { label:'SHOP', href:'/shop' },
              { label:'RELICS', href:'/relics' },
              { label:'MANIFESTO', href:'/manifesto' },
            ].map(({ label, href }) => (
              <a key={href} href={href} className="nav-btn" style={{
                border:'1px solid #00d4ff44', padding:'8px 20px',
                fontSize:10, letterSpacing:4, color:'#00d4ff',
                textDecoration:'none', background:'#00d4ff08',
              }}>{label}</a>
            ))}
          </div>
        </div>
      )}

      {showMask && (
        <div className="promo-bar" style={{
          position:'fixed', bottom:0, left:0, right:0, zIndex:20,
          background:'linear-gradient(to top, #000205 60%, transparent)',
          padding:'40px 24px 30px',
          display:'flex', alignItems:'center', justifyContent:'center', gap:32,
          flexWrap:'wrap',
        }}>
          <div style={{ fontFamily:mono, color:'#00d4ff', maxWidth:'100%' }}>
            <div style={{ fontSize:9, letterSpacing:6, color:'#00ff8844', marginBottom:6 }}>
              ◆ NUEVO ARTEFACTO DISPONIBLE
            </div>
            <div className="promo-title" style={{ fontSize:18, letterSpacing:4, color:'#00ffcc',
              textShadow:'0 0 20px #00ffcc66', marginBottom:4 }}>
              RELIC-001 // PROXY MASK MK-I
            </div>
            <div className="promo-desc" style={{ fontSize:10, color:'#ffffff44', marginBottom:16, letterSpacing:2 }}>
              PLA Negro + Resina Verde Transparente · Fabricación artesanal · Santiago, Chile
            </div>
            <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
              <a href="/relics" style={{
                background:'#00ffcc', color:'#000205',
                padding:'10px 28px', fontSize:11, letterSpacing:4,
                textDecoration:'none', fontFamily:mono, fontWeight:'bold',
              }}>VER RELIC →</a>
              <span style={{ fontSize:9, color:'#00d4ff44', letterSpacing:3 }}>
                UNIDADES LIMITADAS
              </span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes load { from { width:0 } to { width:100% } }

        @media (max-width: 640px) {
          .neo-title { font-size: 28px !important; letter-spacing: 5px !important; margin-bottom: 6px !important; }
          .neo-subtitle { font-size: 8px !important; letter-spacing: 3px !important; margin-bottom: 24px !important; }
          .boot-text { font-size: 9px !important; letter-spacing: 1px !important; }
          .info-panel { top: 64px !important; left: 12px !important; font-size: 8px !important; letter-spacing: 2px !important; }
          .info-panel div:first-child { font-size: 10px !important; }
          .nav-buttons {
            gap: 8px !important;
            flex-wrap: nowrap !important;
            justify-content: flex-start !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            padding-bottom: 6px !important;
            scrollbar-width: none !important;
          }
          .nav-buttons::-webkit-scrollbar { display: none !important; }
          .nav-btn {
            padding: 6px 14px !important;
            font-size: 9px !important;
            letter-spacing: 2px !important;
            flex-shrink: 0 !important;
            white-space: nowrap !important;
          }
          .promo-bar { padding: 24px 16px 20px !important; gap: 16px !important; }
          .promo-title { font-size: 14px !important; letter-spacing: 2px !important; }
          .promo-desc { font-size: 9px !important; letter-spacing: 1px !important; }
        }
      `}</style>
    </div>
  )
}
