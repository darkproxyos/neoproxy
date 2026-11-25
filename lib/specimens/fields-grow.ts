// Algoritmos de crecimiento: formas que resultan de un proceso, no de una
// ecuación cerrada. Cada uno atado a un autor ya presente en /knowledge.
//
// Determinismo: los bucles iterativos (colonización, red, atractores, DLA) usan
// solo + - * / y sqrt, que el estándar IEEE fija bit a bit en cualquier motor
// JS. Math.sin/cos/hypot pueden diferir en el último dígito entre navegadores;
// en un sistema caótico (Lorenz) ese dígito se amplifica hasta otra curva. Por
// eso ningún bucle de crecimiento los usa: la receta da la misma forma en Node
// (donde se puntúa) y en el navegador (donde se muestra y se exporta).

import { mulberry32, range, int, pick, type Rng } from './rng'
import { type Field, smin, sdCapsule, sdCylinder } from './sdf'
import type { Params } from './families'

const num = (p: Params, k: string) => p[k] as number
const sq = Math.sqrt

// ---- utilidades compartidas -------------------------------------------------

// Un segmento = 11 números: a(3) b(3) punto medio(3) semilongitud radio.
// Un nodo esférico es un segmento degenerado (a == b).
export const SEG = 11

export function pushSeg(out: number[], a: number[], b: number[], r: number) {
  out.push(a[0], a[1], a[2], b[0], b[1], b[2], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2,
    sq((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 + (b[2] - a[2]) ** 2) / 2, r)
}

// Centra y escala los segmentos para que llenen el cubo (radios incluidos).
export function fitSegs(segs: number[], limit = 0.86): number[] {
  let mnx = 1e9, mny = 1e9, mnz = 1e9, mxx = -1e9, mxy = -1e9, mxz = -1e9
  for (let i = 0; i < segs.length; i += SEG) {
    const r = segs[i + 10]
    for (let e = 0; e < 2; e++) {
      const x = segs[i + e * 3], y = segs[i + e * 3 + 1], z = segs[i + e * 3 + 2]
      if (x - r < mnx) mnx = x - r; if (x + r > mxx) mxx = x + r
      if (y - r < mny) mny = y - r; if (y + r > mxy) mxy = y + r
      if (z - r < mnz) mnz = z - r; if (z + r > mxz) mxz = z + r
    }
  }
  const cx = (mnx + mxx) / 2, cy = (mny + mxy) / 2, cz = (mnz + mxz) / 2
  const half = Math.max(mxx - mnx, mxy - mny, mxz - mnz) / 2 || 1
  const k = limit / half
  const out: number[] = []
  for (let i = 0; i < segs.length; i += SEG) {
    pushSeg(out,
      [(segs[i] - cx) * k, (segs[i + 1] - cy) * k, (segs[i + 2] - cz) * k],
      [(segs[i + 3] - cx) * k, (segs[i + 4] - cy) * k, (segs[i + 5] - cz) * k],
      segs[i + 10] * k)
  }
  return out
}

// Unión suave de segmentos. Una grilla espacial guarda, por celda, solo los
// segmentos que pueden quedar a menos de REACH de algún punto de la celda; el
// resto no se evalúa. Dentro de REACH el valor es exacto; fuera devuelve REACH
// (positivo y menor que la distancia real): sirve para el signo y para mezclar
// con otros campos, que es todo lo que se necesita lejos de la superficie.
const REACH = 0.12
export function segField(segs: number[], k: number): Field {
  const n = segs.length / SEG
  const G = 24, cs = 2 / G, cr = cs * 0.87
  const buckets: number[][] = new Array(G * G * G)
  for (let i = 0; i < buckets.length; i++) buckets[i] = []
  const idx = (v: number) => Math.max(0, Math.min(G - 1, Math.floor((v + 1) / cs)))
  for (let i = 0, o = 0; i < n; i++, o += SEG) {
    const reach = segs[o + 9] + segs[o + 10] + REACH + k + cr
    const mx = segs[o + 6], my = segs[o + 7], mz = segs[o + 8]
    const x0 = idx(mx - reach), x1 = idx(mx + reach), y0 = idx(my - reach), y1 = idx(my + reach), z0 = idx(mz - reach), z1 = idx(mz + reach)
    for (let cz = z0; cz <= z1; cz++) for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const x = -1 + (cx + 0.5) * cs, y = -1 + (cy + 0.5) * cs, z = -1 + (cz + 0.5) * cs
      const d = Math.hypot(x - mx, y - my, z - mz) - segs[o + 9] - segs[o + 10] - cr
      if (d < REACH + k) buckets[(cz * G + cy) * G + cx].push(o)
    }
  }
  const lists = buckets.map((b) => Int32Array.from(b))
  return (x, y, z) => {
    const ids = lists[(idx(z) * G + idx(y)) * G + idx(x)]
    let d = 1e9
    for (let q = 0; q < ids.length; q++) {
      const s = ids[q]
      const c = sdCapsule(x, y, z, segs[s], segs[s + 1], segs[s + 2], segs[s + 3], segs[s + 4], segs[s + 5], segs[s + 10])
      d = d > 1e8 ? c : smin(d, c, k)
    }
    return d < REACH ? d : REACH
  }
}

