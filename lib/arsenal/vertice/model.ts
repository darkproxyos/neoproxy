// NPX-02 VÉRTICE — espada mecánica de una mano y media, paramétrica y para imprimir.
//
// Pieza de exhibición (filo romo de 1,2 mm), no un arma. Marco global, en mm:
//   X a lo largo de la hoja, desde la cara de la guarda (x = 0) hacia la punta; el mango va hacia −X.
//   Y en el plano de la hoja: el lomo hacia +Y, el filo hacia −Y. El eje del mango es y = 0.
//   Z el espesor. Todo es simétrico en Z, así que cada cosa se hace como mitades (z ≥ 0 y su
//   espejo), que se imprimen con la cara de corte sobre la cama: sin soportes.
//
// La hoja tiene capas, como una máquina:
//   · NÚCLEO (gris metal): una placa de ~7,4 mm en dos láminas, A (z ≥ 0) y B (z ≤ 0), con las
//     uniones de A y de B desfasadas (la una tapa la otra al pegarlas). Cada unión es una cola de
//     milano en el plano, que se encaja de arriba. Lleva ventanas pasantes, un canal para una fibra
//     óptica de brillo lateral y, entre las dos láminas, una varilla de 4 mm de la punta al pomo.
//   · FILO (rojo): una franja biselada hasta un borde romo, también en láminas A y B, que entra
//     en el núcleo con colas de milano chicas.
//   · BLINDAJES (gris claro): placas sobre las dos caras que tapan cada par de uniones y las
//     atan con clavijas; la primera, junto a la guarda, lleva la matrícula grabada.
//   · GUARDA con garras, un compartimento para pila y LED bajo un dial de reactor; MANGO de dos
//     manos con anillos; POMO con la toma de la manguera.

import { Poly, Line, Group, offsetLine, yAt, textLines, ngon, type Pt } from '../sdf2'
import type { Fn3 } from '../dc'

export type Punta = 'cincel' | 'tanto' | 'espolon'
export type Paleta = 'carmesi' | 'cobalto' | 'neon'
export type Proc = 'fdm' | 'resina'
export type Quality = 'vista' | 'exportar'

export type VerticeOpts = {
  largo: number       // hoja, desde la guarda hasta la punta (mm)
  ancho: number       // alto de la hoja, del lomo al filo (mm)
  punta: Punta
  ventanas: number    // ventanas pasantes en el núcleo (las que quepan, hasta este número)
  fibra: boolean      // canal para fibra óptica de 2 mm y compartimento de LED
  paleta: Paleta
  proc: Proc
  maxPieza: number    // lado de la cama (mm)
  quality: Quality
}

export const DEFAULTS: VerticeOpts = { largo: 760, ancho: 64, punta: 'cincel', ventanas: 5, fibra: true, paleta: 'carmesi', proc: 'fdm', maxPieza: 220, quality: 'vista' }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const SQ2 = Math.SQRT2

export function cleanOpts(o: Partial<VerticeOpts>): VerticeOpts {
  const d = { ...DEFAULTS, ...o }
  return {
    largo: clamp(Math.round(d.largo), 500, 1000), ancho: clamp(Math.round(d.ancho), 48, 84),
    punta: (['cincel', 'tanto', 'espolon'] as const).includes(d.punta) ? d.punta : 'cincel',
    ventanas: clamp(Math.round(d.ventanas), 0, 9), fibra: !!d.fibra,
    paleta: (['carmesi', 'cobalto', 'neon'] as const).includes(d.paleta) ? d.paleta : 'carmesi',
    proc: d.proc === 'resina' ? 'resina' : 'fdm', maxPieza: clamp(Math.round(d.maxPieza), 140, 320),
    quality: d.quality === 'exportar' ? 'exportar' : 'vista',
  }
}

// largo máximo de una pieza de ancho w en una cama de lado B: derecha o en diagonal
export const capacity = (B: number, w: number) => Math.max(B - 6, (B - 6) * SQ2 - w)

function intersect(p: Pt, d: Pt, q: Pt, e: Pt): Pt {
  const den = d[0] * e[1] - d[1] * e[0], t = ((q[0] - p[0]) * e[1] - (q[1] - p[1]) * e[0]) / den
  return [p[0] + d[0] * t, p[1] + d[1] * t]
}
const unit = (a: Pt, b: Pt): Pt => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); return [dx / L, dy / L] }

// Cola de milano orientada: cuello en p, avanza por dir una profundidad depth (ancho w0 en el cuello,
// w1 en la cabeza), retrocede back para solaparse con la pieza; grow la agranda (para la mortaja).
export function dovetailAt(p: Pt, dir: Pt, depth: number, w0: number, w1: number, back: number, grow = 0): Poly {
  const g = grow, q: Pt = [-dir[1], dir[0]]
  const at = (u: number, v: number): Pt => [p[0] + dir[0] * u + q[0] * v, p[1] + dir[1] * u + q[1] * v]
  return new Poly([at(-back - g, -w0 / 2 - g), at(0, -w0 / 2 - g), at(depth + g, -w1 / 2 - g), at(depth + g, w1 / 2 + g), at(0, w0 / 2 + g), at(-back - g, w0 / 2 + g)])
}

// ---------------------------------------------------------------------------------
// Medidas derivadas

export type Plate = { key: string; x0: number; x1: number; poly: Poly; pins: Pt[]; bolts: Pt[]; chevrons: Line[]; hilt: boolean }
export type Window = { poly: Poly; x0: number; x1: number }

