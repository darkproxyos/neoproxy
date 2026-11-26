// De la trenza al sólido: cada línea de mundo es un tubo cuyo grosor crece donde el
// cuerpo va lento (más tiempo en ese lugar, más materia), los tres tubos se funden con
// una unión suave donde los cuerpos se acercan, y la pieza se apoya en una base (y
// opcionalmente se cierra con una tapa, como un diagrama de trenza entre dos barras).
// Se evalúa como campo de distancia en una grilla y se extrae con surface nets: la malla
// sale cerrada y manifold aunque los tubos se toquen.
import { polygonize, type Grid, type Mesh } from '../specimens/polygonize'
import { analyze, type Metrics } from '../specimens/analyze'
import type { Strands } from './orbit'

export type TrenzaSolidOpts = { res: number; sizeMm: number; aspect: number; radius: number; plates: 'base' | 'ambas' | 'ninguna'; speedWeight: number }
export type TrenzaSolid = { mesh: Mesh; strand: Uint8Array; metrics: Metrics; heightMm: number; widthMm: number; world: { scale: number; hOffset: number; tScale: number } }

const smin = (a: number, b: number, k: number) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - (h * h * k) / 4 }

export function solidify(S: Strands, o: TrenzaSolidOpts): TrenzaSolid | null {
  const N = o.res, G = N + 1, cell = 2 / N
  const W = S.extent // radio en el plano (unidades de la simulación)
  const r0 = o.radius * 2 * W // radio del tubo
  const plate = o.plates !== 'ninguna' ? 0.05 * 2 * W * Math.max(1, o.aspect * 0.6) : 0
  const Hs = o.aspect * 2 * W // alto de la trenza en unidades de simulación
  const totalH = Hs + (o.plates === 'base' ? plate : o.plates === 'ambas' ? 2 * plate : 0) + 2 * r0
  const sc = 1.84 / Math.max(2 * (W + r0) * 1.12, totalH) // simulación → cubo
  const tScale = Hs / (S.T * S.periods) // tiempo → altura (simulación)
  const z0 = -totalH / 2 + (o.plates !== 'ninguna' ? plate : 0) + r0 // altura del tiempo 0 (simulación, centrada)
  const toG = (v: number) => (v * sc + 1) / cell
  // mediana de la rapidez, para el grosor
  const all: number[] = []; for (const s of S.speed) for (let i = 0; i < s.length; i += 5) all.push(s[i])
  all.sort((a, b) => a - b); const vmed = all[Math.floor(all.length / 2)] || 1
  const k = 0.9 * r0 * sc // suavidad de la unión, en el cubo
  const BIG = 1
  const acc = new Float32Array(G * G * G).fill(BIG), cur = new Float32Array(G * G * G)
  const who = new Uint8Array(G * G * G).fill(255)
  for (let b = 0; b < 3; b++) {
    cur.fill(BIG)
    const P = S.pts[b], V = S.speed[b], n = P.length / 3
    for (let i = 0; i + 1 < n; i++) {
      const ax = P[3 * i] * sc, ay = P[3 * i + 1] * sc, az = (z0 + P[3 * i + 2] * tScale) * sc
      const bx = P[3 * i + 3] * sc, by = P[3 * i + 4] * sc, bz = (z0 + P[3 * i + 5] * tScale) * sc
      const v = 0.5 * (V[i] + V[i + 1])
      // lento → grueso (raíz para no exagerar), con límites para que siga imprimible
      const f = Math.min(1.6, Math.max(0.62, Math.sqrt(vmed / Math.max(1e-6, v))))
      const r = r0 * sc * (1 - o.speedWeight + o.speedWeight * f)
      const pad = r + k + 2 * cell
      const x0 = Math.max(1, Math.floor((Math.min(ax, bx) - pad + 1) / cell)), x1 = Math.min(G - 2, Math.ceil((Math.max(ax, bx) + pad + 1) / cell))
      const y0 = Math.max(1, Math.floor((Math.min(ay, by) - pad + 1) / cell)), y1 = Math.min(G - 2, Math.ceil((Math.max(ay, by) + pad + 1) / cell))
      const zA = Math.max(1, Math.floor((Math.min(az, bz) - pad + 1) / cell)), zB = Math.min(G - 2, Math.ceil((Math.max(az, bz) + pad + 1) / cell))
      const dx = bx - ax, dy = by - ay, dz = bz - az, L2 = dx * dx + dy * dy + dz * dz || 1e-12
      for (let z = zA; z <= zB; z++) { const pz = -1 + z * cell
        for (let y = y0; y <= y1; y++) { const py = -1 + y * cell
          for (let x = x0; x <= x1; x++) { const px = -1 + x * cell
            let t = ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t
            const qx = px - ax - t * dx, qy = py - ay - t * dy, qz = pz - az - t * dz
            const d = Math.sqrt(qx * qx + qy * qy + qz * qz) - r, id = x + G * (y + G * z)
            if (d < cur[id]) cur[id] = d
          } } }
    }
    for (let id = 0; id < cur.length; id++) {
      if (cur[id] >= BIG) continue
      if (cur[id] < acc[id]) who[id] = b
      acc[id] = b === 0 ? cur[id] : smin(acc[id], cur[id], k)
    }
  }
  // base y tapa: discos con el borde redondeado, unidos con un filete
  if (o.plates !== 'ninguna') {
    const R = (W + r0) * 1.12 * sc, th = plate * sc, kp = 0.6 * r0 * sc
    const zBot = (-totalH / 2) * sc, zTop = (-totalH / 2 + totalH) * sc
    const slabs = o.plates === 'ambas' ? [[zBot, zBot + th], [zTop - th, zTop]] : [[zBot, zBot + th]]
    for (let z = 1; z < G - 1; z++) { const pz = -1 + z * cell
      for (const [lo, hi] of slabs) {
        if (pz < lo - 3 * cell - kp || pz > hi + 3 * cell + kp) continue
        for (let y = 1; y < G - 1; y++) { const py = -1 + y * cell
          for (let x = 1; x < G - 1; x++) { const px = -1 + x * cell
            const dr = Math.hypot(px, py) - R, dz = Math.max(lo - pz, pz - hi)
            const d = Math.max(dr, dz) // caja cilíndrica (aproximada fuera de las esquinas)
            const id = x + G * (y + G * z)
            const nv = smin(acc[id], d, kp)
            if (d < acc[id]) who[id] = 3
            acc[id] = nv
          } } }
    }
  }
  const grid: Grid = { N, values: acc }
  const out = analyze(polygonize(grid), grid, o.sizeMm, { minFill: 0.0002, up: '+z' })
  if (!out) return null
  // hebra de cada vértice (para colorear en pantalla)
  const Vn = out.mesh.positions.length / 3, strand = new Uint8Array(Vn)
  for (let v = 0; v < Vn; v++) {
    const x = Math.round((out.mesh.positions[3 * v] + 1) / cell), y = Math.round((out.mesh.positions[3 * v + 1] + 1) / cell), z = Math.round((out.mesh.positions[3 * v + 2] + 1) / cell)
    let best = 255, bd = Infinity
    for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = x + dx, Y = y + dy, Z = z + dz
      if (X < 0 || Y < 0 || Z < 0 || X >= G || Y >= G || Z >= G) continue
      const id = X + G * (Y + G * Z); if (who[id] !== 255 && acc[id] < bd) { bd = acc[id]; best = who[id] }
    }
    strand[v] = best === 255 ? 3 : best
  }
  // a mm, apoyada en z = 0
  const pos = out.mesh.positions
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]
  for (let i = 0; i < pos.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], pos[i + a]); mx[a] = Math.max(mx[a], pos[i + a]) }
  const mm = o.sizeMm / Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2])
  const P = new Float32Array(pos.length)
  for (let i = 0; i < pos.length; i += 3) { P[i] = pos[i] * mm; P[i + 1] = pos[i + 1] * mm; P[i + 2] = (pos[i + 2] - mn[2]) * mm }
  return {
    mesh: { positions: P, indices: out.mesh.indices }, strand, metrics: out.metrics,
    heightMm: (mx[2] - mn[2]) * mm, widthMm: Math.max(mx[0] - mn[0], mx[1] - mn[1]) * mm,
    // para dibujar el sólido en el mismo lugar que las líneas: mm → simulación, con la
    // altura medida desde el tiempo 0 (h = t · tScale)
    world: { scale: 1 / (mm * sc), hOffset: mn[2] / sc - z0, tScale },
  }
}
