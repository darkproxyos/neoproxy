// CAPAS: mundos 2D gobernados por ecuaciones reales.
//
// Cada ley avanza un mundo toroidal (bordes que se unen) con aritmética de
// punto flotante simple: solo + - * / y sqrt. Esas operaciones las fija el
// estándar IEEE bit a bit, así que el mismo genoma repite el mismo universo en
// Node y en el navegador. Nada acá usa Math.sin/cos/exp/atan2 en un bucle:
// en un sistema caótico (los defectos de Ginzburg–Landau) un dígito de
// diferencia se amplifica hasta otro universo.

import { mulberry32 } from '../specimens/rng'
import type { Shape } from './volume'

export type LawId = 'mitosis' | 'coral' | 'espirales' | 'defectos'
export const LAW_IDS: readonly LawId[] = ['mitosis', 'coral', 'espirales', 'defectos']
export type Tool = 1 | -1 // 1 = sembrar, -1 = borrar

export type World = {
  law: LawId; w: number; h: number; step: number
  a: Float32Array; b: Float32Array   // campos actuales
  a2: Float32Array; b2: Float32Array // buffers de salida (se intercambian)
}

export type LawSpec = {
  id: LawId
  label: string
  tagline: string
  equation: string
  concept: string
  credit: string
  note: string
  views: { id: string; label: string }[]
  knobLabel: string
  knobValue: (knob: number) => number // valor físico de la constante, para mostrarlo
  defaults: { view: string; theta: number; knob: number; shape: Shape }
  stride: number            // pasos de simulación por capa (el tiempo que dura cada capa impresa)
  init: (w: number, h: number, seed: number, knob: number) => World
  step: (world: World, n: number, knob: number) => void
  field: (world: World, view: string, out: Uint8Array) => void
  brush: (world: World, x: number, y: number, r: number, tool: Tool) => void
  seedLabel: [string, string] // nombre de las dos herramientas
}

const mk = (law: LawId, w: number, h: number): World => ({
  law, w, h, step: 0,
  a: new Float32Array(w * h), b: new Float32Array(w * h),
  a2: new Float32Array(w * h), b2: new Float32Array(w * h),
})
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
// ventana compacta de soporte finito, sin exponenciales: (1 - (d/R)^2)^2
const win = (d2: number, R: number) => { const q = 1 - d2 / (R * R); return q > 0 ? q * q : 0 }

function eachInDisc(w: World, cx: number, cy: number, r: number, fn: (i: number, d2: number) => void) {
  const R = Math.max(1, r)
  for (let dy = -Math.ceil(R); dy <= Math.ceil(R); dy++) for (let dx = -Math.ceil(R); dx <= Math.ceil(R); dx++) {
    const d2 = dx * dx + dy * dy
    if (d2 > R * R) continue
    const x = (((cx + dx) % w.w) + w.w) % w.w, y = (((cy + dy) % w.h) + w.h) % w.h
    fn(y * w.w + x, d2)
  }
}

