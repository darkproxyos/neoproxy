// ARSENAL — mallas con aristas vivas: dual contouring sobre la topología de surface nets.
//
// Surface nets pone el vértice de cada celda en el promedio de los cruces de sus aristas: las
// esquinas y los cantos salen redondeados (la katana v1). Dual contouring usa además la normal
// del campo en cada cruce: cada cruce es un plano, y el vértice va al punto que mejor cumple
// todos los planos de su celda (un mínimo de cuadrados, la QEF). En una cara plana queda sobre
// la cara; en un canto, sobre la recta donde se cortan las dos caras; en una esquina, en la
// esquina. La topología es la misma de surface nets (un vértice por celda con cambio de signo,
// un quad por arista cruzada), así que la malla sigue siendo cerrada y sin aristas repetidas.
//
// Las normales salen del propio campo (diferencias hacia adelante), así que el campo tiene que
// poder evaluarse en cualquier punto. Para que llenar la grilla no cueste tanto, se recorre con
// z adentro: los campos de este módulo guardan la parte 2D (x, y) de la última columna.

import { makeBox, keepLargest, resolveSaddles, type NetMesh } from '../antesis/nets'

export type Fn3 = (x: number, y: number, z: number) => number
export type V3 = [number, number, number]

// Ajustes del solver: tirón hacia el centro de masa (estabiliza caras planas y bordes) y paso
// de las diferencias finitas.
const LAMBDA = 0.04, EPS = 1e-3

class Grow {
  a: Float64Array; n = 0
  constructor(cap: number) { this.a = new Float64Array(cap) }
  ensure(k: number) { if (this.n + k > this.a.length) { const b = new Float64Array(Math.max(this.a.length * 2, this.n + k)); b.set(this.a); this.a = b } }
}