export function derive(o: VerticeOpts) {
  const W = o.ancho, L = o.largo, fdm = o.proc === 'fdm'
  const c = fdm ? 0.25 : 0.12
  const h = o.quality === 'exportar' ? 0.4 : 0.7
  const Th = clamp(W * 0.058, 3.45, 4.4), e = 0.6, eC = 1.0
  const ySp0 = 0.48 * W, ySp1 = 0.44 * W, yEd0 = -0.52 * W, yEd1 = -0.47 * W
  const r0 = 0.6 * W, yR = -0.34 * W
  const S: Pt = [r0 + 0.18 * W, yEd0]
  const bandE = 0.26 * W, bandC = 0.16 * W

  // punta: E1 = fin del filo recto, T = punta, C0 = fin del lomo recto
  let E1: Pt, T: Pt, C0: Pt, clipOn = true
  if (o.punta === 'tanto') { E1 = [L - 0.5 * W, yEd1]; T = [L, ySp1 - 0.2 * W]; C0 = [L - 0.1 * W, ySp1]; clipOn = false }
  else if (o.punta === 'espolon') { E1 = [L - 0.8 * W, yEd1]; T = [L, -0.06 * W]; C0 = [L - 1.6 * W, ySp1] }
  else { E1 = [L - 0.9 * W, yEd1]; T = [L, -0.1 * W]; C0 = [L - 2 * W, ySp1] }
  const spineY = (x: number) => ySp0 + (ySp1 - ySp0) * clamp((x + 3) / (C0[0] + 3), 0, 1)
  const spinePts: Pt[] = [[-3, ySp0]]
  if (o.punta === 'espolon') {
    const a = C0[0] - 0.62 * W, b = C0[0] - 0.3 * W
    spinePts.push([a, spineY(a)], [C0[0] - 0.2 * W, spineY(C0[0]) + 0.13 * W], [b, spineY(b)])
  }
  // dientes en el lomo, antes de la punta
  const teeth: [number, number] | null = o.punta === 'espolon' ? null : [C0[0] - 14 - 3 * 0.15 * W, C0[0] - 14]
  if (teeth) {
    const p = 0.15 * W
    for (let i = 0; i < 3; i++) { const a = teeth[0] + i * p; spinePts.push([a, spineY(a)], [a + 0.7 * p, spineY(a + 0.7 * p) - 0.05 * W], [a + p, spineY(a + p)]) }
  }
  spinePts.push(C0)
  const chamferLine = new Line(o.punta === 'tanto' ? [...spinePts, T] : spinePts)
  const clipLine = clipOn ? new Line([C0, T]) : null

  // mango y guarda
  const Gt = 38, Lgi = 40, tw = clamp(0.4 * W, 20, 27), xT0 = -Gt - Lgi
  const Gy = 16.5, Gzz = 13.5, chG = 5.5, Lsp = 10, Lp = 38
  const Gz = Math.max(13, 0.23 * W), Gc = 0.55 * Gz
  const Lg = Math.round(clamp(Math.min(250, (o.maxPieza - 6) * SQ2 - 2 * Gy - 8), 150, 250))
  const xGf = -Gt - c, xEnd = xGf - Lg, xP = xEnd - c, x0P = xP - Lp
  const yH = Gy + 8.5, rH = 3 + c                 // manguera de 6 mm
  const rr = 2 + (fdm ? 0.2 : 0.1)                // varilla de 4 mm
  const rp = 0.875 + (fdm ? 0.2 : 0.1), pd = 1.5  // clavijas de filamento de 1,75 mm

  // franja del filo: la línea de unión es el filo desplazado bandE hacia adentro
  const edgePts: Pt[] = [S, E1, T], edgeLine = new Line(edgePts)
  const J = offsetLine(edgePts, bandE)
  const Bk = intersect(S, [-1, 1], J[0], [J[1][0] - J[0][0], J[1][1] - J[0][1]])
  const dl = unit(E1, T), Jx: Pt = [J[2][0] + dl[0] * 0.7 * W, J[2][1] + dl[1] * 0.7 * W]
  const jointPts: Pt[] = [Bk, J[1], J[2], Jx]
  const edgeRegion = new Poly([Bk, J[1], J[2], Jx, [Jx[0] + 20, Jx[1]], [Jx[0] + 20, -2 * W], [S[0] + 2 * W + yEd0, -2 * W]])
  const yJ = (x: number) => yAt(jointPts, x)
  const jointDir = (x: number): Pt => { // hacia adentro del núcleo, perpendicular a la unión
    const i = x < J[1][0] ? 0 : 1, a = jointPts[i], b = jointPts[i + 1], u = unit(a, b)
    return [-u[1], u[0]]
  }

  // fibra (opcional) y varilla
  const fibOff = Math.max(9, 0.17 * W), wf = 2 + (fdm ? 0.4 : 0.2), df = 2.15
  const fo = offsetLine([S, E1], bandE + fibOff)
  const xFend = Math.min(C0[0], E1[0]) - 8
  const fEndY = fo[0][1] + ((fo[1][1] - fo[0][1]) * (xFend - fo[0][0])) / (fo[1][0] - fo[0][0])
  const fiberEnd: Pt = [xFend, fEndY]
  const fiber = o.fibra ? new Line([[-Gt / 2 - 6, fo[0][1]], fo[0], fiberEnd]) : null
  const xRod1 = Math.min(C0[0], E1[0]) - 30, xRod0 = xP - Lsp - c - 18
  // banda de las ventanas; la varilla corre por su centro (se ve a través de ellas)
  const winBot = (x: number) => yJ(x) + (o.fibra ? fibOff + wf / 2 + 3.5 : 8)
  const winTop = (x: number) => spineY(x) - Math.max(10, 0.17 * W)
  let yMin = 0
  for (let x = 0; x <= xRod1; x += 5) yMin = Math.max(yMin, yJ(x) + (o.fibra ? fibOff + wf / 2 + 0.9 : 4.5 + c + 1.2) + rr)
  const yRod = clamp((winBot(0.45 * L) + winTop(0.45 * L)) / 2, yMin, Gy - 2 - c - 1.6 - rr)
  // la espiga se corre hacia el lomo lo justo para envolver la varilla
  const tShift = Math.max(0, yRod + rr + 1.6 - tw / 2), tY0 = -tw / 2 + tShift, tY1 = tw / 2 + tShift

  // contorno del núcleo + filo (con la espiga)
  const outline = new Poly([[xT0, tY0], [-3, tY0], [-3, yR], [r0, yR], S, E1, T, ...[...spinePts].reverse(), [-3, tY1], [xT0, tY1]])

  // uniones del núcleo: A en xT0 + kℓ, B desfasadas s hacia la guarda
  const Dd = 0.2 * W, neck = 0.18 * W, head = 0.28 * W
  const wC = ySp0 - yR + 2, capC = capacity(o.maxPieza, wC)
  const hiltEnd = r0 - 6 + (ySp0 - 1.6 - yR - 2.5)
  // dónde termina el núcleo hacia la punta (más allá, todo es filo)
  let xCore = C0[0]
  for (let x = C0[0]; x <= L; x += 1) if (yJ(x) < spineY(x) - 2 && (!clipOn || yJ(x) < yAt([C0, T], x) - 2)) xCore = x
  const Lc = Math.min(L, xCore + 2), Ltot = Lc - xT0
  // primera unión: lejos de la placa de la guarda (su blindaje no puede pisarla)
  const plateHalf = 0.4 * (0.74 * W - 3.4) + 6
  let n = 1, ell = Ltot, s = 0, b1 = Lc, ok = false
  for (n = 1; n < 12; n++) {
    if (n === 1) { if (Ltot <= capC) { s = 0; b1 = Lc; ell = Ltot; ok = true; break } else continue }
    s = 36
    b1 = Math.max(xT0 + Ltot / n, hiltEnd + plateHalf + 6 + s)
    ell = (Lc - b1) / (n - 1)
    s = Math.min(42, 0.45 * Math.min(ell, b1 - xT0), capC - ell, b1 - hiltEnd - plateHalf - 6)
    if (b1 - xT0 + Dd <= capC && ell + Dd <= capC && s >= 20) { ok = true; break }
  }
  // cama chica: el primer tramo (que lleva la espiga) no llega más allá de la placa de matrícula.
  // Tramos parejos, y el blindaje de la primera unión se funde con esa placa (ver abajo).
  if (!ok) {
    for (n = 2; n < 20; n++) { ell = Ltot / n; s = Math.min(36, 0.45 * ell, capC - ell - Dd); if (ell + Dd <= capC && s >= 16) break }
    b1 = xT0 + ell
  }
  const bA = Array.from({ length: n + 1 }, (_, k) => (k === 0 ? xT0 : k === n ? L : b1 + (k - 1) * ell))
  const bB = bA.map((b, k) => (k === 0 || k === n ? b : b - s))
  const yMid = (x: number) => (spineY(x) + yJ(x)) / 2
  const coreTab = (b: number, grow = 0) => dovetailAt([b, yMid(b)], [1, 0], Dd, neck, head, 2, grow)

  // placas de blindaje: la de la guarda (matrícula) y una por cada par de uniones (A y B). Si el
  // blindaje de una unión pisaría la placa de matrícula, las dos se funden en una placa larga.
  const plates: Plate[] = []
  const ytP = (x: number) => spineY(x) - 1.6, ybP = (x: number) => yJ(x) + 1.8
  const pinY = (x: number): Pt => [x, spineY(x) - Math.max(6.5, 0.12 * W)]
  let hilt: Plate
  {
    const yb = yR + 2.5, xa = r0 - 6
    const poly = new Poly([[5, yb], [xa, yb], [hiltEnd, ytP(hiltEnd)], [11, ytP(11)], [5, ytP(5) - 6]])
    hilt = { key: 'blindaje-0', x0: 5, x1: hiltEnd, poly, pins: [[13, yR + 8], [r0 - 12, yR + 8]], bolts: [[r0 - 10, yb + 6.5]], chevrons: [], hilt: true }
    plates.push(hilt)
  }
  for (let k = 1; k < n; k++) {
    const ja = bA[k], jb = bB[k], ym = yMid(ja)
    if (ja + Dd + 20 > Math.min(C0[0], E1[0])) continue
    const H = spineY(ja) - 1.6 - (yJ(ja) + 1.8)
    const x0 = jb - 6 - 0.4 * H, x1 = ja + Dd + 6 + 0.4 * H
    const pins = [jb - 10, jb + 10, ja - 10, ja + 10].filter((x, i, a) => a.findIndex((y) => Math.abs(y - x) < 6) === i).map(pinY)
    const xc = x1 - 0.4 * H - 8, chevrons = [0, 1, 2].map((i) => new Line([[xc - 5 * i - 4, ym + 5], [xc - 5 * i, ym], [xc - 5 * i - 4, ym - 5]]))
    const bolts: Pt[] = [[x0 + 0.4 * H + 5, ybP(x0) + 6], [jb + 0.5 * (ja - jb), ybP(ja) + 6]]
    if (x0 < hilt.x1 + 4) {
      // placa fundida: el contorno de la matrícula atrás y el de la unión adelante
      const yb0 = yR + 2.5, xa = r0 - 6
      let t = 0
      while (t < 60 && yb0 + t < ybP(xa + t)) t += 0.2
      const xs = xa + t
      hilt.poly = new Poly([[5, yb0], [xa, yb0], [xs, ybP(xs)], [x1 - 0.4 * H, ybP(x1 - 0.4 * H)], [x1, ym], [x1 - 0.4 * H, ytP(x1 - 0.4 * H)], [11, ytP(11)], [5, ytP(5) - 6]])
      hilt.x1 = x1
      hilt.pins = [...hilt.pins, ...pins]
      hilt.bolts = [...hilt.bolts, bolts[1]]
      hilt.chevrons = chevrons
      continue
    }
    const poly = new Poly([[x0 + 0.4 * H, ybP(x0)], [x1 - 0.4 * H, ybP(x1)], [x1, ym], [x1 - 0.4 * H, ytP(x1)], [x0, ytP(x0)]])
    plates.push({ key: `blindaje-${k}`, x0, x1, poly, pins, bolts, chevrons, hilt: false })
  }

  // ventanas: en la banda entre la fibra y el lomo, fuera de los blindajes y antes de la punta
  const windows: Window[] = []
  if (o.ventanas > 0) {
    let free: [number, number][] = [[hiltEnd + 8, Math.min(C0[0], E1[0]) - 10]]
    for (const p of plates) {
      const nxt: [number, number][] = []
      for (const [a, b] of free) { if (p.x1 + 6 <= a || p.x0 - 6 >= b) nxt.push([a, b]); else { if (p.x0 - 6 > a) nxt.push([a, p.x0 - 6]); if (p.x1 + 6 < b) nxt.push([p.x1 + 6, b]) } }
      free = nxt
    }
    const target = clamp(0.62 * W, 30, 52), gap = 0.2 * W
    const cand: [number, number][] = []
    for (const [a, b] of free) {
      const F = b - a
      if (F < 26) continue
      const m = Math.max(1, Math.floor((F + gap) / (target + gap))), wl = (F - (m - 1) * gap) / m
      for (let i = 0; i < m; i++) cand.push([a + i * (wl + gap), a + i * (wl + gap) + wl])
    }
    const pick = cand.length <= o.ventanas ? cand : Array.from({ length: o.ventanas }, (_, i) => cand[Math.round((i * (cand.length - 1)) / Math.max(1, o.ventanas - 1))])
    for (const [xa, xb] of pick) {
      const xm = (xa + xb) / 2, yb = winBot(xm), yt = winTop(xm), hh = yt - yb
      if (hh < 6) continue
      windows.push({ x0: xa, x1: xb, poly: new Poly([[xa, yb], [xb - 0.45 * hh, yb], [xb, (yb + yt) / 2], [xb - 0.45 * hh, yt], [xa + 0.55 * hh, yt]]) })
    }
  }

  // clavijas entre las láminas A y B (cara de corte), lejos de las uniones
  const joints = [...bA.slice(1, -1), ...bB.slice(1, -1)]
  const lamPins: Pt[] = []
  const nearTeeth = (x: number) => !!teeth && x > teeth[0] - 4 && x < teeth[1] + 4
  for (let x = 14; x < Math.min(C0[0], E1[0]) - 20; x += 58) {
    let xx = x
    if (joints.some((j) => Math.abs(xx - j) < 6)) xx += 12
    if (!joints.some((j) => Math.abs(xx - j) < 6) && !nearTeeth(xx)) lamPins.push([xx, spineY(xx) - Math.max(5, 0.08 * W)])
  }

  // franja del filo: cortes en ángulo, desfasados de las uniones del núcleo de su misma lámina
  const capE = capacity(o.maxPieza, (o.punta === 'tanto' ? 0.95 : 0.55) * W)
  const xe0 = Bk[0], Le = L - xe0, ne = Math.max(1, Math.ceil(Le / (capE - 34)))
  const edgeCuts = (b: number[]) => {
    const cuts: number[] = []
    for (let j = 1; j < ne; j++) {
      let x = xe0 + (j * Le) / ne
      for (let it = 0; it < 4; it++) { const near = b.slice(1, -1).find((q) => Math.abs(q - x) < 26); if (near === undefined) break; x = near + (x >= near ? 26 : -26) }
      cuts.push(x)
    }
    return cuts
  }
  const cutsA = edgeCuts(bA), cutsB = edgeCuts(bB)
  const edgeTabs = (b: number[], cuts: number[]) => {
    const xs: number[] = [], x1 = J[1][0] - 10
    const bad = (x: number) => b.slice(1, -1).some((q) => Math.abs(q - x) < 14) || cuts.some((q) => Math.abs(q - x) < 16)
    for (let x = xe0 + 22; x < x1; x += 64) { let xx = x; for (let it = 0; it < 6 && bad(xx); it++) xx += 7; if (!bad(xx) && xx < x1) xs.push(xx) }
    return xs
  }
  const tabsAx = edgeTabs(bA, cutsA), tabsBx = edgeTabs(bB, cutsB)
  const tabPoly = (x: number, grow = 0) => dovetailAt([x, yJ(x)], jointDir(x), 4.5, 6, 9, 2, grow)

  return {
    o, W, L, fdm, c, h, Th, e, eC, ySp0, ySp1, yEd0, yEd1, r0, yR, S, E1, T, C0, bandE, bandC, clipOn, spineY, spinePts, chamferLine, clipLine, teeth,
    tY0, tY1, winBot, winTop,
    Gt, Lgi, tw, xT0, Gy, Gzz, chG, Lsp, Lp, Gz, Gc, Lg, xGf, xEnd, xP, x0P, yH, rH, rr, rp, pd,
    outline, edgeLine, jointPts, edgeRegion, yJ, Bk, fibOff, wf, df, fiber, fiberEnd, xRod0, xRod1, yRod,
    n, ell, s, bA, bB, Dd, neck, head, coreTab, yMid, plates, windows, lamPins, hiltEnd,
    ne, cutsA, cutsB, tabsAx, tabsBx, tabPoly, capC, capE, Lc, xCore,
  }
}
export type Dims = ReturnType<typeof derive>

