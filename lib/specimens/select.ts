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
import { FAMILIES } from './families'
import type { Metrics } from './analyze'

export type Candidate = { id: string; recipe: Recipe; metrics: Metrics }

export const MIN_PRINT_SCORE = 0.45

const descriptor = (m: Metrics) => [
  m.complexityN, m.genusN, m.elongation, m.entropy, Math.min(1, m.overhangFrac * 2), m.richness,
]
const dist = (a: number[], b: number[]) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0))

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

export function selectHall(cands: Candidate[], hallSize = 150): Candidate[] {
  const viable = cands.filter((c) => c.metrics.printScore >= MIN_PRINT_SCORE)
  const byFamily = new Map<Family, Candidate[]>(FAMILIES.map((f) => [f, viable.filter((c) => c.recipe.family === f)]))
  // cuota pareja; lo que una familia no puede llenar (pocas imprimibles) se
  // reparte entre las que sí tienen de sobra
  const quota = new Map<Family, number>(FAMILIES.map((f) => [f, 0]))
  let left = hallSize
  while (left > 0) {
    const open = FAMILIES.filter((f) => quota.get(f)! < byFamily.get(f)!.length)
    if (!open.length) break
    const share = Math.max(1, Math.floor(left / open.length))
    for (const f of open) {
      const add = Math.min(share, byFamily.get(f)!.length - quota.get(f)!, left)
      quota.set(f, quota.get(f)! + add)
      left -= add
      if (left <= 0) break
    }
  }
  const chosen = FAMILIES.flatMap((f) => pickDiverse(byFamily.get(f)!, quota.get(f)!))
  return interleaveByFamily(chosen)
}

// Round-robin entre familias (cada una ordenada por fitness): cualquier ventana
// contigua del salón mezcla algoritmos distintos.
export function interleaveByFamily(items: Candidate[]): Candidate[] {
  const groups = new Map<Family, Candidate[]>()
  for (const c of items) {
    const g = groups.get(c.recipe.family) ?? []
    g.push(c)
    groups.set(c.recipe.family, g)
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

export const SHOW_COUNT = 50
export const ROTATE_STEP = 10
const EPOCH_MS = Date.UTC(2026, 0, 5) // lunes
const WEEK_MS = 7 * 24 * 3600 * 1000

export const weekIndex = (now: number) => Math.floor((now - EPOCH_MS) / WEEK_MS)
export const nextRotationAt = (now: number) => EPOCH_MS + (weekIndex(now) + 1) * WEEK_MS

// Ventana deslizante sobre el salón: cada semana salen ROTATE_STEP y entran ROTATE_STEP nuevos.
export function visibleIndices(hallLen: number, week: number, show = SHOW_COUNT, step = ROTATE_STEP): number[] {
  const start = (((week * step) % hallLen) + hallLen) % hallLen
  return Array.from({ length: Math.min(show, hallLen) }, (_, j) => (start + j) % hallLen)
}
