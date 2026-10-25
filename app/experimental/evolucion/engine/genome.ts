// Dos paradigmas reales de evolución computacional, compartiendo el mismo
// genoma y el mismo motor de crecimiento (Space Colonization, el de
// Proxygenesis/Workbench) como "fenotipo" — lo que cambia es quién decide
// qué sobrevive:
//
//   SELECCIÓN ARTIFICIAL (Richard Dawkins, Biomorfos, "El Relojero Ciego",
//   1986): no hay función de fitness — el criterio de selección sos VOS,
//   mirando 9 variantes y eligiendo cuál te interesa más.
//
//   ALGORITMO GENÉTICO (John Holland, "Adaptation in Natural and
//   Artificial Systems", 1975): una población compite por una función de
//   fitness real y medible (qué tan cerca está cada espécimen de una
//   altura y cantidad de ramas objetivo), con selección por torneo, cruza
//   uniforme, mutación y elitismo — sin que nadie mire ni un solo
//   espécimen hasta que termina.
//
// Puro cálculo, sin Babylon — mismo criterio que el resto de los motores.

import type { Vec3 } from '@/app/lab/proxygenesis/engine/spaceColonization'

export type Genome = {
  curl: number
  canopyX: number
  canopyY: number
  canopyZ: number
  killDistance: number
  influenceRadius: number
  stepSize: number
}

export const GENE_RANGES: Record<keyof Genome, [number, number]> = {
  curl: [0, 0.4],
  canopyX: [1, 3],
  canopyY: [1, 3],
  canopyZ: [1, 3],
  killDistance: [0.1, 0.3],
  influenceRadius: [0.5, 1.2],
  stepSize: [0.06, 0.18],
}

