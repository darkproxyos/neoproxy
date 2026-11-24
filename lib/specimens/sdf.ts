// Campos escalares: convención f < 0 adentro, f > 0 afuera, dentro de [-1,1]^3.
// No son SDF exactos (el gyroide o el mandelbulb no lo son), solo campos con
// signo coherente: alcanza para extraer la superficie en f = 0.

export type Field = (x: number, y: number, z: number) => number

export const smax = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.max(a, b) + h * h * k * 0.25
}
export const smin = (a: number, b: number, k: number) => -smax(-a, -b, k)

export function sdSphere(x: number, y: number, z: number, r: number) {
  return Math.hypot(x, y, z) - r
}

export function sdCapsule(
  x: number, y: number, z: number,
  ax: number, ay: number, az: number, bx: number, by: number, bz: number, r: number,
) {
  const pax = x - ax, pay = y - ay, paz = z - az
  const bax = bx - ax, bay = by - ay, baz = bz - az
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz || 1)))
  return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - r
}

export function sdRoundBox(x: number, y: number, z: number, hx: number, hy: number, hz: number, r: number) {
  const qx = Math.abs(x) - hx + r, qy = Math.abs(y) - hy + r, qz = Math.abs(z) - hz + r
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r
}

export function sdTorus(x: number, y: number, z: number, R: number, r: number) {
  return Math.hypot(Math.hypot(x, y) - R, z) - r
}

export function sdCylinder(x: number, y: number, z: number, r: number, h: number) {
  const dx = Math.hypot(x, y) - r, dy = Math.abs(z) - h
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0))
}

export type EnvelopeKind = 'sphere' | 'box' | 'capsule' | 'torus' | 'cylinder'
export const ENVELOPES: readonly EnvelopeKind[] = ['sphere', 'box', 'capsule', 'torus', 'cylinder']

// Contorno que contiene a la forma para que nunca toque el borde de la grilla
// (una superficie abierta en el borde no es imprimible).
export function envelope(kind: EnvelopeKind, x: number, y: number, z: number): number {
  switch (kind) {
    case 'sphere': return sdSphere(x, y, z, 0.86)
    case 'box': return sdRoundBox(x, y, z, 0.7, 0.7, 0.7, 0.12)
    case 'capsule': return sdCapsule(x, y, z, 0, 0, -0.5, 0, 0, 0.5, 0.42)
    case 'torus': return sdTorus(x, y, z, 0.55, 0.3)
    case 'cylinder': return sdCylinder(x, y, z, 0.62, 0.8)
  }
}

// Plano de apoyo: un corte plano abajo da base estable sin soportes.
export const flatBase = (z: number, zCut: number) => zCut - z
