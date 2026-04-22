'use client'
import { useEffect, useRef } from 'react'

export default function WiredGame() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    // Initialize NeoProxy systems
    const coherenceSystem = new CoherenceSystem()
    const memoryBridge = new MemoryBridge(coherenceSystem)
    
    // Track coherence for HUD
    let currentCoherence = coherenceSystem.getCoherence()
    let currentState = coherenceSystem.getState()
    
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    s.async = true
    s.onload = () => {
      if (!ref.current || !window.THREE) return
      const THREE = window.THREE
      const W = window.innerWidth, H = window.innerHeight

      const renderer = new THREE.WebGLRenderer({ canvas: ref.current, antialias: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000)

      const scene = new THREE.Scene()
      scene.fog = new THREE.FogExp2(0x000000, 0.04)

      const camera = new THREE.PerspectiveCamera(75, W/H, 0.1, 500)
      camera.position.set(0, 0, 0)

      const gridMat = new THREE.LineBasicMaterial({ color: 0x330000, transparent: true, opacity: 0.4 })
      const gridGroup = new THREE.Group()
      for (let i = -20; i <= 20; i++) {
        const hGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-200, i * 3, 0),
          new THREE.Vector3(200, i * 3, 0)
        ])
        gridGroup.add(new THREE.Line(hGeo, gridMat))
        const vGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(i * 3, -200, 0),
          new THREE.Vector3(i * 3, 200, 0)
        ])
        gridGroup.add(new THREE.Line(vGeo, gridMat))
      }
      scene.add(gridGroup)

      const tunnelMat = new THREE.MeshBasicMaterial({ color: 0xcc0000, wireframe: true, transparent: true, opacity: 0.15 })
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(Math.cos(angle)*20, Math.sin(angle)*20, 0),
          new THREE.Vector3(Math.cos(angle)*15, Math.sin(angle)*15, -100),
          new THREE.Vector3(Math.cos(angle+0.5)*10, Math.sin(angle+0.5)*10, -200),
          new THREE.Vector3(0, 0, -300)
        ])
        const geo = new THREE.TubeGeometry(curve, 20, 0.3, 4, false)
        scene.add(new THREE.Mesh(geo, tunnelMat))
      }

      const nodeMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
      const nodes = []
      for (let i = 0; i < 60; i++) {
        const geo = new THREE.IcosahedronGeometry(Math.random()*0.5+0.2, 0)
        const mesh = new THREE.Mesh(geo, nodeMat)
        mesh.position.set((Math.random()-0.5)*80, (Math.random()-0.5)*40, -Math.random()*200 - 10)
        mesh.userData = { rotX: (Math.random()-0.5)*0.02, rotY: (Math.random()-0.5)*0.02 }
        scene.add(mesh)
        nodes.push(mesh)
      }

      const vel = new THREE.Vector3()
      const rot = new THREE.Euler(0, 0, 0, 'YXZ')
      let speed = 0
      const FRICTION = 0.96, THRUST = 0.08, MAX_SPEED = 2.0, TURN_SPEED = 0.04
      const keys = {}
      window.addEventListener('keydown', e => keys[e.code] = true)
      window.addEventListener('keyup', e => keys[e.code] = false)

      const trailGeo = new THREE.BufferGeometry()
      const trailPositions = new Float32Array(300 * 3)
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
      const trailMat = new THREE.PointsMaterial({ color: 0xff0000, size: 0.15, transparent: true, opacity: 0.6 })
      const trail = new THREE.Points(trailGeo, trailMat)
      scene.add(trail)
      let trailIdx = 0

      scene.add(new THREE.AmbientLight(0x110000))
      const redLight = new THREE.PointLight(0xff0000, 2, 20)
      scene.add(redLight)

      const hudCanvas = document.createElement('canvas')
      hudCanvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:10;'
      hudCanvas.width = W; hudCanvas.height = H
      document.body.appendChild(hudCanvas)
      const hud = hudCanvas.getContext('2d')

      function drawHUD(spd: number, coherence: number, state: string) {
        hud.clearRect(0, 0, W, H)
        hud.strokeStyle = '#cc0000'
        hud.lineWidth = 1
        hud.globalAlpha = 0.8
        hud.beginPath()
        hud.moveTo(W/2-15, H/2); hud.lineTo(W/2-5, H/2)
        hud.moveTo(W/2+5, H/2); hud.lineTo(W/2+15, H/2)
        hud.moveTo(W/2, H/2-15); hud.lineTo(W/2, H/2-5)
        hud.moveTo(W/2, H/2+5); hud.lineTo(W/2, H/2+15)
        hud.stroke()
        hud.fillStyle = '#cc0000'
        hud.globalAlpha = 0.6
        hud.fillRect(20, H-40, (spd/MAX_SPEED)*150, 4)
        hud.strokeRect(20, H-40, 150, 4)
        
        // Coherence bar
        const coherenceColor = coherence > 60 ? '#00ff00' : coherence > 40 ? '#ffaa00' : '#ff0000'
        hud.fillStyle = coherenceColor
        hud.fillRect(20, H-60, (coherence/100)*150, 4)
        hud.strokeRect(20, H-60, 150, 4)
        
        hud.font = '10px monospace'
        hud.fillStyle = '#cc0000'
        hud.globalAlpha = 0.5
        hud.fillText('THE WIRED // VELOCITY: ' + spd.toFixed(2), 20, H-50)
        hud.fillText('COHERENCE: ' + coherence.toFixed(0) + '% [' + state + ']', 20, H-75)
      }

      const clock = new THREE.Clock()
      
      // Node absorption handler
      function onNodeAbsorbed(nodeType: string, value: number) {
        coherenceSystem.absorbNode(value)
        memoryBridge.pushEvent({ type: 'NODE_ABSORBED', nodeType, value })
        currentCoherence = coherenceSystem.getCoherence()
        currentState = coherenceSystem.getState()
      }
      
      // Dissolution handler
      function onDissolution(position: {x: number, y: number, z: number}) {
        memoryBridge.pushEvent({
          type: 'DISSOLUTION',
          position
        })
        memoryBridge.dispose()
      }
      
      // Session start
      memoryBridge.pushEvent({ type: 'SESSION_START' })
      
      function animate() {
        requestAnimationFrame(animate)
        const dt = clock.getDelta()
        
        // Check for dissolution state
        if (currentState === 'DISSOLVED') {
          onDissolution({x: camera.position.x, y: camera.position.y, z: camera.position.z})
          // Reset player
          camera.position.set(0, 0, 0)
          coherenceSystem['coherence'] = 100
          coherenceSystem['updateState']()
          currentCoherence = 100
          currentState = 'STABLE'
        }

        if (keys['ArrowLeft'] || keys['KeyA']) rot.y += TURN_SPEED
        if (keys['ArrowRight'] || keys['KeyD']) rot.y -= TURN_SPEED
        if (keys['ArrowUp'] || keys['KeyW']) rot.x += TURN_SPEED * 0.7
        if (keys['ArrowDown'] || keys['KeyS']) rot.x -= TURN_SPEED * 0.7
        if (keys['Space']) speed += THRUST
        if (keys['ShiftLeft']) speed -= THRUST * 0.5

        speed = Math.max(-MAX_SPEED*0.3, Math.min(MAX_SPEED, speed))
        speed *= FRICTION

        const forward = new THREE.Vector3(0, 0, -1)
        forward.applyEuler(rot)
        camera.position.addScaledVector(forward, speed)
        camera.rotation.copy(rot)

        trailPositions[trailIdx*3] = camera.position.x
        trailPositions[trailIdx*3+1] = camera.position.y
        trailPositions[trailIdx*3+2] = camera.position.z
        trailIdx = (trailIdx + 1) % 100
        trailGeo.attributes.position.needsUpdate = true
        redLight.position.copy(camera.position)

        nodes.forEach(n => {
          n.rotation.x += n.userData.rotX
          n.rotation.y += n.userData.rotY
          
          // Check for node absorption (collision)
          const dist = n.position.distanceTo(camera.position)
          if (dist < 2.5) {
            // Determine node type and value
            const isCorrupt = Math.random() > 0.7
            const nodeType = isCorrupt ? 'CORRUPT' : 'MEMORY'
            const value = isCorrupt ? -20 : 15
            
            onNodeAbsorbed(nodeType, value)
            
            // Recycle node
            n.position.z = camera.position.z - 200
            n.position.x = (Math.random()-0.5)*80
            n.position.y = (Math.random()-0.5)*40
          }
          
          if (n.position.z > camera.position.z + 20) {
            n.position.z = camera.position.z - 200
            n.position.x = (Math.random()-0.5)*80
            n.position.y = (Math.random()-0.5)*40
          }
        })
        gridGroup.position.z = camera.position.z

        drawHUD(Math.abs(speed), currentCoherence, currentState)
        renderer.render(scene, camera)
      }
      animate()

      window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight)
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
      })

      return () => { hudCanvas.remove() }
    }
    document.body.appendChild(s)
  }, [])

  return <canvas ref={ref} style={{width:'100vw',height:'100vh',display:'block',background:'#000'}}/>
}
