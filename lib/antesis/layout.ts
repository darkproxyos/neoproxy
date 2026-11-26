// ANTESIS — dónde va cada engranaje.
//
// Los engranajes viven sobre una esfera, todos con el vértice de su cono en el centro
// (engranajes cónicos: los ejes se cruzan en un punto, así que el contacto entre dos
// vecinos es una línea que pasa por el centro). Hay dos clases, A y B, y cada A solo toca
// B y viceversa: el grafo de contactos es bipartito, por eso todos los ciclos son pares y
// la red entera gira junta (A en un sentido, B en el otro, vistos desde afuera).
//
// Tres arreglos, uno por cada grupo de simetría de los sólidos platónicos:
//   tetra  4 A en los vértices de un tetraedro, 4 B en los del tetraedro opuesto
//   octa   6 A en las caras de un cubo (3 vecinos en cruz), 8 B en sus vértices
//   icosa  12 A en los vértices de un icosaedro, 20 B en los centros de sus caras
// Alrededor de cada A hay kA vecinos B igualmente espaciados (3, 4 o 5) y alrededor de
// cada B, 3 vecinos A. Si NA es múltiplo de kA y NB de 3, se puede orientar cada
// engranaje para que mire a todos sus vecinos a la vez: un diente de A apunta a cada
// vecino y un hueco de B apunta a cada vecino. Así engranan todos al mismo tiempo.

export type V3 = [number, number, number]
export type Symmetry = 'tetra' | 'octa' | 'icosa'

export type Arrangement = {
  sym: Symmetry
  A: V3[]
  B: V3[]
  kA: number
  kB: number
  sigma: number   // ángulo entre un A y un B vecinos (rad)
  sigmaAA: number // ángulo mínimo entre dos A
  sigmaBB: number // ángulo mínimo entre dos B
  edges: [number, number][] // (índice A, índice B)
}

export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
export const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s]
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const angle = (a: V3, b: V3) => Math.acos(Math.max(-1, Math.min(1, dot(a, b))))

function minAngle(P: V3[]) {
  let m = Math.PI
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) m = Math.min(m, angle(P[i], P[j]))
  return m
}

function icosa(): { V: V3[]; F: V3[] } {
  const p = (1 + Math.sqrt(5)) / 2
  const raw: V3[] = []
  for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) { raw.push([0, s1, s2 * p], [s1, s2 * p, 0], [s2 * p, 0, s1]) }
  const V = raw.map(norm)
  // caras: ternas de vértices mutuamente vecinos (el ángulo más chico entre vértices)
  const e = minAngle(V) + 1e-6, F: V3[] = []
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++)
    if (angle(V[i], V[j]) < e && angle(V[j], V[k]) < e && angle(V[i], V[k]) < e) F.push(norm(add(add(V[i], V[j]), V[k])))
  return { V, F }
}

const cache = new Map<Symmetry, Arrangement>()

export function arrangement(sym: Symmetry): Arrangement {
  const hit = cache.get(sym); if (hit) return hit
  let A: V3[], B: V3[], kA: number
  if (sym === 'tetra') {
    A = ([[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]] as V3[]).map(norm)
    B = A.map((v) => scale(v, -1))
    kA = 3
  } else if (sym === 'octa') {
    A = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
    B = []
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) B.push(norm([x, y, z]))
    kA = 4
  } else {
    const ic = icosa(); A = ic.V; B = ic.F; kA = 5
  }
  // el ángulo A–B vecino es el mínimo entre clases
  let sigma = Math.PI
  for (const a of A) for (const b of B) sigma = Math.min(sigma, angle(a, b))
  const edges: [number, number][] = []
  A.forEach((a, i) => B.forEach((b, j) => { if (angle(a, b) < sigma + 1e-6) edges.push([i, j]) }))
  const out: Arrangement = { sym, A, B, kA, kB: 3, sigma, sigmaAA: minAngle(A), sigmaBB: minAngle(B), edges }
  cache.set(sym, out)
  return out
}

// Marco de cada engranaje: z = su eje (hacia afuera), x = hacia el primer vecino de la otra
// clase. En ese marco el diente (A) o el hueco (B) del ángulo 0 queda mirando a ese vecino,
// y por simetría a todos los demás.
export type Frame = { x: V3; y: V3; z: V3 }

export function frames(arr: Arrangement): { A: Frame[]; B: Frame[]; neighborsA: number[][]; neighborsB: number[][] } {
  const nA: number[][] = arr.A.map(() => []), nB: number[][] = arr.B.map(() => [])
  for (const [i, j] of arr.edges) { nA[i].push(j); nB[j].push(i) }
  const mk = (z: V3, toward: V3): Frame => {
    const x = norm(sub(toward, scale(z, dot(toward, z))))
    return { x, y: cross(z, x), z }
  }
  return {
    A: arr.A.map((z, i) => mk(z, arr.B[nA[i][0]])),
    B: arr.B.map((z, j) => mk(z, arr.A[nB[j][0]])),
    neighborsA: nA, neighborsB: nB,
  }
}

// local (marco del engranaje, girado α alrededor de su eje) → mundo
export function toWorld(f: Frame, alpha: number, p: V3): V3 {
  const c = Math.cos(alpha), s = Math.sin(alpha)
  const x = c * p[0] - s * p[1], y = s * p[0] + c * p[1], z = p[2]
  return [f.x[0] * x + f.y[0] * y + f.z[0] * z, f.x[1] * x + f.y[1] * y + f.z[1] * z, f.x[2] * x + f.y[2] * y + f.z[2] * z]
}
// mundo → local (deshaciendo el giro α)
export function toLocal(f: Frame, alpha: number, p: V3): V3 {
  const x = dot(f.x, p), y = dot(f.y, p), z = dot(f.z, p), c = Math.cos(alpha), s = Math.sin(alpha)
  return [c * x + s * y, -s * x + c * y, z]
}
