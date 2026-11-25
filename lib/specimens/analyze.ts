// Análisis de imprimibilidad y "riqueza" de una malla. Todo son heurísticas
// medibles sobre la geometría, no un juicio de belleza: lo que se puede
// verificar (cerrada, sin islas, sin paredes de menos de 1 mm, pocos
// voladizos, base estable) se mide; lo demás (qué tan interesante es) se
// aproxima con complejidad, género y variedad de orientaciones de la superficie.

import { sampleAt, type Grid, type Mesh } from './polygonize'

export type Up = '+x' | '-x' | '+y' | '-y' | '+z' | '-z'
const UPS: Up[] = ['+z', '-z', '+x', '-x', '+y', '-y']
const UP_VEC: Record<Up, [number, number, number]> = {
  '+x': [1, 0, 0], '-x': [-1, 0, 0], '+y': [0, 1, 0], '-y': [0, -1, 0], '+z': [0, 0, 1], '-z': [0, 0, -1],
}

export const MIN_WALL_MM = 1.0
export const DEFAULT_SIZE_MM = 60

export type Metrics = {
  tris: number
  closed: boolean
  boundaryEdges: number
  nonManifoldEdges: number
  components: number
  droppedVolumeFrac: number
  genus: number
  isoRatio: number
  entropy: number
  elongation: number
  bboxMm: [number, number, number]
  sizeMm: number
  up: Up
  overhangFrac: number
  contactFrac: number
  comStable: boolean
  thinFrac: number
  wallP10Mm: number
  complexityN: number
  genusN: number
  printScore: number
  richness: number
  fitness: number
  material: 'PLA o resina' | 'resina'
  cell: string
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

// Rotaciones propias (det +1) que llevan cada "arriba" a +z.
export function orientPoint(up: Up, x: number, y: number, z: number): [number, number, number] {
  switch (up) {
    case '+z': return [x, y, z]
    case '-z': return [x, -y, -z]
    case '+x': return [-z, y, x]
    case '-x': return [z, y, -x]
    case '+y': return [x, -z, y]
    case '-y': return [x, z, -y]
  }
}

// Malla orientada para imprimir: apoyada en z=0, centrada en xy, escalada a mm.
export function orientForPrint(mesh: Mesh, up: Up, sizeMm: number): Mesh {
  const n = mesh.positions.length / 3
  const out = new Float32Array(mesh.positions.length)
  let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  for (let i = 0; i < n; i++) {
    const [x, y, z] = orientPoint(up, mesh.positions[i * 3], mesh.positions[i * 3 + 1], mesh.positions[i * 3 + 2])
    out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z
  }
  const scale = sizeMm / Math.max(maxX - minX, maxY - minY, maxZ - minZ)
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  for (let i = 0; i < n; i++) {
    out[i * 3] = (out[i * 3] - cx) * scale
    out[i * 3 + 1] = (out[i * 3 + 1] - cy) * scale
    out[i * 3 + 2] = (out[i * 3 + 2] - minZ) * scale
  }
  return { positions: out, indices: mesh.indices }
}

// Se queda con la componente conexa de mayor volumen y compacta los vértices.
function keepLargestComponent(mesh: Mesh): { mesh: Mesh; components: number; droppedVolumeFrac: number } {
  const { positions: P, indices: I } = mesh
  const V = P.length / 3
  const parent = new Int32Array(V).map((_, i) => i)
  const find = (a: number): number => {
    while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a] }
    return a
  }
  for (let t = 0; t < I.length; t += 3) {
    const a = find(I[t]), b = find(I[t + 1]), c = find(I[t + 2])
    if (a !== b) parent[b] = a
    const a2 = find(a), c2 = find(c)
    if (a2 !== c2) parent[c2] = a2
  }
  const vol = new Map<number, number>()
  for (let t = 0; t < I.length; t += 3) {
    const ia = I[t] * 3, ib = I[t + 1] * 3, ic = I[t + 2] * 3
    const v = (
      P[ia] * (P[ib + 1] * P[ic + 2] - P[ib + 2] * P[ic + 1]) -
      P[ia + 1] * (P[ib] * P[ic + 2] - P[ib + 2] * P[ic]) +
      P[ia + 2] * (P[ib] * P[ic + 1] - P[ib + 1] * P[ic])
    ) / 6
    const root = find(I[t])
    vol.set(root, (vol.get(root) ?? 0) + v)
  }
  let best = -1, bestVol = -Infinity, total = 0
  for (const [root, v] of vol) {
    total += Math.abs(v)
    if (v > bestVol) { bestVol = v; best = root }
  }
  const remap = new Int32Array(V).fill(-1)
  const outPos: number[] = []
  const outIdx: number[] = []
  for (let t = 0; t < I.length; t += 3) {
    if (find(I[t]) !== best) continue
    for (let k = 0; k < 3; k++) {
      const v = I[t + k]
      if (remap[v] < 0) { remap[v] = outPos.length / 3; outPos.push(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]) }
      outIdx.push(remap[v])
    }
  }
  return {
    mesh: { positions: new Float32Array(outPos), indices: new Uint32Array(outIdx) },
    components: vol.size,
    droppedVolumeFrac: total > 0 ? 1 - Math.abs(bestVol) / total : 0,
  }
}

