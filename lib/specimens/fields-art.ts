// Algoritmos de obra: formas que piden más proceso que una ecuación. Cada uno
// busca verse trabajado (detalle fino, ritmo, simetría), no solo ser un sólido.
//
// Determinismo: simulaciones y trayectorias usan solo + - * / (exactos en
// cualquier motor JS); la trigonometría solo aparece al evaluar el campo, no
// dentro de un bucle que la amplifique.

import { mulberry32, range, int, pick, type Rng } from './rng'
import { type Field, type EnvelopeKind, envelope, smax, smin, sdCylinder, sdTorus } from './sdf'
import { densityField, pushSeg, fitSegs, segField, withPlinth, SEG } from './fields-grow'
import type { Params } from './families'

const num = (p: Params, k: string) => p[k] as number
const arr = (p: Params, k: string) => p[k] as number[]
const TAU = Math.PI * 2
const sq = Math.sqrt

function unitVec(r: Rng): [number, number, number] {
  for (;;) {
    const x = r() * 2 - 1, y = r() * 2 - 1, z = r() * 2 - 1
    const l2 = x * x + y * y + z * z
    if (l2 <= 1 && l2 > 0.04) { const l = sq(l2); return [x / l, y / l, z / l] }
  }
}

// ---- 1. Reacción-difusión 3D (Gray–Scott; Prigogine, Turing) -----------------
// Simulación real: dos sustancias que se difunden y reaccionan sobre una grilla
// 3D con paredes sin flujo. Según (F, k) aparecen manchas que se dividen,
// gusanos, laberintos o coral. La superficie es el nivel de la sustancia v.

const GS_REGIMES: [number, number][] = [
  [0.0367, 0.0649], [0.029, 0.057], [0.039, 0.058], [0.025, 0.060],
  [0.0545, 0.062], [0.03, 0.0565], [0.042, 0.0595], [0.034, 0.063],
]

export function sampleReaction(r: Rng, base: Params): Params {
  const [F, k] = pick(r, GS_REGIMES)
  return {
    ...base, simSeed: int(r, 1, 1e9), F: F + range(r, -0.002, 0.002), k: k + range(r, -0.0008, 0.0008),
    steps: int(r, 1300, 1900), seeds: int(r, 3, 9), thr: range(r, 0.12, 0.3), grid: 40,
  }
}

export function reactionField(p: Params): Field {
  const N = num(p, 'grid'), F = num(p, 'F'), K = num(p, 'k'), steps = num(p, 'steps')
  const nSeeds = num(p, 'seeds'), thr = num(p, 'thr')
  const rr = mulberry32(num(p, 'simSeed'))
  const Du = 0.12, Dv = 0.06
  const total = N * N * N
  let u = new Float32Array(total).fill(1), v = new Float32Array(total)
  let u2 = new Float32Array(total), v2 = new Float32Array(total)
  const at = (x: number, y: number, z: number) => (z * N + y) * N + x
  for (let s = 0; s < nSeeds; s++) {
    const cx = N * (0.25 + 0.5 * rr()), cy = N * (0.25 + 0.5 * rr()), cz = N * (0.25 + 0.5 * rr()), rad = 2 + rr() * 3
    for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2 < rad * rad) { u[at(x, y, z)] = 0.5; v[at(x, y, z)] = 0.25 + 0.05 * rr() }
    }
  }
  const prev = new Int32Array(N), next = new Int32Array(N)
  for (let i = 0; i < N; i++) { prev[i] = Math.max(i - 1, 0); next[i] = Math.min(i + 1, N - 1) }
  const FK = F + K
  for (let st = 0; st < steps; st++) {
    for (let z = 0; z < N; z++) {
      const zo = z * N * N, zm = prev[z] * N * N, zp = next[z] * N * N
      for (let y = 0; y < N; y++) {
        const yo = y * N, ym = prev[y] * N, yp = next[y] * N
        for (let x = 0; x < N; x++) {
          const xm = prev[x], xp = next[x]
          const i = zo + yo + x
          const uc = u[i], vc = v[i]
          const lu = u[zo + yo + xm] + u[zo + yo + xp] + u[zo + ym + x] + u[zo + yp + x] + u[zm + yo + x] + u[zp + yo + x] - 6 * uc
          const lv = v[zo + yo + xm] + v[zo + yo + xp] + v[zo + ym + x] + v[zo + yp + x] + v[zm + yo + x] + v[zp + yo + x] - 6 * vc
          const uvv = uc * vc * vc
          u2[i] = uc + Du * lu - uvv + F * (1 - uc)
          v2[i] = vc + Dv * lv + uvv - FK * vc
        }
      }
    }
    let t = u; u = u2; u2 = t
    t = v; v = v2; v2 = t
  }
  const env = p.env as EnvelopeKind
  const f = densityField(v, N, thr, 1.2)
  return (x, y, z) => smax(f(x, y, z), envelope(env, x, y, z), 0.05)
}