// ---- Gray–Scott (Pearson, 1993) ----------------------------------------------------
// u' = Du ∇²u − u v² + F (1 − u);  v' = Dv ∇²v + u v² − (F + k) v
export function stepGS(w: World, n: number, F: number, K: number) {
  const W = w.w, H = w.h, FK = F + K
  let u = w.a, v = w.b, u2 = w.a2, v2 = w.b2
  for (let s = 0; s < n; s++) {
    for (let y = 0; y < H; y++) {
      const ro = y * W, rm = (y === 0 ? H - 1 : y - 1) * W, rp = (y === H - 1 ? 0 : y + 1) * W
      for (let x = 0; x < W; x++) {
        const xm = x === 0 ? W - 1 : x - 1, xp = x === W - 1 ? 0 : x + 1
        const i = ro + x, uc = u[i], vc = v[i]
        const lu = u[ro + xm] + u[ro + xp] + u[rm + x] + u[rp + x] - 4 * uc
        const lv = v[ro + xm] + v[ro + xp] + v[rm + x] + v[rp + x] - 4 * vc
        const uvv = uc * vc * vc
        u2[i] = uc + 0.2 * lu - uvv + F * (1 - uc)
        v2[i] = vc + 0.1 * lv + uvv - FK * vc
      }
    }
    let t = u; u = u2; u2 = t
    t = v; v = v2; v2 = t
  }
  w.a = u; w.b = v; w.a2 = u2; w.b2 = v2; w.step += n
}
export function initGS(law: LawId, W: number, H: number, seed: number): World {
  const w = mk(law, W, H), r = mulberry32(seed)
  w.a.fill(1)
  const cx = W >> 1, cy = H >> 1
  for (let y = -6; y < 6; y++) for (let x = -6; x < 6; x++) {
    const i = (cy + y) * W + (cx + x)
    w.a[i] = 0.5; w.b[i] = 0.25
  }
  for (let i = 0; i < w.a.length; i++) { w.a[i] += (r() - 0.5) * 0.02; w.b[i] += (r() - 0.5) * 0.01 }
  return w
}
const brushGS = (w: World, cx: number, cy: number, r: number, tool: Tool) =>
  eachInDisc(w, cx, cy, r, (i) => { if (tool === 1) { w.a[i] = 0.5; w.b[i] = 0.25 } else { w.a[i] = 1; w.b[i] = 0 } })

// ---- Barkley (1991): medio excitable ----------------------------------------------
// u' = u(1−u)(u − (v+b)/a)/ε + D ∇²u;   v' = u − v
const BK = { b: 0.06, eps: 0.02, dt: 0.02, d: 4 /* D/dx², con dx = 0,5 */ }
const barkleyA = (knob: number) => 0.62 + 0.3 * knob
function stepBK(w: World, n: number, knob: number) {
  const W = w.w, H = w.h, a = barkleyA(knob), ia = 1 / a, ie = 1 / BK.eps
  let u = w.a, v = w.b, u2 = w.a2, v2 = w.b2
  const dt = BK.dt, dd = BK.d * dt
  for (let s = 0; s < n; s++) {
    for (let y = 0; y < H; y++) {
      const ro = y * W, rm = (y === 0 ? H - 1 : y - 1) * W, rp = (y === H - 1 ? 0 : y + 1) * W
      for (let x = 0; x < W; x++) {
        const xm = x === 0 ? W - 1 : x - 1, xp = x === W - 1 ? 0 : x + 1
        const i = ro + x, uc = u[i], vc = v[i]
        const lu = u[ro + xm] + u[ro + xp] + u[rm + x] + u[rp + x] - 4 * uc
        const f = ie * uc * (1 - uc) * (uc - (vc + BK.b) * ia)
        u2[i] = uc + dt * f + dd * lu
        v2[i] = vc + dt * (uc - vc)
      }
    }
    let t = u; u = u2; u2 = t
    t = v; v = v2; v2 = t
  }
  w.a = u; w.b = v; w.a2 = u2; w.b2 = v2; w.step += n
}
// campo cruzado: una banda excitada y, a su lado, una región refractaria; el
// extremo libre de la onda se curva en una espiral
function initBK(W: number, H: number): World {
  const w = mk('espirales', W, H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x
    if (x >= (W >> 1) - 3 && x < (W >> 1) + 3 && y >= H >> 1) w.a[i] = 1
    if (x >= (W >> 1) + 3 && x < (W >> 1) + 12 && y >= H >> 1) w.b[i] = 0.9
  }
  return w
}
const brushBK = (w: World, cx: number, cy: number, r: number, tool: Tool) =>
  eachInDisc(w, cx, cy, r, (i) => { if (tool === 1) w.a[i] = 1; else { w.a[i] = 0; w.b[i] = 1 } })

