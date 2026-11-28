// KATANA CYBORG — modelo paramétrico por campos de distancia (SDF).
//
// Una pieza de exhibición para imprimir (filo romo), no un arma. Marco global, en mm:
//   X a lo largo de la hoja, desde la base (x = 0) hacia la punta; el mango sale hacia −X.
//   Y en el plano de la curva: el lomo (mune) hacia +Y, el filo (ha) hacia −Y.
//   Z el espesor. La hoja es simétrica en Z, así que las piezas largas se hacen como mitades
//   (z ≥ 0) y se imprimen con la cara de corte plana sobre la cama: sin soportes.
//
// La hoja es un arco de círculo (el sori): con el centro de curvatura en (0, Rc), cada punto
// tiene una distancia al largo del arco s = Rc·θ y una altura v sobre la línea central. En
// esas coordenadas la sección es la de un shinogi-zukuri: lomo plano, un filo a 62 % de
// la altura (shinogi) y de ahí un bisel hasta un borde romo. Todo lo demás (aletas, ventilas,
// hamon, espigas) se suma o se resta a esa sección; los campos no son distancias exactas, pero
// sí monótonos y con el signo correcto, que es lo que necesita surface nets.

import { makeBox, region, nets, type NetMesh } from '../antesis/nets'
import { mulberry32, type Rng } from '../specimens/rng'

export type Proc = 'fdm' | 'resina'
export type Hamon = 'notare' | 'gunome' | 'circuito' | 'ninguno'
export type TsubaStyle = 'engranaje' | 'octogono' | 'calado'
export type Wrap = 'diamante' | 'anillos'
export type Quality = 'vista' | 'exportar'

export type KatanaOpts = {
  nagasa: number      // largo de la hoja, mm
  sori: number        // curvatura: flecha del arco en % del largo
  kissaki: number     // largo de la punta, % del largo
  hamon: Hamon
  aletas: boolean     // aletas disipadoras en el lomo
  ventilas: number    // ranuras pasantes
  tsuba: TsubaStyle
  mango: Wrap
  proc: Proc
  maxPieza: number    // lado de la cama de impresión, mm
  electronica: boolean
  seed: number
  quality: Quality
}

