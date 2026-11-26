// HUMO SÓLIDO: anillos de humo calculados con filamentos de vórtice.
//
// Un fluido sin viscosidad guarda su giro en tubos de vórtice (Helmholtz, 1858); el
// resto del flujo se deduce de ellos con la ley de Biot–Savart, la misma del campo
// magnético de un cable. Cada vórtice es aquí una curva cerrada de nodos; la
// singularidad del núcleo se suaviza con el núcleo de Rosenhead–Moore (radio δ).
// El humo son partículas trazadoras que el flujo arrastra.
//
// Determinismo: en los bucles solo hay + − × ÷ y raíz (fijadas exactamente por
// IEEE 754). Las curvas iniciales usan la parametrización racional del círculo y
// las recurrencias de Chebyshev, sin seno ni coseno, así que la misma receta da la
// misma nube en cualquier navegador.

import { mulberry32 } from '../specimens/rng'

export type ExperimentId = 'leapfrog' | 'choque' | 'oblicuo' | 'nudo'
export type Params = { exp: ExperimentId; seed: number; a: number; b: number } // a, b: perillas 0..1 de cada experimento

export type State = {
  t: number
  fil: { x: Float64Array; n: number; gamma: number }[] // nodos de cada filamento (curva cerrada)
  p: Float64Array            // partículas de humo xyz
  tag: Uint8Array            // a qué anillo pertenece cada partícula (color)
  delta: number              // radio de suavizado del núcleo
  seg: number                // largo objetivo de los segmentos
}

export const DT = 0.06
export const stepsFor = (exp: ExperimentId) => Math.round(EXPERIMENTS[exp].duration / DT)
const FOUR_PI = 4 * Math.PI
const N0 = 64            // nodos por anillo al empezar
const SMOOTH = 0.15     // suavizado de los filamentos por paso: amortigua pliegues más cortos que el núcleo
const MAX_NODES = 300    // tope por filamento: si se estira más, los segmentos se alargan

// n puntos de un círculo sin trigonometría: parametrización racional t = tan(θ/2)
// en cada cuadrante. Devuelve cos θ y sen θ exactos en aritmética racional.
function unitCircle(n: number): Float64Array {
  // ángulos casi uniformes: se usa la parametrización t = tan(θ/2) en 4 cuadrantes
  const out = new Float64Array(2 * n)
  for (let i = 0; i < n; i++) {
    const q = (4 * i) / n, k = Math.floor(q), f = q - k // cuadrante y fracción
    // dentro de un cuadrante, t = tan(θ/2) ∈ [0,1] recorre θ ∈ [0°, 90°]; el espaciado no es
    // uniforme (hasta ×2), y el re-muestreo lo empareja en el primer paso
    const t = f
    const den = 1 + t * t, c = (1 - t * t) / den, s = (2 * t) / den
    const [cx, sx] = k === 0 ? [c, s] : k === 1 ? [-s, c] : k === 2 ? [-c, -s] : [s, -c]
    out[2 * i] = cx; out[2 * i + 1] = sx
  }
  return out
}

// anillo de radio R centrado en c con normal n: con Γ > 0 avanza en la dirección de n
function ringN(c: [number, number, number], n: [number, number, number], R: number, N: number): Float64Array {
  const nl = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]), nx = n[0] / nl, ny = n[1] / nl, nz = n[2] / nl
  // base ortonormal (u, v) del plano del anillo, sin trigonometría
  let ax = 0, ay = 0, az = 1; if (Math.abs(nz) > 0.9) { ax = 1; az = 0 }
  let ux = ay * nz - az * ny, uy = az * nx - ax * nz, uz = ax * ny - ay * nx
  const ul = Math.sqrt(ux * ux + uy * uy + uz * uz); ux /= ul; uy /= ul; uz /= ul
  const vx = ny * uz - nz * uy, vy = nz * ux - nx * uz, vz = nx * uy - ny * ux
  const uc = unitCircle(N), x = new Float64Array(3 * N)
  for (let i = 0; i < N; i++) {
    const a = R * uc[2 * i], b = R * uc[2 * i + 1]
    x[3 * i] = c[0] + a * ux + b * vx; x[3 * i + 1] = c[1] + a * uy + b * vy; x[3 * i + 2] = c[2] + a * uz + b * vz
  }
  return x
}