// ---------------------------------------------------------------------------------
// Campos. Cada pieza se describe como su mitad superior (z ≥ 0); la lámina B es su espejo.

const memo = (prep: (x: number, y: number, t: Float64Array) => void, f: (t: Float64Array, x: number, y: number, z: number) => number, n = 16): Fn3 => {
  const t = new Float64Array(n)
  let lx = NaN, ly = NaN
  return (x, y, z) => { if (x !== lx || y !== ly) { lx = x; ly = y; prep(x, y, t) } return f(t, x, y, z) }
}
const DG = 0.7    // surcos en V de 90°: medio ancho = profundidad
const GW = 0.65, GD = 0.6 // surcos de panel de fondo plano: medio ancho y profundidad
const LW = 0.6, LD = 0.55 // rótulos de armado en la cara de corte: medio ancho y profundidad (fondo plano)

export type Side = 'A' | 'B'

// Superficie superior de la hoja (bisel del contrafilo de la punta)
function clipTop(D: Dims, x: number, y: number) {
  return D.clipLine ? D.eC + ((D.Th - D.eC) * D.clipLine.d(x, y)) / D.bandC : 1e9
}

// distancia a la región «filo + sus colas» de una lámina
function edgeTabsGroup(D: Dims, side: Side, grow: number) {
  return new Group((side === 'A' ? D.tabsAx : D.tabsBx).map((x) => D.tabPoly(x, grow)))
}

