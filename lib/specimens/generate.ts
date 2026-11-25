import { buildField } from './families'
import { resolveGenome, type Genome } from './genome'
import { sampleGrid, polygonize, type Mesh } from './polygonize'
import { analyze, orientForPrint, DEFAULT_SIZE_MM, type Metrics } from './analyze'

export type Generated = { mesh: Mesh; metrics: Metrics }

// Receta -> malla lista para imprimir (orientada, apoyada en z=0, en mm).
// Es determinista: el mismo genoma da la misma forma en el
// script que puntúa y en el navegador que muestra/exporta.
export function generateOriented(genome: Genome, res: number, sizeMm = DEFAULT_SIZE_MM): Generated | null {
  const recipe = resolveGenome(genome)
  const grid = sampleGrid(buildField(recipe), res)
  const out = analyze(polygonize(grid), grid, sizeMm)
  if (!out) return null
  return { mesh: orientForPrint(out.mesh, out.metrics.up, sizeMm), metrics: out.metrics }
}