// un anillo solo, para comparar su velocidad con la fórmula de Kelvin
export function singleRing(R: number): State {
  const N = Math.max(48, Math.round(N0 * R))
  return { t: 0, fil: [{ x: ringN([0, 0, 0], [0, 0, 1], R, N), n: N, gamma: 1 }], p: new Float64Array(0), tag: new Uint8Array(0), delta: 0.16, seg: (2 * 3.14159) / N0 }
}

// trébol (nudo (2,3)) sobre un toro: cos 2θ, cos 3θ por Chebyshev desde cos θ, sen θ
function trefoil(R: number, r: number, n: number): Float64Array {
  const u = unitCircle(n), x = new Float64Array(3 * n)
  for (let i = 0; i < n; i++) {
    const c = u[2 * i], s = u[2 * i + 1]
    const c2 = 2 * c * c - 1, s2 = 2 * s * c, c3 = c * c2 - s * s2, s3 = s * c2 + c * s2
    const rad = R + r * c3
    x[3 * i] = rad * c2; x[3 * i + 1] = rad * s2; x[3 * i + 2] = r * s3
  }
  return x
}

// Experimentos (todo adimensional: radio de anillo ~1, circulación ~1)
export const EXPERIMENTS: Record<ExperimentId, { label: string; tagline: string; knobA: string; knobB: string; duration: number }> = {
  leapfrog: { label: 'SALTO DE RANA', tagline: 'Dos anillos que se adelantan uno a otro', knobA: 'Separación', knobB: 'Tamaño relativo', duration: 22 },
  choque: { label: 'CHOQUE FRONTAL', tagline: 'Dos anillos que se encuentran y se abren', knobA: 'Separación', knobB: 'Asimetría', duration: 15 },
  oblicuo: { label: 'CHOQUE OBLICUO', tagline: 'Dos anillos que se cruzan en ángulo', knobA: 'Ángulo', knobB: 'Desfase', duration: 14 },
  nudo: { label: 'NUDO', tagline: 'Un vórtice anudado en trébol', knobA: 'Grosor del toro', knobB: 'Intensidad', duration: 11 },
}

const q = (v: number) => Math.round(v * 2 ** 30) / 2 ** 30 // cuantiza las condiciones iniciales (blinda contra diferencias de último dígito)

