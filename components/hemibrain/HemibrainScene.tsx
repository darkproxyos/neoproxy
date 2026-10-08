'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as BABYLON from 'babylonjs'
import { ntColor } from './neurotransmitters'

export type HemiNeuron = {
  id: string
  cellType: string
  instance: string
  cellClass: string
  nt: string
  flow: string
  segments: number[][][]
}

export type HemiEdge = { pre: string; post: string; count: number }

export type HemibrainSceneHandle = {
  focusOn: (id: string) => void
  resetView: () => void
}

type Props = {
  neurons: HemiNeuron[]
  edges: HemiEdge[]
  visibleNt: Set<string>
  showKenyon: boolean
  showEdges: boolean
  onSelect: (neuron: HemiNeuron | null) => void
}

function isKenyon(cellType: string) {
  return cellType.startsWith('KC')
}

const HemibrainScene = forwardRef<HemibrainSceneHandle, Props>(function HemibrainScene(
  { neurons, edges, visibleNt, showKenyon, showEdges, onSelect },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<BABYLON.Scene | null>(null)
  const cameraRef = useRef<BABYLON.ArcRotateCamera | null>(null)
  const neuronMeshes = useRef<{ mesh: BABYLON.LinesMesh; neuron: HemiNeuron; centroid: BABYLON.Vector3 }[]>([])
  const edgesMeshRef = useRef<BABYLON.LinesMesh | null>(null)
  const selectedIdRef = useRef<string | null>(null)

  useImperativeHandle(ref, () => ({
    focusOn(id: string) {
      const scene = sceneRef.current
      const camera = cameraRef.current
      const entry = neuronMeshes.current.find(n => n.neuron.id === id)
      if (!scene || !camera || !entry) return
      selectedIdRef.current = id
      BABYLON.Animation.CreateAndStartAnimation('camTarget', camera, 'target', 30, 20, camera.target.clone(), entry.centroid.clone(), 0)
      BABYLON.Animation.CreateAndStartAnimation('camRadius', camera, 'radius', 30, 20, camera.radius, 16, 0)
    },
    resetView() {
      const camera = cameraRef.current
      if (!camera) return
      selectedIdRef.current = null
      BABYLON.Animation.CreateAndStartAnimation('camTargetReset', camera, 'target', 30, 20, camera.target.clone(), BABYLON.Vector3.Zero(), 0)
      BABYLON.Animation.CreateAndStartAnimation('camRadiusReset', camera, 'radius', 30, 20, camera.radius, 72, 0)
    },
  }))

  // Scene + geometry setup — rebuilt only when the neuron/edge data itself changes.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || neurons.length === 0) return

    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true })
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color4(0, 0.006, 0.016, 1)
    sceneRef.current = scene

    const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 2.2, Math.PI / 2.4, 72, BABYLON.Vector3.Zero(), scene)
    camera.attachControl(canvas, true)
    camera.wheelPrecision = 12
    camera.lowerRadiusLimit = 10
    camera.upperRadiusLimit = 130
    camera.minZ = 0.1
    cameraRef.current = camera

    const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene)
    ambient.intensity = 0.25

    const glow = new BABYLON.GlowLayer('glow', scene)
    glow.intensity = 0.55

    neuronMeshes.current = []

    for (const neuron of neurons) {
      const lines = neuron.segments.map(seg => seg.map(p => new BABYLON.Vector3(p[0], p[1], p[2])))
      if (lines.length === 0) continue
      const mesh = BABYLON.MeshBuilder.CreateLineSystem(`neuron-${neuron.id}`, { lines }, scene)
      const color = BABYLON.Color3.FromHexString(ntColor(neuron.nt))
      mesh.color = color
      mesh.alpha = 0.75
      mesh.isPickable = true
      mesh.intersectionThreshold = 0.8 // fattens the pick ray — thin lines are otherwise ~impossible to click
      mesh.metadata = { neuronId: neuron.id }

      let sx = 0, sy = 0, sz = 0, n = 0
      for (const seg of lines) for (const p of seg) { sx += p.x; sy += p.y; sz += p.z; n++ }
      const centroid = n > 0 ? new BABYLON.Vector3(sx / n, sy / n, sz / n) : BABYLON.Vector3.Zero()

      neuronMeshes.current.push({ mesh, neuron, centroid })
    }

    if (edges.length > 0) {
      const byId: Record<string, BABYLON.Vector3> = {}
      for (const n of neuronMeshes.current) byId[n.neuron.id] = n.centroid
      const edgeLines: BABYLON.Vector3[][] = []
      const maxCount = Math.max(...edges.map(e => e.count))
      const colors: BABYLON.Color4[][] = []
      for (const e of edges) {
        const a = byId[e.pre]
        const b = byId[e.post]
        if (!a || !b) continue
        edgeLines.push([a, b])
        const w = Math.min(1, e.count / maxCount)
        const alpha = 0.06 + w * 0.5
        colors.push([new BABYLON.Color4(0.4, 0.75, 1, alpha), new BABYLON.Color4(0.6, 0.3, 1, alpha)])
      }
      const edgesMesh = BABYLON.MeshBuilder.CreateLineSystem('synapse-edges', { lines: edgeLines, colors }, scene)
      edgesMesh.isPickable = false
      edgesMeshRef.current = edgesMesh
    }

    // 670 pickable LinesMesh makes brute-force picking expensive on every
    // mousemove — an octree turns each pick into a spatial-bucket lookup.
    scene.createOrUpdateSelectionOctree()

    let hovered: BABYLON.LinesMesh | null = null
    let isInteracting = false
    let lastHoverPick = 0
    canvas.style.cursor = 'grab'

    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
        const now = performance.now()
        if (now - lastHoverPick < 70) return // throttle: hover feedback doesn't need every frame
        lastHoverPick = now
        const pick = scene.pick(scene.pointerX, scene.pointerY)
        const mesh = pick?.hit ? (pick.pickedMesh as BABYLON.LinesMesh) : null
        const isNeuron = mesh && mesh.metadata?.neuronId
        if (hovered && hovered !== mesh) {
          hovered.alpha = 0.75
          hovered = null
        }
        if (isNeuron && hovered !== mesh) {
          mesh!.alpha = 1
          hovered = mesh
        }
        canvas.style.cursor = isNeuron ? 'pointer' : 'grab'
      }
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK) {
        const mesh = pointerInfo.pickInfo?.pickedMesh as BABYLON.LinesMesh | undefined
        const id = mesh?.metadata?.neuronId as string | undefined
        const found = id ? neuronMeshes.current.find(n => n.neuron.id === id)?.neuron : null
        onSelect(found ?? null)
      }
    })

    camera.onViewMatrixChangedObservable.add(() => {
      isInteracting = true
      setTimeout(() => { isInteracting = false }, 2500)
    })

    scene.onBeforeRenderObservable.add(() => {
      if (!isInteracting && !selectedIdRef.current) {
        camera.alpha += 0.0004 * engine.getDeltaTime()
      }
    })

    engine.runRenderLoop(() => scene.render())
    const handleResize = () => engine.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      engine.dispose()
      neuronMeshes.current = []
      edgesMeshRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [neurons, edges])

  // Filter visibility — cheap toggle, no geometry rebuild.
  useEffect(() => {
    for (const { mesh, neuron } of neuronMeshes.current) {
      const ntOk = visibleNt.has(neuron.nt)
      const kcOk = showKenyon || !isKenyon(neuron.cellType)
      mesh.setEnabled(ntOk && kcOk)
    }
  }, [visibleNt, showKenyon, neurons])

  useEffect(() => {
    edgesMeshRef.current?.setEnabled(showEdges)
  }, [showEdges, edges])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', outline: 'none' }} />
})

export default HemibrainScene