// Zócalo bajo una estructura de alambre: sin base un alambre no se sostiene.
export function withPlinth(f: Field, segs: number[], rad: number): Field {
  let zMin = 1e9
  for (let i = 0; i < segs.length; i += SEG) {
    zMin = Math.min(zMin, segs[i + 2] - segs[i + 10], segs[i + 5] - segs[i + 10])
  }
  const zc = zMin + 0.05
  return (x, y, z) => smin(f(x, y, z), sdCylinder(x, y, z - zc, rad, 0.05), 0.04)
}

// Campo a partir de una grilla de densidad con muestreo trilineal (f<0 donde
// la densidad supera el umbral). La grilla cubre [-1,1]^3.
export function densityField(data: Float32Array, n: number, thr: number, scale = 0.3): Field {
  const m = n - 1
  return (x, y, z) => {
    const u = (x + 1) * 0.5 * m, v = (y + 1) * 0.5 * m, w = (z + 1) * 0.5 * m
    if (u < 0 || v < 0 || w < 0 || u >= m || v >= m || w >= m) return thr * scale
    const i = Math.floor(u), j = Math.floor(v), k = Math.floor(w)
    const fu = u - i, fv = v - j, fw = w - k
    const o = (k * n + j) * n + i
    const c00 = data[o] * (1 - fu) + data[o + 1] * fu
    const c10 = data[o + n] * (1 - fu) + data[o + n + 1] * fu
    const c01 = data[o + n * n] * (1 - fu) + data[o + n * n + 1] * fu
    const c11 = data[o + n * n + n] * (1 - fu) + data[o + n * n + n + 1] * fu
    const d = (c00 * (1 - fv) + c10 * fv) * (1 - fw) + (c01 * (1 - fv) + c11 * fv) * fw
    return (thr - d) * scale
  }
}

// punto uniforme en la bola unidad, por rechazo (solo sqrt, sin trigonometría)
function inBall(r: Rng): [number, number, number] {
  for (;;) {
    const x = r() * 2 - 1, y = r() * 2 - 1, z = r() * 2 - 1
    if (x * x + y * y + z * z <= 1) return [x, y, z]
  }
}
function onSphere(r: Rng): [number, number, number] {
  for (;;) {
    const [x, y, z] = inBall(r)
    const l = sq(x * x + y * y + z * z)
    if (l > 0.2) return [x / l, y / l, z / l]
  }
}

// ---- 1. Colonización de espacio (Runions, Lane & Prusinkiewicz, 2007) --------

export function sampleColonization(r: Rng, base: Params): Params {
  return {
    ...base,
    growSeed: int(r, 1, 1e9),
    crown: pick(r, ['ellipsoid', 'cone', 'umbrella', 'twin'] as const),
    nAttr: int(r, 170, 420),
    dInf: range(r, 0.3, 0.52),
    dKill: range(r, 0.05, 0.1),
    step: range(r, 0.045, 0.075),
    tip: range(r, 0.03, 0.042),
    pipe: range(r, 2.7, 3.3),
  }
}

