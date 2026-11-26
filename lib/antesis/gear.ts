// ANTESIS — el engranaje cónico.
//
// Dos engranajes cónicos que se tocan son dos conos que ruedan uno sobre otro sin
// resbalar, con el vértice común en el centro de la esfera. Si sus semiángulos son δA y
// δB, con δA + δB = Σ (el ángulo entre ejes), la condición de rodar sin resbalar es
// NA / NB = sen δA / sen δB, de donde tan δA = sen Σ / (NB/NA + cos Σ).
//
// El perfil del diente usa la aproximación de Tredgold, la habitual para engranajes
// cónicos rectos: sobre el «cono trasero» (perpendicular al cono primitivo en el borde
// exterior) el diente es el de un engranaje recto virtual de radio A·tan δ y N / cos δ
// dientes, con flancos de evolvente (ángulo de presión 20°). Ese perfil se proyecta
// desde el centro de la esfera: los flancos de un cónico recto son superficies regladas
// que pasan por el vértice, así que todo el diente es la extrusión cónica de un perfil
// plano. Las dos caras del engranaje se cortan con planos perpendiculares al eje, para
// que tenga una cara plana donde apoyarlo al imprimir.

import type { Symmetry } from './layout'
import { arrangement } from './layout'

export type Process = 'fdm' | 'resina'

// Holguras por proceso, en mm (o grados donde se indica).
export const FIT = {
  fdm: { backlash: 0.35, bore: 0.25, hex: 0.15, pinCore: 0.1, axial: 0.15, sweep: 1.2, tiltDeg: 2, minModule: 1.15, wall: 1.2, petal: 1.6 },
  resina: { backlash: 0.2, bore: 0.15, hex: 0.08, pinCore: 0.05, axial: 0.1, sweep: 0.8, tiltDeg: 1.5, minModule: 0.7, wall: 0.9, petal: 1.2 },
} as const
export type Fit = (typeof FIT)[Process]

export const PRESSURE = (20 * Math.PI) / 180
export const ADDENDUM = 1.0
export const DEDENDUM = 1.25

export type Combo = {
  NA: number; NB: number
  dA: number; dB: number // semiángulos de los conos primitivos (rad)
  m: number              // módulo en el borde exterior (mm)
  NvA: number; NvB: number // dientes del engranaje virtual de Tredgold
  tipA: number; tipB: number // semiángulo del cono de las puntas
}

export function coneAngles(NA: number, NB: number, sigma: number) {
  const dA = Math.atan2(Math.sin(sigma), NB / NA + Math.cos(sigma))
  return { dA, dB: sigma - dA }
}

// Todas las combinaciones de dientes que sirven para un arreglo y un tamaño: los conos
// de la misma clase no se tocan, el diente no queda socavado de más y el módulo se puede
// imprimir.
export function combos(sym: Symmetry, Aout: number, proc: Process): Combo[] {
  const arr = arrangement(sym), fit = FIT[proc], out: Combo[] = []
  const gapRad = (1.2 * Math.PI) / 180
  for (let NA = arr.kA * 3; NA <= 72; NA += arr.kA) for (let NB = 12; NB <= 60; NB += 3) {
    const { dA, dB } = coneAngles(NA, NB, arr.sigma)
    if (dA <= 0 || dB <= 0) continue
    const m = (2 * Aout * Math.sin(dA)) / NA
    if (m < fit.minModule || m > 4) continue
    const tA = Math.atan((ADDENDUM * m) / Aout), tipA = dA + tA, tipB = dB + tA
    if (tipA > arr.sigmaAA / 2 - gapRad || tipB > arr.sigmaBB / 2 - gapRad) continue
    const NvA = NA / Math.cos(dA), NvB = NB / Math.cos(dB)
    if (Math.min(NvA, NvB) < 15.5) continue
    // el engranaje más chico tiene que dejar lugar al buje y al pasador
    if (Aout * Math.sin(Math.min(dA, dB)) < 11) continue
    out.push({ NA, NB, dA, dB, m, NvA, NvB, tipA, tipB })
  }
  return out.sort((a, b) => a.NA / a.NB - b.NA / b.NB || a.m - b.m)
}

// La combinación por defecto: proporción cercana a la pedida y el módulo más grueso
// que no deje dientes toscos (dientes de ~1,6 mm en FDM, ~1,1 mm en resina).
export function pickCombo(list: Combo[], ratio: number, proc: Process): Combo | null {
  if (!list.length) return null
  const target = proc === 'fdm' ? 1.6 : 1.1
  let best = list[0], bs = Infinity
  for (const c of list) {
    const s = Math.abs(Math.log(c.NA / c.NB / ratio)) * 3 + Math.abs(Math.log(c.m / target))
    if (s < bs) { bs = s; best = c }
  }
  return best
}

