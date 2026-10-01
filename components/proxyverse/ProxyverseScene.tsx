'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as BABYLON from 'babylonjs'
import { agents } from './agents'

// Relaciones reales del lore, no decorativas:
// - DarkProxy converge con los seis ("soy el espacio donde convergen").
// - Metatron orquesta a los otros cinco procesos (no a DarkProxy, que es root).
// - Prototype es residuo de los otros cinco — toma prestado de cada uno.
const OTHERS = ['metatron', 'd', 'snake', 'genos', 'trickster', 'prototype']
const ORCHESTRATED = ['d', 'snake', 'genos', 'trickster', 'prototype']
const BORROWED_FROM = ['metatron', 'd', 'snake', 'genos', 'trickster']

function buildEdges(): [string, string][] {
  const seen = new Set<string>()
  const edges: [string, string][] = []
  const add = (a: string, b: string) => {
    const key = [a, b].sort().join('|')
    if (seen.has(key)) return
    seen.add(key)
    edges.push([a, b])
  }
  OTHERS.forEach(id => add('darkproxy', id))
  ORCHESTRATED.forEach(id => add('metatron', id))
  BORROWED_FROM.forEach(id => add('prototype', id))
  return edges
}

const EDGES = buildEdges()
const POLY_TYPES: Record<string, number> = {
  darkproxy: 3, // icosaedro — el mas complejo, el que converge con todos
  metatron: 2, // dodecaedro — geometria sagrada
  d: 0, // tetraedro — la forma minima, casi ausencia
  snake: 11, // forma irregular — nunca la misma dos veces
  genos: 1, // octaedro — precision
  trickster: 7,
  prototype: 5,
}

function hexToColor3(hex: string) {
  return BABYLON.Color3.FromHexString(hex)
}

function makeLabelTexture(scene: BABYLON.Scene, text: string, color: string) {
  const tex = new BABYLON.DynamicTexture(`pxv-label-${text}`, { width: 512, height: 128 }, scene, true)
  tex.hasAlpha = true
  const ctx = tex.getContext() as CanvasRenderingContext2D
  ctx.clearRect(0, 0, 512, 128)
  ctx.font = 'bold 40px "Space Mono", monospace'
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = color
  ctx.shadowBlur = 18
  ctx.fillText(text, 256, 64)
  tex.update()
  return tex
}

export default function ProxyverseScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true })
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color4(0, 0.008, 0.02, 1)

    const camera = new BABYLON.ArcRotateCamera('pxv-cam', -Math.PI / 2.3, Math.PI / 2.3, 16, BABYLON.Vector3.Zero(), scene)
    camera.attachControl(canvas, true)
    camera.wheelPrecision = 35
    camera.lowerRadiusLimit = 6
    camera.upperRadiusLimit = 26
    camera.minZ = 0.1

    const ambient = new BABYLON.HemisphericLight('pxv-ambient', new BABYLON.Vector3(0, 1, 0), scene)
    ambient.intensity = 0.3

    const glow = new BABYLON.GlowLayer('pxv-glow', scene)
    glow.intensity = 0.9

    const positions: Record<string, BABYLON.Vector3> = { darkproxy: BABYLON.Vector3.Zero() }
    OTHERS.forEach((id, i) => {
      const angle = (i / OTHERS.length) * Math.PI * 2
      positions[id] = new BABYLON.Vector3(Math.cos(angle) * 6, Math.sin(angle * 1.3) * 2.2, Math.sin(angle) * 6)
    })

    agents.forEach((agent, i) => {
      const pos = positions[agent.id]
      const isRoot = agent.id === 'darkproxy'
      const color = agent.color

      const mesh = BABYLON.MeshBuilder.CreatePolyhedron(`pxv-node-${agent.id}`, {
        type: POLY_TYPES[agent.id] ?? 0,
        size: isRoot ? 0.85 : 0.55,
      }, scene)
      mesh.position = pos
      const mat = new BABYLON.StandardMaterial(`pxv-mat-${agent.id}`, scene)
      mat.emissiveColor = hexToColor3(color)
      mat.diffuseColor = hexToColor3(color).scale(0.15)
      mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1)
      mat.alpha = 0.92
      mesh.material = mat
      mesh.metadata = { agentId: agent.id }

      const spinSpeed = 0.0012 + (i % 5) * 0.0006
      scene.onBeforeRenderObservable.add(() => {
        mesh.rotation.y += spinSpeed
        mesh.rotation.x += spinSpeed * 0.4
      })

      const label = makeLabelTexture(scene, agent.name, color)
      const plane = BABYLON.MeshBuilder.CreatePlane(`pxv-label-${agent.id}`, { width: 2.4, height: 0.6 }, scene)
      plane.position = pos.add(new BABYLON.Vector3(0, isRoot ? 1.1 : 0.85, 0))
      plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL
      const planeMat = new BABYLON.StandardMaterial(`pxv-labelmat-${agent.id}`, scene)
      planeMat.diffuseTexture = label
      planeMat.emissiveTexture = label
      planeMat.opacityTexture = label
      planeMat.disableLighting = true
      planeMat.backFaceCulling = false
      plane.material = planeMat
      plane.isPickable = false
    })

    EDGES.forEach(([aId, bId]) => {
      const a = positions[aId]
      const b = positions[bId]
      if (!a || !b) return
      const agentA = agents.find(ag => ag.id === aId)!
      const agentB = agents.find(ag => ag.id === bId)!
      const mid = hexToColor3(agentA.color).add(hexToColor3(agentB.color)).scale(0.5)
      const line = BABYLON.MeshBuilder.CreateLines(`pxv-edge-${aId}-${bId}`, { points: [a, b] }, scene)
      line.color = mid
      line.alpha = 0.34
      line.isPickable = false
    })

    let hovered: BABYLON.Mesh | null = null
    let isInteracting = false
    canvas.style.cursor = 'grab'

    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
        const pick = scene.pick(scene.pointerX, scene.pointerY)
        const mesh = pick?.hit ? (pick.pickedMesh as BABYLON.Mesh) : null
        const isNode = mesh && mesh.metadata?.agentId

        if (hovered && hovered !== mesh) {
          hovered.scaling = BABYLON.Vector3.One()
          hovered = null
        }
        if (isNode && hovered !== mesh) {
          mesh!.scaling = new BABYLON.Vector3(1.3, 1.3, 1.3)
          hovered = mesh
        }
        canvas.style.cursor = isNode ? 'pointer' : 'grab'
      }

      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK) {
        const mesh = pointerInfo.pickInfo?.pickedMesh as BABYLON.Mesh | undefined
        const id = mesh?.metadata?.agentId as string | undefined
        if (id) router.push(`/proxyverse/${id}`)
      }
    })

    camera.onViewMatrixChangedObservable.add(() => {
      isInteracting = true
      setTimeout(() => { isInteracting = false }, 2500)
    })

    scene.onBeforeRenderObservable.add(() => {
      if (!isInteracting) camera.alpha += 0.0007 * engine.getDeltaTime()
    })

    engine.runRenderLoop(() => scene.render())
    const handleResize = () => engine.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      engine.dispose()
    }
  }, [router])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', outline: 'none' }} />
}
