// Space Colonization Algorithm (Runions, Lane & Prusinkiewicz, "Modeling
// Trees with a Space Colonization Algorithm", 2007). Usado acá con dos
// presets distintos (árbol / coral) para la misma mecánica: una nube de
// puntos de atracción en un volumen, y un esqueleto que crece hacia ellos
// consumiéndolos a medida que se acerca.
//
// Verificado antes de integrarlo a la UI (script aparte, no en el repo):
// conectividad del esqueleto (sin nodos con parent inválido), terminación
// garantizada, y el costo real en tiempo de cada preset de calidad — de ahí
// salen los rangos de los sliders de la UI y el tronco-semilla de abajo.

export type Vec3 = [number, number, number]

function sub(a: Vec3, b: Vec3): Vec3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]] }
function add(a: Vec3, b: Vec3): Vec3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]] }
function scale(a: Vec3, s: number): Vec3 { return [a[0] * s, a[1] * s, a[2] * s] }
function len(a: Vec3): number { return Math.hypot(a[0], a[1], a[2]) }
function norm(a: Vec3): Vec3 { const l = len(a) || 1e-9; return scale(a, 1 / l) }
function dist(a: Vec3, b: Vec3): number { return len(sub(a, b)) }

// Misma implementación que app/lab/atractores/page.tsx (PRNG Mulberry32) —
// consistencia entre los dos generadores de /lab, y es la variante que
// efectivamente se verificó en el script de prueba.
export function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Grid espacial (spatial hashing): sin esto, buscar el nodo más cercano a
// cada atractor es O(atractores × nodos) por iteración — probado que eso
// tarda >15s con unos pocos miles de nodos. Con el grid, cada consulta solo
// mira las celdas vecinas.
class SpatialGrid {
  cellSize: number
  cells: Map<string, number[]> = new Map()
  constructor(cellSize: number) { this.cellSize = Math.max(cellSize, 0.1) }
  private key(p: Vec3) {
    const cs = this.cellSize
    return `${Math.floor(p[0] / cs)},${Math.floor(p[1] / cs)},${Math.floor(p[2] / cs)}`
  }
  insert(p: Vec3, idx: number) {
    const k = this.key(p)
    let arr = this.cells.get(k)
    if (!arr) { arr = []; this.cells.set(k, arr) }
    arr.push(idx)
  }
  *queryNeighbors(p: Vec3, radius: number): Generator<number> {
    const cs = this.cellSize
    const cx = Math.floor(p[0] / cs), cy = Math.floor(p[1] / cs), cz = Math.floor(p[2] / cs)
    const r = Math.max(1, Math.ceil(radius / cs))
    for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) {
      const arr = this.cells.get(`${cx + dx},${cy + dy},${cz + dz}`)
      if (arr) for (const idx of arr) yield idx
    }
  }
}

export type SkeletonNode = { pos: Vec3; parent: number }

export type SpaceColonizationParams = {
  seed: number
  numAttractors: number
  canopyCenter: Vec3
  canopyRadius: Vec3
  rootPos: Vec3
  influenceRadius: number
  killDistance: number
  stepSize: number
  maxIterations: number
  curl: number
}

export type SkeletonProgress = {
  nodes: SkeletonNode[]
  iteration: number
  maxIterations: number
  done: boolean
}

