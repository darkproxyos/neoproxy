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
// pivote. Sin plano, sin terreno, sin arriba fijo: las secciones son nodos
// que flotan dispersos dentro de una nube de partículas digitales, cámara
// libre orbitando despacio alrededor. Ergo Proxy / Lain en vez de Ghost in
// the Shell: no un territorio que se mapea, una señal dispersa en el ruido
// — "la Wired" antes que "la ciudad".
// /home-3d ahora redirige acá (ver app/home-3d/page.tsx).
//
// v4: dos niveles. 6 nodos primarios (uno por sección real del sitio) y,
// orbitando a los que tienen contenido interno real, nodos satélite más
// chicos por sub-sección (FABRICACIÓN → Impresión 3D/Artefactos/Arsenal,
// LABORATORIO → Proxygenesis/Atractores/Hemibrain, EXPERIMENTAL →
// Oráculo/Sigilo/Enjambre, CONOCIMIENTO → Filosofía) — cada uno linkeando a
// una ruta real, no decorativo. ARTEFACTOS deja de ser un nodo primario
// propio: en la navegación real siempre fue hijo de FABRICACIÓN
// (components/nav-config.ts), así que pasa a vivir ahí también acá.
// EXPERIMENTAL entra como nodo primario nuevo — existía como sección real
// del sitio pero nunca había tenido representación en esta nube (y de
// paso corrige un color mal asignado: #cc0000 es el color real de
// EXPERIMENTAL en el nav, no de LABORATORIO, que ahora tiene uno propio).
// Además de las sinapsis núcleo→zona, ahora hay "uniones" rectas entre
// zonas primarias relacionadas por contenido real (LABORATORIO⇄EXPERIMENTAL
// comparten naturaleza generativa, ambas⇄CONOCIMIENTO porque documentan los
// algoritmos que corren ahí, EXPERIMENTAL⇄PROXYVERSE porque el lore de los
// agentes cita esos mismos procesos) — cada unión con un pulso viajando
// entre los dos extremos, el gesto más "tecnológico" que pidió el usuario
// en vez de solo líneas estáticas.
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

type SubZone = { id: string; tag: string; title: string; href: string }
type Zone = { id: string; tag: string; title: string; href: string; color: string; subs?: SubZone[] }

const ZONES: Zone[] = [
  { id: 'manifiesto', tag: 'NPX-DOC-00', title: 'MANIFIESTO', href: '/manifesto', color: '#ffb800' },
  {
    id: 'fabricacion', tag: 'NPX-LAB-00', title: 'FABRICACIÓN', href: '/fabrication', color: '#5f95c9',
    subs: [
      { id: 'impresion3d', tag: 'NPX-LAB-00a', title: 'IMPRESIÓN 3D', href: '/fabrication' },
      { id: 'artefactos', tag: 'NPX-REL-00', title: 'ARTEFACTOS', href: '/artifacts' },
      { id: 'arsenal', tag: 'NPX-LAB-00c', title: 'ARSENAL', href: '/arsenal' },
    ],
  },
  {
    id: 'laboratorio', tag: 'NPX-LAB-01', title: 'LABORATORIO', href: '/lab', color: '#ff8c1a',
    subs: [
      { id: 'proxygenesis', tag: 'NPX-LAB-01a', title: 'PROXYGENESIS', href: '/lab/proxygenesis' },
      { id: 'atractores', tag: 'NPX-LAB-01b', title: 'ATRACTORES', href: '/lab/atractores' },
      { id: 'hemibrain', tag: 'NPX-LAB-01c', title: 'HEMIBRAIN', href: '/lab/hemibrain' },
    ],
  },
  {
    id: 'experimental', tag: 'NPX-EXP-00', title: 'EXPERIMENTAL', href: '/experimental', color: '#cc0000',
    subs: [
      { id: 'oraculo', tag: 'NPX-EXP-00a', title: 'ORÁCULO', href: '/experimental/oraculo' },
      { id: 'sigilo', tag: 'NPX-EXP-00b', title: 'SIGILO', href: '/experimental/sigilo' },
      { id: 'enjambre', tag: 'NPX-EXP-00c', title: 'ENJAMBRE', href: '/experimental/enjambre' },
    ],
  },
  {
    id: 'conocimiento', tag: 'NPX-KNW-00', title: 'CONOCIMIENTO', href: '/knowledge', color: '#6644aa',
    subs: [
      { id: 'filosofia', tag: 'NPX-KNW-00a', title: 'FILOSOFÍA', href: '/knowledge/filosofia' },
    ],
  },
  { id: 'proxyverse', tag: 'NPX-PXV-00', title: 'PROXYVERSE', href: '/proxyverse', color: '#00ff9d' },
]

