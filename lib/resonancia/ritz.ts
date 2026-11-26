// Placa cuadrada libre (sin apoyos), teoría de Kirchhoff, método de Rayleigh–Ritz con
// productos de polinomios de Legendre en [-1, 1]². Los polinomios de Legendre son
// ortogonales: la matriz de masa es diagonal y el problema generalizado K a = μ M a se
// reduce a uno simétrico estándar, que se resuelve con Jacobi cíclico.
//   λ = ω a² √(ρh / D),  con a = lado de la placa (aquí 2): λ = 4 √μ

export const NU = 0.3

// valores y derivadas (0, 1, 2) de P_0..P_n en x
export function legendre(n: number, x: number): [Float64Array, Float64Array, Float64Array] {
  const P = new Float64Array(n + 1), D1 = new Float64Array(n + 1), D2 = new Float64Array(n + 1)
  P[0] = 1
  if (n >= 1) { P[1] = x; D1[1] = 1 }
  for (let k = 1; k < n; k++) {
    P[k + 1] = ((2 * k + 1) * x * P[k] - k * P[k - 1]) / (k + 1)
    D1[k + 1] = ((2 * k + 1) * (P[k] + x * D1[k]) - k * D1[k - 1]) / (k + 1)
    D2[k + 1] = ((2 * k + 1) * (2 * D1[k] + x * D2[k]) - k * D2[k - 1]) / (k + 1)
  }
  return [P, D1, D2]
}

// nodos y pesos de Gauss–Legendre (Newton sobre P_m)
export function gauss(m: number): { x: Float64Array; w: Float64Array } {
  const x = new Float64Array(m), w = new Float64Array(m)
  for (let i = 0; i < m; i++) {
    let z = Math.cos((Math.PI * (i + 0.75)) / (m + 0.5))
    for (let it = 0; it < 100; it++) {
      const [P, D] = legendre(m, z), dz = P[m] / D[m]
      z -= dz
      if (Math.abs(dz) < 1e-15) break
    }
    const [, D] = legendre(m, z)
    x[i] = z; w[i] = 2 / ((1 - z * z) * D[m] * D[m])
  }
  return { x, w }
}

export type Modes = { n: number; lambda: number[]; coef: number[][] } // coef[k][i*(n+1)+j] sobre P_i(x) P_j(y)

export function solvePlate(n = 15, nu = NU): Modes {
  const q = gauss(2 * n + 4), N1 = n + 1
  // integrales 1D A^{ab}_{ik} = ∫ P_i^(a) P_k^(b)
  const A = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => new Float64Array(N1 * N1)))
  for (let g = 0; g < q.x.length; g++) {
    const d = legendre(n, q.x[g])
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let i = 0; i < N1; i++) for (let k = 0; k < N1; k++) A[a][b][i * N1 + k] += q.w[g] * d[a][i] * d[b][k]
  }
  const S = N1 * N1, K = new Float64Array(S * S), m = new Float64Array(S)
  const I = (a: number, b: number, i: number, k: number) => A[a][b][i * N1 + k]
  for (let i = 0; i < N1; i++) for (let j = 0; j < N1; j++) {
    const r = i * N1 + j
    m[r] = I(0, 0, i, i) * I(0, 0, j, j)
    for (let k = 0; k < N1; k++) for (let l = 0; l < N1; l++) {
      const c = k * N1 + l
      K[r * S + c] = I(2, 2, i, k) * I(0, 0, j, l) + I(0, 0, i, k) * I(2, 2, j, l)
        + nu * (I(2, 0, i, k) * I(0, 2, j, l) + I(0, 2, i, k) * I(2, 0, j, l))
        + 2 * (1 - nu) * I(1, 1, i, k) * I(1, 1, j, l)
    }
  }
  // base ortonormal respecto de M
  for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) K[r * S + c] /= Math.sqrt(m[r] * m[c])
  const { values, vectors } = jacobi(K, S)
  const order = Array.from({ length: S }, (_, i) => i).sort((u, v) => values[u] - values[v])
  const lambda: number[] = [], coef: number[][] = []
  for (const k of order) {
    lambda.push(4 * Math.sqrt(Math.max(0, values[k])))
    coef.push(Array.from({ length: S }, (_, r) => vectors[r * S + k] / Math.sqrt(m[r])))
  }
  return { n, lambda, coef }
}

// Jacobi cíclico para matrices simétricas (A se destruye). Devuelve autovalores y autovectores (columnas).
export function jacobi(A: Float64Array, n: number) {
  const V = new Float64Array(n * n); for (let i = 0; i < n; i++) V[i * n + i] = 1
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0; for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p * n + q] ** 2
    if (off < 1e-22) break
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      const apq = A[p * n + q]
      if (Math.abs(apq) < 1e-300) continue
      const app = A[p * n + p], aqq = A[q * n + q]
      const th = (aqq - app) / (2 * apq), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c
      for (let k = 0; k < n; k++) {
        const akp = A[k * n + p], akq = A[k * n + q]
        A[k * n + p] = c * akp - s * akq; A[k * n + q] = s * akp + c * akq
      }
      for (let k = 0; k < n; k++) {
        const apk = A[p * n + k], aqk = A[q * n + k]
        A[p * n + k] = c * apk - s * aqk; A[q * n + k] = s * apk + c * aqk
      }
      for (let k = 0; k < n; k++) {
        const vkp = V[k * n + p], vkq = V[k * n + q]
        V[k * n + p] = c * vkp - s * vkq; V[k * n + q] = s * vkp + c * vkq
      }
    }
  }
  return { values: Array.from({ length: n }, (_, i) => A[i * n + i]), vectors: V }
}