// ---- Ginzburg–Landau compleja ------------------------------------------------------
// A' = A + (1 + i c1) ∇²A − (1 + i c3) |A|² A     (dx = 1)
const cgleC3 = (knob: number) => -0.4 - 0.9 * knob
const CGLE = { c1: 2.0, dt: 0.04 }
function stepCG(w: World, n: number, knob: number) {
  const W = w.w, H = w.h, c1 = CGLE.c1, c3 = cgleC3(knob), dt = CGLE.dt
  let ar = w.a, ai = w.b, br = w.a2, bi = w.b2
  for (let s = 0; s < n; s++) {
    for (let y = 0; y < H; y++) {
      const ro = y * W, rm = (y === 0 ? H - 1 : y - 1) * W, rp = (y === H - 1 ? 0 : y + 1) * W
      for (let x = 0; x < W; x++) {
        const xm = x === 0 ? W - 1 : x - 1, xp = x === W - 1 ? 0 : x + 1
        const i = ro + x, r = ar[i], m = ai[i]
        const lr = ar[ro + xm] + ar[ro + xp] + ar[rm + x] + ar[rp + x] - 4 * r
        const li = ai[ro + xm] + ai[ro + xp] + ai[rm + x] + ai[rp + x] - 4 * m
        const q = r * r + m * m
        br[i] = r + dt * (r + (lr - c1 * li) - q * (r - c3 * m))
        bi[i] = m + dt * (m + (li + c1 * lr) - q * (m + c3 * r))
      }
    }
    let t = ar; ar = br; br = t
    t = ai; ai = bi; bi = t
  }
  w.a = ar; w.b = ai; w.a2 = br; w.b2 = bi; w.step += n
}
function initCG(W: number, H: number, seed: number): World {
  const w = mk('defectos', W, H), r = mulberry32(seed)
  for (let i = 0; i < w.a.length; i++) { w.a[i] = (r() - 0.5) * 0.4; w.b[i] = (r() - 0.5) * 0.4 }
  return w
}
// "sembrar" = par de vórtices (dipolo): cambia la fase por arg((z-z1)/(z-z2)),
// que es continua y vuelve a 0 lejos; se hace con división compleja y sqrt,
// sin trigonometría. "borrar" = relajar hacia la fase uniforme.
// Los núcleos caen en el centro de una plaqueta (coordenadas semienteras) y las
// celdas en coordenadas enteras: ninguna celda coincide con un núcleo, así que
// la división nunca es por cero (un solo NaN se contagia a todo el mundo).
function brushCG(w: World, cx: number, cy: number, r: number, tool: Tool) {
  const s = Math.max(2, Math.round(r * 0.5)), D = s * 8
  const z1x = cx - s + 0.5, z2x = cx + s + 0.5, zy = cy + 0.5
  eachInDisc(w, cx, cy, tool === 1 ? D : r, (i, d2) => {
    const x = i % w.w, y = (i / w.w) | 0
    if (tool === -1) { const k = win(d2, r); w.a[i] += k * (1 - w.a[i]); w.b[i] -= k * w.b[i]; return }
    // unidad de (z−z1)/(z−z2) con z relativo a la celda, respetando el toroide
    let dx = x - cx; if (dx > w.w / 2) dx -= w.w; if (dx < -w.w / 2) dx += w.w
    let dy = y - cy; if (dy > w.h / 2) dy -= w.h; if (dy < -w.h / 2) dy += w.h
    const px = dx + cx, py = dy + cy
    const ax = px - z1x, ay = py - zy, bx = px - z2x, by = py - zy
    const den = bx * bx + by * by
    let ux = (ax * bx + ay * by) / den, uy = (ay * bx - ax * by) / den
    const m = Math.sqrt(ux * ux + uy * uy) || 1
    ux /= m; uy /= m
    const k = win(d2, D)
    let vx = 1 + k * (ux - 1), vy = k * uy
    const mv = Math.sqrt(vx * vx + vy * vy) || 1
    vx /= mv; vy /= mv
    const r0 = w.a[i], i0 = w.b[i]
    w.a[i] = r0 * vx - i0 * vy; w.b[i] = r0 * vy + i0 * vx
  })
}

