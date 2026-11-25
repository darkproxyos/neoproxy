// GEOMETRÍAS: objetos exactos, con nombre y teorema. A diferencia de los
// especímenes (que evolucionan), cada uno de estos se explora a mano con
// parámetros y semilla. Todos devuelven un campo escalar (f < 0 adentro) y
// pasan por el mismo mallado y análisis de imprimibilidad.

import { range, int, pick, type Rng } from './rng'
import { type Field, smin, sdCylinder } from './sdf'
import { pushSeg, fitSegs, segField, withPlinth } from './fields-grow'
import { normalize, tesseract, hyperoctahedron, icositetrachoron, pentachoron, type Vec4, type Polytope4D } from '../../components/geometry/polytopes4d'
import type { Params } from './families'

const num = (p: Params, k: string) => p[k] as number
const arr = (p: Params, k: string) => p[k] as number[]
const str = (p: Params, k: string) => p[k] as string
const TAU = Math.PI * 2
const sq = Math.sqrt
// las geometrías no llevan simetría de acabado, relieve ni base cortada: son exactas
const exact = (base: Params): Params => ({ ...base, fold: 1, skin: 'none', zCut: -2 })

// ---- 1. Cristales con hábito ---------------------------------------------------
// Un cristal es la intersección de semiespacios cuyas normales salen de la
// simetría de su sistema cristalino; las distancias fijan el "hábito" (qué caras
// crecen más). Los racimos nacen de una base como en un geoda.

type Vec3 = [number, number, number]
const rot = (v: Vec3, a: number): Vec3 => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]]

function orbit(n: Vec3, system: string): Vec3[] {
  const out: Vec3[] = []
  const add = (v: Vec3) => { if (!out.some((o) => Math.hypot(o[0] - v[0], o[1] - v[1], o[2] - v[2]) < 1e-6)) out.push(v) }
  const [x, y, z] = n
  if (system === 'cubic') {
    const perms: Vec3[] = [[x, y, z], [x, z, y], [y, x, z], [y, z, x], [z, x, y], [z, y, x]]
    for (const p of perms) for (let s = 0; s < 8; s++) add([s & 1 ? -p[0] : p[0], s & 2 ? -p[1] : p[1], s & 4 ? -p[2] : p[2]])
  } else if (system === 'tetragonal') {
    for (const p of [[x, y], [y, x]]) for (let s = 0; s < 8; s++) add([s & 1 ? -p[0] : p[0], s & 2 ? -p[1] : p[1], s & 4 ? -z : z])
  } else if (system === 'hexagonal') {
    for (let k = 0; k < 6; k++) for (const sy of [1, -1]) for (const sz of [1, -1]) add(rot([x, sy * y, sz * z], (k * TAU) / 6))
  } else {
    for (let k = 0; k < 3; k++) for (const sy of [1, -1]) for (const inv of [1, -1]) add(rot([inv * x, inv * sy * y, inv * z], (k * TAU) / 3))
  }
  return out
}

const unit3 = (v: Vec3): Vec3 => { const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l] }
const FORMS: Record<string, Vec3[]> = {
  cubic: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 1, 0], [2, 1, 1], [3, 1, 1]].map((v) => unit3(v as Vec3)),
  tetragonal: [[1, 0, 0], [1, 1, 0], [0, 0, 1], [0.6, 0, 1], [0.45, 0.45, 1], [1, 0.3, 0.2]].map((v) => unit3(v as Vec3)),
  hexagonal: [[1, 0, 0], [0.866, 0.5, 0], [0, 0, 1], [0.5, 0, 1], [0.8, 0, 1], [0.3, 0.1, 1]].map((v) => unit3(v as Vec3)),
  trigonal: [[1, 0, 0], [0, 0, 1], [0.7, 0, 1], [0.45, 0, 1], [0.8, 0.25, 0.9], [0.4, 0.2, 1]].map((v) => unit3(v as Vec3)),
}

export function sampleCrystal(r: Rng, base: Params): Params {
  const system = pick(r, ['cubic', 'hexagonal', 'tetragonal', 'trigonal'] as const)
  const nForms = system === 'cubic' ? int(r, 2, 3) : int(r, 2, 4)
  const forms: number[] = []
  const idxs = new Set<number>()
  // los sistemas no cúbicos necesitan al menos una forma con componente z para cerrarse
  if (system !== 'cubic') idxs.add(pick(r, [2, 3, 4, 5]))
  while (idxs.size < nForms) idxs.add(int(r, 0, 5))
  idxs.forEach((i) => forms.push(i, range(r, 0.5, 1.05)))
  return {
    ...exact(base), system, forms, elong: system === 'cubic' ? range(r, 0.8, 1.2) : range(r, 0.8, 2.6),
    count: pick(r, [1, 1, 3, 5, 7, 9] as const), spread: range(r, 0.15, 0.7), tiltMax: range(r, 0.15, 0.75),
    sizeVar: range(r, 0.15, 0.55), seedC: int(r, 1, 1e9), plate: r() < 0.8 ? 1 : 0,
  }
}