export function initState(p: Params, particlesPerRing = 6000): State {
  const rnd = mulberry32(p.seed)
  const fil: State['fil'] = []
  const N = N0
  const a = Math.min(1, Math.max(0, p.a)), b = Math.min(1, Math.max(0, p.b))
  if (p.exp === 'leapfrog') {
    const d = 0.55 + 0.6 * a, r2 = 0.8 + 0.4 * b
    fil.push({ x: ringN([0, 0, -d / 2], [0, 0, 1], 1, N), n: N, gamma: 1 }, { x: ringN([0, 0, d / 2], [0, 0, 1], r2, N), n: N, gamma: 1 })
  } else if (p.exp === 'choque') {
    const d = 2.2 + 1.6 * a, r2 = 1 - 0.3 * b
    fil.push({ x: ringN([0, 0, -d / 2], [0, 0, 1], 1, N), n: N, gamma: 1 }, { x: ringN([0, 0, d / 2], [0, 0, -1], r2, N), n: N, gamma: 1 })
  } else if (p.exp === 'oblicuo') {
    const t = 0.25 + 0.9 * a, off = 0.5 * b
    fil.push({ x: ringN([-1.7, 0, -0.6 * t], [1, 0, t], 1, N), n: N, gamma: 1 }, { x: ringN([1.7, off, -0.6 * t], [-1, 0, t], 1, N), n: N, gamma: 1 })
  } else {
    fil.push({ x: trefoil(1.5, 0.45 + 0.3 * a, 3 * N), n: 3 * N, gamma: 0.8 + 0.6 * b })
  }
  for (const f of fil) for (let i = 0; i < f.x.length; i++) f.x[i] = q(f.x[i])
  // humo: un manguito alrededor de cada filamento (el humo se concentra en el núcleo)
  const P = particlesPerRing * fil.length, pts = new Float64Array(3 * P), tag = new Uint8Array(P)
  let k = 0
  fil.forEach((f, fi) => {
    for (let j = 0; j < particlesPerRing; j++) {
      const i = Math.floor(rnd() * f.n), i1 = (i + 1) % f.n, w = rnd()
      const cx = f.x[3 * i] + (f.x[3 * i1] - f.x[3 * i]) * w, cy = f.x[3 * i + 1] + (f.x[3 * i1 + 1] - f.x[3 * i + 1]) * w, cz = f.x[3 * i + 2] + (f.x[3 * i1 + 2] - f.x[3 * i + 2]) * w
      // desplazamiento gaussiano aproximado (suma de uniformes), radio del manguito ~0,22
      const g = () => (rnd() + rnd() + rnd() - 1.5) * (p.exp === 'nudo' ? 0.16 : 0.25)
      pts[3 * k] = q(cx + g()); pts[3 * k + 1] = q(cy + g()); pts[3 * k + 2] = q(cz + g()); tag[k] = fi; k++
    }
  })
  return { t: 0, fil, p: pts, tag, delta: 0.16, seg: (2 * 3.14159) / N }
}

// velocidad inducida en (x,y,z) por todos los filamentos; acumula en out[o..o+2]
function induce(fil: { x: Float64Array; n: number; gamma: number }[], d2: number, x: number, y: number, z: number, out: Float64Array, o: number) {
  let ux = 0, uy = 0, uz = 0
  for (const f of fil) {
    const X = f.x, n = f.n, g = f.gamma / FOUR_PI
    let ax = X[3 * n - 3], ay = X[3 * n - 2], az = X[3 * n - 1]
    for (let i = 0; i < n; i++) {
      const bx = X[3 * i], by = X[3 * i + 1], bz = X[3 * i + 2]
      const lx = bx - ax, ly = by - ay, lz = bz - az
      const rx = x - 0.5 * (ax + bx), ry = y - 0.5 * (ay + by), rz = z - 0.5 * (az + bz)
      const s = rx * rx + ry * ry + rz * rz + d2, k = g / (s * Math.sqrt(s))
      ux += k * (ly * rz - lz * ry); uy += k * (lz * rx - lx * rz); uz += k * (lx * ry - ly * rx)
      ax = bx; ay = by; az = bz
    }
  }
  out[o] = ux; out[o + 1] = uy; out[o + 2] = uz
}

function filVel(fil: State['fil'], d2: number): Float64Array[] {
  return fil.map((f) => { const v = new Float64Array(3 * f.n); for (let i = 0; i < f.n; i++) induce(fil, d2, f.x[3 * i], f.x[3 * i + 1], f.x[3 * i + 2], v, 3 * i); return v })
}

// suavizado de Taubin (λ, luego μ < −λ): amortigua los pliegues de pocos nodos, que no
// son física resuelta sino ruido, sin encoger la curva como haría un laplaciano solo
function smooth(f: { x: Float64Array; n: number }, w: number) {
  const pass = (X: Float64Array, w: number) => {
    const n = f.n, Y = new Float64Array(X.length)
    for (let i = 0; i < n; i++) {
      const a = ((i - 1 + n) % n) * 3, b = i * 3, c = ((i + 1) % n) * 3
      for (let k = 0; k < 3; k++) Y[b + k] = X[b + k] + w * 0.5 * (X[a + k] - 2 * X[b + k] + X[c + k])
    }
    return Y
  }
  f.x = pass(pass(f.x, w), -w * 1.06)
}

