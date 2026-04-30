'use client'

import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { gsap } from 'gsap'
import styles from './ARCombatSystem.module.css'

// AR Combat System Component
function AREnemy({ position, onEliminate }: { 
  position: [number, number, number]
  onEliminate: () => void 
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [isHit, setIsHit] = useState(false)
  const [rotationSpeed] = useState(() => ({
    x: Math.random() * 0.02,
    y: Math.random() * 0.02,
    z: Math.random() * 0.02
  }))

  useFrame((state) => {
    if (!meshRef.current) return
    
    // Rotation animation
    meshRef.current.rotation.x += rotationSpeed.x
    meshRef.current.rotation.y += rotationSpeed.y
    meshRef.current.rotation.z += rotationSpeed.z
    
    // Hit animation
    if (isHit) {
      meshRef.current.scale.multiplyScalar(0.95)
      if (meshRef.current.scale.x < 0.1) {
        onEliminate()
      }
    }
  })

  const handleHit = () => {
    if (!isHit) {
      setIsHit(true)
      gsap.to(meshRef.current!.material, {
        emissiveIntensity: 2,
        duration: 0.2,
        yoyo: true,
        repeat: 1
      })
    }
  }

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleHit}
      onPointerOver={() => {
        document.body.style.cursor = 'crosshair'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
    >
      <octahedronGeometry args={[0.5]} />
      <meshStandardMaterial
        color="#cc0000"
        emissive="#660000"
        emissiveIntensity={0.3}
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}

function ARCrosshair() {
  return (
    <div className={styles.crosshair}>
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="25" fill="none" stroke="#cc0000" strokeWidth="1" opacity="0.8"/>
        <line x1="30" y1="10" x2="30" y2="50" stroke="#cc0000" strokeWidth="2"/>
        <line x1="10" y1="30" x2="50" y2="30" stroke="#cc0000" strokeWidth="2"/>
        <circle cx="30" cy="30" r="3" fill="#cc0000"/>
      </svg>
    </div>
  )
}

function ARHUD({ score, ammo, isReloading }: { 
  score: number
  ammo: number
  isReloading: boolean 
}) {
  return (
    <>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div>NEO·PROXY AR COMBAT</div>
        <div>SCORE: {score}</div>
      </div>

      {/* Bottom Left */}
      <div className={styles.bottomLeft}>
        <div>OPERATOR: DARKPROXY</div>
        <div>AR MODE: ACTIVE</div>
      </div>

      {/* Bottom Right */}
      <div className={styles.bottomRight}>
        <div>
          {isReloading ? 'RELOADING...' : `AMMO: ${ammo}/12`}
        </div>
      </div>

      {/* Crosshair */}
      <ARCrosshair />
    </>
  )
}

function ARScene({ onKill }: { onKill: () => void }) {
  const [enemies, setEnemies] = useState<Array<{ id: number, position: [number, number, number] }>>([])
  const groupRef = useRef<THREE.Group>(null)

  // Initialize enemies
  useEffect(() => {
    const initialEnemies = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4
      ] as [number, number, number]
    }))
    setEnemies(initialEnemies)
  }, [])

  const handleEliminate = (enemyId: number) => {
    setEnemies(prev => {
      const newEnemies = prev.filter(e => e.id !== enemyId)
      // Spawn new enemy
      setTimeout(() => {
        setEnemies(current => [
          ...current,
          {
            id: Date.now(),
            position: [
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.5) * 6,
              (Math.random() - 0.5) * 4
            ] as [number, number, number]
          }
        ])
      }, 500)
      return newEnemies
    })
    onKill()
  }

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <directionalLight position={5, 5, 5} intensity={0.5} />
      
      {enemies.map(enemy => (
        <AREnemy
          key={enemy.id}
          position={enemy.position}
          onEliminate={() => handleEliminate(enemy.id)}
        />
      ))}
    </group>
  )
}

export default function ARCombatSystem() {
  const [score, setScore] = useState(0)
  const [ammo, setAmmo] = useState(12)
  const [isReloading, setIsReloading] = useState(false)
  const [arSupported, setArSupported] = useState(false)

  // Check AR support
  useEffect(() => {
    const checkARSupport = async () => {
      if ('xr' in navigator) {
        try {
          const isSupported = await (navigator as any).xr.isSessionSupported('immersive-ar')
          setArSupported(isSupported)
        } catch (error) {
          console.log('AR not supported, falling back to 3D mode')
          setArSupported(false)
        }
      } else {
        setArSupported(false)
      }
    }
    checkARSupport()
  }, [])

  const handleKill = async () => {
    setScore(prev => prev + 100)
    setAmmo(prev => prev - 1)
    
    // Log kill to API
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `AR_KILL_${new Date().toISOString()}`,
          content: JSON.stringify({
            score: score + 100,
            timestamp: new Date().toISOString(),
            mode: arSupported ? 'AR' : '3D'
          })
        })
      })
    } catch (error) {
      console.log('Failed to log AR kill:', error)
    }
    
    // Auto reload when out of ammo
    if (ammo === 1) {
      setIsReloading(true)
      setTimeout(() => {
        setAmmo(12)
        setIsReloading(false)
      }, 2000)
    }
  }

  const handleClick = () => {
    if (!isReloading && ammo > 0) {
      // Visual feedback
      const canvas = document.querySelector('canvas')
      if (canvas) {
        gsap.to(canvas, {
          filter: 'brightness(1.5)',
          duration: 0.1,
          yoyo: true,
          repeat: 1
        })
      }
    }
  }

  return (
    <div className={styles.arContainer}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        onClick={handleClick}
        className={styles.arCanvas}
      >
        <ARScene onKill={handleKill} />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={3}
          maxDistance={10}
          autoRotate={false}
        />
      </Canvas>

      <ARHUD score={score} ammo={ammo} isReloading={isReloading} />

      {!arSupported && (
        <div className={styles.fallbackNotice}>
          AR not supported - Running in 3D mode
        </div>
      )}
    </div>
  )
}
