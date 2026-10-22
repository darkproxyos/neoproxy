'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as BABYLON from 'babylonjs'
import { agents, AGENT_IMAGES } from './agents'

// Sin lineas de conexion a proposito: en la Wired nadie esta atado a nadie,
// cada proceso flota por su cuenta en la oscuridad. Posiciones dispersas, no
// una formacion geometrica prolija — DarkProxy apenas un poco mas cerca del
// centro y mas grande, el resto esparcido sin simetria.
const BASE_POSITIONS: Record<string, BABYLON.Vector3> = {
  darkproxy: new BABYLON.Vector3(0, 0.4, 0.5),
  metatron: new BABYLON.Vector3(3.4, 2.3, -1.6),
  d: new BABYLON.Vector3(-3.8, -1.3, 1.2),
  snake: new BABYLON.Vector3(2.1, -2.6, 2.8),
  genos: new BABYLON.Vector3(-2.3, 2.8, -2.4),
  trickster: new BABYLON.Vector3(3.8, -0.5, -3.2),
  prototype: new BABYLON.Vector3(-3.1, -2.2, -1.6),
}

const POLY_TYPES: Record<string, number> = {
  darkproxy: 3, // icosaedro — el mas complejo
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

// Retrato con marco — mismo truco de DynamicTexture que makeLabelTexture,
// pero dibujando la foto canónica del agente en vez de texto. Arranca
// dibujando solo el marco (la imagen tarda en cargar — same-origin, sin
// problema de CORS por venir de /public) y se redibuja sola al terminar de
// cargar, sin bloquear el resto del armado de la escena.
function makePhotoTexture(scene: BABYLON.Scene, agentId: string, src: string, color: string) {
  const size = 512
  const tex = new BABYLON.DynamicTexture(`pxv-photo-${agentId}`, { width: size, height: size }, scene, true)
  tex.hasAlpha = true
  const ctx = tex.getContext() as CanvasRenderingContext2D
  const pad = 16

  const draw = (img?: HTMLImageElement) => {
    ctx.clearRect(0, 0, size, size)
    if (img) {
      ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2)
    } else {
      ctx.fillStyle = `${color}22`
      ctx.fillRect(pad, pad, size - pad * 2, size - pad * 2)
    }
    ctx.strokeStyle = color
    ctx.lineWidth = 6
    ctx.shadowColor = color
    ctx.shadowBlur = 24
    ctx.strokeRect(pad / 2, pad / 2, size - pad, size - pad)
    tex.update()
  }

  draw()
  const img = new Image()
  img.onload = () => draw(img)
  img.src = src
  return tex
}

