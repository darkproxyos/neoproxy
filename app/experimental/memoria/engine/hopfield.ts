// Red de Hopfield (John Hopfield, "Neural networks and physical systems
// with emergent collective computational abilities", 1982) — memoria
// asociativa: cada patrón guardado es un mínimo de energía de la red.
// Arrancar de una versión corrupta/incompleta de un patrón y dejar correr
// la dinámica hace que el sistema "ruede cuesta abajo" en su propia
// energía hasta caer exactamente en el patrón completo — siempre que no
// se haya superado la capacidad de la red (≈0.138·N patrones para N
// neuronas, Amit, Gutfreund & Sompolinsky, 1985). Más allá de eso el
// recuerdo empieza a fallar de verdad, y este motor no lo esconde: se
// puede sobrecargar la red a propósito y ver cómo se rompe.
//
// Estado de cada neurona: +1 / −1 (no 0/1 — así "wij·si·sj" mide
// correctamente acuerdo/desacuerdo entre neuronas). Puro cálculo, sin
// Babylon ni ningún motor gráfico: esta vez el objeto es un bitmap 2D,
// no una escena 3D.

export type Pattern = number[]

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export { mulberry32 }

export const GRID_SIZE = 10
export const N = GRID_SIZE * GRID_SIZE
// Capacidad teórica (Amit-Gutfreund-Sompolinsky): ~0.138·N patrones antes
// de que el recuerdo empiece a degradarse de forma apreciable.
export const CAPACITY = Math.floor(0.138 * N)

export type PatternDef = { id: string; label: string; rows: string[] }

// 4 bitmaps de 10×10 a mano, elegidos para ser inconfundibles a simple
// vista entre sí (sin esto, confirmar "convergió al patrón correcto" a
// ojo sería imposible).
export const PATTERN_DEFS: PatternDef[] = [
  {
    id: 'cruz', label: 'CRUZ',
    rows: [
      '0000110000', '0000110000', '0000110000', '0000110000', '1111111111',
      '1111111111', '0000110000', '0000110000', '0000110000', '0000110000',
    ],
  },
  {
    id: 'equis', label: 'EQUIS',
    rows: [
      '1000000001', '0100000010', '0010000100', '0001001000', '0000110000',
      '0000110000', '0001001000', '0010000100', '0100000010', '1000000001',
    ],
  },
  {
    id: 'marco', label: 'MARCO',
    rows: [
      '1111111111', '1000000001', '1000000001', '1000000001', '1000000001',
      '1000000001', '1000000001', '1000000001', '1000000001', '1111111111',
    ],
  },
  {
    id: 'diagonal', label: 'DIAGONAL',
    rows: [
      '1100000000', '1110000000', '0111000000', '0011100000', '0001110000',
      '0000111000', '0000011100', '0000001110', '0000000111', '0000000011',
    ],
  },
]

export function patternFromRows(rows: string[]): Pattern {
  return rows.join('').split('').map((c) => (c === '1' ? 1 : -1))
}

export function randomPattern(rand: () => number): Pattern {
  return Array.from({ length: N }, () => (rand() < 0.5 ? 1 : -1))
}

// Regla de Hebb: cada peso acumula cuánto coinciden dos neuronas A TRAVÉS
// de todos los patrones guardados — sin diagonal (una neurona no se
// conecta consigo misma).
export function trainHopfield(patterns: Pattern[]): Float32Array {
  const w = new Float32Array(N * N)
  for (const p of patterns) {
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const delta = (p[i] * p[j]) / N
        w[i * N + j] += delta
        w[j * N + i] += delta
      }
    }
  }
  return w
}

export function energyOf(state: Pattern, w: Float32Array): number {
  let e = 0
  for (let i = 0; i < N; i++) {
    let rowSum = 0
    for (let j = 0; j < N; j++) rowSum += w[i * N + j] * state[j]
    e += rowSum * state[i]
  }
  return -0.5 * e
}

// Un paso ASÍNCRONO: actualiza las neuronas en orden aleatorio, una por
// una, cada una viendo ya el valor actualizado de las anteriores en este
// mismo paso — converge de forma más estable que actualizar todas juntas.
export function stepHopfieldAsync(state: Pattern, w: Float32Array, rand: () => number): Pattern {
  const next = state.slice()
  const order = Array.from({ length: N }, (_, i) => i)
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  for (const i of order) {
    let sum = 0
    for (let j = 0; j < N; j++) sum += w[i * N + j] * next[j]
    next[i] = sum >= 0 ? 1 : -1
  }
  return next
}

export function corrupt(pattern: Pattern, fraction: number, rand: () => number): Pattern {
  return pattern.map((v) => (rand() < fraction ? -v : v))
}

export function overlap(a: Pattern, b: Pattern): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) sum++
  return sum / a.length
}
