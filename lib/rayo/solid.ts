// Del rayo a la pieza: cada tramo de la descarga es un tubo cuyo grosor crece con la
// cantidad de descarga que cuelga de él (como un río: los afluentes engrosan el cauce),
// el canal principal se refuerza, y la raíz se apoya en una base. Campo de distancia +
// surface nets: malla cerrada aunque los tubos se crucen.
import { polygonize, type Grid, type Mesh } from '../specimens/polygonize'
import { analyze, type Metrics } from '../specimens/analyze'
import { mainChannel, subtree, type Dbm } from './dbm'

export type RayoSolidOpts = { res: number; sizeMm: number; thick: number; prune: number; base: boolean }
export type RayoSolid = { mesh: Mesh; metrics: Metrics; heightMm: number; widthMm: number; kept: number; main: Uint8Array }

const smin = (a: number, b: number, k: number) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - (h * h * k) / 4 }

export function solidify(d: Dbm, o: RayoSolidOpts): RayoSolid | null {
  const { nx, ny } = d.o, sxy = nx * ny
  const s = subtree(d), sMax = s[0] || 1, onMain = new Uint8Array(d.sites.length)
  for (const k of mainChannel(d)) onMain[k] = 1
  // caja de lo que se imprime (las ramitas más cortas que 'prune' se podan)
  const keep = (k: number) => onMain[k] || s[k] >= o.prune
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity, kept = 0
  for (let k = 0; k < d.sites.length; k++) {
    if (!keep(k)) continue
    kept++
    const i = d.sites[k], x = i % nx, y = Math.floor(i / nx) % ny, z = Math.floor(i / sxy)
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); z0 = Math.min(z0, z); z1 = Math.max(z1, z)
  }
  const rMax = o.thick * 3.2, baseH = o.base ? 2.2 : 0
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
  const span = Math.max(x1 - x0, y1 - y0, z1 - z0 + baseH) + 2 * rMax + 2
  const N = o.res, G = N + 1, cell = 2 / N, sc = 1.86 / span // celdas de la simulación → cubo
  const zc = (z0 - baseH + z1) / 2
  const toC = (x: number, y: number, z: number): [number, number, number] => [(x - cx) * sc, (y - cy) * sc, (z - zc) * sc]
  const BIG = 1, f = new Float32Array(G * G * G).fill(BIG)
  const radius = (k: number) => {
    // ∝ (subárbol)^(1/3): el volumen de la rama crece con lo que sostiene
    const t = Math.cbrt(s[k] / sMax)
    return o.thick * (0.55 + 2.65 * t) * (onMain[k] ? 1.25 : 1)
  }
  const seg = (a: [number, number, number], b: [number, number, number], ra: number, rb: number) => {
    const pad = Math.max(ra, rb) + 2 * cell
    const X0 = Math.max(1, Math.floor((Math.min(a[0], b[0]) - pad + 1) / cell)), X1 = Math.min(G - 2, Math.ceil((Math.max(a[0], b[0]) + pad + 1) / cell))
    const Y0 = Math.max(1, Math.floor((Math.min(a[1], b[1]) - pad + 1) / cell)), Y1 = Math.min(G - 2, Math.ceil((Math.max(a[1], b[1]) + pad + 1) / cell))
    const Z0 = Math.max(1, Math.floor((Math.min(a[2], b[2]) - pad + 1) / cell)), Z1 = Math.min(G - 2, Math.ceil((Math.max(a[2], b[2]) + pad + 1) / cell))
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L2 = dx * dx + dy * dy + dz * dz || 1e-12
    for (let z = Z0; z <= Z1; z++) { const pz = -1 + z * cell
      for (let y = Y0; y <= Y1; y++) { const py = -1 + y * cell
        for (let x = X0; x <= X1; x++) { const px = -1 + x * cell
          let t = ((px - a[0]) * dx + (py - a[1]) * dy + (pz - a[2]) * dz) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t
          const qx = px - a[0] - t * dx, qy = py - a[1] - t * dy, qz = pz - a[2] - t * dz
          const v = Math.sqrt(qx * qx + qy * qy + qz * qz) - (ra + (rb - ra) * t), id = x + G * (y + G * z)
          if (v < f[id]) f[id] = v
        } } }
  }
  for (let k = 0; k < d.sites.length; k++) {
    if (!keep(k)) continue
    const i = d.sites[k], p = d.parent[k]
    const a = toC(i % nx, Math.floor(i / nx) % ny, Math.floor(i / sxy))
    if (p < 0) { seg(a, a, radius(k) * sc, radius(k) * sc); continue }
    const j = d.sites[p], b = toC(j % nx, Math.floor(j / nx) % ny, Math.floor(j / sxy))
    seg(a, b, radius(k) * sc, radius(p) * sc)
  }
  if (o.base) {
    // disco bajo la raíz, unido con un filete
    const r0 = d.sites[0], rb = toC(r0 % nx, Math.floor(r0 / nx) % ny, Math.floor(r0 / sxy))
    const R = Math.max(0.28 * Math.max(x1 - x0, y1 - y0), 9) * sc, lo = rb[2] - (baseH + 0.5) * sc, hi = rb[2] - 0.5 * sc, k = 1.2 * o.thick * sc
    for (let z = 1; z < G - 1; z++) { const pz = -1 + z * cell; if (pz < lo - 3 * cell - k || pz > hi + 3 * cell + k) continue
      for (let y = 1; y < G - 1; y++) { const py = -1 + y * cell
        for (let x = 1; x < G - 1; x++) { const px = -1 + x * cell
          const v = Math.max(Math.hypot(px - rb[0], py - rb[1]) - R, lo - pz, pz - hi), id = x + G * (y + G * z)
          f[id] = smin(f[id], v, k)
        } } }
  }
  const grid: Grid = { N, values: f }
  const out = analyze(polygonize(grid), grid, o.sizeMm, { minFill: 0.00005, up: '+z' })
  if (!out) return null
  const pos = out.mesh.positions, mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]
  for (let i = 0; i < pos.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], pos[i + a]); mx[a] = Math.max(mx[a], pos[i + a]) }
  const mm = o.sizeMm / Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]), P = new Float32Array(pos.length)
  for (let i = 0; i < pos.length; i += 3) { P[i] = (pos[i] - (mn[0] + mx[0]) / 2) * mm; P[i + 1] = (pos[i + 1] - (mn[1] + mx[1]) / 2) * mm; P[i + 2] = (pos[i + 2] - mn[2]) * mm }
  return { mesh: { positions: P, indices: out.mesh.indices }, metrics: out.metrics, heightMm: (mx[2] - mn[2]) * mm, widthMm: Math.max(mx[0] - mn[0], mx[1] - mn[1]) * mm, kept, main: onMain }
}
