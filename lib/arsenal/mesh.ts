// ARSENAL — utilidades de malla: espejos, orientación de impresión, cama, normales con cantos
// vivos para la vista y tubos.

import type { NetMesh } from '../antesis/nets'

export type Mesh = NetMesh
export type Rot = number[][] | null

export const RX180: number[][] = [[1, 0, 0], [0, -1, 0], [0, 0, -1]]          // cara de arriba abajo (lámina B)
export const AXIS_UP_X: number[][] = [[0, 0, 1], [0, -1, 0], [1, 0, 0]]       // la cara de x menor queda abajo

// espejo z → −z (invierte el orden de los triángulos para que sigan mirando hacia afuera)
export function mirrorZ(m: Mesh): Mesh {
  const P = Float32Array.from(m.positions), I = Uint32Array.from(m.indices)
  for (let i = 2; i < P.length; i += 3) P[i] = -P[i]
  for (let t = 0; t < I.length; t += 3) { const a = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = a }
  return { positions: P, indices: I }
}
export function translate(m: Mesh, dx: number, dy: number, dz: number): Mesh {
  const P = Float32Array.from(m.positions)
  for (let i = 0; i < P.length; i += 3) { P[i] += dx; P[i + 1] += dy; P[i + 2] += dz }
  return { positions: P, indices: m.indices }
}

// Impresión: rotación (filas), piso en z = 0 y centrado en x/y.
export function orient(m: Mesh, R: Rot): Mesh {
  const P = new Float32Array(m.positions.length)
  for (let i = 0; i < P.length; i += 3) {
    const x = m.positions[i], y = m.positions[i + 1], z = m.positions[i + 2]
    if (R) { P[i] = R[0][0] * x + R[0][1] * y + R[0][2] * z; P[i + 1] = R[1][0] * x + R[1][1] * y + R[1][2] * z; P[i + 2] = R[2][0] * x + R[2][1] * y + R[2][2] * z }
    else { P[i] = x; P[i + 1] = y; P[i + 2] = z }
  }
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], P[i + a]); mx[a] = Math.max(mx[a], P[i + a]) }
  for (let i = 0; i < P.length; i += 3) { P[i] -= (mn[0] + mx[0]) / 2; P[i + 1] -= (mn[1] + mx[1]) / 2; P[i + 2] -= mn[2] }
  return { positions: P, indices: m.indices }
}
export function size(m: Mesh): [number, number, number] {
  const P = m.positions, mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], P[i + a]); mx[a] = Math.max(mx[a], P[i + a]) }
  return [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]]
}
export function bounds(m: Mesh): { min: [number, number, number]; max: [number, number, number] } {
  const P = m.positions, mn: [number, number, number] = [Infinity, Infinity, Infinity], mx: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], P[i + a]); mx[a] = Math.max(mx[a], P[i + a]) }
  return { min: mn, max: mx }
}
// ¿cabe en una cama cuadrada de lado B? Derecha o, si es larga y angosta, en diagonal.
export const fitsBed = (sz: [number, number, number], B: number) => {
  const L = Math.max(sz[0], sz[1]), S = Math.min(sz[0], sz[1])
  return L <= B - 2 || (L + S) / Math.SQRT2 <= B - 2
}

// Para la vista: cada esquina de triángulo con su normal, promediando solo las caras vecinas que
// doblan menos de `deg` grados (los cantos quedan vivos y las curvas suaves). Los triángulos
// marcados en `mark` salen aparte (el brillo de la fibra).
export function expandSmooth(m: Mesh, deg = 34, mark?: Uint8Array) {
  const P = m.positions, I = m.indices, nF = I.length / 3, nV = P.length / 3
  const fn = new Float32Array(nF * 3)
  const cnt = new Uint32Array(nV + 1)
  for (let f = 0; f < nF; f++) {
    const a = I[3 * f], b = I[3 * f + 1], c = I[3 * f + 2]
    const ux = P[3 * b] - P[3 * a], uy = P[3 * b + 1] - P[3 * a + 1], uz = P[3 * b + 2] - P[3 * a + 2]
    const wx = P[3 * c] - P[3 * a], wy = P[3 * c + 1] - P[3 * a + 1], wz = P[3 * c + 2] - P[3 * a + 2]
    fn[3 * f] = uy * wz - uz * wy; fn[3 * f + 1] = uz * wx - ux * wz; fn[3 * f + 2] = ux * wy - uy * wx // ponderada por área
    cnt[a + 1]++; cnt[b + 1]++; cnt[c + 1]++
  }
  for (let v = 0; v < nV; v++) cnt[v + 1] += cnt[v]
  const adj = new Uint32Array(cnt[nV]), fill = cnt.slice(0, nV)
  for (let f = 0; f < nF; f++) for (let q = 0; q < 3; q++) adj[fill[I[3 * f + q]]++] = f
  const cosT = Math.cos((deg * Math.PI) / 180)
  let nMark = 0
  if (mark) for (let f = 0; f < nF; f++) if (mark[f]) nMark++
  const out = { P: new Float32Array((nF - nMark) * 9), N: new Float32Array((nF - nMark) * 9), gP: new Float32Array(nMark * 9), gN: new Float32Array(nMark * 9) }
  let o = 0, g = 0
  for (let f = 0; f < nF; f++) {
    const fx = fn[3 * f], fy = fn[3 * f + 1], fz = fn[3 * f + 2], fl = Math.hypot(fx, fy, fz) || 1
    const glow = mark && mark[f], dP = glow ? out.gP : out.P, dN = glow ? out.gN : out.N, at = glow ? g : o
    for (let q = 0; q < 3; q++) {
      const v = I[3 * f + q]
      let nx = 0, ny = 0, nz = 0
      for (let k = cnt[v]; k < cnt[v + 1]; k++) {
        const h = adj[k], hx = fn[3 * h], hy = fn[3 * h + 1], hz = fn[3 * h + 2], hl = Math.hypot(hx, hy, hz) || 1
        if ((hx * fx + hy * fy + hz * fz) / (hl * fl) >= cosT) { nx += hx; ny += hy; nz += hz }
      }
      const L = Math.hypot(nx, ny, nz) || 1
      dP[at + 3 * q] = P[3 * v]; dP[at + 3 * q + 1] = P[3 * v + 1]; dP[at + 3 * q + 2] = P[3 * v + 2]
      dN[at + 3 * q] = nx / L; dN[at + 3 * q + 1] = ny / L; dN[at + 3 * q + 2] = nz / L
    }
    if (glow) g += 9; else o += 9
  }
  return out
}

