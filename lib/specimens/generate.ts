import { sampleRecipe, buildField, type Family } from './families'
import { sampleGrid, polygonize, type Mesh } from './polygonize'
import { analyze, orientForPrint, DEFAULT_SIZE_MM, type Metrics } from './analyze'

export type Generated = { mesh: Mesh; metrics: Metrics }

// Receta -> malla lista para imprimir (orientada, apoyada en z=0, en mm).
// Es determinista: la misma {familia, semilla} da la misma forma en el
// script que puntúa y en el navegador que muestra/exporta.
export function generateOriented(family: Family, seed: number, res: number, sizeMm = DEFAULT_SIZE_MM): Generated | null {
  const recipe = sampleRecipe(family, seed)
  const grid = sampleGrid(buildField(recipe), res)
  const out = analyze(polygonize(grid), grid, sizeMm)
  if (!out) return null
  return { mesh: orientForPrint(out.mesh, out.metrics.up, sizeMm), metrics: out.metrics }
}
