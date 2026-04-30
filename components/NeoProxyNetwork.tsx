import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Sphere, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';

// =========================================
// NEOPROXY 3D MAP - UNIFIED EXPERIENCE
// =========================================

// Node Configuration - UNIFIED SPATIAL MAP
const NODES_CONFIG: Record<string, any> = {
  KERNEL: {
    position: [0, 0, 0],
    radius: 2.0,
    importance: 10,
    color: '#ff0000', // Más impactante según windsurf
    label: 'KERNEL',
    behavior: 'central_pulse'
  },
  AGENTS: {
    position: [-6, 3, 0], // Más cerca para mejor UX
    radius: 1.5,
    importance: 8,
    color: '#00ff9c',
    label: 'AGENTS',
    behavior: 'network_sync'
  },
  MODELS: {
    position: [0, 8, 0], // Posición superior para jerarquía visual
    radius: 1.5,
    importance: 8,
    color: '#3aa8ff',
    label: 'MODELS',
    behavior: 'geometry_rotation'
  },
  LAB: {
    position: [6, 3, 0], // Simétrico con AGENTS
    radius: 1.3,
    importance: 6,
    color: '#ff6b6b', // Más rojizo para energía
    label: 'LAB',
    behavior: 'particle_emission'
  },
  PORTAL: {
    position: [0, -6, 0], // Abajo para "salida"
    radius: 1.0,
    importance: 7,
    color: '#ffd93d', // Dorado para portal dimensional
    label: 'PORTAL',
    behavior: 'dimensional_rift'
  }
};

// Connection Configuration - UNIFIED NETWORK
const CONNECTIONS_CONFIG = [
  { from: 'KERNEL', to: 'AGENTS', type: 'primary' },
  { from: 'KERNEL', to: 'MODELS', type: 'primary' },
  { from: 'KERNEL', to: 'LAB', type: 'secondary' },
  { from: 'KERNEL', to: 'PORTAL', type: 'primary' },
  { from: 'AGENTS', to: 'MODELS', type: 'data_flow' },
  { from: 'MODELS', to: 'LAB', type: 'creative_flow' },
  { from: 'LAB', to: 'PORTAL', type: 'output_flow' }
];

const CONNECTION_TYPES: Record<string, any> = {
  primary: { width: 0.05, color: '#00ff9c', pulseSpeed: 2.0, opacity: 0.8 },
  secondary: { width: 0.03, color: '#3aa8ff', pulseSpeed: 1.5, opacity: 0.6 },
  tertiary: { width: 0.02, color: '#666666', pulseSpeed: 1.0, opacity: 0.4 },
  data_flow: { width: 0.04, color: '#ff6b35', pulseSpeed: 3.0, opacity: 0.7, animated: true },
  creative_flow: { width: 0.04, color: '#ffaa00', pulseSpeed: 2.5, opacity: 0.7, animated: true },
  output_flow: { width: 0.04, color: '#ffffff', pulseSpeed: 1.8, opacity: 0.7, animated: true }
};

// =========================================
// SERPENT NETWORK TRANSFORMATION - WOW MOMENT
// =========================================

class SerpentTransformation {
  nodes: { [key: string]: any }
  onComplete: () => void
  phases: string[]
  duration: number
  currentPhase: number
  isActive: boolean

  constructor(nodes: { [key: string]: any }, onComplete: () => void) {
    this.nodes = nodes;
    this.onComplete = onComplete;
    this.phases = ['dissolve', 'reform', 'epic_moment', 'dissolve_to_nodes'];
    this.duration = 4000;
    this.currentPhase = 0;
    this.isActive = false;
  }

  activate() {
    if (this.isActive) return;
    this.isActive = true;
    this.startTransformation();
  }

  startTransformation() {
    // Fase 1: Disolver nodos
    this.dissolveNodes(1000);

    // Fase 2: Reformar como serpiente
    setTimeout(() => this.reformAsSerpent(2000), 500);

    // Fase 3: Momento épico
    setTimeout(() => this.epicFlash(2000), 1500);

    // Fase 4: Disolución elegante
    setTimeout(() => this.dissolveToConstellation(1000), 3500);
  }

  dissolveNodes(duration: number) {
    const serpentPath = this.generateSerpentPath();
    Object.keys(this.nodes).forEach((nodeKey, i) => {
      const node = (this.nodes as any)[nodeKey];
      if (node.meshRef?.current) {
        gsap.to(node.meshRef.current.position, {
          x: serpentPath[i]?.x || 0,
          y: serpentPath[i]?.y || 0,
          z: serpentPath[i]?.z || 0,
          duration: duration / 1000,
          ease: "power2.inOut"
        });
      }
    });
  }