export const DEFAULTS: KatanaOpts = {
  nagasa: 600, sori: 2.2, kissaki: 7.5, hamon: 'circuito', aletas: true, ventilas: 6, tsuba: 'engranaje', mango: 'diamante',
  proc: 'fdm', maxPieza: 220, electronica: true, seed: 7, quality: 'vista',
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export function cleanOpts(o: Partial<KatanaOpts>): KatanaOpts {
  const d = { ...DEFAULTS, ...o }
  return {
    ...d,
    nagasa: clamp(Math.round(d.nagasa), 200, 1000), sori: clamp(d.sori, 0.6, 4), kissaki: clamp(d.kissaki, 5, 12),
    ventilas: clamp(Math.round(d.ventilas), 0, 12), maxPieza: clamp(Math.round(d.maxPieza), 140, 300), seed: Math.round(d.seed) >>> 0,
    hamon: (['notare', 'gunome', 'circuito', 'ninguno'] as const).includes(d.hamon) ? d.hamon : 'circuito',
    tsuba: (['engranaje', 'octogono', 'calado'] as const).includes(d.tsuba) ? d.tsuba : 'engranaje',
    mango: d.mango === 'anillos' ? 'anillos' : 'diamante', proc: d.proc === 'resina' ? 'resina' : 'fdm',
    quality: d.quality === 'exportar' ? 'exportar' : 'vista', aletas: !!d.aletas, electronica: !!d.electronica,
  }
}

// ---------------------------------------------------------------------------------
// Medidas derivadas

export type Dims = {
  N: number; w0: number; w1: number; t0: number; t1: number; e0: number; Rc: number; kl: number; qs: number; sag: number
  c: number; rp: number; h: number
  qc: number; qhw: number                // espiga: centro y semiancho (en q)
  Lt: number; nseg: number; bounds: number[]; joints: number[]; halfC: number; exclJ: number
  // mango
  Yc: number; tw0: number; tt0: number; Lh: number; ayF: number; azF: number; ayB: number; azB: number
  tp: number; hub: number; Rt: number; fuchiL: number; xf: number; xend: number; spl: number; Ltang: number; xm: number; rm: number
  pocket: { x0: number; x1: number; hy: number; hz: number } | null
  dowels: number[]; wrapPitch: number; ringPitch: number; gw: number; gd: number; capL: number
  finPitch: number; finW: number; finH0: number; fin0: number; fin1: number
}

export function derive(o: KatanaOpts): Dims {
  const N = o.nagasa, k = N / 700, rk = Math.sqrt(k)
  const w0 = clamp(31 * rk, 20, 33), t0 = clamp(8 * rk, 5.2, 8.2)
  const fdm = o.proc === 'fdm'
  const c = fdm ? 0.25 : 0.12, rp = fdm ? 1.05 : 0.9
  const Lt = clamp(w0 * 0.6, 14, 20)
  const sag = (N * o.sori) / 100
  const qc = 0.78, qhw = 0.17
  const tw0 = 2 * qhw * w0, tt0 = 0.55 * t0
  const Yc = (qc - 0.5) * w0
  const Lh = Math.round(clamp(Math.min(0.34 * N, o.maxPieza - 10), 100, 260))
  const ayF = clamp(16 * rk, 11, 16.5), azF = 0.8 * ayF
  const tp = 6, hub = 3, fuchiL = 9, xf = -(tp + hub + fuchiL), xend = xf - Lh
  const Ltang = Math.round(0.45 * Lh), spl = 11
  // segmentos: el primero se acorta lo que mide la espiga larga del mango, para que cada pieza quepa en la cama
  const room = o.maxPieza - 8, tangExtra = Ltang - xf + 0.4
  const L0 = Math.min(N, clamp(room - Lt - tangExtra, 40, N))
  const nRest = N - L0 > 1 ? Math.ceil((N - L0) / (room - Lt)) : 0
  const bounds = [0, L0, ...Array.from({ length: nRest }, (_, i) => L0 + ((i + 1) * (N - L0)) / nRest)]
  if (nRest === 0) bounds[bounds.length - 1] = N
  const nseg = bounds.length - 1
  const free = Lh - Ltang - 4 - 17
  const pocket = o.electronica && free >= 40 ? { x0: xf - Ltang - 4, x1: xf - Ltang - 4 - Math.min(72, free), hy: 9, hz: 6.5 } : null
  // la malla debe ser más fina que la holgura que se quiere medir: en resina (0,12 mm) se afina más
  const h = o.quality === 'exportar' ? (fdm ? 0.4 : 0.3) : 0.6
  return {
    N, w0, w1: 0.74 * w0, t0, t1: 0.72 * t0, e0: 1.2 * clamp(rk, 0.8, 1), Rc: (N * N) / (8 * sag), kl: (N * o.kissaki) / 100, qs: 0.62, sag,
    c, rp, h, qc, qhw, Lt, nseg, bounds, joints: bounds.slice(1, -1), halfC: 9, exclJ: 9 + 6,
    Yc, tw0, tt0, Lh, ayF, azF, ayB: 0.9 * ayF, azB: 0.9 * azF, tp, hub, Rt: clamp(37.5 * rk, 24, 40), fuchiL, xf, xend, spl, Ltang,
    xm: xf - 0.55 * Ltang, rm: fdm ? 1.7 : 1.6, pocket,
    dowels: [xf - 8, xf - Lh / 2, xend + 28], wrapPitch: 22, ringPitch: 9, gw: 3, gd: 0.9, capL: 9,
    finPitch: 9, finW: 3.2, finH0: 0.14, fin0: 0.13 * N, fin1: N - (N * o.kissaki) / 100 - 14,
  }
}

// ---------------------------------------------------------------------------------
// Hoja

export type BladeCtx = {
  D: Dims; o: KatanaOpts
  W: (s: number) => number; T: (s: number) => number
  sec: (v: number, z: number, w: number, t: number) => number
  poly: Float32Array | null
  slots: { s: number; half: number }[]
  gwB: number; gdB: number
}

export function bladeCtx(o: KatanaOpts): BladeCtx {
  const D = derive(o), rng = mulberry32(o.seed * 7919 + 13)
  const W = (s: number) => D.w0 + (D.w1 - D.w0) * clamp(s / D.N, 0, 1)
  const T = (s: number) => D.t0 + (D.t1 - D.t0) * clamp(s / D.N, 0, 1)
  const sec = (v: number, z: number, w: number, t: number) => {
    const q = (v + w / 2) / w
    const slope = t / 2 / (D.qs * w), nz = q < D.qs ? 1 / Math.sqrt(1 + slope * slope) : 1
    const zl = Math.max(D.e0 / 2, (t / 2) * Math.min(1, q / D.qs))
    return Math.max((Math.abs(z) - zl) * nz, -(v + w / 2), v - w / 2)
  }
  const near = (s: number, half: number) => D.joints.every((j) => Math.abs(s - j) > D.exclJ + half)
  // ventilas: repartidas, lejos de las uniones
  const slots: { s: number; half: number }[] = []
  if (o.ventilas > 0) {
    const a = 0.16 * D.N, b = D.N - D.kl - 24, n = o.ventilas
    for (let i = 0; i < n; i++) {
      const s = a + ((i + 0.5) * (b - a)) / n, half = 4 + 3.4 * rng() + 2 * (1 - i / n)
      if (near(s, half) && Math.abs(s) > 0) slots.push({ s, half })
    }
  }
  const gwB = clamp(0.065 * D.w0, 1.4, 2), gdB = 0.8
  return { D, o, W, T, sec, poly: hamonPoly(D, o.hamon, rng, W), slots, gwB, gdB }
}

function hamonPoly(D: Dims, kind: Hamon, rng: Rng, W: (s: number) => number): Float32Array | null {
  if (kind === 'ninguno') return null
  const sa = 0.06 * D.N, sb = D.N - D.kl * 0.75
  const pts: number[] = []
  const put = (s: number, q: number) => pts.push(s, (q - 0.5) * W(s))
  if (kind === 'circuito') {
    let s = sa, q = 0.28
    put(s, q)
    for (let guard = 0; guard < 400 && s < sb; guard++) {
      s = Math.min(sb, s + 14 + 26 * rng())
      put(s, q)
      if (s >= sb) break
      const up = q < 0.26 ? true : q > 0.38 ? false : rng() < 0.5
      q = clamp(q + (up ? 1 : -1) * (0.12 + 0.08 * rng()), 0.16, 0.44)
      put(s, q)
    }
  } else {
    const f1 = rng() * 6.28, f2 = rng() * 6.28
    for (let s = sa; s <= sb; s += 1.2) {
      const q = kind === 'notare'
        ? 0.26 + 0.045 * (0.62 * Math.sin((2 * Math.PI * s) / 41 + f1) + 0.38 * Math.sin((2 * Math.PI * s) / 97 + f2))
        : 0.2 + 0.11 * Math.pow(Math.abs(Math.sin((Math.PI * s) / 31 + f1)), 0.85)
      put(s, q)
    }
  }
  return Float32Array.from(pts)
}

// distancia de (s, v) a la polilínea (ordenada por s; los tramos verticales comparten s)
export function distPoly(P: Float32Array, s: number, v: number): number {
  const n = P.length / 2
  let lo = 0, hi = n - 1
  while (lo < hi) { const m = (lo + hi) >> 1; if (P[2 * m] < s) lo = m + 1; else hi = m }
  let best = 1e9
  for (let i = Math.max(0, lo - 3); i < Math.min(n - 1, lo + 3); i++) {
    const ax = P[2 * i], ay = P[2 * i + 1], bx = P[2 * i + 2], by = P[2 * i + 3]
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy
    const t = L2 > 0 ? clamp(((s - ax) * dx + (v - ay) * dy) / L2, 0, 1) : 0
    const d = Math.hypot(s - (ax + t * dx), v - (ay + t * dy))
    if (d < best) best = d
  }
  return best
}

// marco de la hoja: distancia de arco y altura
const frame = (D: Dims, x: number, y: number) => {
  const dy = D.Rc - y
  return { s: D.Rc * Math.atan2(x, dy), v: D.Rc - Math.hypot(x, dy) }
}
const hole = (dx: number, dy: number, r: number) => Math.hypot(dx, dy) - r

// Mitad (z ≥ 0) del segmento k de la hoja, con sus espigas y mortajas.
export function bladeHalf(C: BladeCtx, k: number): (x: number, y: number, z: number) => number {
  const { D, o } = C
  const sa = D.bounds[k], sb = k === D.nseg - 1 ? D.N + 30 : D.bounds[k + 1]
  const hasTenon = k < D.nseg - 1, hasMort = k > 0
  const finOK = (s: number) => o.aletas && s >= D.fin0 && s <= D.fin1 && D.joints.every((j) => Math.abs(s - j) > D.exclJ + D.finW)
  const len = (k === D.nseg - 1 ? D.N : D.bounds[k + 1]) - sa
  const dow = [sa + 0.3 * len, sa + 0.7 * len]
  const xt0 = D.xf - D.Ltang, xt1 = 0.4 // la espiga larga del mango: de la base de la hoja hasta dentro del mango
  return (x, y, z) => {
    const { s, v } = frame(D, x, y)
    const w = C.W(s), t = C.T(s), q = (v + w / 2) / w
    // sección y punta
    let f = Math.max(C.sec(v, z, w, t), s - (D.N - D.kl * Math.pow(clamp(1 - q, 0, 1), 1.7)))
    // aletas del lomo
    if (finOK(s)) {
      const i = Math.round((s - D.fin0) / D.finPitch), ds = s - D.fin0 - i * D.finPitch, fh = D.finH0 * w
      const hh = clamp((v - w / 2) / fh, 0, 1)
      const ff = Math.max(Math.abs(ds) - (D.finW / 2) * (1 - 0.45 * hh), v - (w / 2 + fh), w / 2 - 0.8 - v, Math.abs(z) - 0.4 * t)
      f = Math.min(f, ff)
    }
    // canal del hamon (en las dos caras)
    if (C.poly) {
      const zl = Math.max(D.e0 / 2, (t / 2) * Math.min(1, q / D.qs))
      const g = Math.max(distPoly(C.poly, s, v) - C.gwB / 2, zl - C.gdB - Math.abs(z))
      f = Math.max(f, -g)
    }
    // ventilas pasantes
    for (const sl of C.slots) {
      const vc = 0.3 * w, d = Math.hypot(s - clamp(s, sl.s - sl.half, sl.s + sl.half), v - vc) - 0.045 * w
      if (d < 0) f = Math.max(f, -d)
    }
    // cortes del segmento
    f = Math.max(f, sa - s, s - sb)
    // mortaja (en la base de los segmentos que no son el primero)
    const vct = (D.qc - 0.5) * w, tw = 2 * D.qhw * w, tt = 0.55 * t
    if (hasMort) {
      const cav = Math.max(Math.abs(s - (sa + (D.Lt + 0.6) / 2 - 0.5)) - ((D.Lt + 0.6) / 2 + 0.5), Math.abs(v - vct) - (tw / 2 + D.c), Math.abs(z) - (tt / 2 + D.c))
      f = Math.max(f, -cav)
    }
    // espiga (en el extremo de los que no son el último)
    if (hasTenon) {
      const wb = C.W(sb), tb = C.T(sb), vb = (D.qc - 0.5) * wb
      const ten = Math.max(Math.abs(s - (sb + D.Lt / 2 - 0.25)) - (D.Lt / 2 + 0.25), Math.abs(v - vb) - D.qhw * wb, Math.abs(z) - 0.275 * tb)
      f = Math.min(f, ten)
    }
    // perno pasante de la unión (remache) y clavijas que alinean las dos mitades
    if (hasTenon) f = Math.max(f, -(hole(s - (sb + D.Lt / 2), v - (D.qc - 0.5) * C.W(sb), D.rp)))
    if (hasMort) f = Math.max(f, -(hole(s - (sa + D.Lt / 2), v - vct, D.rp)))
    for (const sd of dow) {
      if (!near(D, sd)) continue
      const cyl = Math.max(hole(s - sd, v - 0.415 * w, D.rp), z - 4, -(z + 1))
      f = Math.max(f, -cyl)
    }
    // espiga larga del mango (en el primero), recta, con el agujero de la clavija
    if (k === 0) {
      const tang = Math.max(Math.abs(x - (xt0 + xt1) / 2) - (xt1 - xt0) / 2, Math.abs(y - D.Yc) - D.tw0 / 2, Math.abs(z) - D.tt0 / 2)
      f = Math.min(f, Math.max(tang, -hole(x - D.xm, y - D.Yc, D.rm - 0.1)))
    }
    return Math.max(f, -z)
  }
}
const near = (D: Dims, s: number) => D.joints.every((j) => Math.abs(s - j) > D.exclJ + 2)

// Mitad de una abrazadera que envuelve la hoja en la estación sc (unión o base).
export function collarHalf(C: BladeCtx, sc: number, halfW: number): (x: number, y: number, z: number) => number {
  const { D } = C
  const w = C.W(sc), t = C.T(sc), ofs = 2.6
  const bolts = [sc - (halfW - 4.5), sc + (halfW - 4.5)]
  const zTop = t / 2 + ofs, vb = (0.86 - 0.5) * w
  return (x, y, z) => {
    const { s, v } = frame(D, x, y)
    const dsec = C.sec(v, z, w, t)
    let f = Math.max(dsec - ofs, D.c - dsec, Math.abs(s - sc) - halfW)
    // tornillos hexagonales sobre la cara plana
    for (const sb of bolts) {
      const a = s - sb, b = v - vb
      const hx = Math.max(Math.abs(a) * 0.866 + Math.abs(b) * 0.5, Math.abs(b)) - 2.2
      f = Math.min(f, Math.max(hx, Math.abs(z - (zTop + 0.2)) - 1.2))
    }
    return Math.max(f, -z)
  }
}

// ---------------------------------------------------------------------------------
// Tsuba, fuchi, mango, kashira, menuki (marco global)

const wrapA = (a: number) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI))

