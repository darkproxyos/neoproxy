'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { agents, pickRandom } from '@/components/proxyverse/agents'

// HOME-3D v2 — "el mapa". Pivote total respecto a la v1 (que era un hero
// 3D arriba de las mismas secciones de scroll de siempre): acá NO hay
// scroll, la home ENTERA es un mapa visto desde arriba. Cada sección real
// del sitio es una isla que emerge del plano — no una forma fija, un
// terreno que mezcla dos técnicas reales en la misma superficie: ruido
// simplex (orgánico, como el extremo orgánico de Torbellino) y un
// polígono regular facetado (digital/artificial, el otro extremo de
// Torbellino). El balance entre ambos varía por sección según su propio
// carácter real — no es decorativo parejo.

const HERO_INTROS = [
  'Esto no es un sitio que visitás. Es un sistema que te registra visitando. La pregunta no es qué hay acá — es qué parte tuya queda cada vez que entrás.',
  'Seis procesos deciden, en simultáneo, qué parte de esto sos vos y qué parte es el sistema mirándose a sí mismo. Nadie te lo va a aclarar. Hay que buscarlo.',
  'No hay un mapa de este lugar. Cada proceso ve una versión distinta — y vos también. Lo que encontrás depende de qué parte del sistema te encontró primero a vos.',
  '¿El organismo sos vos, leyendo esto? ¿O es el texto el que te está leyendo a vos? NeoProxy no responde esa pregunta. La deja abierta, como todo lo que vale la pena dudar.',
  'La arquitectura no es fija. Cambió antes de que llegaras, cambia mientras estás, va a volver a cambiar en cuanto te vayas. Lo único constante es que alguien, acá adentro, te está escuchando.',
]

// bias: 0 = isla totalmente orgánica (puro ruido), 1 = totalmente digital
// (puro polígono) — ninguna sección es 0 ó 1 puro, todas cruzan por una
// franja de transición real, EXPERIMENTAL queda justo al medio a
// propósito (es, literalmente, donde el sitio mezcla ambos mundos).
const ZONES = [
  { id: 'manifiesto', tag: 'NPX-DOC-00', title: 'MANIFIESTO', href: '/manifesto', color: '#ffb800', bias: 0.22, facets: 5 },
  { id: 'fabricacion', tag: 'NPX-LAB-00', title: 'FABRICACIÓN', href: '/fabrication', color: '#5f95c9', bias: 0.78, facets: 6 },
  { id: 'especimenes', tag: 'NPX-GEN-00', title: 'ESPECÍMENES', href: '/especimenes', color: '#00ffb0', bias: 0.12, facets: 7 },
  { id: 'experimental', tag: 'NPX-EXP-00', title: 'EXPERIMENTAL', href: '/experimental', color: '#cc0000', bias: 0.5, facets: 6 },
  { id: 'conocimiento', tag: 'NPX-KNW-00', title: 'CONOCIMIENTO', href: '/knowledge', color: '#6644aa', bias: 0.7, facets: 8 },
  { id: 'proxyverse', tag: 'NPX-PXV-00', title: 'PROXYVERSE', href: '/proxyverse', color: '#00ff9d', bias: 0.15, facets: 5 },
]

