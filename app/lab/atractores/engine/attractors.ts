// 10 sistemas dinámicos reales (Lorenz, Rössler, Chen, etc.) — extraído tal
// cual de app/lab/atractores/page.tsx para poder reusarlo desde otro lado
// (el workbench de /experimental/workbench lo usa como capa de "caos" sobre
// una forma base) sin duplicar las ecuaciones a mano. Puro cálculo, sin
// dependencia de ningún paquete de Babylon — mismo criterio que
// app/lab/proxygenesis/engine/spaceColonization.ts.

export function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type AttractorSystem = {
  name: string
  equations: string
  params: Record<string, number> | null
  init: (rand: () => number) => Record<string, number>
  step: (p: Record<string, number>, rand: () => number, state: Record<string, number>) => { x: number; y: number; z: number }
  scale: number
}

export const attractors: Record<string, AttractorSystem> = {
  lorenz: {
    name: 'Lorenz',
    equations: 'dx/dt = σ(y−x)\ndy/dt = x(ρ−z)−y\ndz/dt = xy−βz',
    params: { sigma: 10, rho: 28, beta: 8 / 3, dt: 0.005 },
    init: () => ({ x: 0.1, y: 0, z: 0 }),
    step: (p, _, s) => {
      const dx = p.sigma * (s.y - s.x); const dy = s.x * (p.rho - s.z) - s.y; const dz = s.x * s.y - p.beta * s.z
      return { x: s.x + dx * p.dt, y: s.y + dy * p.dt, z: s.z + dz * p.dt }
    },
    scale: 0.1
  },
  thomas: {
    name: 'Thomas',
    equations: 'dx/dt = sin(y)−bx\ndy/dt = sin(z)−by\ndz/dt = sin(x)−bz',
    params: { b: 0.208, dt: 0.05 },
    init: () => ({ x: 0.1, y: 0, z: 0 }),
    step: (p, _, s) => ({
      x: s.x + (Math.sin(s.y) - p.b * s.x) * p.dt,
      y: s.y + (Math.sin(s.z) - p.b * s.y) * p.dt,
      z: s.z + (Math.sin(s.x) - p.b * s.z) * p.dt,
    }),
    scale: 2.0
  },
  aizawa: {
    name: 'Aizawa',
    equations: 'dx/dt = (z-b)x - dy\ndy/dt = dx + (z-b)y\ndz/dt = c + az - z³/3...',
    params: { a: 0.95, b: 0.7, c: 0.6, d: 3.5, e: 0.25, f: 0.1, dt: 0.01 },
    init: () => ({ x: 0.1, y: 0, z: 0 }),
    step: (p, _, s) => ({
      x: s.x + ((s.z - p.b) * s.x - p.d * s.y) * p.dt,
      y: s.y + (p.d * s.x + (s.z - p.b) * s.y) * p.dt,
      z: s.z + (p.c + p.a * s.z - (s.z ** 3 / 3) - (s.x ** 2 + s.y ** 2) * (1 + p.e * s.z) + p.f * s.z * s.x ** 3) * p.dt
    }),
    scale: 4.0
  },
  dejong: {
    name: 'De Jong',
    equations: 'x = sin(ay) - cos(bx)\ny = sin(cx) - cos(dy)',
    params: { a: 1.4, b: -2.3, c: 2.4, d: -2.1, dt: 0.1 },
    init: () => ({ x: 0.1, y: 0, z: 0 }),
    step: (p, _, s) => {
      const nx = Math.sin(p.a * s.y) - Math.cos(p.b * s.x)
      const ny = Math.sin(p.c * s.x) - Math.cos(p.d * s.y)
      return { x: nx, y: ny, z: s.z + Math.sin(nx * ny) * 0.1 }
    },
    scale: 5.0
  },
  chen: {
    name: 'Chen',
    equations: 'dx/dt = a(y-x)\ndy/dt = (c-a)x - xz + cy\ndz/dt = xy - bz',
    params: { a: 35, b: 3, c: 28, dt: 0.002 },
    init: () => ({ x: 5, y: 10, z: 10 }),
    step: (p, _, s) => ({
      x: s.x + (p.a * (s.y - s.x)) * p.dt,
      y: s.y + ((p.c - p.a) * s.x - s.x * s.z + p.c * s.y) * p.dt,
      z: s.z + (s.x * s.y - p.b * s.z) * p.dt
    }),
    scale: 0.15
  },
  halvorsen: {
    name: 'Halvorsen',
    equations: 'dx/dt = -ax - 4y - 4z - y²\ndy/dt = -ay - 4z - 4x - z²...',
    params: { a: 1.89, dt: 0.005 },
    init: () => ({ x: -1, y: 0, z: 0 }),
    step: (p, _, s) => ({
      x: s.x + (-p.a * s.x - 4 * s.y - 4 * s.z - s.y * s.y) * p.dt,
      y: s.y + (-p.a * s.y - 4 * s.z - 4 * s.x - s.z * s.z) * p.dt,
      z: s.z + (-p.a * s.z - 4 * s.x - 4 * s.y - s.x * s.x) * p.dt
    }),
    scale: 0.4
  },
  l_system: {
    name: 'L-System Plant',
    equations: 'F -> FF\nX -> F[+X][-X]FX',
    params: { angle: 25, dt: 1 },
    init: () => ({ x: 0, y: 0, z: 0, angle: 0 }),
    step: (p, rand, s) => {
      // Pseudo-atractor para simular L-System en un atractor visual
      const r = rand()
      return {
        x: s.x + Math.sin(s.angle) * 0.2,
        y: s.y + Math.cos(s.angle) * 0.2,
        z: s.z + (r - 0.5) * 0.1,
        angle: s.angle + (r > 0.5 ? p.angle : -p.angle) * 0.01
      }
    },
    scale: 5.0
  },
  clifford: {
    name: 'Clifford',
    equations: 'x = sin(ay) + c cos(ax)\ny = sin(bx) + d cos(by)',
    params: { a: 1.5, b: -1.8, c: 1.6, d: 2.0, dt: 0.1 },
    init: () => ({ x: 0.1, y: 0.1, z: 0 }),
    step: (p, _, s) => {
      const nx = Math.sin(p.a * s.y) + p.c * Math.cos(p.a * s.x)
      const ny = Math.sin(p.b * s.x) + p.d * Math.cos(p.b * s.y)
      return { x: nx, y: ny, z: s.z + Math.cos(nx + ny) * 0.05 }
    },
    scale: 4.0
  },
  rossler: {
    name: 'Rössler',
    equations: 'dx/dt = −y−z\ndy/dt = x+ay\ndz/dt = b+z(x−c)',
    params: { a: 0.2, b: 0.2, c: 5.7, dt: 0.01 },
    init: () => ({ x: 0.1, y: 0, z: 0 }),
    step: (p, _, s) => ({
      x: s.x + (-s.y - s.z) * p.dt,
      y: s.y + (s.x + p.a * s.y) * p.dt,
      z: s.z + (p.b + s.z * (s.x - p.c)) * p.dt,
    }),
    scale: 0.5
  },
  torus_knot: {
    name: 'Torus Knot',
    equations: 'r = cos(q*phi) + 2\nx = r * cos(p*phi)\ny = r * sin(p*phi)\nz = -sin(q*phi)',
    params: { p: 3, q: 7, dt: 0.01, phi: 0 },
    init: () => ({ x: 0, y: 0, z: 0, phi: 0 }),
    step: (p, _, s) => {
      const phi = s.phi + p.dt
      const r = Math.cos(p.q * phi) + 2
      return {
        x: r * Math.cos(p.p * phi),
        y: r * Math.sin(p.p * phi),
        z: -Math.sin(p.q * phi),
        phi: phi
      }
    },
    scale: 2.5
  }
}

// Corre un sistema `steps` pasos desde su estado inicial y devuelve la
// trayectoria resultante — lo usa el workbench para tomar esos puntos como
// campo de ruido determinístico (no Math.random) al perturbar otra forma.
export function runAttractor(systemId: string, steps: number, seed = 1): { x: number; y: number; z: number }[] {
  const system = attractors[systemId]
  if (!system) return []
  const rand = mulberry32(seed)
  let state = system.init(rand)
  const params = system.params ?? {}
  const points: { x: number; y: number; z: number }[] = []
  for (let i = 0; i < steps; i++) {
    const next = system.step(params, rand, state)
    state = { ...state, ...next }
    points.push({ x: next.x * system.scale, y: next.y * system.scale, z: next.z * system.scale })
  }
  return points
}