export function crystalField(p: Params): Field {
  const system = str(p, 'system'), forms = arr(p, 'forms'), e = num(p, 'elong'), count = num(p, 'count')
  const spread = num(p, 'spread'), tiltMax = num(p, 'tiltMax'), sizeVar = num(p, 'sizeVar'), plate = num(p, 'plate') === 1
  // normales y distancias
  const planes: { n: Vec3; d: number }[] = []
  for (let i = 0; i < forms.length; i += 2) for (const n of orbit(FORMS[system][forms[i]], system)) planes.push({ n, d: forms[i + 1] })
  // radio que circunscribe al cristal local (en coordenadas con z/e)
  let Rc = 0
  for (let k = 0; k < 600; k++) {
    const z = 1 - (2 * (k + 0.5)) / 600, rr = sq(1 - z * z), th = k * 2.399963
    const u: Vec3 = [rr * Math.cos(th), rr * Math.sin(th), z * 1]
    let t = 1e9
    for (const pl of planes) { const dn = pl.n[0] * u[0] + pl.n[1] * u[1] + (pl.n[2] * u[2]) / e; if (dn > 1e-9) t = Math.min(t, pl.d / dn) }
    if (t < 1e8) Rc = Math.max(Rc, t * Math.hypot(u[0], u[1], u[2] * 1))
  }
  Rc = Math.max(Rc, 0.3)
  // reparto determinista de los cristales del racimo
  let s0 = (num(p, 'seedC') >>> 0) || 1
  const rnd = () => { s0 = (s0 + 0x6d2b79f5) >>> 0; let t = s0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  type C = { c: Vec3; R: number[][]; s: number; rad: number }
  const cs: C[] = []
  for (let i = 0; i < count; i++) {
    const main = i === 0
    const tilt = main && count > 1 ? 0.05 : rnd() * tiltMax, az = rnd() * TAU, spin = rnd() * TAU
    const rho = main ? 0 : spread * (0.35 + 0.65 * rnd()), pa = rnd() * TAU
    const target = (main ? 0.5 : 0.5 * (1 - sizeVar * rnd())) * (count > 1 ? 0.95 : 1.4)
    const s = target / Rc
    const ct = Math.cos(tilt), st = Math.sin(tilt), ca = Math.cos(az), sa = Math.sin(az), cp = Math.cos(spin), sp = Math.sin(spin)
    // R = Rz(az) * Ry(tilt) * Rz(spin)
    const Rz1 = [[ca, -sa, 0], [sa, ca, 0], [0, 0, 1]], Ry = [[ct, 0, st], [0, 1, 0], [-st, 0, ct]], Rz2 = [[cp, -sp, 0], [sp, cp, 0], [0, 0, 1]]
    const mul = (A: number[][], B: number[][]) => A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]))
    const R = mul(mul(Rz1, Ry), Rz2)
    const axis: Vec3 = [R[0][2], R[1][2], R[2][2]]
    const rad = s * Rc
    cs.push({ c: [rho * Math.cos(pa) + axis[0] * rad * 0.75, rho * Math.sin(pa) + axis[1] * rad * 0.75, -0.8 + axis[2] * rad * 0.75], R, s, rad })
  }
  return (x, y, z) => {
    let d = plate ? sdCylinder(x, y, z + 0.82, 0.3 + spread * 0.8 + 0.1, 0.04) : 1e9
    for (const c of cs) {
      const dx = x - c.c[0], dy = y - c.c[1], dz = z - c.c[2]
      if (Math.hypot(dx, dy, dz) - c.rad > d) continue
      // coordenadas locales: R^T (p - c) / s, y z se divide por la elongación
      const lx = (c.R[0][0] * dx + c.R[1][0] * dy + c.R[2][0] * dz) / c.s
      const ly = (c.R[0][1] * dx + c.R[1][1] * dy + c.R[2][1] * dz) / c.s
      const lz = (c.R[0][2] * dx + c.R[1][2] * dy + c.R[2][2] * dz) / c.s / e
      let f = -1e9
      for (const pl of planes) { const v = pl.n[0] * lx + pl.n[1] * ly + pl.n[2] * lz - pl.d; if (v > f) f = v }
      d = Math.min(d, f * c.s)
    }
    return d
  }
}

// ---- 2. Radiolarios (Haeckel) ---------------------------------------------------
// Cáscaras de red con espinas, una dentro de otra y unidas por puntales. La
// malla sale de puntos en espiral de Fibonacci sobre la esfera, unidos a sus
// vecinos más cercanos.

export function sampleRadiolarian(r: Rng, base: Params): Params {
  return {
    ...exact(base), netSeed: int(r, 1, 1e9), shells: pick(r, [1, 2, 2, 3] as const), points: int(r, 70, 210),
    strut: range(r, 0.016, 0.028), knn: pick(r, [5, 6, 6, 7] as const), jitter: range(r, 0.1, 0.5),
    spines: range(r, 0, 0.7), spineLen: range(r, 0.1, 0.26), links: range(r, 0.12, 0.35),
    ax: range(r, 0.8, 1.25), az: range(r, 0.75, 1.3), nodeK: range(r, 1.3, 2.3),
  }
}

