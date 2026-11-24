// Surface nets ingenuos sobre una grilla regular en [-1,1]^3. Un vértice por
// celda con cruce de signo (promedio de los cruces por arista) y un quad por
// arista de la grilla con cambio de signo. A diferencia de marching cubes
// clásico, no deja agujeros en los casos ambiguos: cada arista del quad la
// comparten dos quads, que es lo que necesita una malla imprimible.

import type { Field } from './sdf'

export type Mesh = { positions: Float32Array; indices: Uint32Array }
export type Grid = { N: number; values: Float32Array }

export function sampleGrid(field: Field, N: number): Grid {
  const S = N + 1
  const values = new Float32Array(S * S * S)
  const step = 2 / N
  let i = 0
  for (let k = 0; k < S; k++) {
    const z = -1 + k * step
    for (let j = 0; j < S; j++) {
      const y = -1 + j * step
      for (let ii = 0; ii < S; ii++) values[i++] = field(-1 + ii * step, y, z)
    }
  }
  return { N, values }
}

const CORNERS: [number, number, number][] = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
]
const EDGES: [number, number][] = [
  [0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7],
]

// Una cara de la grilla cuyas 4 esquinas alternan de signo (silla) genera 4
// quads sobre la misma arista de celdas: arista no-manifold. Se invierte, en
// la esquina más cercana a cero, el signo de una de las dos diagonales; el
// cambio de superficie es mínimo y repetir hasta que no queden sillas lo
// resuelve (en la práctica converge en 2-4 pasadas).
export function resolveSaddles(grid: Grid, maxPasses = 8): number {
  const { N, values: f } = grid
  const S = N + 1
  const at = (i: number, j: number, k: number) => i + S * (j + S * k)
  let total = 0
  for (let pass = 0; pass < maxPasses; pass++) {
    let fixed = 0
    const check = (a: number, b: number, c: number, d: number) => {
      const sa = f[a] < 0, sb = f[b] < 0, sc = f[c] < 0, sd = f[d] < 0
      if (sa === sd && sb === sc && sa !== sb) {
        // siempre se saca una esquina interior (la menos profunda): el
        // proceso es monótono (solo erosiona), así que termina; invertir
        // en ambos sentidos oscilaba entre caras vecinas.
        const [i1, i2] = sa ? [a, d] : [b, c]
        f[f[i1] > f[i2] ? i1 : i2] = 1e-4
        fixed++
      }
    }
    for (let k = 0; k <= N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++)
      check(at(i, j, k), at(i + 1, j, k), at(i, j + 1, k), at(i + 1, j + 1, k))
    for (let k = 0; k < N; k++) for (let j = 0; j <= N; j++) for (let i = 0; i < N; i++)
      check(at(i, j, k), at(i + 1, j, k), at(i, j, k + 1), at(i + 1, j, k + 1))
    for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i <= N; i++)
      check(at(i, j, k), at(i, j + 1, k), at(i, j, k + 1), at(i, j + 1, k + 1))
    total += fixed
    if (!fixed) break
  }
  return total
}

export function polygonize(grid: Grid): Mesh {
  resolveSaddles(grid)
  const { N, values: f } = grid
  const S = N + 1
  const idx = (i: number, j: number, k: number) => i + S * (j + S * k)
  const cellVert = new Int32Array(N * N * N).fill(-1)
  const cidx = (i: number, j: number, k: number) => i + N * (j + N * k)
  const pos: number[] = []
  const step = 2 / N
  const v = new Float32Array(8)

  for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    let mask = 0
    for (let c = 0; c < 8; c++) {
      const [cx, cy, cz] = CORNERS[c]
      v[c] = f[idx(i + cx, j + cy, k + cz)]
      if (v[c] < 0) mask |= 1 << c
    }
    if (mask === 0 || mask === 255) continue
    let sx = 0, sy = 0, sz = 0, cnt = 0
    for (const [a, b] of EDGES) {
      const va = v[a], vb = v[b]
      if ((va < 0) === (vb < 0)) continue
      const t = va / (va - vb)
      const [ax, ay, az] = CORNERS[a], [bx, by, bz] = CORNERS[b]
      sx += ax + t * (bx - ax); sy += ay + t * (by - ay); sz += az + t * (bz - az)
      cnt++
    }
    cellVert[cidx(i, j, k)] = pos.length / 3
    pos.push(-1 + (i + sx / cnt) * step, -1 + (j + sy / cnt) * step, -1 + (k + sz / cnt) * step)
  }

  const tris: number[] = []
  const e: [number, number, number][] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  for (let k = 1; k < N; k++) for (let j = 1; j < N; j++) for (let i = 1; i < N; i++) {
    const inside = f[idx(i, j, k)] < 0
    for (let a = 0; a < 3; a++) {
      const ea = e[a]
      const outside = f[idx(i + ea[0], j + ea[1], k + ea[2])] < 0
      if (inside === outside) continue
      const eb = e[(a + 1) % 3], ec = e[(a + 2) % 3]
      const q0 = cellVert[cidx(i, j, k)]
      const q1 = cellVert[cidx(i - eb[0], j - eb[1], k - eb[2])]
      const q2 = cellVert[cidx(i - eb[0] - ec[0], j - eb[1] - ec[1], k - eb[2] - ec[2])]
      const q3 = cellVert[cidx(i - ec[0], j - ec[1], k - ec[2])]
      if (q0 < 0 || q1 < 0 || q2 < 0 || q3 < 0) continue
      if (inside) tris.push(q0, q1, q2, q0, q2, q3)
      else tris.push(q0, q2, q1, q0, q3, q2)
    }
  }

  return { positions: new Float32Array(pos), indices: new Uint32Array(tris) }
}

// Muestreo trilineal de la grilla (para estimar espesores sin volver a evaluar el campo).
export function sampleAt(grid: Grid, x: number, y: number, z: number): number {
  const { N, values: f } = grid
  const S = N + 1
  const gx = (x + 1) * 0.5 * N, gy = (y + 1) * 0.5 * N, gz = (z + 1) * 0.5 * N
  if (gx < 0 || gy < 0 || gz < 0 || gx > N || gy > N || gz > N) return 1
  const i = Math.min(N - 1, Math.floor(gx)), j = Math.min(N - 1, Math.floor(gy)), k = Math.min(N - 1, Math.floor(gz))
  const tx = gx - i, ty = gy - j, tz = gz - k
  const at = (a: number, b: number, c: number) => f[a + S * (b + S * c)]
  const c00 = at(i, j, k) * (1 - tx) + at(i + 1, j, k) * tx
  const c10 = at(i, j + 1, k) * (1 - tx) + at(i + 1, j + 1, k) * tx
  const c01 = at(i, j, k + 1) * (1 - tx) + at(i + 1, j, k + 1) * tx
  const c11 = at(i, j + 1, k + 1) * (1 - tx) + at(i + 1, j + 1, k + 1) * tx
  return (c00 * (1 - ty) + c10 * ty) * (1 - tz) + (c01 * (1 - ty) + c11 * ty) * tz
}