// re-muestreo: parte los segmentos largos y une los cortos (mantiene la curva bien resuelta)
function resample(f: { x: Float64Array; n: number; gamma: number }, seg: number) {
  const out: number[] = []
  const n = f.n, X = f.x
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const dx = X[3 * j] - X[3 * i], dy = X[3 * j + 1] - X[3 * i + 1], dz = X[3 * j + 2] - X[3 * i + 2]
    const L = Math.sqrt(dx * dx + dy * dy + dz * dz)
    if (L < 0.4 * seg && out.length >= 3 && n > 16) continue // nodo muy pegado: se descarta
    out.push(X[3 * i], X[3 * i + 1], X[3 * i + 2])
    if (L > 1.6 * seg) out.push(X[3 * i] + dx / 2, X[3 * i + 1] + dy / 2, X[3 * i + 2] + dz / 2)
  }
  f.x = Float64Array.from(out); f.n = out.length / 3
}

// un paso de Runge–Kutta de orden 2 (punto medio) para filamentos y humo
export function step(s: State, dt: number) {
  const d2 = s.delta * s.delta
  const v1 = filVel(s.fil, d2)
  const mid = s.fil.map((f, k) => { const x = new Float64Array(f.x.length); for (let i = 0; i < x.length; i++) x[i] = f.x[i] + 0.5 * dt * v1[k][i]; return { x, n: f.n, gamma: f.gamma } })
  const v2 = filVel(mid, d2)
  // humo: velocidad en el punto medio del paso
  const P = s.p.length / 3, u = new Float64Array(3)
  for (let i = 0; i < P; i++) {
    const x = s.p[3 * i], y = s.p[3 * i + 1], z = s.p[3 * i + 2]
    induce(s.fil, d2, x, y, z, u, 0)
    const mx = x + 0.5 * dt * u[0], my = y + 0.5 * dt * u[1], mz = z + 0.5 * dt * u[2]
    induce(mid, d2, mx, my, mz, u, 0)
    s.p[3 * i] = x + dt * u[0]; s.p[3 * i + 1] = y + dt * u[1]; s.p[3 * i + 2] = z + dt * u[2]
  }
  s.fil.forEach((f, k) => {
    for (let i = 0; i < f.x.length; i++) f.x[i] += dt * v2[k][i]
    smooth(f, SMOOTH * Math.min(1, dt / 0.06)) // suavizado por unidad de tiempo, no por paso
    resample(f, s.seg)
    for (let g = 1.25; f.n > MAX_NODES && g < 20; g *= 1.25) resample(f, s.seg * g)
  })
  s.t += dt
}

// Impulso hidrodinámico P = ½ Σ Γ ∮ x × dl: invariante exacto de un fluido ideal sin fronteras.
export function impulse(s: State): [number, number, number] { return impulseOf(s.fil) }
// escala para medir la deriva: suma de los impulsos de cada filamento por separado (en un
// choque frontal los dos se anulan y la deriva relativa al total no tendría sentido)
export function impulseScale(s: State): number { return s.fil.reduce((m, f) => m + Math.hypot(...impulseOf([f])), 0) }
function impulseOf(fil: State['fil']): [number, number, number] {
  let px = 0, py = 0, pz = 0
  for (const f of fil) {
    const X = f.x, n = f.n
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const mx = 0.5 * (X[3 * i] + X[3 * j]), my = 0.5 * (X[3 * i + 1] + X[3 * j + 1]), mz = 0.5 * (X[3 * i + 2] + X[3 * j + 2])
      const lx = X[3 * j] - X[3 * i], ly = X[3 * j + 1] - X[3 * i + 1], lz = X[3 * j + 2] - X[3 * i + 2]
      px += 0.5 * f.gamma * (my * lz - mz * ly); py += 0.5 * f.gamma * (mz * lx - mx * lz); pz += 0.5 * f.gamma * (mx * ly - my * lx)
    }
  }
  return [px, py, pz]
}

export function stateHash(s: State): string {
  let h = 0x811c9dc5
  const f = new Float32Array(s.p), u = new Uint8Array(f.buffer)
  for (let i = 0; i < u.length; i++) { h ^= u[i]; h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(16).padStart(8, '0')
}