  generateSerpentPath() {
    return [
      { x: -8, y: 0, z: 0 },   // KERNEL - Cabeza
      { x: -6, y: 2, z: 1 },   // AGENTS - Curva
      { x: -2, y: 4, z: 0 },   // MODELS - Cuerpo
      { x: 2, y: 4, z: -1 },   // LAB - Curva
      { x: 6, y: 2, z: 0 },    // PORTAL - Cuerpo
    ];
  }

  reformAsSerpent(duration: number) {
    // Crear conexión serpentina visual
    const serpentPoints = this.generateSerpentPath();
    // Aquí podríamos agregar una línea serpentina visual
  }

  epicFlash(duration) {
    // Flash de identidad serpentina
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(45deg, #00ff9c, #3aa8ff, #ff6b6b);
      opacity: 0;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(flash);

    gsap.to(flash, {
      opacity: 0.8,
      duration: duration / 2000,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
      onComplete: () => flash.remove()
    });
  }

  dissolveToConstellation(duration) {
    // Regresar a posiciones originales
    Object.keys(this.nodes).forEach((nodeKey) => {
      const node = (this.nodes as any)[nodeKey];
      const originalPos = NODES_CONFIG[nodeKey].position;
      if (node.meshRef?.current) {
        gsap.to(node.meshRef.current.position, {
          x: originalPos[0],
          y: originalPos[1],
          z: originalPos[2],
          duration: duration / 1000,
          ease: "elastic.out(1, 0.3)",
          onComplete: () => {
            this.isActive = false;
            if (this.onComplete) this.onComplete();
          }
        });
      }
    });
  }
}

// =========================================
// COMPONENTS
// =========================================

// Network Node Component
function NetworkNode({ config, onHover, onClick, isHovered, isActive }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [scale, setScale] = useState(1.0);
  const [glowIntensity, setGlowIntensity] = useState(0.3);

  // Exponer meshRef para transformación de serpiente
  useEffect(() => {
    if (meshRef.current) {
      config.meshRef = meshRef;
    }
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      // Breathing animation
      const breath = Math.sin(state.clock.elapsedTime * 0.5) * 0.05 + 1;
      meshRef.current.scale.setScalar(scale * breath);
    }

    if (glowRef.current && glowRef.current.material) {
      glowRef.current.material.uniforms.glowIntensity.value = glowIntensity;
    }
  });

  useEffect(() => {
    if (isHovered) {
      gsap.to(meshRef.current.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.3 });
      gsap.to(glowRef.current.material.uniforms, { glowIntensity: 0.8, duration: 0.3 });
    } else if (isActive) {
      gsap.to(meshRef.current.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 0.3 });
      gsap.to(glowRef.current.material.uniforms, { glowIntensity: 1.0, duration: 0.3 });
    } else {
      gsap.to(meshRef.current.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.3 });
      gsap.to(glowRef.current.material.uniforms, { glowIntensity: 0.3, duration: 0.3 });
    }
  }, [isHovered, isActive]);

  return (
    <group position={config.position}>
      {/* Main Node */}
      <Sphere ref={meshRef} args={[config.radius, 32, 32]}>
        <meshStandardMaterial
          color={config.color}
          emissive={config.color}
          emissiveIntensity={0.2}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* Glow Effect */}
      <Sphere ref={glowRef} args={[config.radius * 1.5, 32, 32]}>
        <shaderMaterial
          uniforms={{
            glowColor: { value: new THREE.Color(config.color) },
            glowIntensity: { value: 0.3 }
          }}
          vertexShader={`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 glowColor;
            uniform float glowIntensity;
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
              gl_FragColor = vec4(glowColor, intensity * glowIntensity);
            }
          `}
          transparent
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Label */}
      {isHovered && (
        <Html position={[0, config.radius + 0.5, 0]} center>
          <div style={{
            color: config.color,
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '14px',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(0,0,0,0.8)',
            pointerEvents: 'none'
          }}>
            {config.label}
          </div>
        </Html>
      )}

      {/* Invisible interaction sphere */}
      <Sphere
        args={[config.radius * 2, 8, 8]}
        onPointerEnter={() => onHover(config.label, true)}
        onPointerLeave={() => onHover(config.label, false)}
        onClick={() => onClick(config.label)}
        visible={false}
      />
    </group>
  );
}