// ---- campos que se esculpen --------------------------------------------------------
function quantize(src: Float32Array, scale: number, out: Uint8Array) {
  for (let i = 0; i < src.length; i++) out[i] = Math.round(255 * clamp01(src[i] * scale))
}

export const LAWS: Record<LawId, LawSpec> = {
  mitosis: {
    id: 'mitosis', label: 'MITOSIS', tagline: 'Manchas que se dividen',
    equation: 'u′ = Du∇²u − uv² + F(1−u) · v′ = Dv∇²v + uv² − (F+k)v  (F = 0,038)',
    concept: 'Dos sustancias que se difunden y reaccionan. Con la proporción justa, una mancha crece, se estrangula y se divide en dos, y cada hija vuelve a dividirse: un ser sin genes que se reproduce. En el espacio-tiempo, la línea de vida de cada mancha es una columna, y cada división, una bifurcación: la escultura es literalmente un árbol genealógico.',
    credit: 'Gray y Scott (1984), clasificación de Pearson (1993).',
    note: 'Siembra una mancha con el cursor y mira cómo se multiplica. Si dos se acercan demasiado, se fusionan o se apagan.',
    views: [{ id: 'v', label: 'Manchas' }], knobLabel: 'Constante k', knobValue: (k) => 0.0628 + 0.0024 * k,
    defaults: { view: 'v', theta: 0.42, knob: 0.5, shape: 'testigo' }, stride: 30,
    init: (W, H, seed) => initGS('mitosis', W, H, seed),
    step: (w, n, knob) => stepGS(w, n, 0.038, 0.0628 + 0.0024 * knob),
    field: (w, _v, out) => quantize(w.b, 3, out),
    brush: brushGS, seedLabel: ['SEMBRAR', 'BORRAR'],
  },
  coral: {
    id: 'coral', label: 'CORAL', tagline: 'Un frente que se ramifica sin parar',
    equation: 'Gray–Scott con F = 0,0545 y k ≈ 0,062',
    concept: 'El mismo sistema de la mitosis con otras constantes: ya no hay manchas que se dividen sino un frente vivo que avanza, se bifurca y se enrosca sin llegar nunca a un equilibrio. En el espacio-tiempo ese frente es una lámina que se pliega sobre sí misma: un cáliz de coral cuya corteza es la historia completa de una colonia.',
    credit: 'Gray y Scott (1984); constantes de crecimiento de coral difundidas por Karl Sims en su tutorial de reacción-difusión.',
    note: 'Cambiar la constante k es cambiar la física del universo: unas milésimas separan un coral de un desierto de manchas.',
    views: [{ id: 'v', label: 'Láminas' }], knobLabel: 'Constante k', knobValue: (k) => 0.0605 + 0.003 * k,
    defaults: { view: 'v', theta: 0.42, knob: 0.5, shape: 'testigo' }, stride: 24,
    init: (W, H, seed) => initGS('coral', W, H, seed),
    step: (w, n, knob) => stepGS(w, n, 0.0545, 0.0605 + 0.003 * knob),
    field: (w, _v, out) => quantize(w.b, 3, out),
    brush: brushGS, seedLabel: ['SEMBRAR', 'BORRAR'],
  },
  espirales: {
    id: 'espirales', label: 'ESPIRALES', tagline: 'Ondas que giran sobre sí mismas',
    equation: 'u′ = u(1−u)(u − (v+b)/a)/ε + D∇²u · v′ = u − v',
    concept: 'Un medio excitable: cada punto, al ser excitado, dispara a sus vecinos y luego queda refractario un rato, como el tejido del corazón. Una onda cortada curva su extremo y gira para siempre. En el espacio-tiempo, una espiral que gira es una hélice: el tiempo la desenrolla hacia arriba como una escalera de caracol.',
    credit: 'Barkley (1991); la espiral como arritmia, Winfree (1972).',
    note: 'Para crear una espiral: excita una banda con «sembrar» y corta su frente con «borrar» (una zona refractaria). El extremo libre se enrosca.',
    views: [{ id: 'v', label: 'Estela' }, { id: 'u', label: 'Frente' }], knobLabel: 'Excitabilidad a', knobValue: barkleyA,
    defaults: { view: 'v', theta: 0.3, knob: 0.5, shape: 'cupula' }, stride: 4,
    init: (W, H) => initBK(W, H),
    step: stepBK,
    field: (w, view, out) => quantize(view === 'u' ? w.a : w.b, view === 'u' ? 1 : 1.4, out),
    brush: brushBK, seedLabel: ['EXCITAR', 'CORTAR'],
  },
  defectos: {
    id: 'defectos', label: 'DEFECTOS', tagline: 'Vórtices que nacen y mueren en pares',
    equation: 'A′ = A + (1+ic₁)∇²A − (1+ic₃)|A|²A',
    concept: 'Un campo complejo (superfluidos, láseres, superconductores) donde la fase puede dar vueltas alrededor de un punto de amplitud cero: un vórtice. Los vórtices no aparecen solos: nacen y se aniquilan siempre en pares de signo opuesto, y la carga total se conserva. En el espacio-tiempo sus líneas de vida son trenzas.',
    credit: 'Ecuación de Ginzburg–Landau compleja; turbulencia de defectos (Chaté y Manneville).',
    note: '«Sembrar» imprime un par de vórtices. La carga topológica total debe ser 0 en todo instante: la página lo comprueba.',
    views: [{ id: 'n', label: 'Núcleos' }, { id: 'f', label: 'Fases' }], knobLabel: 'Constante c₃', knobValue: cgleC3,
    defaults: { view: 'n', theta: 0.35, knob: 0.3, shape: 'testigo' }, stride: 12,
    init: (W, H, seed) => initCG(W, H, seed),
    step: stepCG,
    field: (w, view, out) => {
      for (let i = 0; i < w.a.length; i++) {
        const r = w.a[i], m = w.b[i]
        out[i] = Math.round(255 * clamp01(view === 'f' ? 0.5 + 0.5 * r : 1 - Math.sqrt(r * r + m * m)))
      }
    },
    brush: brushCG, seedLabel: ['PAR DE VÓRTICES', 'RELAJAR'],
  },
}

