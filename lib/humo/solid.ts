// Del humo al sólido: la nube de partículas se reparte en una grilla con un núcleo
// suave y se extrae la superficie de densidad constante (surface nets, como en el resto
// del sitio). Opcionalmente se agrega una peana: varilla y disco, la pieza queda de pie
// como una escultura de museo.
import { polygonize, type Grid, type Mesh } from '../specimens/polygonize'
import { analyze, type Metrics, type Up } from '../specimens/analyze'
import type { State } from './vortex'

export type SolidOpts = { res: number; sizeMm: number; density: number; pedestal: boolean }
export type SolidResult = { mesh: Mesh; simPositions: Float32Array; mix: Float32Array; metrics: Metrics; heightMm: number; widthMm: number; up: Up }

const FIT = 0.86

export function solidify(s: State, o: SolidOpts): SolidResult | null {
  const P = s.p, n = P.length / 3
  // caja de la nube sin el 0,3 % más lejano por eje (partículas sueltas)
  const ext = [0, 1, 2].map((a) => { const v = new Float64Array(n); for (let i = 0; i < n; i++) v[i] = P[3 * i + a]; v.sort(); return [v[Math.floor(n * 0.003)], v[Math.floor(n * 0.997)]] })
  const c = ext.map(([lo, hi]) => (lo + hi) / 2), half = Math.max(...ext.map(([lo, hi]) => (hi - lo) / 2)) || 1
  const k = FIT / half // de mundo a cubo [-1,1]
  const N = o.res, S = N + 1, cell = 2 / N
  const dens = new Float32Array(S * S * S), w1 = new Float32Array(S * S * S)
  const h = Math.max(1.6, 2.6 * (N / 96)) // radio del núcleo en celdas
  const H = Math.ceil(h)
  for (let i = 0; i < n; i++) {
    const gx = ((P[3 * i] - c[0]) * k + 1) / cell, gy = ((P[3 * i + 1] - c[1]) * k + 1) / cell, gz = ((P[3 * i + 2] - c[2]) * k + 1) / cell
    const ix = Math.round(gx), iy = Math.round(gy), iz = Math.round(gz), t = s.tag[i]
    for (let dz = -H; dz <= H; dz++) for (let dy = -H; dy <= H; dy++) for (let dx = -H; dx <= H; dx++) {
      const x = ix + dx, y = iy + dy, z = iz + dz
      if (x < 1 || y < 1 || z < 1 || x >= S - 1 || y >= S - 1 || z >= S - 1) continue
      const d2 = ((x - gx) ** 2 + (y - gy) ** 2 + (z - gz) ** 2) / (h * h)
      if (d2 >= 1) continue
      const w = (1 - d2) * (1 - d2), id = x + S * (y + S * z)
      dens[id] += w; if (t) w1[id] += w
    }
  }
  // umbral: fracción de la densidad típica dentro del humo (media sobre celdas ocupadas)
  let sum = 0, cnt = 0
  for (let i = 0; i < dens.length; i++) if (dens[i] > 0.05) { sum += dens[i]; cnt++ }
  const th = (sum / Math.max(1, cnt)) * (0.15 + 0.7 * (1 - o.density))
  const values = new Float32Array(S * S * S)
  for (let i = 0; i < values.length; i++) values[i] = th - dens[i]
  const removed = o.pedestal ? addPedestal(values, dens, th, N) : { parts: 0, frac: 0 }
  const grid: Grid = { N, values }
  const out = analyze(polygonize(grid), grid, o.sizeMm, { minFill: 0.0003, ...(o.pedestal ? { up: '+z' as Up } : {}) })
  if (!out) return null
  // los trozos que quitó la peana también son partes sueltas que el STL no lleva
  if (removed.parts) { out.metrics.components += removed.parts; out.metrics.droppedVolumeFrac = removed.frac + (1 - removed.frac) * out.metrics.droppedVolumeFrac }
  // color por anillo: fracción del humo del segundo anillo en cada vértice
  const V = out.mesh.positions.length / 3, mix = new Float32Array(V)
  for (let v = 0; v < V; v++) {
    const x = Math.round((out.mesh.positions[3 * v] + 1) / cell), y = Math.round((out.mesh.positions[3 * v + 1] + 1) / cell), z = Math.round((out.mesh.positions[3 * v + 2] + 1) / cell)
    let a = 0, b = 0
    for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = x + dx, Y = y + dy, Z = z + dz
      if (X < 0 || Y < 0 || Z < 0 || X >= S || Y >= S || Z >= S) continue
      const id = X + S * (Y + S * Z); a += dens[id]; b += w1[id]
    }
    mix[v] = a > 0 ? b / a : 0
  }
  // en coordenadas de la simulación, para mostrarla exactamente donde estaba el humo
  const simPositions = new Float32Array(out.mesh.positions.length)
  for (let i = 0; i < simPositions.length; i += 3) for (let a = 0; a < 3; a++) simPositions[i + a] = out.mesh.positions[i + a] / k + c[a]
  // a mm, apoyada en z = 0 según la orientación elegida
  const up = out.metrics.up, pos = orient(out.mesh.positions, up)
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]
  for (let i = 0; i < pos.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], pos[i + a]); mx[a] = Math.max(mx[a], pos[i + a]) }
  const sc = o.sizeMm / Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2])
  for (let i = 0; i < pos.length; i += 3) { pos[i] = (pos[i] - (mn[0] + mx[0]) / 2) * sc; pos[i + 1] = (pos[i + 1] - (mn[1] + mx[1]) / 2) * sc; pos[i + 2] = (pos[i + 2] - mn[2]) * sc }
  return { mesh: { positions: pos, indices: out.mesh.indices }, simPositions, mix, metrics: out.metrics, up, heightMm: (mx[2] - mn[2]) * sc, widthMm: Math.max(mx[0] - mn[0], mx[1] - mn[1]) * sc }
}