// Network Connection Component
function NetworkConnection({ from, to, type }) {
  const lineRef = useRef<any>(null);
  const pulseRef = useRef<any>(null);
  const config = CONNECTION_TYPES[type];

  const points = useMemo(() => {
    const start = new THREE.Vector3(...NODES_CONFIG[from].position);
    const end = new THREE.Vector3(...NODES_CONFIG[to].position);

    // Create curved connection
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    midPoint.y += 1; // Add some height for organic feel

    return [start, midPoint, end];
  }, [from, to]);

  useFrame((state) => {
    if (pulseRef.current && config.animated) {
      const pulse = Math.sin(state.clock.elapsedTime * config.pulseSpeed) * 0.5 + 0.5;
      pulseRef.current.material.opacity = config.opacity * pulse;
    }
  });

  return (
    <group>
      {/* Main connection line */}
      <Line
        ref={lineRef}
        points={points}
        color={config.color}
        lineWidth={config.width * 100}
        transparent
        opacity={config.opacity}
      />

      {/* Animated pulse effect */}
      {config.animated && (
        <Line
          ref={pulseRef}
          points={points}
          color={config.color}
          lineWidth={config.width * 200}
          transparent
          opacity={0}
        />
      )}
    </group>
  );
}

// Data Pulse Component
function DataPulse({ path, speed = 2.0, color = '#3aa8ff' }) {
  const pulseRef = useRef();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const tl = gsap.timeline({ repeat: -1 });
    tl.to({}, {
      duration: 1 / speed,
      onUpdate: () => {
        setProgress(tl.progress());
      }
    });
  }, [speed]);

  const position = useMemo(() => {
    if (!path || path.length < 2) return [0, 0, 0];

    const curve = new THREE.CatmullRomCurve3(path.map(p => new THREE.Vector3(...p)));
    return curve.getPointAt(progress).toArray();
  }, [path, progress]);

  return (
    <Sphere ref={pulseRef} args={[0.1, 8, 8]} position={position}>
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </Sphere>
  );
}

// Camera Controller
function CameraController({ targetNode, cameraState }) {
  const { camera } = useThree();
  const cameraRef = useRef();

  useEffect(() => {
    if (!targetNode) return;

    const nodePos = NODES_CONFIG[targetNode].position;
    const targetPos = new THREE.Vector3(...nodePos);
    const cameraPos = new THREE.Vector3(targetPos.x + 3, targetPos.y + 1, targetPos.z + 3);

    gsap.to(camera.position, {
      x: cameraPos.x,
      y: cameraPos.y,
      z: cameraPos.z,
      duration: 1.5,
      ease: "back.out(1.7)"
    });

    gsap.to(camera, {
      duration: 1.5,
      ease: "back.out(1.7)",
      onUpdate: () => {
        camera.lookAt(targetPos);
      }
    });
  }, [targetNode]);

  useFrame((state) => {
    if (cameraState === 'KERNEL_ORBIT' && !targetNode) {
      const time = state.clock.elapsedTime * 0.5;
      const radius = 12;
      const height = 3;

      camera.position.x = Math.cos(time) * radius;
      camera.position.z = Math.sin(time) * radius;
      camera.position.y = height + Math.sin(time * 0.5) * 2;

      camera.lookAt(0, 0, 0);
    }
  });

  return null;
}

// Energy Probe Cursor - ENHANCED WITH MAGNETIC TRAIL
function EnergyProbeCursor({ nodes }) {
  const { viewport, mouse } = useThree();
  const cursorRef = useRef();
  const trailRef = useRef();
  const trail = useRef([]);
  const magneticForce = useRef(0);

  useFrame((state) => {
    if (cursorRef.current) {
      let worldX = (mouse.x * viewport.width) / 2;
      let worldY = (mouse.y * viewport.height) / 2;

      // Aplicar fuerza magnética de nodos cercanos
      if (nodes) {
        Object.values(nodes).forEach(node => {
          if (node.meshRef?.current) {
            const nodePos = node.meshRef.current.position;
            const cursorPos = new THREE.Vector3(worldX, worldY, 0);
            const distance = cursorPos.distanceTo(nodePos);

            if (distance < 5) { // Radio de influencia magnética
              const force = (5 - distance) * 0.1;
              const direction = new THREE.Vector3().subVectors(nodePos, cursorPos).normalize();
              worldX += direction.x * force;
              worldY += direction.y * force;
            }
          }
        });
      }

      cursorRef.current.position.set(worldX, worldY, 0);

      // Update trail con fade sofisticado
      trail.current.push({
        position: [worldX, worldY, 0],
        opacity: 1.0,
        timestamp: state.clock.elapsedTime
      });

      // Mantener solo últimos 30 puntos
      if (trail.current.length > 30) {
        trail.current.shift();
      }

      // Aplicar fade basado en tiempo
      trail.current.forEach((point, index) => {
        const age = state.clock.elapsedTime - point.timestamp;
        point.opacity = Math.max(0, 1 - age * 2); // Fade en 0.5 segundos
      });

      // Actualizar geometría del trail
      if (trailRef.current) {
        const points = trail.current.map(p => new THREE.Vector3(...p.position));
        const colors = trail.current.map(p => new THREE.Color('#00ff9c').multiplyScalar(p.opacity));

        trailRef.current.geometry.setFromPoints(points);
        trailRef.current.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors.flatMap(c => [c.r, c.g, c.b]), 3));
      }
    }
  });

  return (
    <group>
      {/* Main cursor */}
      <Sphere ref={cursorRef} args={[0.05, 8, 8]}>
        <meshBasicMaterial color="#00ff9c" transparent opacity={0.9} />
      </Sphere>

      {/* Enhanced Trail */}
      <line ref={trailRef}>
        <bufferGeometry />
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.6}
          linewidth={3}
        />
      </line>
    </group>
  );
}