// Carga topológica (número de vueltas de la fase) por plaquetas, contando cruces
// del eje real positivo: exacto y sin trigonometría. En un toroide la suma es 0.
export function topologicalCharge(w: World): { plus: number; minus: number; total: number } {
  const W = w.w, H = w.h
  const cross = (ar: number, ai: number, br: number, bi: number) => {
    if (ai <= 0 && bi > 0) return ar * bi - br * ai > 0 ? 1 : 0
    if (ai > 0 && bi <= 0) return ar * bi - br * ai < 0 ? -1 : 0
    return 0
  }
  let plus = 0, minus = 0
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const x1 = x === W - 1 ? 0 : x + 1, y1 = y === H - 1 ? 0 : y + 1
    const i0 = y * W + x, i1 = y * W + x1, i2 = y1 * W + x1, i3 = y1 * W + x
    const c = cross(w.a[i0], w.b[i0], w.a[i1], w.b[i1]) + cross(w.a[i1], w.b[i1], w.a[i2], w.b[i2])
      + cross(w.a[i2], w.b[i2], w.a[i3], w.b[i3]) + cross(w.a[i3], w.b[i3], w.a[i0], w.b[i0])
    if (c > 0) plus += c; else if (c < 0) minus -= c
  }
  return { plus, minus, total: plus - minus }
}