export function coreField(D: Dims, side: Side, k: number, labels: boolean): Fn3 {
  const b = side === 'A' ? D.bA : D.bB, n = D.n, c = D.c
  const lo = k === 0 ? -1e9 : b[k] + c / 2, hi = k === n - 1 ? 1e9 : b[k + 1] - c / 2
  const tabF = k < n - 1 ? D.coreTab(b[k + 1]) : null, sock = k > 0 ? D.coreTab(b[k]) : null
  const tabsE = edgeTabsGroup(D, side, 0)
  const wins = new Group(D.windows.map((w) => w.poly))
  const xr1 = D.teeth ? D.teeth[0] - 6 : D.C0[0] - 14
  const rail = new Line([[D.hiltEnd + 4, D.spineY(D.hiltEnd + 4) - 4.5], [xr1, D.spineY(xr1) - 4.5]])
  const pinsT = D.plates.flatMap((p) => p.pins), pinsB = D.lamPins
  const near = (P: Pt[], x: number, y: number) => { let m = 1e9; for (const p of P) { const d = Math.hypot(x - p[0], y - p[1]); if (d < m) m = d } return m - D.rp }
  // rótulo de armado en la cara de corte (se lee mirando esa cara)
  const lab = labels ? textLines(`${side}${k + 1}`, k === 0 ? D.xT0 + 8 : b[k] + D.Dd + 5, k === 0 ? D.tY0 + 1.5 : D.yRod + 3.5, 5, side === 'A') : null
  const labG = lab ? new Group(lab.lines) : null
  const node = D.fiberEnd
  const xmin = k === 0 ? -1e9 : b[k] - 3, xmax = k === n - 1 ? 1e9 : b[k + 1] + D.Dd + 3
  return memo((x, y, t) => {
    // región 2D de la pieza
    const dBl = D.outline.d(x, y, 8)
    const dEr = Math.min(D.edgeRegion.d(x, y, 8), tabsE.d(x, y, 4))
    let dS = Math.max(lo - x, x - hi)
    if (tabF) dS = Math.min(dS, tabF.d(x, y, 4))
    if (sock) dS = Math.max(dS, c - sock.d(x, y, 4))   // mortaja: la cola desplazada c exacto
    t[0] = Math.max(dBl, c - dEr, dS)
    t[1] = Math.min(D.Th, clipTop(D, x, y))
    t[2] = D.chamferLine.d(x, y, 4)
    t[3] = x < xmin || x > xmax ? 1e9 : wins.d(x, y, 6)
    t[4] = Math.min(rail.d(x, y, 3), Math.abs(t[3] - 2.6))
    t[5] = D.fiber ? Math.min(D.fiber.d(x, y, 4), Math.hypot(x - node[0], y - node[1]) - 2.8 + D.wf / 2) : 1e9
    t[6] = Math.abs(y - D.yRod); t[7] = Math.min(x - D.xRod0, D.xRod1 - x)
    t[8] = near(pinsT, x, y); t[9] = near(pinsB, x, y)
    t[10] = labG ? labG.d(x, y, 3) : 1e9
  }, (t, _x, _y, z) => {
    const zt = t[1]
    let f = Math.max(t[0], z - zt, -z)
    f = Math.max(f, (z - zt + 0.8 - t[2]) / SQ2)                       // chaflán del lomo
    if (t[3] < 4) f = Math.max(f, Math.max(0, z - zt + 1.0) - t[3])     // ventanas pasantes con chaflán arriba
    if (t[4] < 1) f = Math.max(f, Math.min(GW - t[4], z - (zt - GD)))    // líneas de panel
    if (t[5] < 4) f = Math.max(f, Math.min(D.wf / 2 - t[5], z - (zt - D.df)))   // canal de la fibra
    f = Math.max(f, Math.min(D.rr - Math.hypot(t[6], z), t[7]))         // canal de la varilla
    f = Math.max(f, Math.min(-t[8], z - (zt - D.pd)))                   // clavijas del blindaje (arriba)
    f = Math.max(f, Math.min(-t[9], D.pd - z))                           // clavijas entre láminas (abajo)
    if (t[10] < 2) f = Math.max(f, Math.min(LW - t[10], LD - z))         // rótulo
    return f
  })
}