export const GENE_LABELS: Record<keyof Genome, string> = {
  curl: 'CURVATURA', canopyX: 'COPA X', canopyY: 'COPA Y', canopyZ: 'COPA Z',
  killDistance: 'ALCANCE', influenceRadius: 'INFLUENCIA', stepSize: 'PASO',
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export { mulberry32 }

export function randomGenome(rand: () => number): Genome {
  const g = {} as Genome
  for (const key of Object.keys(GENE_RANGES) as (keyof Genome)[]) {
    const [lo, hi] = GENE_RANGES[key]
    g[key] = lo + rand() * (hi - lo)
  }
  return g
}

// Mutación gaussiana aproximada (suma de 2 uniformes menos 1, un
// Irwin-Hall barato) — da una campana centrada en 0 sin necesitar
// Box-Muller completo para un uso que no exige precisión estadística.
export function mutateGenome(genome: Genome, rand: () => number, strength = 0.15): Genome {
  const next = {} as Genome
  for (const key of Object.keys(GENE_RANGES) as (keyof Genome)[]) {
    const [lo, hi] = GENE_RANGES[key]
    const span = hi - lo
    const delta = (rand() + rand() - 1) * span * strength
    next[key] = Math.min(hi, Math.max(lo, genome[key] + delta))
  }
  return next
}

// Cruza uniforme: cada gen se hereda, independiente de los demás, de uno
// de los dos padres al azar — el método más simple y más usado desde
// Holland (1975), no una variante inventada para la ocasión.
export function crossoverGenome(a: Genome, b: Genome, rand: () => number): Genome {
  const next = {} as Genome
  for (const key of Object.keys(GENE_RANGES) as (keyof Genome)[]) {
    next[key] = rand() < 0.5 ? a[key] : b[key]
  }
  return next
}

export function genomeToParams(genome: Genome, seed: number, quality: 'eval' | 'display') {
  const fast = quality === 'eval'
  return {
    seed,
    numAttractors: fast ? 80 : 280,
    canopyCenter: [0, 1, 0] as Vec3,
    canopyRadius: [genome.canopyX, genome.canopyY, genome.canopyZ] as Vec3,
    rootPos: [0, -1.6, 0] as Vec3,
    influenceRadius: genome.influenceRadius,
    killDistance: genome.killDistance,
    stepSize: genome.stepSize,
    maxIterations: fast ? 90 : 220,
    curl: genome.curl,
  }
}

export function measureSpecimen(nodes: { pos: Vec3 }[]): { height: number; nodeCount: number } {
  let minY = Infinity, maxY = -Infinity
  for (const n of nodes) {
    if (n.pos[1] < minY) minY = n.pos[1]
    if (n.pos[1] > maxY) maxY = n.pos[1]
  }
  return { height: maxY - minY, nodeCount: nodes.length }
}

// Fitness = negativo del error relativo combinado contra los dos
// objetivos — más alto (más cerca de 0) es mejor. Simple y honesto: no
// hay término oculto que "ayude" a converger más rápido.
export function fitnessOf(measured: { height: number; nodeCount: number }, targetHeight: number, targetNodes: number): number {
  const heightErr = Math.abs(measured.height - targetHeight) / Math.max(0.01, targetHeight)
  const nodeErr = Math.abs(measured.nodeCount - targetNodes) / Math.max(1, targetNodes)
  return -(heightErr + nodeErr)
}

// SÍNTESIS — tercer criterio de fitness: en vez de medir altura/ramas, se
// proyecta el esqueleto crecido sobre una grilla vista desde arriba (plano
// X-Z) y se compara contra un patrón objetivo de Memoria (CRUZ, EQUIS,
// MARCO, DIAGONAL) — mismo principio que Roger Alsing usó para evolucionar
// la Mona Lisa con polígonos (2008): el fitness es, literalmente, "qué tan
// parecida es la silueta resultante a la imagen que quiero". Ventana de
// proyección FIJA (no depende del tamaño real de la copa de cada genoma)
// para que todos los individuos se comparen contra el mismo objetivo en
// igualdad de condiciones.
export function projectToGrid(nodes: { pos: Vec3 }[], gridSize: number, halfExtent: number): number[] {
  const grid = new Array(gridSize * gridSize).fill(-1)
  const cellSize = (halfExtent * 2) / gridSize
  for (const n of nodes) {
    const gx = Math.floor((n.pos[0] + halfExtent) / cellSize)
    const gz = Math.floor((n.pos[2] + halfExtent) / cellSize)
    if (gx >= 0 && gx < gridSize && gz >= 0 && gz < gridSize) grid[gz * gridSize + gx] = 1
  }
  return grid
}

// Índice de Jaccard (intersección sobre unión), NO acuerdo simple celda a
// celda — verificado antes de usarlo: con acuerdo simple, el fitness
// arrancaba en ~78% y nunca mejoraba, porque la mayoría de la grilla está
// vacía en el objetivo Y en cualquier espécimen disperso, así que ese
// acuerdo trivial sobre el fondo vacío ahogaba la señal real. Jaccard
// solo mira las celdas "encendidas" de los dos lados — sin fondo que
// inflar el número de arranque, hay señal de verdad para seleccionar.
export function silhouetteFitness(projected: number[], target: number[]): number {
  let intersection = 0, union = 0
  for (let i = 0; i < target.length; i++) {
    const p = projected[i] === 1, t = target[i] === 1
    if (p || t) union++
    if (p && t) intersection++
  }
  return union === 0 ? 0 : intersection / union
}

// Una generación completa: elitismo (el mejor pasa intacto) + selección
// por torneo (2 al azar, gana el de mayor fitness) + cruza + mutación
// probabilística — la estructura estándar de un GA desde Holland, no una
// variante simplificada que recorte alguno de los pasos.
export function evolveGeneration(population: Genome[], fitnesses: number[], rand: () => number, eliteCount = 1): Genome[] {
  const n = population.length
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => fitnesses[b] - fitnesses[a])
  const next: Genome[] = []
  for (let i = 0; i < eliteCount; i++) next.push(population[order[i]])

  const tournament = () => {
    const a = Math.floor(rand() * n)
    const b = Math.floor(rand() * n)
    return fitnesses[a] >= fitnesses[b] ? population[a] : population[b]
  }

  while (next.length < n) {
    const parentA = tournament()
    const parentB = tournament()
    let child = crossoverGenome(parentA, parentB, rand)
    if (rand() < 0.35) child = mutateGenome(child, rand, 0.12)
    next.push(child)
  }
  return next
}