export function radiolarianField(p: Params): Field {
  const nShell = num(p, 'shells'), N0 = num(p, 'points'), tau = num(p, 'strut'), K = num(p, 'knn'), jit = num(p, 'jitter')
  const spines = num(p, 'spines'), L = num(p, 'spineLen'), links = num(p, 'links'), ax = num(p, 'ax'), az = num(p, 'az'), nodeK = num(p, 'nodeK')
  let s0 = (num(p, 'netSeed') >>> 0) || 1
  const rnd = () => { s0 = (s0 + 0x6d2b79f5) >>> 0; let t = s0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const segs: number[] = []
  const radii = [0.62, 0.43, 0.26].slice(0, nShell)
  const shellPts: Vec3[][] = []
  radii.forEach((R, si) => {
    const N = Math.round(N0 * (si === 0 ? 1 : si === 1 ? 0.55 : 0.3))
    const sp = sq((4 * Math.PI) / N)       // separación media entre vecinos (en la esfera unidad)
    const pts: Vec3[] = []
    for (let i = 0; i < N; i++) {
      const z = 1 - (2 * (i + 0.5)) / N, rr = sq(1 - z * z), th = i * 2.399963 + si
      let v: Vec3 = [rr * Math.cos(th) + (rnd() - 0.5) * jit * sp, rr * Math.sin(th) + (rnd() - 0.5) * jit * sp, z + (rnd() - 0.5) * jit * sp]
      const l = Math.hypot(...v); v = [v[0] / l, v[1] / l, v[2] / l]
      pts.push([v[0] * R * ax, v[1] * R * ax, v[2] * R * az])
    }
    shellPts.push(pts)
    // aristas: k vecinos más cercanos, sin duplicar y sin las demasiado largas
    const seen = new Set<number>()
    pts.forEach((a, i) => {
      const ds = pts.map((b, j) => [j, (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2] as [number, number]).filter(([j]) => j !== i).sort((u, v) => u[1] - v[1]).slice(0, K)
      for (const [j, d2] of ds) {
        const key = i < j ? i * 100000 + j : j * 100000 + i
        if (seen.has(key) || sq(d2) > 2.1 * sp * R) continue
        seen.add(key); pushSeg(segs, a, pts[j], tau)
      }
    })
    pts.forEach((a) => pushSeg(segs, a, a, tau * nodeK))
  })
  // puntales entre cáscaras
  for (let si = 0; si + 1 < shellPts.length; si++) {
    shellPts[si].forEach((a) => {
      if (rnd() > links) return
      const k = radii[si + 1] / radii[si]
      pushSeg(segs, a, [a[0] * k, a[1] * k, a[2] * k], tau * 1.05)
    })
  }
  // espinas en la cáscara exterior: base gruesa y punta fina
  shellPts[0].forEach((a) => {
    if (rnd() > spines) return
    const l = Math.hypot(...a), u: Vec3 = [a[0] / l, a[1] / l, a[2] / l], len = L * (0.5 + rnd())
    const m: Vec3 = [a[0] + u[0] * len * 0.5, a[1] + u[1] * len * 0.5, a[2] + u[2] * len * 0.5]
    pushSeg(segs, a, m, tau * 1.5)
    pushSeg(segs, m, [a[0] + u[0] * len, a[1] + u[1] * len, a[2] + u[2] * len], tau * 0.85)
  })
  const fit = fitSegs(segs, 0.9)
  return withPlinth(segField(fit, 0.02), fit, 0.34)
}

// ---- 3. Poliedros de Conway (notación de George Hart) ---------------------------
// El genoma es un texto: un sólido base y una cadena de operaciones aplicadas
// de derecha a izquierda, como en la notación de Conway ("tkD" = truncar(kis(
// dodecaedro))). Mutar es editar el texto.

type Poly = { v: number[][]; f: number[][] }
export const CONWAY_OPS = 'daktebjom'
export const CONWAY_SOLIDS = ['T', 'C', 'O', 'D', 'I', 'P3', 'P5', 'P6', 'A4', 'A5', 'A6'] as const

const sub3 = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross3 = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const cent = (P: Poly, f: number[]) => f.reduce((c, i) => [c[0] + P.v[i][0] / f.length, c[1] + P.v[i][1] / f.length, c[2] + P.v[i][2] / f.length], [0, 0, 0])
function orient(P: Poly): Poly {
  return { v: P.v, f: P.f.map((f) => {
    let n = [0, 0, 0]
    for (let i = 0; i < f.length; i++) { const c = cross3(P.v[f[i]], P.v[f[(i + 1) % f.length]]); n = [n[0] + c[0], n[1] + c[1], n[2] + c[2]] }
    const c = cent(P, f)
    return n[0] * c[0] + n[1] * c[1] + n[2] * c[2] < 0 ? [...f].reverse() : f
  }) }
}
const E = 100000
const faceMap = (P: Poly) => { const m = new Map<number, number>(); P.f.forEach((f, fi) => f.forEach((a, k) => m.set(a * E + f[(k + 1) % f.length], fi))); return m }
// caras alrededor de cada vértice, en orden
function ringsOf(P: Poly): number[][] {
  const fm = faceMap(P), start: number[] = []
  P.f.forEach((f, fi) => f.forEach((v) => { if (start[v] === undefined) start[v] = fi }))
  return P.v.map((_, i) => {
    const ring: number[] = []; let f = start[i]; const f0 = f
    do {
      ring.push(f)
      const face = P.f[f], nxt = face[(face.indexOf(i) + 1) % face.length]
      f = fm.get(nxt * E + i) ?? f0
    } while (f !== f0 && ring.length < 64)
    return ring
  })
}
const relax = (v: number[]) => { const l = Math.hypot(v[0], v[1], v[2]) || 1, k = 0.35 + 0.65 / l; return [v[0] * k, v[1] * k, v[2] * k] }
function dual(P: Poly): Poly {
  const rings = ringsOf(P)
  return orient({ v: P.f.map((f) => relax(cent(P, f))), f: rings })
}
function kis(P: Poly, h: number): Poly {
  const v = [...P.v], f: number[][] = []
  P.f.forEach((face) => {
    const c = cent(P, face), l = Math.hypot(c[0], c[1], c[2]) || 1
    const apex = v.length; v.push(relax([c[0] / l * (l + h), c[1] / l * (l + h), c[2] / l * (l + h)]))
    face.forEach((a, k) => f.push([a, face[(k + 1) % face.length], apex]))
  })
  return orient({ v, f })
}
function ambo(P: Poly): Poly {
  const ids = new Map<number, number>(), v: number[][] = []
  const mid = (a: number, b: number) => {
    const key = a < b ? a * E + b : b * E + a
    let i = ids.get(key)
    if (i === undefined) { i = v.length; ids.set(key, i); v.push(relax([(P.v[a][0] + P.v[b][0]) / 2, (P.v[a][1] + P.v[b][1]) / 2, (P.v[a][2] + P.v[b][2]) / 2])) }
    return i
  }
  const f: number[][] = P.f.map((face) => face.map((a, k) => mid(a, face[(k + 1) % face.length])))
  const rings = ringsOf(P)
  rings.forEach((ring, vi) => f.push(ring.map((fi) => { const face = P.f[fi]; return mid(vi, face[(face.indexOf(vi) + 1) % face.length]) })))
  return orient({ v, f })
}
const truncate = (P: Poly, h: number) => dual(kis(dual(P), h))
function applyOp(P: Poly, op: string, h: number): Poly {
  switch (op) {
    case 'd': return dual(P)
    case 'k': return kis(P, h)
    case 'a': return ambo(P)
    case 't': return truncate(P, h)
    case 'e': return ambo(ambo(P))
    case 'b': return truncate(ambo(P), h)
    case 'j': return dual(ambo(P))
    case 'o': { const j = dual(ambo(P)); return dual(ambo(j)) }
    case 'm': return kis(dual(ambo(P)), h)
    default: return P
  }
}
function seedSolid(name: string): Poly {
  const mk = (v: number[][], f: number[][]) => orient({ v, f })
  switch (name[0]) {
    case 'T': return mk([[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((q) => q.map((c) => c / sq(3))), [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]])
    case 'C': {
      const v = Array.from({ length: 8 }, (_, i) => [i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1].map((c) => c / sq(3)))
      return mk(v, [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]])
    }
    case 'O': return dual(seedSolid('C'))
    case 'I': {
      const g = (1 + sq(5)) / 2, raw: number[][] = []
      for (const a of [-1, 1]) for (const b of [-1, 1]) raw.push([0, a, b * g], [a, b * g, 0], [b * g, 0, a])
      const v = raw.map((q) => { const l = Math.hypot(q[0], q[1], q[2]); return q.map((c) => c / l) })
      let minD = 1e9
      for (let i = 1; i < 12; i++) minD = Math.min(minD, Math.hypot(...sub3(v[0], v[i]) as [number, number, number]))
      const adj = (i: number, j: number) => Math.abs(Math.hypot(...sub3(v[i], v[j]) as [number, number, number]) - minD) < 1e-6
      const f: number[][] = []
      for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++) if (adj(i, j) && adj(j, k) && adj(i, k)) f.push([i, j, k])
      return mk(v, f)
    }
    case 'D': return dual(seedSolid('I'))
    case 'P': {
      const n = Number(name.slice(1)) || 5, v: number[][] = [], h = 0.8
      for (let k = 0; k < n; k++) { const a = (k * TAU) / n; v.push([Math.cos(a), Math.sin(a), -h / 2]) }
      for (let k = 0; k < n; k++) { const a = (k * TAU) / n; v.push([Math.cos(a), Math.sin(a), h / 2]) }
      const f: number[][] = [Array.from({ length: n }, (_, k) => k), Array.from({ length: n }, (_, k) => n + k)]
      for (let k = 0; k < n; k++) f.push([k, (k + 1) % n, n + ((k + 1) % n), n + k])
      return mk(v, f)
    }
    default: { // antiprisma
      const n = Number(name.slice(1)) || 5, v: number[][] = [], h = 0.7
      for (let k = 0; k < n; k++) { const a = (k * TAU) / n; v.push([Math.cos(a), Math.sin(a), -h / 2]) }
      for (let k = 0; k < n; k++) { const a = ((k + 0.5) * TAU) / n; v.push([Math.cos(a), Math.sin(a), h / 2]) }
      const f: number[][] = [Array.from({ length: n }, (_, k) => k), Array.from({ length: n }, (_, k) => n + k)]
      for (let k = 0; k < n; k++) { f.push([k, (k + 1) % n, n + k]); f.push([(k + 1) % n, n + ((k + 1) % n), n + k]) }
      return mk(v, f)
    }
  }
}

export function sampleConway(r: Rng, base: Params): Params {
  let ops = ''
  for (let i = 0, n = int(r, 1, 4); i < n; i++) ops += pick(r, 'kkttabeojmd'.split(''))
  return { ...exact(base), solid: pick(r, CONWAY_SOLIDS), ops, kisH: range(r, 0.15, 0.5), tube: range(r, 0.15, 0.3), node: range(r, 1.2, 2), faces: pick(r, ['frame', 'frame', 'panel'] as const) }
}

export function conwayPoly(p: Params): Poly {
  let P = seedSolid(str(p, 'solid')), h = num(p, 'kisH')
  const ops = str(p, 'ops')
  for (let i = ops.length - 1; i >= 0; i--) {
    const Q = applyOp(P, ops[i], h)
    if (Q.f.length > 320 || Q.v.length > 520) break   // costo acotado
    P = Q
  }
  return P
}

export function conwayField(p: Params): Field {
  const P = conwayPoly(p)
  // escala: el radio mayor ocupa 0.84
  const R = Math.max(...P.v.map((v) => Math.hypot(v[0], v[1], v[2])))
  const V = P.v.map((v) => v.map((c) => (c / R) * 0.84))
  const seen = new Set<number>(), segs: number[] = []
  let mean = 0, cnt = 0
  P.f.forEach((f) => f.forEach((a, k) => { const b = f[(k + 1) % f.length], key = a < b ? a * E + b : b * E + a; if (!seen.has(key)) { seen.add(key); mean += Math.hypot(...(sub3(V[a], V[b]) as [number, number, number])); cnt++ } }))
  mean /= Math.max(1, cnt)
  const tau = Math.max(0.02, Math.min(0.05, num(p, 'tube') * mean))
  seen.clear()
  P.f.forEach((f) => f.forEach((a, k) => { const b = f[(k + 1) % f.length], key = a < b ? a * E + b : b * E + a; if (!seen.has(key)) { seen.add(key); pushSeg(segs, V[a], V[b], tau) } }))
  V.forEach((v) => pushSeg(segs, v, v, tau * num(p, 'node')))
  const fit = fitSegs(segs, 0.9)
  return withPlinth(segField(fit, 0.015), fit, 0.3)
}

// ---- 4. Politopos 4D proyectados ---------------------------------------------------

const PHI = (1 + sq(5)) / 2
function hexacosichoron(): Polytope4D {
  const v: Vec4[] = []
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const q: Vec4 = [0, 0, 0, 0]; q[i] = s; v.push(q) }
  for (let m = 0; m < 16; m++) v.push([m & 1 ? 0.5 : -0.5, m & 2 ? 0.5 : -0.5, m & 4 ? 0.5 : -0.5, m & 8 ? 0.5 : -0.5])
  const base = [PHI / 2, 0.5, 1 / (2 * PHI), 0]
  const perms: number[][] = []
  const gen = (a: number[], rest: number[]) => { if (!rest.length) { perms.push(a); return } rest.forEach((x, i) => gen([...a, x], rest.filter((_, j) => j !== i))) }
  gen([], [0, 1, 2, 3])
  const parity = (q: number[]) => { let inv = 0; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (q[i] > q[j]) inv++; return inv % 2 === 0 }
  for (const pm of perms) if (parity(pm)) for (let s = 0; s < 8; s++) {
    const q: Vec4 = [0, 0, 0, 0]; let k = 0
    pm.forEach((src, dst) => { const val = base[src]; q[dst] = val === 0 ? 0 : (s >> k++) & 1 ? -val : val })
    v.push(q)
  }
  let minD = 1e9
  for (let j = 1; j < v.length; j++) minD = Math.min(minD, Math.hypot(v[0][0] - v[j][0], v[0][1] - v[j][1], v[0][2] - v[j][2], v[0][3] - v[j][3]))
  const edges: [number, number][] = []
  for (let a = 0; a < v.length; a++) for (let b = a + 1; b < v.length; b++) if (Math.abs(Math.hypot(v[a][0] - v[b][0], v[a][1] - v[b][1], v[a][2] - v[b][2], v[a][3] - v[b][3]) - minD) < 1e-6) edges.push([a, b])
  return { name: '600-cell', vertices: v, edges }
}
const POLYTOPES: Record<string, () => Polytope4D> = { pentachoron, tesseract, hexadecachoron: hyperoctahedron, icositetrachoron, hexacosichoron }

