// Abelian sandpile (Bak, Tang & Wiesenfeld, "Self-Organized Criticality",
// 1987) — la grilla deriva sola hacia el borde del colapso sin que nadie la
// sintonice ahí: agregás granos de a uno, nada pasa casi siempre, y de vez
// en cuando un solo grano dispara una cascada — desde mínima hasta una que
// se lleva medio tablero. El tamaño de esas cascadas sigue una ley de
// potencias (ver la entrada "perbak" en components/knowledge/entries.ts),
// no una campana de Gauss: eventos grandes son raros pero no despreciables,
// a diferencia de un proceso al azar "normal". Puro cálculo, sin Babylon.

export type SandpileGrid = { width: number; height: number; grains: Int32Array }

const THRESHOLD = 4

export function createSandpile(width: number, height: number): SandpileGrid {
  return { width, height, grains: new Int32Array(width * height) }
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Relaja la grilla hasta que ningún cuadrado supere el umbral — una cascada
// completa a partir de un solo grano agregado. Borde abierto: un cuadrado
// de borde que vuelca pierde los granos que le tocarían a vecinos fuera de
// la grilla, así el sistema nunca se satura para siempre (condición
// estándar del modelo, no un recorte arbitrario). La grilla es chica
// (1600 celdas típico), así que un escaneo completo por pasada —en vez de
// una cola de trabajo más prolija— sigue siendo barato y es más fácil de
// verificar que no tiene un bug de orden de procesamiento.
function relax(grid: SandpileGrid): number {
  const { width, height, grains } = grid
  let toppledTotal = 0
  let unstable = true
  let guard = 0
  while (unstable && guard < 100000) {
    unstable = false
    guard++
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x
        if (grains[i] >= THRESHOLD) {
          grains[i] -= 4
          toppledTotal++
          unstable = true
          if (x > 0) grains[i - 1]++
          if (x < width - 1) grains[i + 1]++
          if (y > 0) grains[i - width]++
          if (y < height - 1) grains[i + width]++
        }
      }
    }
  }
  return toppledTotal
}

export function dropGrain(grid: SandpileGrid, x: number, y: number): number {
  const i = y * grid.width + x
  grid.grains[i]++
  return relax(grid)
}

export function stepSandpileRandom(grid: SandpileGrid, rand: () => number): { x: number; y: number; avalanche: number } {
  // Los granos caen cerca del centro (desviación hacia adentro), no
  // uniforme en toda la grilla — es como se corre el experimento real: una
  // fuente puntual de arena, no lluvia pareja. El sesgo hace que el
  // montículo crítico se forme antes de ver una avalancha interesante.
  const cx = grid.width / 2, cy = grid.height / 2
  const spread = Math.min(grid.width, grid.height) * 0.3
  let x = 0, y = 0
  do {
    x = Math.round(cx + (rand() * 2 - 1) * spread)
    y = Math.round(cy + (rand() * 2 - 1) * spread)
  } while (x < 0 || x >= grid.width || y < 0 || y >= grid.height)
  const avalanche = dropGrain(grid, x, y)
  return { x, y, avalanche }
}

export { mulberry32 }
