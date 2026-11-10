'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { agents, AGENT_IMAGES } from '@/components/proxyverse/agents'

// HOME — "la nube". Reemplaza a la home 2D/scroll (polytope 4D + secciones
// con scroll + efecto venom), preservada entera y sin cambios en
// app/home-classic/page.tsx. Esta era /home-3d v3, probada ahí como preview
// durante varias iteraciones (v1: hero 3D arriba de las mismas secciones de
// siempre; v2: un mapa visto desde arriba, cada sección una isla de terreno)
// antes de pasar acá — ver ese historial en git para el porqué de cada
// pivote. Sin plano, sin terreno, sin arriba fijo: las 6 secciones son
// nodos que flotan dispersos dentro de una nube de partículas digitales,
// cámara libre orbitando despacio alrededor. Ergo Proxy / Lain en vez de
// Ghost in the Shell: no un territorio que se mapea, una señal dispersa en
// el ruido — "la Wired" antes que "la ciudad".
// /home-3d ahora redirige acá (ver app/home-3d/page.tsx).
//
// Sin texto superpuesto a propósito: ni título ni instrucciones sobre el
// canvas — el visor se lee solo por lo que se ve (los nodos de color, los
// retratos del proxyverso flotando) y por lo que se siente al moverse
// (cursor a mano al pasar sobre un nodo). La pantalla de boot (antes de
// este punto) sigue siendo texto — es una carga, no el visor en sí.
//
// Los retratos: mismo truco de ProxyverseScene.tsx (makePhotoTexture — un
// DynamicTexture que dibuja la foto canónica de cada agente con un marco de
// su color, billboard para que siempre mire a cámara), siete procesos
// residentes flotando sin rumbo fijo entre la nube y los nodos de sección,
// no atados a nada — "en la Wired nadie está atado a nadie" es literal acá
// también.

const ZONES = [
  { id: 'manifiesto', tag: 'NPX-DOC-00', title: 'MANIFIESTO', href: '/manifesto', color: '#ffb800' },
  { id: 'fabricacion', tag: 'NPX-LAB-00', title: 'FABRICACIÓN', href: '/fabrication', color: '#5f95c9' },
  { id: 'artefactos', tag: 'NPX-REL-00', title: 'ARTEFACTOS', href: '/artifacts', color: '#ff5e9e' },
  { id: 'laboratorio', tag: 'NPX-LAB-01', title: 'LABORATORIO', href: '/lab', color: '#cc0000' },
  { id: 'conocimiento', tag: 'NPX-KNW-00', title: 'CONOCIMIENTO', href: '/knowledge', color: '#6644aa' },
  { id: 'proxyverse', tag: 'NPX-PXV-00', title: 'PROXYVERSE', href: '/proxyverse', color: '#00ff9d' },
]

function hex3(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

// Gustavson simplex 3D (dominio público) — misma implementación ya usada
// en Torbellino y en el mapa v2, reutilizada acá para darle a la nube
// zonas de densidad real en vez de un ruido uniforme tipo "televisor sin
// señal".
function makeSimplex(seed: number) {
  function mulberry32(a: number) {
    return function () {
      let t = (a += 0x6d2b79f5)
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
  const rand = mulberry32(seed)
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  for (let i = 255; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const tmp = p[i]; p[i] = p[j]; p[j] = tmp }
  const perm = new Uint8Array(512)
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
  const grad3 = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]]
  const F3 = 1 / 3, G3 = 1 / 6
  const dot = (g: number[], x: number, y: number, z: number) => g[0] * x + g[1] * y + g[2] * z
  return function noise3(xin: number, yin: number, zin: number) {
    let n0, n1, n2, n3
    const s = (xin + yin + zin) * F3
    const i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s)
    const t = (i + j + k) * G3
    const X0 = i - t, Y0 = j - t, Z0 = k - t
    const x0 = xin - X0, y0 = yin - Y0, z0 = zin - Z0
    let i1, j1, k1, i2, j2, k2
    if (x0 >= y0) { if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0 } else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1 } else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1 } }
    else { if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1 } else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1 } else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0 } }
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3
    const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3
    const ii = i & 255, jj = j & 255, kk = k & 255
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0
    if (t0 < 0) n0 = 0; else { t0 *= t0; const gi0 = grad3[perm[ii + perm[jj + perm[kk]]] % 12]; n0 = t0 * t0 * dot(gi0, x0, y0, z0) }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1
    if (t1 < 0) n1 = 0; else { t1 *= t1; const gi1 = grad3[perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12]; n1 = t1 * t1 * dot(gi1, x1, y1, z1) }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2
    if (t2 < 0) n2 = 0; else { t2 *= t2; const gi2 = grad3[perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12]; n2 = t2 * t2 * dot(gi2, x2, y2, z2) }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3
    if (t3 < 0) n3 = 0; else { t3 *= t3; const gi3 = grad3[perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12]; n3 = t3 * t3 * dot(gi3, x3, y3, z3) }
    return 32 * (n0 + n1 + n2 + n3)
  }
}

