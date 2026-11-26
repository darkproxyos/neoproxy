// De una órbita del catálogo a curvas listas para dibujar e imprimir: las tres líneas de
// mundo (x, y, t) muestreadas con Hermite, más finas donde los cuerpos van rápido.
import CATALOG from './catalog.json'
import { integrate, initial, sampleAt, type Track } from './nbody'

export type OrbitEntry = (typeof CATALOG)[number]
export const ORBITS = CATALOG as OrbitEntry[]
export const orbitById = (id: string) => ORBITS.find((o) => o.id === id) ?? ORBITS[0]

export type Strands = {
  T: number; periods: number
  // por cuerpo: puntos (x, y, t) y rapidez en cada punto
  pts: Float32Array[]; speed: Float32Array[]
  // tabla uniforme en el tiempo para mover los cuerpos: n × 6 (x1,y1,x2,y2,x3,y3)
  table: Float32Array; tableN: number
  extent: number // radio máximo en el plano
}

export function computeTrack(o: { p1: number; p2: number; T: number }, periods: number, eps = 0): Track {
  return integrate(initial(o.p1 + eps, o.p2), o.T * periods, 1e-12)
}

// maxStep: largo máximo de cada tramo en el plano; dtMax: tramo máximo en el tiempo
export function strandsFrom(tr: Track, T: number, periods: number, maxStep = 0.012, dtMax?: number, tableN = 2400): Strands {
  const span = T * periods, dtm = dtMax ?? T / 1500
  const p = new Float64Array(6), q = new Float64Array(6)
  const pts: number[][] = [[], [], []], sp: number[][] = [[], [], []]
  let hint = 0, extent = 0
  // se recorre el tiempo con paso adaptado a la rapidez del cuerpo más rápido
  let t = 0
  while (true) {
    hint = sampleAt(tr, t, p, hint)
    const i = Math.min(hint, tr.t.length - 1), y = tr.y[i]
    let vmax = 0
    for (let b = 0; b < 3; b++) {
      const v = Math.hypot(y[6 + 2 * b], y[7 + 2 * b]); vmax = Math.max(vmax, v)
      pts[b].push(p[2 * b], p[2 * b + 1], t); sp[b].push(v)
      extent = Math.max(extent, Math.hypot(p[2 * b], p[2 * b + 1]))
    }
    if (t >= span) break
    t = Math.min(span, t + Math.min(dtm, maxStep / Math.max(1e-6, vmax)))
  }
  const table = new Float32Array(tableN * 6)
  hint = 0
  for (let k = 0; k < tableN; k++) { hint = sampleAt(tr, (span * k) / (tableN - 1), q, hint); for (let j = 0; j < 6; j++) table[6 * k + j] = q[j] }
  return { T, periods, pts: pts.map((a) => Float32Array.from(a)), speed: sp.map((a) => Float32Array.from(a)), table, tableN, extent }
}
