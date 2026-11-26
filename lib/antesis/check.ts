// ANTESIS — comprobaciones.
//
// 1. Dientes: se hace girar cada par de engranajes vecinos (A gira α, B gira −α·NA/NB)
//    y en cada paso se mide, para puntos densos de los flancos de B, a qué distancia
//    quedan de la superficie de A. Negativo = un diente se mete en el otro.
// 2. Barrido: una pieza que gira alrededor de su eje ocupa, a lo largo de una vuelta, el
//    sólido de revolución de su sección meridiana (z, r). Dos piezas que giran a
//    velocidades distintas pasan por todas las fases relativas, así que no chocan nunca
//    solo si esos dos sólidos de revolución no se tocan.

import type { GearGeom, Mesh } from './gear'
import { type Arrangement, type Frame, type V3, toWorld, toLocal } from './layout'

// ---------------------------------------------------------------------------------
// Contorno estrellado (un rayo desde el eje lo corta una vez): radio a un ángulo dado y
// distancia a los segmentos cercanos.
export class StarPoly {
  x: Float64Array; y: Float64Array; ang: Float64Array; n: number
  constructor(U: Float64Array) {
    const n = U.length / 2; this.n = n
    const raw = new Float64Array(n)
    for (let i = 0; i < n; i++) { let a = Math.atan2(U[2 * i + 1], U[2 * i]); if (a < 0) a += 2 * Math.PI; raw[i] = a }
    let s = 0; for (let i = 1; i < n; i++) if (raw[i] < raw[s]) s = i
    this.x = new Float64Array(n + 1); this.y = new Float64Array(n + 1); this.ang = new Float64Array(n + 1)
    let prev = raw[s]
    for (let k = 0; k < n; k++) {
      const i = (s + k) % n; let a = raw[i]
      while (a < prev - 1e-9) a += 2 * Math.PI
      this.x[k] = U[2 * i]; this.y[k] = U[2 * i + 1]; this.ang[k] = a; prev = a
    }
    this.x[n] = this.x[0]; this.y[n] = this.y[0]; this.ang[n] = this.ang[0] + 2 * Math.PI
  }
  seg(phi: number) {
    const a0 = this.ang[0]
    let p = phi; while (p < a0) p += 2 * Math.PI; while (p >= a0 + 2 * Math.PI) p -= 2 * Math.PI
    let lo = 0, hi = this.n
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (this.ang[mid] <= p) lo = mid; else hi = mid }
    return lo
  }
  // distancia con signo de (u, v) al contorno: negativa adentro
  signedDist(u: number, v: number, W = 40) {
    const phi = Math.atan2(v, u), k = this.seg(phi)
    const ex = this.x[k + 1] - this.x[k], ey = this.y[k + 1] - this.y[k]
    const dx = Math.cos(phi), dy = Math.sin(phi)
    const den = dx * ey - dy * ex
    const rPoly = den !== 0 ? (this.x[k] * ey - this.y[k] * ex) / den : Math.hypot(this.x[k], this.y[k])
    const inside = Math.hypot(u, v) < rPoly
    let best = Infinity
    for (let q = k - W; q <= k + W; q++) {
      const i = ((q % this.n) + this.n) % this.n
      const ax = this.x[i], ay = this.y[i], bx = this.x[i + 1], by = this.y[i + 1]
      const sx = bx - ax, sy = by - ay, L = sx * sx + sy * sy
      let t = L > 0 ? ((u - ax) * sx + (v - ay) * sy) / L : 0; t = t < 0 ? 0 : t > 1 ? 1 : t
      const d = Math.hypot(u - ax - t * sx, v - ay - t * sy)
      if (d < best) best = d
    }
    return inside ? -best : best
  }
}

// Puntos densos de los flancos de un engranaje (contorno subdividido, a varias alturas).
function flankSamples(g: GearGeom, layers = 9, sub = 3): Float64Array {
  const U = g.U, n = U.length / 2, out: number[] = []
  for (let l = 0; l < layers; l++) {
    const z = g.zIn + ((g.zOut - g.zIn) * l) / (layers - 1)
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      for (let s = 0; s < sub; s++) {
        const t = s / sub, u = U[2 * i] + (U[2 * j] - U[2 * i]) * t, v = U[2 * i + 1] + (U[2 * j + 1] - U[2 * i + 1]) * t
        out.push(u * z, v * z, z)
      }
    }
  }
  return Float64Array.from(out)
}

export type ToothResult = { minClear: number; worst: number; pairs: number; steps: number; penetrations: number }

