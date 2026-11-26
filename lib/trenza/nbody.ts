// Tres cuerpos de igual masa en el plano (G = m = 1). Integrador Dormand–Prince 5(4)
// con paso adaptativo. Solo + − × ÷ y √ (redondeo IEEE exacto): el mismo cálculo da
// los mismos bits en cualquier motor de JavaScript. El control de paso usa err^(-1/4)
// = √√(1/err) en lugar del clásico err^(-1/5), que exigiría Math.pow.

export type Vec = Float64Array // [x1,y1,x2,y2,x3,y3, vx1,vy1,vx2,vy2,vx3,vy3]

export function deriv(y: Vec, out: Vec) {
  for (let i = 0; i < 6; i++) { out[i] = y[6 + i]; out[6 + i] = 0 }
  for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) {
    const dx = y[2 * b] - y[2 * a], dy = y[2 * b + 1] - y[2 * a + 1]
    const r2 = dx * dx + dy * dy, r = Math.sqrt(r2), k = 1 / (r2 * r)
    out[6 + 2 * a] += dx * k; out[7 + 2 * a] += dy * k
    out[6 + 2 * b] -= dx * k; out[7 + 2 * b] -= dy * k
  }
}

export function energy(y: Vec) {
  let K = 0, U = 0
  for (let i = 0; i < 3; i++) K += 0.5 * (y[6 + 2 * i] ** 2 + y[7 + 2 * i] ** 2)
  for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) U -= 1 / Math.hypot(y[2 * b] - y[2 * a], y[2 * b + 1] - y[2 * a + 1])
  return K + U
}
export function angMom(y: Vec) { let L = 0; for (let i = 0; i < 3; i++) L += y[2 * i] * y[7 + 2 * i] - y[2 * i + 1] * y[6 + 2 * i]; return L }

// Šuvakov y Dmitrašinović (2013): x1 = (−1, 0), x2 = (1, 0), x3 = (0, 0), v1 = v2 = (p1, p2), v3 = −2 (p1, p2)
export function initial(p1: number, p2: number): Vec {
  return Float64Array.from([-1, 0, 1, 0, 0, 0, p1, p2, p1, p2, -2 * p1, -2 * p2])
}

