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

const CLUSTER_ORDER: Cluster[] = ['informacion', 'mente', 'autoorganizacion', 'sistemas', 'geometria']
const CLUSTER_POLY_TYPE: Record<Cluster, number> = {
  informacion: 3, // icosaedro
  mente: 2, // dodecaedro
  autoorganizacion: 1, // octaedro
  sistemas: 0, // tetraedro
  geometria: 3, // icosaedro — fallback para la única entrada sin nodeShape propio
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
    // geometria: eje propio, aparte de los 4 octantes de arriba (que no se
    // tocan, para no perturbar el layout ya shippeado de esos 4 clusters)
    new BABYLON.Vector3(0, 1.8, 0),
  ]
  return dirs[i].normalize().scale(10)
}

// ---------------------------------------------------------------------------
// Politopos regulares 4D (teseracto, 24-celda, 600-celda) — coordenadas
// verificadas numéricamente antes de portarlas (conteo de vértices, norma
// uniforme/vertex-transitive, grado uniforme, Euler V-E+F-C=0 con los
// conteos tabulados). Se generan una sola vez al cargar el módulo.
// ---------------------------------------------------------------------------
type Vec4 = [number, number, number, number]

function dist4(a: Vec4, b: Vec4) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3])
}

function norm4(a: Vec4) {
  return Math.hypot(a[0], a[1], a[2], a[3])
}

function normalizeVertices(vs: Vec4[]): Vec4[] {
  return vs.map((v) => {
    const n = norm4(v)
    return [v[0] / n, v[1] / n, v[2] / n, v[3] / n] as Vec4
  })
}

// Aristas = pares de vértices a la distancia mínima (politopos regulares son
// vertex-transitive, así que la distancia mínima es, por definición, la
// longitud de arista — no hace falta conocer la combinatoria de antemano).
function findMinDistEdges(vertices: Vec4[]): [number, number][] {
  let minD = Infinity
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const d = dist4(vertices[i], vertices[j])
      if (d > 1e-9 && d < minD) minD = d
    }
  }
  const edges: [number, number][] = []
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      if (Math.abs(dist4(vertices[i], vertices[j]) - minD) < 1e-6) edges.push([i, j])
    }
  }
  return edges
}

function makeTesseractVertices(): Vec4[] {
  const vs: Vec4[] = []
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) for (const d of [-1, 1]) {
    vs.push([a, b, c, d])
  }
  return vs
}

function make24CellVertices(): Vec4[] {
  const vs: Vec4[] = []
  const slots: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]
  for (const [i, j] of slots) {
    for (const si of [-1, 1]) for (const sj of [-1, 1]) {
      const v: Vec4 = [0, 0, 0, 0]
      v[i] = si; v[j] = sj
      vs.push(v)
    }
  }
  return vs
}

function permutationsOf4(): number[][] {
  const result: number[][] = []
  const base = [0, 1, 2, 3]
  const permute = (arr: number[], acc: number[]) => {
    if (arr.length === 0) { result.push(acc); return }
    for (let i = 0; i < arr.length; i++) {
      permute([...arr.slice(0, i), ...arr.slice(i + 1)], [...acc, arr[i]])
    }
  }
  permute(base, [])
  return result
}

function permutationParity(perm: number[]): number {
  let inversions = 0
  for (let i = 0; i < perm.length; i++) {
    for (let j = i + 1; j < perm.length; j++) {
      if (perm[i] > perm[j]) inversions++
    }
  }
  return inversions % 2 // 0 = par
}

function make600CellVertices(): Vec4[] {
  const phi = (1 + Math.sqrt(5)) / 2
  const invPhi = 1 / phi
  const vs: Vec4[] = []
  // 8 vértices: permutaciones de (±1,0,0,0)
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
    const v: Vec4 = [0, 0, 0, 0]; v[i] = s; vs.push(v)
  }
  // 16 vértices: (±1/2,±1/2,±1/2,±1/2)
  for (const a of [-0.5, 0.5]) for (const b of [-0.5, 0.5]) for (const c of [-0.5, 0.5]) for (const d of [-0.5, 0.5]) {
    vs.push([a, b, c, d])
  }
  // 96 vértices: permutaciones PARES de (±phi/2, ±1/2, ±1/(2phi), 0)
  const base = [phi / 2, 0.5, invPhi / 2, 0]
  for (const idxPerm of permutationsOf4()) {
    if (permutationParity(idxPerm) !== 0) continue
    const permuted = idxPerm.map((i) => base[i]) as Vec4
    const nonZeroPositions = permuted.map((v, i) => (v !== 0 ? i : -1)).filter((i) => i >= 0)
    for (const s0 of [-1, 1]) for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) {
      const v = [...permuted] as Vec4
      const signs = [s0, s1, s2]
      nonZeroPositions.forEach((pos, k) => { v[pos] = v[pos] * signs[k] })
      vs.push(v)
    }
  }
  return vs
}

