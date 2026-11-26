// Dos piezas:
//  · PLACA: la arena congelada como relieve sobre una baldosa (se imprime plana, sin soportes)
//  · COLUMNA: un barrido de frecuencia apilado en altura; cada capa es la banda nodal (donde
//    la arena se juntaría) a esa frecuencia. Las figuras se transforman al subir el tono.
import { polygonize, type Grid, type Mesh } from '../specimens/polygonize'
import { analyze, type Metrics } from '../specimens/analyze'
import { response, type Sand } from './plate'

export type ReliefOpts = { G: number; sizeMm: number; baseMm: number; reliefMm: number; rim: boolean }
export type ReliefResult = { mesh: Mesh; closed: boolean; tris: number; sizeMm: number; heightMm: number; grains: number }

export function relief(s: Sand, o: ReliefOpts): ReliefResult {
  const G = o.G, d = new Float32Array(G * G), sc = (G - 1) / 2
  for (let i = 0; i < s.n; i++) {
    const gx = (s.x[i] + 1) * sc, gy = (s.y[i] + 1) * sc, ix = Math.min(G - 2, Math.floor(gx)), iy = Math.min(G - 2, Math.floor(gy)), fx = gx - ix, fy = gy - iy
    d[iy * G + ix] += (1 - fx) * (1 - fy); d[iy * G + ix + 1] += fx * (1 - fy); d[(iy + 1) * G + ix] += (1 - fx) * fy; d[(iy + 1) * G + ix + 1] += fx * fy
  }
  // suavizado separable (granos → montículos)
  const k = [0.06, 0.24, 0.4, 0.24, 0.06], t = new Float32Array(G * G)
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) { let a = 0; for (let q = -2; q <= 2; q++) a += k[q + 2] * d[y * G + Math.min(G - 1, Math.max(0, x + q))]; t[y * G + x] = a }
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) { let a = 0; for (let q = -2; q <= 2; q++) a += k[q + 2] * t[Math.min(G - 1, Math.max(0, y + q)) * G + x]; d[y * G + x] = a }
  }
  const sorted = Float32Array.from(d).sort(), ref = sorted[Math.floor(0.985 * (sorted.length - 1))] || 1
  const cell = o.sizeMm / (G - 1), rimW = o.rim ? Math.max(2, Math.round(0.025 * G)) : 0
  const top = new Float32Array(G * G)
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
    const edge = Math.min(x, y, G - 1 - x, G - 1 - y)
    let h = Math.pow(Math.min(1, d[y * G + x] / ref), 0.75) * o.reliefMm
    if (edge < rimW) h = o.reliefMm
    top[y * G + x] = o.baseMm + h
  }
  // malla cerrada: superficie de arriba, fondo plano y paredes en los cuatro bordes
  const V = 2 * G * G, P = new Float32Array(V * 3)
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
    const i = y * G + x, X = x * cell - o.sizeMm / 2, Y = y * cell - o.sizeMm / 2
    P.set([X, Y, top[i]], 3 * i); P.set([X, Y, 0], 3 * (G * G + i))
  }
  const idx: number[] = []
  for (let y = 0; y < G - 1; y++) for (let x = 0; x < G - 1; x++) {
    const a = y * G + x, b = a + 1, c = a + G, e = c + 1, B = G * G
    idx.push(a, b, e, a, e, c) // arriba (normal +z)
    idx.push(B + a, B + e, B + b, B + a, B + c, B + e) // abajo (normal −z)
  }
  const ring: number[] = []
  for (let x = 0; x < G - 1; x++) ring.push(x)
  for (let y = 0; y < G - 1; y++) ring.push(y * G + G - 1)
  for (let x = G - 1; x > 0; x--) ring.push((G - 1) * G + x)
  for (let y = G - 1; y > 0; y--) ring.push(y * G)
  for (let r = 0; r < ring.length; r++) { const a = ring[r], b = ring[(r + 1) % ring.length], B = G * G; idx.push(a, B + a, B + b, a, B + b, b) }
  const indices = Uint32Array.from(idx)
  // comprobación: cada arista en exactamente dos triángulos
  const edges = new Map<number, number>()
  for (let f = 0; f < indices.length; f += 3) for (let j = 0; j < 3; j++) { const u = indices[f + j], v = indices[f + (j + 1) % 3], key = Math.min(u, v) * V + Math.max(u, v); edges.set(key, (edges.get(key) || 0) + 1) }
  let closed = true; for (const c of edges.values()) if (c !== 2) { closed = false; break }
  return { mesh: { positions: P, indices }, closed, tris: indices.length / 3, sizeMm: o.sizeMm, heightMm: o.baseMm + o.reliefMm, grains: s.n }
}

export type ColumnOpts = { N: number; sizeMm: number; lambdaA: number; lambdaB: number; band: number; aspect: number }
export type ColumnResult = { mesh: Mesh; metrics: Metrics; heightMm: number; widthMm: number }

export function column(gridsAt: (G: number) => Float32Array[], cpl: number[], o: ColumnOpts): ColumnResult | null {
  const N = o.N, S = N + 1
  // la placa ocupa el cubo en x, y; la altura usa una fracción según el aspecto
  const foot = Math.max(8, Math.round((S - 4) / Math.max(1, o.aspect))) // lado de la placa en celdas
  const G = foot, grids = gridsAt(G), off = Math.floor((S - G) / 2)
  const zBase = 2, baseT = Math.max(2, Math.round(0.03 * S)), zTop = S - 3
  const values = new Float32Array(S * S * S).fill(1)
  for (let z = zBase; z <= zTop; z++) {
    const u = (z - zBase) / (zTop - zBase)
    let lam = o.lambdaA * Math.pow(o.lambdaB / o.lambdaA, Math.max(0, (z - zBase - baseT) / (zTop - zBase - baseT)))
    if (z < zBase + baseT) lam = o.lambdaA
    const R = response(grids, G, cpl, lam)
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
      const id = (x + off) + S * ((y + off) + S * z)
      values[id] = z < zBase + baseT ? -1 : R.amp[y * G + x] - o.band
    }
    void u
  }
  const grid: Grid = { N, values }
  const out = analyze(polygonize(grid), grid, o.sizeMm, { minFill: 0.0002, up: '+z' })
  if (!out) return null
  const pos = out.mesh.positions, mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]
  for (let i = 0; i < pos.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], pos[i + a]); mx[a] = Math.max(mx[a], pos[i + a]) }
  const mm = o.sizeMm / Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]), P = new Float32Array(pos.length)
  for (let i = 0; i < pos.length; i += 3) { P[i] = (pos[i] - (mn[0] + mx[0]) / 2) * mm; P[i + 1] = (pos[i + 1] - (mn[1] + mx[1]) / 2) * mm; P[i + 2] = (pos[i + 2] - mn[2]) * mm }
  return { mesh: { positions: P, indices: out.mesh.indices }, metrics: out.metrics, heightMm: (mx[2] - mn[2]) * mm, widthMm: Math.max(mx[0] - mn[0], mx[1] - mn[1]) * mm }
}