function smoothstep(t: number) { const c = Math.max(0, Math.min(1, t)); return c * c * (3 - 2 * c) }

// Distribución de Fibonacci sobre una esfera — misma técnica ya usada para
// repartir los 7 agentes en home-3d v1, acá para los 6 nodos de sección:
// separación pareja sin privilegiar ningún eje (no hay "arriba" en la Wired).
function fibonacciSphere(n: number, radius: number) {
  const pts: { x: number; y: number; z: number }[] = []
  const offset = 2 / n
  const increment = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = i * offset - 1 + offset / 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const phi = i * increment
    pts.push({ x: Math.cos(phi) * r * radius, y: y * radius * 0.72, z: Math.sin(phi) * r * radius })
  }
  return pts
}

// Retrato con marco — mismo truco que ProxyverseScene.tsx (components/
// proxyverse/ProxyverseScene.tsx): un DynamicTexture que arranca dibujando
// solo el marco de color (la imagen tarda en cargar) y se redibuja sola al
// terminar de cargar, sin bloquear el resto del armado de la escena.
function makePhotoTexture(B: any, scene: any, agentId: string, src: string, color: string) {
  const size = 512
  const tex = new B.DynamicTexture(`home-photo-${agentId}`, { width: size, height: size }, scene, true)
  tex.hasAlpha = true
  const ctx = tex.getContext()
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

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const disposedRef = useRef(false)
  const router = useRouter()
  const [currentScreen, setCurrentScreen] = useState<'boot' | 'init' | 'content'>('boot')
  const [bootText, setBootText] = useState('')
  const [showContent, setShowContent] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    const lines = [
      '> SYSTEM INITIALIZING...',
      '> NEO·PROXY CORE LOADED',
      '> ENTERING THE WIRED...',
      '> SIGNAL ⇄ NOISE: NO BORDER FOUND',
      '> 6 NODES DISPERSED IN THE CLOUD',
      '> WAITING FOR USER INPUT...',
    ]
    let i = 0
    const interval = setInterval(() => {
      if (i < lines.length) { setBootText(prev => prev + lines[i] + '\n'); i++ }
      else {
        clearInterval(interval)
        setTimeout(() => {
          setCurrentScreen('init')
          setTimeout(() => { setCurrentScreen('content'); setShowContent(true) }, 1300)
        }, 700)
      }
    }, 340)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!canvasRef.current || !showContent) return
    disposedRef.current = false
    let engine: any

    const init = async () => {
      const B = await import('@babylonjs/core')
      if (disposedRef.current) return

      engine = new B.Engine(canvasRef.current!, true, { preserveDrawingBuffer: true, stencil: true })
      const scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0.001, 0.002, 0.005, 1)

      // Cámara libre, no cenital: flotando a la altura de la nube, mirando
      // de frente — inmersiva, no un mapa visto desde afuera.
      const camera = new B.ArcRotateCamera('cloud-cam', -Math.PI / 2.4, 1.15, 27, B.Vector3.Zero(), scene)
      camera.attachControl(canvasRef.current, true)
      camera.wheelPrecision = 28
      camera.lowerRadiusLimit = 15
      camera.upperRadiusLimit = 42
      camera.lowerBetaLimit = 0.25
      camera.upperBetaLimit = Math.PI - 0.25
      camera.panningSensibility = 0
      camera.useAutoRotationBehavior = true
      if (camera.autoRotationBehavior) {
        camera.autoRotationBehavior.idleRotationSpeed = 0.055
        camera.autoRotationBehavior.idleRotationWaitTime = 1100
      }

      new B.HemisphericLight('cloud-fill', new B.Vector3(0, 1, 0.2), scene).intensity = 0.5
      const sun = new B.DirectionalLight('cloud-sun', new B.Vector3(-0.3, -0.8, -0.4), scene)
      sun.intensity = 0.55

      // --- núcleo central: home ---
      const core = B.MeshBuilder.CreatePolyhedron('core', { type: 3, size: 0.6 }, scene)
      const coreMat = new B.StandardMaterial('coreMat', scene)
      coreMat.diffuseColor = new B.Color3(0.6, 0.85, 1)
      coreMat.emissiveColor = new B.Color3(0.3, 0.6, 0.75)
      core.material = coreMat
      core.isPickable = false

      // --- nodos de sección, dispersos sobre una esfera (sin eje "arriba") ---
      const LAYOUT_RADIUS = 10.5
      const anchors = fibonacciSphere(ZONES.length, LAYOUT_RADIUS)
      const zoneCores: { mesh: any; color: [number, number, number] }[] = []
      const zoneRoot = new B.TransformNode('zoneRoot', scene)

      ZONES.forEach((zone, i) => {
        const { x, y, z } = anchors[i]
        const mesh = B.MeshBuilder.CreatePolyhedron(`core-${zone.id}`, { type: 2, size: 0.42 }, scene)
        mesh.position.set(x, y, z)
        const mat = new B.StandardMaterial(`coreMat-${zone.id}`, scene)
        const c = B.Color3.FromHexString(zone.color)
        mat.diffuseColor = c
        mat.emissiveColor = c.scale(0.55)
        mat.specularColor = new B.Color3(0.15, 0.15, 0.15)
        mesh.material = mat
        mesh.isPickable = true
        mesh.metadata = { zoneId: zone.id }
        mesh.parent = zoneRoot
        mesh.scaling.set(0.001, 0.001, 0.001)
        zoneCores.push({ mesh, color: hex3(zone.color) })

        // sinapsis del núcleo al nodo — con una leve curva orgánica, no una
        // recta digital pura: la señal no viaja en línea derecha acá adentro.
        const mid = new B.Vector3(x * 0.5 + Math.sin(i * 2.1) * 1.1, y * 0.5 + Math.cos(i * 1.7) * 1.1, z * 0.5 + Math.sin(i * 3.3) * 1.1)
        const path = B.MeshBuilder.CreateLines(`path-${zone.id}`, {
          points: [B.Vector3.Zero(), mid, new B.Vector3(x, y, z)],
        }, scene)
        path.color = c
        path.alpha = 0.22
        path.isPickable = false
      })

      // --- la nube: miles de motas en una sola malla con thin instances,
      // un solo draw call. Densidad real por ruido simplex (no uniforme —
      // se nota el gradiente de "señal" que sube cerca de cada nodo de
      // sección y cae al vacío entre ellos), tiñendo cada mota hacia el
      // color de la sección más cercana en vez de un cian parejo. ---
      const dustMesh = B.MeshBuilder.CreateBox('dust', { size: 1 }, scene)
      const dustMat = new B.StandardMaterial('dustMat', scene)
      dustMat.disableLighting = true
      dustMat.emissiveColor = new B.Color3(1, 1, 1)
      dustMat.alpha = 0.85
      dustMesh.material = dustMat
      dustMesh.isPickable = false

      const dustRoot = new B.TransformNode('dustRoot', scene)
      dustMesh.parent = dustRoot

      const noise3 = makeSimplex(17)
      const CANDIDATES = 5200
      const CLOUD_RADIUS = 17
      const matrices: number[] = []
      const colorBuf: number[] = []
      let kept = 0
      for (let i = 0; i < CANDIDATES; i++) {
        const costheta = Math.random() * 2 - 1
        const theta = Math.acos(costheta)
        const phi = Math.random() * Math.PI * 2
        const rNorm = 0.18 + 0.82 * Math.random()
        const r = CLOUD_RADIUS * rNorm
        const x = r * Math.sin(theta) * Math.cos(phi)
        const y = r * Math.sin(theta) * Math.sin(phi) * 0.75
        const z = r * Math.cos(theta)

        const n = (noise3(x * 0.09, y * 0.09, z * 0.09) + 1) / 2
        // zona más cercana — tiñe la mota hacia ese color si está cerca,
        // si no queda neutra (cian/blanco tenue, el "ruido de fondo").
        let nearest = -1, nearestD = Infinity
        for (let zi = 0; zi < anchors.length; zi++) {
          const a = anchors[zi]
          const d = (x - a.x) ** 2 + (y - a.y) ** 2 + (z - a.z) ** 2
          if (d < nearestD) { nearestD = d; nearest = zi }
        }
        const proximity = Math.max(0, 1 - Math.sqrt(nearestD) / 6.5)
        const density = n * 0.6 + proximity * 0.4
        if (density < 0.42) continue
        kept++

        const size = 0.045 + density * 0.1
        const m = B.Matrix.Scaling(size, size, size).multiply(B.Matrix.Translation(x, y, z))
        matrices.push(...m.asArray())

        const zoneRGB = hex3(ZONES[nearest].color)
        const tint = Math.min(1, proximity * 1.4)
        const base = 0.55 + n * 0.35
        colorBuf.push(
          base * (1 - tint) + zoneRGB[0] * tint,
          base * (1 - tint) + zoneRGB[1] * tint,
          (base + 0.1) * (1 - tint) + zoneRGB[2] * tint,
          0.35 + density * 0.55,
        )
      }
      dustMesh.thinInstanceSetBuffer('matrix', new Float32Array(matrices), 16)
      dustMesh.thinInstanceSetBuffer('color', new Float32Array(colorBuf), 4)

      // --- los 7 procesos residentes, flotando sin rumbo entre la nube —
      // mismo retrato canónico que /proxyverse (AGENT_IMAGES), billboard
      // para que siempre miren a cámara, deriva propia por agente (ni
      // posición fija ni sincronizada entre ellos: "en la Wired nadie está
      // atado a nadie" es literal también acá). Decorativos, no navegan —
      // los nodos de sección siguen siendo el único click real. ---
      type AgentDrift = { plane: any; base: { x: number; y: number; z: number }; phase: number; freq: { x: number; y: number; z: number } }
      const agentDrifters: AgentDrift[] = []
      agents.forEach((agent, i) => {
        const image = AGENT_IMAGES[agent.id]
        if (!image) return
        const costheta = Math.random() * 2 - 1
        const theta = Math.acos(costheta)
        const phi = Math.random() * Math.PI * 2
        const r = 6 + Math.random() * 8
        const base = {
          x: r * Math.sin(theta) * Math.cos(phi),
          y: r * Math.sin(theta) * Math.sin(phi) * 0.75,
          z: r * Math.cos(theta),
        }
        const photoTex = makePhotoTexture(B, scene, agent.id, image, agent.color)
        const plane = B.MeshBuilder.CreatePlane(`home-photo-${agent.id}`, { size: agent.id === 'darkproxy' ? 2.1 : 1.6 }, scene)
        plane.position.set(base.x, base.y, base.z)
        plane.billboardMode = B.Mesh.BILLBOARDMODE_ALL
        const photoMat = new B.StandardMaterial(`home-photomat-${agent.id}`, scene)
        photoMat.diffuseTexture = photoTex
        photoMat.emissiveTexture = photoTex
        photoMat.opacityTexture = photoTex
        photoMat.disableLighting = true
        photoMat.backFaceCulling = false
        plane.material = photoMat
        plane.isPickable = false
        plane.parent = dustRoot // condensa junto con el resto de la nube, sin animación aparte
        agentDrifters.push({
          plane, base,
          phase: i * 1.7,
          freq: { x: 0.16 + i * 0.013, y: 0.12 + i * 0.017, z: 0.19 + i * 0.01 },
        })
      })

      // --- emergencia: la nube entera condensa de la nada, los 6 núcleos
      // de sección aparecen escalonados encima ---
      const elapsed0 = performance.now()
      const CLOUD_EMERGE_MS = 1400
      const NODE_EMERGE_MS = 700, NODE_STAGGER_MS = 130

      scene.onPointerObservable.add((info: any) => {
        if (info.type === B.PointerEventTypes.POINTERPICK) {
          const picked = info.pickInfo?.pickedMesh
          const zoneId = picked?.metadata?.zoneId
          if (zoneId) {
            const zone = ZONES.find(z => z.id === zoneId)
            if (zone) router.push(zone.href)
          }
        }
        if (info.type === B.PointerEventTypes.POINTERMOVE) {
          const picked = scene.pick(scene.pointerX, scene.pointerY)
          const zoneId = picked?.pickedMesh?.metadata?.zoneId ?? null
          setHovered(zoneId)
        }
      })

      scene.registerBeforeRender(() => {
        const t = performance.now()
        core.rotation.y += 0.0045
        core.rotation.x += 0.0018
        const pulse = 1 + Math.sin(t * 0.0016) * 0.06
        core.scaling.set(pulse, pulse, pulse)

        const cloudP = smoothstep(Math.min(1, (t - elapsed0) / CLOUD_EMERGE_MS))
        dustRoot.scaling.set(cloudP, cloudP, cloudP)

        zoneCores.forEach((zc, i) => {
          const localElapsed = t - elapsed0 - 300 - i * NODE_STAGGER_MS
          const p = Math.max(0, Math.min(1, localElapsed / NODE_EMERGE_MS))
          const eased = smoothstep(p)
          const bob = 1 + Math.sin(t * 0.0009 + i * 1.7) * 0.05
          const s = eased * bob
          zc.mesh.scaling.set(s, s, s)
          zc.mesh.rotation.y += 0.006
          zc.mesh.rotation.x += 0.0022
        })

        // deriva propia de cada retrato — sin rumbo, nadie atado a nadie
        const ts = t / 1000
        agentDrifters.forEach(d => {
          const dx = Math.sin(ts * d.freq.x + d.phase) * 1.1
          const dy = Math.cos(ts * d.freq.y + d.phase * 1.3) * 0.9
          const dz = Math.sin(ts * d.freq.z + d.phase * 0.7) * 1.1
          d.plane.position.set(d.base.x + dx, d.base.y + dy, d.base.z + dz)
        })
      })

      engine.runRenderLoop(() => scene.render())
      const onResize = () => engine.resize()
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }

    let cleanupFn: (() => void) | undefined
    init().then(fn => { cleanupFn = fn })
    return () => {
      disposedRef.current = true
      cleanupFn?.()
      engine?.dispose()
    }
  }, [showContent, router])

  const mono = "'Space Mono', monospace"

  return (
    <div style={{ background: '#000205', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="crt-scanlines" />

      {currentScreen === 'boot' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', padding: '0 24px', background: '#000205',
        }}>
          <div style={{ fontFamily: mono, fontSize: 12, color: '#00d4ff', letterSpacing: 3, lineHeight: 2.2, whiteSpace: 'pre-wrap', textAlign: 'left', maxWidth: 600 }}>
            {bootText}
          </div>
          <div style={{ marginTop: 40, width: 300, height: 2, background: '#00d4ff11', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(to right, #00d4ff, #00ffcc)', animation: 'boot-load 2.1s ease forwards' }} />
          </div>
        </div>
      )}

      {currentScreen === 'init' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#000205' }}>
          <div style={{ fontFamily: mono, fontSize: 14, color: '#00ffcc', letterSpacing: 6, textShadow: '0 0 20px #00ffcc' }}>SIGNAL ACQUIRED</div>
          <div style={{ fontFamily: mono, fontSize: 10, color: '#00d4ff44', letterSpacing: 3, marginTop: 16 }}>6 NODOS DETECTADOS EN EL RUIDO</div>
        </div>
      )}

      {showContent && (
        <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', outline: 'none', cursor: hovered ? 'pointer' : 'grab' }} />
      )}

      <style>{`
        @keyframes boot-load { from { width: 0%; } to { width: 100%; } }
      `}</style>
    </div>
  )
}