const POLYTOPE_4D: Record<'tesseract' | '24cell' | '600cell', { vertices: Vec4[]; edges: [number, number][] }> = (() => {
  const tesseractVertices = normalizeVertices(makeTesseractVertices())
  const cell24Vertices = normalizeVertices(make24CellVertices())
  const cell600Vertices = normalizeVertices(make600CellVertices())
  return {
    tesseract: { vertices: tesseractVertices, edges: findMinDistEdges(tesseractVertices) },
    '24cell': { vertices: cell24Vertices, edges: findMinDistEdges(cell24Vertices) },
    '600cell': { vertices: cell600Vertices, edges: findMinDistEdges(cell600Vertices) },
  }
})()

// Nodo-ancla invisible y pickeable (posición + hover/click) con un wireframe
// de líneas como hijo — así el hover (que escala el mesh "oficial" del nodo)
// también escala visualmente el wireframe, sin tocar el sistema de picking
// genérico de abajo.
function create4DWireframeNode(
  scene: BABYLON.Scene,
  id: string,
  shape: 'tesseract' | '24cell' | '600cell',
  position: BABYLON.Vector3,
  color: string,
  visualScale: number,
): BABYLON.Mesh {
  const { vertices, edges: edgeList } = POLYTOPE_4D[shape]
  const colorObj = hexToColor3(color)

  const anchor = BABYLON.MeshBuilder.CreateSphere(`node-${id}-anchor`, { diameter: 1.7 }, scene)
  anchor.position = position
  const anchorMat = new BABYLON.StandardMaterial(`mat-${id}-anchor`, scene)
  anchorMat.alpha = 0
  anchor.material = anchorMat
  anchor.metadata = { entryId: id }

  let lines = BABYLON.MeshBuilder.CreateLineSystem(`node-${id}-wire`, {
    lines: edgeList.map(() => [BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero()]),
    updatable: true,
  }, scene)
  lines.color = colorObj
  lines.parent = anchor
  lines.isPickable = false

  const camDistance = 2.4
  let t = Math.random() * 10
  scene.onBeforeRenderObservable.add(() => {
    t += scene.getEngine().getDeltaTime() * 0.00035
    const a = t
    const b = t * 0.7
    const cosA = Math.cos(a), sinA = Math.sin(a)
    const cosB = Math.cos(b), sinB = Math.sin(b)
    const projected = vertices.map(([x, y, z, w]) => {
      // rotación simultánea en dos planos ortogonales (xw, yz) — sin esto,
      // la proyección 4D->3D de un politopo regular se ve estática desde
      // casi cualquier ángulo fijo.
      const x1 = x * cosA - w * sinA
      const w1 = x * sinA + w * cosA
      const y1 = y * cosB - z * sinB
      const z1 = y * sinB + z * cosB
      // proyección en perspectiva: dividir por (distancia - w) es lo que
      // hace que los vértices "más atrás" en la 4ta dimensión se vean más
      // chicos, igual que una proyección 3D->2D normal divide por profundidad
      const f = visualScale / (camDistance - w1)
      return new BABYLON.Vector3(x1 * f, y1 * f, z1 * f)
    })
    const linePairs = edgeList.map(([ia, ib]) => [projected[ia], projected[ib]])
    lines = BABYLON.MeshBuilder.CreateLineSystem(`node-${id}-wire`, { lines: linePairs, instance: lines }, scene)
  })

  return anchor
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
      // loopMode: el 4to-al-final — 0 es BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE,
      // no "sin loop" como parece a simple vista. En RELATIVE, cada vez que la
      // animación completa su ciclo vuelve a sumar el delta (to-from) sobre el
      // valor ya alcanzado — con loop=true por defecto, el target de la cámara
      // crecía sin límite mientras la página seguía abierta (confirmado: a los
      // 3.5s ya estaba ~5x más lejos que el nodo real). CONSTANT mantiene el
      // valor final de "to" una vez terminada, sin re-sumar nada.
      BABYLON.Animation.CreateAndStartAnimation('camTarget', camera, 'target', 30, 20, camera.target.clone(), pos.clone(), BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT)
      BABYLON.Animation.CreateAndStartAnimation('camRadius', camera, 'radius', 30, 20, camera.radius, 7.5, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT)
    },
    resetView() {
      const camera = cameraRef.current
      if (!camera) return
      selectedIdRef.current = null
      BABYLON.Animation.CreateAndStartAnimation('camTargetReset', camera, 'target', 30, 20, camera.target.clone(), BABYLON.Vector3.Zero(), BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT)
      BABYLON.Animation.CreateAndStartAnimation('camRadiusReset', camera, 'radius', 30, 20, camera.radius, 26, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT)
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
      const is4D = entry.nodeShape === 'tesseract' || entry.nodeShape === '24cell' || entry.nodeShape === '600cell'
      let mesh: BABYLON.Mesh

      if (is4D) {
        // Wireframe 4D real, proyectado y rotando en vivo — no un poliedro
        // genérico. create4DWireframeNode ya setea position/material(alpha
        // 0, pickeable)/metadata y arma su propia animación por cuadro.
        mesh = create4DWireframeNode(scene, entry.id, entry.nodeShape as 'tesseract' | '24cell' | '600cell', pos, color, 0.85)
      } else {
        // El nodo ES el objeto que describe cuando la entrada lo pide
        // (components/knowledge/entries.ts, campo nodeShape) — si no, cae
        // al poliedro genérico de su cluster, como antes.
        switch (entry.nodeShape) {
          case 'point':
            mesh = BABYLON.MeshBuilder.CreateSphere(`node-${entry.id}`, { diameter: 0.32 }, scene)
            break
          case 'line':
            mesh = BABYLON.MeshBuilder.CreateBox(`node-${entry.id}`, { width: 1.3, height: 0.09, depth: 0.09 }, scene)
            break
          case 'triangle':
            mesh = BABYLON.MeshBuilder.CreateDisc(`node-${entry.id}`, { radius: 0.45, tessellation: 3 }, scene)
            break
          case 'cube':
            mesh = BABYLON.MeshBuilder.CreateBox(`node-${entry.id}`, { size: 0.78 }, scene)
            break
          default: {
            // tetrahedron/octahedron/dodecahedron/icosahedron tienen type
            // fijo propio; sin nodeShape, usa el default del cluster.
            const typeByShape: Partial<Record<string, number>> = {
              tetrahedron: 0, octahedron: 1, dodecahedron: 2, icosahedron: 3,
            }
            const polyType = (entry.nodeShape && typeByShape[entry.nodeShape]) ?? CLUSTER_POLY_TYPE[entry.cluster]
            mesh = BABYLON.MeshBuilder.CreatePolyhedron(`node-${entry.id}`, { type: polyType, size: 0.5 }, scene)
          }
        }
        mesh.position = pos
        const mat = new BABYLON.StandardMaterial(`mat-${entry.id}`, scene)
        mat.emissiveColor = hexToColor3(color)
        mat.diffuseColor = hexToColor3(color).scale(0.15)
        mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1)
        mat.alpha = 0.92
        mat.backFaceCulling = false // 'triangle'/'line' son planos/finos — visibles desde cualquier lado
        mesh.material = mat
        mesh.metadata = { entryId: entry.id }
      }
      meshesById.current[entry.id] = mesh

      // idle spin, unique per node — los wireframes 4D ya tienen su propia
      // animación de rotación (en 4D), así que no suman un segundo giro 3D.
      if (!is4D) {
        const spinSpeed = 0.0015 + (i % 5) * 0.0006
        scene.onBeforeRenderObservable.add(() => {
          mesh.rotation.y += spinSpeed
          mesh.rotation.x += spinSpeed * 0.4
        })
      }

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