// ---- 2. Curva de Hilbert 3D (Hilbert, 1891; Mandelbrot: curvas que llenan) ----
// Una sola línea recorre todo un volumen sin cortarse. Se redondean las
// esquinas (Chaikin), se deforma el cubo y el grosor pulsa a lo largo.

function hilbertPoint(h: number, b: number): [number, number, number] {
  // Skilling (2004): índice -> ejes, enteros puros
  const X = [0, 0, 0]
  for (let j = 3 * b - 1; j >= 0; j--) {
    const bit = Math.floor(h / 2 ** j) & 1
    const pos = 3 * b - 1 - j
    X[pos % 3] |= bit << (b - 1 - Math.floor(pos / 3))
  }
  const NN = 2 << (b - 1)
  let t = X[2] >> 1
  for (let i = 2; i > 0; i--) X[i] ^= X[i - 1]
  X[0] ^= t
  for (let Q = 2; Q !== NN; Q <<= 1) {
    const P = Q - 1
    for (let i = 2; i >= 0; i--) {
      if (X[i] & Q) X[0] ^= P
      else { t = (X[0] ^ X[i]) & P; X[0] ^= t; X[i] ^= t }
    }
  }
  return [X[0], X[1], X[2]]
}

export function sampleHilbert(r: Rng, base: Params): Params {
  return {
    ...base,
    order: pick(r, [2, 3, 3, 3, 3] as const), chaikin: pick(r, [1, 2] as const),
    shape: pick(r, ['cube', 'sphere', 'twist', 'taper', 'torus'] as const),
    tube: range(r, 0.17, 0.3), pulse: r() < 0.6 ? range(r, 0.15, 0.4) : 0, pulseF: range(r, 3, 14),
    twist: range(r, 0.6, 2.4),
  }
}

export function hilbertField(p: Params): Field {
  const b = num(p, 'order'), shape = p.shape as string, tube = num(p, 'tube')
  const pulse = num(p, 'pulse'), pf = num(p, 'pulseF'), tw = num(p, 'twist')
  const n = 8 ** b, side = 2 ** b
  let pts: number[][] = []
  for (let h = 0; h < n; h++) {
    const q = hilbertPoint(h, b)
    pts.push([(q[0] + 0.5) / side * 2 - 1, (q[1] + 0.5) / side * 2 - 1, (q[2] + 0.5) / side * 2 - 1])
  }
  for (let it = 0; it < num(p, 'chaikin'); it++) {
    const out: number[][] = [pts[0]]
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], c = pts[i + 1]
      out.push([a[0] * 0.75 + c[0] * 0.25, a[1] * 0.75 + c[1] * 0.25, a[2] * 0.75 + c[2] * 0.25],
        [a[0] * 0.25 + c[0] * 0.75, a[1] * 0.25 + c[1] * 0.75, a[2] * 0.25 + c[2] * 0.75])
    }
    out.push(pts[pts.length - 1]); pts = out
  }
  const warp = (q: number[]): number[] => {
    const [x, y, z] = q
    switch (shape) {
      case 'sphere': {
        // cubo -> esfera (mapeo que conserva la vecindad)
        const x2 = x * x, y2 = y * y, z2 = z * z
        return [x * sq(Math.max(0, 1 - y2 / 2 - z2 / 2 + (y2 * z2) / 3)), y * sq(Math.max(0, 1 - z2 / 2 - x2 / 2 + (z2 * x2) / 3)), z * sq(Math.max(0, 1 - x2 / 2 - y2 / 2 + (x2 * y2) / 3))]
      }
      case 'twist': { const a = tw * z, c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c, z] }
      case 'taper': { const k = 1 - 0.55 * (z + 1) / 2; return [x * k, y * k, z] }
      case 'torus': {
        const th = (x + 1) * Math.PI * 0.95, rr = 0.55 + 0.32 * y
        return [rr * Math.cos(th), rr * Math.sin(th), 0.4 * z]
      }
      default: return q
    }
  }
  const W = pts.map(warp)
  const spacing = (2 / side) * (shape === 'cube' ? 1 : 0.8)
  const segs: number[] = []
  for (let i = 1; i < W.length; i++) {
    const t = i / W.length
    const rad = spacing * tube * (1 + pulse * Math.sin(t * pf * TAU))
    pushSeg(segs, W[i - 1], W[i], rad)
  }
  const fit = fitSegs(segs, 0.88)
  return withPlinth(segField(fit, 0.02), fit, 0.45)
}