export function tsubaField(D: Dims, o: KatanaOpts): (x: number, y: number, z: number) => number {
  const R = D.Rt, N = o.tsuba === 'engranaje' ? 16 : 0
  const holes = o.tsuba === 'engranaje' ? { n: 6, r: 0.15 * R, at: 0.64 * R } : o.tsuba === 'octogono' ? { n: 8, r: 0.095 * R, at: 0.66 * R } : { n: 5, r: 0.2 * R, at: 0.62 * R }
  const bolts = 6
  const xs = D.tp + D.hub
  return (x, y, z) => {
    const dy = y - D.Yc, r = Math.hypot(dy, z), a = Math.atan2(z, dy)
    let rout = R
    if (o.tsuba === 'engranaje') rout = R + 0.055 * R * clamp(Math.sin(N * a) * 3, -1, 1)
    else if (o.tsuba === 'octogono') {
      const m = Math.PI / 4, aa = (((a % m) + m) % m) - m / 2
      rout = (R * Math.cos(m / 2)) / Math.cos(aa)
    }
    let f = Math.max(r - rout, Math.abs(x + D.tp / 2) - D.tp / 2)
    // cubo del lado del mango
    f = Math.min(f, Math.max(r - 0.3 * R + Math.max(0, -x - D.tp) * 0.4, -xs - x, x))
    // calados
    for (let i = 0; i < holes.n; i++) {
      const ang = (2 * Math.PI * i) / holes.n + Math.PI / holes.n
      const d = Math.hypot(dy - Math.cos(ang) * holes.at, z - Math.sin(ang) * holes.at) - holes.r
      f = Math.max(f, -d)
    }
    // tornillos en la cara del mango
    for (let i = 0; i < bolts; i++) {
      const ang = (2 * Math.PI * i) / bolts
      const d = Math.hypot(dy - Math.cos(ang) * 0.36 * R, z - Math.sin(ang) * 0.36 * R) - 2.2
      f = Math.min(f, Math.max(d, Math.abs(x + D.tp + 0.2) - 1.0))
    }
    // agujero de la espiga
    const slot = Math.max(Math.abs(y - D.Yc) - (D.tw0 / 2 + D.c), Math.abs(z) - (D.tt0 / 2 + D.c))
    return Math.max(f, -slot)
  }
}