export function dcMesh(fn: Fn3, lo: V3, hi: V3, h: number): NetMesh {
  const b = makeBox(lo, hi, h, 1)
  const { nx, ny, nz, x0, y0, z0, f } = b, sx = nx + 1, sxy = sx * (ny + 1)
  // z adentro: los campos reutilizan su parte 2D mientras (x, y) no cambia
  for (let j = 0; j <= ny; j++) {
    const y = y0 + j * h
    for (let i = 0; i <= nx; i++) {
      const x = x0 + i * h, base = i + sx * j
      for (let k = 0; k <= nz; k++) f[base + sxy * k] = fn(x, y, z0 + k * h)
    }
  }
  for (let k = 0; k <= nz; k++) for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++)
    if (i === 0 || j === 0 || k === 0 || i === nx || j === ny || k === nz) f[i + sx * j + sxy * k] = Math.max(f[i + sx * j + sxy * k], 1e-3)
  resolveSaddles(b)

  const cellV = new Int32Array(nx * ny * nz).fill(-1)
  const S = 15
  const Q = new Grow(1 << 16) // por vértice: ata(6) atb(3) masa(3) cuenta(1) btb(1) celda(1) = 15
  const quads: number[] = []
  const vert = (c: number) => {
    let v = cellV[c]
    if (v < 0) { v = Q.n / S; Q.ensure(S); Q.a.fill(0, Q.n, Q.n + S); Q.a[Q.n + 14] = c; Q.n += S; cellV[c] = v }
    return v
  }
  const cid = (i: number, j: number, k: number) => i + nx * (j + ny * k)
  const E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  for (let k = 1; k < nz; k++) for (let j = 1; j < ny; j++) for (let i = 1; i < nx; i++) {
    const id0 = i + sx * j + sxy * k, f0 = f[id0], inside = f0 < 0
    for (let a = 0; a < 3; a++) {
      const ea = E[a], f1 = f[id0 + ea[0] + sx * ea[1] + sxy * ea[2]]
      if (inside === (f1 < 0)) continue
      const eb = E[(a + 1) % 3], ec = E[(a + 2) % 3]
      const c0 = cid(i, j, k), c1 = cid(i - eb[0], j - eb[1], k - eb[2])
      const c2 = cid(i - eb[0] - ec[0], j - eb[1] - ec[1], k - eb[2] - ec[2]), c3 = cid(i - ec[0], j - ec[1], k - ec[2])
      // cruce (regula falsi «Illinois» sobre el campo exacto: en una esquina el campo no es lineal a lo
      // largo de la arista y la interpolación sola dejaría el plano corrido) y normal del campo
      const ax = x0 + i * h, ay = y0 + j * h, az = z0 + k * h
      let ta = 0, fa = f0, tb = 1, fb = f1, sd = 0, t = f0 / (f0 - f1)
      for (let it = 0; it < 8; it++) {
        const ft = fn(ax + t * ea[0] * h, ay + t * ea[1] * h, az + t * ea[2] * h)
        if (Math.abs(ft) < 1e-6) break
        if ((ft < 0) === (fb < 0)) { tb = t; fb = ft; if (sd === -1) fa /= 2; sd = -1 } else { ta = t; fa = ft; if (sd === 1) fb /= 2; sd = 1 }
        t = (ta * fb - tb * fa) / (fb - fa)
      }
      const px = ax + t * ea[0] * h, py = ay + t * ea[1] * h, pz = az + t * ea[2] * h
      const fp = fn(px, py, pz), gz = fn(px, py, pz + EPS) - fp, gx = fn(px + EPS, py, pz) - fp, gy = fn(px, py + EPS, pz) - fp
      const L = Math.hypot(gx, gy, gz)
      const vs = [vert(c0), vert(c1), vert(c2), vert(c3)]
      if (L > 1e-12) {
        // si el cruce quedó fuera de la superficie (f ≠ 0), el plano se corre lo que falta (Newton)
        const nxn = gx / L, nyn = gy / L, nzn = gz / L, corr = Math.max(-0.5 * h, Math.min(0.5 * h, (fp * EPS) / L))
        const qx = px - nxn * corr, qy = py - nyn * corr, qz = pz - nzn * corr, d = nxn * qx + nyn * qy + nzn * qz
        for (const v of vs) {
          const o = v * S, A = Q.a
          A[o] += nxn * nxn; A[o + 1] += nxn * nyn; A[o + 2] += nxn * nzn; A[o + 3] += nyn * nyn; A[o + 4] += nyn * nzn; A[o + 5] += nzn * nzn
          A[o + 6] += nxn * d; A[o + 7] += nyn * d; A[o + 8] += nzn * d
          A[o + 9] += qx; A[o + 10] += qy; A[o + 11] += qz; A[o + 12]++; A[o + 13] += d * d
        }
      } else {
        for (const v of vs) { const o = v * S, A = Q.a; A[o + 9] += px; A[o + 10] += py; A[o + 11] += pz; A[o + 12]++ }
      }
      quads.push(vs[0], vs[1], vs[2], vs[3], inside ? 1 : 0)
    }
  }

  // vértices: mínimo de la QEF con un tirón hacia el centro de masa, dentro de su celda
  const nv = Q.n / S, P = new Float32Array(nv * 3), A = Q.a
  for (let v = 0; v < nv; v++) {
    const o = v * S, cnt = A[o + 12] || 1
    const mx = A[o + 9] / cnt, my = A[o + 10] / cnt, mz = A[o + 11] / cnt
    const a00 = A[o] + LAMBDA, a01 = A[o + 1], a02 = A[o + 2], a11 = A[o + 3] + LAMBDA, a12 = A[o + 4], a22 = A[o + 5] + LAMBDA
    const b0 = A[o + 6] + LAMBDA * mx, b1 = A[o + 7] + LAMBDA * my, b2 = A[o + 8] + LAMBDA * mz
    const c00 = a11 * a22 - a12 * a12, c01 = a02 * a12 - a01 * a22, c02 = a01 * a12 - a02 * a11
    const det = a00 * c00 + a01 * c01 + a02 * c02
    let x = mx, y = my, z = mz
    if (Math.abs(det) > 1e-12) {
      const c11 = a00 * a22 - a02 * a02, c12 = a01 * a02 - a00 * a12, c22 = a00 * a11 - a01 * a01
      x = (c00 * b0 + c01 * b1 + c02 * b2) / det; y = (c01 * b0 + c11 * b1 + c12 * b2) / det; z = (c02 * b0 + c12 * b1 + c22 * b2) / det
    }
    const c = A[o + 14], ci = c % nx, cj = Math.floor(c / nx) % ny, ck = Math.floor(c / (nx * ny))
    const lx = x0 + ci * h, ly = y0 + cj * h, lz = z0 + ck * h
    const cl = (u: number, lo: number) => Math.min(lo + h, Math.max(lo, u))
    // si el óptimo cae fuera de su celda (la esquina es de otra), entre el óptimo recortado contra la
    // celda y el centro de masa se queda el que mejor cumple los planos: una esquina cóncava pide lo
    // primero (el centro de masa caería sobre la cuerda, fuera de las dos caras); una cara rozada, lo segundo
    const qef = (px: number, py: number, pz: number) =>
      A[o] * px * px + 2 * A[o + 1] * px * py + 2 * A[o + 2] * px * pz + A[o + 3] * py * py + 2 * A[o + 4] * py * pz + A[o + 5] * pz * pz
      - 2 * (A[o + 6] * px + A[o + 7] * py + A[o + 8] * pz) + A[o + 13]
    let px = cl(x, lx), py = cl(y, ly), pz = cl(z, lz)
    if (px !== x || py !== y || pz !== z) {
      const qx = cl(mx, lx), qy = cl(my, ly), qz = cl(mz, lz)
      if (qef(qx, qy, qz) < qef(px, py, pz)) { px = qx; py = qy; pz = qz }
    }
    P[3 * v] = px; P[3 * v + 1] = py; P[3 * v + 2] = pz
  }

  // quads → triángulos: la diagonal que deja los dos triángulos más parecidos (sigue los cantos)
  const tris = new Uint32Array((quads.length / 5) * 6)
  const nrm = (a: number, b: number, c: number, out: number[]) => {
    const ux = P[3 * b] - P[3 * a], uy = P[3 * b + 1] - P[3 * a + 1], uz = P[3 * b + 2] - P[3 * a + 2]
    const wx = P[3 * c] - P[3 * a], wy = P[3 * c + 1] - P[3 * a + 1], wz = P[3 * c + 2] - P[3 * a + 2]
    const x = uy * wz - uz * wy, y = uz * wx - ux * wz, z = ux * wy - uy * wx, L = Math.hypot(x, y, z) || 1
    out[0] = x / L; out[1] = y / L; out[2] = z / L
  }
  const n1 = [0, 0, 0], n2 = [0, 0, 0]
  let t = 0
  for (let q = 0; q < quads.length; q += 5) {
    const q0 = quads[q], q1 = quads[q + 1], q2 = quads[q + 2], q3 = quads[q + 3], ins = quads[q + 4] === 1
    nrm(q0, q1, q2, n1); nrm(q0, q2, q3, n2); const dA = n1[0] * n2[0] + n1[1] * n2[1] + n1[2] * n2[2]
    nrm(q0, q1, q3, n1); nrm(q1, q2, q3, n2); const dB = n1[0] * n2[0] + n1[1] * n2[1] + n1[2] * n2[2]
    if (dA >= dB) {
      if (ins) { tris[t++] = q0; tris[t++] = q1; tris[t++] = q2; tris[t++] = q0; tris[t++] = q2; tris[t++] = q3 }
      else { tris[t++] = q0; tris[t++] = q2; tris[t++] = q1; tris[t++] = q0; tris[t++] = q3; tris[t++] = q2 }
    } else {
      if (ins) { tris[t++] = q0; tris[t++] = q1; tris[t++] = q3; tris[t++] = q1; tris[t++] = q2; tris[t++] = q3 }
      else { tris[t++] = q0; tris[t++] = q3; tris[t++] = q1; tris[t++] = q1; tris[t++] = q3; tris[t++] = q2 }
    }
  }
  return keepLargest({ positions: P, indices: tris })
}