// Main NeoProxy Network Component
export default function NeoProxyNetwork() {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [activeNode, setActiveNode] = useState(null);
  const [cameraState, setCameraState] = useState('KERNEL_ORBIT');
  const [serpentMode, setSerpentMode] = useState(false);
  const nodeRefs = useRef<Record<string, any>>({});
  const serpentRef = useRef<SerpentTransformation | null>(null);

  // Inicializar transformación de serpiente
  useEffect(() => {
    serpentRef.current = new SerpentTransformation(nodeRefs.current, () => {
      setSerpentMode(false);
    });
  }, []);

  const handleNodeHover = (nodeId, isHovered) => {
    setHoveredNode(isHovered ? nodeId : null);
  };

  const handleNodeClick = (nodeId) => {
    setActiveNode(nodeId);
    setCameraState('NODE_FOCUS');

    // Auto-return to orbit after 5 seconds
    setTimeout(() => {
      setActiveNode(null);
      setCameraState('KERNEL_ORBIT');
    }, 5000);
  };

  // Función para activar transformación de serpiente (llamada desde scroll)
  const activateSerpentTransformation = () => {
    if (serpentRef.current && !serpentMode) {
      setSerpentMode(true);
      serpentRef.current.activate();
    }
  };

  // Exponer función para activación externa (scroll listener)
  useEffect(() => {
    window.activateSerpentTransformation = activateSerpentTransformation;
    return () => {
      delete window.activateSerpentTransformation;
    };
  }, []);

  // Generate data pulse paths
  const pulsePaths = useMemo(() => {
    return CONNECTIONS_CONFIG
      .filter(conn => CONNECTION_TYPES[conn.type].animated)
      .map(conn => [
        NODES_CONFIG[conn.from].position,
        NODES_CONFIG[conn.to].position
      ]);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 75 }}
      style={{
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
        width: '100vw',
        height: '100vh'
      }}
    >
      {/* Lighting - Enhanced for unified experience */}
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.3} />
      <pointLight position={[-10, -10, -10]} intensity={0.2} color="#00ff9c" />
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#ff0000" /> {/* KERNEL glow */}

      {/* Camera Controller */}
      <CameraController targetNode={activeNode} cameraState={cameraState} />

      {/* Energy Probe Cursor with Magnetic Fields */}
      <EnergyProbeCursor nodes={nodeRefs.current} />

      {/* Network Nodes */}
      {Object.entries(NODES_CONFIG).map(([key, config]) => (
        <NetworkNode
          key={key}
          config={{...config, meshRef: nodeRefs.current[key]}}
          onHover={handleNodeHover}
          onClick={handleNodeClick}
          isHovered={hoveredNode === key}
          isActive={activeNode === key}
        />
      ))}

      {/* Network Connections */}
      {CONNECTIONS_CONFIG.map((conn, index) => (
        <NetworkConnection
          key={index}
          from={conn.from}
          to={conn.to}
          type={conn.type}
        />
      ))}

      {/* Data Pulses */}
      {pulsePaths.map((path, index) => (
        <DataPulse
          key={index}
          path={path}
          speed={CONNECTION_TYPES[CONNECTIONS_CONFIG[index].type].pulseSpeed}
          color={CONNECTION_TYPES[CONNECTIONS_CONFIG[index].type].color}
        />
      ))}
    </Canvas>
  );
}

// =========================================
// USAGE EXAMPLE
// =========================================

/*
import NeoProxyNetwork from './components/NeoProxyNetwork';

export default function HomePage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <NeoProxyNetwork />
    </div>
  );
}
*/