// Holgura mínima entre los dientes de los pares (iA, jB) durante el giro. Si `pairs` es
// null se miden todas las uniones de la red.
export function toothClearance(arr: Arrangement, FA: Frame[], FB: Frame[], A: GearGeom, B: GearGeom, steps = 48, pairs: [number, number][] | null = null): ToothResult {
  const poly = new StarPoly(A.U), samp = flankSamples(B), ns = samp.length / 3
  const pitchB = (2 * Math.PI) / B.N, list = pairs ?? arr.edges
  let minClear = Infinity, pen = 0
  for (const [i, j] of list) {
    const fa = FA[i], fb = FB[j]
    for (let s = 0; s < steps; s++) {
      const aA = ((2 * Math.PI) / A.N) * (s / steps), aB = (-aA * A.N) / B.N
      for (let q = 0; q < ns; q++) {
        const x = samp[3 * q], y = samp[3 * q + 1], z = samp[3 * q + 2]
        // solo los dientes de B cerca del punto de contacto (ángulo 0 en su marco)
        let th = Math.atan2(y, x) + aB; th -= 2 * Math.PI * Math.round(th / (2 * Math.PI))
        if (Math.abs(th) > 4.5 * pitchB) continue
        const w = toWorld(fb, aB, [x, y, z]), p = toLocal(fa, aA, w)
        if (p[2] < A.zIn || p[2] > A.zOut) continue
        const d = poly.signedDist(p[0] / p[2], p[1] / p[2]) * p[2]
        if (d < minClear) minClear = d
        if (d < -1e-6) pen++
      }
    }
  }
  return { minClear, worst: minClear, pairs: list.length, steps, penetrations: pen }
}

// Desalineación de vecinos: cuánto se aparta cada vecino del múltiplo de 2π/k más cercano
// en el marco del engranaje (debe ser ~0 para que un diente o un hueco lo mire).
export function neighborPhaseError(F: Frame[], axesOther: V3[], neighbors: number[][], k: number): number {
  let worst = 0
  F.forEach((f, i) => {
    for (const j of neighbors[i]) {
      const p = toLocal(f, 0, axesOther[j]), a = Math.atan2(p[1], p[0]), step = (2 * Math.PI) / k
      const e = Math.abs(a - step * Math.round(a / step))
      worst = Math.max(worst, e)
    }
  })
  return worst
}

// ---------------------------------------------------------------------------------
// Malla: cerrada (cada arista compartida por exactamente dos triángulos) y con volumen
// positivo (normales hacia afuera).
export function meshStats(m: Mesh) {
  const P = m.positions, I = m.indices, V = P.length / 3
  const edges = new Map<number, number>()
  let vol = 0
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t], b = I[t + 1], c = I[t + 2]
    for (const [u, v] of [[a, b], [b, c], [c, a]]) {
      const key = u < v ? u * V + v : v * V + u
      edges.set(key, (edges.get(key) ?? 0) + 1)
    }
    const ax = P[3 * a], ay = P[3 * a + 1], az = P[3 * a + 2], bx = P[3 * b], by = P[3 * b + 1], bz = P[3 * b + 2], cx = P[3 * c], cy = P[3 * c + 1], cz = P[3 * c + 2]
    vol += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6
  }
  let open = 0, nonManifold = 0
  for (const c of edges.values()) { if (c === 1) open++; else if (c > 2) nonManifold++ }
  return { triangles: I.length / 3, volume: vol, open, nonManifold, closed: open === 0 && nonManifold === 0 }
}

// ---------------------------------------------------------------------------------
// Barrido. Sección meridiana (z a lo largo del eje, r distancia al eje) de lo que gira
// con un engranaje, rasterizada, con su transformada de distancia euclidiana exacta
// (Felzenszwalb–Huttenlocher): distancia de cualquier punto (z, r) al sólido barrido.

export type MeridianItem = { z: number; r: number; s: number }
export type MeridianShape = {
  balls: MeridianItem[]     // decoración (bolas: z, r = distancia al eje, s = radio)
  plate: { z0: number; z1: number; r: number; pad: number }
  block: GearGeom           // dientes + buje
}

const INF = 1e20
function edt1d(f: Float64Array, n: number, d: Float64Array, v: Int32Array, zz: Float64Array) {
  let k = 0; v[0] = 0; zz[0] = -INF; zz[1] = INF
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
    while (s <= zz[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]) }
    k++; v[k] = q; zz[k] = s; zz[k + 1] = INF
  }
  k = 0
  for (let q = 0; q < n; q++) { while (zz[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]] }
}

