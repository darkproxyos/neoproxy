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
type Zone = {
  id: string; tag: string; title: string; href: string; color: string; subs?: SubZone[]
  description: string; cta: string
}

const ZONES: Zone[] = [
  {
    id: 'manifiesto', tag: 'NPX-DOC-00', title: 'MANIFIESTO', href: '/manifesto', color: '#ffb800',
    description: 'El documento fundacional del ecosistema — la premisa de que el software se comporta como un organismo vivo, no como una herramienta.',
    cta: 'LEER MANIFIESTO',
  },
  {
    id: 'fabricacion', tag: 'NPX-LAB-00', title: 'FABRICACIÓN', href: '/fabrication', color: '#5f95c9',
    description: 'Impresión 3D y artefactos físicos reales — la cadena completa de archivo digital a objeto en resina, en la mano.',
    cta: 'VER FABRICACIÓN',
    subs: [
      { id: 'impresion3d', tag: 'NPX-LAB-00a', title: 'IMPRESIÓN 3D', href: '/fabrication' },
      { id: 'artefactos', tag: 'NPX-REL-00', title: 'ARTEFACTOS', href: '/artifacts' },
      // Arsenal: oculto a pedido explícito (igual que en nav-config.ts) —
      // la página sigue viva en /arsenal, se vuelve a listar acá cuando
      // esté lista para mostrarse.
    ],
  },
  {
    id: 'laboratorio', tag: 'NPX-LAB-01', title: 'LABORATORIO', href: '/lab', color: '#ff8c1a',
    description: 'El laboratorio real, arrancando de cero — un canvas para dibujar y experimentar, creciendo con el tiempo.',
    cta: 'ENTRAR AL LABORATORIO',
  },
  {
    id: 'experimental', tag: 'NPX-EXP-00', title: 'EXPERIMENTAL', href: '/experimental', color: '#cc0000',
    description: 'Modos interactivos fuera del canon fijo — oráculo, sigilos, enjambre. Terreno de prueba, no documentación.',
    cta: 'EXPLORAR MODOS',
    subs: [
      { id: 'oraculo', tag: 'NPX-EXP-00a', title: 'ORÁCULO', href: '/experimental/oraculo' },
      { id: 'sigilo', tag: 'NPX-EXP-00b', title: 'SIGILO', href: '/experimental/sigilo' },
      { id: 'enjambre', tag: 'NPX-EXP-00c', title: 'ENJAMBRE', href: '/experimental/enjambre' },
    ],
  },
  {
    id: 'conocimiento', tag: 'NPX-KNW-00', title: 'CODEX COGITO', href: '/knowledge', color: '#6644aa',
    description: 'Conceptos y autores reales, más los documentos de archivo — física, mente, lenguaje, alimentación — convergiendo en una sola idea.',
    cta: 'ENTRAR AL CODEX',
    subs: [
      { id: 'filosofia', tag: 'NPX-KNW-00a', title: 'FILOSOFÍA', href: '/knowledge/filosofia' },
    ],
  },
  {
    id: 'proxyverse', tag: 'NPX-PXV-00', title: 'PROXYVERSE', href: '/proxyverse', color: '#00ff9d',
    description: 'Los siete procesos residentes — DarkProxy, Metatron, D, Snake, Genos, Trickster, Prototype. Lore completo, perfil propio.',
    cta: 'IR AL PROXYVERSE',
  },
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
const ZONE_BY_ID: Record<string, Zone> = {}
ZONES.forEach(zone => { ZONE_BY_ID[zone.id] = zone })

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
const NEUTRAL_HEX = '#5e8595'
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

// Hexacosichoron (600-cell, el politopo regular de 4D con más celdas) —
// 120 vértices en construcción estándar: 16 de (±½,±½,±½,±½), 8 de
// permutaciones de (±1,0,0,0), y 96 de permutaciones PARES de
// (±φ/2, ±½, ±1/2φ, 0). Las 720 aristas son los pares a distancia
// mínima (el politopo vive en la 3-esfera unitaria en 4D). Se proyecta
// una sola vez a 3D con un pliegue en perspectiva sobre W (la misma
// técnica que ya usa el home anterior para tesseract/24-cell/etc. en
// home-classic, parado acá un paso antes de la proyección final a 2D)
// — esto es el núcleo central, dorado, pedido explícitamente.
type Vec4 = [number, number, number, number]
function hexacosichoron(): { x: number; y: number; z: number }[][] {
  const PHI = (1 + Math.sqrt(5)) / 2
  const verts: Vec4[] = []
  for (let a = -1; a <= 1; a += 2) for (let b = -1; b <= 1; b += 2) for (let c = -1; c <= 1; c += 2) for (let d = -1; d <= 1; d += 2) {
    verts.push([a * 0.5, b * 0.5, c * 0.5, d * 0.5])
  }
  for (let axis = 0; axis < 4; axis++) for (const s of [1, -1]) {
    const v: Vec4 = [0, 0, 0, 0]
    v[axis] = s
    verts.push(v)
  }
  const permutations = (arr: number[]): number[][] => {
    if (arr.length <= 1) return [arr]
    const out: number[][] = []
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]
      for (const p of permutations(rest)) out.push([arr[i], ...p])
    }
    return out
  }
  const parity = (idx: number[]): number => {
    let inv = 0
    for (let i = 0; i < idx.length; i++) for (let j = i + 1; j < idx.length; j++) if (idx[i] > idx[j]) inv++
    return inv % 2
  }
  const idxPerms = permutations([0, 1, 2, 3]).filter(p => parity(p) === 0)
  const base = [PHI / 2, 0.5, 1 / (2 * PHI)]
  for (const sA of [1, -1]) for (const sB of [1, -1]) for (const sC of [1, -1]) {
    const vals = [sA * base[0], sB * base[1], sC * base[2], 0]
    for (const perm of idxPerms) {
      verts.push([vals[perm[0]], vals[perm[1]], vals[perm[2]], vals[perm[3]]])
    }
  }

  let minD2 = Infinity
  for (let a = 0; a < verts.length; a++) for (let b = a + 1; b < verts.length; b++) {
    const d2 = verts[a].reduce((s, c, k) => s + (c - verts[b][k]) ** 2, 0)
    if (d2 > 1e-9 && d2 < minD2) minD2 = d2
  }
  const edges: [number, number][] = []
  for (let a = 0; a < verts.length; a++) for (let b = a + 1; b < verts.length; b++) {
    const d2 = verts[a].reduce((s, c, k) => s + (c - verts[b][k]) ** 2, 0)
    if (Math.abs(d2 - minD2) < 1e-6) edges.push([a, b])
  }

  // rotación 4D fija (orientación estática, elegida para que no quede
  // simétrica/plana al proyectar) + pliegue en perspectiva sobre W
  const aXY = 0.5, aZW = 0.85, aXW = 0.35
  const rotate4D = (v: Vec4): Vec4 => {
    let [x, y, z, w] = v
    let cs = Math.cos(aXY), sn = Math.sin(aXY)
    ;[x, y] = [x * cs - y * sn, x * sn + y * cs]
    cs = Math.cos(aZW); sn = Math.sin(aZW)
    ;[z, w] = [z * cs - w * sn, z * sn + w * cs]
    cs = Math.cos(aXW); sn = Math.sin(aXW)
    ;[x, w] = [x * cs - w * sn, x * sn + w * cs]
    return [x, y, z, w]
  }
  const wDist = 2.4
  const projected = verts.map(rotate4D).map(([x, y, z, w]) => {
    const wFactor = wDist / (wDist - w)
    return { x: x * wFactor, y: y * wFactor, z: z * wFactor }
  })
  return edges.map(([ai, bi]) => [projected[ai], projected[bi]])
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
// Panel chico enmarcado por sección — mismo gesto visual que los
// retratos de abajo (marco de color + glow), pero con un glifo
// abstracto en vez de una foto: cada zona no tiene un "retrato" propio,
// así que en vez de inventar una imagen, es un ícono de sistema (nodo
// hexagonal con sus conexiones) — el "canvas enmarcado por sección"
// pedido explícitamente, sin fabricar contenido falso.
function makeZoneIconTexture(B: any, scene: any, id: string, color: string) {
  const size = 320
  const tex = new B.DynamicTexture(`zone-icon-${id}`, { width: size, height: size }, scene, true)
  tex.hasAlpha = true
  const ctx = tex.getContext()
  const pad = 14
  const cx = size / 2, cy = size / 2

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = `${color}18`
  ctx.fillRect(pad, pad, size - pad * 2, size - pad * 2)

  const R = size * 0.28
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.shadowColor = color
  ctx.shadowBlur = 14
  ctx.beginPath()
  for (let i = 0; i <= 6; i++) {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
    const px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.stroke()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
    const px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke()
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill()
  }
  ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill()

  ctx.strokeStyle = color
  ctx.lineWidth = 5
  ctx.shadowBlur = 20
  ctx.strokeRect(pad / 2, pad / 2, size - pad, size - pad)

  tex.update()
  return tex
}

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

  // ticks de esquina — el mismo gesto de "corner bracket" del chrome HUD
  // 2D (ver overlay del header), para que el panel 3D lea como parte del
  // mismo sistema técnico en vez de una tarjeta de UI genérica aparte
  ctx.lineWidth = 3
  ctx.shadowBlur = 10
  ctx.strokeStyle = color
  const tickLen = 46, tickPad = 30
  ;[[1, 1], [-1, 1]].forEach(([sx, sy]) => {
    const cx = sx > 0 ? tickPad : W - tickPad
    const cy = tickPad
    ctx.beginPath()
    ctx.moveTo(cx + sx * tickLen, cy)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx, cy + tickLen * 0.55)
    ctx.stroke()
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
  ctx.fillText(titleStr, W / 2, 98)

  // divisor fino entre título y tag — separa las dos jerarquías de texto
  // en vez de dejarlas flotando una encima de la otra sin ancla visual
  ctx.shadowBlur = 0
  ctx.strokeStyle = `${color}55`
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(W / 2 - 90, 126)
  ctx.lineTo(W / 2 + 90, 126)
  ctx.stroke()

  // tag — más chico y más opaco, el mismo formato NPX-XXX-00 que usa cada
  // sección en su propia página, con el prefijo "//" de lectura técnica
  // que ya usa el resto del HUD del sitio
  ctx.font = '30px "Space Mono", monospace'
  ctx.fillStyle = `${color}ee`
  ctx.shadowBlur = 6
  ctx.fillText(`// ${spaced(tag)}`, W / 2, 158)

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
  // marco de cine (barras + flash de corte) — pedido explícito: "esto es
  // cine". Las barras encuadran todo el arranque y el recorrido guiado;
  // se retiran recién cuando el usuario recupera el control libre, el
  // gesto de "termina la película, empieza el juego".
  const [cinematic, setCinematic] = useState(true)
  const [flashCut, setFlashCut] = useState(false)
  // qué zona muestra su panel de información durante la pausa del
  // recorrido guiado — "en cada pausa que se vea información", pedido
  // explícito. tourStopRef evita pedir un re-render en cada frame: solo
  // se llama a setTourStop cuando el valor realmente cambia.
  const [tourStop, setTourStop] = useState<string | null>(null)
  const tourStopRef = useRef<string | null>(null)
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
          setTimeout(() => {
            // corte de cine — un flash breve justo antes del "corte" a la
            // nube, en vez de que el canvas aparezca sin más
            setFlashCut(true)
            setCurrentScreen('content')
            setShowContent(true)
            setTimeout(() => setFlashCut(false), 260)
          }, 1300)
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
      scene.fogDensity = 0.02

      // Cámara libre, no cenital: flotando a la altura de la nube, mirando
      // de frente — inmersiva, no un mapa visto desde afuera. En pantallas
      // angostas (celular en vertical) arranca más lejos — con más nodos y
      // sub-nodos que antes, de cerca y en portrait quedaba todo cortado.
      const aspect = canvasRef.current!.clientWidth / Math.max(1, canvasRef.current!.clientHeight)
      const startRadius = aspect < 0.75 ? 48 : 41
      // plano general: el arranque ya no aparece quieto a startRadius —
      // la cámara nace mucho más lejos, casi perdida en la oscuridad, y
      // hace un travelling de acercamiento hasta el plano "normal" (ver
      // el segmento de apertura en tourSegments más abajo) — el "esto es
      // cine" pedido explícito, un plano de establecimiento real en vez
      // de simplemente aparecer ya encuadrado.
      const openRadius = startRadius * 1.75
      const initialAlpha = -Math.PI / 2.4, initialBeta = 1.15
      const camera = new B.ArcRotateCamera('cloud-cam', initialAlpha, initialBeta, openRadius, B.Vector3.Zero(), scene)
      camera.attachControl(canvasRef.current, true)
      camera.wheelPrecision = 24
      camera.lowerRadiusLimit = 22
      camera.upperRadiusLimit = openRadius + 6
      camera.lowerBetaLimit = 0.25
      camera.upperBetaLimit = Math.PI - 0.25
      camera.panningSensibility = 0
      // el auto-orbit de reposo arranca recién después del recorrido guiado
      // (ver más abajo) — si quedara prendido desde ya, pelearía con la
      // animación del tour apenas pasa el primer idleRotationWaitTime.
      const enableIdleOrbit = () => {
        camera.useAutoRotationBehavior = true
        if (camera.autoRotationBehavior) {
          camera.autoRotationBehavior.idleRotationSpeed = 0.05
          camera.autoRotationBehavior.idleRotationWaitTime = 1100
        }
        // termina la película, el marco de cine se retira — recién acá
        // el usuario tiene de verdad el control libre
        setCinematic(false)
        tourStopRef.current = null
        setTourStop(null)
      }

      new B.HemisphericLight('cloud-fill', new B.Vector3(0, 1, 0.2), scene).intensity = 0.85
      const sun = new B.DirectionalLight('cloud-sun', new B.Vector3(-0.3, -0.8, -0.4), scene)
      sun.intensity = 0.9

      // Glow real (bloom) sobre lo emisivo — nodos, paneles HUD y
      // sinapsis quedan "bien definidos e iluminados" en vez de planos.
      // Las fotos de los agentes (su propia imagen hace de emissive, no
      // algo que deba brillar como un HUD) quedan afuera explícitamente.
      const glow = new B.GlowLayer('cloud-glow', scene, { mainTextureFixedSize: 1024, blurKernelSize: 48 })
      const GLOW_BASE = 0.85
      glow.intensity = GLOW_BASE

      // Un par de manchas de nebulosa muy lejos, de fondo — atmósfera sin
      // partículas (sacadas a pedido), acercándose al fondo con nubes de
      // la referencia visual.
      ;[
        { color: '#6644aa', pos: new B.Vector3(-40, 18, -50) },
        { color: '#2a5f9e', pos: new B.Vector3(42, -13, -55) },
      ].forEach(({ color, pos }, i) => {
        const nebTex = makeNebulaTexture(B, scene, `${i}`, color)
        const neb = B.MeshBuilder.CreatePlane(`nebula-${i}`, { size: 92 }, scene)
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

      // --- núcleo central: ya no es "el home" genérico — es METATRON
      // mismo, literal (pedido explícito: "quiero que metatron sea el
      // exacosichoron real"). Color canónico del agente (agents.ts:
      // '#ffb800'), no el dorado neutro que había antes. Un proxy
      // invisible más grande lo hace clickeable de verdad — las líneas
      // finas del wireframe son un target de click poco confiable — y
      // así "aporta algo más que estar en medio": es el único retrato
      // del proxyverso al que se navega directo desde el núcleo. ---
      const METATRON_COLOR = '#ffb800'
      const CORE_SCALE = 2.1
      const coreEdges = hexacosichoron()
      const coreLines = coreEdges.map(([p1, p2]) => [
        new B.Vector3(p1.x * CORE_SCALE, p1.y * CORE_SCALE, p1.z * CORE_SCALE),
        new B.Vector3(p2.x * CORE_SCALE, p2.y * CORE_SCALE, p2.z * CORE_SCALE),
      ])
      const core = B.MeshBuilder.CreateLineSystem('core', { lines: coreLines }, scene)
      core.color = B.Color3.FromHexString(METATRON_COLOR)
      core.alpha = 0.65
      core.isPickable = false

      const coreClickProxy = B.MeshBuilder.CreateSphere('core-click-proxy', { diameter: CORE_SCALE * 2.3 }, scene)
      const coreProxyMat = new B.StandardMaterial('core-click-proxy-mat', scene)
      coreProxyMat.alpha = 0 // invisible pero "visible" para Babylon — isVisible=false saca la malla del picking por defecto
      coreClickProxy.material = coreProxyMat
      coreClickProxy.isPickable = true
      coreClickProxy.metadata = { id: 'metatron', href: '/proxyverse/metatron' }

      type NodeEntry = {
        id: string; mesh: any; label: any; stem: any; href: string; tier: 'primary' | 'sub'
        parentId?: string; baseDelay: number; familyId: string; mat: any
        dimRGB: [number, number, number]; fullRGB: [number, number, number]
        litT: number; labelTexDim: any; labelTexBright: any; wasBright: boolean
      }
      const nodes: NodeEntry[] = []
      const linkEntries: { mesh: any; mat: any; aId: string; bId: string; baseDelay: number; dimRGB: [number, number, number]; fullRGB: [number, number, number]; litT: number }[] = []
      const pathLines: { mesh: any; mat: any; zoneId: string; dimRGB: [number, number, number]; fullRGB: [number, number, number]; litT: number; dot: any; dotMat: any }[] = []
      const zoneIcons: { mesh: any; baseDelay: number }[] = []
      const zonePos: Record<string, { x: number; y: number; z: number }> = {}
      const allAvoidAnchors: { x: number; y: number; z: number }[] = []

      // --- nodos primarios, dispersos sobre una esfera (sin eje "arriba") ---
      const LAYOUT_RADIUS = 18
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
        const dimHex = mixHexAmount(zone.color, NEUTRAL_HEX, 0.72)
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
        const stem = B.MeshBuilder.CreateTube(`stem-${zone.id}`, {
          path: [new B.Vector3(x, y, z), new B.Vector3(x, labelY - 0.42, z)],
          radius: 0.02, tessellation: 5,
        }, scene)
        const stemMat = new B.StandardMaterial(`stemMat-${zone.id}`, scene)
        stemMat.disableLighting = true
        stemMat.emissiveColor = new B.Color3(dimRGB[0], dimRGB[1], dimRGB[2])
        stemMat.alpha = 0.55
        stem.material = stemMat
        stem.isPickable = false

        nodes.push({
          id: zone.id, mesh, label, stem, href: zone.href, tier: 'primary', baseDelay,
          familyId: zone.id, mat, dimRGB, fullRGB, litT: 0, labelTexDim, labelTexBright, wasBright: false,
        })

        // sinapsis del núcleo al nodo — con una leve curva orgánica, no una
        // recta digital pura: la señal no viaja en línea derecha acá adentro.
        // Tubo real (no una línea GL_LINES de 1px) para el look "láser de
        // neón" pedido — con ancho de verdad, responde mucho mejor al
        // glow que una LinesMesh.
        const mid = new B.Vector3(x * 0.5 + Math.sin(i * 2.1) * 1.1, y * 0.5 + Math.cos(i * 1.7) * 1.1, z * 0.5 + Math.sin(i * 3.3) * 1.1)
        const path = B.MeshBuilder.CreateTube(`path-${zone.id}`, {
          path: [B.Vector3.Zero(), mid, new B.Vector3(x, y, z)],
          radius: 0.045, tessellation: 6,
        }, scene)
        const pathMat = new B.StandardMaterial(`pathMat-${zone.id}`, scene)
        pathMat.disableLighting = true
        pathMat.emissiveColor = new B.Color3(dimRGB[0], dimRGB[1], dimRGB[2])
        pathMat.alpha = 0.42
        path.material = pathMat
        path.isPickable = false

        // pulso que viaja núcleo → zona todo el tiempo, no solo al activarse
        // — Metatron "aporta algo más que estar en medio": transmite señal
        // a cada sección de forma continua, el gesto de orquestador vivo
        const pulseDot = B.MeshBuilder.CreateSphere(`pathpulse-${zone.id}`, { diameter: 0.16 }, scene)
        const pulseDotMat = new B.StandardMaterial(`pathpulsemat-${zone.id}`, scene)
        pulseDotMat.disableLighting = true
        pulseDotMat.emissiveColor = B.Color3.FromHexString(METATRON_COLOR)
        pulseDot.material = pulseDotMat
        pulseDot.isPickable = false
        pathLines.push({ mesh: path, mat: pathMat, zoneId: zone.id, dimRGB, fullRGB, litT: 0, dot: pulseDot, dotMat: pulseDotMat })

        // --- panel enmarcado por sección (ver makeZoneIconTexture) —
        // pedido explícito, "un canvas enmarcado en cada sección". Cerca
        // del propio nodo (no en el anillo de subs), billboard, decorativo
        // — el click real sigue siendo solo el nodo. ---
        const iconTex = makeZoneIconTexture(B, scene, zone.id, zone.color)
        const iconPlane = B.MeshBuilder.CreatePlane(`zoneicon-${zone.id}`, { size: 1.3 }, scene)
        const iconOffset = tangentBasis({ x, y, z }).t1
        iconPlane.position.set(x + iconOffset.x * 2.1, y + iconOffset.y * 2.1 - 0.3, z + iconOffset.z * 2.1)
        iconPlane.billboardMode = B.Mesh.BILLBOARDMODE_ALL
        const iconMat = new B.StandardMaterial(`zoneiconmat-${zone.id}`, scene)
        iconMat.diffuseTexture = iconTex
        iconMat.emissiveTexture = iconTex
        iconMat.opacityTexture = iconTex
        iconMat.disableLighting = true
        iconMat.backFaceCulling = false
        iconPlane.material = iconMat
        iconPlane.isPickable = false
        iconPlane.scaling.set(0.001, 0.001, 0.001)
        zoneIcons.push({ mesh: iconPlane, baseDelay })

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
          const SUB_RING = 5.6
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

            const subStem = B.MeshBuilder.CreateTube(`substem-${sub.id}`, {
              path: [new B.Vector3(sx, sy, sz), new B.Vector3(sx, subLabelY - 0.3, sz)],
              radius: 0.016, tessellation: 5,
            }, scene)
            const subStemMat = new B.StandardMaterial(`substemMat-${sub.id}`, scene)
            subStemMat.disableLighting = true
            subStemMat.emissiveColor = new B.Color3(dimRGB[0], dimRGB[1], dimRGB[2])
            subStemMat.alpha = 0.48
            subStem.material = subStemMat
            subStem.isPickable = false

            nodes.push({
              id: sub.id, mesh: subMesh, label: subLabel, stem: subStem, href: sub.href, tier: 'sub', parentId: zone.id, baseDelay: subDelay,
              familyId: zone.id, mat: subMat, dimRGB, fullRGB, litT: 0, labelTexDim: subLabelTexDim, labelTexBright: subLabelTexBright, wasBright: false,
            })

            // unión sub → primario — la relación de jerarquía en sí misma,
            // una línea corta y constante en vez de la curva orgánica
            // (esa queda reservada a núcleo→primario)
            const subLink = B.MeshBuilder.CreateTube(`sublink-${sub.id}`, {
              path: [new B.Vector3(x, y, z), new B.Vector3(sx, sy, sz)],
              radius: 0.028, tessellation: 6,
            }, scene)
            const subLinkMat = new B.StandardMaterial(`sublinkMat-${sub.id}`, scene)
            subLinkMat.disableLighting = true
            subLinkMat.emissiveColor = new B.Color3(dimRGB[0], dimRGB[1], dimRGB[2])
            subLinkMat.alpha = 0
            subLink.material = subLinkMat
            subLink.isPickable = false
            linkEntries.push({ mesh: subLink, mat: subLinkMat, aId: zone.id, bId: sub.id, baseDelay: subDelay, dimRGB, fullRGB, litT: 0 })
          })
        }
      })

      // --- recorrido guiado al cargar: la cámara visita unas pocas zonas
      // antes de soltar el control libre — en vez de dejar que el usuario
      // tenga que arrastrar a ciegas para descubrir que hay algo acá
      // (en celular, de entrada, la nube se ve casi vacía). Cualquier
      // interacción real (arrastrar, zoom) cancela el recorrido al toque
      // y entrega el control normal de inmediato. ---
      type CamPose = { alpha: number; beta: number; radius: number }
      // alpha/beta para que la cámara, mirando siempre al origen, quede
      // del lado opuesto a la zona — así lo que ve al frente es la zona,
      // no su propia espalda (ver la derivación en la verificación de
      // home-3d: el punto queda "delante" solo si la cámara se para del
      // lado contrario respecto al origen).
      const lookAtZone = (p: { x: number; y: number; z: number }): CamPose => {
        const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) || 1
        const alpha = Math.atan2(-p.z, -p.x)
        const betaRaw = Math.acos(Math.max(-1, Math.min(1, -p.y / len)))
        const beta = Math.max(0.25, Math.min(Math.PI - 0.25, betaRaw))
        return { alpha, beta, radius: 27 }
      }
      // empieza en FABRICACIÓN (pedido explícito) y de ahí recorre el resto
      // — un recorrido más completo, no solo 3 paradas
      const TOUR_ZONE_IDS = ['fabricacion', 'laboratorio', 'experimental', 'conocimiento', 'proxyverse']
      const initialPose: CamPose = { alpha: initialAlpha, beta: initialBeta, radius: startRadius }
      const waypoints: CamPose[] = [
        initialPose,
        ...TOUR_ZONE_IDS.map(id => lookAtZone(zonePos[id])).filter(Boolean),
        initialPose,
      ]
      // más lento y pausado — "más cinematográfico" pedido explícito, no
      // solo una cámara que salta de punto a punto
      const TOUR_START = 2800, STOP_TRAVEL = 3200, STOP_HOLD = 2200
      // zoneId: la zona en la que se queda la cámara durante la pausa
      // INMEDIATAMENTE DESPUÉS de este segmento (null = plano de apertura
      // o el tramo final que vuelve al plano general, sin panel de info)
      const tourSegments: { from: CamPose; to: CamPose; start: number; end: number; zoneId: string | null }[] = []
      // plano de apertura: travelling de acercamiento desde la oscuridad
      // (openRadius) hasta el plano normal — ocupa el mismo tramo que antes
      // quedaba estático (0 → TOUR_START), no suma duración extra
      const openingPose: CamPose = { alpha: initialAlpha, beta: initialBeta, radius: openRadius }
      tourSegments.push({ from: openingPose, to: initialPose, start: 0, end: TOUR_START, zoneId: null })
      {
        let cursor = TOUR_START
        for (let i = 0; i < waypoints.length - 1; i++) {
          const start = cursor
          const end = start + STOP_TRAVEL
          const zoneId = i < TOUR_ZONE_IDS.length ? TOUR_ZONE_IDS[i] : null
          tourSegments.push({ from: waypoints[i], to: waypoints[i + 1], start, end, zoneId })
          cursor = end + (i < waypoints.length - 2 ? STOP_HOLD : 0)
        }
      }
      const tourEndsAt = tourSegments.length ? tourSegments[tourSegments.length - 1].end : 0
      let tourCancelled = false
      let idleOrbitEnabled = false
      // Solo marca la bandera acá — nada de tocar comportamientos de la
      // cámara en el propio handler de pointerdown. Attachear/soltar un
      // Behavior en medio de un gesto de puntero en curso confundía la
      // detección de click-vs-drag de Babylon (el picking dejaba de
      // disparar en ese mismo click). El cambio real de comportamiento
      // pasa al loop de render, un frame después, ya afuera del gesto.
      const cancelTour = () => { tourCancelled = true }
      canvasRef.current?.addEventListener('pointerdown', cancelTour, { passive: true })
      canvasRef.current?.addEventListener('wheel', cancelTour, { passive: true })

      // --- una luz de color por zona, suave, iluminando su propio
      // cluster desde adentro — refuerza "esto es un grupo" por
      // proximidad Y color (gestalt) además de la pura cercanía
      // geométrica, y le da a cada nodo sólido variación real de luz en
      // vez de depender solo del material emissive plano. ---
      const zoneLights: { light: any; zoneId: string; dimRGB: [number, number, number]; fullRGB: [number, number, number]; litT: number }[] = []
      ZONES.forEach(zone => {
        const p = zonePos[zone.id]
        if (!p) return
        const dimRGB = hex3(mixHexAmount(zone.color, NEUTRAL_HEX, 0.72))
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
      const crossLinks: { mesh: any; mat: any; glowA: any; glowB: any; dot: any; dotMat: any; dimRGB: [number, number, number]; fullRGB: [number, number, number]; litT: number; aId: string; bId: string; color: string }[] = []
      const CROSS_LINK_DELAY = 2000
      ZONE_LINKS.forEach(([aId, bId], idx) => {
        const a = zonePos[aId], b = zonePos[bId]
        if (!a || !b) return
        const zoneA = ZONES.find(z => z.id === aId)!, zoneB = ZONES.find(z => z.id === bId)!
        const blended = mixHex(zoneA.color, zoneB.color)
        const dimBlended = mixHexAmount(blended, NEUTRAL_HEX, 0.72)
        const dimRGB = hex3(dimBlended)
        const dimColor = new B.Color3(dimRGB[0], dimRGB[1], dimRGB[2])
        // tubo real, no una línea GL_LINES de 1px — el "láser de neón"
        // pedido para las uniones, que son la conexión más importante
        // del grafo (zona↔zona, no jerarquía).
        const line = B.MeshBuilder.CreateTube(`crosslink-${idx}`, {
          path: [new B.Vector3(a.x, a.y, a.z), new B.Vector3(b.x, b.y, b.z)],
          radius: 0.045, tessellation: 6,
        }, scene)
        const lineMat = new B.StandardMaterial(`crosslinkMat-${idx}`, scene)
        lineMat.disableLighting = true
        lineMat.emissiveColor = dimColor
        lineMat.alpha = 0
        line.material = lineMat
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

        crossLinks.push({ mesh: line, mat: lineMat, glowA, glowB, dot, dotMat, dimRGB, fullRGB: hex3(blended), litT: 0, aId, bId, color: blended })
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
      type AgentDrift = { plane: any; agentId: string; base: { x: number; y: number; z: number }; phase: number; freq: { x: number; y: number; z: number } }
      const agentDrifters: AgentDrift[] = []
      // separación mínima a cualquier nodo (primario o satélite) — sin
      // esto, un retrato puede terminar flotando justo delante del panel
      // con su nombre y taparlo (pasó en la primera pasada: nada "claro"
      // en eso).
      const MIN_SEP_TO_ZONE = 8.5
      agents.forEach((agent, i) => {
        if (agent.id === 'metatron') return // tiene su propio lugar, ver más abajo: orbita el núcleo, no deriva suelto
        const image = AGENT_IMAGES[agent.id]
        if (!image) return
        let base = { x: 0, y: 0, z: 0 }
        for (let attempt = 0; attempt < 30; attempt++) {
          const costheta = Math.random() * 2 - 1
          const theta = Math.acos(costheta)
          const phi = Math.random() * Math.PI * 2
          const r = 9 + Math.random() * 12
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
          plane, agentId: agent.id, base,
          phase: i * 1.7,
          freq: { x: 0.16 + i * 0.013, y: 0.12 + i * 0.017, z: 0.19 + i * 0.01 },
        })
      })

      // --- METATRON: no es un retrato más derivando por la nube, es el
      // núcleo mismo — orbita pegado al hexacosichoron en vez de flotar
      // suelto por el espacio como los otros seis procesos, y es el único
      // retrato clickeable desde el home (ver coreClickProxy arriba): el
      // gesto es "el centro de la escena ES Metatron", no "hay una línea
      // que lo conecta con el centro". ---
      const metatronOrbitRadius = CORE_SCALE * 1.75
      const metatronImage = AGENT_IMAGES['metatron']
      let metatronPlane: any = null
      let metatronLabel: any = null
      let coreMetatronLink: any = null
      let coreMetatronMat: any = null
      if (metatronImage) {
        const metatronPhotoTex = makePhotoTexture(B, scene, 'metatron', metatronImage, METATRON_COLOR)
        metatronPlane = B.MeshBuilder.CreatePlane('home-photo-metatron', { size: 1.9 }, scene)
        metatronPlane.billboardMode = B.Mesh.BILLBOARDMODE_ALL
        const metatronPhotoMat = new B.StandardMaterial('home-photomat-metatron', scene)
        metatronPhotoMat.diffuseTexture = metatronPhotoTex
        metatronPhotoMat.emissiveTexture = metatronPhotoTex
        metatronPhotoMat.opacityTexture = metatronPhotoTex
        metatronPhotoMat.disableLighting = true
        metatronPhotoMat.backFaceCulling = false
        metatronPlane.material = metatronPhotoMat
        metatronPlane.isPickable = true
        metatronPlane.metadata = { id: 'metatron', href: '/proxyverse/metatron' }
        metatronPlane.position.set(metatronOrbitRadius, 0, 0)
        glow.addExcludedMesh(metatronPlane)

        const metatronLabelTex = makeZoneLabelTexture(B, scene, 'metatron', 'METATRON', 'EL ORQUESTADOR', METATRON_COLOR)
        metatronLabel = B.MeshBuilder.CreatePlane('metatron-label', { width: 3.6, height: 0.81 }, scene)
        metatronLabel.billboardMode = B.Mesh.BILLBOARDMODE_ALL
        const metatronLabelMat = new B.StandardMaterial('metatron-labelmat', scene)
        metatronLabelMat.diffuseTexture = metatronLabelTex
        metatronLabelMat.emissiveTexture = metatronLabelTex
        metatronLabelMat.opacityTexture = metatronLabelTex
        metatronLabelMat.disableLighting = true
        metatronLabelMat.backFaceCulling = false
        metatronLabel.material = metatronLabelMat
        metatronLabel.isPickable = false

        coreMetatronLink = B.MeshBuilder.CreateTube('core-metatron-link', {
          path: [B.Vector3.Zero(), metatronPlane.position.clone()],
          radius: 0.045, tessellation: 6, updatable: true,
        }, scene)
        coreMetatronMat = new B.StandardMaterial('core-metatron-mat', scene)
        coreMetatronMat.disableLighting = true
        coreMetatronMat.emissiveColor = B.Color3.FromHexString(METATRON_COLOR)
        coreMetatronMat.alpha = 0.75
        coreMetatronLink.material = coreMetatronMat
        coreMetatronLink.isPickable = false
      }

      // --- emergencia: la nube entera condensa de la nada, los nodos de
      // sección aparecen escalonados encima, y recién al final se
      // resuelven las uniones entre zonas (primero el árbol, después la
      // red) ---
      const elapsed0 = performance.now()
      const CLOUD_EMERGE_MS = 1400
      const NODE_EMERGE_MS = 700
      const LINK_FADE_MS = 900
      let hoveredId: string | null = null
      let coreLitT = 0
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

        // recorrido guiado — ver el bloque que arma tourSegments más
        // arriba. Mientras dura, pisa alpha/beta/radius directamente;
        // apenas el usuario toca el canvas, cancelTour() ya cortó esto.
        const tourElapsed = t - elapsed0
        if (tourCancelled || tourElapsed >= tourEndsAt) {
          // tanto si terminó solo como si lo cortó el usuario, el cambio
          // de comportamiento de la cámara pasa acá — un frame del render
          // loop, nunca directo adentro del handler de pointerdown (eso
          // confundía la detección de click-vs-drag de Babylon y el
          // picking dejaba de disparar en ese mismo click).
          if (!idleOrbitEnabled) {
            enableIdleOrbit()
            idleOrbitEnabled = true
          }
        } else {
          const seg = tourSegments.find(s => tourElapsed >= s.start && tourElapsed < s.end)
          if (seg) {
            // viajando — sin panel de info, "se ve viajando hacia ningún
            // lado" era justamente esto: info solo cuando llega y se
            // queda quieta sobre una zona real
            if (tourStopRef.current !== null) { tourStopRef.current = null; setTourStop(null) }
            const p = smoothstep(Math.max(0, Math.min(1, (tourElapsed - seg.start) / (seg.end - seg.start))))
            let dA = seg.to.alpha - seg.from.alpha
            dA = ((dA + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI
            camera.alpha = seg.from.alpha + dA * p
            camera.beta = seg.from.beta + (seg.to.beta - seg.from.beta) * p
            camera.radius = seg.from.radius + (seg.to.radius - seg.from.radius) * p
            // sin esto, cualquier offset inercial residual (por ej. de
            // un primer pointermove espurio al cargar) se suma encima
            // del valor que acabamos de fijar y la cámara termina en
            // otro lado del calculado acá arriba.
            camera.inertialAlphaOffset = 0
            camera.inertialBetaOffset = 0
            camera.inertialRadiusOffset = 0
          }
          // entre segmentos (en la pausa sobre una zona) no se toca nada
          // — la cámara se queda exactamente donde llegó. Acá sí se
          // muestra el panel: cuál zona es la del segmento que acaba de
          // terminar justo antes de este hueco.
          const justArrived = [...tourSegments].reverse().find(s => s.end <= tourElapsed)
          const stopId = justArrived?.zoneId ?? null
          if (tourStopRef.current !== stopId) { tourStopRef.current = stopId; setTourStop(stopId) }
        }

        core.rotation.y += 0.0028
        core.rotation.x += 0.0011
        core.rotation.z += 0.0007
        const pulse = 1 + Math.sin(t * 0.0016) * 0.06
        core.scaling.set(pulse, pulse, pulse)

        const cloudP = smoothstep(Math.min(1, (t - elapsed0) / CLOUD_EMERGE_MS))
        dustRoot.scaling.set(cloudP, cloudP, cloudP)

        // ignición: apenas termina de condensar la nube, un sobre-brillo
        // breve que decae — el "big bang" del arranque, no un fade-in
        // liso. Coincide con la mitad del travelling de apertura: la
        // cámara todavía se está acercando cuando el núcleo estalla.
        const sinceEmerge = t - elapsed0 - CLOUD_EMERGE_MS
        const ignitionDecay = sinceEmerge >= 0 ? Math.max(0, 1 - sinceEmerge / 750) : 0
        glow.intensity = GLOW_BASE + 1.4 * ignitionDecay * ignitionDecay

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
          n.stem.material.alpha = ((n.tier === 'primary' ? 0.55 : 0.48) * (isFamilyActive ? 1.8 : 1)) * labelBase

          n.litT += ((isFamilyActive ? 1 : 0) - n.litT) * LIT_RATE
          const rgb = lerp3(n.dimRGB, n.fullRGB, n.litT)
          n.mat.diffuseColor.set(rgb[0], rgb[1], rgb[2])
          n.mat.emissiveColor.set(rgb[0] * 0.55, rgb[1] * 0.55, rgb[2] * 0.55)
          n.stem.material.emissiveColor.set(rgb[0], rgb[1], rgb[2])
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

        pathLines.forEach((pl, idx) => {
          const active = hoveredFamily !== null && pl.zoneId === hoveredFamily
          pl.litT += ((active ? 1 : 0) - pl.litT) * LIT_RATE
          const rgb = lerp3(pl.dimRGB, pl.fullRGB, pl.litT)
          pl.mat.emissiveColor.set(rgb[0], rgb[1], rgb[2])
          pl.mat.alpha = 0.42 + 0.4 * pl.litT

          // pulso dorado (color de Metatron) viajando núcleo → zona,
          // más rápido y brillante cuando esa familia está activa
          const target = zonePos[pl.zoneId]
          if (target) {
            const speed = active ? 0.0013 : 0.0006
            const phase = (Math.sin(t * speed + idx * 1.9) + 1) / 2
            pl.dot.position.set(target.x * phase, target.y * phase, target.z * phase)
            const pulseRGB = lerp3([1, 0.72, 0], rgb, phase * 0.7)
            pl.dotMat.emissiveColor.set(pulseRGB[0], pulseRGB[1], pulseRGB[2])
            const dotScale = 1 + 0.5 * pl.litT
            pl.dot.scaling.set(dotScale, dotScale, dotScale)
          }
        })

        zoneIcons.forEach(zi => {
          const localElapsed = t - elapsed0 - zi.baseDelay - 150
          const p = smoothstep(Math.max(0, Math.min(1, localElapsed / NODE_EMERGE_MS)))
          zi.mesh.scaling.set(p, p, p)
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
          le.mat.emissiveColor.set(rgb[0], rgb[1], rgb[2])
          le.mat.alpha = (0.5 + 0.4 * le.litT) * p
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
          cl.mat.emissiveColor.set(rgb[0], rgb[1], rgb[2])
          cl.mat.alpha = Math.min(1, (0.34 + 0.55 * cl.litT) * crossP)
          // el haz paralelo ya tiene un piso visible en reposo (no parte
          // de cero) — más marcado, no solo al activarse
          const glowAlpha = (0.12 + 0.32 * cl.litT) * crossP
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

        // METATRON orbita el núcleo con rotación propia y constante — a
        // diferencia del resto, nunca se aleja ni deriva al azar: es el
        // único proceso con una posición fija respecto al centro, la
        // "sintaxis compartida" de la que habla su bio en /proxyverse.
        if (metatronPlane) {
          const orbitAngle = ts * 0.12
          const mx = Math.cos(orbitAngle) * metatronOrbitRadius
          const mz = Math.sin(orbitAngle) * metatronOrbitRadius
          const my = Math.sin(ts * 0.3) * 0.5
          metatronPlane.position.set(mx, my, mz)
          if (metatronLabel) metatronLabel.position.set(mx, my + 1.05, mz)
          if (coreMetatronLink) {
            B.MeshBuilder.CreateTube('core-metatron-link', {
              path: [B.Vector3.Zero(), metatronPlane.position.clone()],
              instance: coreMetatronLink,
            }, scene)
          }
          // el núcleo se enciende al pasar el mouse por encima (o por el
          // propio retrato) — confirma que es clickeable de verdad, no
          // solo decorativo
          const coreActive = hoveredId === 'metatron'
          coreLitT += ((coreActive ? 1 : 0) - coreLitT) * LIT_RATE
          core.alpha = 0.65 + 0.3 * coreLitT
          const metatronScale = 1 + 0.1 * coreLitT
          metatronPlane.scaling.set(metatronScale, metatronScale, metatronScale)
        }
      })

      engine.runRenderLoop(() => scene.render())
      const onResize = () => engine.resize()
      window.addEventListener('resize', onResize)
      return () => {
        window.removeEventListener('resize', onResize)
        canvasRef.current?.removeEventListener('pointerdown', cancelTour)
        canvasRef.current?.removeEventListener('wheel', cancelTour)
      }
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
  const tourStopZone = tourStop ? ZONE_BY_ID[tourStop] : undefined

  return (
    <div style={{ background: '#000205', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="crt-scanlines" />

      {/* marco de cine — barras arriba/abajo desde el arranque, se
          retiran recién cuando termina el recorrido guiado (o el usuario
          lo corta) y pasa a control libre: "termina la película, empieza
          el juego". Línea de borde en vez de negro liso, para que lea
          como encuadre diseñado y no como una barra de carga rota. */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        height: cinematic ? 'clamp(26px, 8vh, 120px)' : '0px',
        background: '#000205', borderBottom: cinematic ? '1px solid #00d4ff33' : 'none',
        transition: 'height 1.4s cubic-bezier(0.65,0,0.35,1), border-color 1.4s ease',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        height: cinematic ? 'clamp(26px, 8vh, 120px)' : '0px',
        background: '#000205', borderTop: cinematic ? '1px solid #00d4ff33' : 'none',
        transition: 'height 1.4s cubic-bezier(0.65,0,0.35,1), border-color 1.4s ease',
        pointerEvents: 'none',
      }} />

      {/* corte de cine — flash breve justo al cortar de "SIGNAL ACQUIRED"
          a la nube 3D, en vez de que el canvas aparezca sin más */}
      {flashCut && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 150, background: '#eafcff',
          animation: 'cinema-flash 260ms ease-out forwards', pointerEvents: 'none',
        }} />
      )}

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

            {hovered && ALL_NODE_META[hovered] && (
              <div style={{ position: 'absolute', top: 168, left: 30, fontFamily: mono, fontSize: 10, color: '#00ffccdd', letterSpacing: 2, textShadow: '0 0 10px #00ffcc55' }}>
                FOCUS // {ALL_NODE_META[hovered].tag}
              </div>
            )}
          </div>

          {/* panel de información en cada pausa del recorrido guiado —
              pedido explícito: "se ve viajando hacia ningún lado y no
              aporta información". Contenido real de cada zona (no texto
              de relleno), con la estética de panel recortado + CTA real
              a la ruta de esa zona — el mismo gesto que un click directo
              sobre el nodo, no una ventana modal aparte. */}
          {tourStopZone && (
            <div key={tourStop} style={{
              position: 'fixed', top: 'calc(8vh + 28px)', left: '50%', transform: 'translateX(-50%)',
              width: 'min(420px, calc(100vw - 48px))', zIndex: 45, pointerEvents: 'auto',
              background: 'rgba(8, 12, 22, 0.86)', backdropFilter: 'blur(6px)',
              border: `1px solid ${tourStopZone.color}99`,
              boxShadow: `0 0 36px ${tourStopZone.color}2e, inset 0 0 24px rgba(0,0,0,0.3)`,
              clipPath: 'polygon(0 16px, 16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)',
              padding: '22px 24px 20px',
              animation: 'panel-in 520ms cubic-bezier(0.2,0.8,0.2,1) forwards',
            }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: tourStopZone.color, letterSpacing: 3 }}>
                {tourStopZone.tag}
              </div>
              <div style={{ fontFamily: mono, fontSize: 19, fontWeight: 700, color: '#eaf4fb', letterSpacing: 2.5, marginTop: 6, marginBottom: 12, textShadow: `0 0 14px ${tourStopZone.color}66` }}>
                {tourStopZone.title}
              </div>
              <div style={{ fontFamily: mono, fontSize: 12.5, color: '#b7c6d4', lineHeight: 1.65, letterSpacing: 0.3 }}>
                {tourStopZone.description}
              </div>
              <button
                onClick={() => router.push(tourStopZone.href)}
                style={{
                  marginTop: 18, width: '100%', padding: '11px 0', background: 'transparent',
                  border: `1px solid ${tourStopZone.color}aa`, color: tourStopZone.color,
                  fontFamily: mono, fontSize: 11, letterSpacing: 2.5, cursor: 'pointer',
                }}
              >
                {tourStopZone.cta}
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes boot-load { from { width: 0%; } to { width: 100%; } }
        @keyframes cinema-flash { from { opacity: 0.92; } to { opacity: 0; } }
        @keyframes panel-in { from { opacity: 0; transform: translate(-50%, -10px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
    </div>
  )
}