export function samplePolytope(r: Rng, base: Params): Params {
  return {
    ...exact(base), shape: pick(r, ['pentachoron', 'tesseract', 'hexadecachoron', 'icositetrachoron', 'icositetrachoron', 'hexacosichoron'] as const),
    angles: [range(r, 0, 6.28), range(r, 0, 6.28), range(r, 0, 6.28), range(r, 0, 6.28), range(r, 0, 6.28), range(r, 0, 6.28)],
    dist: range(r, 2.1, 3.6), tube: range(r, 0.022, 0.04), node: range(r, 1.3, 2.2), depthTube: range(r, 0.2, 0.9),
  }
}

export function polytopeField(p: Params): Field {
  const poly = POLYTOPES[str(p, 'shape')](), A = arr(p, 'angles'), d = num(p, 'dist'), tau = num(p, 'tube'), nodeK = num(p, 'node'), dt = num(p, 'depthTube')
  const verts = normalize(poly.vertices)
  const planes: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]
  const P3: { q: Vec3; w: number; s: number }[] = verts.map((v0) => {
    const v = [...v0]
    planes.forEach(([i, j], k) => { const c = Math.cos(A[k]), s = Math.sin(A[k]), a = v[i], b = v[j]; v[i] = a * c - b * s; v[j] = a * s + b * c })
    const s = d / (d - v[3])
    return { q: [v[0] * s, v[1] * s, v[2] * s] as Vec3, w: v[3], s }
  })
  const segs: number[] = []
  for (const [a, b] of poly.edges) pushSeg(segs, P3[a].q, P3[b].q, tau * (1 - dt * 0.5 + dt * 0.5 * (P3[a].s + P3[b].s)))
  P3.forEach((q) => pushSeg(segs, q.q, q.q, tau * nodeK * (1 - dt * 0.5 + dt * 0.5 * q.s)))
  const fit = fitSegs(segs, 0.9)
  return withPlinth(segField(fit, 0.015), fit, 0.32)
}

