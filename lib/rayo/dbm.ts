// Modelo de ruptura dieléctrica (Niemeyer, Pietronero y Wiesmann, 1984). La descarga es
// un conductor a potencial 0; el electrodo lejano está a 1. Entre ambos el potencial
// cumple la ecuación de Laplace. En cada paso se agrega a la descarga uno de los sitios
// vecinos, con probabilidad proporcional a φ^η: η controla cuánto se ramifica (η = 1 es
// la agregación limitada por difusión; η alto da rayos finos y largos).
// Laplace se resuelve en la grilla con sobre-relajación (SOR): relajación local alrededor
// de cada sitio nuevo y un barrido global cada pocos pasos.
// Solo + − × ÷ y √ (η en medios enteros): el mismo cálculo da lo mismo en todo motor.

export type Geometry = 'plano' | 'esfera' | 'disco'
export type DbmOpts = { geometry: Geometry; nx: number; ny: number; nz: number; eta: number; seed: number; maxSites: number; globalEvery?: number; tower?: number }
export type Dbm = {
  o: DbmOpts; phi: Float32Array; st: Uint8Array // 0 vacío, 1 descarga, 2 electrodo (φ fijo)
  sites: number[]; parent: number[]; order: Int32Array // índice de celda, padre (en 'sites'), orden de llegada por celda
  front: number[]; fpos: Int32Array; done: boolean; hit: number; rng: () => number
}
export const EMPTY = 0, BOLT = 1, FIXED = 2

export function rng(seed: number) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

// φ^η sin Math.pow: η ∈ {0,5; 1; 1,5; …; 4}
export function powEta(p: number, eta: number) {
  const k = Math.floor(eta), half = eta - k > 0.25
  let r = 1; for (let i = 0; i < k; i++) r *= p
  return half ? r * Math.sqrt(p) : r
}

export function create(o: DbmOpts): Dbm {
  const { nx, ny, nz } = o, n = nx * ny * nz
  const phi = new Float32Array(n), st = new Uint8Array(n)
  const id = (x: number, y: number, z: number) => x + nx * (y + ny * z)
  const cx = (nx - 1) / 2, cy = (ny - 1) / 2, cz = (nz - 1) / 2, R = Math.min(nx, ny, o.geometry === 'disco' ? Infinity : nz) / 2 - 1
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    const i = id(x, y, z)
    if (o.geometry === 'plano') {
      if (z === nz - 1) { st[i] = FIXED; phi[i] = 1 } else if (z === 0) { st[i] = FIXED; phi[i] = 0 } else phi[i] = z / (nz - 1)
    } else {
      const r = o.geometry === 'disco' ? Math.hypot(x - cx, y - cy) : Math.hypot(x - cx, y - cy, z - cz)
      if (r >= R) { st[i] = FIXED; phi[i] = 1 } else phi[i] = Math.max(0, r / R)
    }
  }
  const d: Dbm = { o, phi, st, sites: [], parent: [], order: new Int32Array(n).fill(-1), front: [], fpos: new Int32Array(n).fill(-1), done: false, hit: -1, rng: rng(o.seed) }
  // semilla: un punto en el centro, o una torre corta sobre el suelo
  if (o.geometry === 'plano') {
    const h = Math.max(1, o.tower ?? 3), x = Math.floor(cx), y = Math.floor(cy)
    for (let z = 1; z <= h; z++) addSite(d, id(x, y, z), z === 1 ? -1 : d.sites.length - 1)
  } else addSite(d, id(Math.floor(cx), Math.floor(cy), o.geometry === 'disco' ? 0 : Math.floor(cz)), -1)
  for (let k = 0; k < 40; k++) sweep(d, 1.85)
  return d
}

function neighbors(d: Dbm, i: number, out: number[]) {
  const { nx, ny, nz } = d.o, x = i % nx, y = Math.floor(i / nx) % ny, z = Math.floor(i / (nx * ny))
  out.length = 0
  const zr = d.o.geometry === 'disco' ? 0 : 1
  for (let dz = -zr; dz <= zr; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy && !dz) continue
    const X = x + dx, Y = y + dy, Z = z + dz
    if (X < 0 || Y < 0 || Z < 0 || X >= nx || Y >= ny || Z >= nz) continue
    out.push(X + nx * (Y + ny * Z))
  }
}
const nb: number[] = []

function addSite(d: Dbm, i: number, parent: number) {
  d.st[i] = BOLT; d.phi[i] = 0; d.order[i] = d.sites.length
  d.sites.push(i); d.parent.push(parent)
  // fuera de la frontera
  const p = d.fpos[i]; if (p >= 0) { const last = d.front.pop()!; if (last !== i) { d.front[p] = last; d.fpos[last] = p } d.fpos[i] = -1 }
  neighbors(d, i, nb)
  for (const j of nb) {
    if (d.st[j] === FIXED) { if (d.o.geometry === 'plano' && j >= d.o.nx * d.o.ny && d.hit < 0 && d.phi[j] === 1) d.hit = d.sites.length - 1; if (d.o.geometry !== 'plano') d.done = true; continue }
    if (d.st[j] === EMPTY && d.fpos[j] < 0) { d.fpos[j] = d.front.length; d.front.push(j) }
  }
  if (d.hit >= 0) d.done = true
}