// ---------------------------------------------------------------------------------
// Geometría de un engranaje y de su apilado sobre el eje (todo en el marco del
// engranaje: z a lo largo del eje desde el centro de la esfera, en mm).

export type GearGeom = {
  N: number; delta: number; m: number; Aout: number; Ain: number
  zIn: number; zOut: number       // planos que cortan los dientes
  tip: number; root: number       // semiángulos de los conos de punta y de fondo
  phase: 0 | 0.5                  // 0: diente en el ángulo 0; 0,5: hueco
  U: Float64Array                 // contorno (u, v) en el plano z = 1, antihorario
  // apilado: buje inferior, agujero del pasador, alojamiento de la cabeza, encaje hexagonal
  zSb: number; rS: number         // fondo y radio exterior del buje
  rB: number                      // agujero del pasador
  zC: number; rCB: number         // piso del alojamiento de la cabeza
  zK: number; sH: number          // piso del encaje hexagonal y su apotema
  zb: number                      // cara del núcleo donde apoya el buje
  plate: number                   // radio del plato de la decoración
}

export type PinGeom = { r1: number; r2: number; r3: number; hH: number; L1: number; g2: number; g3: number }

export function rootRadius(g: GearGeom, z: number) { return z * Math.tan(g.root) }

const inv = (x: number) => Math.tan(x) - x

// Contorno del engranaje en el plano z = 1 (proyección central desde el vértice).
export function outline(N: number, delta: number, Aout: number, m: number, backlash: number, phase: 0 | 0.5): Float64Array {
  const rv = Aout * Math.tan(delta), rb = rv * Math.cos(PRESSURE), ra = rv + ADDENDUM * m, rf = rv - DEDENDUM * m
  const s = (Math.PI * m) / 2 - backlash / 2, psiP = s / (2 * rv)
  const psi = (r: number) => psiP + inv(PRESSURE) - inv(Math.acos(Math.min(1, rb / r)))
  if (psi(ra) <= 0.02 / rv) throw new Error('diente en punta: menos dientes o más módulo')
  const k = 1 / Math.cos(delta), zB = Aout / Math.cos(delta), cd = Math.cos(delta), sd = Math.sin(delta)
  const r0 = Math.max(rb, rf), nF = 14, nT = 4, nR = 5
  const radii: number[] = []
  for (let i = 0; i <= nF; i++) { const t = i / nF; radii.push(r0 + (ra - r0) * (1 - (1 - t) * (1 - t) * 0.6 - 0.4 * (1 - t))) }
  const pts: number[] = []
  const put = (rho: number, th: number) => { const qz = zB - rho * sd; pts.push((rho * cd * Math.cos(th)) / qz, (rho * cd * Math.sin(th)) / qz) }
  const pitch = (2 * Math.PI) / N, psiRoot = psi(r0)
  for (let i = 0; i < N; i++) {
    const c = (i + phase) * pitch
    if (rf < rb) put(rf, c - psiRoot * k)
    for (const r of radii) put(r, c - psi(r) * k)
    const tA = psi(ra) * k
    for (let j = 1; j < nT; j++) put(ra, c - tA + (2 * tA * j) / nT)
    for (let q = radii.length - 1; q >= 0; q--) put(radii[q], c + psi(radii[q]) * k)
    if (rf < rb) put(rf, c + psiRoot * k)
    const a0 = c + psiRoot * k, a1 = c + pitch - psiRoot * k
    for (let j = 1; j < nR; j++) put(rf, a0 + ((a1 - a0) * j) / nR)
  }
  return Float64Array.from(pts)
}

export type BuildOpts = { sym: Symmetry; Aout: number; combo: Combo; proc: Process }