export function colonizationField(p: Params): Field {
  const rr = mulberry32(num(p, 'growSeed'))
  const crown = p.crown as string
  const nAttr = num(p, 'nAttr'), dInf = num(p, 'dInf'), dKill = num(p, 'dKill')
  const step = num(p, 'step'), tip = num(p, 'tip'), pipe = num(p, 'pipe')

  const inside = (x: number, y: number, z: number) => {
    switch (crown) {
      case 'cone': return z > -0.4 && z < 0.8 && x * x + y * y < (0.7 * (0.8 - z) / 1.2) ** 2
      case 'umbrella': return (x / 0.85) ** 2 + (y / 0.85) ** 2 + ((z - 0.35) / 0.22) ** 2 < 1
      case 'twin': return ((Math.abs(x) - 0.38) / 0.4) ** 2 + (y / 0.4) ** 2 + ((z - 0.2) / 0.55) ** 2 < 1
      default: return (x / 0.72) ** 2 + (y / 0.72) ** 2 + ((z - 0.12) / 0.62) ** 2 < 1
    }
  }
  const A: number[] = []
  for (let guard = 0; A.length < nAttr * 3 && guard < nAttr * 60; guard++) {
    const x = rr() * 2 - 1, y = rr() * 2 - 1, z = rr() * 2 - 1
    if (inside(x, y, z)) A.push(x, y, z)
  }
  let alive: Uint8Array = new Uint8Array(A.length / 3).fill(1)

  const NX: number[] = [0], NY: number[] = [0], NZ: number[] = [-0.78], PAR: number[] = [-1]
  // tronco inicial hasta la base de la copa
  while (NZ[NZ.length - 1] < -0.48) {
    const i = NX.length
    NX.push(0); NY.push(0); NZ.push(NZ[i - 1] + step); PAR.push(i - 1)
  }
  const dInf2 = dInf * dInf, dKill2 = dKill * dKill
  for (let it = 0; it < 170 && NX.length < 330; it++) {
    const nN = NX.length
    const ax = new Float64Array(nN), ay = new Float64Array(nN), az = new Float64Array(nN)
    const cnt = new Uint16Array(nN)
    let any = false
    for (let a = 0; a < alive.length; a++) {
      if (!alive[a]) continue
      const px = A[a * 3], py = A[a * 3 + 1], pz = A[a * 3 + 2]
      let best = -1, bd = dInf2
      for (let n = 0; n < nN; n++) {
        const dx = px - NX[n], dy = py - NY[n], dz = pz - NZ[n]
        const d2 = dx * dx + dy * dy + dz * dz
        if (d2 < bd) { bd = d2; best = n }
      }
      if (best < 0) continue
      const l = sq(bd) || 1
      ax[best] += (px - NX[best]) / l; ay[best] += (py - NY[best]) / l; az[best] += (pz - NZ[best]) / l
      cnt[best]++; any = true
    }
    if (!any) {
      // ninguna atractora al alcance: el ápice sigue subiendo hasta encontrarlas
      let top = 0
      for (let n = 1; n < nN; n++) if (NZ[n] > NZ[top]) top = n
      if (NZ[top] > 0.7) break
      NX.push(NX[top]); NY.push(NY[top]); NZ.push(NZ[top] + step); PAR.push(top)
      continue
    }
    for (let n = 0; n < nN && NX.length < 330; n++) {
      if (!cnt[n]) continue
      const l = sq(ax[n] * ax[n] + ay[n] * ay[n] + az[n] * az[n]) || 1
      NX.push(NX[n] + (ax[n] / l) * step); NY.push(NY[n] + (ay[n] / l) * step); NZ.push(NZ[n] + (az[n] / l) * step)
      PAR.push(n)
    }
    alive = alive.map((v, a) => {
      if (!v) return 0
      for (let n = nN; n < NX.length; n++) {
        const dx = A[a * 3] - NX[n], dy = A[a * 3 + 1] - NY[n], dz = A[a * 3 + 2] - NZ[n]
        if (dx * dx + dy * dy + dz * dz < dKill2) return 0
      }
      return 1
    }) as Uint8Array
  }

  // modelo de tuberías: el área del padre es la suma de las de sus hijos
  const N = NX.length
  const rad = new Float64Array(N)
  const acc = new Float64Array(N)
  const hasKid = new Uint8Array(N)
  for (let i = N - 1; i >= 0; i--) {
    rad[i] = hasKid[i] ? Math.min(acc[i] ** (1 / pipe), 0.15) : tip
    if (PAR[i] >= 0) { hasKid[PAR[i]] = 1; acc[PAR[i]] += rad[i] ** pipe }
  }
  const segs: number[] = []
  for (let i = 1; i < N; i++) pushSeg(segs, [NX[PAR[i]], NY[PAR[i]], NZ[PAR[i]]], [NX[i], NY[i], NZ[i]], rad[i])
  return segField(fitSegs(segs), 0.03)
}

// ---- 2. Enrollamiento de conchas (Raup, 1961–66) -----------------------------