// ---- 5. Superficies matemáticas gruesas ------------------------------------------
// Se muestrea la superficie paramétrica y se engrosa uniendo esferas: la pieza
// es la nube de puntos a menos de `t` de la superficie. Botella de Klein (en
// 8), superficie de Boy (Bryant–Kusner), Dini, Enneper, banda de Möbius y la
// familia catenoide-helicoide (una deformación isométrica real).

type Cx = [number, number]
const cmul = (a: Cx, b: Cx): Cx => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]
const cdiv = (a: Cx, b: Cx): Cx => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d] }
const cadd = (a: Cx, b: Cx): Cx => [a[0] + b[0], a[1] + b[1]]

type Surf = { u: [number, number]; v: [number, number]; at: (u: number, v: number, q: number) => Vec3 }
const SURFACES: Record<string, Surf> = {
  klein: { u: [0, TAU], v: [0, TAU], at: (u, v) => { const a = 2 + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v); return [a * Math.cos(u), a * Math.sin(u), Math.sin(u / 2) * Math.sin(v) + Math.cos(u / 2) * Math.sin(2 * v)] } },
  boy: { u: [0, TAU], v: [0, 0.985], at: (th, r) => {
    const w: Cx = [r * Math.cos(th), r * Math.sin(th)]
    const w2 = cmul(w, w), w3 = cmul(w2, w), w4 = cmul(w2, w2), w6 = cmul(w3, w3)
    const den: Cx = cadd(cadd(w6, [sq(5) * w3[0], sq(5) * w3[1]]), [-1, 0])
    const g1 = cdiv(cmul(w, [1 - w4[0], -w4[1]]), den), g2 = cdiv(cmul(w, [1 + w4[0], w4[1]]), den), g3 = cdiv([1 + w6[0], w6[1]], den)
    const a = -1.5 * g1[1], b = -1.5 * g2[0], c = g3[1] - 0.5, n = a * a + b * b + c * c
    return [a / n, b / n, c / n]
  } },
  dini: { u: [0, 4 * Math.PI], v: [0.08, 2], at: (u, v, q) => [Math.cos(u) * Math.sin(v), Math.sin(u) * Math.sin(v), Math.cos(v) + Math.log(Math.tan(v / 2)) + q * 0.2 * u] },
  enneper: { u: [-1.5, 1.5], v: [-1.5, 1.5], at: (u, v) => [u - (u * u * u) / 3 + u * v * v, v - (v * v * v) / 3 + v * u * u, u * u - v * v] },
  mobius: { u: [0, TAU], v: [-1, 1], at: (u, v) => [(1 + (v / 2) * Math.cos(u / 2)) * Math.cos(u), (1 + (v / 2) * Math.cos(u / 2)) * Math.sin(u), (v / 2) * Math.sin(u / 2)] },
  catenoid: { u: [-Math.PI, Math.PI], v: [-1.3, 1.3], at: (u, v, a) => [Math.cos(a) * Math.sinh(v) * Math.sin(u) + Math.sin(a) * Math.cosh(v) * Math.cos(u), -Math.cos(a) * Math.sinh(v) * Math.cos(u) + Math.sin(a) * Math.cosh(v) * Math.sin(u), u * Math.cos(a) + v * Math.sin(a)] },
}

