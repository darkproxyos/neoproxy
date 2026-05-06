'use client'

import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stats, setStats] = useState({
    nodes: 12847, sessions: 0, coherence: 99.4, latency: 0
  })
  const [bootText, setBootText] = useState('')
  const [booted, setBooted] = useState(false)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)

  // Boot sequence
  useEffect(() => {
    const lines = [
      '> INITIALIZING PROXY CORE...',
      '> ROMDO KERNEL LOADED',
      '> LINK ESTABLISHED',
      '> OPERATOR RECOGNIZED',
      '> REALIDAD ZERO ACTIVE',
    ]
    let i = 0
    const interval = setInterval(() => {
      if (i < lines.length) {
        setBootText(prev => prev + lines[i] + '\n')
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => setBooted(true), 500)
      }
    }, 600)
    return () => clearInterval(interval)
  }, [])

  // Listen for kernel stats
  useEffect(() => {
    const handler = (e: any) => {
      setStats({
        nodes: e.detail.usersCount * 1247 || 12847,
        sessions: e.detail.sessionsCount || 0,
        coherence: 99.4 - (e.detail.uptime % 10) * 0.01,
        latency: Math.round(e.detail.uptime % 100)
      })
    }
    window.addEventListener('kernel-stats', handler)
    return () => window.removeEventListener('kernel-stats', handler)
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return
    
    let engine: any, scene: any, statsInterval: any, pillarInterval: any
    
    const init = async () => {
      const BABYLON = await import('@babylonjs/core')
      const { Engine, Scene, Vector3, HemisphericLight, PointLight,
              MeshBuilder, Color3, Color4, FreeCamera, ParticleSystem,
              PBRMaterial, GlowLayer } = BABYLON

      engine = new Engine(canvasRef.current!, true, { preserveDrawingBuffer: true })
      scene = new Scene(engine)
      
      // Atmósfera oscura Ergo Proxy
      scene.clearColor = new Color4(0.01, 0.01, 0.05, 1)
      scene.fogMode = Scene.FOGMODE_EXP2
      scene.fogColor = new Color3(0.02, 0.02, 0.08)
      scene.fogDensity = 0.035

      // Cámara lenta orbital
      const camera = new FreeCamera('cam', new Vector3(0, 8, -25), scene)
      camera.setTarget(new Vector3(0, 0, 0))

      // Luz ambiental fría violeta
      const ambient = new HemisphericLight('amb', new Vector3(0, 1, 0), scene)
      ambient.intensity = 0.15
      ambient.diffuse = new Color3(0.3, 0.2, 0.8)
      ambient.groundColor = new Color3(0.05, 0.05, 0.15)

      // Luz puntual cían — núcleo del servidor
      const coreLight = new PointLight('core', new Vector3(0, 2, 0), scene)
      coreLight.diffuse = new Color3(0, 0.8, 1)
      coreLight.intensity = 3
      coreLight.range = 30

      // Luz violeta secundaria
      const violetLight = new PointLight('violet', new Vector3(-8, 5, 8), scene)
      violetLight.diffuse = new Color3(0.6, 0.1, 1)
      violetLight.intensity = 2
      violetLight.range = 25

      // SUELO — placa metálica del servidor
      const ground = MeshBuilder.CreateGround('ground', { width: 60, height: 60, subdivisions: 30 }, scene)
      const groundMat = new PBRMaterial('groundMat', scene)
      groundMat.albedoColor = new Color3(0.02, 0.03, 0.06)
      groundMat.metallic = 0.9
      groundMat.roughness = 0.3
      ground.material = groundMat

      // NÚCLEO CENTRAL — esfera del servidor (Proxy core)
      const core = MeshBuilder.CreateSphere('core', { diameter: 2.5, segments: 32 }, scene)
      core.position.y = 2
      const coreMat = new PBRMaterial('coreMat', scene)
      coreMat.albedoColor = new Color3(0, 0.9, 1)
      coreMat.emissiveColor = new Color3(0, 0.5, 0.8)
      coreMat.metallic = 1
      coreMat.roughness = 0.05
      core.material = coreMat

      // ANILLOS orbitales alrededor del núcleo
      for (let i = 0; i < 3; i++) {
        const ring = MeshBuilder.CreateTorus('ring' + i, {
          diameter: 4 + i * 2,
          thickness: 0.05,
          tessellation: 64
        }, scene)
        ring.position.y = 2
        ring.rotation.x = Math.PI / 3 * i
        ring.rotation.z = Math.PI / 4 * i
        const ringMat = new PBRMaterial('ringMat' + i, scene)
        ringMat.albedoColor = new Color3(0, 0.7, 1)
        ringMat.emissiveColor = new Color3(0, 0.3, 0.6)
        ringMat.metallic = 1
        ringMat.roughness = 0.1
        ring.material = ringMat
        
        // Animación rotación
        scene.registerBeforeRender(() => {
          ring.rotation.y += 0.003 * (i + 1)
          ring.rotation.x += 0.001 * (i + 1)
        })
      }

      // COLUMNAS del servidor — estilo Romdo
      const colPositions = [
        [-8, 0, -8], [8, 0, -8], [-8, 0, 8], [8, 0, 8],
        [-4, 0, -12], [4, 0, -12], [0, 0, -15]
      ]
      const colMaterials: PBRMaterial[] = []
      colPositions.forEach(([x, y, z], i) => {
        const col = MeshBuilder.CreateCylinder('col' + i, {
          height: 12 + Math.random() * 8,
          diameter: 0.4 + Math.random() * 0.3,
          tessellation: 8
        }, scene)
        col.position.set(x, col.scaling.y * 3, z)
        const colMat = new PBRMaterial('colMat' + i, scene)
        colMat.albedoColor = new Color3(0.05, 0.08, 0.12)
        colMat.emissiveColor = new Color3(0, 0.1, 0.2)
        colMat.metallic = 0.95
        colMat.roughness = 0.2
        col.material = colMat
        colMaterials.push(colMat)
      })

      // PARTÍCULAS — polvo flotante Ergo Proxy
      const particles = new ParticleSystem('dust', 500, scene)
      particles.emitter = new Vector3(0, 5, 0)
      particles.minEmitBox = new Vector3(-15, -5, -15)
      particles.maxEmitBox = new Vector3(15, 10, 15)
      particles.color1 = new Color4(0.2, 0.5, 1, 0.3)
      particles.color2 = new Color4(0.5, 0.2, 1, 0.1)
      particles.minSize = 0.02
      particles.maxSize = 0.08
      particles.minLifeTime = 5
      particles.maxLifeTime = 10
      particles.emitRate = 50
      particles.minEmitPower = 0.1
      particles.maxEmitPower = 0.3
      particles.updateSpeed = 0.01
      particles.start()

      // GRID LINES en el suelo — estilo holograma
      for (let i = -5; i <= 5; i++) {
        const lineH = MeshBuilder.CreateLines('lh' + i, {
          points: [new Vector3(-15, 0.01, i * 3), new Vector3(15, 0.01, i * 3)]
        }, scene)
        lineH.color = new Color3(0, 0.3, 0.5)
        lineH.alpha = 0.3

        const lineV = MeshBuilder.CreateLines('lv' + i, {
          points: [new Vector3(i * 3, 0.01, -15), new Vector3(i * 3, 0.01, 15)]
        }, scene)
        lineV.color = new Color3(0, 0.3, 0.5)
        lineV.alpha = 0.3
      }

      // GLOW LAYER
      const glow = new GlowLayer('glow', scene)
      glow.intensity = 0.8

      // Click en core → /kernel
      scene.onPointerDown = (evt, pickResult) => {
        if (pickResult.hit && pickResult.pickedMesh?.name === 'core') {
          window.location.href = '/kernel'
        }
      }

      // Cursor pointer en hover
      scene.onPointerMove = (evt, pickResult) => {
        if (pickResult.hit && pickResult.pickedMesh?.name === 'core') {
          canvasRef.current!.style.cursor = 'pointer'
        } else {
          canvasRef.current!.style.cursor = 'default'
        }
      }

      // Conectar esfera al API real
      const fetchStats = async () => {
        try {
          const res = await fetch('/api/kernel/stats')
          const data = await res.json()
          
          // Color según salud del sistema
          const health = Math.min(data.usersCount / 10, 1)
          coreMat.emissiveColor = new Color3(
            health < 0.5 ? 1 - health : 0,
            health * 0.5,
            0.8
          )
          
          // Tamaño según carga (sessions)
          const load = (data.sessionsCount || 0) / 10
          core.scaling.setAll(1 + load * 0.3)
          
          // Actualizar HUD
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('kernel-stats', { detail: data }))
          }
        } catch (e) {
          // Silenciar errores de fetch
        }
      }
      fetchStats()
      statsInterval = setInterval(fetchStats, 5000)

      // Pilares reactivos a eventos
      pillarInterval = setInterval(() => {
        const randomCol = scene.getMeshByName('col' + Math.floor(Math.random() * 7))
        if (randomCol) {
          const mat = randomCol.material as PBRMaterial
          mat.emissiveColor = new Color3(0, 0.8, 1)
          setTimeout(() => {
            mat.emissiveColor = new Color3(0, 0.1, 0.2)
          }, 800)
        }
      }, 3000)

      // Rotación lenta de cámara orbital
      let angle = 0
      scene.registerBeforeRender(() => {
        angle += 0.002
        camera.position.x = Math.sin(angle) * 25
        camera.position.z = Math.cos(angle) * 25
        camera.position.y = 8 + Math.sin(angle * 0.5) * 3
        camera.setTarget(new Vector3(0, 2, 0))
        
        // Núcleo pulsa
        const pulse = Math.sin(Date.now() * 0.002) * 0.3 + 1
        coreLight.intensity = 3 * pulse
      })

      engine.runRenderLoop(() => scene.render())
      window.addEventListener('resize', () => engine.resize())
    }

    init()
    
    // Cleanup
    return () => {
      clearInterval(statsInterval)
      clearInterval(pillarInterval)
      engine?.dispose()
      scene?.dispose()
    }
  }, [])

  const buttons = [
    { label: 'INIT SESSION', href: '/login', desc: 'AUTH REQUIRED' },
    { label: 'MODULES', href: '/artifacts', desc: '4 LOADED' },
    { label: 'CORE', href: '/kernel', desc: 'RESTRICTED' },
    { label: 'SHOP', href: '/shop', desc: 'DROP 01 ACTIVE' },
  ]

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#010108' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      
      {/* HUD overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none', fontFamily: 'Space Mono, monospace',
        color: '#00d4ff'
      }}>
        {/* Top left — Real data HUD */}
        <div style={{ position: 'absolute', top: 24, left: 24, fontSize: 11, letterSpacing: 3, opacity: 0.9 }}>
          <div>NEOPROXY OS // v0.2</div>
          <div style={{ marginTop: 8, fontSize: 10, color: '#00ff88' }}>NODES: {stats.nodes.toLocaleString()} // LIVE</div>
          <div style={{ marginTop: 2, fontSize: 10, color: '#00ff88' }}>SESSIONS: {stats.sessions} ACTIVE</div>
          <div style={{ marginTop: 2, fontSize: 10, color: '#00ff88' }}>COHERENCE: {stats.coherence.toFixed(1)}%</div>
          <div style={{ marginTop: 2, fontSize: 10, color: stats.latency > 50 ? '#ff4444' : '#00ff88' }}>
            LATENCY: {stats.latency}ms
          </div>
        </div>

        {/* Boot sequence / Center title */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', pointerEvents: 'auto'
        }}>
          {!booted ? (
            <div style={{
              fontSize: 12,
              letterSpacing: 2,
              color: '#00ff88',
              whiteSpace: 'pre-line',
              textAlign: 'left',
              lineHeight: 1.8
            }}>
              {bootText}
              <span style={{ animation: 'blink 1s infinite' }}>_</span>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
              <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: 12, opacity: 0.9,
                textShadow: '0 0 40px #00d4ff, 0 0 80px #6644aa' }}>
                NEOPROXY
              </div>
              <div style={{ fontSize: 11, letterSpacing: 8, color: '#6644aa', marginTop: 8 }}>
                SISTEMA AUTÓNOMO // REALIDAD ZERO
              </div>
              <div style={{ marginTop: 32, display: 'flex', gap: 16, justifyContent: 'center' }}>
                {buttons.map(({ label, href, desc }) => (
                  <div key={href} style={{ position: 'relative' }}>
                    <a href={href} style={{
                      border: '1px solid #00d4ff44',
                      padding: '8px 20px',
                      fontSize: 10,
                      letterSpacing: 4,
                      color: '#00d4ff',
                      textDecoration: 'none',
                      background: hoveredBtn === href ? '#00d4ff22' : '#00d4ff08',
                      transition: 'all 0.3s',
                      display: 'block'
                    }}
                    onMouseEnter={() => setHoveredBtn(href)}
                    onMouseLeave={() => setHoveredBtn(null)}
                    >{label}</a>
                    {hoveredBtn === href && (
                      <div style={{
                        position: 'absolute',
                        bottom: -18,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 9,
                        color: '#00ff88',
                        letterSpacing: 2,
                        whiteSpace: 'nowrap'
                      }}>{desc}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom right — system stats */}
        <div style={{ position: 'absolute', bottom: 24, right: 24, fontSize: 10, letterSpacing: 2, opacity: 0.5, textAlign: 'right' }}>
          <div>SYS://DARKPROXY</div>
          <div>LAT: -33.4° // LON: -70.6°</div>
          <div>SECTOR: ROMDO-01</div>
        </div>

        {/* Bottom left — scan line effect */}
        <div style={{ position: 'absolute', bottom: 24, left: 24, fontSize: 10, letterSpacing: 2, opacity: 0.4 }}>
          <div>ENTOGENES: ACTIVOS</div>
          <div>COGITO ERGO SUM</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
