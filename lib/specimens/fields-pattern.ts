// Algoritmos de patrón y de estructura: la forma sale de un campo de ondas,
// de una regla local iterada, de pliegues fractales o de una membrana con
// organelos. Cada uno atado a un autor ya presente en /knowledge.

import { mulberry32, range, int, pick, type Rng } from './rng'
import { type Field, type EnvelopeKind, envelope, smax, smin, sdCapsule, sdSphere } from './sdf'
import { densityField, pushSeg, SEG } from './fields-grow'
import type { Params } from './families'

const num = (p: Params, k: string) => p[k] as number
const arr = (p: Params, k: string) => p[k] as number[]
const sq = Math.sqrt

function unitVec(r: Rng): [number, number, number] {
  for (;;) {
    const x = r() * 2 - 1, y = r() * 2 - 1, z = r() * 2 - 1
    const l2 = x * x + y * y + z * z
    if (l2 <= 1 && l2 > 0.04) { const l = sq(l2); return [x / l, y / l, z / l] }
  }
}

// ---- 1. Estructura disipativa tipo Turing (Prigogine, Turing) ----------------
// No simula reacción-difusión completa: superpone ondas planas de igual longitud
// con fases al azar (la solución lineal de Swift–Hohenberg). La superficie es
// la frontera entre las dos fases del patrón.

export function sampleTuring(r: Rng, base: Params): Params {
  const n = int(r, 7, 15)
  const waves: number[] = []
  for (let i = 0; i < n; i++) { const [x, y, z] = unitVec(r); waves.push(x, y, z, range(r, 0, 6.2832)) }
  return {
    ...base, waves, k0: Math.PI * range(r, 1.5, 3.4),
    bias: range(r, -0.5, 0.5), t: range(r, 0.3, 0.6),
    stretch: range(r, 0.65, 1.5), radial: pick(r, [0, 0, 0.6, 1.1] as const),
  }
}

export function turingField(p: Params): Field {
  const w = arr(p, 'waves'), n = w.length / 4
  const k0 = num(p, 'k0'), bias = num(p, 'bias'), t = num(p, 't'), st = num(p, 'stretch'), rad = num(p, 'radial')
  const norm = 1 / sq(n / 2 + rad * rad / 2)
  const env = p.env as EnvelopeKind
  return (x, y, z) => {
    const zz = z * st
    let g = 0
    for (let i = 0; i < w.length; i += 4) g += Math.cos(k0 * (w[i] * x + w[i + 1] * y + w[i + 2] * zz) + w[i + 3])
    if (rad) g += rad * Math.cos(k0 * 1.15 * Math.hypot(x, y, zz))
    g *= norm
    const sheet = (Math.abs(g - bias) - t) / (k0 * 0.85)
    return smax(sheet, envelope(env, x, y, z), 0.05)
  }
}

// ---- 2. Autómata celular 3D (Kauffman: orden gratis) -------------------------
// Semilla simétrica + regla de nacimiento/supervivencia en la vecindad de 26.
// La simetría de la semilla se conserva (la regla es isótropa): cristales,
// no ruido. Si la regla se extingue o se satura se re-sortea, de forma
// determinista.