// ---- 3. Filotaxis (Vogel, 1979): escamas en ángulo áureo ----------------------
// Alcachofa, piña, protea, erizo: cada escama es una espiga curva que sale en
// el ángulo áureo (137,5°) y crece con la distancia al centro.

export function samplePhyllotaxis(r: Rng, base: Params): Params {
  return {
    ...base,
    profile: pick(r, ['sphere', 'cone', 'urn', 'disk', 'dome'] as const),
    n: int(r, 130, 320), angle: 2.39996323 + (r() < 0.2 ? range(r, -0.04, 0.04) : 0),
    tilt: range(r, 0.55, 1.3), len: range(r, 0.3, 0.55), grow: range(r, 0.4, 1.2),
    bend: range(r, 0.2, 0.7), width: range(r, 0.085, 0.15), core: range(r, 0.32, 0.5),
    spine: r() < 0.15 ? 1 : 0,
  }
}

export function phyllotaxisField(p: Params): Field {
  const profile = p.profile as string, n = num(p, 'n'), ang = num(p, 'angle')
  const tilt = num(p, 'tilt'), len0 = num(p, 'len'), grow = num(p, 'grow'), bend = num(p, 'bend')
  const w0 = num(p, 'width'), coreR = num(p, 'core'), spine = num(p, 'spine') === 1
  const segs: number[] = []
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, th = i * ang
    let P: number[], N: number[], U: number[]
    const cth = Math.cos(th), sth = Math.sin(th)
    if (profile === 'sphere' || profile === 'dome') {
      const cz = profile === 'sphere' ? 1 - 2 * t : 1 - t
      const sz = sq(Math.max(0, 1 - cz * cz))
      P = [sz * cth * 0.62, sz * sth * 0.62, cz * 0.62]
      N = [sz * cth, sz * sth, cz]
      U = [-cz * cth, -cz * sth, sz]
    } else if (profile === 'cone' || profile === 'urn') {
      const z = -0.7 + 1.4 * (1 - t)
      const rr = profile === 'cone' ? 0.62 * (1 - t) + 0.08 : 0.2 + 0.42 * Math.sin(Math.PI * (1 - t) * 0.9 + 0.2)
      P = [rr * cth, rr * sth, z]
      const nn = sq(1 + 0.3)
      N = [cth / nn, sth / nn, 0.5 / nn]; U = [0, 0, 1]
    } else {
      const rr = 0.78 * sq(t), z = 0.25 * rr * rr - 0.2
      P = [rr * cth, rr * sth, z]
      N = [0, 0, 1]; U = [cth, sth, 0]
    }
    const size = 0.45 + grow * (profile === 'cone' || profile === 'urn' ? 1 - t : t) + 0.3
    const L = len0 * size, W = w0 * (0.65 + 0.5 * size)
    // dirección: mezcla normal / tangente hacia arriba (las escamas se montan)
    let d = [N[0] * (1 - tilt * 0.5) + U[0] * tilt, N[1] * (1 - tilt * 0.5) + U[1] * tilt, N[2] * (1 - tilt * 0.5) + U[2] * tilt]
    const dl = sq(d[0] ** 2 + d[1] ** 2 + d[2] ** 2) || 1
    d = [d[0] / dl, d[1] / dl, d[2] / dl]
    let cur = P
    for (let s = 0; s < 3; s++) {
      const f = (s + 1) / 3
      const nd = [d[0] + (spine ? 0 : (U[0] - N[0]) * bend * f), d[1] + (spine ? 0 : (U[1] - N[1]) * bend * f), d[2] + (spine ? 0 : (U[2] - N[2]) * bend * f)]
      const nl = sq(nd[0] ** 2 + nd[1] ** 2 + nd[2] ** 2) || 1
      const nxt = [cur[0] + (nd[0] / nl) * L / 3, cur[1] + (nd[1] / nl) * L / 3, cur[2] + (nd[2] / nl) * L / 3]
      pushSeg(segs, cur, nxt, Math.max(0.02, W * (1 - 0.62 * f * (spine ? 0.9 : 1))))
      cur = nxt
    }
  }
  const fit = fitSegs(segs, 0.9)
  const f = segField(fit, 0.03)
  // núcleo que une las escamas
  const R = coreR * 0.62
  return (x, y, z) => smin(f(x, y, z), Math.hypot(x, y, z * (profile === 'disk' ? 3 : 1)) - R, 0.06)
}

