'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as BABYLON from 'babylonjs'
import { entries, edges, clusters, type Cluster } from './entries'

export type KnowledgeSceneHandle = {
  focusOn: (id: string) => void
  resetView: () => void
}

type Props = {
  onSelect: (id: string | null) => void
}

const CLUSTER_ORDER: Cluster[] = ['informacion', 'mente', 'autoorganizacion', 'sistemas']
const CLUSTER_POLY_TYPE: Record<Cluster, number> = {
  informacion: 3, // icosaedro
  mente: 2, // dodecaedro
  autoorganizacion: 1, // octaedro
  sistemas: 0, // tetraedro
}

function hexToColor3(hex: string) {
  const c = BABYLON.Color3.FromHexString(hex)
  return c
}

function clusterCenter(cluster: Cluster): BABYLON.Vector3 {
  const i = CLUSTER_ORDER.indexOf(cluster)
  const dirs = [
    new BABYLON.Vector3(1, 1, 1),
    new BABYLON.Vector3(1, -1, -1),
    new BABYLON.Vector3(-1, 1, -1),
    new BABYLON.Vector3(-1, -1, 1),
  ]
  return dirs[i].normalize().scale(10)
}

function makeLabelTexture(scene: BABYLON.Scene, text: string, color: string) {
  const tex = new BABYLON.DynamicTexture(`label-${text}`, { width: 512, height: 128 }, scene, true)
  tex.hasAlpha = true
  const ctx = tex.getContext() as CanvasRenderingContext2D
  ctx.clearRect(0, 0, 512, 128)
  ctx.font = 'bold 44px "Space Mono", monospace'
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = color
  ctx.shadowBlur = 18
  ctx.fillText(text, 256, 64)
  tex.update()
  return tex
}

function makeDotTexture(scene: BABYLON.Scene) {
  const tex = new BABYLON.DynamicTexture('dust-dot', 64, scene, false)
  const ctx = tex.getContext() as CanvasRenderingContext2D
  const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, 64, 64)
  tex.update()
  return tex
}