export function sampleShell(r: Rng, base: Params): Params {
  return {
    ...base, zCut: range(r, -0.78, -0.55), // base plana: una concha redonda no se sostiene sola
    W: range(r, 1.7, 4.2),       // expansión por vuelta
    D: range(r, 0, 1.1),         // distancia del generador al eje
    T: r() < 0.3 ? 0 : range(r, 0.2, 2.2), // traslación a lo largo del eje
    turns: range(r, 1.8, 5),
    ribs: int(r, 3, 9), ribAmp: r() < 0.75 ? range(r, 0.06, 0.2) : 0,
  }
}

export function shellField(p: Params): Field {
  const W = num(p, 'W'), D = num(p, 'D'), T = num(p, 'T'), turns = num(p, 'turns')
  const ribs = num(p, 'ribs'), ribAmp = num(p, 'ribAmp')
  const g = Math.log(W) / (Math.PI * 2)
  // la punta no baja de 5 % del radio final: sigue siendo imprimible
  const tTotal = Math.min(Math.log(20) / g, turns * Math.PI * 2)
  const nSeg = Math.max(120, Math.round(tTotal * 14))
  const segs: number[] = []
  let prev: number[] | null = null, prevR = 0
  for (let i = 0; i <= nSeg; i++) {
    const t = (i / nSeg) * tTotal
    const s = Math.exp(g * (t - tTotal))
    const rg = s * (1 + ribAmp * Math.sin(ribs * t))
    const Rc = s * (1 + D)
    const c = [Rc * Math.cos(t), Rc * Math.sin(t), T * Rc]
    if (prev) pushSeg(segs, prev, c, (rg + prevR) / 2)
    prev = c; prevR = rg
  }
  return segField(fitSegs(segs), 0.02)
}

// ---- 3. Red libre de escala (Barabási–Albert) --------------------------------

export function sampleNetwork(r: Rng, base: Params): Params {
  return {
    ...base,
    growSeed: int(r, 1, 1e9),
    n: int(r, 18, 36), m: pick(r, [1, 1, 2, 2, 3] as const),
    node: range(r, 0.05, 0.08), edge: range(r, 0.042, 0.068),
  }
}

export function networkField(p: Params): Field {
  const rr = mulberry32(num(p, 'growSeed'))
  const n = num(p, 'n'), m = num(p, 'm'), node = num(p, 'node'), edge = num(p, 'edge')
  const deg = new Array<number>(n).fill(0)
  const edges: number[][] = []
  edges.push([0, 1]); deg[0] = 1; deg[1] = 1
  for (let i = 2; i < n; i++) {
    const chosen = new Set<number>()
    for (let tries = 0; chosen.size < Math.min(m, i) && tries < 60; tries++) {
      let total = 0
      for (let j = 0; j < i; j++) total += deg[j]
      let x = rr() * total, tgt = 0
      for (let j = 0; j < i; j++) { x -= deg[j]; if (x <= 0) { tgt = j; break } }
      chosen.add(tgt)
    }
    chosen.forEach((t) => { edges.push([i, t]); deg[i]++; deg[t]++ })
  }
  // posiciones: repulsión entre todos, resorte en las aristas, gravedad suave
  const P: number[][] = Array.from({ length: n }, () => inBall(rr).map((v) => v * 0.5))
  const L = 0.3
  for (let it = 0; it < 220; it++) {
    const F = P.map(() => [0, 0, 0])
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1], dz = P[i][2] - P[j][2]
      const d2 = dx * dx + dy * dy + dz * dz + 0.01
      const f = 0.004 / d2, d = sq(d2)
      F[i][0] += (dx / d) * f; F[i][1] += (dy / d) * f; F[i][2] += (dz / d) * f
      F[j][0] -= (dx / d) * f; F[j][1] -= (dy / d) * f; F[j][2] -= (dz / d) * f
    }
    for (const [a, b] of edges) {
      const dx = P[b][0] - P[a][0], dy = P[b][1] - P[a][1], dz = P[b][2] - P[a][2]
      const d = sq(dx * dx + dy * dy + dz * dz) || 1e-6
      const f = (d - L) * 0.25
      F[a][0] += (dx / d) * f; F[a][1] += (dy / d) * f; F[a][2] += (dz / d) * f
      F[b][0] -= (dx / d) * f; F[b][1] -= (dy / d) * f; F[b][2] -= (dz / d) * f
    }
    const cool = 0.5 * (1 - it / 240)
    for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) P[i][a] += (F[i][a] - 0.05 * P[i][a]) * cool
  }
  const segs: number[] = []
  for (const [a, b] of edges) pushSeg(segs, P[a], P[b], edge)
  for (let i = 0; i < n; i++) pushSeg(segs, P[i], P[i], Math.min(0.2, node * (0.7 + 0.5 * sq(deg[i]))))
  const fit = fitSegs(segs)
  return withPlinth(segField(fit, 0.035), fit, 0.5)
}