// un barrido de SOR rojo-negro sobre las celdas libres (vecindad de 6 para Laplace)
export function sweep(d: Dbm, w = 1.85, box?: [number, number, number, number, number, number]) {
  const { nx, ny, nz } = d.o, { phi, st } = d, sxy = nx * ny
  const [x0, x1, y0, y1, z0, z1] = box ?? [0, nx - 1, 0, ny - 1, 0, nz - 1]
  const flat = d.o.geometry === 'disco'
  for (let color = 0; color < 2; color++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) {
    let x = x0 + ((x0 + y + z + color) & 1)
    for (; x <= x1; x += 2) {
      const i = x + nx * (y + ny * z)
      if (st[i]) continue
      // bordes laterales: espejo (sin flujo)
      const xm = x > 0 ? i - 1 : i + 1, xp = x < nx - 1 ? i + 1 : i - 1, ym = y > 0 ? i - nx : i + nx, yp = y < ny - 1 ? i + nx : i - nx
      let s = phi[xm] + phi[xp] + phi[ym] + phi[yp], c = 4
      if (!flat) { const zm = z > 0 ? i - sxy : i + sxy, zp = z < nz - 1 ? i + sxy : i - sxy; s += phi[zm] + phi[zp]; c = 6 }
      phi[i] += w * (s / c - phi[i])
    }
  }
}

// un paso de crecimiento: elige un sitio de la frontera con probabilidad ∝ φ^η
export function grow(d: Dbm): number {
  if (d.done || !d.front.length) { d.done = true; return -1 }
  const F = d.front, wts = new Float64Array(F.length)
  let tot = 0
  for (let k = 0; k < F.length; k++) { const p = d.phi[F[k]]; tot += p > 0 ? powEta(p, d.o.eta) : 0; wts[k] = tot }
  let k = 0
  if (tot > 0) { const u = d.rng() * tot; let lo = 0, hi = F.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (wts[m] < u) lo = m + 1; else hi = m } k = lo }
  const i = F[k]
  // padre: el vecino de la descarga que llegó primero (rama más vieja)
  neighbors(d, i, nb); let par = -1
  for (const j of nb) if (d.st[j] === BOLT && (par < 0 || d.order[j] < par)) par = d.order[j]
  addSite(d, i, par)
  // relajación local, y global cada tanto
  const { nx, ny, nz } = d.o, x = i % nx, y = Math.floor(i / nx) % ny, z = Math.floor(i / (nx * ny)), r = 4
  const flat = d.o.geometry === 'disco'
  for (let it = 0; it < 2; it++) sweep(d, 1.5, [Math.max(0, x - r), Math.min(nx - 1, x + r), Math.max(0, y - r), Math.min(ny - 1, y + r), flat ? 0 : Math.max(0, z - r), flat ? 0 : Math.min(nz - 1, z + r)])
  if (d.sites.length % (d.o.globalEvery ?? 8) === 0) sweep(d, 1.85)
  if (d.sites.length >= d.o.maxSites) d.done = true
  return i
}

// camino principal: del sitio que tocó el electrodo hasta la raíz
export function mainChannel(d: Dbm): number[] {
  const path: number[] = []; let k = d.hit >= 0 ? d.hit : d.sites.length - 1
  while (k >= 0) { path.push(k); k = d.parent[k] }
  return path
}

// tamaño de cada subárbol (cuánta descarga cuelga de cada sitio): da el grosor
export function subtree(d: Dbm): Int32Array {
  const s = new Int32Array(d.sites.length).fill(1)
  for (let k = d.sites.length - 1; k > 0; k--) if (d.parent[k] >= 0) s[d.parent[k]] += s[k]
  return s
}

// dimensión fractal por masa–radio desde la semilla: pendiente de log N(<r) contra log r
export function massRadius(d: Dbm, rMin: number, rMax: number) {
  const { nx, ny } = d.o, s0 = d.sites[0], x0 = s0 % nx, y0 = Math.floor(s0 / nx) % ny, z0 = Math.floor(s0 / (nx * ny))
  const r = d.sites.map((i) => Math.hypot(i % nx - x0, Math.floor(i / nx) % ny - y0, Math.floor(i / (nx * ny)) - z0)).sort((a, b) => a - b)
  const xs: number[] = [], ys: number[] = []
  for (let k = 0; k < 14; k++) {
    const R = rMin * Math.pow(rMax / rMin, k / 13)
    let lo = 0, hi = r.length; while (lo < hi) { const m = (lo + hi) >> 1; if (r[m] <= R) lo = m + 1; else hi = m }
    xs.push(Math.log(R)); ys.push(Math.log(lo))
  }
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length
  let sxy = 0, sxx = 0; for (let k = 0; k < xs.length; k++) { sxy += (xs[k] - mx) * (ys[k] - my); sxx += (xs[k] - mx) ** 2 }
  return sxy / sxx
}

// dimensión por conteo de cajas sobre la descarga (cajas de 1, 2, 4, 8 y 16 celdas)
export function boxDimension(d: Dbm) {
  const { nx, ny } = d.o, sxy = nx * ny, xs: number[] = [], ys: number[] = []
  for (const b of [1, 2, 4, 8, 16]) {
    const set = new Set<number>()
    for (const i of d.sites) set.add(Math.floor((i % nx) / b) + 1000 * (Math.floor((Math.floor(i / nx) % ny) / b) + 1000 * Math.floor(Math.floor(i / sxy) / b)))
    xs.push(Math.log(1 / b)); ys.push(Math.log(set.size))
  }
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length
  let sxy2 = 0, sxx = 0; for (let k = 0; k < xs.length; k++) { sxy2 += (xs[k] - mx) * (ys[k] - my); sxx += (xs[k] - mx) ** 2 }
  return sxy2 / sxx
}