function hashInt(a: number, b: number, c: number, s: number) {
  let h = Math.imul(a + 101, 374761393) ^ Math.imul(b + 211, 668265263) ^ Math.imul(c + 307, 1274126177) ^ Math.imul(s, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function sampleAutomaton(r: Rng, base: Params): Params {
  return {
    ...base,
    simSeed: int(r, 1, 1e9), steps: int(r, 5, 12), fill: range(r, 0.28, 0.55),
    mirror: pick(r, [2, 3, 3] as const), blur: 1, thr: range(r, 0.25, 0.45),
    radius: range(r, 7, 10),
  }
}

export function automatonField(p: Params): Field {
  const N = 28, C = (N - 1) / 2
  const seed = num(p, 'simSeed'), steps = num(p, 'steps'), fill = num(p, 'fill')
  const mirror = num(p, 'mirror'), blur = num(p, 'blur'), thr = num(p, 'thr'), rad = num(p, 'radius')
  const rr = mulberry32(seed ^ 0x5bd1e995)
  const idx = (x: number, y: number, z: number) => (z * N + y) * N + x

  const run = (sLo: number, sHi: number, bLo: number, bHi: number) => {
    let cur = new Uint8Array(N * N * N), nxt = new Uint8Array(N * N * N)
    for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = x - C, dy = y - C, dz = z - C
      if (dx * dx + dy * dy + dz * dz > rad * rad) continue
      const ax = Math.abs(dx), ay = Math.abs(dy), az = mirror >= 3 ? Math.abs(dz) : dz
      cur[idx(x, y, z)] = hashInt(Math.round(ax * 2), Math.round(ay * 2), Math.round(az * 2), seed) < fill ? 1 : 0
    }
    for (let s = 0; s < steps; s++) {
      for (let z = 1; z < N - 1; z++) for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
        let c = 0
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let d = -1; d <= 1; d++) {
          if (a || b || d) c += cur[idx(x + d, y + b, z + a)]
        }
        const i = idx(x, y, z)
        nxt[i] = cur[i] ? (c >= sLo && c <= sHi ? 1 : 0) : (c >= bLo && c <= bHi ? 1 : 0)
      }
      const t = cur; cur = nxt; nxt = t; nxt.fill(0)
    }
    let pop = 0, tot = 0
    for (let i = 0; i < cur.length; i++) pop += cur[i]
    tot = (4 / 3) * Math.PI * rad ** 3
    return { cur, frac: pop / tot }
  }

  // las ventanas estrechas casi siempre se extinguen; las anchas sobreviven un
  // tercio de las veces (medido), así que se sortea entre esas
  let best = run(4, 5, 4, 4)
  for (let tries = 0; tries < 24; tries++) {
    const sLo = int(rr, 3, 6), sHi = sLo + int(rr, 1, 9), bLo = int(rr, 4, 12), bHi = bLo + int(rr, 0, 4)
    const res = run(sLo, sHi, bLo, bHi)
    if (res.frac > 0.08 && res.frac < 0.4) { best = res; break }
  }
  // desenfoque de caja para pasar de celdas a campo suave
  let g = new Float32Array(N * N * N)
  for (let i = 0; i < g.length; i++) g[i] = best.cur[i]
  for (let pass = 0; pass < blur; pass++) {
    const o = new Float32Array(g.length)
    for (let z = 1; z < N - 1; z++) for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
      let s = 0
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let d = -1; d <= 1; d++) s += g[idx(x + d, y + b, z + a)]
      o[idx(x, y, z)] = s / 27
    }
    g = o
  }
  const f = densityField(g, N, thr, 0.35)
  const env = p.env as EnvelopeKind
  return (x, y, z) => smax(f(x, y, z), envelope(env, x, y, z), 0.05)
}

// ---- 3. IFS caleidoscópico (parentesco con Mandelbrot: autosimilitud) --------

export function sampleKIFS(r: Rng, base: Params): Params {
  return {
    ...base,
    variant: pick(r, ['menger', 'sierpinski', 'mixed'] as const),
    iters: int(r, 4, 6), scale: range(r, 1.85, 2.5),
    off: [range(r, 0.75, 1.25), range(r, 0.75, 1.25), range(r, 0.75, 1.25)],
    rx: range(r, -0.45, 0.45), rz: range(r, -0.6, 0.6),
    bound: range(r, 0.9, 1.6), grow: range(r, 0.008, 0.03), zoom: range(r, 1.1, 1.5),
  }
}

export function kifsField(p: Params): Field {
  const variant = p.variant as string
  const it = num(p, 'iters'), sc = num(p, 'scale'), off = arr(p, 'off')
  const cx = Math.cos(num(p, 'rx')), sx = Math.sin(num(p, 'rx')), cz = Math.cos(num(p, 'rz')), sz = Math.sin(num(p, 'rz'))
  const bound = num(p, 'bound'), grow = num(p, 'grow'), zoom = num(p, 'zoom')
  const o = sc - 1
  const env = p.env as EnvelopeKind
  return (px, py, pz) => {
    let x = px * zoom, y = py * zoom, z = pz * zoom, s = 1
    for (let i = 0; i < it; i++) {
      if (variant === 'sierpinski' || (variant === 'mixed' && i % 2 === 1)) {
        if (x + y < 0) { const t = -y; y = -x; x = t }
        if (x + z < 0) { const t = -z; z = -x; x = t }
        if (y + z < 0) { const t = -z; z = -y; y = t }
      } else {
        x = Math.abs(x); y = Math.abs(y); z = Math.abs(z)
        if (x < y) { const t = x; x = y; y = t }
        if (x < z) { const t = x; x = z; z = t }
        if (y < z) { const t = y; y = z; z = t }
      }
      // rotación fija de la receta (rompe el aspecto de cubo)
      const x1 = x * cz - y * sz, y1 = x * sz + y * cz
      const y2 = y1 * cx - z * sx, z2 = y1 * sx + z * cx
      x = x1; y = y2; z = z2
      x = x * sc - off[0] * o; y = y * sc - off[1] * o; z = z * sc - off[2] * o
      if (z < -0.5 * off[2] * o) z += off[2] * o
      s *= sc
    }
    const d = (Math.hypot(x, y, z) - bound) / s / zoom - grow
    return smax(d, envelope(env, px, py, pz), 0.04)
  }
}

