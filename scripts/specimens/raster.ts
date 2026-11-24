// Rasterizador por software (solo Node, para las miniaturas): proyección
// ortográfica, z-buffer, normales suaves, luz principal + relleno + borde.
// Evita depender de un navegador para renderizar 150 miniaturas.

import type { Mesh } from '../../lib/specimens/polygonize'

type Opts = { size: number; color: [number, number, number]; azimuth?: number; elevation?: number }

// La malla debe venir ya orientada con +z arriba (orientForPrint).
export function renderMesh(mesh: Mesh, opts: Opts): Uint8Array {
  const { size, color } = opts
  const az = ((opts.azimuth ?? 38) * Math.PI) / 180
  const el = ((opts.elevation ?? 26) * Math.PI) / 180
  const P = mesh.positions, I = mesh.indices
  const V = P.length / 3, F = I.length / 3

  // centrar y escalar a la vista
  let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  for (let i = 0; i < V; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2
  const radius = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2

  // base de cámara
  const dir = [Math.cos(el) * Math.cos(az), Math.cos(el) * Math.sin(az), Math.sin(el)] // hacia la cámara
  const right = [-Math.sin(az), Math.cos(az), 0]
  const up = [
    dir[1] * right[2] - dir[2] * right[1],
    dir[2] * right[0] - dir[0] * right[2],
    dir[0] * right[1] - dir[1] * right[0],
  ]
  const sc = (size * 0.46) / radius

  const sx = new Float32Array(V), sy = new Float32Array(V), sd = new Float32Array(V)
  for (let i = 0; i < V; i++) {
    const x = P[i * 3] - cx, y = P[i * 3 + 1] - cy, z = P[i * 3 + 2] - cz
    sx[i] = size / 2 + (x * right[0] + y * right[1] + z * right[2]) * sc
    sy[i] = size / 2 - (x * up[0] + y * up[1] + z * up[2]) * sc
    sd[i] = x * dir[0] + y * dir[1] + z * dir[2]
  }

  // normales suaves
  const nx = new Float32Array(V), ny = new Float32Array(V), nz = new Float32Array(V)
  for (let f = 0; f < F; f++) {
    const a = I[f * 3], b = I[f * 3 + 1], c = I[f * 3 + 2]
    const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2]
    const wx = P[c * 3] - P[a * 3], wy = P[c * 3 + 1] - P[a * 3 + 1], wz = P[c * 3 + 2] - P[a * 3 + 2]
    const fx = uy * wz - uz * wy, fy = uz * wx - ux * wz, fz = ux * wy - uy * wx
    for (const v of [a, b, c]) { nx[v] += fx; ny[v] += fy; nz[v] += fz }
  }
  for (let i = 0; i < V; i++) {
    const l = Math.hypot(nx[i], ny[i], nz[i]) || 1
    nx[i] /= l; ny[i] /= l; nz[i] /= l
  }

  const key = norm([-0.5, -0.35, 0.8])
  const fill = norm([0.7, 0.4, 0.2])
  const buf = new Uint8Array(size * size * 4)
  const zbuf = new Float32Array(size * size).fill(-Infinity)
  // fondo oscuro con leve viñeta
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const o = (y * size + x) * 4
    const d = Math.hypot(x - size / 2, y - size / 2) / (size * 0.7)
    const g = Math.max(0, 1 - d)
    buf[o] = 7 + g * 10; buf[o + 1] = 10 + g * 14; buf[o + 2] = 16 + g * 20; buf[o + 3] = 255
  }

  for (let f = 0; f < F; f++) {
    const a = I[f * 3], b = I[f * 3 + 1], c = I[f * 3 + 2]
    const x0 = sx[a], y0 = sy[a], x1 = sx[b], y1 = sy[b], x2 = sx[c], y2 = sy[c]
    const den = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2)
    if (Math.abs(den) < 1e-9) continue
    const bx0 = Math.max(0, Math.floor(Math.min(x0, x1, x2))), bx1 = Math.min(size - 1, Math.ceil(Math.max(x0, x1, x2)))
    const by0 = Math.max(0, Math.floor(Math.min(y0, y1, y2))), by1 = Math.min(size - 1, Math.ceil(Math.max(y0, y1, y2)))
    for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
      const px = x + 0.5, py = y + 0.5
      const l0 = ((y1 - y2) * (px - x2) + (x2 - x1) * (py - y2)) / den
      const l1 = ((y2 - y0) * (px - x2) + (x0 - x2) * (py - y2)) / den
      const l2 = 1 - l0 - l1
      if (l0 < 0 || l1 < 0 || l2 < 0) continue
      const depth = l0 * sd[a] + l1 * sd[b] + l2 * sd[c]
      const zi = y * size + x
      if (depth <= zbuf[zi]) continue
      zbuf[zi] = depth
      let n0 = l0 * nx[a] + l1 * nx[b] + l2 * nx[c]
      let n1 = l0 * ny[a] + l1 * ny[b] + l2 * ny[c]
      let n2 = l0 * nz[a] + l1 * nz[b] + l2 * nz[c]
      const nl = Math.hypot(n0, n1, n2) || 1
      n0 /= nl; n1 /= nl; n2 /= nl
      const diff = Math.max(0, n0 * key[0] + n1 * key[1] + n2 * key[2])
      const fl = Math.max(0, n0 * fill[0] + n1 * fill[1] + n2 * fill[2])
      const facing = Math.max(0, n0 * dir[0] + n1 * dir[1] + n2 * dir[2])
      const rim = Math.pow(1 - facing, 3)
      const spec = Math.pow(Math.max(0, facing * 0.6 + diff * 0.4), 24) * 0.35
      const lum = 0.16 + diff * 0.72 + fl * 0.18
      const o = zi * 4
      for (let k = 0; k < 3; k++) {
        buf[o + k] = Math.min(255, color[k] * lum + rim * 70 + spec * 255)
      }
    }
  }
  return buf
}

function norm(v: number[]) {
  const l = Math.hypot(v[0], v[1], v[2])
  return [v[0] / l, v[1] / l, v[2] / l]
}