const C = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1]
const A = [
  [],
  [1 / 5],
  [3 / 40, 9 / 40],
  [44 / 45, -56 / 15, 32 / 9],
  [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
  [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
  [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
]
const E = [71 / 57600, 0, -71 / 16695, 71 / 1920, -17253 / 339200, 22 / 525, -1 / 40] // b5 − b4

export type Track = { t: Float64Array; y: Float64Array[]; steps: number; rejected: number; minDist: number }

// integra de 0 a T; guarda cada paso aceptado (t, estado) para reconstruir la curva con Hermite
export function integrate(y0: Vec, T: number, tol = 1e-12, keep = true): Track {
  const n = 12, k = Array.from({ length: 7 }, () => new Float64Array(n)), tmp = new Float64Array(n), yn = new Float64Array(n)
  let y = Float64Array.from(y0), t = 0, h = 1e-3, steps = 0, rejected = 0, minDist = Infinity
  const ts = [0], ys = keep ? [Float64Array.from(y)] : []
  deriv(y, k[0])
  while (t < T) {
    if (t + h > T) h = T - t
    for (let s = 1; s < 7; s++) {
      for (let i = 0; i < n; i++) { let acc = y[i]; for (let j = 0; j < s; j++) acc += h * A[s][j] * k[j][i]; tmp[i] = acc }
      deriv(tmp, k[s])
    }
    // el estado de 5.º orden es el de la etapa 7 (FSAL)
    for (let i = 0; i < n; i++) yn[i] = tmp[i]
    let err = 0
    for (let i = 0; i < n; i++) {
      let e = 0; for (let j = 0; j < 7; j++) e += E[j] * k[j][i]
      const sc = tol * (1 + Math.max(Math.abs(y[i]), Math.abs(yn[i])))
      const q = (h * e) / sc; err += q * q
    }
    err = Math.sqrt(err / n)
    if (err <= 1) {
      t = t + h === T || T - (t + h) < 1e-15 ? T : t + h
      y.set(yn); k[0].set(k[6]); steps++
      for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) minDist = Math.min(minDist, Math.hypot(y[2 * b] - y[2 * a], y[2 * b + 1] - y[2 * a + 1]))
      ts.push(t); if (keep) ys.push(Float64Array.from(y))
    } else rejected++
    const f = err === 0 ? 4 : 0.9 * Math.sqrt(Math.sqrt(1 / err))
    h *= Math.min(4, Math.max(0.2, f))
  }
  return { t: Float64Array.from(ts), y: keep ? ys : [Float64Array.from(y)], steps, rejected, minDist }
}

export function finalState(y0: Vec, T: number, tol = 1e-12): Vec { const r = integrate(y0, T, tol, false); return r.y[0] }

// cuánto se aleja de su punto de partida tras un período (norma del estado completo)
export function returnError(p1: number, p2: number, T: number, tol = 1e-12) {
  const y0 = initial(p1, p2), y1 = finalState(y0, T, tol)
  let s = 0; for (let i = 0; i < 12; i++) s += (y1[i] - y0[i]) ** 2
  return Math.sqrt(s)
}

// Gauss–Newton sobre (p1, p2, T) para que la órbita cierre exactamente
export function refine(p1: number, p2: number, T: number, iters = 8, tol = 1e-13) {
  let x = [p1, p2, T]
  const res = (v: number[]) => { const y0 = initial(v[0], v[1]), y1 = finalState(y0, v[2], tol); return Array.from(y1, (q, i) => q - y0[i]) }
  const norm = (r: number[]) => Math.sqrt(r.reduce((s, q) => s + q * q, 0))
  let r = res(x), hist = [norm(r)]
  for (let it = 0; it < iters; it++) {
    const J: number[][] = []
    for (let j = 0; j < 3; j++) { const d = 1e-7 * (j === 2 ? 1 : 1), xp = x.slice(); xp[j] += d; const rp = res(xp); J.push(rp.map((q, i) => (q - r[i]) / d)) }
    // ecuaciones normales 3×3: (JᵀJ) Δ = −Jᵀr
    const M = [0, 1, 2].map((a) => [0, 1, 2].map((b) => J[a].reduce((s, q, i) => s + q * J[b][i], 0)))
    const g = [0, 1, 2].map((a) => -J[a].reduce((s, q, i) => s + q * r[i], 0))
    const D = solve3(M, g)
    let lam = 1, best = null as null | { x: number[]; r: number[]; n: number }
    for (let ls = 0; ls < 6; ls++) { const xn = x.map((q, i) => q + lam * D[i]), rn = res(xn), nn = norm(rn); if (nn < hist[hist.length - 1]) { best = { x: xn, r: rn, n: nn }; break } lam /= 2 }
    if (!best) break
    x = best.x; r = best.r; hist.push(best.n)
    if (best.n < 1e-11) break
  }
  return { p1: x[0], p2: x[1], T: x[2], hist }
}

function solve3(M: number[][], g: number[]) {
  const det = (m: number[][]) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  const d = det(M)
  return [0, 1, 2].map((c) => det(M.map((row, i) => row.map((q, j) => (j === c ? g[i] : q)))) / d)
}

// ---- muestreo de la curva ------------------------------------------------------------------
// Hermite cúbico entre pasos aceptados (posición y velocidad conocidas en ambos extremos)
export function sampleAt(tr: Track, t: number, out: Float64Array, hint = 0): number {
  let i = Math.max(0, Math.min(hint, tr.t.length - 2))
  while (i < tr.t.length - 2 && tr.t[i + 1] < t) i++
  while (i > 0 && tr.t[i] > t) i--
  const t0 = tr.t[i], t1 = tr.t[i + 1], h = t1 - t0, s = h > 0 ? (t - t0) / h : 0
  const a = tr.y[i], b = tr.y[i + 1]
  const h00 = (1 + 2 * s) * (1 - s) * (1 - s), h10 = s * (1 - s) * (1 - s), h01 = s * s * (3 - 2 * s), h11 = s * s * (s - 1)
  for (let k = 0; k < 6; k++) out[k] = h00 * a[k] + h10 * h * a[6 + k] + h01 * b[k] + h11 * h * b[6 + k]
  return i
}

// ---- palabra de la trenza --------------------------------------------------------------------
// Se proyectan las tres líneas de mundo (x, y, t) sobre el plano (x, t): cada vez que dos
// cuerpos vecinos en x se cruzan hay un generador σᵢ (i = posición del cruce, 1 o 2), con
// signo + si pasa por delante (y mayor) el que venía por la izquierda.
export function braidWord(tr: Track, T: number, samples = 20000): number[] {
  const p = new Float64Array(6), word: number[] = []
  let order = [0, 1, 2], hint = 0
  sampleAt(tr, 0, p); order.sort((u, v) => p[2 * u] - p[2 * v])
  for (let k = 1; k <= samples; k++) {
    hint = sampleAt(tr, (T * k) / samples, p, hint)
    // burbuja: cada intercambio de vecinos es un cruce
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < 2; i++) {
      const L = order[i], R = order[i + 1]
      if (p[2 * L] > p[2 * R]) { word.push((p[2 * L + 1] > p[2 * R + 1] ? 1 : -1) * (i + 1)); order[i] = R; order[i + 1] = L }
    }
  }
  return word
}
// simplificación libre: σᵢ σᵢ⁻¹ se cancela
export function reduceWord(w: number[]) { const s: number[] = []; for (const g of w) { if (s.length && s[s.length - 1] === -g) s.pop(); else s.push(g) } return s }

// ---- estabilidad -----------------------------------------------------------------------------
// se integra la órbita y una copia con p1 corrido en eps; devuelve el tiempo en que la
// distancia entre posiciones supera 'gap' (o null si aguanta todo el horizonte)
export function divergence(p1: number, p2: number, eps: number, horizon: number, gap = 0.1): number | null {
  const A = integrate(initial(p1, p2), horizon, 1e-12), B = integrate(initial(p1 + eps, p2), horizon, 1e-12)
  const a = new Float64Array(6), b = new Float64Array(6), N = Math.ceil(horizon / 0.01)
  let ha = 0, hb = 0
  for (let k = 0; k <= N; k++) {
    const t = Math.min(horizon, k * 0.01); ha = sampleAt(A, t, a, ha); hb = sampleAt(B, t, b, hb)
    let d = 0; for (let i = 0; i < 6; i++) d = Math.max(d, Math.abs(a[i] - b[i]))
    if (d > gap) return t
  }
  return null
}
