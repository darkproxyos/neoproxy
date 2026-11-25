// Selección por calidad y diversidad.
//
// Primer intento: MAP-Elites sobre una grilla de descriptores (complejidad ×
// alargamiento × género). Con 1000 candidatos solo se llenaban ~40 celdas, y el
// relleno por puntaje devolvía un salón de 39 mandelbulb y 1 armónico: justo la
// repetición que había que evitar. Ahora: (1) cuota pareja por familia, y (2)
// dentro de cada familia, selección de máxima distancia (farthest-point) sobre
// el vector de descriptores, ponderada por la calidad de cada pieza. Así cada
// familia aporta sus formas más distintas entre sí, no sus mejores clones.

import type { Recipe, Family } from './families'
import { FAMILY_WEIGHT } from './families'
import type { Metrics } from './analyze'

export type Candidate = { id: string; recipe: Recipe; metrics: Metrics }

export const MIN_PRINT_SCORE = 0.5
// Al salón solo entran piezas claramente imprimibles, y dentro de cada grupo solo
// compite la mitad superior por calidad: la diversidad elige entre las mejores.
export const HALL_MIN_PRINT = 0.6

export const descriptor = (m: Metrics) => [
  m.complexityN, m.genusN, m.elongation, m.entropy, Math.min(1, m.overhangFrac * 2), m.richness,
]
export const dist = (a: number[], b: number[]) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0))

function pickDiverse(items: Candidate[], quota: number): Candidate[] {
  if (items.length <= quota) return items
  const sorted = [...items].sort((a, b) => b.metrics.fitness - a.metrics.fitness)
  const desc = new Map(sorted.map((c) => [c.id, descriptor(c.metrics)]))
  const chosen = [sorted[0]]
  const minD = new Map(sorted.map((c) => [c.id, dist(desc.get(c.id)!, desc.get(sorted[0].id)!)]))
  while (chosen.length < quota) {
    let best: Candidate | null = null, bestScore = -1
    for (const c of sorted) {
      if (chosen.includes(c)) continue
      const sc = minD.get(c.id)! * (0.4 + c.metrics.fitness)
      if (sc > bestScore) { bestScore = sc; best = c }
    }
    if (!best) break
    chosen.push(best)
    for (const c of sorted) minD.set(c.id, Math.min(minD.get(c.id)!, dist(desc.get(c.id)!, desc.get(best.id)!)))
  }
  return chosen
}

// Un cruce cuenta por su operador (cada modo de simbiosis es un grupo propio);
// un algoritmo puro, por su familia. Así la cuota reparte entre "maneras de
// producir una forma", no solo entre nombres de familia.
export const groupKey = (c: Candidate) =>
  c.recipe.family === 'symbiosis' ? `symbiosis:${c.recipe.params.op as string}` : c.recipe.family

// El peso sale de FAMILY_WEIGHT; los cruces pesan más porque ahí "emergen"
// formas que ningún algoritmo da solo.
const weightOf = (key: string) => (key.startsWith('symbiosis:') ? FAMILY_WEIGHT.symbiosis : FAMILY_WEIGHT[key as Family] ?? 1)

export function selectHall(cands: Candidate[], hallSize = 400): Candidate[] {
  const viable = cands.filter((c) => c.metrics.printScore >= HALL_MIN_PRINT)
  const byGroup = new Map<string, Candidate[]>()
  for (const c of viable) {
    const k = groupKey(c)
    byGroup.set(k, [...(byGroup.get(k) ?? []), c])
  }
  const keys = [...byGroup.keys()].sort()
  // cuota proporcional al peso; lo que un grupo no puede llenar (pocas
  // imprimibles) se reparte entre los que sí tienen de sobra
  const quota = new Map<string, number>(keys.map((k) => [k, 0]))
  let left = hallSize
  while (left > 0) {
    const open = keys.filter((k) => quota.get(k)! < byGroup.get(k)!.length)
    if (!open.length) break
    const totalW = open.reduce((a, k) => a + weightOf(k), 0)
    let given = 0
    for (const k of open) {
      const want = Math.max(1, Math.floor((left * weightOf(k)) / totalW))
      const add = Math.min(want, byGroup.get(k)!.length - quota.get(k)!, left - given)
      quota.set(k, quota.get(k)! + add)
      given += add
      if (given >= left) break
    }
    left -= given
    if (given === 0) break
  }
  const chosen = keys.flatMap((k) => {
    const q = quota.get(k)!
    const sorted = [...byGroup.get(k)!].sort((a, b) => b.metrics.fitness - a.metrics.fitness)
    return pickDiverse(sorted.slice(0, Math.max(q * 2, Math.ceil(sorted.length / 2))), q)
  })
  return interleaveByGroup(chosen)
}

// Round-robin entre grupos (cada uno ordenado por fitness): cualquier ventana
// contigua del salón mezcla algoritmos y modos de cruce distintos.
export function interleaveByGroup(items: Candidate[]): Candidate[] {
  const groups = new Map<string, Candidate[]>()
  for (const c of items) {
    const k = groupKey(c)
    groups.set(k, [...(groups.get(k) ?? []), c])
  }
  const lists = [...groups.values()]
    .map((g) => g.sort((a, b) => b.metrics.fitness - a.metrics.fitness))
    .sort((a, b) => b[0].metrics.fitness - a[0].metrics.fitness)
  const out: Candidate[] = []
  for (let i = 0; out.length < items.length; i++) {
    for (const l of lists) if (l[i]) out.push(l[i])
  }
  return out
}

// ---- rotación ---------------------------------------------------------------

export const SHOW_COUNT = 96
export const ROTATE_STEP = 16
const EPOCH_MS = Date.UTC(2026, 0, 5) // lunes
const WEEK_MS = 7 * 24 * 3600 * 1000

export const weekIndex = (now: number) => Math.floor((now - EPOCH_MS) / WEEK_MS)
export const nextRotationAt = (now: number) => EPOCH_MS + (weekIndex(now) + 1) * WEEK_MS

// Ventana deslizante sobre el salón: cada semana salen ROTATE_STEP y entran ROTATE_STEP nuevos.
export function visibleIndices(hallLen: number, week: number, show = SHOW_COUNT, step = ROTATE_STEP): number[] {
  const start = (((week * step) % hallLen) + hallLen) % hallLen
  return Array.from({ length: Math.min(show, hallLen) }, (_, j) => (start + j) % hallLen)
}
