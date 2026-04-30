'use client'

import { useState, useEffect, useRef } from 'react'
import * as BABYLON from 'babylonjs'
import styles from './kernel.module.css'

interface SystemLayer {
  name: string
  depth: number
  visible: boolean
  nodes: number
  status: 'active' | 'warning' | 'error'
  color: string
}

interface Agent {
  id: string
  name: string
  status: 'online' | 'offline' | 'processing'
  load: number
  lastActivity: string
}

interface StorageNode {
  id: string
  type: 'local_ssd' | 'nas' | 'cloud' | 'printer'
  status: 'online' | 'offline'
  capacity: number
  used: number
  replicas: number
}

export default function KernelCommandCenter() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user')
  const [systemLayers, setSystemLayers] = useState<SystemLayer[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [storageNodes, setStorageNodes] = useState<StorageNode[]>([])
  const [icebergMode, setIcebergMode] = useState(false)

  // Simulación de datos del sistema
  useEffect(() => {
    // Verificar rol de admin (simple para demo)
    const isAdmin = localStorage.getItem('neoproxy_role') === 'admin'
    setUserRole(isAdmin ? 'admin' : 'user')

    // Cargar datos del sistema
    loadSystemData()
  }, [])

  const loadSystemData = () => {
    // Capas del sistema (Iceberg)
    const layers: SystemLayer[] = [
      { name: 'Experience Layer', depth: 0, visible: true, nodes: 5, status: 'active', color: '#00ff9d' },
      { name: 'Application Layer', depth: 1, visible: false, nodes: 12, status: 'active', color: '#00d4ff' },
      { name: 'Agent Layer', depth: 2, visible: false, nodes: 8, status: 'active', color: '#ff6b6b' },
      { name: 'Data Layer', depth: 3, visible: false, nodes: 24, status: 'warning', color: '#ffd93d' },
      { name: 'Storage Layer', depth: 4, visible: false, nodes: 6, status: 'active', color: '#6bcf7f' },
      { name: 'Kernel Layer', depth: 5, visible: false, nodes: 1, status: 'active', color: '#e056fd' }
    ]

    // Agentes
    const agentData: Agent[] = [
      { id: 'snake', name: 'Snake', status: 'online', load: 45, lastActivity: '2s ago' },
      { id: 'gennos', name: 'Gennos', status: 'processing', load: 78, lastActivity: '1s ago' },
      { id: 'd', name: 'D', status: 'online', load: 23, lastActivity: '5s ago' },
      { id: 'trickzter', name: 'Trickzter', status: 'online', load: 56, lastActivity: '3s ago' }
    ]

    // Nodos de almacenamiento
    const storageData: StorageNode[] = [
      { id: 'local_ssd_01', type: 'local_ssd', status: 'online', capacity: 1000, used: 678, replicas: 3 },
      { id: 'nas_01', type: 'nas', status: 'online', capacity: 5000, used: 2341, replicas: 2 },
      { id: 'cloud_01', type: 'cloud', status: 'online', capacity: 10000, used: 5678, replicas: 5 },
      { id: 'printer_01', type: 'printer', status: 'offline', capacity: 100, used: 0, replicas: 1 }
    ]

    setSystemLayers(layers)
    setAgents(agentData)
    setStorageNodes(storageData)
  }

  // Visualización 3D del Iceberg
  useEffect(() => {
    if (!canvasRef.current || !icebergMode) return

    const engine = new BABYLON.Engine(canvasRef.current, true)
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1)

    const camera = new BABYLON.ArcRotateCamera(
      'cam',
      Math.PI / 4,
      Math.PI / 3,
      15,
      BABYLON.Vector3.Zero(),
      scene
    )
    camera.attachControl(canvasRef.current, true)

    const light = new BABYLON.HemisphericLight(
      'light',
      new BABYLON.Vector3(0, 1, 0),
      scene
    )

    // Crear visualización del iceberg
    createIcebergVisualization(scene)

    engine.runRenderLoop(() => {
      scene.render()
    })

    return () => {
      engine.dispose()
    }
  }, [icebergMode, systemLayers])

  const createIcebergVisualization = (scene: BABYLON.Scene) => {
    systemLayers.forEach((layer, index) => {
      const y = -index * 2
      const size = 8 - index * 0.8

      // Crear capa como caja
      const box = BABYLON.MeshBuilder.CreateBox(
        `layer_${index}`,
        { width: size, height: 0.5, depth: size },
        scene
      )
      box.position.y = y

      const material = new BABYLON.StandardMaterial(`mat_${index}`, scene)
      material.diffuseColor = BABYLON.Color3.FromHexString(layer.color)
      material.alpha = layer.visible ? 0.8 : 0.3
      box.material = material

      // Añadir texto de la capa
      const label = BABYLON.MeshBuilder.CreatePlane(`label_${index}`, { size: 2 }, scene)
      label.position.y = y + 1
      label.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL

      const labelMaterial = new BABYLON.StandardMaterial(`label_mat_${index}`, scene)
      labelMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1)
      labelMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1)
      label.material = labelMaterial
    })
  }

  const toggleIcebergMode = () => {
    setIcebergMode(!icebergMode)
  }

  const toggleLayer = (index: number) => {
    const newLayers = [...systemLayers]
    newLayers[index].visible = !newLayers[index].visible
    setSystemLayers(newLayers)
  }

  // Si no es admin, mostrar acceso denegado
  if (userRole !== 'admin') {
    return (
      <div className={styles.container}>
        <div className={styles.accessDenied}>
          <h1>🔒 Access Denied</h1>
          <p>This area is restricted to system administrators.</p>
          <button onClick={() => {
            localStorage.setItem('neoproxy_role', 'admin')
            window.location.reload()
          }}>
            Enable Admin Mode
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.kernelHeader}>
        <h1>🧊 NeoProxy Kernel Command Center</h1>
        <div className={styles.kernelControls}>
          <button 
            onClick={toggleIcebergMode}
            className={styles.icebergToggle}
          >
            {icebergMode ? 'Hide' : 'Show'} Iceberg Visualization
          </button>
        </div>
      </div>

      <div className={styles.kernelLayout}>
        {/* Panel izquierdo - Iceberg Layers */}
        <div className={styles.icebergPanel}>
          <h2>🏔️ System Layers</h2>
          <div className={styles.layersList}>
            {systemLayers.map((layer, index) => (
              <div 
                key={index}
                className={`${styles.layerItem} ${styles[layer.status]}`}
                onClick={() => toggleLayer(index)}
              >
                <div className={styles.layerHeader}>
                  <span className={styles.layerName}>{layer.name}</span>
                  <span className={styles.layerDepth}>Depth: {layer.depth}</span>
                </div>
                <div className={styles.layerInfo}>
                  <span>Nodes: {layer.nodes}</span>
                  <span>Status: {layer.status}</span>
                </div>
                <div className={styles.layerToggle}>
                  {layer.visible ? '👁️' : '🙈'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Centro - Visualización 3D */}
        <div className={styles.visualizationPanel}>
          {icebergMode ? (
            <canvas 
              ref={canvasRef}
              className={styles.icebergCanvas}
              style={{ width: '100%', height: '400px' }}
            />
          ) : (
            <div className={styles.systemOverview}>
              <h2>🌐 System Overview</h2>
              <div className={styles.overviewGrid}>
                <div className={styles.overviewCard}>
                  <h3>Active Layers</h3>
                  <p>{systemLayers.filter(l => l.visible).length} / {systemLayers.length}</p>
                </div>
                <div className={styles.overviewCard}>
                  <h3>Total Nodes</h3>
                  <p>{systemLayers.reduce((sum, l) => sum + l.nodes, 0)}</p>
                </div>
                <div className={styles.overviewCard}>
                  <h3>System Health</h3>
                  <p>98.5%</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel derecho - Agentes y Storage */}
        <div className={styles.systemPanel}>
          <div className={styles.agentsSection}>
            <h2>🤖 Agent Network</h2>
            <div className={styles.agentsList}>
              {agents.map(agent => (
                <div 
                  key={agent.id}
                  className={`${styles.agentItem} ${styles[agent.status]}`}
                >
                  <div className={styles.agentHeader}>
                    <span className={styles.agentName}>{agent.name}</span>
                    <span className={styles.agentStatus}>{agent.status}</span>
                  </div>
                  <div className={styles.agentMetrics}>
                    <div className={styles.loadBar}>
                      <div 
                        className={styles.loadFill}
                        style={{ width: `${agent.load}%` }}
                      />
                    </div>
                    <span className={styles.lastActivity}>{agent.lastActivity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.storageSection}>
            <h2>💾 Storage Network</h2>
            <div className={styles.storageList}>
              {storageNodes.map(node => (
                <div 
                  key={node.id}
                  className={`${styles.storageItem} ${styles[node.status]}`}
                >
                  <div className={styles.storageHeader}>
                    <span className={styles.storageType}>{node.type}</span>
                    <span className={styles.storageStatus}>{node.status}</span>
                  </div>
                  <div className={styles.storageMetrics}>
                    <div className={styles.capacityBar}>
                      <div 
                        className={styles.capacityFill}
                        style={{ width: `${(node.used / node.capacity) * 100}%` }}
                      />
                    </div>
                    <span>{node.used}GB / {node.capacity}GB</span>
                    <span>Replicas: {node.replicas}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