// ---- 4. Atractor extraño (Lorenz, 1963, y sistemas afines) -------------------
// Solo sistemas polinómicos: RK4 con + - * es exacto en cualquier motor.

type Sys = (x: number, y: number, z: number, a: number[]) => [number, number, number]
const SYSTEMS: Record<string, { f: Sys; dt: number; a: (r: Rng) => number[]; warm: number }> = {
  lorenz: {
    f: (x, y, z, a) => [10 * (y - x), x * (a[0] - z) - y, x * y - (8 / 3) * z],
    dt: 0.006, a: (r) => [range(r, 24, 32)], warm: 800,
  },
  rossler: {
    f: (x, y, z, a) => [-y - z, x + 0.2 * y, 0.2 + z * (x - a[0])],
    dt: 0.03, a: (r) => [range(r, 5.2, 6.6)], warm: 1500,
  },
  halvorsen: {
    f: (x, y, z, a) => [-a[0] * x - 4 * y - 4 * z - y * y, -a[0] * y - 4 * z - 4 * x - z * z, -a[0] * z - 4 * x - 4 * y - x * x],
    dt: 0.012, a: (r) => [range(r, 1.4, 1.7)], warm: 800,
  },
  chen: {
    f: (x, y, z, a) => [35 * (y - x), (a[0] - 35) * x - x * z + a[0] * y, x * y - 3 * z],
    dt: 0.0018, a: (r) => [range(r, 26, 28.5)], warm: 2500,
  },
}

export function sampleAttractor(r: Rng, base: Params): Params {
  const sys = pick(r, Object.keys(SYSTEMS))
  return {
    ...base,
    sys, a: SYSTEMS[sys].a(r),
    x0: range(r, 0.5, 2), y0: range(r, 0.5, 2), z0: range(r, 0.5, 2),
    span: int(r, 150, 260), sub: int(r, 5, 11),
    tube: range(r, 0.055, 0.09),
  }
}

export function attractorField(p: Params): Field {
  const S = SYSTEMS[p.sys as string], a = p.a as number[]
  const span = num(p, 'span'), sub = num(p, 'sub'), tube = num(p, 'tube')
  let x = num(p, 'x0'), y = num(p, 'y0'), z = num(p, 'z0')
  const h = S.dt
  const stepRK = () => {
    const k1 = S.f(x, y, z, a)
    const k2 = S.f(x + h * 0.5 * k1[0], y + h * 0.5 * k1[1], z + h * 0.5 * k1[2], a)
    const k3 = S.f(x + h * 0.5 * k2[0], y + h * 0.5 * k2[1], z + h * 0.5 * k2[2], a)
    const k4 = S.f(x + h * k3[0], y + h * k3[1], z + h * k3[2], a)
    x += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])
    y += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])
    z += (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])
  }
  for (let i = 0; i < S.warm; i++) stepRK()
  const pts: number[][] = [[x, y, z]]
  for (let i = 0; i < span; i++) {
    for (let j = 0; j < sub; j++) stepRK()
    if (!isFinite(x + y + z)) break
    pts.push([x, y, z])
  }
  // el radio del tubo es relativo al tamaño de la curva
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]
  for (const q of pts) for (let a2 = 0; a2 < 3; a2++) { if (q[a2] < mn[a2]) mn[a2] = q[a2]; if (q[a2] > mx[a2]) mx[a2] = q[a2] }
  const ext = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) || 1
  const rr2 = tube * ext / 1.6
  const segs: number[] = []
  for (let i = 1; i < pts.length; i++) pushSeg(segs, pts[i - 1], pts[i], rr2)
  const fit = fitSegs(segs)
  return withPlinth(segField(fit, 0.03), fit, 0.5)
}

// ---- 5. Agregación limitada por difusión (Witten & Sander, 1981) -------------

export function sampleDLA(r: Rng, base: Params): Params {
  return {
    ...base,
    growSeed: int(r, 1, 1e9),
    mode: pick(r, ['point', 'plate'] as const),
    count: int(r, 420, 820), stick: range(r, 0.35, 1),
    splat: range(r, 1.35, 1.95), thr: range(r, 0.3, 0.5),
  }
}