// ---- 4. Lámina hiperbólica con volantes ---------------------------------------
// Una lámina cuyo borde crece más rápido que su centro y se pliega en ondas
// cada vez más finas, como lechuga, coral o flor. Varias láminas giradas forman
// una rosa. Derivada analítica para que el espesor sea parejo en las pendientes.

export function sampleRuffle(r: Rng, base: Params): Params {
  return {
    ...base,
    lobes: int(r, 5, 11), octaves: 3, amp: range(r, 0.28, 0.6),
    pw: range(r, 1.5, 2.4), spiral: range(r, -2.2, 2.2), cup: range(r, -0.5, 0.9),
    R: range(r, 0.62, 0.84), t: range(r, 0.026, 0.04), layers: int(r, 1, 4), dz: range(r, 0.04, 0.075),
    phase: range(r, 0, 6.28),
  }
}

export function ruffleField(p: Params): Field {
  const m = num(p, 'lobes'), oct = num(p, 'octaves'), amp = num(p, 'amp'), pw = num(p, 'pw')
  const sp = num(p, 'spiral'), cup = num(p, 'cup'), R0 = num(p, 'R'), t = num(p, 't')
  const layers = num(p, 'layers'), dz = num(p, 'dz'), ph = num(p, 'phase')
  const env = p.env as EnvelopeKind
  const sheet = (x: number, y: number, z: number, R: number, shift: number): number => {
    const r = Math.hypot(x, y) + 1e-9, th = Math.atan2(y, x)
    const rp = Math.pow(r, pw)
    let h = cup * r * r, hr = 2 * cup * r, ht = 0
    for (let o = 0; o < oct; o++) {
      const w = 1 / 2 ** o, k = m * 2 ** o, ph2 = k * th + sp * 3 * (o + 1) * r + ph + shift * (o + 1)
      const s = Math.sin(ph2), c = Math.cos(ph2)
      h += amp * rp * w * s
      hr += amp * w * (pw * Math.pow(r, pw - 1) * s + rp * c * sp * 3 * (o + 1))
      ht += amp * rp * w * c * k
    }
    const g2 = 1 + hr * hr + (ht / r) * (ht / r)
    const d = (z - h) / sq(g2)
    return smax(Math.abs(d) - t, r - R, 0.025)
  }
  return (x, y, z) => {
    let d = 1e9
    for (let i = 0; i < layers; i++) d = smin(d, sheet(x, y, z - 0.3 + i * dz, R0 * (1 - 0.17 * i), i * 0.9), 0.03)
    if (layers > 1) d = smin(d, sdCylinder(x, y, z - 0.3 - (layers - 1) * dz * 0.5 + 0.05, 0.07, 0.07 + layers * dz * 0.5), 0.04)
    return smax(d, envelope(env, x, y, z), 0.04)
  }
}

// ---- 5. Mandelbox (Tom Lowe, 2010) ---------------------------------------------

export function sampleMandelbox(r: Rng, base: Params): Params {
  const scale = pick(r, [-2.2, -1.8, -1.5, 1.8, 2.0, 2.3] as const) + range(r, -0.1, 0.1)
  return {
    ...base,
    scale, iters: int(r, 6, 10), minR: range(r, 0.3, 0.7), fixR: range(r, 0.9, 1.3),
    fold: range(r, 0.85, 1.15), zoom: (Math.abs(scale) > 1.9 ? range(r, 3.6, 5) : range(r, 2.4, 3.6)),
    grow: range(r, 0.002, 0.012), ax: range(r, 0, 6.28), ay: range(r, 0, 6.28),
  }
}