const ell = (dy: number, z: number, ay: number, az: number, n: number) => (Math.pow(Math.pow(Math.abs(dy) / ay, n) + Math.pow(Math.abs(z) / az, n), 1 / n) - 1) * Math.min(ay, az)

export function fuchiField(D: Dims): (x: number, y: number, z: number) => number {
  const x1 = -(D.tp + D.hub), x0 = x1 - D.fuchiL
  return (x, y, z) => {
    const dy = y - D.Yc
    let f = Math.max(ell(dy, z, D.ayF + 2.6, D.azF + 2.6, 2.6), x - x1, x0 - x)
    // dos anillos tallados
    const ring = Math.min(Math.abs(x - (x0 + 3)), Math.abs(x - (x0 + 6))) - 0.45
    f = Math.max(f, -Math.max(ring, -0.7 - ell(dy, z, D.ayF + 2.6, D.azF + 2.6, 2.6)))
    const slot = Math.max(Math.abs(y - D.Yc) - (D.tw0 / 2 + D.c), Math.abs(z) - (D.tt0 / 2 + D.c))
    return Math.max(f, -slot)
  }
}

export function tsukaHalf(D: Dims, o: KatanaOpts): (x: number, y: number, z: number) => number {
  const dow = D.dowels
  return (x, y, z) => {
    const dy = y - D.Yc, u = clamp((D.xf - x) / D.Lh, 0, 1)
    const swell = 1 + 0.03 * Math.sin(Math.PI * u)
    const spig = x < D.xend + D.spl
    const ay = (D.ayF + (D.ayB - D.ayF) * u) * swell - (spig ? 3.2 : 0), az = (D.azF + (D.azB - D.azF) * u) * swell - (spig ? 3.2 : 0)
    const fe = ell(dy, z, ay, az, 2.6)
    let f = Math.max(fe, x - D.xf, D.xend - x)
    // el envoltorio: diamantes de «cable» o anillos
    const axial = D.xf - x
    if (!spig && axial > 6 && x - (D.xend + D.spl) > 6) {
      let dg: number
      if (o.mango === 'diamante') {
        const phi = Math.atan2(z / az, dy / ay), tau = (2 * Math.PI * axial) / D.wrapPitch
        dg = Math.min(Math.abs(wrapA(phi - tau)), Math.abs(wrapA(phi + tau))) * ((ay + az) / 2) - (D.gw * 1.15) / 2
      } else {
        const uu = axial / D.ringPitch
        dg = Math.abs(uu - Math.round(uu)) * D.ringPitch - D.gw / 2
      }
      f = Math.max(f, -Math.max(dg, -D.gd - fe))
    }
    // ranura de la espiga, alojamiento de la electrónica, clavija (mekugi) y clavijas de las mitades
    f = Math.max(f, -Math.max(x - D.xf - 1, D.xf - D.Ltang - x, Math.abs(y - D.Yc) - (D.tw0 / 2 + D.c), Math.abs(z) - (D.tt0 / 2 + D.c)))
    if (D.pocket) f = Math.max(f, -Math.max(x - D.pocket.x0, D.pocket.x1 - x, Math.abs(y - D.Yc) - D.pocket.hy, Math.abs(z) - D.pocket.hz))
    f = Math.max(f, -hole(x - D.xm, y - D.Yc, D.rm))
    for (const dx of dow) for (const sgn of [-1, 1]) {
      const d = Math.max(hole(x - dx, y - (D.Yc + sgn * 12), 1.6 + D.c * 0.4), z - 6, -(z + 1))
      f = Math.max(f, -d)
    }
    return Math.max(f, -z)
  }
}