export function sampleSurface(r: Rng, base: Params): Params {
  return { ...exact(base), kind: pick(r, Object.keys(SURFACES)), thick: range(r, 0.02, 0.04), morph: range(r, 0, Math.PI / 2), twistN: range(r, 0.3, 1.1) }
}

export function surfaceField(p: Params): Field {
  const S = SURFACES[str(p, 'kind')], thick = num(p, 'thick')
  const q = str(p, 'kind') === 'catenoid' ? num(p, 'morph') : str(p, 'kind') === 'dini' ? num(p, 'twistN') : 0
  const NU = 170, NV = 170
  let pts: Vec3[] = []
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
    const u = S.u[0] + ((S.u[1] - S.u[0]) * i) / (NU - 1), v = S.v[0] + ((S.v[1] - S.v[0]) * j) / (NV - 1)
    const pt = S.at(u, v, q)
    if (isFinite(pt[0] + pt[1] + pt[2])) pts.push(pt)
  }
  // se centra y se escala al cubo; el espaciado resultante fija el grosor mínimo
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]
  for (const pt of pts) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], pt[a]); mx[a] = Math.max(mx[a], pt[a]) }
  const c = [0, 1, 2].map((a) => (mn[a] + mx[a]) / 2), half = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) / 2 || 1, k = 0.84 / half
  pts = pts.map((pt) => [(pt[0] - c[0]) * k, (pt[1] - c[1]) * k, (pt[2] - c[2]) * k] as Vec3)
  // espaciado típico entre puntos contiguos
  let sp = 0, ns = 0
  for (let i = 0; i < pts.length - 1; i += 7) { const d = Math.hypot(pts[i][0] - pts[i + 1][0], pts[i][1] - pts[i + 1][1], pts[i][2] - pts[i + 1][2]); if (d < 0.2) { sp += d; ns++ } }
  const t = Math.min(0.08, Math.max(thick, 1.1 * (sp / Math.max(1, ns)) + 0.004))
  const G = 24, cs = 2 / G
  const buckets: number[][] = Array.from({ length: G * G * G }, () => [])
  const idx = (v: number) => Math.max(0, Math.min(G - 1, Math.floor((v + 1) / cs)))
  pts.forEach((pt, i) => buckets[(idx(pt[2]) * G + idx(pt[1])) * G + idx(pt[0])].push(i))
  const R = 0.12
  return (x, y, z) => {
    const cx = idx(x), cy = idx(y), cz = idx(z)
    let d2 = 1e9
    for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = cx + dx, Y = cy + dy, Z = cz + dz
      if (X < 0 || Y < 0 || Z < 0 || X >= G || Y >= G || Z >= G) continue
      for (const i of buckets[(Z * G + Y) * G + X]) { const e = (pts[i][0] - x) ** 2 + (pts[i][1] - y) ** 2 + (pts[i][2] - z) ** 2; if (e < d2) d2 = e }
    }
    return d2 > R * R ? R - t : sq(d2) - t
  }
}