export function gearPair(o: BuildOpts): { A: GearGeom; B: GearGeom; pin: PinGeom } {
  const fit = FIT[o.proc], c = o.combo, Aout = o.Aout, Ain = Aout * 0.7
  // pasador: más grueso en esferas grandes
  const r2 = Math.min(3, Math.max(1.6, 0.065 * Aout)), r1 = r2 * 0.72, r3 = r2 + 1.5, hH = 1.4, g3 = 0.3
  const pin: PinGeom = { r1, r2, r3, hH, L1: 0, g2: fit.axial, g3 }
  const mk = (N: number, delta: number, phase: 0 | 0.5): GearGeom => {
    const zIn = Ain * Math.cos(delta), zOut = Aout * Math.cos(delta)
    const tip = delta + Math.atan((ADDENDUM * c.m) / Aout), root = delta - Math.atan((DEDENDUM * c.m) / Aout)
    const rB = r2 + fit.bore, rCB = r3 + fit.bore + 0.1, sH = rCB + 0.9, rS = rB + 1.6
    const zK = zOut - 2.2, zC = zK - g3 - hH - fit.axial, zSb = zIn - 3, zb = zSb - fit.axial
    const g: GearGeom = {
      N, delta, m: c.m, Aout, Ain, zIn, zOut, tip, root, phase,
      U: outline(N, delta, Aout, c.m, fit.backlash, phase),
      zSb, rS, rB, zC, rCB, zK, sH, zb, plate: 0,
    }
    g.plate = rootRadius(g, zOut) - 1.25
    return g
  }
  const A = mk(c.NA, c.dA, 0), B = mk(c.NB, c.dB, 0.5)
  pin.L1 = Math.min(7, 0.3 * Math.min(A.zb, B.zb))
  return { A, B, pin }
}

// Problemas de apilado (paredes muy finas, buje sin largo): vacío si está todo bien.
export function stackIssues(g: GearGeom, fit: Fit): string[] {
  const out: string[] = []
  if (g.zC - g.zSb < 3) out.push('el agujero del pasador queda corto')
  if (rootRadius(g, g.zIn) < g.rS + fit.wall) out.push('el buje no cabe bajo los dientes')
  if (rootRadius(g, g.zC) < g.rCB + fit.wall) out.push('la cabeza del pasador no cabe')
  if (rootRadius(g, g.zK) < g.sH / Math.cos(Math.PI / 6) + fit.wall) out.push('el encaje hexagonal no cabe')
  return out
}

// ---------------------------------------------------------------------------------
// Malla exacta del engranaje. Anillos de puntos compartidos entre paredes y tapas: la
// malla sale cerrada por construcción.

export type Mesh = { positions: Float32Array; indices: Uint32Array }

class Builder {
  P: number[] = []
  I: number[] = []
  ring(xy: ArrayLike<number>, z: number) {
    const base = this.P.length / 3
    for (let i = 0; i < xy.length; i += 2) this.P.push(xy[i], xy[i + 1], z)
    return { base, n: xy.length / 2, xy, z }
  }
  // pared entre dos anillos con los mismos puntos (abajo → arriba); hole: normales hacia el eje
  wall(lo: Ring, hi: Ring, hole = false) {
    const n = lo.n
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, a = lo.base + i, b = lo.base + j, c = hi.base + j, d = hi.base + i
      if (hole) this.I.push(a, c, b, a, d, c)
      else this.I.push(a, b, c, a, c, d)
    }
  }
  // tapa anular entre dos anillos estrellados (externo e interno) a la misma altura
  cap(outer: Ring, inner: Ring, up: boolean) {
    const ao = angles(outer.xy), ai = angles(inner.xy)
    const so = argmin(ao.raw), si = argmin(ai.raw)
    const O = unwrap(ao.raw, so), Iw = unwrap(ai.raw, si)
    const no = outer.n, ni = inner.n
    let i = 0, j = 0
    const io = (k: number) => outer.base + ((so + k) % no), ii = (k: number) => inner.base + ((si + k) % ni)
    const tri = (a: number, b: number, c: number) => { if (up) this.I.push(a, b, c); else this.I.push(a, c, b) }
    while (i < no || j < ni) {
      const nextO = i < no ? O[i + 1] : Infinity, nextI = j < ni ? Iw[j + 1] : Infinity
      if (nextO <= nextI) { tri(io(i), io(i + 1), ii(j)); i++ }
      else { tri(io(i), ii(j + 1), ii(j)); j++ }
    }
  }
  mesh(): Mesh { return { positions: Float32Array.from(this.P), indices: Uint32Array.from(this.I) } }
}
type Ring = { base: number; n: number; xy: ArrayLike<number>; z: number }

function angles(xy: ArrayLike<number>) {
  const raw: number[] = []
  for (let i = 0; i < xy.length; i += 2) { let a = Math.atan2(xy[i + 1], xy[i]); if (a < 0) a += 2 * Math.PI; raw.push(a) }
  return { raw }
}
const argmin = (a: number[]) => { let k = 0; for (let i = 1; i < a.length; i++) if (a[i] < a[k]) k = i; return k }
// ángulos crecientes desde el índice s, con un centinela final (+2π)
function unwrap(raw: number[], s: number) {
  const n = raw.length, out = new Array<number>(n + 1)
  let prev = raw[s]; out[0] = prev
  for (let k = 1; k < n; k++) {
    let a = raw[(s + k) % n]
    while (a < prev - 1e-9) a += 2 * Math.PI
    out[k] = a; prev = a
  }
  out[n] = out[0] + 2 * Math.PI
  return out
}

