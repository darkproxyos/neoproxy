// De la pila de capas a una malla imprimible, con el tiempo como altura.
//
// Se orienta siempre con +z hacia arriba: imprimir la pieza de pie es reproducir
// la simulación capa por capa. Por eso no se deja que el análisis de imprimibilidad
// elija otra orientación.

import { sampleGrid, polygonize, type Mesh } from '../specimens/polygonize'
import { analyze, type Metrics } from '../specimens/analyze'
import { meshToBinarySTL } from '../specimens/stl'
import { causalAspect, footprint, halfExtents, overhangFraction, volumeField, type Shape, type Volume } from './volume'

export type MeshParams = {
  theta: number
  aspect: number   // alto/ancho; 0 = causal automático
  planned: number  // capas de la pieza completa (la altura se escala con esto, aunque falten capas)
  shape: Shape
  base: boolean
  res: number      // celdas por lado del cubo de muestreo
  sizeMm: number   // dimensión mayor de la pieza completa
}

export type MeshResult = {
  mesh: Mesh                 // mm, z arriba, apoyada en z = 0
  times: Float32Array        // capa (con decimales) a la que pertenece cada vértice
  metrics: Metrics
  aspect: number
  auto: boolean
  overhangPhys: number       // voladizo estimado desde el campo, sin mallar
  widthMm: number
  heightMm: number
  layerMm: number            // altura de una capa de simulación
  sliceOfZ: { k: number; s0: number } // capa = z_mm · k + s0
}

export const ASPECT_MIN = 0.5
export const ASPECT_MAX = 3
export const resolveAspect = (vol: Volume, theta: number, aspect: number) =>
  aspect === 0 ? Math.min(ASPECT_MAX, Math.max(ASPECT_MIN, causalAspect(vol, theta))) : aspect

export function buildMesh(vol: Volume, p: MeshParams): MeshResult | null {
  if (vol.t < 4) return null
  const auto = p.aspect === 0
  const aspect = resolveAspect(vol, p.theta, p.aspect)
  const { hx, hz } = halfExtents(aspect)
  const grid = sampleGrid(volumeField(vol, p.theta, aspect, p.planned, p.shape, p.base), p.res)
  const out = analyze(polygonize(grid), grid, p.sizeMm, { minFill: 0.0005, up: '+z' })
  if (!out) return null
  const P = out.mesh.positions, n = P.length / 3
  let minZ = Infinity, maxZ = -Infinity
  for (let i = 0; i < n; i++) { const z = P[i * 3 + 2]; if (z < minZ) minZ = z; if (z > maxZ) maxZ = z }
  // escala fija: la caja completa mide sizeMm en su dimensión mayor, falten capas o no
  const scale = p.sizeMm / (2 * Math.max(hx, hz))
  const sz = (p.planned - 1) / (2 * hz)
  const pos = new Float32Array(P.length), times = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    pos[i * 3] = P[i * 3] * scale
    pos[i * 3 + 1] = P[i * 3 + 1] * scale
    pos[i * 3 + 2] = (P[i * 3 + 2] - minZ) * scale
    times[i] = Math.min(p.planned - 1, Math.max(0, (P[i * 3 + 2] + hz) * sz))
  }
  const heightMm = (maxZ - minZ) * scale
  let wx = 0
  { let a = Infinity, b = -Infinity; for (let i = 0; i < n; i++) { const x = P[i * 3]; if (x < a) a = x; if (x > b) b = x }; wx = (b - a) * scale }
  return {
    mesh: { positions: pos, indices: out.mesh.indices }, times, metrics: out.metrics, aspect, auto,
    overhangPhys: overhangFraction(vol, p.theta, aspect),
    widthMm: wx, heightMm, layerMm: (2 * hz * scale) / (p.planned - 1),
    sliceOfZ: { k: sz / scale, s0: (minZ + hz) * sz },
  }
}

export { meshToBinarySTL }

// ---- verificación: el corte de la malla contra la capa simulada -------------------------

// Área (mm²) de la sección horizontal de una malla cerrada a la altura z. Cada
// triángulo que cruza el plano aporta un segmento orientado según su normal
// (tangente = ẑ × n), y la fórmula del cordón (shoelace) suma contornos exteriores
// y resta huecos sin necesidad de ordenar ni unir los segmentos.
export function crossSectionArea(mesh: Mesh, z: number): number {
  const P = mesh.positions, I = mesh.indices
  let twice = 0
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3
    const za = P[a + 2] - z, zb = P[b + 2] - z, zc = P[c + 2] - z
    if ((za > 0 && zb > 0 && zc > 0) || (za <= 0 && zb <= 0 && zc <= 0)) continue
    const pts: number[] = []
    const edge = (i: number, j: number, zi: number, zj: number) => {
      if ((zi > 0) === (zj > 0)) return
      const u = zi / (zi - zj)
      pts.push(P[i] + (P[j] - P[i]) * u, P[i + 1] + (P[j + 1] - P[i + 1]) * u)
    }
    edge(a, b, za, zb); edge(b, c, zb, zc); edge(c, a, zc, za)
    if (pts.length !== 4) continue
    // normal del triángulo (xy)
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2]
    const wx = P[c] - P[a], wy = P[c + 1] - P[a + 1], wz = P[c + 2] - P[a + 2]
    const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz
    let [px, py, qx, qy] = pts
    // tangente = ẑ × n = (−ny, nx)
    if ((qx - px) * -ny + (qy - py) * nx < 0) { [px, py, qx, qy] = [qx, qy, px, py] }
    twice += px * qy - qx * py
  }
  return twice / 2
}

// Área (mm²) de la capa s (con decimales) del mundo simulado: se muestrea el campo
// interpolado y se cuenta lo que supera θ dentro de la silueta de la pieza a esa altura.
export function simulatedArea(vol: Volume, theta: number, s: number, p: { shape: Shape; aspect: number; sizeMm: number; planned: number }, ss = 4): number {
  const { w, h, t, data } = vol
  const th = theta * 255, sl = w * h
  const rlim2 = footprint(p.shape, p.aspect, p.planned)(s) // silueta a la altura de la capa
  const k = Math.min(t - 2, Math.max(0, Math.floor(s))), f = Math.min(1, Math.max(0, s - k))
  const N = (w - 1) * ss
  let inside = 0
  for (let j = 0; j < N; j++) {
    const v = (j + 0.5) / ss, jj = Math.floor(v), fv = v - jj
    const yy = (v / (h - 1)) * 2 - 1
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / ss, ii = Math.floor(u), fu = u - ii
      if (rlim2 !== Infinity) { const xx = (u / (w - 1)) * 2 - 1; if (xx * xx + yy * yy > rlim2) continue }
      const o = k * sl + jj * w + ii
      const a = (data[o] * (1 - fu) + data[o + 1] * fu) * (1 - fv) + (data[o + w] * (1 - fu) + data[o + w + 1] * fu) * fv
      const b = (data[o + sl] * (1 - fu) + data[o + sl + 1] * fu) * (1 - fv) + (data[o + sl + w] * (1 - fu) + data[o + sl + w + 1] * fu) * fv
      if (a * (1 - f) + b * f >= th) inside++
    }
  }
  const cellMm = boxWidthMm(p.aspect, p.sizeMm) / (w - 1)
  return (inside / (ss * ss)) * cellMm * cellMm
}

// ancho de la caja de la pieza completa (el del mundo cuadrado), en mm
export function boxWidthMm(aspect: number, sizeMm: number): number {
  const { hx, hz } = halfExtents(aspect)
  return (sizeMm * hx) / Math.max(hx, hz)
}