// ---- 6. Fibración de Hopf ----------------------------------------------------------
// La esfera S³ es una unión de círculos enlazados dos a dos (las fibras). Se
// proyecta estereográficamente a R³: toros anidados de círculos que se enlazan.

export function sampleHopf(r: Rng, base: Params): Params {
  return { ...exact(base), rings: int(r, 3, 7), fibers: int(r, 8, 22), tube: range(r, 0.016, 0.03), rotA: range(r, 0, 1.2), rotB: range(r, 0, 1.2), etaMin: range(r, 0.18, 0.4), etaMax: range(r, 0.78, 0.95) }
}

export function hopfField(p: Params): Field {
  const nR = num(p, 'rings'), nF = num(p, 'fibers'), tau = num(p, 'tube'), ra = num(p, 'rotA'), rb = num(p, 'rotB'), e0 = num(p, 'etaMin'), e1 = num(p, 'etaMax')
  const lines: Vec3[][] = []
  const M = 90
  for (let a = 0; a < nR; a++) {
    const eta = nR === 1 ? (e0 + e1) / 2 : e0 + ((e1 - e0) * a) / (nR - 1)
    for (let b = 0; b < nF; b++) {
      const phi = (b / nF) * TAU
      let line: Vec3[] = []
      for (let i = 0; i <= M; i++) {
        const xi = (i / M) * TAU
        // punto de S³ en la fibra (eta, phi)
        let x1 = Math.cos(eta) * Math.cos(xi), x2 = Math.cos(eta) * Math.sin(xi), x3 = Math.sin(eta) * Math.cos(xi + phi), x4 = Math.sin(eta) * Math.sin(xi + phi)
        // giros en 4D para que la proyección no sea la canónica
        const c1 = Math.cos(ra), s1 = Math.sin(ra), c2 = Math.cos(rb), s2 = Math.sin(rb)
        const y1 = x1 * c1 - x4 * s1, y4 = x1 * s1 + x4 * c1; x1 = y1; x4 = y4
        const y2 = x2 * c2 - x3 * s2, y3 = x2 * s2 + x3 * c2; x2 = y2; x3 = y3
        const den = 1 - x4
        const q: Vec3 = [x1 / den, x2 / den, x3 / den]
        if (Math.hypot(...q) > 4 || den < 0.2) { if (line.length > 1) lines.push(line); line = []; continue }
        line.push(q)
      }
      if (line.length > 1) lines.push(line)
    }
  }
  // el grosor se fija en unidades FINALES (después de escalar al cubo); si no, la
  // proyección encoge las fibras por debajo de un vóxel y desaparecen
  let half = 1e-6
  for (const l of lines) for (const q of l) half = Math.max(half, Math.abs(q[0]), Math.abs(q[1]), Math.abs(q[2]))
  const k = 0.86 / half, segs: number[] = []
  for (const l of lines) for (let i = 1; i < l.length; i++) {
    pushSeg(segs, [l[i - 1][0] * k, l[i - 1][1] * k, l[i - 1][2] * k], [l[i][0] * k, l[i][1] * k, l[i][2] * k], tau)
  }
  return withPlinth(segField(segs, 0.015), segs, 0.34)
}

// ---- 7. Orbitales y superposiciones (hidrógeno) -----------------------------------
// ψ_nlm = R_nl(r) · Y_lm(θ,φ): las formas reales de los orbitales atómicos. La
// pieza es el nivel |ψ| = c de una superposición de varios estados.

