// Reacción-difusión de Gray-Scott — la implementación computable estándar
// del modelo de morfogénesis que Alan Turing propuso en "The Chemical Basis
// of Morphogenesis" (1952): dos químicos U y V se difunden a velocidades
// distintas mientras V consume U y se autodestruye — de ahí salen manchas,
// rayas y laberintos sin que nadie los dibuje, solo de la ecuación.
//
//   ∂u/∂t = Du∇²u − uv² + f(1−u)
//   ∂v/∂t = Dv∇²v + uv² − (f+k)v
//
// Grilla toroidal (los bordes se envuelven) para que el patrón se pueda usar
// como textura repetible alrededor de un tubo sin costura visible en φ.

export type RDGrid = { width: number; height: number; u: Float32Array; v: Float32Array }

export type RDParams = {
  width: number
  height: number
  Du: number
  Dv: number
  feed: number // f
  kill: number // k
  seed: number
}

// Presets clásicos de Gray-Scott — f/k crudos no son intuitivos para mover
// con un slider (la mayoría de combinaciones no generan nada interesante),
// así que se exponen combinaciones ya conocidas por dar patrones distintos.
export const RD_PRESETS: Record<string, { label: string; feed: number; kill: number }> = {
  coral: { label: 'CORAL', feed: 0.0545, kill: 0.062 },
  manchas: { label: 'MANCHAS', feed: 0.035, kill: 0.065 },
  rayas: { label: 'RAYAS', feed: 0.03, kill: 0.062 },
  laberinto: { label: 'LABERINTO', feed: 0.029, kill: 0.057 },
  mitosis: { label: 'MITOSIS', feed: 0.0367, kill: 0.0649 },
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function initRDGrid(width: number, height: number, seed: number): RDGrid {
  const u = new Float32Array(width * height).fill(1)
  const v = new Float32Array(width * height).fill(0)
  const rand = mulberry32(seed)
  // Unas pocas semillas de V desparramadas — sin esto la grilla queda en el
  // equilibrio trivial (u=1,v=0 en todos lados) para siempre, nunca arranca
  // la reacción.
  const seeds = 6
  for (let s = 0; s < seeds; s++) {
    const cx = Math.floor(rand() * width)
    const cy = Math.floor(rand() * height)
    const r = 3
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue
        const x = (cx + dx + width) % width
        const y = (cy + dy + height) % height
        v[y * width + x] = 1
      }
    }
  }
  return { width, height, u, v }
}

function laplacian(field: Float32Array, width: number, height: number, x: number, y: number): number {
  const idx = (xx: number, yy: number) => ((yy + height) % height) * width + ((xx + width) % width)
  // Kernel de 9 puntos estándar para Gray-Scott (centro −1, vecinos directos
  // 0.2, diagonales 0.05) — da una difusión más isotrópica que el kernel de
  // 5 puntos ingenuo.
  let sum = -field[idx(x, y)]
  sum += field[idx(x - 1, y)] * 0.2 + field[idx(x + 1, y)] * 0.2
  sum += field[idx(x, y - 1)] * 0.2 + field[idx(x, y + 1)] * 0.2
  sum += field[idx(x - 1, y - 1)] * 0.05 + field[idx(x + 1, y - 1)] * 0.05
  sum += field[idx(x - 1, y + 1)] * 0.05 + field[idx(x + 1, y + 1)] * 0.05
  return sum
}

export function stepRD(grid: RDGrid, p: Pick<RDParams, 'Du' | 'Dv' | 'feed' | 'kill'>): RDGrid {
  const { width, height, u, v } = grid
  const nu = new Float32Array(u.length)
  const nv = new Float32Array(v.length)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const uv2 = u[i] * v[i] * v[i]
      nu[i] = u[i] + (p.Du * laplacian(u, width, height, x, y) - uv2 + p.feed * (1 - u[i]))
      nv[i] = v[i] + (p.Dv * laplacian(v, width, height, x, y) + uv2 - (p.feed + p.kill) * v[i])
      nu[i] = Math.min(1, Math.max(0, nu[i]))
      nv[i] = Math.min(1, Math.max(0, nv[i]))
    }
  }
  return { width, height, u: nu, v: nv }
}

export function runRD(width: number, height: number, params: RDParams, steps: number): RDGrid {
  let grid = initRDGrid(width, height, params.seed)
  for (let i = 0; i < steps; i++) grid = stepRD(grid, params)
  return grid
}

// Muestrea el campo V (la concentración que de verdad dibuja el patrón) en
// coordenadas normalizadas 0..1 con interpolación bilineal — lo usa el
// workbench para pintar el patrón sobre la superficie de cualquier forma,
// sin importar cuántos vértices tenga.
export function sampleRD(grid: RDGrid, u: number, v: number): number {
  const x = ((u % 1) + 1) % 1 * grid.width
  const y = ((v % 1) + 1) % 1 * grid.height
  const x0 = Math.floor(x) % grid.width
  const y0 = Math.floor(y) % grid.height
  const x1 = (x0 + 1) % grid.width
  const y1 = (y0 + 1) % grid.height
  const fx = x - Math.floor(x)
  const fy = y - Math.floor(y)
  const g = grid.v
  const a = g[y0 * grid.width + x0], b = g[y0 * grid.width + x1]
  const c = g[y1 * grid.width + x0], d = g[y1 * grid.width + x1]
  return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy
}