export function edgeField(D: Dims, side: Side, j: number, labels: boolean): Fn3 {
  const cuts = side === 'A' ? D.cutsA : D.cutsB, c = D.c
  const tabs = edgeTabsGroup(D, side, 0)
  const nrm: Pt = [Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)]
  const cutD = (i: number, x: number, y: number) => { const x0 = cuts[i]; return (x - x0) * nrm[0] + (y - D.yJ(x0)) * nrm[1] }
  const xs = j === 0 ? D.Bk[0] + 10 : cuts[j - 1] + 10
  const lab = labels ? textLines(`F${side}${j + 1}`, xs, D.yJ(xs) - 8, 4.5, side === 'A') : null
  const labG = lab ? new Group(lab.lines) : null
  return memo((x, y, t) => {
    let d = Math.max(D.outline.d(x, y, 8), Math.min(D.edgeRegion.d(x, y, 8), tabs.d(x, y, 4)))
    if (j > 0) d = Math.max(d, c / 2 - cutD(j - 1, x, y))
    if (j < cuts.length) d = Math.max(d, cutD(j, x, y) + c / 2)
    t[0] = d
    t[1] = Math.min(D.Th, D.e + ((D.Th - D.e) * D.edgeLine.d(x, y)) / D.bandE, clipTop(D, x, y))
    t[2] = D.chamferLine.d(x, y, 4)
    t[3] = labG ? labG.d(x, y, 3) : 1e9
  }, (t, _x, _y, z) => {
    let f = Math.max(t[0], z - t[1], -z)
    f = Math.max(f, (z - t[1] + 0.8 - t[2]) / SQ2)
    if (t[3] < 2) f = Math.max(f, Math.min(LW - t[3], LD - z))
    return f
  })
}