export class MeridianField {
  nz: number; nr: number; h: number; dist: Float32Array
  constructor(items: { balls?: MeridianItem[]; plate?: MeridianShape['plate']; block?: GearGeom }, zMax: number, rMax: number, h = 0.1) {
    this.h = h; this.nz = Math.ceil(zMax / h) + 2; this.nr = Math.ceil(rMax / h) + 2
    const { nz, nr } = this, occ = new Uint8Array(nz * nr)
    const fill = (z: number, r: number, s: number) => {
      const i0 = Math.max(0, Math.floor((z - s) / h)), i1 = Math.min(nz - 1, Math.ceil((z + s) / h))
      const j0 = Math.max(0, Math.floor((r - s) / h)), j1 = Math.min(nr - 1, Math.ceil((r + s) / h))
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const dz = i * h - z, dr = j * h - r; if (dz * dz + dr * dr <= s * s) occ[i * nr + j] = 1 }
    }
    for (const b of items.balls ?? []) fill(b.z, b.r, b.s)
    const rect = (z0: number, z1: number, rr: (z: number) => number) => {
      for (let i = Math.max(0, Math.floor(z0 / h)); i <= Math.min(nz - 1, Math.ceil(z1 / h)); i++) {
        const z = i * h; if (z < z0 - 1e-9 || z > z1 + 1e-9) continue
        const R = rr(z); for (let j = 0; j <= Math.min(nr - 1, Math.floor(R / h)); j++) occ[i * nr + j] = 1
      }
    }
    const p = items.plate
    if (p) rect(p.z0 - p.pad, p.z1 + p.pad, () => p.r + p.pad)
    const g = items.block
    if (g) { rect(g.zIn, g.zOut, (z) => z * Math.tan(g.tip)); rect(g.zSb, g.zIn, () => g.rS) }
    // transformada de distancia (al cuadrado, en celdas), filas y después columnas
    const n = Math.max(nz, nr), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), zz = new Float64Array(n + 1)
    const D = new Float64Array(nz * nr)
    for (let i = 0; i < nz; i++) {
      for (let j = 0; j < nr; j++) f[j] = occ[i * nr + j] ? 0 : INF
      edt1d(f, nr, d, v, zz); for (let j = 0; j < nr; j++) D[i * nr + j] = d[j]
    }
    this.dist = new Float32Array(nz * nr)
    for (let j = 0; j < nr; j++) {
      for (let i = 0; i < nz; i++) f[i] = D[i * nr + j]
      edt1d(f, nz, d, v, zz); for (let i = 0; i < nz; i++) this.dist[i * nr + j] = Math.sqrt(d[i]) * h
    }
  }
  // distancia (mm) del punto (z, r) al sólido barrido; conservadora en media celda
  at(z: number, r: number) {
    const i = Math.round(z / this.h), j = Math.round(r / this.h)
    if (i < 0 || j < 0 || i >= this.nz || j >= this.nr) return 1e9
    return this.dist[i * this.nr + j] - 0.71 * this.h
  }
}

// Bolas (en el marco de Y) giradas una vuelta entera alrededor del eje de Y, medidas
// contra el campo de X: la menor holgura.
export function sweepClearance(fieldX: MeridianField, fx: Frame, fy: Frame, items: { x: number; y: number; z: number; r: number }[], lift = 0): number {
  let best = Infinity
  for (const b of items) {
    const rr = Math.hypot(b.x, b.y), n = Math.min(720, Math.max(16, Math.ceil((2 * Math.PI * rr) / 0.5)))
    for (let k = 0; k < n; k++) {
      const a = (2 * Math.PI * k) / n
      const w = toWorld(fy, 0, [rr * Math.cos(a), rr * Math.sin(a), b.z + lift])
      const p = toLocal(fx, 0, w)
      const c = fieldX.at(p[2], Math.hypot(p[0], p[1])) - b.r
      if (c < best) best = c
    }
  }
  return best
}

// Contorno meridiano del bloque engranaje + buje como puntos (para medirlo contra otros).
export function blockSamples(g: GearGeom, step = 0.3): { x: number; y: number; z: number; r: number }[] {
  const out: { x: number; y: number; z: number; r: number }[] = []
  const seg = (z0: number, r0: number, z1: number, r1: number) => {
    const L = Math.hypot(z1 - z0, r1 - r0), n = Math.max(1, Math.ceil(L / step))
    for (let i = 0; i <= n; i++) { const t = i / n; out.push({ x: r0 + (r1 - r0) * t, y: 0, z: z0 + (z1 - z0) * t, r: 0 }) }
  }
  const tIn = g.zIn * Math.tan(g.tip), tOut = g.zOut * Math.tan(g.tip)
  seg(g.zIn, g.rS, g.zIn, tIn); seg(g.zIn, tIn, g.zOut, tOut); seg(g.zOut, tOut, g.zOut, 0)
  seg(g.zSb, 0, g.zSb, g.rS); seg(g.zSb, g.rS, g.zIn, g.rS)
  return out
}
