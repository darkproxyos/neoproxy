// RNG determinista (mulberry32). Un espécimen es una receta {familia, semilla,
// parámetros}: la misma receta tiene que dar la misma forma en Node (donde se
// puntúa) y en el navegador (donde se muestra y se exporta), así que nada acá
// usa Math.random().

export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const range = (r: Rng, lo: number, hi: number) => lo + (hi - lo) * r()
export const int = (r: Rng, lo: number, hi: number) => Math.floor(range(r, lo, hi + 1))
export const pick = <T,>(r: Rng, items: readonly T[]): T => items[Math.floor(r() * items.length)]