// Tubo de radio r a lo largo de una polilínea 3D (cerrado con tapas).
export function tube(path: [number, number, number][], r: number, sides = 14): Mesh {
  const pos: number[] = [], idx: number[] = [], n = path.length
  for (let i = 0; i < n; i++) {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)]
    let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl
    // marco: u ⟂ t en el plano xy, v = t × u
    let ux = -ty, uy = tx; const uz = 0, ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul
    const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux
    for (let s = 0; s < sides; s++) {
      const th = (2 * Math.PI * s) / sides, c = Math.cos(th) * r, si = Math.sin(th) * r
      pos.push(path[i][0] + ux * c + vx * si, path[i][1] + uy * c + vy * si, path[i][2] + uz * c + vz * si)
    }
  }
  for (let i = 0; i < n - 1; i++) for (let s = 0; s < sides; s++) {
    const a = i * sides + s, b = i * sides + ((s + 1) % sides), c = a + sides, d = b + sides
    idx.push(a, b, c, b, d, c)
  }
  const c0 = pos.length / 3; pos.push(...path[0]); const c1 = pos.length / 3; pos.push(...path[n - 1])
  for (let s = 0; s < sides; s++) { const a = s, b = (s + 1) % sides; idx.push(c0, b, a); idx.push(c1, (n - 1) * sides + a, (n - 1) * sides + b) }
  return { positions: Float32Array.from(pos), indices: Uint32Array.from(idx) }
}

// holgura mínima: un campo (otra pieza) evaluado en los vértices elegidos de una malla
export function minField(m: Mesh, pick: (x: number, y: number, z: number) => boolean, fn: (x: number, y: number, z: number) => number): number {
  const P = m.positions
  let mn = Infinity
  for (let i = 0; i < P.length; i += 3) if (pick(P[i], P[i + 1], P[i + 2])) { const v = fn(P[i], P[i + 1], P[i + 2]); if (v < mn) mn = v }
  return mn
}

// Cantos vivos de una malla (aristas cuyas dos caras doblan más de `deg` grados), como segmentos.
export function creases(m: Mesh, deg = 38): Float32Array {
  const P = m.positions, I = m.indices, nF = I.length / 3, V = P.length / 3
  const fn = new Float32Array(nF * 3)
  for (let f = 0; f < nF; f++) {
    const a = I[3 * f], b = I[3 * f + 1], c = I[3 * f + 2]
    const ux = P[3 * b] - P[3 * a], uy = P[3 * b + 1] - P[3 * a + 1], uz = P[3 * b + 2] - P[3 * a + 2]
    const wx = P[3 * c] - P[3 * a], wy = P[3 * c + 1] - P[3 * a + 1], wz = P[3 * c + 2] - P[3 * a + 2]
    const x = uy * wz - uz * wy, y = uz * wx - ux * wz, z = ux * wy - uy * wx, L = Math.hypot(x, y, z) || 1
    fn[3 * f] = x / L; fn[3 * f + 1] = y / L; fn[3 * f + 2] = z / L
  }
  const first = new Map<number, number>(), cosT = Math.cos((deg * Math.PI) / 180), out: number[] = []
  for (let f = 0; f < nF; f++) for (let q = 0; q < 3; q++) {
    const u = I[3 * f + q], v = I[3 * f + ((q + 1) % 3)], key = u < v ? u * V + v : v * V + u
    const g = first.get(key)
    if (g === undefined) { first.set(key, f); continue }
    first.delete(key)
    if (fn[3 * f] * fn[3 * g] + fn[3 * f + 1] * fn[3 * g + 1] + fn[3 * f + 2] * fn[3 * g + 2] < cosT)
      out.push(P[3 * u], P[3 * u + 1], P[3 * u + 2], P[3 * v], P[3 * v + 1], P[3 * v + 2])
  }
  return Float32Array.from(out)
}