function makeDotTexture(scene: BABYLON.Scene) {
  const tex = new BABYLON.DynamicTexture('pxv-dust-dot', 64, scene, false)
  const ctx = tex.getContext() as CanvasRenderingContext2D
  const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, 64, 64)
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

    const camera = new BABYLON.ArcRotateCamera('pxv-cam', -Math.PI / 2.3, Math.PI / 2.3, 14, BABYLON.Vector3.Zero(), scene)
    camera.attachControl(canvas, true)
    camera.wheelPrecision = 35
    camera.lowerRadiusLimit = 5
    camera.upperRadiusLimit = 24
    camera.minZ = 0.1

    const ambient = new BABYLON.HemisphericLight('pxv-ambient', new BABYLON.Vector3(0, 1, 0), scene)
    ambient.intensity = 0.3

    const glow = new BABYLON.GlowLayer('pxv-glow', scene)
    glow.intensity = 0.9

    // Niebla de señal — ruido de fondo, como estatica entre canales
    const dust = new BABYLON.ParticleSystem('pxv-dust', 500, scene)
    dust.particleTexture = makeDotTexture(scene)
    dust.emitter = BABYLON.Vector3.Zero()
    dust.createSphereEmitter(9, 0)
    dust.minSize = 0.02
    dust.maxSize = 0.09
    dust.minLifeTime = Number.MAX_SAFE_INTEGER
    dust.maxLifeTime = Number.MAX_SAFE_INTEGER
    dust.emitRate = 0
    dust.manualEmitCount = 500
    dust.minEmitPower = 0
    dust.maxEmitPower = 0
    dust.color1 = new BABYLON.Color4(0.3, 0.6, 0.8, 0.35)
    dust.color2 = new BABYLON.Color4(0.5, 0.3, 0.7, 0.25)
    dust.start()

    type Drift = {
      mesh: BABYLON.Mesh; plane: BABYLON.Mesh; photoPlane?: BABYLON.Mesh
      base: BABYLON.Vector3; labelOffsetY: number; phase: number; freq: BABYLON.Vector3; amp: BABYLON.Vector3
    }
    const drifters: Drift[] = []

    agents.forEach((agent, i) => {
      const base = BASE_POSITIONS[agent.id] ?? BABYLON.Vector3.Zero()
      const isRoot = agent.id === 'darkproxy'
      const color = agent.color
      const image = AGENT_IMAGES[agent.id]

      // Con retrato, el gem queda chico y de adorno atrás (deja de ser
      // clickeable); sin retrato, sigue siendo el nodo entero como antes —
      // mismo fallback que usa el perfil en /proxyverse/[id].
      const mesh = BABYLON.MeshBuilder.CreatePolyhedron(`pxv-node-${agent.id}`, {
        type: POLY_TYPES[agent.id] ?? 0,
        size: image ? (isRoot ? 0.4 : 0.28) : (isRoot ? 0.85 : 0.55),
      }, scene)
      mesh.position = base.clone()
      const mat = new BABYLON.StandardMaterial(`pxv-mat-${agent.id}`, scene)
      mat.emissiveColor = hexToColor3(color)
      mat.diffuseColor = hexToColor3(color).scale(0.15)
      mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1)
      mat.alpha = 0.92
      mesh.material = mat
      mesh.isPickable = !image
      mesh.metadata = image ? undefined : { agentId: agent.id }
      // Con retrato el gem no se ve — solo queda como ancla de posición
      // (lo sigue usando el loop de deriva de abajo) para no duplicar la
      // lógica de "flotar sin rumbo" en otro lado. Visible se notaba
      // asomando dentro del marco de la foto por errores de orden de
      // transparencia entre el plano (alpha-blend) y el poliedro opaco.
      if (image) mesh.isVisible = false

      const spinSpeed = 0.0012 + (i % 5) * 0.0006
      scene.onBeforeRenderObservable.add(() => {
        mesh.rotation.y += spinSpeed
        mesh.rotation.x += spinSpeed * 0.4
      })

      let photoPlane: BABYLON.Mesh | undefined
      if (image) {
        const photoTex = makePhotoTexture(scene, agent.id, image, color)
        photoPlane = BABYLON.MeshBuilder.CreatePlane(`pxv-photo-${agent.id}`, {
          size: isRoot ? 1.75 : 1.35,
        }, scene)
        photoPlane.position = base.clone()
        photoPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL
        const photoMat = new BABYLON.StandardMaterial(`pxv-photomat-${agent.id}`, scene)
        photoMat.diffuseTexture = photoTex
        photoMat.emissiveTexture = photoTex
        photoMat.opacityTexture = photoTex
        photoMat.disableLighting = true
        photoMat.backFaceCulling = false
        photoPlane.material = photoMat
        photoPlane.metadata = { agentId: agent.id }
      }

      const label = makeLabelTexture(scene, agent.name, color)
      const plane = BABYLON.MeshBuilder.CreatePlane(`pxv-label-${agent.id}`, { width: 2.4, height: 0.6 }, scene)
      const labelOffsetY = image ? (isRoot ? 1.5 : 1.15) : (isRoot ? 1.1 : 0.85)
      plane.position = base.add(new BABYLON.Vector3(0, labelOffsetY, 0))
      plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL
      const planeMat = new BABYLON.StandardMaterial(`pxv-labelmat-${agent.id}`, scene)
      planeMat.diffuseTexture = label
      planeMat.emissiveTexture = label
      planeMat.opacityTexture = label
      planeMat.disableLighting = true
      planeMat.backFaceCulling = false
      plane.material = planeMat
      plane.isPickable = false

      // Deriva propia, sin rumbo — cada entidad flota a su ritmo, nadie la
      // ata a una posicion fija ni a las demas.
      drifters.push({
        mesh, plane, photoPlane, base, labelOffsetY,
        phase: i * 1.7,
        freq: new BABYLON.Vector3(0.18 + i * 0.015, 0.14 + i * 0.02, 0.21 + i * 0.011),
        amp: new BABYLON.Vector3(0.5, 0.4, 0.5),
      })
    })

    scene.onBeforeRenderObservable.add(() => {
      const t = performance.now() / 1000
      for (const d of drifters) {
        const dx = Math.sin(t * d.freq.x + d.phase) * d.amp.x
        const dy = Math.cos(t * d.freq.y + d.phase * 1.3) * d.amp.y
        const dz = Math.sin(t * d.freq.z + d.phase * 0.7) * d.amp.z
        d.mesh.position.set(d.base.x + dx, d.base.y + dy, d.base.z + dz)
        d.plane.position.set(d.mesh.position.x, d.mesh.position.y + d.labelOffsetY, d.mesh.position.z)
        d.photoPlane?.position.set(d.mesh.position.x, d.mesh.position.y, d.mesh.position.z)
      }
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
      if (!isInteracting) camera.alpha += 0.0006 * engine.getDeltaTime()
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
