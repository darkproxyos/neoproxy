'use client'

import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { gsap } from 'gsap'
import styles from './ConstellationNavigation.module.css'

// Node positions in 3D space
const NODE_POSITIONS = {
  KERNEL: { x: 0, y: 0, z: 0, scale: 1.2, color: '#ff0000' },
  AGENTS: { x: -6, y: 3, z: 0, scale: 0.8, color: '#00ff9c' },
  MODELS: { x: 0, y: 8, z: 0, scale: 1.0, color: '#3aa8ff' },
  LAB: { x: 6, y: 3, z: 0, scale: 0.9, color: '#ff6b6b' },
  PORTAL: { x: 0, y: -6, z: 0, scale: 0.7, color: '#ffd93d' }
}

interface NetworkNodeProps {
  name: string
  position: typeof NODE_POSITIONS[keyof typeof NODE_POSITIONS]
  onClick: (name: string) => void
  isHovered: boolean
  onHover: (name: string | null) => void
}

function NetworkNode({ name, position, onClick, isHovered, onHover }: NetworkNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [pulsePhase, setPulsePhase] = useState(0)

  useFrame((state) => {
    if (!meshRef.current) return

    // Pulse animation
    setPulsePhase(prev => prev + 0.02)
    const pulseScale = position.scale + Math.sin(pulsePhase) * 0.1
    meshRef.current.scale.setScalar(pulseScale)

    // Magnetic repulsion from mouse
    if (isHovered) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.8
    } else {
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.3
    }

    // Gentle floating
    meshRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime + position.x) * 0.1
  })

  const handleClick = () => {
    onClick(name)
    if (meshRef.current) {
      gsap.to(meshRef.current.scale, {
        x: position.scale * 1.5,
        y: position.scale * 1.5,
        z: position.scale * 1.5,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      })
    }
  }

  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y, position.z]}
      onClick={handleClick}
      onPointerOver={() => onHover(name)}
      onPointerOut={() => onHover(null)}
    >
      <sphereGeometry args={[position.scale, 32, 32]} />
      <meshStandardMaterial
        color={position.color}
        emissive={position.color}
        emissiveIntensity={0.3}
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}

function ConnectionLine({ from, to }: { from: typeof NODE_POSITIONS[keyof typeof NODE_POSITIONS], to: typeof NODE_POSITIONS[keyof typeof NODE_POSITIONS] }) {
  const lineRef = useRef<THREE.Line>(null)
  const [pulsePosition, setPulsePosition] = useState(0)

  useFrame(() => {
    setPulsePosition(prev => (prev + 0.01) % 1)
    
    if (lineRef.current) {
      // Animate pulse along the line
      const material = lineRef.current.material as THREE.LineBasicMaterial
      material.opacity = 0.3 + Math.sin(pulsePosition * Math.PI) * 0.2
    }
  })

  const points = []
  points.push(new THREE.Vector3(from.x, from.y, from.z))
  points.push(new THREE.Vector3(to.x, to.y, to.z))

  const geometry = new THREE.BufferGeometry().setFromPoints(points)

  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ 
      color: "#00ff9c",
      transparent: true,
      opacity: 0.3
    }))} ref={lineRef} />
  )
}