export const Ah = 2.2 // espesor de los blindajes

// Blindaje (mitad de arriba: apoyado en z = Th). textFlip: el grabado decorativo se lee desde su cara.
export function plateField(D: Dims, p: Plate, side: Side, labels: boolean): Fn3 {
  const flat = (x: number, y: number) => Math.max(D.outline.d(x, y, 8) + 1.0, D.clipLine ? D.bandC + 0.5 - D.clipLine.d(x, y) : -1e9)
  const hexes = new Group(p.bolts.map((b) => ngon(b[0], b[1], 2.9, 6, Math.PI / 6)))
  const deco: Line[] = [...p.chevrons]
  if (p.hilt) {
    const yb = D.spineY(10) - 1.6 - 12.5, t1 = textLines('NPX-02', 11, yb, 7.5, side === 'B'), t2 = textLines('VERTICE', 11, yb - 10, 5, side === 'B')
    deco.push(...t1.lines, ...t2.lines)
  }
  const decoG = new Group(deco)
  const lab = labels ? textLines(`${p.hilt ? 'P0' : 'P' + p.key.split('-')[1]}${side}`, p.hilt ? 14 : p.x0 + 14, D.yJ(p.hilt ? 14 : p.x0 + 14) + 6 + (p.hilt ? 18 : 0), 4, side === 'A') : null
  const labG = lab ? new Group(lab.lines) : null
  const z0 = D.Th, z1 = D.Th + Ah, BH = 0.8
  return memo((x, y, t) => {
    t[0] = Math.max(p.poly.d(x, y, 6), flat(x, y))
    t[1] = hexes.d(x, y, 4)
    let m = 1e9; for (const b of p.bolts) m = Math.min(m, Math.hypot(x - b[0], y - b[1])); t[2] = m
    t[3] = Math.abs(t[0] + 2.8)
    t[4] = decoG.d(x, y, 3)
    m = 1e9; for (const q of p.pins) m = Math.min(m, Math.hypot(x - q[0], y - q[1])); t[5] = m - D.rp
    t[6] = labG ? labG.d(x, y, 3) : 1e9
  }, (t, _x, _y, z) => {
    let f = Math.max(t[0], z - z1, z0 - z)
    f = Math.max(f, (t[0] + z - z1 + 0.7) / SQ2)
    const g = Math.min(t[3], t[4])
    if (g < 1.2) f = Math.max(f, Math.min(0.72 - g, z - (z1 - 0.65)))      // marco y grabados
    let bolt = Math.max(t[1], z - z1 - BH, (t[1] + z - z1 - BH + 0.35) / SQ2, z0 + 0.2 - z)
    bolt = Math.max(bolt, Math.min(0.8 - t[2], z - (z1 + BH - 0.45)))
    f = Math.min(f, bolt)
    f = Math.max(f, Math.min(-t[5], z0 + D.pd - z))                        // clavijas (abajo)
    if (t[6] < 2) f = Math.max(f, Math.min(LW - t[6], z0 + LD - z))
    return f
  })
}