export function mandelboxField(p: Params): Field {
  const sc = num(p, 'scale'), it = num(p, 'iters'), mr2 = num(p, 'minR') ** 2, fr2 = num(p, 'fixR') ** 2
  const fold = num(p, 'fold'), zoom = num(p, 'zoom'), grow = num(p, 'grow')
  const cx = Math.cos(num(p, 'ax')), sx = Math.sin(num(p, 'ax')), cy = Math.cos(num(p, 'ay')), sy = Math.sin(num(p, 'ay'))
  const env = p.env as EnvelopeKind
  return (px, py, pz) => {
    let x0 = px * cy + pz * sy, z0 = -px * sy + pz * cy, y0 = py
    const y1 = y0 * cx - z0 * sx; z0 = y0 * sx + z0 * cx; y0 = y1
    x0 *= zoom; y0 *= zoom; z0 *= zoom
    let x = x0, y = y0, z = z0, dr = 1
    for (let i = 0; i < it; i++) {
      x = Math.max(-fold, Math.min(fold, x)) * 2 - x
      y = Math.max(-fold, Math.min(fold, y)) * 2 - y
      z = Math.max(-fold, Math.min(fold, z)) * 2 - z
      const r2 = x * x + y * y + z * z
      if (r2 < mr2) { const k = fr2 / mr2; x *= k; y *= k; z *= k; dr *= k }
      else if (r2 < fr2) { const k = fr2 / r2; x *= k; y *= k; z *= k; dr *= k }
      x = sc * x + x0; y = sc * y + y0; z = sc * z + z0
      dr = dr * Math.abs(sc) + 1
    }
    const d = (Math.hypot(x, y, z) / Math.abs(dr)) / zoom - grow
    return smax(d, envelope(env, px, py, pz), 0.04)
  }
}

// ---- 6. Espuma apoloniana (inversiones en esferas) -----------------------------

export function sampleApollonian(r: Rng, base: Params): Params {
  return {
    ...base,
    iters: int(r, 5, 8), s: range(r, 0.95, 1.35), zoom: range(r, 0.9, 1.8),
    off: [range(r, -0.5, 0.5), range(r, -0.5, 0.5), range(r, -0.5, 0.5)],
    kind: pick(r, ['plane', 'sphere', 'tube'] as const), th: range(r, 0.012, 0.03),
    ax: range(r, 0, 6.28), ay: range(r, 0, 6.28),
  }
}

export function apollonianField(p: Params): Field {
  const it = num(p, 'iters'), s = num(p, 's'), zoom = num(p, 'zoom'), off = arr(p, 'off'), kind = p.kind as string, th = num(p, 'th')
  const cx = Math.cos(num(p, 'ax')), sx = Math.sin(num(p, 'ax')), cy = Math.cos(num(p, 'ay')), sy = Math.sin(num(p, 'ay'))
  const env = p.env as EnvelopeKind
  return (px, py, pz) => {
    let x = px * cy + pz * sy, z = -px * sy + pz * cy, y = py
    const y1 = y * cx - z * sx; z = y * sx + z * cx; y = y1
    x = x * zoom + off[0]; y = y * zoom + off[1]; z = z * zoom + off[2]
    let scale = 1
    for (let i = 0; i < it; i++) {
      let t = 0.5 * x + 0.5; x = -1 + 2 * (t - Math.floor(t))
      t = 0.5 * y + 0.5; y = -1 + 2 * (t - Math.floor(t))
      t = 0.5 * z + 0.5; z = -1 + 2 * (t - Math.floor(t))
      const k = s / (x * x + y * y + z * z + 1e-9)
      x *= k; y *= k; z *= k; scale *= k
    }
    const d0 = kind === 'plane' ? 0.25 * Math.abs(y) : kind === 'sphere' ? 0.5 * (Math.hypot(x, y, z) - 0.9) : 0.4 * (Math.hypot(x, z) - 0.25)
    const d = d0 / scale / zoom - th
    return smax(d, envelope(env, px, py, pz), 0.04)
  }
}

// ---- 7. Haces de líneas de flujo (campo solenoidal) ----------------------------
// Cientos de líneas nacen de un disco y siguen un campo sin divergencia
// (rotor de ondas) con una corriente ascendente y un giro: fibras que se
// trenzan como una llama, una fuente o una medusa.