const KnowledgeScene = forwardRef<KnowledgeSceneHandle, Props>(function KnowledgeScene({ onSelect }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<BABYLON.Scene | null>(null)
  const cameraRef = useRef<BABYLON.ArcRotateCamera | null>(null)
  const nodePositions = useRef<Record<string, BABYLON.Vector3>>({})
  const meshesById = useRef<Record<string, BABYLON.Mesh>>({})
  const selectedIdRef = useRef<string | null>(null)

  useImperativeHandle(ref, () => ({
    focusOn(id: string) {
      const scene = sceneRef.current
      const camera = cameraRef.current
      const pos = nodePositions.current[id]
      if (!scene || !camera || !pos) return
      selectedIdRef.current = id
      BABYLON.Animation.CreateAndStartAnimation('camTarget', camera, 'target', 30, 20, camera.target.clone(), pos.clone(), 0)
      BABYLON.Animation.CreateAndStartAnimation('camRadius', camera, 'radius', 30, 20, camera.radius, 7.5, 0)
    },
    resetView() {
      const camera = cameraRef.current
      if (!camera) return
      selectedIdRef.current = null
      BABYLON.Animation.CreateAndStartAnimation('camTargetReset', camera, 'target', 30, 20, camera.target.clone(), BABYLON.Vector3.Zero(), 0)
      BABYLON.Animation.CreateAndStartAnimation('camRadiusReset', camera, 'radius', 30, 20, camera.radius, 26, 0)
    },
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true })
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color4(0, 0.008, 0.02, 1)
    sceneRef.current = scene

    const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 2.3, Math.PI / 2.3, 26, BABYLON.Vector3.Zero(), scene)
    camera.attachControl(canvas, true)
    camera.wheelPrecision = 30
    camera.lowerRadiusLimit = 8
    camera.upperRadiusLimit = 46
    camera.minZ = 0.1
    cameraRef.current = camera

    const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene)
    ambient.intensity = 0.28

    const glow = new BABYLON.GlowLayer('glow', scene)
    glow.intensity = 0.9

    // Dust field
    const dotTexture = makeDotTexture(scene)
    const dust = new BABYLON.ParticleSystem('dust', 400, scene)
    dust.particleTexture = dotTexture
    dust.emitter = BABYLON.Vector3.Zero()
    dust.createSphereEmitter(34, 0)
    dust.minSize = 0.03
    dust.maxSize = 0.12
    dust.minLifeTime = Number.MAX_SAFE_INTEGER
    dust.maxLifeTime = Number.MAX_SAFE_INTEGER
    dust.emitRate = 0
    dust.manualEmitCount = 400
    dust.minEmitPower = 0
    dust.maxEmitPower = 0
    dust.color1 = new BABYLON.Color4(0.5, 0.85, 1, 0.5)
    dust.color2 = new BABYLON.Color4(0.7, 0.5, 1, 0.35)
    dust.start()

    // Nodes
    entries.forEach((entry, i) => {
      const clusterInCluster = entries.filter(e => e.cluster === entry.cluster)
      const localIndex = clusterInCluster.indexOf(entry)
      const clusterIdx = CLUSTER_ORDER.indexOf(entry.cluster)
      const angle = localIndex * (Math.PI / 2) + clusterIdx * 0.35
      const local = new BABYLON.Vector3(Math.cos(angle) * 3.3, Math.sin(angle * 0.7) * 2.1, Math.sin(angle) * 3.3)
      const pos = clusterCenter(entry.cluster).add(local)
      nodePositions.current[entry.id] = pos

      const color = clusters[entry.cluster].color
      const mesh = BABYLON.MeshBuilder.CreatePolyhedron(`node-${entry.id}`, {
        type: CLUSTER_POLY_TYPE[entry.cluster],
        size: 0.5,
      }, scene)
      mesh.position = pos
      const mat = new BABYLON.StandardMaterial(`mat-${entry.id}`, scene)
      mat.emissiveColor = hexToColor3(color)
      mat.diffuseColor = hexToColor3(color).scale(0.15)
      mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1)
      mat.alpha = 0.92
      mesh.material = mat
      mesh.metadata = { entryId: entry.id }
      meshesById.current[entry.id] = mesh

      // idle spin, unique per node
      const spinSpeed = 0.0015 + (i % 5) * 0.0006
      scene.onBeforeRenderObservable.add(() => {
        mesh.rotation.y += spinSpeed
        mesh.rotation.x += spinSpeed * 0.4
      })

      // floating label
      const label = makeLabelTexture(scene, entry.name, color)
      const plane = BABYLON.MeshBuilder.CreatePlane(`label-${entry.id}`, { width: 2.6, height: 0.65 }, scene)
      plane.position = pos.add(new BABYLON.Vector3(0, 0.85, 0))
      plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL
      const planeMat = new BABYLON.StandardMaterial(`labelmat-${entry.id}`, scene)
      planeMat.diffuseTexture = label
      planeMat.emissiveTexture = label
      planeMat.opacityTexture = label
      planeMat.disableLighting = true
      planeMat.backFaceCulling = false
      plane.material = planeMat
      plane.isPickable = false
    })

    // Edges
    edges.forEach(([aId, bId]) => {
      const a = nodePositions.current[aId]
      const b = nodePositions.current[bId]
      if (!a || !b) return
      const entryA = entries.find(e => e.id === aId)!
      const entryB = entries.find(e => e.id === bId)!
      const colorA = hexToColor3(clusters[entryA.cluster].color)
      const colorB = hexToColor3(clusters[entryB.cluster].color)
      const mid = colorA.add(colorB).scale(0.5)
      const line = BABYLON.MeshBuilder.CreateLines(`edge-${aId}-${bId}`, { points: [a, b] }, scene)
      line.color = mid
      line.alpha = 0.32
      line.isPickable = false
    })

    // Interaction: hover + click
    let hovered: BABYLON.Mesh | null = null
    let isInteracting = false

    canvas.style.cursor = 'grab'

    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
        const pick = scene.pick(scene.pointerX, scene.pointerY)
        const mesh = pick?.hit ? (pick.pickedMesh as BABYLON.Mesh) : null
        const isNode = mesh && mesh.metadata?.entryId

        if (hovered && hovered !== mesh) {
          hovered.scaling = BABYLON.Vector3.One()
          hovered = null
        }
        if (isNode && hovered !== mesh) {
          mesh!.scaling = new BABYLON.Vector3(1.35, 1.35, 1.35)
          hovered = mesh
        }
        canvas.style.cursor = isNode ? 'pointer' : 'grab'
      }

      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK) {
        const mesh = pointerInfo.pickInfo?.pickedMesh as BABYLON.Mesh | undefined
        const id = mesh?.metadata?.entryId as string | undefined
        if (id) {
          onSelect(id)
        } else {
          onSelect(null)
        }
      }
    })

    camera.onViewMatrixChangedObservable.add(() => {
      isInteracting = true
      setTimeout(() => { isInteracting = false }, 2500)
    })

    scene.onBeforeRenderObservable.add(() => {
      if (!isInteracting && !selectedIdRef.current) {
        camera.alpha += 0.0009 * engine.getDeltaTime()
      }
    })

    engine.runRenderLoop(() => scene.render())
    const handleResize = () => engine.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      engine.dispose()
    }
  }, [onSelect])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', outline: 'none' }} />
})

export default KnowledgeScene