// ---- 4. Célula autopoiética (Maturana & Varela) ------------------------------
// Metáfora geométrica, no una simulación de autopoiesis: una membrana que
// encierra, con poros, y un núcleo sostenido por espigas de citoesqueleto.

export function sampleAutopoiesis(r: Rng, base: Params): Params {
  const terms: number[] = []
  for (let i = 0; i < int(r, 2, 4); i++) terms.push(range(r, 0.03, 0.1), int(r, 1, 4), int(r, 1, 3), range(r, 0, 6.28), range(r, 0, 6.28))
  return {
    ...base, zCut: range(r, -0.76, -0.5), // las formas redondas siempre llevan base plana
    shapeSeed: int(r, 1, 1e9), rBase: range(r, 0.5, 0.66), terms,
    wall: range(r, 0.05, 0.085), pores: int(r, 4, 9), poreR: range(r, 0.2, 0.36),
    nucleus: range(r, 0.15, 0.28), spokes: int(r, 5, 10), spokeR: range(r, 0.03, 0.05),
    organelles: int(r, 0, 3),
  }
}

export function autopoiesisField(p: Params): Field {
  const rr = mulberry32(num(p, 'shapeSeed'))
  const terms = arr(p, 'terms'), rBase = num(p, 'rBase'), wall = num(p, 'wall')
  const nPores = num(p, 'pores'), poreR = num(p, 'poreR'), nuc = num(p, 'nucleus')
  const nSpokes = num(p, 'spokes'), spokeR = num(p, 'spokeR'), nOrg = num(p, 'organelles')
  const R = (x: number, y: number, z: number) => {
    const rho = Math.hypot(x, y, z) || 1e-9
    const th = Math.atan2(y, x), ph = Math.acos(Math.max(-1, Math.min(1, z / rho)))
    let rad = rBase
    for (let i = 0; i < terms.length; i += 5) rad += terms[i] * Math.sin(terms[i + 1] * th + terms[i + 3]) * Math.sin(terms[i + 2] * ph + terms[i + 4])
    return Math.max(0.3, Math.min(0.8, rad))
  }
  const dirs: number[][] = []
  for (let i = 0; i < nPores; i++) dirs.push(unitVec(rr))
  const pores = dirs.map((d) => { const r0 = R(d[0], d[1], d[2]); return [d[0] * r0, d[1] * r0, d[2] * r0] })
  // espigas hacia direcciones que no caen sobre un poro
  const segs: number[] = []
  const hubR = nuc
  for (let tries = 0, made = 0; made < nSpokes && tries < 200; tries++) {
    const d = unitVec(rr)
    if (dirs.some((q) => q[0] * d[0] + q[1] * d[1] + q[2] * d[2] > Math.cos(Math.min(1.4, (poreR * 1.5) / rBase)))) continue
    const r0 = R(d[0], d[1], d[2]) - wall * 0.5
    pushSeg(segs, [0, 0, 0], [d[0] * r0, d[1] * r0, d[2] * r0], spokeR)
    made++
  }
  // organelos: esferas pequeñas colgadas del núcleo por una espiga corta
  for (let i = 0; i < nOrg; i++) {
    const d = unitVec(rr), dd = hubR + 0.12 + rr() * 0.12
    pushSeg(segs, [0, 0, 0], [d[0] * dd, d[1] * dd, d[2] * dd], spokeR * 0.9)
    pushSeg(segs, [d[0] * dd, d[1] * dd, d[2] * dd], [d[0] * dd, d[1] * dd, d[2] * dd], 0.05 + rr() * 0.04)
  }
  return (x, y, z) => {
    const rho = Math.hypot(x, y, z)
    let shell = Math.abs(rho - R(x, y, z)) - wall
    for (let i = 0; i < pores.length; i++) {
      const hole = Math.hypot(x - pores[i][0], y - pores[i][1], z - pores[i][2]) - poreR
      shell = smax(shell, -hole, 0.03)
    }
    let d = smin(shell, sdSphere(x, y, z, hubR), 0.03)
    for (let s = 0; s < segs.length; s += SEG) {
      const c = sdCapsule(x, y, z, segs[s], segs[s + 1], segs[s + 2], segs[s + 3], segs[s + 4], segs[s + 5], segs[s + 10])
      d = smin(d, c, 0.04)
    }
    return d
  }
}