function orient(P: Float32Array, up: Up): Float32Array {
  const o = new Float32Array(P.length)
  for (let i = 0; i < P.length; i += 3) {
    const x = P[i], y = P[i + 1], z = P[i + 2]
    const r = up === '+z' ? [x, y, z] : up === '-z' ? [x, -y, -z] : up === '+x' ? [-z, y, x] : up === '-x' ? [z, y, -x] : up === '+y' ? [x, -z, y] : [x, z, -y]
    o[i] = r[0]; o[i + 1] = r[1]; o[i + 2] = r[2]
  }
  return o
}

// peana: un disco con una varilla bajo cada trozo importante del humo; los jirones
// pequeños se quitan (no sostienen nada y se imprimirían sueltos). La varilla principal
// sube por debajo del punto más bajo cercano al eje del trozo mayor y, si ese punto está
// cerca de su centro de masa, sigue hasta él para clavarse en el cuerpo.
// Devuelve cuántos trozos se quitaron y qué fracción del volumen eran.
const MAX_RODS = 6
function addPedestal(values: Float32Array, dens: Float32Array, th: number, N: number): { parts: number; frac: number } {
  const S = N + 1, tot = S * S * S
  const lab = new Int32Array(tot), stack = new Int32Array(tot)
  const sizes: number[] = [0]
  let occupied = 0
  for (let s0 = 0; s0 < tot; s0++) {
    if (lab[s0] || dens[s0] <= th) continue
    const l = sizes.length; let sp = 0, size = 0; stack[sp++] = s0; lab[s0] = l
    while (sp) {
      const i = stack[--sp]; size++
      const x = i % S, y = Math.floor(i / S) % S, z = Math.floor(i / (S * S))
      if (x > 0 && !lab[i - 1] && dens[i - 1] > th) { lab[i - 1] = l; stack[sp++] = i - 1 }
      if (x < S - 1 && !lab[i + 1] && dens[i + 1] > th) { lab[i + 1] = l; stack[sp++] = i + 1 }
      if (y > 0 && !lab[i - S] && dens[i - S] > th) { lab[i - S] = l; stack[sp++] = i - S }
      if (y < S - 1 && !lab[i + S] && dens[i + S] > th) { lab[i + S] = l; stack[sp++] = i + S }
      if (z > 0 && !lab[i - S * S] && dens[i - S * S] > th) { lab[i - S * S] = l; stack[sp++] = i - S * S }
      if (z < S - 1 && !lab[i + S * S] && dens[i + S * S] > th) { lab[i + S * S] = l; stack[sp++] = i + S * S }
    }
    sizes.push(size); occupied += size
  }
  if (sizes.length < 2) return { parts: 0, frac: 0 }
  // trozos que llevan varilla: los mayores, si pesan al menos un 4 % del mayor
  const order = sizes.map((v, l) => [v, l]).slice(1).sort((a, b) => b[0] - a[0] || a[1] - b[1])
  const kept = order.filter(([v], j) => j < MAX_RODS && v >= 0.04 * order[0][0]).map(([, l]) => l)
  const keep = new Uint8Array(sizes.length); for (const l of kept) keep[l] = 1
  const K = sizes.length, cx = new Float64Array(K), cy = new Float64Array(K), cz = new Float64Array(K), zmin = new Int32Array(K).fill(S)
  let dropped = 0, gzmin = S
  for (let i = 0; i < tot; i++) {
    const l = lab[i]; if (!l) continue
    if (!keep[l]) { values[i] = Math.max(values[i], 0.5 * th); dropped++; continue }
    const x = i % S, y = Math.floor(i / S) % S, z = Math.floor(i / (S * S))
    cx[l] += x; cy[l] += y; cz[l] += z
    if (z < zmin[l]) zmin[l] = z
    if (z < gzmin) gzmin = z
  }
  const ax = new Float64Array(K), ay = new Float64Array(K), az = new Float64Array(K), bc = new Float64Array(K).fill(Infinity)
  for (const l of kept) { cx[l] /= sizes[l]; cy[l] /= sizes[l]; cz[l] /= sizes[l] }
  for (let i = 0; i < tot; i++) {
    const l = lab[i]; if (!l || !keep[l]) continue
    const x = i % S, y = Math.floor(i / S) % S, z = Math.floor(i / (S * S))
    const c = Math.hypot(x - cx[l], y - cy[l]) + 0.6 * (z - zmin[l])
    if (c < bc[l]) { bc[l] = c; ax[l] = x; ay[l] = y; az[l] = z }
  }
  const main = kept[0], mx = cx[main], my = cy[main]
  const zBase = Math.max(2, gzmin - Math.round(0.16 * N)), disc = Math.max(2, Math.round(0.025 * N)), rRod = Math.max(1.8, 0.022 * N)
  let reach = 0
  for (const l of kept) reach = Math.max(reach, Math.hypot(ax[l] - mx, ay[l] - my))
  const rDisc = Math.max(0.2 * N, reach + 0.08 * N)
  const rods = kept.map((l, j) => ({
    x: ax[l], y: ay[l], r: j === 0 ? rRod : Math.max(1.6, 0.7 * rRod),
    top: j === 0 && Math.hypot(ax[l] - cx[l], ay[l] - cy[l]) < 0.08 * N ? Math.max(az[l] + 2, cz[l]) : az[l] + 2,
  }))
  const amp = th * 0.3
  for (let z = zBase; z < S - 1; z++) for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) {
    const id = x + S * (y + S * z)
    let f = Infinity
    if (z <= zBase + disc) f = (Math.hypot(x - mx, y - my) - rDisc) * amp
    for (const r of rods) if (z <= r.top) f = Math.min(f, (Math.hypot(x - r.x, y - r.y) - r.r) * amp)
    if (f < values[id]) values[id] = f
  }
  return { parts: sizes.length - 1 - kept.length, frac: dropped / Math.max(1, occupied) }
}