function DataPulse({ from, to }: { from: THREE.Vector3, to: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [progress, setProgress] = useState(0)

  useFrame(() => {
    setProgress(prev => {
      const newProgress = prev + 0.02
      if (newProgress >= 1) return 0 // Reset pulse
      
      if (meshRef.current) {
        const currentPos = new THREE.Vector3().lerpVectors(from, to, newProgress)
        meshRef.current.position.copy(currentPos)
        meshRef.current.scale.setScalar(0.2 + Math.sin(newProgress * Math.PI) * 0.1)
      }
      
      return newProgress
    })
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial
        color="#3aa8ff"
        emissive="#3aa8ff"
        emissiveIntensity={1}
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}

function SerpentNetwork() {
  const groupRef = useRef<THREE.Group>(null)
  const [isTransforming, setIsTransforming] = useState(false)

  const triggerSerpentTransformation = () => {
    if (isTransforming) return
    setIsTransforming(true)

    // Animate nodes into serpent formation
    const serpentPath: Array<{x: number, y: number, z: number}> = []
    for (let i = 0; i < 5; i++) {
      serpentPath.push({
        x: Math.sin(i * 0.5) * 3,
        y: i * 2 - 4,
        z: Math.cos(i * 0.5) * 2
      })
    }

    Object.entries(NODE_POSITIONS).forEach(([name, pos], index) => {
      const targetPos = serpentPath[index]
      if (targetPos && groupRef.current) {
        const node = groupRef.current.children[index]
        if (node) {
          gsap.to(node.position, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration: 1,
            delay: index * 0.1,
            ease: "power2.inOut"
          })
        }
      }
    })

    // Reset after transformation
    setTimeout(() => {
      Object.entries(NODE_POSITIONS).forEach(([name, pos], index) => {
        if (groupRef.current) {
          const node = groupRef.current.children[index]
          if (node) {
            gsap.to(node.position, {
              x: pos.x,
              y: pos.y,
              z: pos.z,
              duration: 1,
              delay: index * 0.1,
              ease: "power2.inOut"
            })
          }
        }
      })
      setIsTransforming(false)
    }, 4000)
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      if (scrollY > 100 && !isTransforming) {
        triggerSerpentTransformation()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isTransforming])

  return null // This component manages the serpent transformation
}

function Scene({ onNodeClick, hoveredNode, onHover }: {
  onNodeClick: (name: string) => void
  hoveredNode: string | null
  onHover: (name: string | null) => void
}) {
  const groupRef = useRef<THREE.Group>(null)

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      
      <group ref={groupRef}>
        {Object.entries(NODE_POSITIONS).map(([name, position]) => (
          <NetworkNode
            key={name}
            name={name}
            position={position}
            onClick={onNodeClick}
            isHovered={hoveredNode === name}
            onHover={onHover}
          />
        ))}
      </group>

      {/* Connections between nodes */}
      <ConnectionLine from={NODE_POSITIONS.KERNEL} to={NODE_POSITIONS.AGENTS} />
      <ConnectionLine from={NODE_POSITIONS.KERNEL} to={NODE_POSITIONS.MODELS} />
      <ConnectionLine from={NODE_POSITIONS.KERNEL} to={NODE_POSITIONS.LAB} />
      <ConnectionLine from={NODE_POSITIONS.KERNEL} to={NODE_POSITIONS.PORTAL} />

      {/* Data pulses */}
      <DataPulse 
        from={new THREE.Vector3(NODE_POSITIONS.KERNEL.x, NODE_POSITIONS.KERNEL.y, NODE_POSITIONS.KERNEL.z)}
        to={new THREE.Vector3(NODE_POSITIONS.AGENTS.x, NODE_POSITIONS.AGENTS.y, NODE_POSITIONS.AGENTS.z)}
      />
      <DataPulse 
        from={new THREE.Vector3(NODE_POSITIONS.KERNEL.x, NODE_POSITIONS.KERNEL.y, NODE_POSITIONS.KERNEL.z)}
        to={new THREE.Vector3(NODE_POSITIONS.MODELS.x, NODE_POSITIONS.MODELS.y, NODE_POSITIONS.MODELS.z)}
      />

      <SerpentNetwork />
    </>
  )
}

function CameraController({ targetNode }: { targetNode: string | null }) {
  const { camera } = useThree()
  
  useEffect(() => {
    if (targetNode && NODE_POSITIONS[targetNode as keyof typeof NODE_POSITIONS]) {
      const target = NODE_POSITIONS[targetNode as keyof typeof NODE_POSITIONS]
      gsap.to(camera.position, {
        x: target.x * 1.5,
        y: target.y * 1.5,
        z: target.z + 10,
        duration: 1.5,
        ease: "power2.inOut"
      })
    } else {
      // Return to default orbit
      gsap.to(camera.position, {
        x: 0,
        y: 0,
        z: 15,
        duration: 1.5,
        ease: "power2.inOut"
      })
    }
  }, [targetNode, camera])

  return null
}

export default function ConstellationNavigation() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const handleNodeClick = (nodeName: string) => {
    setSelectedNode(nodeName)
    // Navigate to the corresponding page
    const routes: Record<string, string> = {
      'KERNEL': '/kernel',
      'AGENTS': '/agents',
      'MODELS': '/npos/fabrication',
      'LAB': '/npos/lab',
      'PORTAL': '/portal'
    }
    
    const route = routes[nodeName] || '/'
    window.location.href = route
  }

  return (
    <div className={styles.constellationContainer}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 75 }}
        className={styles.canvas}
      >
        <PerspectiveCamera makeDefault />
        <Scene 
          onNodeClick={handleNodeClick}
          hoveredNode={hoveredNode}
          onHover={setHoveredNode}
        />
        <CameraController targetNode={selectedNode} />
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={10}
          maxDistance={30}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className={styles.uiOverlay}>
        <div className={styles.title}>
          <h1>NEOPROXY</h1>
          <p>Living Network</p>
        </div>

        {hoveredNode && (
          <div className={styles.nodeInfo}>
            <h3>{hoveredNode}</h3>
            <p>Click to enter</p>
          </div>
        )}

        <div className={styles.instructions}>
          <p>Scroll to activate • Drag to rotate • Click nodes to explore</p>
        </div>
      </div>
    </div>
  )
}