export function kashiraField(D: Dims): (x: number, y: number, z: number) => number {
  const xe = D.xend, ay = D.ayB + 2.6, az = D.azB + 2.6, L = D.capL, xface = xe - 0.8 * L
  return (x, y, z) => {
    const dy = y - D.Yc
    const e = (xe - x) / L // 0 en la boca de la espiga, crece hacia la cara
    const dome = x < xe ? Math.sqrt(Math.max(0.0001, 1 - e * e)) : 1
    let f = Math.max(ell(dy, z, ay * dome, az * dome, 2.6), x - (xe + D.spl), xface - x)
    // cavidad sobre la espiga del mango
    const bore = Math.max(ell(dy, z, D.ayB - 3.2 + D.c, D.azB - 3.2 + D.c, 2.6), x - (xe + D.spl + 0.4), xe - 0.3 - x)
    f = Math.max(f, -bore)
    // en la cara plana (la de la cama): lente del sensor y seis ranuras radiales
    const r = Math.hypot(dy, z), a = Math.atan2(z, dy)
    f = Math.max(f, -Math.max(r - 5, x - (xface + 1.4), xface - 1 - x))
    f = Math.max(f, -Math.max((Math.abs(wrapA(6 * a)) / 6) * r - 0.9, r - 8.4, 6.4 - r, x - (xface + 0.8), xface - 1 - x))
    return f
  }
}