// Guarda (mitad de arriba). Garras bajas alrededor de un bloque alto con el dial.
export function guardGeom(D: Dims) {
  const W = D.W, Gt = D.Gt
  const yTop = Math.max(0.62 * W, D.yH + 8), yBot = -0.58 * W
  const outline = new Poly([
    [0, D.yR - 6], [0.3 * W, D.yR - 6], [0.36 * W, D.yR - 12], [0.18 * W, -0.66 * W], [-0.12 * W, -0.7 * W], [-Gt, yBot],
    [-Gt, yTop], [-0.12 * W, 0.7 * W], [0.24 * W, 0.64 * W], [0.34 * W, 0.58 * W], [0.3 * W, D.ySp0 + 5], [0, D.ySp0 + 5],
  ])
  const bt = Math.max(D.ySp0 + 5, D.yH + 6), bb = D.yR - 6, k = 4
  const block = new Poly([[-Gt, bb + k], [-Gt + k, bb], [0, bb], [0, bt], [-Gt + k, bt], [-Gt, bt - k]])
  const dial: Pt = [-Gt / 2, 0]
  return { outline, block, dial, Rrec: 15 + D.c, Rcav: 11, yTop, yBot, bt, bb }
}

export function guardField(D: Dims): Fn3 {
  const G = guardGeom(D), Gz = D.Gz, Gc = D.Gc, c = D.c, Gt = D.Gt
  const slot = new Group([
    new Poly([[D.xT0 - 5, D.tY0 - c], [1, D.tY0 - c], [1, D.tY1 + c], [D.xT0 - 5, D.tY1 + c]]),
    new Poly([[-3 - c, D.yR - c], [1, D.yR - c], [1, D.ySp0 + c], [-3 - c, D.ySp0 + c]]),
  ])
  const vents = new Group([1, -1].flatMap((sg) => [0, 1, 2].map((i) => new Line([[-Gt + 7, sg * (24 + 4 * i)], [-7, sg * (24 + 4 * i)]])))
    .filter((l) => l.by0 > G.bb + 2.5 && l.by1 < G.bt - 2.5))
  // placa central alrededor del dial (un escalón más alta que el bloque) y bisel del reactor
  const k = 5, cx0 = -Gt + 2.5, cx1 = -2.5, cy = 21
  const center = new Poly([[cx0 + k, -cy], [cx1 - k, -cy], [cx1, -cy + k], [cx1, cy - k], [cx1 - k, cy], [cx0 + k, cy], [cx0, cy - k], [cx0, -cy + k]])
  const Zb = Gz - 1.6, R0 = G.Rrec + 0.9, R1 = G.Rrec + 2.7
  return memo((x, y, t) => {
    t[0] = G.outline.d(x, y, 6); t[1] = G.block.d(x, y, 6); t[2] = slot.d(x, y, 4)
    t[3] = Math.hypot(x - G.dial[0], y - G.dial[1]); t[4] = Math.abs(y - D.yH)
    t[5] = Math.abs(t[0] + 3); t[6] = vents.d(x, y, 3); t[7] = center.d(x, y, 6)
  }, (t, x, _y, z) => {
    const fc = Math.max(t[0], z - Gc, (t[0] + z - Gc + 1.2) / SQ2)
    const fb = Math.max(t[1], z - Zb, (t[1] + z - Zb + 1.6) / SQ2)
    const fp = Math.max(t[7], z - Gz, (t[7] + z - Gz + 1.0) / SQ2)
    const dR = Math.max(R0 - t[3], t[3] - R1), fr = Math.max(dR, z - Gz - 1.0, (dR + z - Gz - 1.0 + 0.5) / SQ2, t[1])
    let f = Math.max(Math.min(fc, fb, fp, fr), -z)
    if (t[1] > 0.3 && t[5] < 1) f = Math.max(f, Math.min(GW - t[5], z - (Gc - GD)))   // línea de las garras
    if (t[6] < 1) f = Math.max(f, Math.min(GW - t[6], z - (Zb - GD)))                // ventilas del bloque
    f = Math.max(f, Math.min(-t[2], D.Th + c - z))                         // ranura de la espiga
    if (D.o.fibra) f = Math.max(f, Math.min(G.Rcav - t[3], Gz - 2 - z))   // compartimento
    f = Math.max(f, Math.min(G.Rrec - t[3], z - (Gz - 2)))                 // asiento del dial
    f = Math.max(f, Math.min(D.rH - Math.hypot(t[4], z), -Gt + 12 - x))    // toma de la manguera
    return f
  })
}

