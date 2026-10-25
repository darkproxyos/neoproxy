// Dos generadores de grafos reales, con resultados cualitativamente
// distintos a propósito — el punto de ponerlos uno al lado del otro es
// mostrar esa diferencia, no solo dibujar puntos conectados.
//
//   Erdős & Rényi, "On Random Graphs" (1959): cada posible arista existe
//   independiente con probabilidad p — todos los nodos terminan con un
//   grado parecido (distribución ~Poisson).
//
//   Barabási & Albert, "Emergence of Scaling in Random Networks" (1999):
//   apego preferencial — un nodo nuevo prefiere conectarse a los que ya
//   están bien conectados. Produce "hubs": unos pocos nodos con muchísimas
//   conexiones, la mayoría con pocas (distribución de ley de potencias,
//   libre de escala).
//
// Puro cálculo, sin Babylon — mismo criterio que el resto de los motores.

export type Vec3 = [number, number, number]
export type GraphNode = { id: number; pos: Vec3 }
export type GraphEdge = { a: number; b: number }
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] }

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateErdosRenyi(n: number, p: number, seed: number): Graph {
  const rand = mulberry32(seed)
  const nodes: GraphNode[] = Array.from({ length: n }, (_, i) => ({ id: i, pos: [0, 0, 0] }))
  const edges: GraphEdge[] = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (rand() < p) edges.push({ a: i, b: j })
    }
  }
  return { nodes, edges }
}

export function generateBarabasiAlbert(n: number, m: number, seed: number): Graph {
  const rand = mulberry32(seed)
  const nodes: GraphNode[] = Array.from({ length: n }, (_, i) => ({ id: i, pos: [0, 0, 0] }))
  const edges: GraphEdge[] = []
  const degree = new Array(n).fill(0)

  // Núcleo inicial: un pequeño grafo completo de m0 nodos para arrancar
  // (sin esto no hay grado ninguno del que "preferir" conectarse).
  const m0 = Math.max(m + 1, 2)
  for (let i = 0; i < Math.min(m0, n); i++) {
    for (let j = i + 1; j < Math.min(m0, n); j++) {
      edges.push({ a: i, b: j })
      degree[i]++; degree[j]++
    }
  }

  for (let i = m0; i < n; i++) {
    const targets = new Set<number>()
    let attempts = 0
    while (targets.size < Math.min(m, i) && attempts < 2000) {
      attempts++
      const totalDegree = degree.slice(0, i).reduce((s, d) => s + d, 0) || i
      let r = rand() * totalDegree
      let chosen = 0
      for (let k = 0; k < i; k++) {
        r -= (degree[k] || 1e-6)
        if (r <= 0) { chosen = k; break }
      }
      targets.add(chosen)
    }
    for (const t of targets) {
      edges.push({ a: i, b: t })
      degree[i]++; degree[t]++
    }
  }
  return { nodes, edges }
}

// Layout de fuerzas (Fruchterman-Reingold simplificado): repulsión entre
// TODOS los pares de nodos + atracción a lo largo de cada arista + leve
// contracción al centro. Nadie le dice a un nodo dónde ir — la posición
// final emerge de ese tira y afloja, iteración a iteración.
export function layoutForceDirected(graph: Graph, iterations: number, spread: number, seed: number): Graph {
  const rand = mulberry32(seed)
  const n = graph.nodes.length
  const pos: Vec3[] = graph.nodes.map(() => [
    (rand() * 2 - 1) * spread, (rand() * 2 - 1) * spread, (rand() * 2 - 1) * spread,
  ])
  const k = spread / Math.sqrt(Math.max(1, n))

  for (let iter = 0; iter < iterations; iter++) {
    const disp: Vec3[] = pos.map(() => [0, 0, 0])

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = pos[i][0] - pos[j][0], dy = pos[i][1] - pos[j][1], dz = pos[i][2] - pos[j][2]
        const d = Math.hypot(dx, dy, dz) || 0.01
        const f = (k * k) / d
        dx /= d; dy /= d; dz /= d
        disp[i][0] += dx * f; disp[i][1] += dy * f; disp[i][2] += dz * f
        disp[j][0] -= dx * f; disp[j][1] -= dy * f; disp[j][2] -= dz * f
      }
    }

    for (const e of graph.edges) {
      let dx = pos[e.a][0] - pos[e.b][0], dy = pos[e.a][1] - pos[e.b][1], dz = pos[e.a][2] - pos[e.b][2]
      const d = Math.hypot(dx, dy, dz) || 0.01
      const f = (d * d) / k
      dx /= d; dy /= d; dz /= d
      disp[e.a][0] -= dx * f; disp[e.a][1] -= dy * f; disp[e.a][2] -= dz * f
      disp[e.b][0] += dx * f; disp[e.b][1] += dy * f; disp[e.b][2] += dz * f
    }

    for (let i = 0; i < n; i++) {
      const dlen = Math.hypot(disp[i][0], disp[i][1], disp[i][2]) || 1e-6
      const lim = Math.min(dlen, k * 0.5)
      pos[i][0] += (disp[i][0] / dlen) * lim
      pos[i][1] += (disp[i][1] / dlen) * lim
      pos[i][2] += (disp[i][2] / dlen) * lim
      // Contracción leve al centro — sin esto nada ata al grafo a un
      // volumen fijo y la repulsión lo manda cada vez más lejos.
      pos[i][0] *= 0.99; pos[i][1] *= 0.99; pos[i][2] *= 0.99
    }
  }

  return { nodes: graph.nodes.map((nd, i) => ({ ...nd, pos: pos[i] })), edges: graph.edges }
}

export function degreeOf(graph: Graph): number[] {
  const degree = new Array(graph.nodes.length).fill(0)
  for (const e of graph.edges) { degree[e.a]++; degree[e.b]++ }
  return degree
}
