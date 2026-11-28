// ARSENAL — campos 2D exactos: polígonos (con signo), polilíneas, desplazamientos y una
// tipografía de trazos para grabar. Todo en mm, en el plano (x, y) de la pieza.
//
// Las piezas de las espadas son, casi todas, perfiles 2D extruidos con chaflanes y grabados:
// el campo 3D se arma combinando distancias 2D exactas con el espesor. Las distancias son
// exactas (no aproximaciones), así que las normales que usa el dual contouring también lo son.

export type Pt = [number, number]

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

// Polígono simple (no hace falta que sea convexo). Distancia con signo: negativa adentro.
export class Poly {
  x: Float64Array; y: Float64Array; n: number
  bx0: number; by0: number; bx1: number; by1: number
  constructor(pts: Pt[]) {
    this.n = pts.length; this.x = new Float64Array(pts.map((p) => p[0])); this.y = new Float64Array(pts.map((p) => p[1]))
    this.bx0 = Math.min(...this.x); this.bx1 = Math.max(...this.x); this.by0 = Math.min(...this.y); this.by1 = Math.max(...this.y)
  }
  // fuera de la caja más un margen se devuelve la distancia a la caja (cota inferior, signo correcto)
  d(px: number, py: number, band = 1e9): number {
    const ox = Math.max(this.bx0 - px, px - this.bx1, 0), oy = Math.max(this.by0 - py, py - this.by1, 0)
    if (ox > band || oy > band) return Math.hypot(ox, oy)
    const { x, y, n } = this
    let best = Infinity, inside = false
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const ax = x[j], ay = y[j], bx = x[i], by = y[i]
      if ((ay > py) !== (by > py) && px < ax + ((py - ay) * (bx - ax)) / (by - ay)) inside = !inside
      const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy
      const t = L2 > 0 ? clamp(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1) : 0
      const ex = px - ax - t * dx, ey = py - ay - t * dy, d2 = ex * ex + ey * ey
      if (d2 < best) best = d2
    }
    const d = Math.sqrt(best)
    return inside ? -d : d
  }
}

// Polilínea abierta: distancia sin signo.
export class Line {
  x: Float64Array; y: Float64Array; n: number
  bx0: number; by0: number; bx1: number; by1: number
  constructor(pts: Pt[]) {
    this.n = pts.length; this.x = new Float64Array(pts.map((p) => p[0])); this.y = new Float64Array(pts.map((p) => p[1]))
    this.bx0 = Math.min(...this.x); this.bx1 = Math.max(...this.x); this.by0 = Math.min(...this.y); this.by1 = Math.max(...this.y)
  }
  d(px: number, py: number, band = 1e9): number {
    const ox = Math.max(this.bx0 - px, px - this.bx1, 0), oy = Math.max(this.by0 - py, py - this.by1, 0)
    if (ox > band || oy > band) return Math.hypot(ox, oy)
    const { x, y, n } = this
    let best = Infinity
    for (let i = 1; i < n; i++) {
      const ax = x[i - 1], ay = y[i - 1], dx = x[i] - ax, dy = y[i] - ay, L2 = dx * dx + dy * dy
      const t = L2 > 0 ? clamp(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1) : 0
      const ex = px - ax - t * dx, ey = py - ay - t * dy, d2 = ex * ex + ey * ey
      if (d2 < best) best = d2
    }
    return Math.sqrt(best)
  }
}

// Conjunto de polígonos o líneas con una caja común (para descartar rápido).
export class Group<T extends Poly | Line> {
  items: T[]; bx0: number; by0: number; bx1: number; by1: number
  constructor(items: T[]) {
    this.items = items
    this.bx0 = Math.min(...items.map((i) => i.bx0), Infinity); this.bx1 = Math.max(...items.map((i) => i.bx1), -Infinity)
    this.by0 = Math.min(...items.map((i) => i.by0), Infinity); this.by1 = Math.max(...items.map((i) => i.by1), -Infinity)
  }
  // mínimo de las distancias (unión); fuera de la caja más el margen, la distancia a la caja
  d(px: number, py: number, band = 6): number {
    if (!this.items.length) return 1e9
    const ox = Math.max(this.bx0 - px, px - this.bx1, 0), oy = Math.max(this.by0 - py, py - this.by1, 0)
    if (ox > band || oy > band) return Math.hypot(ox, oy)
    let m = Infinity
    for (const it of this.items) { const v = it.d(px, py, band); if (v < m) m = v }
    return m
  }
}