// Mango (mitad de arriba): sección octogonal con anillos.
export function gripRings(D: Dims) {
  const out: number[] = []
  for (let x = D.xEnd + 16; x < D.xGf - 10; x += 26) out.push(x)
  return out
}
export function gripField(D: Dims): Fn3 {
  const rings = gripRings(D), c = D.c
  const pins: Pt[] = [[D.xT0 - c - 22, 10.5], [D.xT0 - c - 22, -10.5], [D.xEnd + 28, 10.5], [D.xEnd + 28, -10.5]]
  const oct = (ay: number, az: number, gy: number, gz: number, ch: number) => Math.max(ay - gy, az - gz, (ay + az - (gy + gz - ch)) / SQ2)
  return memo((x, y, t) => {
    let m = 1e9; for (const r of rings) m = Math.min(m, Math.abs(x - r))
    t[0] = clamp(3.5 + 1.2 - m, 0, 1.2)
    t[1] = Math.max(D.tY0 - c - y, y - D.tY1 - c, D.xT0 - c - x)              // bolsillo de la espiga (x < −Gt)
    t[2] = Math.abs(y - D.yRod)
    m = 1e9; for (const p of pins) m = Math.min(m, Math.hypot(x - p[0], y - p[1])); t[3] = m - D.rp
  }, (t, x, y, z) => {
    const gy = D.Gy + t[0], gz = D.Gzz + t[0], ay = Math.abs(y)
    const body = Math.max(oct(ay, z, gy, gz, D.chG), x - D.xGf, D.xEnd - x)
    const sp = Math.max(oct(ay, z, D.Gy - 2.5, D.Gzz - 2.5, D.chG - 1), x - D.xEnd - 1, D.xEnd - D.Lsp - x)
    let f = Math.max(Math.min(body, sp), -z)
    f = Math.max(f, z - gz + DG - Math.abs(ay - 6))                       // surcos de la cara
    f = Math.max(f, ay - gy + DG - Math.abs(z - 6.5))                     // surcos del canto
    f = Math.max(f, Math.min(-t[1], D.Th + c - z))                        // espiga
    f = Math.max(f, D.rr - Math.hypot(t[2], z))                           // varilla
    f = Math.max(f, Math.min(-t[3], D.pd - z))                            // clavijas
    return f
  })
}

// Pomo (pieza entera): brida, cuerpo octogonal y la oreja de la manguera.
export function pommelField(D: Dims): Fn3 {
  const c = D.c, x0 = D.x0P, xP = D.xP
  const cham = (y: number, z: number, hy: number, hz: number, ch: number) => { const ay = Math.abs(y), az = Math.abs(z); return Math.max(ay - hy, az - hz, (ay + az - (hy + hz - ch)) / SQ2) }
  const yc = 5.5, hy = D.Gy + 10.5, hz = D.Gzz + 5
  return (x, y, z) => {
    const dF = cham(y - yc, z, hy, hz, 4)
    const flange = Math.max(dF, x - (x0 + 12), x0 - x, (dF + x - (x0 + 12) + 2.5) / SQ2)
    const dB = cham(y, z, D.Gy + 2.5, D.Gzz + 2.5, D.chG + 1)
    const body = Math.max(dB, x - xP, x0 - x, (dB + x - xP + 1.2) / SQ2)
    const dL = cham(y - (D.Gy + 7), z, 8, 7, 2)
    const lug = Math.max(dL, x - (xP - 6), x0 - x, (dL + x - (xP - 6) + 1.5) / SQ2)
    let f = Math.min(flange, body, lug)
    f = Math.max(f, dF + DG - Math.abs(x - (x0 + 6)))
    f = Math.max(f, dB + DG - Math.abs(x - (x0 + 21)))
    const dPk = cham(y, z, D.Gy - 2.5 + c, D.Gzz - 2.5 + c, D.chG - 1 + 0.4 * c)
    f = Math.max(f, Math.min(-dPk, x - (xP - D.Lsp - c)))
    f = Math.max(f, Math.min(D.rr - Math.hypot(y - D.yRod, z), x - (xP - D.Lsp - c - 18)))
    f = Math.max(f, Math.min(D.rH - Math.hypot(y - D.yH, z), x - (xP - 6 - 12)))
    return f
  }
}

// Dial del reactor (local: centrado en 0, de z = 0 a Dt). Engranaje de 16 dientes con rayos.
export const Dt = 3.6
export function dialGeom() {
  const pts: Pt[] = [], N = 16, Ro = 15, Rr = 13.4
  for (let i = 0; i < N; i++) {
    const a = (2 * Math.PI * i) / N, w = (2 * Math.PI) / N
    for (const [da, r] of [[-0.5, Rr], [-0.26, Rr], [-0.14, Ro], [0.14, Ro], [0.26, Rr], [0.5, Rr]] as [number, number][])
      if (!(da === 0.5)) pts.push([r * Math.cos(a + da * w), r * Math.sin(a + da * w)])
  }
  return new Poly(pts)
}
export function dialField(): Fn3 {
  const gear = dialGeom()
  const spokes = new Group([0, 1, 2].map((i) => { const a = (2 * Math.PI * i) / 3 + Math.PI / 2; return new Line([[0, 0], [9 * Math.cos(a), 9 * Math.sin(a)]]) }))
  return memo((x, y, t) => { t[0] = gear.d(x, y); t[1] = Math.hypot(x, y); t[2] = spokes.d(x, y) }, (t, _x, _y, z) => {
    const ring = Math.max(t[0], 8 - t[1]), hub = t[1] - 3.4, sp = Math.max(t[2] - 1.3, t[1] - 8.5)
    const d2 = Math.min(ring, hub, sp)
    let f = Math.max(d2, z - Dt, -z, Math.min(8.2 - t[1], z - (Dt - 0.9)))
    f = Math.max(f, (t[0] + z - Dt + 0.6) / SQ2)
    f = Math.max(f, z - Dt + 0.45 - Math.abs(t[1] - 11))                 // anillo grabado
    return f
  })
}

// Manguera (solo para la vista): tubo de 6 mm entre la guarda y el pomo.
export function hosePath(D: Dims): Pt[] {
  const a: Pt = [-D.Gt - 4, D.yH], b: Pt = [D.xP - 6 + 4, D.yH], mid = (a[0] + b[0]) / 2
  const out: Pt[] = []
  for (let i = 0; i <= 48; i++) {
    const t = i / 48, x = a[0] + (b[0] - a[0]) * t
    out.push([x, D.yH + 16 * Math.sin(Math.PI * t) ** 1.4 * (1 - 0.15 * Math.cos(2 * Math.PI * (x - mid) / 80))])
  }
  return out
}
