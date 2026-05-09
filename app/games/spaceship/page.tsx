'use client'
import { useEffect, useRef, useState } from 'react'

export default function SpaceshipGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dim, setDim] = useState('RADIO WAVE')
  const [velocity, setVelocity] = useState(0)
  const [shield, setShield] = useState(100)
  const [score, setScore] = useState(0)
  const [freq, setFreq] = useState('3Hz')

  useEffect(() => {
    if (!canvasRef.current) return
    let engine: any

    const init = async () => {
      const B = await import('@babylonjs/core')
      engine = new B.Engine(canvasRef.current!, true)
      const scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0, 0, 0.01, 1)

      const camera = new B.FreeCamera('cam', new B.Vector3(0, 1, -8), scene)
      camera.setTarget(new B.Vector3(0, 0, 20))

      const glow = new B.GlowLayer('glow', scene)
      glow.intensity = 2

      // Espectro electromagnético completo
      const spectrum = [
        { name: 'RADIO WAVE',    freq: '3Hz–300MHz',   color: new B.Color3(0.2, 0.0, 0.5),  ring: 14, thickness: 0.3 },
        { name: 'MICROWAVE',     freq: '300MHz–300GHz', color: new B.Color3(0.0, 0.2, 0.8),  ring: 12, thickness: 0.25 },
        { name: 'INFRARED',      freq: '300GHz–400THz', color: new B.Color3(0.8, 0.1, 0.0),  ring: 10, thickness: 0.2 },
        { name: 'VISIBLE LIGHT', freq: '400–700THz',    color: new B.Color3(0.0, 1.0, 0.3),  ring: 9,  thickness: 0.15 },
        { name: 'ULTRAVIOLET',   freq: '700THz–30PHz',  color: new B.Color3(0.5, 0.0, 1.0),  ring: 8,  thickness: 0.12 },
        { name: 'X-RAY',         freq: '30PHz–30EHz',   color: new B.Color3(0.0, 0.8, 1.0),  ring: 7,  thickness: 0.08 },
        { name: 'GAMMA RAY',     freq: '>30EHz',        color: new B.Color3(1.0, 1.0, 1.0),  ring: 6,  thickness: 0.05 },
      ]

      // Nave
      const shipMat = new B.StandardMaterial('shipMat', scene)
      shipMat.emissiveColor = new B.Color3(0.1, 0.4, 0.6)
      const shipBody = B.MeshBuilder.CreateBox('ship', { width: 1.5, height: 0.35, depth: 2.5 }, scene)
      shipBody.material = shipMat
      const wingL = B.MeshBuilder.CreateBox('wL', { width: 2.5, height: 0.08, depth: 1.2 }, scene)
      wingL.position.x = -1.8; wingL.parent = shipBody; wingL.material = shipMat
      const wingR = B.MeshBuilder.CreateBox('wR', { width: 2.5, height: 0.08, depth: 1.2 }, scene)
      wingR.position.x = 1.8; wingR.parent = shipBody; wingR.material = shipMat

      // Motor glow
      const engineGlow = B.MeshBuilder.CreateSphere('eng', { diameter: 0.4 }, scene)
      engineGlow.position.z = -1.2; engineGlow.parent = shipBody
      const engMat = new B.StandardMaterial('engMat', scene)
      engMat.emissiveColor = new B.Color3(0, 0.8, 1)
      engineGlow.material = engMat

      // Luz principal
      const light = new B.PointLight('light', new B.Vector3(0, 5, 10), scene)
      light.diffuse = spectrum[0].color
      light.intensity = 6

      // Anillos — se adaptan al espectro actual
      const rings: any[] = []
      const ringMats: any[] = []
      for (let i = 0; i < 40; i++) {
        const ring = B.MeshBuilder.CreateTorus('ring' + i, {
          diameter: spectrum[0].ring,
          thickness: spectrum[0].thickness,
          tessellation: 80
        }, scene)
        ring.position.z = i * 7 + 15
        const mat = new B.StandardMaterial('rm' + i, scene)
        mat.emissiveColor = spectrum[0].color.clone()
        ring.material = mat
        rings.push(ring)
        ringMats.push(mat)
      }

      // Estrellas
      for (let i = 0; i < 400; i++) {
        const star = B.MeshBuilder.CreateSphere('s' + i, { diameter: 0.03 + Math.random() * 0.05 }, scene)
        star.position = new B.Vector3((Math.random()-0.5)*80, (Math.random()-0.5)*80, Math.random()*400)
        const mat = new B.StandardMaterial('sm' + i, scene)
        mat.emissiveColor = new B.Color3(1, 1, 1)
        star.material = mat
      }

      // Obstáculos con forma según espectro
      const obstacles: any[] = []
      const obsColors = [
        new B.Color3(1, 0.2, 0),
        new B.Color3(1, 0.5, 0),
        new B.Color3(0.8, 0, 0.8),
      ]
      for (let i = 0; i < 25; i++) {
        const mesh = B.MeshBuilder.CreatePolyhedron('obs' + i, { type: Math.floor(Math.random() * 5), size: 0.6 + Math.random() * 0.8 }, scene)
        mesh.position = new B.Vector3((Math.random()-0.5)*8, (Math.random()-0.5)*4, 40 + i * 14)
        const mat = new B.StandardMaterial('om' + i, scene)
        mat.emissiveColor = obsColors[i % obsColors.length]
        mesh.material = mat
        obstacles.push(mesh)
      }

      // Input
      const keys: Record<string, boolean> = {}
      window.addEventListener('keydown', e => { keys[e.key] = true; e.preventDefault() })
      window.addEventListener('keyup', e => keys[e.key] = false)

      let spd = 0.12
      let shipShield = 100
      let shipScore = 0
      let specIdx = 0
      let specTimer = 0

      scene.registerBeforeRender(() => {
        spd = Math.min(spd + 0.0002, 0.9)
        specTimer++
        setVelocity(Math.round(spd * 1000))

        // Cambio espectral automático cada 12 segundos
        if (specTimer % 720 === 0) {
          specIdx = (specIdx + 1) % spectrum.length
          const sp = spectrum[specIdx]
          light.diffuse = sp.color
          ringMats.forEach(m => m.emissiveColor = sp.color.clone())
          setDim(sp.name)
          setFreq(sp.freq)
          glow.intensity = specIdx === 6 ? 4 : 1.5 + specIdx * 0.3
        }

        // Mover nave
        const ms = 0.1
        if ((keys['ArrowLeft']  || keys['a'] || keys['A']) && shipBody.position.x > -5) shipBody.position.x -= ms
        if ((keys['ArrowRight'] || keys['d'] || keys['D']) && shipBody.position.x < 5)  shipBody.position.x += ms
        if ((keys['ArrowUp']    || keys['w'] || keys['W']) && shipBody.position.y < 4)  shipBody.position.y += ms
        if ((keys['ArrowDown']  || keys['s'] || keys['S']) && shipBody.position.y > -4) shipBody.position.y -= ms

        shipBody.rotation.z = keys['ArrowLeft'] || keys['a'] ? 0.35 : keys['ArrowRight'] || keys['d'] ? -0.35 : 0
        shipBody.rotation.x = keys['ArrowUp']   || keys['w'] ? -0.2 : keys['ArrowDown']  || keys['s'] ? 0.2  : 0

        // Cámara
        camera.position.x += (shipBody.position.x * 0.8 - camera.position.x) * 0.08
        camera.position.y += (shipBody.position.y + 1.5 - camera.position.y) * 0.08
        camera.position.z = shipBody.position.z - 9
        camera.setTarget(new B.Vector3(shipBody.position.x * 0.3, shipBody.position.y * 0.3, shipBody.position.z + 25))

        shipBody.position.z += spd

        // Anillos
        rings.forEach((r, i) => {
          r.rotation.z += 0.004 * (i % 2 === 0 ? 1 : -1)
          r.rotation.x += 0.001
          if (r.position.z < shipBody.position.z - 15) r.position.z += 40 * 7
        })

        // Obstáculos
        obstacles.forEach(obs => {
          obs.rotation.x += 0.018
          obs.rotation.y += 0.022
          if (obs.position.z < shipBody.position.z - 10) {
            obs.position.z = shipBody.position.z + 80 + Math.random() * 100
            obs.position.x = (Math.random()-0.5) * 8
            obs.position.y = (Math.random()-0.5) * 4
            shipScore += 10
            setScore(shipScore)
          }
          const dx = Math.abs(obs.position.x - shipBody.position.x)
          const dy = Math.abs(obs.position.y - shipBody.position.y)
          const dz = Math.abs(obs.position.z - shipBody.position.z)
          if (dx < 1.4 && dy < 1.1 && dz < 2.2) {
            shipShield = Math.max(0, shipShield - 8)
            setShield(shipShield)
            obs.position.z = shipBody.position.z + 60 + Math.random() * 80
            obs.position.x = (Math.random()-0.5) * 8
          }
        })
      })

      engine.runRenderLoop(() => scene.render())
      window.addEventListener('resize', () => engine.resize())
    }

    init()
    return () => { if (engine) engine.dispose() }
  }, [])

  const shieldColor = shield > 60 ? '#00d4ff' : shield > 30 ? '#ffaa00' : '#ff4444'

  return (
    <div style={{ position: 'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'#000' }}>
      <canvas ref={canvasRef} style={{ width:'100%', height:'100%', display:'block' }} />

      {/* HUD izquierda */}
      <div style={{
        position:'absolute', top:20, left:20,
        fontFamily:'Space Mono, monospace', fontSize:10,
        letterSpacing:3, lineHeight:2.2, color:'#00d4ff',
        pointerEvents:'none', textShadow:'0 0 10px #00d4ff'
      }}>
        <div style={{fontSize:12, marginBottom:4}}>NEOPROXY // EM DRIVE</div>
        <div style={{color:'#aaaaaa'}}>SPECTRUM: <span style={{color:'#00ffcc'}}>{dim}</span></div>
        <div style={{color:'#aaaaaa'}}>FREQ: <span style={{color:'#00ffcc'}}>{freq}</span></div>
        <div>VELOCITY: {velocity} AU/s</div>
        <div style={{color: shieldColor}}>SHIELD: {shield}%</div>
        <div style={{color:'#ffdd00'}}>SCORE: {score}</div>
        <div style={{color:'#ffffff22', fontSize:9, marginTop:8}}>WASD / ↑↓←→ DODGE</div>
      </div>

      {/* Espectro visual barra derecha */}
      <div style={{
        position:'absolute', top:20, right:20,
        fontFamily:'Space Mono, monospace', fontSize:9,
        letterSpacing:2, lineHeight:2.5, pointerEvents:'none'
      }}>
        {['GAMMA RAY','X-RAY','ULTRAVIOLET','VISIBLE','INFRARED','MICROWAVE','RADIO'].map((n,i) => {
          const colors = ['#ffffff','#00eeff','#8800ff','#00ff44','#ff4400','#0044ff','#220044']
          const active = dim.includes(n.split(' ')[0])
          return (
            <div key={n} style={{
              color: active ? colors[i] : colors[i] + '33',
              fontSize: active ? 10 : 8,
              textShadow: active ? `0 0 8px ${colors[i]}` : 'none',
              transition: 'all 0.3s'
            }}>
              {active ? '▶ ' : '  '}{n}
            </div>
          )
        })}
      </div>

      {shield === 0 && (
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          fontFamily:'Space Mono, monospace',
          color:'#ff4444', fontSize:22, letterSpacing:6,
          textAlign:'center', textShadow:'0 0 20px #ff4444'
        }}>
          SIGNAL LOST<br/>
          <span style={{fontSize:11, color:'#00d4ff'}}>SCORE: {score}</span><br/><br/>
          <a href="/games/spaceship" style={{fontSize:10, color:'#00d4ff66', letterSpacing:4}}>
            REINITIALIZE
          </a>
        </div>
      )}

      <a href="/" style={{
        position:'absolute', bottom:20, left:20,
        fontFamily:'monospace', color:'#00d4ff22',
        fontSize:10, letterSpacing:3, textDecoration:'none'
      }}>← EXIT</a>
    </div>
  )
}