// ---------------------------------------------------------------------------------
// Geometría de apoyo

export const lerp2 = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

// Desplaza una polilínea a su izquierda (respecto del sentido de avance) una distancia d, con
// esquinas en inglete (las rectas desplazadas se cortan).
export function offsetLine(pts: Pt[], d: number): Pt[] {
  const n = pts.length, nrm: Pt[] = []
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], L = Math.hypot(dx, dy)
    nrm.push([-dy / L, dx / L])
  }
  const out: Pt[] = [[pts[0][0] + nrm[0][0] * d, pts[0][1] + nrm[0][1] * d]]
  for (let i = 1; i < n - 1; i++) {
    const a = nrm[i - 1], b = nrm[i], s = 1 + a[0] * b[0] + a[1] * b[1]
    const mx = (a[0] + b[0]) / s, my = (a[1] + b[1]) / s // inglete: largo d / cos(θ/2)
    out.push([pts[i][0] + mx * d, pts[i][1] + my * d])
  }
  out.push([pts[n - 1][0] + nrm[n - 2][0] * d, pts[n - 1][1] + nrm[n - 2][1] * d])
  return out
}

// y de una polilínea (x creciente) en x; fuera del rango, el extremo
export function yAt(pts: Pt[], x: number): number {
  if (x <= pts[0][0]) return pts[0][1]
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0] || 1) }
  return pts[pts.length - 1][1]
}

export const rectPoly = (x0: number, y0: number, x1: number, y1: number) => new Poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]])
export function ngon(cx: number, cy: number, r: number, n: number, rot = 0): Poly {
  return new Poly(Array.from({ length: n }, (_, i) => { const a = rot + (2 * Math.PI * i) / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as Pt }))
}
// Cola de milano: cuello en x = x0 (ancho w0), cabeza en x = x0 + dir·depth (ancho w1), centrada en y = yc.
export function dovetail(x0: number, yc: number, dir: 1 | -1, depth: number, w0: number, w1: number, grow = 0): Poly {
  const e = grow, a = x0 - dir * (2 + e), b = x0 + dir * (depth + e)
  const pts: Pt[] = [[a, yc - w0 / 2 - e], [x0, yc - w0 / 2 - e], [b, yc - w1 / 2 - e], [b, yc + w1 / 2 + e], [x0, yc + w0 / 2 + e], [a, yc + w0 / 2 + e]]
  return new Poly(dir > 0 ? pts : pts.reverse())
}

// ---------------------------------------------------------------------------------
// Tipografía de trazos (estilo plantilla industrial). Cada glifo es una lista de polilíneas en
// una grilla de 4 × 6 (x hacia la derecha, y hacia arriba).

