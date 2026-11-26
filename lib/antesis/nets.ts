// Surface nets sobre una grilla de caja (no cúbica): un vértice por celda con cambio de
// signo y un quad por arista cruzada. Igual que lib/specimens/polygonize, pero con
// dimensiones y origen arbitrarios (las piezas son planas y anchas: un cubo desperdicia
// la mitad de la memoria). Las «sillas» (caras con esquinas alternadas) se resuelven
// antes, para que cada arista la compartan exactamente dos triángulos.

export type Box = { nx: number; ny: number; nz: number; x0: number; y0: number; z0: number; h: number; f: Float32Array }
export type NetMesh = { positions: Float32Array; indices: Uint32Array }

export function makeBox(min: [number, number, number], max: [number, number, number], h: number, fill: number): Box {
  const nx = Math.max(2, Math.ceil((max[0] - min[0]) / h)), ny = Math.max(2, Math.ceil((max[1] - min[1]) / h)), nz = Math.max(2, Math.ceil((max[2] - min[2]) / h))
  const f = new Float32Array((nx + 1) * (ny + 1) * (nz + 1)).fill(fill)
  return { nx, ny, nz, x0: min[0], y0: min[1], z0: min[2], h, f }
}

// aplica op(valorActual, x, y, z) en la sub-caja que contiene [lo, hi]
export function region(b: Box, lo: [number, number, number], hi: [number, number, number], op: (cur: number, x: number, y: number, z: number) => number) {
  const { nx, ny, nz, x0, y0, z0, h, f } = b, sx = nx + 1, sxy = sx * (ny + 1)
  const i0 = Math.max(0, Math.floor((lo[0] - x0) / h)), i1 = Math.min(nx, Math.ceil((hi[0] - x0) / h))
  const j0 = Math.max(0, Math.floor((lo[1] - y0) / h)), j1 = Math.min(ny, Math.ceil((hi[1] - y0) / h))
  const k0 = Math.max(0, Math.floor((lo[2] - z0) / h)), k1 = Math.min(nz, Math.ceil((hi[2] - z0) / h))
  for (let k = k0; k <= k1; k++) {
    const z = z0 + k * h
    for (let j = j0; j <= j1; j++) {
      const y = y0 + j * h, row = j * sx + k * sxy
      for (let i = i0; i <= i1; i++) { const id = row + i; f[id] = op(f[id], x0 + i * h, y, z) }
    }
  }
}

function resolveSaddles(b: Box) {
  const { nx, ny, nz, f } = b, sx = nx + 1, sxy = sx * (ny + 1)
  const at = (i: number, j: number, k: number) => i + sx * j + sxy * k
  for (let pass = 0; pass < 8; pass++) {
    let fixed = 0
    const check = (a: number, c1: number, c2: number, d: number) => {
      const sa = f[a] < 0, sb = f[c1] < 0, sc = f[c2] < 0, sd = f[d] < 0
      if (sa === sd && sb === sc && sa !== sb) {
        const [i1, i2] = sa ? [a, d] : [c1, c2]
        f[f[i1] > f[i2] ? i1 : i2] = 1e-4
        fixed++
      }
    }
    for (let k = 0; k <= nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) check(at(i, j, k), at(i + 1, j, k), at(i, j + 1, k), at(i + 1, j + 1, k))
    for (let k = 0; k < nz; k++) for (let j = 0; j <= ny; j++) for (let i = 0; i < nx; i++) check(at(i, j, k), at(i + 1, j, k), at(i, j, k + 1), at(i + 1, j, k + 1))
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i <= nx; i++) check(at(i, j, k), at(i, j + 1, k), at(i, j, k + 1), at(i, j + 1, k + 1))
    if (!fixed) break
  }
}

const CORNERS = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]]
const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]