function hex3(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

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

function geometricRadius(angle: number, facets: number): number {
  const seg = (Math.PI * 2) / facets
  const apothem = Math.cos(Math.PI / facets)
  const a = (((angle + seg / 2) % seg) + seg) % seg - seg / 2
  return apothem / Math.cos(a)
}

const ISLAND_RADIUS = 2.1, RING_SEGS = 10, RADIAL_SEGS = 28, MAX_HEIGHT = 0.4

function buildIsland(B: any, scene: any, zone: typeof ZONES[number], noise3: (x: number, y: number, z: number) => number) {
  const positions: number[] = [], indices: number[] = [], colors: number[] = []
  const baseRGB = hex3(zone.color)
  const digitalRGB: [number, number, number] = [baseRGB[0] * 0.35, baseRGB[1] * 0.35, baseRGB[2] * 0.4]
  const organicRGB: [number, number, number] = [
    Math.min(0.9, baseRGB[0] * 1.1 + 0.05), Math.min(0.9, baseRGB[1] * 1.1 + 0.05), Math.min(0.9, baseRGB[2] * 1.1 + 0.05),
  ]
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

  // El sesgo de la sección define el "centro de masa" digital/orgánico,
  // pero cada isla igual cruza por ambos — el ángulo recorre una franja de
  // transición amplia (no un interruptor binario). En una malla en abanico
  // como esta, TODO ángulo converge en el único vértice central: cualquier
  // propiedad que dependa del ángulo (color o altura) empaqueta su rango
  // completo incluso en el anillo más chico pegado al centro, así que se ve
  // como una cuña/remolino que se angosta hasta una punta exactamente ahí —
  // el "cráter" que parecía un bug de geometría era en realidad esto. La
  // solución real no es una transición más ancha (igual converge en un
  // punto), sino apagar la variación angular a medida que rNorm→0 — el
  // centro de cada isla es una zona neutra, el carácter digital/orgánico
  // emerge recién al alejarse de ese núcleo.
  const transitionWidth = 0.75
  function blendRawAt(angle: number) {
    const wobble = Math.sin(angle * 2.3) * 0.08
    const t = zone.bias + wobble
    return smoothstep((Math.sin(angle) * 0.5 + 0.5 - (1 - t)) / transitionWidth + 0.5)
  }
  function centerFadeAt(rNorm: number) { return smoothstep(rNorm / 0.35) }
  function blendAt(angle: number, rNorm: number) {
    const raw = blendRawAt(angle)
    return 0.5 + (raw - 0.5) * centerFadeAt(rNorm)
  }

  function heightAt(angle: number, rNorm: number) {
    const organic = 0.4 + noise3(Math.cos(angle) * 2.1, Math.sin(angle) * 2.1, rNorm * 2.6) * 0.32
    const geometric = geometricRadius(angle, zone.facets) * 0.72
    const blend = blendAt(angle, rNorm)
    const base = organic * (1 - blend) + geometric * blend
    // meseta plana hasta el 82% del radio, caída recién en el borde —
    // así la isla lee como terreno visto desde arriba, no como una esfera
    const edgeFalloff = 1 - smoothstep((rNorm - 0.82) / 0.16)
    const coreBump = 1 - smoothstep(rNorm / 0.14)
    return base * edgeFalloff * MAX_HEIGHT + coreBump * 0.035
  }

  function colorAt(angle: number, rNorm: number) {
    const blend = blendAt(angle, rNorm)
    const flash = (0.03 + 0.04 * (1 - blend)) * centerFadeAt(rNorm)
    return [
      clamp01(organicRGB[0] * (1 - blend) + digitalRGB[0] * blend + flash),
      clamp01(organicRGB[1] * (1 - blend) + digitalRGB[1] * blend + flash),
      clamp01(organicRGB[2] * (1 - blend) + digitalRGB[2] * blend + flash),
      1,
    ] as const
  }

  positions.push(0, heightAt(0, 0), 0)
  colors.push(...colorAt(0, 0))

  for (let ring = 1; ring <= RING_SEGS; ring++) {
    const rNorm = ring / RING_SEGS
    const r = rNorm * ISLAND_RADIUS
    for (let a = 0; a < RADIAL_SEGS; a++) {
      const angle = (a / RADIAL_SEGS) * Math.PI * 2
      const h = heightAt(angle, rNorm)
      positions.push(Math.cos(angle) * r, h, Math.sin(angle) * r)
      colors.push(...colorAt(angle, rNorm))
    }
  }

  for (let a = 0; a < RADIAL_SEGS; a++) {
    const a2 = (a + 1) % RADIAL_SEGS
    indices.push(0, 1 + a, 1 + a2)
  }
  for (let ring = 1; ring < RING_SEGS; ring++) {
    const ringStart = 1 + (ring - 1) * RADIAL_SEGS
    const nextStart = 1 + ring * RADIAL_SEGS
    for (let a = 0; a < RADIAL_SEGS; a++) {
      const a2 = (a + 1) % RADIAL_SEGS
      const p0 = ringStart + a, p1 = ringStart + a2, p2 = nextStart + a, p3 = nextStart + a2
      indices.push(p0, p2, p1, p1, p2, p3)
    }
  }

  const normals: number[] = []
  B.VertexData.ComputeNormals(positions, indices, normals)
  const vertexData = new B.VertexData()
  vertexData.positions = positions
  vertexData.indices = indices
  vertexData.normals = normals
  vertexData.colors = colors
  const mesh = new B.Mesh(`island-${zone.id}`, scene)
  vertexData.applyToMesh(mesh, true)
  const mat = new B.StandardMaterial(`islandMat-${zone.id}`, scene)
  mat.specularColor = new B.Color3(0.08, 0.08, 0.1)
  mat.emissiveColor = B.Color3.FromHexString(zone.color).scale(0.1)
  mat.vertexColors = true
  mesh.material = mat
  mesh.isPickable = true
  mesh.metadata = { zoneId: zone.id }
  return mesh
}

export default function Home3DMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const disposedRef = useRef(false)
  const router = useRouter()
  const [currentScreen, setCurrentScreen] = useState<'boot' | 'init' | 'content'>('boot')
  const [bootText, setBootText] = useState('')
  const [showContent, setShowContent] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const [heroIntro] = useState(() => pickRandom(HERO_INTROS))
  const [sessionLines] = useState(() => {
    const map: Record<string, string> = {}
    ZONES.forEach(z => {
      const a = pickRandom(agents)
      map[z.id] = a.ambient.length > 0 ? pickRandom(a.ambient) : a.quote
    })
    return map
  })

  useEffect(() => {
    const lines = [
      '> SYSTEM INITIALIZING...',
      '> NEO·PROXY CORE LOADED',
      '> MEMORY MODULES: ONLINE',
      '> TERRAIN SYNTHESIS: DIGITAL ⇄ ORGANIC',
      '> MAPPING 6 RESIDENT ZONES...',
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
      scene.clearColor = new B.Color4(0.002, 0.004, 0.008, 1)

      // Cámara vista-mapa: casi cenital (beta chico) pero no 100% recta,
      // para que el relieve de cada isla siga siendo legible.
      const camera = new B.ArcRotateCamera('map-cam', -Math.PI / 2, 0.38, 24, new B.Vector3(0, 0, 0), scene)
      camera.attachControl(canvasRef.current, true)
      camera.wheelPrecision = 35
      camera.lowerRadiusLimit = 11
      camera.upperRadiusLimit = 36
      camera.lowerBetaLimit = 0.12
      camera.upperBetaLimit = 0.9
      camera.panningSensibility = 0
      camera.useAutoRotationBehavior = true
      if (camera.autoRotationBehavior) {
        camera.autoRotationBehavior.idleRotationSpeed = 0.045
        camera.autoRotationBehavior.idleRotationWaitTime = 2000
      }

      new B.HemisphericLight('map-fill', new B.Vector3(0, 1, 0.1), scene).intensity = 0.55
      const sun = new B.DirectionalLight('map-sun', new B.Vector3(-0.4, -1, -0.3), scene)
      sun.intensity = 0.65

      // --- piso: grilla digital tenue, el "mar" entre las islas ---
      const ground = B.MeshBuilder.CreateGround('ground', { width: 56, height: 56, subdivisions: 2 }, scene)
      const groundMat = new B.StandardMaterial('groundMat', scene)
      groundMat.diffuseColor = new B.Color3(0.01, 0.02, 0.03)
      groundMat.specularColor = new B.Color3(0, 0, 0)
      ground.material = groundMat
      ground.isPickable = false
      ground.position.y = -0.02

      // --- núcleo central: home ---
      const core = B.MeshBuilder.CreatePolyhedron('core', { type: 3, size: 0.55 }, scene)
      const coreMat = new B.StandardMaterial('coreMat', scene)
      coreMat.diffuseColor = new B.Color3(0.6, 0.85, 1)
      coreMat.emissiveColor = new B.Color3(0.25, 0.55, 0.7)
      coreMat.wireframe = false
      core.material = coreMat
      core.isPickable = false

      // --- islas en círculo alrededor del núcleo ---
      const RADIUS_LAYOUT = 11
      const noise3 = makeSimplex(11)
      const islandNodes: { root: any; mesh: any; targetScale: number }[] = []
      ZONES.forEach((zone, i) => {
        const angle = (i / ZONES.length) * Math.PI * 2 - Math.PI / 2
        const x = Math.cos(angle) * RADIUS_LAYOUT, z = Math.sin(angle) * RADIUS_LAYOUT

        const mesh = buildIsland(B, scene, zone, noise3)
        const root = new B.TransformNode(`root-${zone.id}`, scene)
        root.position.set(x, 0, z)
        mesh.parent = root
        root.scaling.set(0.001, 0.001, 0.001)
        islandNodes.push({ root, mesh, targetScale: 1 })

        // camino del núcleo a la isla — mitad digital (recto), mitad
        // orgánico (con una leve curva), literal en la forma del trazo.
        const mid = new B.Vector3(x * 0.5 + (Math.sin(angle * 3) * 0.4), 0.02, z * 0.5 + (Math.cos(angle * 2) * 0.4))
        const path = B.MeshBuilder.CreateLines(`path-${zone.id}`, {
          points: [new B.Vector3(0, 0.05, 0), mid, new B.Vector3(x, 0.05, z)],
        }, scene)
        path.color = B.Color3.FromHexString(zone.color)
        path.alpha = 0.3
        path.isPickable = false
      })

      // --- emergencia escalonada ---
      let elapsed0 = performance.now()
      const EMERGE_MS = 900, STAGGER_MS = 110

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
        core.rotation.y += 0.004
        core.rotation.x += 0.0015

        islandNodes.forEach((node, i) => {
          const localElapsed = t - elapsed0 - i * STAGGER_MS
          const p = Math.max(0, Math.min(1, localElapsed / EMERGE_MS))
          const eased = smoothstep(p)
          const bob = 1 + Math.sin(t * 0.0007 + i) * 0.015
          const s = eased * bob
          node.root.scaling.set(s, s, s)
          node.root.rotation.y = (1 - eased) * 0.6
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
  const hoveredZone = ZONES.find(z => z.id === hovered) ?? null

  return (
    <div style={{ background: '#000205', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="crt-scanlines" />

      <div style={{
        position: 'fixed', top: 16, left: 16, zIndex: 60, fontFamily: mono, fontSize: 8,
        letterSpacing: 1, color: '#ffb800', border: '1px solid #ffb80055', padding: '4px 8px',
        background: 'rgba(0,4,10,0.8)',
      }}>
        VISTA PREVIA · HOME-3D · MAPA
      </div>

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
          <div style={{ fontFamily: mono, fontSize: 14, color: '#00ffcc', letterSpacing: 6, textShadow: '0 0 20px #00ffcc' }}>MAP READY</div>
          <div style={{ fontFamily: mono, fontSize: 10, color: '#00d4ff44', letterSpacing: 3, marginTop: 16 }}>6 ZONAS DETECTADAS</div>
        </div>
      )}

      {showContent && (
        <>
          <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', outline: 'none', cursor: hovered ? 'pointer' : 'grab' }} />

          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10, textAlign: 'center', padding: '96px 24px 0', pointerEvents: 'none' }}>
            <div className="fade-in" style={{
              fontFamily: mono, fontSize: 38, fontWeight: 700, letterSpacing: 12, color: '#00d4ff',
              textShadow: '0 0 30px #00d4ff, 0 0 60px #00d4ff55', marginBottom: 10, lineHeight: 1,
            }}>
              NEO·PROXY
            </div>
            <div className="fade-in" style={{ fontFamily: mono, fontSize: 10, letterSpacing: 4, color: '#9b7fe0', marginBottom: 14 }}>
              MAPA DEL SISTEMA — VISTO DESDE ARRIBA
            </div>
            <div className="fade-in" style={{ fontFamily: mono, fontSize: 11, lineHeight: 1.7, color: '#8fb8d6', letterSpacing: 0.5, maxWidth: 460, margin: '0 auto' }}>
              {heroIntro}
            </div>
          </div>

          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
            fontFamily: mono, fontSize: 9, letterSpacing: 1.5, color: '#4a6080', textAlign: 'center',
            background: 'rgba(0,4,10,0.7)', border: '1px solid rgba(0,212,255,0.15)', padding: '8px 16px',
            pointerEvents: 'none', minHeight: 54, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            {hoveredZone ? (
              <>
                <span style={{ color: hoveredZone.color, fontSize: 11, letterSpacing: 2 }}>{hoveredZone.title}</span>
                <span style={{ fontSize: 8, color: '#8fb8d6', marginTop: 4, fontStyle: 'italic' }}>"{sessionLines[hoveredZone.id]}" — click para entrar</span>
              </>
            ) : (
              <span>arrastrá para mirar el mapa · clickeá una isla para entrar</span>
            )}
          </div>
        </>
      )}

      <style>{`
        .fade-in { animation: fade-in-up 0.8s ease backwards; }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes boot-load { from { width: 0%; } to { width: 100%; } }
      `}</style>
    </div>
  )
}