const G: Record<string, number[][]> = {
  A: [[0, 0, 0, 4, 1, 6, 3, 6, 4, 4, 4, 0], [0, 3, 4, 3]],
  B: [[0, 0, 0, 6, 3, 6, 4, 5, 4, 4, 3, 3, 0, 3], [3, 3, 4, 2, 4, 1, 3, 0, 0, 0]],
  C: [[4, 6, 1, 6, 0, 5, 0, 1, 1, 0, 4, 0]],
  D: [[0, 0, 0, 6, 3, 6, 4, 5, 4, 1, 3, 0, 0, 0]],
  E: [[4, 6, 0, 6, 0, 0, 4, 0], [0, 3, 3, 3]],
  F: [[4, 6, 0, 6, 0, 0], [0, 3, 3, 3]],
  G: [[4, 6, 1, 6, 0, 5, 0, 1, 1, 0, 4, 0, 4, 3, 2, 3]],
  H: [[0, 0, 0, 6], [4, 0, 4, 6], [0, 3, 4, 3]],
  I: [[1, 6, 3, 6], [2, 6, 2, 0], [1, 0, 3, 0]],
  K: [[0, 0, 0, 6], [4, 6, 0, 2.5], [1.5, 3.5, 4, 0]],
  L: [[0, 6, 0, 0, 4, 0]],
  M: [[0, 0, 0, 6, 2, 3, 4, 6, 4, 0]],
  N: [[0, 0, 0, 6, 4, 0, 4, 6]],
  O: [[1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5, 4, 1, 3, 0, 1, 0]],
  P: [[0, 0, 0, 6, 3, 6, 4, 5, 4, 4, 3, 3, 0, 3]],
  R: [[0, 0, 0, 6, 3, 6, 4, 5, 4, 4, 3, 3, 0, 3], [2, 3, 4, 0]],
  S: [[4, 6, 1, 6, 0, 5, 0, 4, 1, 3, 3, 3, 4, 2, 4, 1, 3, 0, 0, 0]],
  T: [[0, 6, 4, 6], [2, 6, 2, 0]],
  V: [[0, 6, 2, 0, 4, 6]],
  X: [[0, 0, 4, 6], [0, 6, 4, 0]],
  Y: [[0, 6, 2, 3, 4, 6], [2, 3, 2, 0]],
  '0': [[1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5, 4, 1, 3, 0, 1, 0], [1, 1.5, 3, 4.5]],
  '1': [[1, 5, 2, 6, 2, 0], [1, 0, 3, 0]],
  '2': [[0, 5, 1, 6, 3, 6, 4, 5, 4, 4, 0, 0, 4, 0]],
  '3': [[0, 6, 4, 6, 2, 3.5, 3, 3.5, 4, 2.5, 4, 1, 3, 0, 0, 0]],
  '4': [[3, 0, 3, 6, 0, 2, 4, 2]],
  '5': [[4, 6, 0, 6, 0, 3.5, 3, 3.5, 4, 2.5, 4, 1, 3, 0, 0, 0]],
  '6': [[4, 6, 1, 6, 0, 5, 0, 1, 1, 0, 3, 0, 4, 1, 4, 2.5, 3, 3.5, 0, 3.5]],
  '7': [[0, 6, 4, 6, 1.5, 0]],
  '8': [[1, 3, 0, 4, 0, 5, 1, 6, 3, 6, 4, 5, 4, 4, 3, 3, 1, 3, 0, 2, 0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 3, 3]],
  '9': [[4, 2.5, 3, 2.5, 1, 2.5, 0, 3.5, 0, 5, 1, 6, 3, 6, 4, 5, 4, 1, 3, 0, 0, 0]],
  '-': [[0.5, 3, 3.5, 3]],
  '·': [[1.8, 3, 2.2, 3]],
  '/': [[0, 0, 4, 6]],
  ' ': [],
}

// Texto como grupo de polilíneas: altura hgt (mm), arranca en (x0, y0) (esquina inferior
// izquierda) y avanza por +x. Con flip, se escribe en espejo (para leerse desde la otra cara).
export function textLines(text: string, x0: number, y0: number, hgt: number, flip = false): { lines: Line[]; width: number } {
  const u = hgt / 6, adv = 5.4 * u, lines: Line[] = []
  const chars = [...text.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')]
  const width = chars.length * adv - 1.4 * u
  chars.forEach((ch, i) => {
    for (const s of G[ch] ?? []) {
      const pts: Pt[] = []
      for (let k = 0; k < s.length; k += 2) {
        const gx = i * adv + s[k] * u
        pts.push([flip ? x0 + width - gx : x0 + gx, y0 + s[k + 1] * u])
      }
      if (pts.length === 2 && pts[0][0] === pts[1][0] && pts[0][1] === pts[1][1]) pts[1] = [pts[1][0] + 0.01, pts[1][1]]
      lines.push(new Line(pts))
    }
  })
  return { lines, width }
}