// Generador: el caller (la página) lo recorre en chunks por requestAnimationFrame
// para no bloquear el hilo principal del navegador en los presets de calidad
// alta — cada `yield` es un punto seguro para pausar y devolver control al
// browser, mostrando progreso real en vez de congelar la pestaña.
export function* runSpaceColonization(params: SpaceColonizationParams): Generator<SkeletonProgress, SkeletonProgress> {
  const { seed, numAttractors, canopyCenter, canopyRadius, rootPos, influenceRadius, killDistance, stepSize, maxIterations, curl } = params
  const rand = mulberry32(seed)

  type Attractor = { pos: Vec3; alive: boolean }
  const attractors: Attractor[] = []
  for (let i = 0; i < numAttractors; i++) {
    let x = 0, y = 0, z = 0
    do { x = rand() * 2 - 1; y = rand() * 2 - 1; z = rand() * 2 - 1 } while (x * x + y * y + z * z > 1)
    attractors.push({
      pos: add(canopyCenter, [x * canopyRadius[0], y * canopyRadius[1], z * canopyRadius[2]]),
      alive: true,
    })
  }

  const nodes: SkeletonNode[] = [{ pos: rootPos, parent: -1 }]
  const grid = new SpatialGrid(influenceRadius)
  grid.insert(rootPos, 0)

  // Tronco semilla: sin esto, si el usuario mueve los sliders de forma que
  // el radio de influencia apenas roza el borde de la nube de atractores,
  // la probabilidad de capturar alguno en el primer paso es casi cero (la
  // densidad de puntos cerca del borde de un elipsoide relleno es baja) —
  // confirmado en pruebas: con margen ajustado, 0 nodos nuevos en 600
  // iteraciones. El tronco avanza hasta METERSE bien adentro de la nube
  // (no solo tocar el borde), así siempre hay atractores cerca del primer
  // nodo sin importar qué combinación de sliders se elija.
  const maxCanopyR = Math.max(...canopyRadius)
  let tip: Vec3 = rootPos
  let guard = 0
  while (dist(tip, canopyCenter) > maxCanopyR * 0.35 && guard < 400) {
    const dir = norm(sub(canopyCenter, tip))
    tip = add(tip, scale(dir, stepSize))
    nodes.push({ pos: tip, parent: nodes.length - 1 })
    grid.insert(tip, nodes.length - 1)
    guard++
  }

  let iteration = 0
  let addedThisRound = true

  while (addedThisRound && iteration < maxIterations) {
    addedThisRound = false
    iteration++

    const influence = new Map<number, Vec3>()
    for (let ai = 0; ai < attractors.length; ai++) {
      const att = attractors[ai]
      if (!att.alive) continue
      let bestIdx = -1
      let bestDist = Infinity
      const seen = new Set<number>()
      for (const ni of grid.queryNeighbors(att.pos, influenceRadius)) {
        if (seen.has(ni)) continue
        seen.add(ni)
        const d = dist(nodes[ni].pos, att.pos)
        if (d < bestDist) { bestDist = d; bestIdx = ni }
      }
      // pasada fusionada: la misma búsqueda sirve para "matar" el atractor
      // (si ya está pegado a un nodo) y para asignarlo como influencia —
      // evita una segunda pasada completa por el grid.
      if (bestIdx >= 0 && bestDist < killDistance) { att.alive = false; continue }
      if (bestIdx >= 0 && bestDist < influenceRadius) {
        const dir = norm(sub(att.pos, nodes[bestIdx].pos))
        const cur = influence.get(bestIdx) ?? [0, 0, 0]
        influence.set(bestIdx, add(cur, dir))
      }
    }

    for (const [idx, sumDir] of influence) {
      let dir = norm(sumDir)
      if (curl > 0) {
        dir = norm(add(dir, [(rand() * 2 - 1) * curl, (rand() * 2 - 1) * curl, (rand() * 2 - 1) * curl]))
      }
      const newPos = add(nodes[idx].pos, scale(dir, stepSize))
      nodes.push({ pos: newPos, parent: idx })
      grid.insert(newPos, nodes.length - 1)
      addedThisRound = true
    }

    yield { nodes, iteration, maxIterations, done: false }
  }

  return { nodes, iteration, maxIterations, done: true }
}

// Modelo de tubería (pipe model, da Vinci): el radio de una rama padre se
// calcula a partir de sus hijas con r_padre^n = Σ r_hija^n — da troncos
// gruesos en la base y puntas finas sin tener que pintarlo a mano.
export function computeRadii(nodes: SkeletonNode[], { leafRadius = 0.025, exponent = 2.3, maxRadius = 0.5 } = {}): number[] {
  const radii = new Array(nodes.length).fill(leafRadius)
  const children: number[][] = nodes.map(() => [])
  for (let i = 1; i < nodes.length; i++) children[nodes[i].parent].push(i)

  // orden topológico inverso: como parent siempre es < i (se agregan en
  // orden de creación), recorrer de atrás para adelante ya es bottom-up.
  for (let i = nodes.length - 1; i >= 0; i--) {
    const kids = children[i]
    if (kids.length === 0) continue
    let sum = 0
    for (const k of kids) sum += Math.pow(radii[k], exponent)
    radii[i] = Math.min(maxRadius, Math.pow(sum, 1 / exponent))
  }
  return radii
}