export function circle(r: number, n: number, rot = 0): Float64Array {
  const o = new Float64Array(2 * n)
  for (let i = 0; i < n; i++) { const a = rot + (2 * Math.PI * i) / n; o[2 * i] = r * Math.cos(a); o[2 * i + 1] = r * Math.sin(a) }
  return o
}
// hexágono de apotema s (con lados subdivididos, para que las tapas queden parejas)
export function hexagon(s: number, sub = 6): Float64Array {
  const R = s / Math.cos(Math.PI / 6), o: number[] = []
  for (let k = 0; k < 6; k++) {
    const a0 = (Math.PI / 3) * k, a1 = a0 + Math.PI / 3
    const x0 = R * Math.cos(a0), y0 = R * Math.sin(a0), x1 = R * Math.cos(a1), y1 = R * Math.sin(a1)
    for (let j = 0; j < sub; j++) { const t = j / sub; o.push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t) }
  }
  return Float64Array.from(o)
}

export function gearMesh(g: GearGeom): Mesh {
  const b = new Builder(), nC = 56
  const sc = (z: number) => { const o = new Float64Array(g.U.length); for (let i = 0; i < o.length; i++) o[i] = g.U[i] * z; return o }
  const toothIn = b.ring(sc(g.zIn), g.zIn), toothOut = b.ring(sc(g.zOut), g.zOut)
  const hex = hexagon(g.sH), hexTop = b.ring(hex, g.zOut), hexBot = b.ring(hex, g.zK)
  const cbTop = b.ring(circle(g.rCB, nC), g.zK), cbBot = b.ring(circle(g.rCB, nC), g.zC)
  const boreTop = b.ring(circle(g.rB, nC), g.zC), boreBot = b.ring(circle(g.rB, nC), g.zSb)
  const slBot = b.ring(circle(g.rS, nC), g.zSb), slTop = b.ring(circle(g.rS, nC), g.zIn)
  b.wall(toothIn, toothOut)            // flancos y puntas
  b.cap(toothOut, hexTop, true)        // cara exterior
  b.wall(hexBot, hexTop, true)         // paredes del encaje
  b.cap(hexBot, cbTop, true)           // piso del encaje
  b.wall(cbBot, cbTop, true)           // alojamiento de la cabeza
  b.cap(cbBot, boreTop, true)          // piso del alojamiento
  b.wall(boreBot, boreTop, true)       // agujero del pasador
  b.cap(slBot, boreBot, false)         // fondo del buje
  b.wall(slBot, slTop)                 // buje
  b.cap(toothIn, slTop, false)         // cara interior
  return b.mesh()
}

// Sólido de revolución a partir de un perfil (r, z) que empieza y termina en el eje.
export function lathe(profile: [number, number][], n = 48): Mesh {
  const P: number[] = [], I: number[] = [], rings: number[] = []
  for (const [r, z] of profile) {
    rings.push(P.length / 3)
    if (r <= 1e-9) P.push(0, 0, z)
    else for (let i = 0; i < n; i++) { const a = (2 * Math.PI * i) / n; P.push(r * Math.cos(a), r * Math.sin(a), z) }
  }
  for (let k = 0; k + 1 < profile.length; k++) {
    const a0 = rings[k], a1 = rings[k + 1], p0 = profile[k][0] <= 1e-9, p1 = profile[k + 1][0] <= 1e-9
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      // el perfil va de abajo hacia arriba por afuera: normales hacia afuera
      if (p0 && p1) continue
      if (p0) I.push(a0, a1 + j, a1 + i)
      else if (p1) I.push(a0 + i, a0 + j, a1)
      else I.push(a0 + i, a0 + j, a1 + j, a0 + i, a1 + j, a1 + i)
    }
  }
  return { positions: Float32Array.from(P), indices: Uint32Array.from(I) }
}

export function pinMesh(g: GearGeom, p: PinGeom, coreFit: number): Mesh {
  void coreFit
  const z0 = g.zb - p.L1 + 0.3, zh0 = g.zC + p.g2, zh1 = zh0 + p.hH, ch = 0.3
  return lathe([
    [0, z0], [p.r1 - ch, z0], [p.r1, z0 + ch], [p.r1, g.zb], [p.r2, g.zb], [p.r2, zh0], [p.r3, zh0], [p.r3, zh1 - ch], [p.r3 - ch, zh1], [0, zh1],
  ])
}