export function nets(b: Box): NetMesh {
  // el borde de la caja siempre afuera: la malla cierra
  const { nx, ny, nz, x0, y0, z0, h, f } = b, sx = nx + 1, sxy = sx * (ny + 1)
  for (let k = 0; k <= nz; k++) for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++)
    if (i === 0 || j === 0 || k === 0 || i === nx || j === ny || k === nz) f[i + sx * j + sxy * k] = Math.max(f[i + sx * j + sxy * k], 1e-3)
  resolveSaddles(b)
  const at = (i: number, j: number, k: number) => i + sx * j + sxy * k
  const cell = new Map<number, number>(), cid = (i: number, j: number, k: number) => i + nx * (j + ny * k)
  const pos: number[] = [], v = new Float32Array(8)
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    let mask = 0
    for (let c = 0; c < 8; c++) { v[c] = f[at(i + CORNERS[c][0], j + CORNERS[c][1], k + CORNERS[c][2])]; if (v[c] < 0) mask |= 1 << c }
    if (mask === 0 || mask === 255) continue
    let px = 0, py = 0, pz = 0, cnt = 0
    for (const [a, c] of EDGES) {
      const va = v[a], vb = v[c]
      if ((va < 0) === (vb < 0)) continue
      const t = va / (va - vb), A = CORNERS[a], B = CORNERS[c]
      px += A[0] + t * (B[0] - A[0]); py += A[1] + t * (B[1] - A[1]); pz += A[2] + t * (B[2] - A[2]); cnt++
    }
    cell.set(cid(i, j, k), pos.length / 3)
    pos.push(x0 + (i + px / cnt) * h, y0 + (j + py / cnt) * h, z0 + (k + pz / cnt) * h)
  }
  const tris: number[] = []
  const E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  for (let k = 1; k < nz; k++) for (let j = 1; j < ny; j++) for (let i = 1; i < nx; i++) {
    const inside = f[at(i, j, k)] < 0
    for (let a = 0; a < 3; a++) {
      const ea = E[a]
      if (inside === (f[at(i + ea[0], j + ea[1], k + ea[2])] < 0)) continue
      const eb = E[(a + 1) % 3], ec = E[(a + 2) % 3]
      const q0 = cell.get(cid(i, j, k)), q1 = cell.get(cid(i - eb[0], j - eb[1], k - eb[2]))
      const q2 = cell.get(cid(i - eb[0] - ec[0], j - eb[1] - ec[1], k - eb[2] - ec[2])), q3 = cell.get(cid(i - ec[0], j - ec[1], k - ec[2]))
      if (q0 === undefined || q1 === undefined || q2 === undefined || q3 === undefined) continue
      if (inside) tris.push(q0, q1, q2, q0, q2, q3)
      else tris.push(q0, q2, q1, q0, q3, q2)
    }
  }
  return keepLargest({ positions: Float32Array.from(pos), indices: Uint32Array.from(tris) })
}

// Se queda con la componente conexa de más volumen (descarta gotas sueltas).
export function keepLargest(m: NetMesh): NetMesh {
  const P = m.positions, I = m.indices, V = P.length / 3
  const parent = new Int32Array(V); for (let i = 0; i < V; i++) parent[i] = i
  const find = (x: number): number => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x] } return x }
  for (let t = 0; t < I.length; t += 3) { const a = find(I[t]), b = find(I[t + 1]), c = find(I[t + 2]); parent[b] = a; parent[find(c)] = a }
  const vol = new Map<number, number>()
  for (let t = 0; t < I.length; t += 3) {
    const a = 3 * I[t], b = 3 * I[t + 1], c = 3 * I[t + 2]
    const v = (P[a] * (P[b + 1] * P[c + 2] - P[b + 2] * P[c + 1]) - P[a + 1] * (P[b] * P[c + 2] - P[b + 2] * P[c]) + P[a + 2] * (P[b] * P[c + 1] - P[b + 1] * P[c])) / 6
    const r = find(I[t]); vol.set(r, (vol.get(r) ?? 0) + v)
  }
  let best = -1, bv = -Infinity
  for (const [r, v] of vol) if (v > bv) { bv = v; best = r }
  if (vol.size <= 1) return m
  const remap = new Int32Array(V).fill(-1), op: number[] = [], oi: number[] = []
  for (let t = 0; t < I.length; t += 3) {
    if (find(I[t]) !== best) continue
    for (let q = 0; q < 3; q++) { const v = I[t + q]; if (remap[v] < 0) { remap[v] = op.length / 3; op.push(P[3 * v], P[3 * v + 1], P[3 * v + 2]) } oi.push(remap[v]) }
  }
  return { positions: Float32Array.from(op), indices: Uint32Array.from(oi) }
}