function laguerre(k: number, alpha: number, x: number): number {
  if (k === 0) return 1
  let l0 = 1, l1 = 1 + alpha - x
  for (let i = 1; i < k; i++) { const l2 = ((2 * i + 1 + alpha - x) * l1 - (i + alpha) * l0) / (i + 1); l0 = l1; l1 = l2 }
  return l1
}
function legendre(l: number, m: number, x: number): number {
  let pmm = 1
  if (m > 0) { const s = sq(Math.max(0, 1 - x * x)); let f = 1; for (let i = 1; i <= m; i++) { pmm *= -f * s; f += 2 } }
  if (l === m) return pmm
  let pm1 = x * (2 * m + 1) * pmm
  if (l === m + 1) return pm1
  let pl = 0
  for (let ll = m + 2; ll <= l; ll++) { pl = ((2 * ll - 1) * x * pm1 - (ll + m - 1) * pmm) / (ll - m); pmm = pm1; pm1 = pl }
  return pl
}
const fact = (n: number) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f }
function realY(l: number, m: number, ct: number, ph: number): number {
  const am = Math.abs(m), K = sq(((2 * l + 1) / (4 * Math.PI)) * (fact(l - am) / fact(l + am))), P = legendre(l, am, ct)
  return m === 0 ? K * P : m > 0 ? sq(2) * K * P * Math.cos(am * ph) : sq(2) * K * P * Math.sin(am * ph)
}

export function sampleOrbital(r: Rng, base: Params): Params {
  const terms: number[] = []
  for (let i = 0, nt = int(r, 1, 3); i < nt; i++) {
    const n = int(r, 2, 5), l = int(r, 0, Math.min(n - 1, 4)), m = int(r, -l, l)
    terms.push(n, l, m, range(r, 0.5, 1) * (r() < 0.4 ? -1 : 1))
  }
  return { ...exact(base), terms, scale: range(r, 0.9, 1.6), level: range(r, 0.1, 0.34), core: range(r, 0.1, 0.17), ax: range(r, 0, 6.28), ay: range(r, 0, 6.28) }
}

export function orbitalField(p: Params): Field {
  const terms = arr(p, 'terms'), lv = num(p, 'level'), core = num(p, 'core')
  // el lóbulo exterior de n más alto queda en ~0.55 del cubo, sea cual sea la superposición
  let nMax = 2
  for (let i = 0; i < terms.length; i += 4) nMax = Math.max(nMax, terms[i])
  const sc = (nMax * nMax * 1.8) / (num(p, 'scale') * 5)
  const cx = Math.cos(num(p, 'ax')), sx = Math.sin(num(p, 'ax')), cy = Math.cos(num(p, 'ay')), sy = Math.sin(num(p, 'ay'))
  const psi = (x: number, y: number, z: number) => {
    const rho = sq(x * x + y * y + z * z) + 1e-9, ct = z / rho, ph = Math.atan2(y, x)
    let s = 0
    for (let i = 0; i < terms.length; i += 4) {
      const n = terms[i], l = terms[i + 1], m = terms[i + 2], c = terms[i + 3]
      const rr = (2 * rho * sc * 5) / n
      s += c * Math.exp(-rr / 2) * Math.pow(rr, l) * laguerre(n - l - 1, 2 * l + 1, rr) * realY(l, m, ct, ph)
    }
    return s
  }
  // normalización: máximo de |ψ| en la bola, muestreado
  let mx = 1e-9
  for (let k = 0; k < 3000; k++) { const z = 1 - (2 * (k + 0.5)) / 3000, rr = 0.9 * Math.cbrt(((k * 0.618034) % 1) + 0.001), s = sq(1 - z * z), th = k * 2.399963; mx = Math.max(mx, Math.abs(psi(rr * s * Math.cos(th), rr * s * Math.sin(th), rr * z))) }
  return (px, py, pz) => {
    let x = px * cy + pz * sy, z = -px * sy + pz * cy, y = py
    const y2 = y * cx - z * sx; z = y * sx + z * cx; y = y2
    const lobes = (lv - Math.abs(psi(x, y, z)) / mx) * 0.35
    const r0 = sq(px * px + py * py + pz * pz)
    return Math.max(smin(lobes, r0 - core, 0.05), r0 - 0.9)
  }
}

// ---- 8. Interferencia de ondas -------------------------------------------------------
// Suma de ondas esféricas que parten de varios focos. La pieza es un nivel de
// la suma: capas concéntricas que se cruzan, como un holograma sólido.

export function sampleInterference(r: Rng, base: Params): Params {
  const n = int(r, 3, 9), src: number[] = []
  const ring = r() < 0.5
  for (let i = 0; i < n; i++) {
    if (ring) { const a = (i / n) * TAU; src.push(0.45 * Math.cos(a), 0.45 * Math.sin(a), range(r, -0.1, 0.1), range(r, 0, 6.28)) }
    else { const z = range(r, -1, 1), s = sq(1 - z * z), a = range(r, 0, TAU); src.push(0.5 * s * Math.cos(a), 0.5 * s * Math.sin(a), 0.5 * z, range(r, 0, 6.28)) }
  }
  return { ...exact(base), src, wave: range(r, 14, 32), level: range(r, -0.2, 0.35), thick: range(r, 0.1, 0.24), decay: range(r, 0.2, 1.1), radius: range(r, 0.8, 0.92) }
}

export function interferenceField(p: Params): Field {
  const S = arr(p, 'src'), k = num(p, 'wave'), lv = num(p, 'level'), th = num(p, 'thick'), dc = num(p, 'decay'), R = num(p, 'radius')
  const n = S.length / 4
  return (x, y, z) => {
    let s = 0
    for (let i = 0; i < S.length; i += 4) { const d = Math.hypot(x - S[i], y - S[i + 1], z - S[i + 2]); s += Math.cos(k * d + S[i + 3]) / (1 + dc * d * 3) }
    const sheet = (Math.abs(s / n * 2.2 - lv) - th) / (k * 0.35)
    const ball = Math.hypot(x, y, z) - R
    return Math.max(sheet, ball)
  }
}