export function analyze(raw: Mesh, grid: Grid, sizeMm = DEFAULT_SIZE_MM, opts: { minFill?: number; up?: Up } = {}): { mesh: Mesh; metrics: Metrics } | null {
  if (raw.indices.length < 3 * 200) return null
  const { mesh, components, droppedVolumeFrac } = keepLargestComponent(raw)
  const P = mesh.positions, I = mesh.indices
  const V = P.length / 3, F = I.length / 3
  if (F < 200) return null

  // aristas
  const edges = new Map<number, number>()
  for (let t = 0; t < I.length; t += 3) {
    for (let k = 0; k < 3; k++) {
      const a = I[t + k], b = I[t + (k + 1) % 3]
      const key = a < b ? a * V + b : b * V + a
      edges.set(key, (edges.get(key) ?? 0) + 1)
    }
  }
  let boundaryEdges = 0, nonManifoldEdges = 0
  for (const c of edges.values()) { if (c === 1) boundaryEdges++; else if (c > 2) nonManifoldEdges++ }
  const closed = boundaryEdges === 0 && nonManifoldEdges === 0

  // normales y áreas por cara, volumen, centroide
  const nx = new Float32Array(F), ny = new Float32Array(F), nz = new Float32Array(F), area = new Float32Array(F)
  const cz = [new Float32Array(F), new Float32Array(F), new Float32Array(F)]
  let totalArea = 0, volume = 0, comX = 0, comY = 0, comZ = 0
  const vnx = new Float32Array(V), vny = new Float32Array(V), vnz = new Float32Array(V)
  let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  for (let i = 0; i < V; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z
  }
  for (let f = 0; f < F; f++) {
    const ia = I[f * 3] * 3, ib = I[f * 3 + 1] * 3, ic = I[f * 3 + 2] * 3
    const ux = P[ib] - P[ia], uy = P[ib + 1] - P[ia + 1], uz = P[ib + 2] - P[ia + 2]
    const wx = P[ic] - P[ia], wy = P[ic + 1] - P[ia + 1], wz = P[ic + 2] - P[ia + 2]
    const cxn = uy * wz - uz * wy, cyn = uz * wx - ux * wz, czn = ux * wy - uy * wx
    const len = Math.hypot(cxn, cyn, czn) || 1e-12
    nx[f] = cxn / len; ny[f] = cyn / len; nz[f] = czn / len
    area[f] = len / 2
    totalArea += area[f]
    cz[0][f] = (P[ia] + P[ib] + P[ic]) / 3
    cz[1][f] = (P[ia + 1] + P[ib + 1] + P[ic + 1]) / 3
    cz[2][f] = (P[ia + 2] + P[ib + 2] + P[ic + 2]) / 3
    const tv = (
      P[ia] * (P[ib + 1] * P[ic + 2] - P[ib + 2] * P[ic + 1]) -
      P[ia + 1] * (P[ib] * P[ic + 2] - P[ib + 2] * P[ic]) +
      P[ia + 2] * (P[ib] * P[ic + 1] - P[ib + 1] * P[ic])
    ) / 6
    volume += tv
    comX += tv * cz[0][f]; comY += tv * cz[1][f]; comZ += tv * cz[2][f]
    for (const iv of [I[f * 3], I[f * 3 + 1], I[f * 3 + 2]]) {
      vnx[iv] += cxn; vny[iv] += cyn; vnz[iv] += czn
    }
  }
  if (volume <= 0 || totalArea <= 0) return null
  comX /= volume; comY /= volume; comZ /= volume

  const dims = [maxX - minX, maxY - minY, maxZ - minZ]
  const maxDim = Math.max(...dims), minDim = Math.min(...dims)
  const mmScale = sizeMm / maxDim
  const bboxVolume = dims[0] * dims[1] * dims[2]
  if (volume / bboxVolume < (opts.minFill ?? 0.015)) return null   // marcos de alambre: las geometrías bajan este umbral

  // género (Euler) — solo tiene sentido si la malla está cerrada
  const Ecount = edges.size
  const chi = V - Ecount + F
  const genus = closed ? Math.max(0, Math.round((2 - chi) / 2)) : 0

  // orientación de impresión: la que menos voladizo da con base estable
  let best = { up: '+z' as Up, oh: 1, contact: 0, stable: false, score: -1 }
  for (const up of opts.up ? [opts.up] : UPS) {
    const u = UP_VEC[up]
    let minH = Infinity, maxH = -Infinity
    for (let i = 0; i < V; i++) {
      const h = P[i * 3] * u[0] + P[i * 3 + 1] * u[1] + P[i * 3 + 2] * u[2]
      if (h < minH) minH = h; if (h > maxH) maxH = h
    }
    const H = maxH - minH, eps = 0.02 * H
    let overhang = 0, contact = 0
    let cMinA = Infinity, cMaxA = -Infinity, cMinB = Infinity, cMaxB = -Infinity
    // ejes del plano de apoyo
    const a = up.endsWith('x') ? 1 : 0, b = up.endsWith('z') ? 1 : 2
    for (let f = 0; f < F; f++) {
      const down = -(nx[f] * u[0] + ny[f] * u[1] + nz[f] * u[2])
      if (down <= 0.7071) continue
      const h = cz[0][f] * u[0] + cz[1][f] * u[1] + cz[2][f] * u[2]
      if (h - minH < eps) {
        if (down > 0.97) {
          contact += area[f]
          const pa = cz[a][f], pb = cz[b][f]
          if (pa < cMinA) cMinA = pa; if (pa > cMaxA) cMaxA = pa
          if (pb < cMinB) cMinB = pb; if (pb > cMaxB) cMaxB = pb
        }
      } else overhang += area[f]
    }
    const oh = overhang / totalArea, contactFrac = contact / totalArea
    const com = [comX, comY, comZ]
    const comOk = contact > 0 && com[a] >= cMinA && com[a] <= cMaxA && com[b] >= cMinB && com[b] <= cMaxB
    const stability = clamp(contactFrac / 0.05, 0, 1) * (comOk ? 1 : 0.4)
    const score = (1 - oh) * (0.3 + 0.7 * stability)
    if (score > best.score) best = { up, oh, contact: contactFrac, stable: comOk, score }
  }

  // espesor de pared: desde cada vértice, hacia adentro por la normal, hasta salir
  const cell = 2 / grid.N
  const stride = Math.max(1, Math.floor(V / 3000))
  const thick: number[] = []
  for (let i = 0; i < V; i += stride) {
    const len = Math.hypot(vnx[i], vny[i], vnz[i])
    if (len < 1e-9) continue
    const dx = -vnx[i] / len, dy = -vny[i] / len, dz = -vnz[i] / len
    const px = P[i * 3], py = P[i * 3 + 1], pz = P[i * 3 + 2]
    let d = cell * 0.6, found = 0.7
    const maxD = 0.7, step = cell * 0.5
    while (d < maxD) {
      if (sampleAt(grid, px + dx * d, py + dy * d, pz + dz * d) > 0) { found = d; break }
      d += step
    }
    thick.push(found * mmScale)
  }
  thick.sort((p, q) => p - q)
  const thinFrac = thick.length ? thick.filter((t) => t < MIN_WALL_MM).length / thick.length : 1
  const wallP10Mm = thick.length ? thick[Math.floor(thick.length * 0.1)] : 0

  // riqueza
  const isoRatio = totalArea / (4 * Math.PI * Math.pow((3 * volume) / (4 * Math.PI), 2 / 3))
  const complexityN = clamp(Math.log2(Math.max(1, isoRatio)) / 4.5, 0, 1)
  const genusN = clamp(Math.log2(1 + genus) / 4, 0, 1)
  const NB_T = 16, NB_P = 8
  const bins = new Float64Array(NB_T * NB_P)
  for (let f = 0; f < F; f++) {
    const t = Math.min(NB_T - 1, Math.floor(((Math.atan2(ny[f], nx[f]) + Math.PI) / (2 * Math.PI)) * NB_T))
    const p = Math.min(NB_P - 1, Math.floor(((nz[f] + 1) / 2) * NB_P))
    bins[t * NB_P + p] += area[f]
  }
  let entropy = 0
  for (const w of bins) if (w > 0) { const q = w / totalArea; entropy -= q * Math.log(q) }
  const entropyN = entropy / Math.log(NB_T * NB_P)
  const richness = 0.4 * complexityN + 0.25 * genusN + 0.35 * entropyN

  const fragFactor = droppedVolumeFrac < 0.05 ? 1 : droppedVolumeFrac < 0.2 ? 0.6 : 0.2
  const printScore = (closed ? 1 : 0) * best.score * Math.pow(1 - thinFrac, 1.2) * fragFactor
  const fitness = printScore * (0.35 + 0.65 * richness)

  const elongation = clamp((maxDim / Math.max(minDim, 1e-9) - 1) / 2, 0, 1)
  const gBin = genus === 0 ? 0 : genus <= 3 ? 1 : genus <= 15 ? 2 : 3
  const cell3 = `${Math.min(7, Math.floor(complexityN * 8))}-${Math.min(4, Math.floor(elongation * 5))}-${gBin}`

  const material: Metrics['material'] = best.oh > 0.35 || wallP10Mm < 1.3 ? 'resina' : 'PLA o resina'

  return {
    mesh,
    metrics: {
      tris: F, closed, boundaryEdges, nonManifoldEdges, components, droppedVolumeFrac,
      genus, isoRatio, entropy: entropyN, elongation,
      bboxMm: [dims[0] * mmScale, dims[1] * mmScale, dims[2] * mmScale], sizeMm,
      up: best.up, overhangFrac: best.oh, contactFrac: best.contact, comStable: best.stable,
      thinFrac, wallP10Mm, complexityN, genusN, printScore, richness, fitness, material, cell: cell3,
    },
  }
}