export function menukiField(): (x: number, y: number, z: number) => number {
  // hexágono de 6 mm con una pupila en el centro; en su propio marco (centro en el origen, eje z)
  return (x, y, z) => {
    const hx = Math.max(Math.abs(x) * 0.866 + Math.abs(y) * 0.5, Math.abs(y)) - 6
    const f = Math.max(hx, Math.abs(z - 1.5) - 1.5)
    return Math.max(f, -Math.max(Math.hypot(x, y) - 2.4, 1.4 - z))
  }
}

// ---------------------------------------------------------------------------------
// Malla de un campo en una caja

export function meshOf(fn: (x: number, y: number, z: number) => number, lo: [number, number, number], hi: [number, number, number], h: number): NetMesh {
  const b = makeBox(lo, hi, h, 1)
  region(b, lo, hi, (_c, x, y, z) => fn(x, y, z))
  return nets(b)
}

// Caja global (x, y) que contiene el tramo de hoja [s0, s1] (arco), con margen.
export function bladeBox(D: Dims, s0: number, s1: number, mY: number): { xs: [number, number]; ys: [number, number] } {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  for (let i = 0; i <= 24; i++) {
    const s = s0 + ((s1 - s0) * i) / 24, th = s / D.Rc, x = D.Rc * Math.sin(th), y = D.Rc * (1 - Math.cos(th))
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
  }
  return { xs: [x0 - 4, x1 + 4], ys: [y0 - mY, y1 + mY] }
}
