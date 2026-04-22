'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as BABYLON from '@babylonjs/core'

interface Particle {
  mesh: BABYLON.Mesh
  velocity: BABYLON.Vector3
  entropy: number
  basePos: BABYLON.Vector3
}

export default function EntropyPyramid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<BABYLON.Scene | null>(null)
  const engineRef = useRef<BABYLON.Engine | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const connectionsRef = useRef<BABYLON.Mesh[]>([])
  const frameCountRef = useRef(0)

  const fibonacci = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765]

  const cleanup = useCallback(() => {
    connectionsRef.current.forEach(mesh => mesh.dispose())
    connectionsRef.current = []
    particlesRef.current.forEach(p => p.mesh.dispose())
    particlesRef.current = []
    sceneRef.current?.dispose()
    engineRef.current?.dispose()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: false,
      stencil: false,
      antialias: true
    })
    engineRef.current = engine

    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.03, 1)
    sceneRef.current = scene

    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 4,
      Math.PI / 3,
      15,
      BABYLON.Vector3.Zero(),
      scene
    )
    camera.attachControl(canvas, true)
    camera.lowerRadiusLimit = 8
    camera.upperRadiusLimit = 25
    camera.wheelPrecision = 50

    const hemiLight = new BABYLON.HemisphericLight(
      'hemi',
      new BABYLON.Vector3(0, 1, 0),
      scene
    )
    hemiLight.intensity = 0.4
    hemiLight.diffuse = new BABYLON.Color3(0.8, 0.2, 0.2)

    const pointLight = new BABYLON.PointLight(
      'point',
      new BABYLON.Vector3(0, 5, 0),
      scene
    )
    pointLight.diffuse = new BABYLON.Color3(0.8, 0, 0)
    pointLight.intensity = 2
    pointLight.range = 20

    const H = 4.0
    const BASE = 2.5
    const centerY = H / 4
    const apex = new BABYLON.Vector3(0, H - centerY, 0)

    const wireMat = new BABYLON.StandardMaterial('wireMat', scene)
    wireMat.emissiveColor = new BABYLON.Color3(0.8, 0, 0)
    wireMat.alpha = 0.9

    const baseVerts = [
      new BABYLON.Vector3(-BASE, -centerY, -BASE),
      new BABYLON.Vector3(BASE, -centerY, -BASE),
      new BABYLON.Vector3(BASE, -centerY, BASE),
      new BABYLON.Vector3(-BASE, -centerY, BASE),
    ]

    for (let i = 0; i < 4; i++) {
      const tube = BABYLON.MeshBuilder.CreateTube(
        `baseEdge${i}`,
        {
          path: [baseVerts[i], baseVerts[(i + 1) % 4]],
          radius: 0.02,
          tessellation: 6
        },
        scene
      )
      tube.material = wireMat
    }

    for (let i = 0; i < 4; i++) {
      const tube = BABYLON.MeshBuilder.CreateTube(
        `apexEdge${i}`,
        {
          path: [baseVerts[i], apex],
          radius: 0.02,
          tessellation: 6
        },
        scene
      )
      tube.material = wireMat
    }

    const isInsidePyramid = (pos: BABYLON.Vector3): boolean => {
      const localY = pos.y + centerY
      if (localY < -centerY || localY > apex.y) return false
      
      const heightRatio = (apex.y - localY) / H
      const maxRadius = heightRatio * BASE
      const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z)
      return dist <= maxRadius
    }

    const calculateEntropy = (pos: BABYLON.Vector3): number => {
      const distFromCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z)
      const maxRadius = BASE * 0.9
      const p = Math.min(distFromCenter / maxRadius, 0.999)
      return -p * Math.log(p + 0.001)
    }

    const particles: Particle[] = []
    const particleMat = new BABYLON.StandardMaterial('particleMat', scene)
    particleMat.emissiveColor = new BABYLON.Color3(0.9, 0.1, 0.1)

    for (let i = 0; i < 40; i++) {
      const t = Math.random()
      const maxR = (1 - t) * BASE * 0.75
      const r = Math.random() * maxR
      const angle = Math.random() * Math.PI * 2
      const y = apex.y - t * H * 0.85

      const pos = new BABYLON.Vector3(
        Math.cos(angle) * r,
        y,
        Math.sin(angle) * r
      )

      const fibIndex = i % fibonacci.length
      const size = 0.03 + (fibonacci[fibIndex] / 6765) * 0.12

      const sphere = BABYLON.MeshBuilder.CreateSphere(
        `particle${i}`,
        { diameter: size * 2, segments: 8 },
        scene
      )
      sphere.position = pos.clone()
      sphere.material = particleMat

      particles.push({
        mesh: sphere,
        velocity: new BABYLON.Vector3(
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.015
        ),
        entropy: calculateEntropy(pos),
        basePos: pos.clone()
      })
    }
    particlesRef.current = particles

    const rebuildConnections = () => {
      connectionsRef.current.forEach(mesh => mesh.dispose())
      connectionsRef.current = []

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = BABYLON.Vector3.Distance(
            particles[i].mesh.position,
            particles[j].mesh.position
          )

          if (dist < 1.5) {
            const avgEntropy = (particles[i].entropy + particles[j].entropy) / 2
            const tubeRadius = 0.005 + avgEntropy * 0.04

            const fibIndex = (i + j) % fibonacci.length
            const opacity = 0.2 + (fibonacci[fibIndex] / 6765) * 0.6

            const tube = BABYLON.MeshBuilder.CreateTube(
              `connection_${i}_${j}`,
              {
                path: [particles[i].mesh.position, particles[j].mesh.position],
                radius: tubeRadius,
                tessellation: 5
              },
              scene
            )

            const mat = new BABYLON.StandardMaterial(`connMat_${i}_${j}`, scene)
            mat.emissiveColor = new BABYLON.Color3(0.7, 0, 0)
            mat.alpha = opacity
            tube.material = mat

            connectionsRef.current.push(tube)
          }
        }
      }
    }

    rebuildConnections()

    engine.runRenderLoop(() => {
      frameCountRef.current++

      particles.forEach(particle => {
        particle.mesh.position.x += particle.velocity.x
        particle.mesh.position.y += particle.velocity.y
        particle.mesh.position.z += particle.velocity.z

        particle.velocity.x += (Math.random() - 0.5) * 0.0008
        particle.velocity.y += (Math.random() - 0.5) * 0.0008
        particle.velocity.z += (Math.random() - 0.5) * 0.0008

        particle.velocity.x = Math.max(-0.025, Math.min(0.025, particle.velocity.x))
        particle.velocity.y = Math.max(-0.025, Math.min(0.025, particle.velocity.y))
        particle.velocity.z = Math.max(-0.025, Math.min(0.025, particle.velocity.z))

        if (!isInsidePyramid(particle.mesh.position)) {
          particle.mesh.position.x -= particle.velocity.x * 2
          particle.mesh.position.y -= particle.velocity.y * 2
          particle.mesh.position.z -= particle.velocity.z * 2

          particle.velocity.x *= -0.7
          particle.velocity.y *= -0.7
          particle.velocity.z *= -0.7
        }

        particle.entropy = calculateEntropy(particle.mesh.position)
      })

      if (frameCountRef.current % 45 === 0) {
        rebuildConnections()
      }

      scene.meshes.forEach(mesh => {
        if (!mesh.name.startsWith('camera')) {
          mesh.rotation.y += 0.001
        }
      })

      scene.render()
    })

    const handleResize = () => engine.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cleanup()
    }
  }, [cleanup])

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#050505',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        fontFamily: 'monospace',
        fontSize: '11px',
        letterSpacing: '0.25em',
        color: '#cc0000',
        pointerEvents: 'none',
        textShadow: '0 0 10px #cc0000'
      }}>
        NEO·PROXY // ENTROPY·SYSTEM
      </div>

      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        fontFamily: 'monospace',
        fontSize: '9px',
        letterSpacing: '0.15em',
        color: '#660000',
        pointerEvents: 'none',
        textAlign: 'right'
      }}>
        PARTICLES: 40<br/>
        CONNECTIONS: DYNAMIC<br/>
        REBUILD: 45 FRAMES
      </div>

      <div style={{
        position: 'absolute',
        bottom: '1rem',
        left: '1rem',
        fontFamily: 'monospace',
        fontSize: '9px',
        letterSpacing: '0.15em',
        color: '#440000',
        pointerEvents: 'none'
      }}>
        ENTROPY = -p·log(p)<br/>
        TUBE_RADIUS = 0.005 + entropy × 0.04
      </div>

      <div style={{
        position: 'absolute',
        bottom: '1rem',
        right: '1rem',
        fontFamily: 'monospace',
        fontSize: '9px',
        letterSpacing: '0.15em',
        color: '#330000',
        pointerEvents: 'none'
      }}>
        PYRAMID_WIREFRAME: #cc0000
      </div>
    </div>
  )
}
