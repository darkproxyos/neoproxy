import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

interface EspadaProxyProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  active?: boolean;
}

export default function EspadaProxy({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 1,
  active = false 
}: EspadaProxyProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [bladeGlow, setBladeGlow] = useState(0);
  const [energyFlow, setEnergyFlow] = useState(0);
  const [time, setTime] = useState(0);

  // Animación de energía
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      setTime(t);
      // Flujo de energía a lo largo de la hoja
      setEnergyFlow((prev) => (prev + 0.02) % 1);
      
      // Brillo pulsante cuando está activa
      if (active) {
        setBladeGlow((prev) => (prev + 0.05) % 1);
      }
    }
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Hoja principal */}
      <mesh ref={meshRef}>
        <boxGeometry args={[0.05, 2.5, 0.8]} />
        <meshStandardMaterial
          color={active ? "#00ffff" : "#004444"}
          emissive={active ? "#00ffff" : "#002222"}
          emissiveIntensity={active ? 0.8 + bladeGlow * 0.2 : 0.1}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Circuitos energéticos */}
      <group>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh
            key={i}
            position={[
              Math.sin((energyFlow + i * 0.25) * Math.PI * 2) * 0.3,
              1.2 - i * 0.3,
              Math.cos((energyFlow + i * 0.25) * Math.PI * 2) * 0.3
            ]}
          >
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={active ? 2 : 0.5}
            />
          </mesh>
        ))}
      </group>

      {/* Guardia holográfica */}
      <mesh position={[0, 1.3, 0]}>
        <ringGeometry args={[0.3, 0.5, 8]} />
        <meshStandardMaterial
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Mango tradicional con display */}
      <group position={[0, 0, 0]}>
        {/* Núcleo del mango */}
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
          <meshStandardMaterial
            color="#222222"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>

        {/* Display OLED */}
        <mesh position={[0.1, 0.2, 0]}>
          <boxGeometry args={[0.15, 0.08, 0.02]} />
          <meshStandardMaterial
            color="#001100"
            emissive="#00ff00"
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Texto en display */}
        <Text
          position={[0.1, 0.2, 0.02]}
          fontSize={0.03}
          color="#00ff00"
          anchorX="center"
          anchorY="middle"
        >
          {active ? "ACTIVE" : "STANDBY"}
        </Text>
      </group>

      {/* Pomo de energía */}
      <mesh position={[0, -0.7, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={active ? 1 : 0.2}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Partículas flotantes */}
      <group>
        {Array.from({ length: 20 }).map((_, i) => (
          <mesh
            key={i}
            position={[
              Math.sin(i * 0.5 + time) * 0.5,
              Math.cos(i * 0.3 + time) * 0.5,
              Math.sin(i * 0.7 + time) * 0.5
            ]}
          >
            <sphereGeometry args={[0.005, 4, 4]} />
            <meshBasicMaterial
              color="#00ffff"
              transparent
              opacity={0.6}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
