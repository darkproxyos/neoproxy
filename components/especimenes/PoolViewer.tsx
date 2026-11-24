'use client'

import { useEffect, useRef } from 'react'
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, Color3, Color4,
  StandardMaterial, Mesh, VertexData, MeshBuilder,
} from '@babylonjs/core'

// Visor de una malla ya orientada para imprimir (z arriba, apoyada en z=0, en mm).
// Babylon es y-arriba: se intercambian y/z y se invierte el orden de los
// triángulos para conservar la orientación de las caras. La "cama" es el plano
// de impresión: se ve de dónde apoya la pieza.
export default function PoolViewer({ positions, indices, color }: { positions: Float32Array; indices: Uint32Array; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new Engine(canvas, true, { antialias: true })
    const scene = new Scene(engine)
    scene.clearColor = new Color4(0.02, 0.03, 0.05, 1)

    let maxX = 0, maxZ = 0, maxY = 0
    const pos = new Float32Array(positions.length)
    for (let i = 0; i < positions.length; i += 3) {
      pos[i] = positions[i]; pos[i + 1] = positions[i + 2]; pos[i + 2] = positions[i + 1]
      maxX = Math.max(maxX, Math.abs(pos[i])); maxY = Math.max(maxY, pos[i + 1]); maxZ = Math.max(maxZ, Math.abs(pos[i + 2]))
    }
    const idx = new Uint32Array(indices.length)
    for (let i = 0; i < indices.length; i += 3) { idx[i] = indices[i]; idx[i + 1] = indices[i + 2]; idx[i + 2] = indices[i + 1] }

    const normals = new Float32Array(pos.length)
    VertexData.ComputeNormals(pos, idx, normals)
    const mesh = new Mesh('specimen', scene)
    const vd = new VertexData()
    vd.positions = pos; vd.indices = idx; vd.normals = normals
    vd.applyToMesh(mesh)

    const c = Color3.FromHexString(color)
    const mat = new StandardMaterial('m', scene)
    mat.diffuseColor = c
    mat.specularColor = new Color3(0.35, 0.35, 0.35)
    mat.specularPower = 48
    mat.emissiveColor = c.scale(0.08)
    mat.backFaceCulling = false
    mat.twoSidedLighting = true
    mesh.material = mat

    const bed = MeshBuilder.CreateDisc('bed', { radius: Math.max(maxX, maxZ) * 1.5, tessellation: 64 }, scene)
    bed.rotation.x = Math.PI / 2
    bed.position.y = -0.2
    const bedMat = new StandardMaterial('bedm', scene)
    bedMat.diffuseColor = new Color3(0.05, 0.08, 0.12)
    bedMat.specularColor = Color3.Black()
    bedMat.alpha = 0.9
    bed.material = bedMat

    const target = new Vector3(0, maxY / 2, 0)
    const cam = new ArcRotateCamera('cam', -Math.PI / 3, Math.PI / 2.6, Math.max(maxX, maxZ, maxY) * 3.4, target, scene)
    cam.lowerRadiusLimit = 40
    cam.upperRadiusLimit = 260
    cam.wheelPrecision = 6
    cam.attachControl(canvas, true)
    cam.useAutoRotationBehavior = true
    if (cam.autoRotationBehavior) { cam.autoRotationBehavior.idleRotationSpeed = 0.35; cam.autoRotationBehavior.idleRotationWaitTime = 1800 }

    const hemi = new HemisphericLight('h', new Vector3(0, 1, 0), scene)
    hemi.intensity = 0.55
    hemi.groundColor = new Color3(0.08, 0.1, 0.16)
    const key = new DirectionalLight('k', new Vector3(-0.5, -1, -0.4), scene)
    key.intensity = 0.9
    const rim = new DirectionalLight('r', new Vector3(0.6, -0.3, 0.8), scene)
    rim.intensity = 0.35

    engine.runRenderLoop(() => scene.render())
    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      engine.stopRenderLoop()
      scene.dispose()
      engine.dispose()
    }
  }, [positions, indices, color])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none', outline: 'none' }} />
}
