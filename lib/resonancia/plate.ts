// RESONANCIA: una placa cuadrada libre, empujada en un punto a una frecuencia. La forma
// en que vibra es la suma de sus modos propios (Ritz, ver ritz.ts), cada uno pesado por
// cuánto lo excita el punto de empuje y por lo cerca que está la frecuencia de la suya.
// La arena salta donde la placa se mueve y se queda donde no: en las líneas nodales.
import MODES from './modes.json'
import { legendre } from './ritz'

export type Drive = 'centro' | 'borde' | 'esquina'
export const DRIVES: Record<Drive, { x: number; y: number; label: string }> = {
  centro: { x: 0, y: 0, label: 'CENTRO' },
  borde: { x: 0.62, y: 0, label: 'BORDE' },
  esquina: { x: 0.55, y: 0.55, label: 'DIAGONAL' },
}
export const ETA = 0.012 // amortiguamiento (factor de pérdida): elegido, no medido

// placa de referencia para convertir a hertz: acero, 24 cm de lado, 1 mm de espesor
export const PLATE = { E: 200e9, rho: 7850, nu: 0.3, side: 0.24, h: 0.001 }
const D = (PLATE.E * PLATE.h ** 3) / (12 * (1 - PLATE.nu ** 2))
export const HZ_PER_LAMBDA = Math.sqrt(D / (PLATE.rho * PLATE.h)) / (2 * Math.PI * PLATE.side ** 2)
export const hz = (lambda: number) => lambda * HZ_PER_LAMBDA
export const lambdaOf = (f: number) => f / HZ_PER_LAMBDA

export const MODE_LIST = (MODES as { modes: { lambda: number; coef: number[] }[] }).modes
const NB = (MODES as { n: number }).n + 1

// valor de un modo en un punto
export function modeAt(k: number, x: number, y: number) {
  const [Px] = legendre(NB - 1, x), [Py] = legendre(NB - 1, y), c = MODE_LIST[k].coef
  let s = 0; for (let i = 0; i < NB; i++) { const pi = Px[i]; if (!pi) continue; for (let j = 0; j < NB; j++) s += c[i * NB + j] * pi * Py[j] }
  return s
}

// los modos evaluados en una grilla G×G sobre [-1,1]² (fila y, columna x)
export function modeGrids(G: number): Float32Array[] {
  const tabs = Array.from({ length: G }, (_, i) => legendre(NB - 1, -1 + (2 * i) / (G - 1))[0])
  return MODE_LIST.map((m) => {
    const out = new Float32Array(G * G), c = m.coef, tmp = new Float64Array(NB * G)
    // tmp[j][x] = Σ_i c[i][j] P_i(x)
    for (let x = 0; x < G; x++) for (let j = 0; j < NB; j++) { let s = 0; for (let i = 0; i < NB; i++) s += c[i * NB + j] * tabs[x][i]; tmp[j * G + x] = s }
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) { let s = 0; for (let j = 0; j < NB; j++) s += tmp[j * G + x] * tabs[y][j]; out[y * G + x] = s }
    return out
  })
}

// cuánto excita el punto de empuje a cada modo
export const coupling = (drive: Drive) => MODE_LIST.map((_, k) => modeAt(k, DRIVES[drive].x, DRIVES[drive].y))

// resonancias audibles desde ese punto (los modos con nodo en el punto de empuje no responden)
export function resonances(drive: Drive) {
  const c = coupling(drive), mx = Math.max(...c.map(Math.abs))
  return MODE_LIST.map((m, k) => ({ k, lambda: m.lambda, hz: hz(m.lambda), c: c[k] })).filter((r) => Math.abs(r.c) > 0.08 * mx)
}

// respuesta a la frecuencia λ: parte real e imaginaria del desplazamiento en la grilla
export function response(grids: Float32Array[], G: number, cpl: number[], lambda: number, eta = ETA) {
  const re = new Float32Array(G * G), im = new Float32Array(G * G)
  const l2 = lambda * lambda
  for (let k = 0; k < grids.length; k++) {
    const lk = MODE_LIST[k].lambda, a = lk * lk - l2, b = eta * lk * lk, den = a * a + b * b
    const wr = (cpl[k] * a) / den, wi = (-cpl[k] * b) / den
    if (Math.abs(wr) + Math.abs(wi) < 1e-12) continue
    const g = grids[k]
    for (let i = 0; i < G * G; i++) { re[i] += wr * g[i]; im[i] += wi * g[i] }
  }
  const amp = new Float32Array(G * G); let mx = 1e-30
  for (let i = 0; i < G * G; i++) { const v = Math.sqrt(re[i] * re[i] + im[i] * im[i]); amp[i] = v; if (v > mx) mx = v }
  for (let i = 0; i < G * G; i++) amp[i] /= mx
  return { re, im, amp, max: mx }
}

// ---- arena ----------------------------------------------------------------------------
export function rng(seed: number) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

export class Sand {
  x: Float32Array; y: Float32Array; n: number; r: () => number
  constructor(n: number, seed = 1) {
    this.n = n; this.r = rng(seed); this.x = new Float32Array(n); this.y = new Float32Array(n)
    this.scatter()
  }
  scatter() { for (let i = 0; i < this.n; i++) { this.x[i] = this.r() * 2 - 1; this.y[i] = this.r() * 2 - 1 } }
  // cada grano salta al azar, más lejos cuanto más vibra la placa bajo él; los que llegan
  // a una línea nodal casi no se mueven y se acumulan ahí
  step(amp: Float32Array, G: number, ticks = 1, jump = 0.05) {
    const { x, y, r, n } = this, s = (G - 1) / 2
    for (let t = 0; t < ticks; t++) for (let i = 0; i < n; i++) {
      const gx = (x[i] + 1) * s, gy = (y[i] + 1) * s
      const ix = Math.min(G - 2, Math.max(0, Math.floor(gx))), iy = Math.min(G - 2, Math.max(0, Math.floor(gy)))
      const fx = gx - ix, fy = gy - iy, o = iy * G + ix
      const a = (amp[o] * (1 - fx) + amp[o + 1] * fx) * (1 - fy) + (amp[o + G] * (1 - fx) + amp[o + G + 1] * fx) * fy
      const j = jump * a + 0.001
      let nx = x[i] + (r() * 2 - 1) * j, ny = y[i] + (r() * 2 - 1) * j
      if (nx < -1) nx = -2 - nx; if (nx > 1) nx = 2 - nx; if (ny < -1) ny = -2 - ny; if (ny > 1) ny = 2 - ny
      x[i] = nx; y[i] = ny
    }
  }
}

// qué fracción de la arena está sobre las líneas nodales (amplitud < umbral)
export function onNodes(s: Sand, amp: Float32Array, G: number, th = 0.12) {
  let c = 0; const sc = (G - 1) / 2
  for (let i = 0; i < s.n; i++) { const ix = Math.round((s.x[i] + 1) * sc), iy = Math.round((s.y[i] + 1) * sc); if (amp[iy * G + ix] < th) c++ }
  return c / s.n
}