export function sampleFlow(r: Rng, base: Params): Params {
  const n = int(r, 6, 11), waves: number[] = []
  for (let i = 0; i < n; i++) {
    const k = unitVec(r), a = unitVec(r), kk = Math.PI * range(r, 0.8, 2.4)
    // rotor de a·sin(k·p + φ): (k × a) cos(k·p + φ)
    waves.push(k[0] * kk, k[1] * kk, k[2] * kk, k[1] * a[2] - k[2] * a[1], k[2] * a[0] - k[0] * a[2], k[0] * a[1] - k[1] * a[0], range(r, 0, 6.28))
  }
  return {
    ...base, waves, flowSeed: int(r, 1, 1e9), lines: int(r, 70, 150), steps: int(r, 60, 96), h: range(r, 0.012, 0.02),
    drift: range(r, 0.5, 1.4), swirl: range(r, -0.9, 0.9), turb: range(r, 0.04, 0.12),
    disc: range(r, 0.16, 0.5), tube: range(r, 0.018, 0.03),
  }
}

export function flowField(p: Params): Field {
  const w = arr(p, 'waves'), nW = w.length / 7
  const rr = mulberry32(num(p, 'flowSeed'))
  const nL = num(p, 'lines'), steps = num(p, 'steps'), h = num(p, 'h')
  const drift = num(p, 'drift'), swirl = num(p, 'swirl'), turb = num(p, 'turb'), disc = num(p, 'disc'), tube = num(p, 'tube')
  const vel = (x: number, y: number, z: number): [number, number, number] => {
    let vx = -y * swirl, vy = x * swirl, vz = drift
    for (let i = 0; i < nW; i++) {
      const o = i * 7, c = Math.cos(w[o] * x + w[o + 1] * y + w[o + 2] * z + w[o + 6])
      vx += turb * w[o + 3] * c * 4; vy += turb * w[o + 4] * c * 4; vz += turb * w[o + 5] * c * 4
    }
    return [vx, vy, vz]
  }
  const segs: number[] = []
  for (let l = 0; l < nL; l++) {
    const rho = disc * sq(rr()), a = rr() * TAU
    let x = rho * Math.cos(a), y = rho * Math.sin(a), z = -0.8
    const rad0 = tube * (0.8 + 0.5 * rr())
    let prev = [x, y, z]
    for (let s = 0; s < steps; s++) {
      const k1 = vel(x, y, z)
      const k2 = vel(x + k1[0] * h * 0.5, y + k1[1] * h * 0.5, z + k1[2] * h * 0.5)
      x += k2[0] * h; y += k2[1] * h; z += k2[2] * h
      if (x * x + y * y + z * z > 0.84 || z > 0.85) break
      if (s % 2 === 1) {
        pushSeg(segs, prev, [x, y, z], rad0 * (1 - 0.45 * (s / steps)))
        prev = [x, y, z]
      }
    }
  }
  const f = segField(segs, 0.02)
  return withPlinth(f, segs, disc + 0.08)
}

// ---- 8. Jarrón / lámpara paramétrico -----------------------------------------
// Perfil de revolución con vientre y cuello, ornamentos por franjas (estrías con
// giro, costillas), borde festoneado, pie y hasta dos capas de calado en
// franjas de altura distintas: rombos, círculos, ranuras, panal, giroide o
// espuma de Voronoi.

const smooth = (a: number, b: number, v: number) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t) }
const win = (z: number, z0: number, z1: number) => smooth(z0 - 0.05, z0 + 0.05, z) * (1 - smooth(z1 - 0.05, z1 + 0.05, z))
const fract = (v: number) => v - Math.floor(v)

