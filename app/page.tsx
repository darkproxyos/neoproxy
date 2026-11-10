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

// Lookup plano id → título/tag (zonas y sub-secciones) — para el chrome
// HUD en 2D (la línea "FOCUS //"), lee el id que ya devuelve el hover
// de la escena 3D sin tener que levantar estado desde adentro del canvas.
const ALL_NODE_META: Record<string, { title: string; tag: string }> = {}
ZONES.forEach(zone => {
  ALL_NODE_META[zone.id] = { title: zone.title, tag: zone.tag }
  zone.subs?.forEach(sub => { ALL_NODE_META[sub.id] = { title: sub.title, tag: sub.tag } })
})
const TOTAL_NODE_COUNT = ZONES.length + ZONES.reduce((a, z) => a + (z.subs?.length ?? 0), 0)

function hex3(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function mixHexAmount(a: string, b: string, t: number): string {
  const na = parseInt(a.slice(1), 16), nb = parseInt(b.slice(1), 16)
  const ar = (na >> 16) & 255, ag = (na >> 8) & 255, ab = na & 255
  const br = (nb >> 16) & 255, bg = (nb >> 8) & 255, bb = nb & 255
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `#${[mix(ar, br), mix(ag, bg), mix(ab, bb)].map(c => c.toString(16).padStart(2, '0')).join('')}`
}
function mixHex(a: string, b: string): string { return mixHexAmount(a, b, 0.5) }

// Paleta restringida: por defecto todo vive cerca de este cian-gris
// neutro (la misma familia del núcleo central) — el color saturado de
// cada zona solo aparece cuando esa zona (o algo de su familia) está en
// foco. Menos "todo grita a la vez", más "el color es señal".
const NEUTRAL_HEX = '#4a6a78'
function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
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

function roundRectPath(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Mancha de nebulosa de fondo — un gradiente radial suave, muy grande y
// muy lejos de la cámara, billboard. No es "partícula decorativa" (eso
// se sacó a pedido): es una sola mancha de atmósfera fija, el gesto
// mínimo para que el fondo no sea vacío absoluto, acercándose al fondo
// con nubes de la referencia visual.
function makeNebulaTexture(B: any, scene: any, id: string, color: string) {
  const size = 512
  const tex = new B.DynamicTexture(`nebula-${id}`, { width: size, height: size }, scene, true)
  tex.hasAlpha = true
  const ctx = tex.getContext()
  const c = size / 2
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c)
  grad.addColorStop(0, `${color}66`)
  grad.addColorStop(0.5, `${color}2a`)
  grad.addColorStop(1, `${color}00`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  tex.update()
  return tex
}

// Panel "ventana" para el nombre de cada sección/sub-sección — tarjeta de
// vidrio esquinas redondeadas (look más suave, menos HUD militar que la
// primera pasada de esquinas tipo <Corner>), pedido explícitamente para
// acercarse al estilo de referencia. Sigue siendo textura, no DOM — un
// objeto más de la escena 3D con billboard. Los nodos satélite reusan
// esta misma función con un plano más chico (ver abajo).
function makeZoneLabelTexture(B: any, scene: any, id: string, title: string, tag: string, color: string) {
  const W = 1024, H = 230
  const tex = new B.DynamicTexture(`home-label-${id}`, { width: W, height: H }, scene, true)
  tex.hasAlpha = true
  const ctx = tex.getContext()
  const pad = 18
  const radius = 34

  ctx.clearRect(0, 0, W, H)

  // tarjeta de vidrio — tinte índigo en vez de negro puro, consistente
  // con el fondo tipo nebulosa en vez de "espacio vacío"
  roundRectPath(ctx, pad, pad, W - pad * 2, H - pad * 2, radius)
  ctx.fillStyle = 'rgba(12, 10, 26, 0.88)'
  ctx.fill()
  ctx.lineWidth = 2.5
  ctx.strokeStyle = `${color}bb`
  ctx.shadowColor = color
  ctx.shadowBlur = 16
  ctx.stroke()

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
  ctx.fillText(titleStr, W / 2, 98)

  // tag — más chico y más opaco, el mismo formato NPX-XXX-00 que usa cada
  // sección en su propia página
  ctx.font = '30px "Space Mono", monospace'
  ctx.fillStyle = `${color}ee`
  ctx.shadowBlur = 6
  ctx.fillText(spaced(tag), W / 2, 158)

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
  const [clock, setClock] = useState('')

  // reloj real — una sola lectura por segundo, no por frame (eso vive
  // adentro del render loop de Babylon, esto es chrome 2D aparte)
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('es-AR', { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

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
      // Fondo tinte índigo oscuro en vez de negro puro — sin polvo
      // decorativo (sacado a pedido) hacía falta algo que diera atmósfera
      // de todos modos; un "espacio" con algo de color de fondo en vez
      // de vacío absoluto, acercándose a la referencia de nebulosa.
      scene.clearColor = new B.Color4(0.015, 0.012, 0.03, 1)

      // Niebla por distancia a cámara — lo lejano se hunde en ese mismo
      // índigo en vez de leer todo a la misma densidad pareja; da
      // profundidad real sin necesitar un blur de post-proceso.
      scene.fogMode = B.Scene.FOGMODE_EXP2
      scene.fogColor = new B.Color3(0.015, 0.012, 0.03)
      scene.fogDensity = 0.028

      // Cámara libre, no cenital: flotando a la altura de la nube, mirando
      // de frente — inmersiva, no un mapa visto desde afuera. En pantallas
      // angostas (celular en vertical) arranca más lejos — con más nodos y
      // sub-nodos que antes, de cerca y en portrait quedaba todo cortado.
      const aspect = canvasRef.current!.clientWidth / Math.max(1, canvasRef.current!.clientHeight)
      const startRadius = aspect < 0.75 ? 29 : 25
      const camera = new B.ArcRotateCamera('cloud-cam', -Math.PI / 2.4, 1.15, startRadius, B.Vector3.Zero(), scene)
      camera.attachControl(canvasRef.current, true)
      camera.wheelPrecision = 24
      camera.lowerRadiusLimit = 14
      camera.upperRadiusLimit = 46
      camera.lowerBetaLimit = 0.25
      camera.upperBetaLimit = Math.PI - 0.25
      camera.panningSensibility = 0
      camera.useAutoRotationBehavior = true
      if (camera.autoRotationBehavior) {
        camera.autoRotationBehavior.idleRotationSpeed = 0.05
        camera.autoRotationBehavior.idleRotationWaitTime = 1100
      }

      new B.HemisphericLight('cloud-fill', new B.Vector3(0, 1, 0.2), scene).intensity = 0.62
      const sun = new B.DirectionalLight('cloud-sun', new B.Vector3(-0.3, -0.8, -0.4), scene)
      sun.intensity = 0.65

      // Glow real (bloom) sobre lo emisivo — nodos, paneles HUD y
      // sinapsis quedan "bien definidos e iluminados" en vez de planos.
      // Las fotos de los agentes (su propia imagen hace de emissive, no
      // algo que deba brillar como un HUD) quedan afuera explícitamente.
      const glow = new B.GlowLayer('cloud-glow', scene, { mainTextureFixedSize: 1024, blurKernelSize: 48 })
      glow.intensity = 0.7

      // Un par de manchas de nebulosa muy lejos, de fondo — atmósfera sin
      // partículas (sacadas a pedido), acercándose al fondo con nubes de
      // la referencia visual.
      ;[
        { color: '#6644aa', pos: new B.Vector3(-30, 14, -38) },
        { color: '#2a5f9e', pos: new B.Vector3(32, -10, -42) },
      ].forEach(({ color, pos }, i) => {
        const nebTex = makeNebulaTexture(B, scene, `${i}`, color)
        const neb = B.MeshBuilder.CreatePlane(`nebula-${i}`, { size: 70 }, scene)
        neb.position.copyFrom(pos)
        neb.billboardMode = B.Mesh.BILLBOARDMODE_ALL
        const nebMat = new B.StandardMaterial(`nebulaMat-${i}`, scene)
        nebMat.diffuseTexture = nebTex
        nebMat.emissiveTexture = nebTex
        nebMat.opacityTexture = nebTex
        nebMat.disableLighting = true
        nebMat.backFaceCulling = false
        nebMat.fogEnabled = false // es el telón de fondo, no se hunde con la niebla de profundidad
        neb.material = nebMat
        neb.isPickable = false
        glow.addExcludedMesh(neb)
      })

      // --- núcleo central: home ---
      const core = B.MeshBuilder.CreatePolyhedron('core', { type: 3, size: 0.6 }, scene)
      const coreMat = new B.StandardMaterial('coreMat', scene)
      coreMat.diffuseColor = new B.Color3(0.6, 0.85, 1)
      coreMat.emissiveColor = new B.Color3(0.3, 0.6, 0.75)
      core.material = coreMat
      core.isPickable = false

      type NodeEntry = {
        id: string; mesh: any; label: any; stem: any; href: string; tier: 'primary' | 'sub'
        parentId?: string; baseDelay: number; familyId: string; mat: any
        dimRGB: [number, number, number]; fullRGB: [number, number, number]
        litT: number; labelTexDim: any; labelTexBright: any; wasBright: boolean
      }
      const nodes: NodeEntry[] = []
      const linkEntries: { line: any; aId: string; bId: string; baseDelay: number; dimRGB: [number, number, number]; fullRGB: [number, number, number]; litT: number }[] = []
      const pathLines: { line: any; zoneId: string; dimRGB: [number, number, number]; fullRGB: [number, number, number]; litT: number }[] = []
      const zonePos: Record<string, { x: number; y: number; z: number }> = {}
      const allAvoidAnchors: { x: number; y: number; z: number }[] = []

      // --- nodos primarios, dispersos sobre una esfera (sin eje "arriba") ---
      const LAYOUT_RADIUS = 11.5
      const anchors = fibonacciSphere(ZONES.length, LAYOUT_RADIUS)
      const zoneRoot = new B.TransformNode('zoneRoot', scene)

      ZONES.forEach((zone, i) => {
        const { x, y, z } = anchors[i]
        zonePos[zone.id] = { x, y, z }
        allAvoidAnchors.push({ x, y, z })
        const baseDelay = 300 + i * 130

        // paleta restringida: por defecto el nodo vive cerca del cian-gris
        // neutro, el color saturado real de la zona solo aparece cuando
        // esa familia (ella o alguno de sus sub-nodos) está en foco —
        // "el color es señal", no ruido parejo en las nueve zonas a la vez.
        const dimHex = mixHexAmount(zone.color, NEUTRAL_HEX, 0.82)
        const dimRGB = hex3(dimHex)
        const fullRGB = hex3(zone.color)

        const mesh = B.MeshBuilder.CreatePolyhedron(`core-${zone.id}`, { type: 2, size: 0.42 }, scene)
        mesh.position.set(x, y, z)
        const mat = new B.StandardMaterial(`coreMat-${zone.id}`, scene)
        mat.diffuseColor = new B.Color3(dimRGB[0], dimRGB[1], dimRGB[2])
        mat.emissiveColor = new B.Color3(dimRGB[0] * 0.55, dimRGB[1] * 0.55, dimRGB[2] * 0.55)
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
        // Dos texturas (apagada/a todo color) — se cambia la textura
        // entera en vez de reconstruir el canvas cada frame.
        const labelY = y + 1.6
        const labelTexDim = makeZoneLabelTexture(B, scene, `${zone.id}-dim`, zone.title, zone.tag, dimHex)
        const labelTexBright = makeZoneLabelTexture(B, scene, `${zone.id}-bright`, zone.title, zone.tag, zone.color)
        const label = B.MeshBuilder.CreatePlane(`label-${zone.id}`, { width: 4.3, height: 0.97 }, scene)
        label.position.set(x, labelY, z)
        label.billboardMode = B.Mesh.BILLBOARDMODE_ALL
        const labelMat = new B.StandardMaterial(`labelMat-${zone.id}`, scene)
        labelMat.diffuseTexture = labelTexDim
        labelMat.emissiveTexture = labelTexDim
        labelMat.opacityTexture = labelTexDim
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
        stem.color = new B.Color3(dimRGB[0], dimRGB[1], dimRGB[2])
        stem.alpha = 0.35
        stem.isPickable = false

        nodes.push({
          id: zone.id, mesh, label, stem, href: zone.href, tier: 'primary', baseDelay,
          familyId: zone.id, mat, dimRGB, fullRGB, litT: 0, labelTexDim, labelTexBright, wasBright: false,
        })

        // sinapsis del núcleo al nodo — con una leve curva orgánica, no una
        // recta digital pura: la señal no viaja en línea derecha acá adentro.
        const mid = new B.Vector3(x * 0.5 + Math.sin(i * 2.1) * 1.1, y * 0.5 + Math.cos(i * 1.7) * 1.1, z * 0.5 + Math.sin(i * 3.3) * 1.1)
        const path = B.MeshBuilder.CreateLines(`path-${zone.id}`, {
          points: [B.Vector3.Zero(), mid, new B.Vector3(x, y, z)],
        }, scene)
        path.color = new B.Color3(dimRGB[0], dimRGB[1], dimRGB[2])
        path.alpha = 0.14
        path.isPickable = false
        pathLines.push({ line: path, zoneId: zone.id, dimRGB, fullRGB, litT: 0 })

        // --- sub-secciones: nodos satélite más chicos en anillo alrededor
        // del nodo primario, cada uno linkeando a una ruta real del sitio
        // (no decorativos) — el "quiero que se vean sub secciones ligadas
        // a contenido" del pedido original. ---
        if (zone.subs && zone.subs.length) {
          const { t1, t2 } = tangentBasis({ x, y, z })
          // más separados que la primera pasada — con paneles grandes y
          // opacos (legibilidad real pedida antes), 2.4 los hacía chocar
          // entre sí y con el panel del propio primario (caso LABORATORIO,
          // el peor: 3 subs apretados contra un panel grande al lado)
          const SUB_RING = 3.7
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
            subMat.diffuseColor = new B.Color3(dimRGB[0], dimRGB[1], dimRGB[2])
            subMat.emissiveColor = new B.Color3(dimRGB[0] * 0.6, dimRGB[1] * 0.6, dimRGB[2] * 0.6)
            subMat.specularColor = new B.Color3(0.1, 0.1, 0.1)
            subMesh.material = subMat
            subMesh.isPickable = true
            subMesh.metadata = { id: sub.id, href: sub.href }
            subMesh.scaling.set(0.001, 0.001, 0.001)

            // leve escalonado extra por índice — con 3 subs apretados en
            // el mismo anillo, un ángulo de cámara desfavorable todavía
            // podía proyectar dos paneles casi uno encima del otro
            const subLabelY = sy + 1.0 + (j % 2 === 0 ? 0 : 0.3)
            const subLabelTexDim = makeZoneLabelTexture(B, scene, `${sub.id}-dim`, sub.title, sub.tag, dimHex)
            const subLabelTexBright = makeZoneLabelTexture(B, scene, `${sub.id}-bright`, sub.title, sub.tag, zone.color)
            const subLabel = B.MeshBuilder.CreatePlane(`sublabel-${sub.id}`, { width: 2.9, height: 0.65 }, scene)
            subLabel.position.set(sx, subLabelY, sz)
            subLabel.billboardMode = B.Mesh.BILLBOARDMODE_ALL
            const subLabelMat = new B.StandardMaterial(`sublabelMat-${sub.id}`, scene)
            subLabelMat.diffuseTexture = subLabelTexDim
            subLabelMat.emissiveTexture = subLabelTexDim
            subLabelMat.opacityTexture = subLabelTexDim
            subLabelMat.disableLighting = true
            subLabelMat.backFaceCulling = false
            subLabel.material = subLabelMat
            subLabel.isPickable = false
            subLabel.scaling.set(0.001, 0.001, 0.001)

            const subStem = B.MeshBuilder.CreateLines(`substem-${sub.id}`, {
              points: [new B.Vector3(sx, sy, sz), new B.Vector3(sx, subLabelY - 0.3, sz)],
            }, scene)
            subStem.color = new B.Color3(dimRGB[0], dimRGB[1], dimRGB[2])
            subStem.alpha = 0.3
            subStem.isPickable = false

            nodes.push({
              id: sub.id, mesh: subMesh, label: subLabel, stem: subStem, href: sub.href, tier: 'sub', parentId: zone.id, baseDelay: subDelay,
              familyId: zone.id, mat: subMat, dimRGB, fullRGB, litT: 0, labelTexDim: subLabelTexDim, labelTexBright: subLabelTexBright, wasBright: false,
            })

            // unión sub → primario — la relación de jerarquía en sí misma,
            // una línea corta y constante en vez de la curva orgánica
            // (esa queda reservada a núcleo→primario)
            const subLink = B.MeshBuilder.CreateLines(`sublink-${sub.id}`, {
              points: [new B.Vector3(x, y, z), new B.Vector3(sx, sy, sz)],
            }, scene)
            subLink.color = new B.Color3(dimRGB[0], dimRGB[1], dimRGB[2])
            subLink.alpha = 0
            subLink.isPickable = false
            linkEntries.push({ line: subLink, aId: zone.id, bId: sub.id, baseDelay: subDelay, dimRGB, fullRGB, litT: 0 })
          })
        }
      })

      // --- una luz de color por zona, suave, iluminando su propio
      // cluster desde adentro — refuerza "esto es un grupo" por
      // proximidad Y color (gestalt) además de la pura cercanía
      // geométrica, y le da a cada nodo sólido variación real de luz en
      // vez de depender solo del material emissive plano. ---
      const zoneLights: { light: any; zoneId: string; dimRGB: [number, number, number]; fullRGB: [number, number, number]; litT: number }[] = []
      ZONES.forEach(zone => {
        const p = zonePos[zone.id]
        if (!p) return
        const dimRGB = hex3(mixHexAmount(zone.color, NEUTRAL_HEX, 0.82))
        const fullRGB = hex3(zone.color)
        const zoneLight = new B.PointLight(`zonelight-${zone.id}`, new B.Vector3(p.x, p.y, p.z), scene)
        zoneLight.diffuse = new B.Color3(dimRGB[0], dimRGB[1], dimRGB[2])
        zoneLight.specular = new B.Color3(0, 0, 0)
        zoneLight.intensity = 0.55
        zoneLight.range = 8
        zoneLights.push({ light: zoneLight, zoneId: zone.id, dimRGB, fullRGB, litT: 0 })
      })

      // --- uniones entre zonas primarias relacionadas por contenido real —
      // no la jerarquía núcleo→zona (eso ya existe como sinapsis orgánica),
      // sino "esto se relaciona con aquello": líneas rectas, más tarde en
      // la secuencia de aparición (primero se resuelve el árbol, después
      // la red), con un pulso recorriendo cada una. ---
      const crossLinks: { line: any; glowA: any; glowB: any; dot: any; dotMat: any; dimRGB: [number, number, number]; fullRGB: [number, number, number]; litT: number; aId: string; bId: string; color: string }[] = []
      const CROSS_LINK_DELAY = 2000
      ZONE_LINKS.forEach(([aId, bId], idx) => {
        const a = zonePos[aId], b = zonePos[bId]
        if (!a || !b) return
        const zoneA = ZONES.find(z => z.id === aId)!, zoneB = ZONES.find(z => z.id === bId)!
        const blended = mixHex(zoneA.color, zoneB.color)
        const dimBlended = mixHexAmount(blended, NEUTRAL_HEX, 0.82)
        const dimRGB = hex3(dimBlended)
        const dimColor = new B.Color3(dimRGB[0], dimRGB[1], dimRGB[2])
        const line = B.MeshBuilder.CreateLines(`crosslink-${idx}`, {
          points: [new B.Vector3(a.x, a.y, a.z), new B.Vector3(b.x, b.y, b.z)],
        }, scene)
        line.color = dimColor
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
        glowA.color = dimColor
        glowA.alpha = 0
        glowA.isPickable = false
        const glowB = B.MeshBuilder.CreateLines(`crosslink-glow-b-${idx}`, {
          points: [new B.Vector3(a.x - perp.x * OFF, a.y - perp.y * OFF, a.z - perp.z * OFF), new B.Vector3(b.x - perp.x * OFF, b.y - perp.y * OFF, b.z - perp.z * OFF)],
        }, scene)
        glowB.color = dimColor
        glowB.alpha = 0
        glowB.isPickable = false

        const dot = B.MeshBuilder.CreateSphere(`crossdot-${idx}`, { diameter: 0.22 }, scene)
        const dotMat = new B.StandardMaterial(`crossdotmat-${idx}`, scene)
        dotMat.emissiveColor = dimColor
        dotMat.diffuseColor = dimColor
        dotMat.disableLighting = true
        dot.material = dotMat
        dot.isPickable = false
        dot.position.set(a.x, a.y, a.z)

        crossLinks.push({ line, glowA, glowB, dot, dotMat, dimRGB, fullRGB: hex3(blended), litT: 0, aId, bId, color: blended })
      })

      // Sin polvo decorativo — pedido explícito: solo nodos reales (zonas
      // y sub-secciones) y lo que ya era contenido real (retratos del
      // proxyverso). `dustRoot` se queda únicamente como contenedor de
      // animación para esos retratos (condensan igual al aparecer), ya
      // no tiene ninguna malla de partículas adentro.
      const dustRoot = new B.TransformNode('dustRoot', scene)

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
        glow.addExcludedMesh(plane)
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
      const nodeById: Record<string, NodeEntry> = {}
      nodes.forEach(n => { nodeById[n.id] = n })

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

        // paleta restringida: "familia" activa = la zona en foco (si el
        // mouse está sobre un sub-nodo, su familia es la zona padre) —
        // todo lo que pertenece a esa familia se enciende a su color
        // real, el resto se queda en el cian-gris neutro. Suavizado con
        // litT en vez de un salto instantáneo.
        const hoveredFamily = hoveredId ? nodeById[hoveredId]?.familyId ?? null : null
        const LIT_RATE = 0.12

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
          const isFamilyActive = hoveredFamily !== null && n.familyId === hoveredFamily
          const hoverBoost = isHovered ? 1.12 : 1
          const labelS = labelBase * hoverBoost
          n.label.scaling.set(labelS, labelS, labelS)
          n.stem.alpha = ((n.tier === 'primary' ? 0.35 : 0.3) * (isFamilyActive ? 2 : 1)) * labelBase

          n.litT += ((isFamilyActive ? 1 : 0) - n.litT) * LIT_RATE
          const rgb = lerp3(n.dimRGB, n.fullRGB, n.litT)
          n.mat.diffuseColor.set(rgb[0], rgb[1], rgb[2])
          n.mat.emissiveColor.set(rgb[0] * 0.55, rgb[1] * 0.55, rgb[2] * 0.55)
          n.stem.color.set(rgb[0], rgb[1], rgb[2])
          // la etiqueta cambia de textura entera (apagada/a color) en vez
          // de reconstruir el canvas cada frame — solo al cruzar el medio
          // del fundido, para no parpadear yendo y viniendo justo en 0.5
          const useBright = n.litT > 0.5
          if (useBright !== n.wasBright) {
            const lm = n.label.material
            const tex = useBright ? n.labelTexBright : n.labelTexDim
            lm.diffuseTexture = tex; lm.emissiveTexture = tex; lm.opacityTexture = tex
            n.wasBright = useBright
          }
        })

        pathLines.forEach(pl => {
          const active = hoveredFamily !== null && pl.zoneId === hoveredFamily
          pl.litT += ((active ? 1 : 0) - pl.litT) * LIT_RATE
          const rgb = lerp3(pl.dimRGB, pl.fullRGB, pl.litT)
          pl.line.color.set(rgb[0], rgb[1], rgb[2])
          pl.line.alpha = 0.14 + 0.22 * pl.litT
        })

        zoneLights.forEach(zl => {
          const active = hoveredFamily !== null && zl.zoneId === hoveredFamily
          zl.litT += ((active ? 1 : 0) - zl.litT) * LIT_RATE
          const rgb = lerp3(zl.dimRGB, zl.fullRGB, zl.litT)
          zl.light.diffuse.set(rgb[0], rgb[1], rgb[2])
        })

        // uniones sub→primario: fade-in simple, sin la curva orgánica
        linkEntries.forEach(le => {
          const p = smoothstep(Math.max(0, Math.min(1, (t - elapsed0 - le.baseDelay) / LINK_FADE_MS)))
          const active = hoveredFamily !== null && le.aId === hoveredFamily
          le.litT += ((active ? 1 : 0) - le.litT) * LIT_RATE
          const rgb = lerp3(le.dimRGB, le.fullRGB, le.litT)
          le.line.color.set(rgb[0], rgb[1], rgb[2])
          le.line.alpha = (0.3 + 0.24 * le.litT) * p
        })

        // uniones entre zonas primarias — resueltas al final, con un pulso
        // viajando de un extremo al otro (el gesto "tecnológico": no solo
        // una línea estática, una conexión que transporta algo). Acá la
        // "familia" activa es cualquiera de las dos zonas que conecta.
        const crossP = smoothstep(Math.max(0, Math.min(1, (t - elapsed0 - CROSS_LINK_DELAY) / LINK_FADE_MS)))
        crossLinks.forEach((cl, idx) => {
          const active = hoveredFamily !== null && (cl.aId === hoveredFamily || cl.bId === hoveredFamily)
          cl.litT += ((active ? 1 : 0) - cl.litT) * LIT_RATE
          const rgb = lerp3(cl.dimRGB, cl.fullRGB, cl.litT)
          cl.line.color.set(rgb[0], rgb[1], rgb[2])
          cl.line.alpha = Math.min(1, (0.14 + 0.5 * cl.litT) * crossP)
          // el haz paralelo solo se enciende activado — en reposo queda
          // en 0, la unión se lee como una línea fina normal
          const glowAlpha = cl.litT > 0.3 ? 0.32 * crossP * cl.litT : 0
          cl.glowA.color.set(rgb[0], rgb[1], rgb[2])
          cl.glowB.color.set(rgb[0], rgb[1], rgb[2])
          cl.glowA.alpha = glowAlpha
          cl.glowB.alpha = glowAlpha

          const a = zonePos[cl.aId], b = zonePos[cl.bId]
          const phase = (Math.sin(t * 0.00055 + idx * 1.3) + 1) / 2
          cl.dot.position.set(a.x + (b.x - a.x) * phase, a.y + (b.y - a.y) * phase, a.z + (b.z - a.z) * phase)
          // más grande y más brillante (mezclado hacia blanco) cuando la
          // unión está activa — el "pulso de datos" se nota mucho más
          const whiteBoost = cl.litT * 0.6
          cl.dotMat.emissiveColor.set(rgb[0] + (1 - rgb[0]) * whiteBoost, rgb[1] + (1 - rgb[1]) * whiteBoost, rgb[2] + (1 - rgb[2]) * whiteBoost)
          cl.dotMat.alpha = crossP * (0.75 + 0.25 * cl.litT)
          const dotScale = crossP * (1 + 0.9 * cl.litT)
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
        <>
          <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', outline: 'none', cursor: hovered ? 'pointer' : 'grab' }} />

          {/* Chrome de instrumento en 2D sobre el canvas — marco de
              esquinas + telemetría real (conteo real de nodos/uniones,
              hora real, el id que ya devuelve el hover). No es el texto
              narrativo que se sacó antes (título/instrucciones): esto es
              lectura de instrumento, el gesto "profesional/futurista"
              pedido, sin reintroducir nada decorativo. */}
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
            {[
              { top: 72, left: 16, borderTop: '2px solid #00d4ff55', borderLeft: '2px solid #00d4ff55' },
              { top: 72, right: 16, borderTop: '2px solid #00d4ff55', borderRight: '2px solid #00d4ff55' },
              { bottom: 16, left: 16, borderBottom: '2px solid #00d4ff55', borderLeft: '2px solid #00d4ff55' },
              { bottom: 16, right: 16, borderBottom: '2px solid #00d4ff55', borderRight: '2px solid #00d4ff55' },
            ].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: 26, height: 26, ...s }} />
            ))}

            <div style={{ position: 'absolute', top: 88, left: 30, fontFamily: mono, fontSize: 10, color: '#00d4ffaa', letterSpacing: 2, lineHeight: 1.9 }}>
              <div>NODES // {TOTAL_NODE_COUNT}</div>
              <div>UNIONS // {ZONE_LINKS.length}</div>
              <div>SIGNAL // ONLINE</div>
            </div>

            <div style={{ position: 'absolute', top: 88, right: 30, fontFamily: mono, fontSize: 10, color: '#00d4ffaa', letterSpacing: 2, textAlign: 'right' }}>
              {clock}
            </div>

            {hovered && ALL_NODE_META[hovered] && (
              <div style={{ position: 'absolute', top: 150, left: 30, fontFamily: mono, fontSize: 10, color: '#00ffccdd', letterSpacing: 2, textShadow: '0 0 10px #00ffcc55' }}>
                FOCUS // {ALL_NODE_META[hovered].tag}
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes boot-load { from { width: 0%; } to { width: 100%; } }
      `}</style>
    </div>
  )
}
