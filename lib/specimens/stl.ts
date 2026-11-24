import type { Mesh } from './polygonize'

// STL binario (80 bytes de cabecera + uint32 de triángulos + 50 bytes por triángulo).
export function meshToBinarySTL(mesh: Mesh): ArrayBuffer {
  const { positions: P, indices: I } = mesh
  const F = I.length / 3
  const buf = new ArrayBuffer(84 + F * 50)
  const dv = new DataView(buf)
  dv.setUint32(80, F, true)
  let o = 84
  for (let f = 0; f < F; f++) {
    const ia = I[f * 3] * 3, ib = I[f * 3 + 1] * 3, ic = I[f * 3 + 2] * 3
    const ux = P[ib] - P[ia], uy = P[ib + 1] - P[ia + 1], uz = P[ib + 2] - P[ia + 2]
    const wx = P[ic] - P[ia], wy = P[ic + 1] - P[ia + 1], wz = P[ic + 2] - P[ia + 2]
    let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx
    const len = Math.hypot(nx, ny, nz) || 1
    nx /= len; ny /= len; nz /= len
    dv.setFloat32(o, nx, true); dv.setFloat32(o + 4, ny, true); dv.setFloat32(o + 8, nz, true)
    dv.setFloat32(o + 12, P[ia], true); dv.setFloat32(o + 16, P[ia + 1], true); dv.setFloat32(o + 20, P[ia + 2], true)
    dv.setFloat32(o + 24, P[ib], true); dv.setFloat32(o + 28, P[ib + 1], true); dv.setFloat32(o + 32, P[ib + 2], true)
    dv.setFloat32(o + 36, P[ic], true); dv.setFloat32(o + 40, P[ic + 1], true); dv.setFloat32(o + 44, P[ic + 2], true)
    o += 50
  }
  return buf
}