export function sampleVessel(r: Rng, base: Params): Params {
  const bumps: number[] = []
  for (let i = 0; i < int(r, 2, 4); i++) bumps.push(range(r, -0.7, 0.7), range(r, 0.18, 0.55), range(r, -0.28, 0.32))
  // ornamentos radiales: [tipo (0 estría, 1 costilla), n, amp, z0, z1, giro]
  const mods: number[] = []
  for (let i = 0, nm = int(r, 1, 3); i < nm; i++) {
    const z0 = range(r, -0.7, 0.2)
    mods.push(pick(r, [0, 0, 1] as const), int(r, 5, 16), range(r, 0.03, 0.11), z0, z0 + range(r, 0.4, 1.4), range(r, -3, 3))
  }
  // calados: [tipo, n, k, z0, z1, umbral, giro]
  const pats: number[] = []
  const nPat = pick(r, [0, 1, 1, 2] as const)
  for (let i = 0; i < nPat; i++) {
    const z0 = i === 0 ? range(r, -0.6, -0.1) : range(r, -0.1, 0.35)
    pats.push(int(r, 0, 5), int(r, 6, 18), range(r, 5, 13), z0, z0 + range(r, 0.35, 0.9), range(r, 0.1, 0.55), range(r, -2, 2))
  }
  return {
    ...base, zCut: -2, fold: 1, // el jarrón tiene su propio fondo y ya es de revolución
    r0: range(r, 0.26, 0.5), bumps, mods, pats, wall: range(r, 0.04, 0.062),
    scal: r() < 0.5 ? int(r, 5, 14) : 0, scalH: range(r, 0.04, 0.13),
    bead: r() < 0.6 ? 1 : 0, foot: r() < 0.6 ? 1 : 0, vh: range(r, 0.78, 0.9), hashSeed: int(r, 1, 1e6),
  }
}

export function vesselField(p: Params): Field {
  const r0 = num(p, 'r0'), bumps = arr(p, 'bumps'), mods = arr(p, 'mods'), pats = arr(p, 'pats')
  const wall = num(p, 'wall'), vh = num(p, 'vh'), scal = num(p, 'scal'), scalH = num(p, 'scalH')
  const bead = num(p, 'bead') === 1, foot = num(p, 'foot') === 1, hs = num(p, 'hashSeed')
  const prof = (z: number) => {
    let rr = r0
    for (let i = 0; i < bumps.length; i += 3) rr += bumps[i + 2] * Math.exp(-((z - bumps[i]) ** 2) / (2 * bumps[i + 1] ** 2) * 4)
    return Math.max(0.16, Math.min(0.78, rr))
  }
  const hash = (a: number, b: number, c: number) => {
    let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 1274126177) ^ Math.imul(hs, 2246822519)
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
  }
  const mask = (kind: number, n: number, k: number, tw: number, x: number, y: number, z: number, th: number): number => {
    switch (kind) {
      case 0: return 0.5 * (Math.cos(n * th + k * z) + Math.cos(n * th - k * z))             // rombos
      case 1: { // círculos en filas desfasadas
        const v = (k * z) / TAU, u = (n * th) / TAU + 0.5 * Math.floor(v)
        return 1 - 2.2 * Math.hypot((fract(u) - 0.5) * 1.1, fract(v) - 0.5)
      }
      case 2: return Math.cos(n * th + tw * z) * 1.15 - 0.15                                  // ranuras con giro
      case 3: { // panal
        const a = n * th, b = (n * 0.5) * th, c = k * z * 0.866
        return Math.min(1, (Math.cos(a) + Math.cos(b + c) + Math.cos(b - c)) / 3 * 1.6)
      }
      case 4: return (Math.sin(k * x) * Math.cos(k * y) + Math.sin(k * y) * Math.cos(k * z) + Math.sin(k * z) * Math.cos(k * x)) / 1.5
      default: { // espuma de Voronoi
        const s = k * 0.55, fx = x * s + 50, fy = y * s + 50, fz = z * s + 50
        const ix = Math.floor(fx), iy = Math.floor(fy), iz = Math.floor(fz)
        let f1 = 9, f2 = 9
        for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const cx = ix + dx, cy = iy + dy, cz = iz + dz
          const d = Math.hypot(cx + hash(cx, cy, cz) - fx, cy + hash(cx, cy, cz + 7) - fy, cz + hash(cx, cy, cz + 13) - fz)
          if (d < f1) { f2 = f1; f1 = d } else if (d < f2) f2 = d
        }
        return 1 - 1.6 * (f2 - f1)
      }
    }
  }
  return (x, y, z) => {
    const rho = Math.hypot(x, y), th = Math.atan2(y, x)
    let R = prof(z)
    for (let i = 0; i < mods.length; i += 6) {
      const w = win(z, mods[i + 3], mods[i + 4])
      if (!w) continue
      R += mods[i] === 0 ? R * mods[i + 2] * w * Math.cos(mods[i + 1] * th + mods[i + 5] * z) : mods[i + 2] * 0.5 * w * Math.cos(mods[i + 1] * z * 5)
    }
    let shell = Math.abs(rho - R) - wall
    for (let i = 0; i < pats.length; i += 7) {
      const w = win(z, pats[i + 3], pats[i + 4])
      if (w < 0.01) continue
      const m = mask(pats[i], pats[i + 1], pats[i + 2], pats[i + 6], x, y, z, th)
      shell = smax(shell, (m - pats[i + 5]) * 0.1 - (1 - w) * 0.4, 0.015)
    }
    let d = shell
    const top = scal ? vh - scalH * (0.5 + 0.5 * Math.cos(scal * th)) : vh
    d = smax(d, z - top, 0.015)
    d = smin(d, smax(rho - prof(-0.78) - wall, Math.abs(z + 0.78) - 0.05, 0.02), 0.03)
    if (bead) d = smin(d, sdTorus(x, y, z - vh, prof(vh) + 0.01, wall * 1.3), 0.03)
    if (foot) d = smin(d, sdTorus(x, y, z + 0.78, prof(-0.78) + 0.01, wall * 1.2), 0.03)
    return smax(d, -(z + 0.84), 0.02)
  }
}

