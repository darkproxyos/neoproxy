'use client'

import { useEffect, useRef } from 'react'
import {
  Engine,
  Scene,
  FreeCamera,
  HemisphericLight,
  PointLight,
  Vector3,
  Color3,
  Color4,
  MeshBuilder,
  StandardMaterial,
  GlowLayer,
  SceneLoader,
  TransformNode,
  AbstractMesh,
} from '@babylonjs/core'
import '@babylonjs/loaders/glTF'

// Flythrough automático, sin controles: una nave orbita por dentro de un
// túnel con forma de acelerador de partículas. Antes esta escena vivía en
// un iframe que cargaba Babylon.js desde una CDN externa via importmap --
// si esa CDN fallaba (bloqueada, lenta, ad-blocker) la pantalla quedaba
// negra para siempre. Ahora usa el mismo paquete de npm empaquetado que
// el resto del sitio (Arsenal, Espectro), sin dependencia de red en runtime.
export default function PlanetPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new Engine(canvasRef.current, true)
    const scene = new Scene(engine)
    scene.clearColor = new Color4(0, 0, 0, 1)
    scene.fogMode = Scene.FOGMODE_EXP
    scene.fogDensity = 0.01

    const camera = new FreeCamera('camera', new Vector3(0, 0, -20), scene)
    camera.fov = 1.1

    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene)
    hemi.intensity = 0.6
    const point = new PointLight('point', new Vector3(0, 0, 0), scene)
    point.intensity = 10

    const glow = new GlowLayer('glow', scene)
    glow.intensity = 1.2

    // Campo estelar
    for (let i = 0; i < 3500; i++) {
      const s = MeshBuilder.CreateSphere('s' + i, { diameter: Math.random() * 0.3 }, scene)
      const r = 300 + Math.random() * 500
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      s.position = new Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )
      const sm = new StandardMaterial('sm' + i, scene)
      sm.emissiveColor = new Color3(0.5 + Math.random() * 0.5, 0.6 + Math.random() * 0.4, 1)
      sm.disableLighting = true
      s.material = sm
    }

    // Acelerador (toro exterior, wireframe)
    const acceleratorRadius = 40
    const accelerator = MeshBuilder.CreateTorus('accelerator', { diameter: acceleratorRadius * 2, thickness: 3, tessellation: 256 }, scene)
    const acceleratorMat = new StandardMaterial('acceleratorMat', scene)
    acceleratorMat.emissiveColor = new Color3(0.1, 0.7, 1)
    acceleratorMat.wireframe = true
    accelerator.material = acceleratorMat

    // Anillo de energía interior
    const energyRing = MeshBuilder.CreateTorus('energyRing', { diameter: acceleratorRadius * 2 - 2, thickness: 0.4, tessellation: 256 }, scene)
    const energyMat = new StandardMaterial('energyMat', scene)
    energyMat.emissiveColor = new Color3(1, 0.4, 0.1)
    energyRing.material = energyMat

    // Segmentos del túnel
    for (let i = 0; i < 180; i++) {
      const angle = (i / 180) * Math.PI * 2
      const x = Math.cos(angle) * acceleratorRadius
      const z = Math.sin(angle) * acceleratorRadius
      const segment = MeshBuilder.CreateTorus('seg' + i, { diameter: 5, thickness: 0.05, tessellation: 32 }, scene)
      segment.position.x = x
      segment.position.z = z
      segment.lookAt(Vector3.Zero())
      segment.rotation.y += Math.PI / 2
      const segMat = new StandardMaterial('segMat' + i, scene)
      segMat.emissiveColor = new Color3(0.2, 0.6 + Math.random() * 0.4, 1)
      segMat.wireframe = true
      segment.material = segMat
    }

    // Nave -- sigue a la cámara por dentro del túnel
    let shipRoot: TransformNode | null = null
    SceneLoader.ImportMesh('', '/games/planet/', 'spaceproxyship.glb', scene, (meshes: AbstractMesh[]) => {
      shipRoot = new TransformNode('shipRoot')
      meshes.forEach(m => { m.parent = shipRoot })
      shipRoot.scaling = new Vector3(2, 2, 2)
    })

    let t = 0
    scene.registerBeforeRender(() => {
      t += 0.003
      const orbitRadius = acceleratorRadius
      const x = Math.cos(t) * orbitRadius
      const z = Math.sin(t) * orbitRadius
      const y = Math.sin(t * 4) * 2.5
      camera.position.x = x
      camera.position.y = y
      camera.position.z = z

      const lookAhead = t + 0.15
      const tx = Math.cos(lookAhead) * orbitRadius
      const tz = Math.sin(lookAhead) * orbitRadius
      const ty = Math.sin(lookAhead * 4) * 2.5
      camera.setTarget(new Vector3(tx, ty, tz))

      if (shipRoot) {
        shipRoot.position.copyFrom(camera.position)
        shipRoot.position.y -= 0.6
        shipRoot.lookAt(new Vector3(tx, ty, tz))
      }

      accelerator.rotation.y += 0.0005
      energyRing.rotation.y -= 0.0015

      const pulse = 0.7 + Math.sin(performance.now() * 0.003) * 0.5
      energyMat.emissiveColor = new Color3(1, 0.3 + pulse * 0.5, pulse)
    })

    engine.runRenderLoop(() => scene.render())
    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      engine.dispose()
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}