export function dlaField(p: Params): Field {
  const rr = mulberry32(num(p, 'growSeed'))
  const plate = p.mode === 'plate'
  const count = num(p, 'count'), stick = num(p, 'stick'), splat = num(p, 'splat'), thr = num(p, 'thr')
  const H = 26, S = 2 * H + 1
  const occ = new Uint8Array(S * S * S)
  const at = (x: number, y: number, z: number) => ((z + H) * S + (y + H)) * S + (x + H)
  const isOcc = (x: number, y: number, z: number) =>
    x >= -H && x <= H && y >= -H && y <= H && z >= -H && z <= H && occ[at(x, y, z)] === 1
  const parts: number[] = []
  const add = (x: number, y: number, z: number) => { occ[at(x, y, z)] = 1; parts.push(x, y, z) }
  let maxR = 1
  if (plate) {
    for (let x = -9; x <= 9; x++) for (let y = -9; y <= 9; y++) if (x * x + y * y <= 81) add(x, y, 0)
    maxR = 9
  } else add(0, 0, 0)

  const DIR = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
  let placed = plate ? 0 : 1
  for (let guard = 0; placed < count && guard < count * 12; guard++) {
    const launch = maxR + 5, kill = launch * 2 + 4
    let [x, y, z] = onSphere(rr).map((v) => Math.round(v * launch)) as [number, number, number]
    if (plate && z < 1) z = 1 + Math.abs(z)
    let stuck = false
    for (let s = 0; s < 30000; s++) {
      const d = DIR[(rr() * 6) | 0]
      x += d[0]; y += d[1]; z += d[2]
      if (plate && z < 1) z = 1
      if (x * x + y * y + z * z > kill * kill) break
      if (x < -H + 1 || x > H - 1 || y < -H + 1 || y > H - 1 || z < -H + 1 || z > H - 1) continue
      if (isOcc(x + 1, y, z) || isOcc(x - 1, y, z) || isOcc(x, y + 1, z) || isOcc(x, y - 1, z) || isOcc(x, y, z + 1) || isOcc(x, y, z - 1)) {
        if (rr() < stick) { stuck = true; break }
      }
    }
    if (!stuck) continue
    if (isOcc(x, y, z)) continue
    add(x, y, z); placed++
    const rad = sq(x * x + y * y + z * z)
    if (rad > maxR) maxR = rad
  }

  // partículas -> densidad en una grilla del cubo, centrada en la caja del cúmulo
  let mnx = 1e9, mny = 1e9, mnz = 1e9, mxx = -1e9, mxy = -1e9, mxz = -1e9
  for (let i = 0; i < parts.length; i += 3) {
    mnx = Math.min(mnx, parts[i]); mxx = Math.max(mxx, parts[i])
    mny = Math.min(mny, parts[i + 1]); mxy = Math.max(mxy, parts[i + 1])
    mnz = Math.min(mnz, parts[i + 2]); mxz = Math.max(mxz, parts[i + 2])
  }
  const cx = (mnx + mxx) / 2, cy = (mny + mxy) / 2, cz = (mnz + mxz) / 2
  const half = Math.max(mxx - mnx, mxy - mny, mxz - mnz) / 2 + splat
  const k = 0.86 / half
  const G = 64, cell = 2 / (G - 1)
  const data = new Float32Array(G * G * G)
  const rw = splat * k, rc = Math.ceil(rw / cell) + 1
  for (let i = 0; i < parts.length; i += 3) {
    const wx = (parts[i] - cx) * k, wy = (parts[i + 1] - cy) * k, wz = (parts[i + 2] - cz) * k
    const gi = Math.round((wx + 1) / cell), gj = Math.round((wy + 1) / cell), gk = Math.round((wz + 1) / cell)
    for (let a = Math.max(0, gk - rc); a <= Math.min(G - 1, gk + rc); a++)
      for (let b = Math.max(0, gj - rc); b <= Math.min(G - 1, gj + rc); b++)
        for (let c = Math.max(0, gi - rc); c <= Math.min(G - 1, gi + rc); c++) {
          const dx = c * cell - 1 - wx, dy = b * cell - 1 - wy, dz = a * cell - 1 - wz
          const q = (dx * dx + dy * dy + dz * dz) / (rw * rw)
          if (q < 1) data[(a * G + b) * G + c] += (1 - q) * (1 - q)
        }
  }
  return densityField(data, G, thr)
}