// ---- 9. Filigrana (orbes y toros calados con simetría de mandala) ---------------
// Una cáscara fina (esfera, huevo, domo o toro) calada por un patrón de ondas
// con simetría de orden n alrededor del eje y bandas de latitud: encaje de
// luz y sombra, como un farol de filigrana. Los polos quedan macizos.

export function sampleFiligree(r: Rng, base: Params): Params {
  const shape = pick(r, ['sphere', 'egg', 'dome', 'torus'] as const)
  const terms: number[] = []
  for (let i = 0, nt = int(r, 2, 4); i < nt; i++) terms.push(range(r, 0.5, 1), int(r, 1, 3), int(r, 1, 6), range(r, 0, 6.28))
  return {
    ...base, zCut: shape === 'torus' ? -2 : range(r, -0.78, -0.62), fold: 1,
    shape, n: pick(r, [4, 5, 6, 7, 8, 9, 10, 12] as const), terms, wall: range(r, 0.032, 0.05),
    thr: range(r, 0.02, 0.45), R: range(r, 0.72, 0.84), bead: r() < 0.7 ? 1 : 0,
    egg: range(r, 0.1, 0.22), tube: range(r, 0.26, 0.36),
  }
}

export function filigreeField(p: Params): Field {
  const shape = p.shape as string, n = num(p, 'n'), terms = arr(p, 'terms'), wall = num(p, 'wall')
  const thr = num(p, 'thr'), R = num(p, 'R'), bead = num(p, 'bead') === 1, egg = num(p, 'egg'), tube = num(p, 'tube')
  const amps = terms.reduce((a, _v, i) => (i % 4 === 0 ? a + terms[i] : a), 0)
  const pat = (th: number, ph: number) => {
    let m = 0
    for (let i = 0; i < terms.length; i += 4) m += terms[i] * Math.cos(n * terms[i + 1] * th) * Math.cos(terms[i + 2] * ph + terms[i + 3])
    return m / amps
  }
  return (x, y, z) => {
    const th = Math.atan2(y, x)
    if (shape === 'torus') {
      const q = Math.hypot(x, y) - R * 0.62, ps = Math.atan2(z, q), len = Math.hypot(q, z)
      const shell = Math.abs(len - tube * 2) - wall
      const m = pat(th, ps * 1.0)
      return smax(shell, (m - thr) * 0.1, 0.015)
    }
    const rho = Math.hypot(x, y, z) + 1e-9, ph = Math.acos(Math.max(-1, Math.min(1, z / rho)))
    const Rs = shape === 'egg' ? R * (1 + egg * (z / rho)) : R
    const shell = Math.abs(rho - Rs) - wall
    const sinPh = Math.sin(ph)
    const m = pat(th, ph) - 1.8 * (1 - smooth(0.0, 0.32, sinPh))   // polos macizos
    let d = smax(shell, (m - thr) * 0.1, 0.015)
    if (bead) d = smin(d, sdTorus(x, y, z, Rs * 0.995, wall * 1.35), 0.025)       // aro ecuatorial
    if (shape === 'dome') d = smax(d, -z - 0.02, 0.02)
    return d
  }
}