// Uniones entre zonas primarias — no decorativas: cada par comparte algo
// real (lore, algoritmo, naturaleza del proceso), no es "conectar todo con
// todo" para que se vea denso.
const ZONE_LINKS: [string, string][] = [
  ['laboratorio', 'experimental'],
  ['laboratorio', 'conocimiento'],
  ['experimental', 'conocimiento'],
  ['experimental', 'proxyverse'],
  ['conocimiento', 'proxyverse'],
  ['fabricacion', 'laboratorio'],
]

function hex3(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function mixHex(a: string, b: string): string {
  const na = parseInt(a.slice(1), 16), nb = parseInt(b.slice(1), 16)
  const mix = (sa: number, sb: number) => Math.round(((sa >> 0) + (sb >> 0)) / 2)
  const ar = (na >> 16) & 255, ag = (na >> 8) & 255, ab = na & 255
  const br = (nb >> 16) & 255, bg = (nb >> 8) & 255, bb = nb & 255
  return `#${[mix(ar, br), mix(ag, bg), mix(ab, bb)].map(c => c.toString(16).padStart(2, '0')).join('')}`
}

// Algunos colores de zona (el azul acero de FABRICACIÓN, por ejemplo) leen
// bien como acento/borde pero quedan opacos como texto sobre fondo negro.
// Mezcla hacia blanco solo para el relleno del título — el borde y las
// esquinas HUD se quedan con el color real, así no se pierde identidad.
function lightenHex(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  return `#${[mix(r), mix(g), mix(b)].map(c => c.toString(16).padStart(2, '0')).join('')}`
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
// repartir los 7 agentes en home-3d v1, acá para los nodos primarios de
// sección: separación pareja sin privilegiar ningún eje (no hay "arriba"
// en la Wired).
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

// Base tangente al radio desde el origen hasta `pos` — para repartir los
// nodos satélite en un anillo alrededor de su nodo primario sin que ese
// anillo quede alineado con la sinapsis núcleo→zona (que viaja en la
// dirección radial).
function tangentBasis(pos: { x: number; y: number; z: number }) {
  const len = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z) || 1
  const r = { x: pos.x / len, y: pos.y / len, z: pos.z / len }
  const up = Math.abs(r.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 }
  let t1 = { x: r.y * up.z - r.z * up.y, y: r.z * up.x - r.x * up.z, z: r.x * up.y - r.y * up.x }
  const t1len = Math.sqrt(t1.x * t1.x + t1.y * t1.y + t1.z * t1.z) || 1
  t1 = { x: t1.x / t1len, y: t1.y / t1len, z: t1.z / t1len }
  const t2 = { x: r.y * t1.z - r.z * t1.y, y: r.z * t1.x - r.x * t1.z, z: r.x * t1.y - r.y * t1.x }
  return { t1, t2 }
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

// Panel HUD para el nombre de cada sección/sub-sección — mismo lenguaje
// visual que ya usa el resto del sitio (las esquinas tipo <Corner> de
// /especimenes, el marco de color de las fotos de arriba, el formato
// NPX-XXX-00 de los tags): no texto HTML flotando sobre el canvas, un
// objeto más de la escena 3D, con billboard para mirar siempre a cámara.
// Vive en la textura, no en el DOM. Los nodos satélite reusan esta misma
// función con un plano más chico (ver abajo) — no hace falta una textura
// de menor resolución, el texto ya lee más chico al encoger el plano.
function makeZoneLabelTexture(B: any, scene: any, id: string, title: string, tag: string, color: string) {
  const W = 1024, H = 300
  const tex = new B.DynamicTexture(`home-label-${id}`, { width: W, height: H }, scene, true)
  tex.hasAlpha = true
  const ctx = tex.getContext()
  const pad = 18

  ctx.clearRect(0, 0, W, H)

  // panel de vidrio — separa el texto del ruido de la nube atrás. Más
  // opaco que la primera pasada: con más nodos y fotos flotando detrás,
  // un 60% de opacidad no alcanzaba para leer el texto con claridad.
  ctx.fillStyle = 'rgba(0, 5, 11, 0.92)'
  ctx.fillRect(pad, pad, W - pad * 2, H - pad * 2)
  ctx.strokeStyle = `${color}cc`
  ctx.lineWidth = 3
  ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2)

  // esquinas HUD, mismo gesto que <Corner> en /especimenes
  const cl = 42
  ctx.strokeStyle = color
  ctx.lineWidth = 4
  ctx.shadowColor = color
  ctx.shadowBlur = 14
  const corners: [number, number, number, number][] = [
    [pad, pad, pad + cl, pad], [pad, pad, pad, pad + cl],
    [W - pad, pad, W - pad - cl, pad], [W - pad, pad, W - pad, pad + cl],
    [pad, H - pad, pad + cl, H - pad], [pad, H - pad, pad, H - pad - cl],
    [W - pad, H - pad, W - pad - cl, H - pad], [W - pad, H - pad, W - pad, H - pad - cl],
  ]
  corners.forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  })

  // título — letter-spacing simulado insertando espacios, mismo truco que
  // el CSS letter-spacing que usa el resto de la tipografía del sitio.
  // Títulos largos (CONOCIMIENTO, PROXYVERSE, LABORATORIO...) con ese
  // espaciado podían desbordar el ancho del panel y perder la primera/
  // última letra — se mide el texto y se encoge la fuente si no entra,
  // en vez de un tamaño fijo que asume que todo título es corto.
  const spaced = (s: string) => s.split('').join('  ')
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const maxTitleWidth = W - pad * 2 - 60
  let titleSize = 74
  ctx.font = `bold ${titleSize}px "Space Mono", monospace`
  const titleStr = spaced(title)
  while (ctx.measureText(titleStr).width > maxTitleWidth && titleSize > 38) {
    titleSize -= 2
    ctx.font = `bold ${titleSize}px "Space Mono", monospace`
  }
  ctx.fillStyle = lightenHex(color, 0.4)
  ctx.shadowColor = color
  ctx.shadowBlur = 22
  ctx.fillText(titleStr, W / 2, 118)

  // separador
  ctx.shadowBlur = 8
  ctx.strokeStyle = `${color}99`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(pad + 50, 160)
  ctx.lineTo(W - pad - 50, 160)
  ctx.stroke()

  // tag — más chico y más opaco, el mismo formato NPX-XXX-00 que usa cada
  // sección en su propia página
  ctx.font = '30px "Space Mono", monospace'
  ctx.fillStyle = `${color}ee`
  ctx.shadowBlur = 6
  ctx.fillText(spaced(tag), W / 2, 212)

  tex.update()
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
      '> SUB-NODES ⇄ UNIONS RESOLVING...',
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

      // Niebla por distancia a cámara — el polvo lejano se hunde en el
      // negro de fondo en vez de leer todo a la misma densidad pareja;
      // da profundidad real (lo que queda cerca de cámara se separa de lo
      // que queda atrás) sin necesitar un blur de post-proceso.
      scene.fogMode = B.Scene.FOGMODE_EXP2
      scene.fogColor = new B.Color3(0.001, 0.002, 0.005)
      scene.fogDensity = 0.028

      // Cámara libre, no cenital: flotando a la altura de la nube, mirando
      // de frente — inmersiva, no un mapa visto desde afuera. En pantallas
      // angostas (celular en vertical) arranca más lejos — con más nodos y
      // sub-nodos que antes, de cerca y en portrait quedaba todo cortado.
      const aspect = canvasRef.current!.clientWidth / Math.max(1, canvasRef.current!.clientHeight)
      const startRadius = aspect < 0.75 ? 26 : 22
      const camera = new B.ArcRotateCamera('cloud-cam', -Math.PI / 2.4, 1.15, startRadius, B.Vector3.Zero(), scene)
      camera.attachControl(canvasRef.current, true)
      camera.wheelPrecision = 24
      camera.lowerRadiusLimit = 12
      camera.upperRadiusLimit = 42
      camera.lowerBetaLimit = 0.25
      camera.upperBetaLimit = Math.PI - 0.25
      camera.panningSensibility = 0
      camera.useAutoRotationBehavior = true
      if (camera.autoRotationBehavior) {
        camera.autoRotationBehavior.idleRotationSpeed = 0.05
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

      type NodeEntry = {
        id: string; mesh: any; label: any; stem: any; href: string; tier: 'primary' | 'sub'
        parentId?: string; baseDelay: number
      }
      const nodes: NodeEntry[] = []
      const linkEntries: { line: any; aId: string; bId: string; baseDelay: number }[] = []
      const zonePos: Record<string, { x: number; y: number; z: number }> = {}
      const allAvoidAnchors: { x: number; y: number; z: number }[] = []

      // --- nodos primarios, dispersos sobre una esfera (sin eje "arriba") ---
      const LAYOUT_RADIUS = 10
      const anchors = fibonacciSphere(ZONES.length, LAYOUT_RADIUS)
      const zoneRoot = new B.TransformNode('zoneRoot', scene)

      ZONES.forEach((zone, i) => {
        const { x, y, z } = anchors[i]
        zonePos[zone.id] = { x, y, z }
        allAvoidAnchors.push({ x, y, z })
        const baseDelay = 300 + i * 130

        const mesh = B.MeshBuilder.CreatePolyhedron(`core-${zone.id}`, { type: 2, size: 0.42 }, scene)
        mesh.position.set(x, y, z)
        const mat = new B.StandardMaterial(`coreMat-${zone.id}`, scene)
        const c = B.Color3.FromHexString(zone.color)
        mat.diffuseColor = c
        mat.emissiveColor = c.scale(0.55)
        mat.specularColor = new B.Color3(0.15, 0.15, 0.15)
        mesh.material = mat
        mesh.isPickable = true
        mesh.metadata = { id: zone.id, href: zone.href }
        mesh.parent = zoneRoot
        mesh.scaling.set(0.001, 0.001, 0.001)

        // nombre de la sección — panel HUD en la propia escena 3D, no texto
        // flotando encima en HTML (ver makeZoneLabelTexture). Billboard,
        // siempre mirando a cámara; posición fija (no parentada al núcleo,
        // que gira) para no arrastrar el panel en la rotación del nodo.
        const labelY = y + 1.6
        const labelTex = makeZoneLabelTexture(B, scene, zone.id, zone.title, zone.tag, zone.color)
        const label = B.MeshBuilder.CreatePlane(`label-${zone.id}`, { width: 4.3, height: 1.26 }, scene)
        label.position.set(x, labelY, z)
        label.billboardMode = B.Mesh.BILLBOARDMODE_ALL
        const labelMat = new B.StandardMaterial(`labelMat-${zone.id}`, scene)
        labelMat.diffuseTexture = labelTex
        labelMat.emissiveTexture = labelTex
        labelMat.opacityTexture = labelTex
        labelMat.disableLighting = true
        labelMat.backFaceCulling = false
        label.material = labelMat
        label.isPickable = false
        label.scaling.set(0.001, 0.001, 0.001)

        // un tic corto conectando nodo y panel — el gesto de "callout", no
        // el panel flotando suelto sin relación visual con lo que nombra
        const stem = B.MeshBuilder.CreateLines(`stem-${zone.id}`, {
          points: [new B.Vector3(x, y, z), new B.Vector3(x, labelY - 0.42, z)],
        }, scene)
        stem.color = c
        stem.alpha = 0.35
        stem.isPickable = false

        nodes.push({ id: zone.id, mesh, label, stem, href: zone.href, tier: 'primary', baseDelay })

        // sinapsis del núcleo al nodo — con una leve curva orgánica, no una
        // recta digital pura: la señal no viaja en línea derecha acá adentro.
        const mid = new B.Vector3(x * 0.5 + Math.sin(i * 2.1) * 1.1, y * 0.5 + Math.cos(i * 1.7) * 1.1, z * 0.5 + Math.sin(i * 3.3) * 1.1)
        const path = B.MeshBuilder.CreateLines(`path-${zone.id}`, {
          points: [B.Vector3.Zero(), mid, new B.Vector3(x, y, z)],
        }, scene)
        path.color = c
        path.alpha = 0.22
        path.isPickable = false

        // --- sub-secciones: nodos satélite más chicos en anillo alrededor
        // del nodo primario, cada uno linkeando a una ruta real del sitio
        // (no decorativos) — el "quiero que se vean sub secciones ligadas
        // a contenido" del pedido original. ---
        if (zone.subs && zone.subs.length) {
          const { t1, t2 } = tangentBasis({ x, y, z })
          const SUB_RING = 2.4
          zone.subs.forEach((sub, j) => {
            const a = (Math.PI * 2 * j) / zone.subs!.length + i * 0.6
            const sx = x + (t1.x * Math.cos(a) + t2.x * Math.sin(a)) * SUB_RING
            const sy = y + (t1.y * Math.cos(a) + t2.y * Math.sin(a)) * SUB_RING
            const sz = z + (t1.z * Math.cos(a) + t2.z * Math.sin(a)) * SUB_RING
            allAvoidAnchors.push({ x: sx, y: sy, z: sz })
            const subDelay = baseDelay + 420 + j * 100

            const subMesh = B.MeshBuilder.CreatePolyhedron(`sub-${sub.id}`, { type: 1, size: 0.24 }, scene)
            subMesh.position.set(sx, sy, sz)
            const subMat = new B.StandardMaterial(`subMat-${sub.id}`, scene)
            subMat.diffuseColor = c
            subMat.emissiveColor = c.scale(0.6)
            subMat.specularColor = new B.Color3(0.1, 0.1, 0.1)
            subMesh.material = subMat
            subMesh.isPickable = true
            subMesh.metadata = { id: sub.id, href: sub.href }
            subMesh.scaling.set(0.001, 0.001, 0.001)

            const subLabelY = sy + 1.0
            const subLabelTex = makeZoneLabelTexture(B, scene, sub.id, sub.title, sub.tag, zone.color)
            const subLabel = B.MeshBuilder.CreatePlane(`sublabel-${sub.id}`, { width: 2.9, height: 0.85 }, scene)
            subLabel.position.set(sx, subLabelY, sz)
            subLabel.billboardMode = B.Mesh.BILLBOARDMODE_ALL
            const subLabelMat = new B.StandardMaterial(`sublabelMat-${sub.id}`, scene)
            subLabelMat.diffuseTexture = subLabelTex
            subLabelMat.emissiveTexture = subLabelTex
            subLabelMat.opacityTexture = subLabelTex
            subLabelMat.disableLighting = true
            subLabelMat.backFaceCulling = false
            subLabel.material = subLabelMat
            subLabel.isPickable = false
            subLabel.scaling.set(0.001, 0.001, 0.001)

            const subStem = B.MeshBuilder.CreateLines(`substem-${sub.id}`, {
              points: [new B.Vector3(sx, sy, sz), new B.Vector3(sx, subLabelY - 0.3, sz)],
            }, scene)
            subStem.color = c
            subStem.alpha = 0.3
            subStem.isPickable = false

            nodes.push({ id: sub.id, mesh: subMesh, label: subLabel, stem: subStem, href: sub.href, tier: 'sub', parentId: zone.id, baseDelay: subDelay })

            // unión sub → primario — la relación de jerarquía en sí misma,
            // una línea corta y constante en vez de la curva orgánica
            // (esa queda reservada a núcleo→primario)
            const subLink = B.MeshBuilder.CreateLines(`sublink-${sub.id}`, {
              points: [new B.Vector3(x, y, z), new B.Vector3(sx, sy, sz)],
            }, scene)
            subLink.color = c
            subLink.alpha = 0
            subLink.isPickable = false
            linkEntries.push({ line: subLink, aId: zone.id, bId: sub.id, baseDelay: subDelay })
          })
        }
      })

      // --- uniones entre zonas primarias relacionadas por contenido real —
      // no la jerarquía núcleo→zona (eso ya existe como sinapsis orgánica),
      // sino "esto se relaciona con aquello": líneas rectas, más tarde en
      // la secuencia de aparición (primero se resuelve el árbol, después
      // la red), con un pulso recorriendo cada una. ---
      const crossLinks: { line: any; glowA: any; glowB: any; dot: any; dotMat: any; dotColor: [number, number, number]; aId: string; bId: string; color: string }[] = []
      const CROSS_LINK_DELAY = 2000
      ZONE_LINKS.forEach(([aId, bId], idx) => {
        const a = zonePos[aId], b = zonePos[bId]
        if (!a || !b) return
        const zoneA = ZONES.find(z => z.id === aId)!, zoneB = ZONES.find(z => z.id === bId)!
        const blended = mixHex(zoneA.color, zoneB.color)
        const blendedColor = B.Color3.FromHexString(blended)
        const line = B.MeshBuilder.CreateLines(`crosslink-${idx}`, {
          points: [new B.Vector3(a.x, a.y, a.z), new B.Vector3(b.x, b.y, b.z)],
        }, scene)
        line.color = blendedColor
        line.alpha = 0
        line.isPickable = false

        // par de líneas paralelas, invisibles en reposo — al pasar el
        // mouse por un nodo de la unión se encienden junto a la línea
        // central, leyendo como un haz más grueso en vez de una recta fina
        const perp = tangentBasis(a).t1
        const OFF = 0.1
        const glowA = B.MeshBuilder.CreateLines(`crosslink-glow-a-${idx}`, {
          points: [new B.Vector3(a.x + perp.x * OFF, a.y + perp.y * OFF, a.z + perp.z * OFF), new B.Vector3(b.x + perp.x * OFF, b.y + perp.y * OFF, b.z + perp.z * OFF)],
        }, scene)
        glowA.color = blendedColor
        glowA.alpha = 0
        glowA.isPickable = false
        const glowB = B.MeshBuilder.CreateLines(`crosslink-glow-b-${idx}`, {
          points: [new B.Vector3(a.x - perp.x * OFF, a.y - perp.y * OFF, a.z - perp.z * OFF), new B.Vector3(b.x - perp.x * OFF, b.y - perp.y * OFF, b.z - perp.z * OFF)],
        }, scene)
        glowB.color = blendedColor
        glowB.alpha = 0
        glowB.isPickable = false

        const dot = B.MeshBuilder.CreateSphere(`crossdot-${idx}`, { diameter: 0.22 }, scene)
        const dotMat = new B.StandardMaterial(`crossdotmat-${idx}`, scene)
        const dc = B.Color3.FromHexString(blended)
        dotMat.emissiveColor = dc
        dotMat.diffuseColor = dc
        dotMat.disableLighting = true
        dot.material = dotMat
        dot.isPickable = false
        dot.position.set(a.x, a.y, a.z)

        crossLinks.push({ line, glowA, glowB, dot, dotMat, dotColor: hex3(blended), aId, bId, color: blended })
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
      const CLOUD_RADIUS = 16
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
      // atado a nadie" es literal acá también). Decorativos, no navegan —
      // los nodos de sección (primarios y satélite) siguen siendo el
      // único click real. ---
      type AgentDrift = { plane: any; base: { x: number; y: number; z: number }; phase: number; freq: { x: number; y: number; z: number } }
      const agentDrifters: AgentDrift[] = []
      // separación mínima a cualquier nodo (primario o satélite) — sin
      // esto, un retrato puede terminar flotando justo delante del panel
      // con su nombre y taparlo (pasó en la primera pasada: nada "claro"
      // en eso).
      const MIN_SEP_TO_ZONE = 5.6
      agents.forEach((agent, i) => {
        const image = AGENT_IMAGES[agent.id]
        if (!image) return
        let base = { x: 0, y: 0, z: 0 }
        for (let attempt = 0; attempt < 30; attempt++) {
          const costheta = Math.random() * 2 - 1
          const theta = Math.acos(costheta)
          const phi = Math.random() * Math.PI * 2
          const r = 6 + Math.random() * 8
          const candidate = {
            x: r * Math.sin(theta) * Math.cos(phi),
            y: r * Math.sin(theta) * Math.sin(phi) * 0.75,
            z: r * Math.cos(theta),
          }
          const tooClose = allAvoidAnchors.some(a => {
            const d2 = (candidate.x - a.x) ** 2 + (candidate.y - a.y) ** 2 + (candidate.z - a.z) ** 2
            return d2 < MIN_SEP_TO_ZONE * MIN_SEP_TO_ZONE
          })
          base = candidate
          if (!tooClose) break
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

      // --- emergencia: la nube entera condensa de la nada, los nodos de
      // sección aparecen escalonados encima, y recién al final se
      // resuelven las uniones entre zonas (primero el árbol, después la
      // red) ---
      const elapsed0 = performance.now()
      const CLOUD_EMERGE_MS = 1400
      const NODE_EMERGE_MS = 700
      const LINK_FADE_MS = 900
      let hoveredId: string | null = null

      scene.onPointerObservable.add((info: any) => {
        if (info.type === B.PointerEventTypes.POINTERPICK) {
          const picked = info.pickInfo?.pickedMesh
          const href = picked?.metadata?.href
          if (href) router.push(href)
        }
        if (info.type === B.PointerEventTypes.POINTERMOVE) {
          const picked = scene.pick(scene.pointerX, scene.pointerY)
          const id = picked?.pickedMesh?.metadata?.id ?? null
          hoveredId = id
          setHovered(id)
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

        nodes.forEach((n, i) => {
          const localElapsed = t - elapsed0 - n.baseDelay
          const p = Math.max(0, Math.min(1, localElapsed / NODE_EMERGE_MS))
          const eased = smoothstep(p)
          const bob = 1 + Math.sin(t * 0.0009 + i * 1.7) * (n.tier === 'primary' ? 0.05 : 0.07)
          const s = eased * bob
          n.mesh.scaling.set(s, s, s)
          n.mesh.rotation.y += n.tier === 'primary' ? 0.006 : 0.01
          n.mesh.rotation.x += n.tier === 'primary' ? 0.0022 : 0.004

          // el nombre resuelve un poco después que el nodo — primero
          // aparece la forma, recién después se identifica qué es, sin
          // el bamboleo del nodo (el texto se queda quieto para leerse)
          const labelElapsed = localElapsed - 220
          const labelBase = smoothstep(Math.max(0, Math.min(1, labelElapsed / NODE_EMERGE_MS)))
          const isHovered = n.id === hoveredId
          const hoverBoost = isHovered ? 1.12 : 1
          const labelS = labelBase * hoverBoost
          n.label.scaling.set(labelS, labelS, labelS)
          n.stem.alpha = ((n.tier === 'primary' ? 0.35 : 0.3) * (isHovered ? 2 : 1)) * labelBase
        })

        // uniones sub→primario: fade-in simple, sin la curva orgánica
        linkEntries.forEach(le => {
          const p = smoothstep(Math.max(0, Math.min(1, (t - elapsed0 - le.baseDelay) / LINK_FADE_MS)))
          const related = le.aId === hoveredId || le.bId === hoveredId
          le.line.alpha = 0.3 * p * (related ? 1.8 : 1)
        })

        // uniones entre zonas primarias — resueltas al final, con un pulso
        // viajando de un extremo al otro (el gesto "tecnológico": no solo
        // una línea estática, una conexión que transporta algo)
        const crossP = smoothstep(Math.max(0, Math.min(1, (t - elapsed0 - CROSS_LINK_DELAY) / LINK_FADE_MS)))
        crossLinks.forEach((cl, idx) => {
          const related = cl.aId === hoveredId || cl.bId === hoveredId
          cl.line.alpha = Math.min(1, 0.22 * crossP * (related ? 2.8 : 1))
          // el haz paralelo solo se enciende activado — en reposo queda
          // en 0, la unión se lee como una línea fina normal
          const glowAlpha = related ? 0.32 * crossP : 0
          cl.glowA.alpha = glowAlpha
          cl.glowB.alpha = glowAlpha

          const a = zonePos[cl.aId], b = zonePos[cl.bId]
          const phase = (Math.sin(t * 0.00055 + idx * 1.3) + 1) / 2
          cl.dot.position.set(a.x + (b.x - a.x) * phase, a.y + (b.y - a.y) * phase, a.z + (b.z - a.z) * phase)
          // más grande y más brillante (mezclado hacia blanco) cuando la
          // unión está activa — el "pulso de datos" se nota mucho más
          const [dr, dg, db] = cl.dotColor
          const boost = related ? 0.6 : 0
          cl.dotMat.emissiveColor.set(dr + (1 - dr) * boost, dg + (1 - dg) * boost, db + (1 - db) * boost)
          cl.dotMat.alpha = crossP * (related ? 1 : 0.75)
          const dotScale = crossP * (related ? 1.9 : 1)
          cl.dot.scaling.set(dotScale, dotScale, dotScale)
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
          <div style={{ fontFamily: mono, fontSize: 10, color: '#00d4ff44', letterSpacing: 3, marginTop: 16 }}>NODOS Y UNIONES DETECTADAS EN EL RUIDO</div>
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
