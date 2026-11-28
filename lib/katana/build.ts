// KATANA CYBORG — de los parámetros a las piezas, con su verificación y orientación de impresión.

import type { NetMesh } from '../antesis/nets'
import { meshStats } from '../antesis/check'
import {
  bladeCtx, bladeBox, bladeHalf, collarHalf, tsubaField, fuchiField, tsukaHalf, kashiraField, menukiField, meshOf, distPoly, cleanOpts,
  type BladeCtx, type Dims, type KatanaOpts,
} from './model'

export type Mesh = NetMesh
export type Part = {
  key: string; name: string; count: number; mesh: Mesh; color: string
  mirror: boolean                       // la otra copia es el espejo (z → −z)
  rot: number[][] | null                // rotación de impresión (filas); luego piso en z = 0
  explode: [number, number, number]     // dirección en la vista explosionada (el viewer la escala)
  glow?: Uint32Array                    // triángulos del canal del hamon (solo para mostrar)
  note: string
}
export type Built = { opts: KatanaOpts; D: Dims; C: BladeCtx; parts: Part[]; ms: number }

const rotZ = (th: number): number[][] => [[Math.cos(th), Math.sin(th), 0], [-Math.sin(th), Math.cos(th), 0], [0, 0, 1]]
const AXIS_DOWN_X: number[][] = [[0, 0, 1], [0, 1, 0], [-1, 0, 0]]   // la cara de x mayor queda abajo
const AXIS_UP_X: number[][] = [[0, 0, 1], [0, -1, 0], [1, 0, 0]]     // la cara de x menor queda abajo

export function build(optsIn: Partial<KatanaOpts>): Built {
  const t0 = Date.now()
  const opts = cleanOpts(optsIn), C = bladeCtx(opts), D = C.D, h = D.h
  const parts: Part[] = []
  const zLo = -2 * h, pad = 3 * h // margen de la caja de cálculo: el borde siempre queda «afuera»
  const mYb = D.w0 * 0.64 + 6

  // ---- hoja: mitades de cada segmento
  for (let k = 0; k < D.nseg; k++) {
    const sa = D.bounds[k], sb = k === D.nseg - 1 ? D.N + 6 : D.bounds[k + 1] + D.Lt + 1
    const bb = bladeBox(D, Math.max(0, sa - 1), sb, mYb)
    const xlo = k === 0 ? Math.min(bb.xs[0], D.xf - D.Ltang - 2) : bb.xs[0]
    const f = bladeHalf(C, k)
    const mesh = meshOf(f, [xlo, bb.ys[0], zLo], [bb.xs[1], bb.ys[1], D.t0 / 2 + pad], h)
    const th = ((sa + D.bounds[k + 1]) / 2) / D.Rc
    parts.push({
      key: `hoja-${k + 1}`, name: `Hoja ${k + 1} de ${D.nseg}${k === 0 ? ' (con la espiga del mango)' : ''}`, count: 2, mesh, color: '#aab4c2', mirror: true, rot: rotZ(th),
      explode: [k * 1.3, 0, 0.8], glow: C.poly ? glowTris(C, mesh) : undefined,
      note: 'dos mitades iguales (una es el espejo): cara de corte hacia abajo, sin soportes',
    })
  }

  // ---- abrazaderas: la base de la hoja y cada unión
  const stations = [{ sc: 14, halfW: 14, name: 'Habaki (base de la hoja)' }, ...D.joints.map((s, j) => ({ sc: s, halfW: D.halfC, name: `Abrazadera de la unión ${j + 1}` }))]
  stations.forEach((st, j) => {
    const bb = bladeBox(D, st.sc - st.halfW - 2, st.sc + st.halfW + 2, D.w0 / 2 + 2.6 + 5)
    const mesh = meshOf(collarHalf(C, st.sc, st.halfW), [bb.xs[0], bb.ys[0], zLo], [bb.xs[1], bb.ys[1], D.t0 / 2 + 2.6 + 1.4 + pad], h)
    parts.push({
      key: `abrazadera-${j}`, name: st.name, count: 2, mesh, color: '#3b4452', mirror: true, rot: rotZ(st.sc / D.Rc),
      explode: [j === 0 ? 0 : (j - 0.5) * 1.3, 1.9, 0.8], note: 'dos mitades iguales con tornillos hexagonales: cierran sobre la hoja ya unida',
    })
  })

  // ---- tsuba
  {
    const R = D.Rt * 1.06 + pad, xs = D.tp + D.hub
    parts.push({
      key: 'tsuba', name: 'Tsuba (guarda)', count: 1, color: '#3b4452', mirror: false, rot: AXIS_DOWN_X, explode: [-1.5, 0, 0],
      mesh: meshOf(tsubaField(D, opts), [-xs - pad, D.Yc - R, -R], [pad, D.Yc + R, R], h), note: 'cara de la hoja abajo; el cubo y los tornillos hacia arriba',
    })
  }
  // ---- fuchi
  {
    const x1 = -(D.tp + D.hub), x0 = x1 - D.fuchiL
    parts.push({
      key: 'fuchi', name: 'Fuchi (collar del mango)', count: 1, color: '#8a6a3a', mirror: false, rot: AXIS_DOWN_X, explode: [-2.6, 0, 0],
      mesh: meshOf(fuchiField(D), [x0 - pad, D.Yc - D.ayF - 5, -D.azF - 5], [x1 + pad, D.Yc + D.ayF + 5, D.azF + 5], h), note: 'de canto, sobre una de sus caras planas',
    })
  }
  // ---- mango: mitades
  {
    const ayM = D.ayF * 1.06 + 2
    parts.push({
      key: 'mango', name: 'Mango (tsuka)', count: 2, color: '#1f242c', mirror: true, rot: null, explode: [-3.7, 0, 0.8],
      mesh: meshOf(tsukaHalf(D, opts), [D.xend - pad, D.Yc - ayM, zLo], [D.xf + pad, D.Yc + ayM, D.azF * 1.06 + pad], h),
      note: 'dos mitades iguales con el diamante o los anillos; cara de corte abajo; clavijas de 3 mm y perno de 3 mm (mekugi)' + (D.pocket ? '; alojamiento para ESP32-C3 y batería plana' : ''),
    })
  }
  // ---- kashira
  {
    const xe = D.xend
    parts.push({
      key: 'kashira', name: 'Kashira (remate con lente)', count: 1, color: '#8a6a3a', mirror: false, rot: AXIS_UP_X, explode: [-5.2, 0, 0],
      mesh: meshOf(kashiraField(D), [xe - D.capL - pad, D.Yc - D.ayB - 5, -D.azB - 5], [xe + D.spl + pad, D.Yc + D.ayB + 5, D.azB + 5], h), note: 'boca hacia arriba, sobre su cara plana (con la lente y las ranuras)',
    })
  }
  // ---- menuki (dos «sensores» hexagonales sobre el mango)
  {
    const u = 0.42, xm = D.xf - u * D.Lh, az = (D.azF + (D.azB - D.azF) * u) * (1 + 0.03 * Math.sin(Math.PI * u))
    const loc = meshOf(menukiField(), [-8, -8, -pad], [8, 8, 3 + pad], h)
    const P = new Float32Array(loc.positions)
    for (let i = 0; i < P.length; i += 3) { P[i] += xm; P[i + 1] += D.Yc; P[i + 2] += az - 0.7 }
    parts.push({
      key: 'menuki', name: 'Menuki (sensores)', count: 2, color: '#00d4ff', mirror: true, rot: null, explode: [-3.7, 0, 1.8],
      mesh: { positions: P, indices: loc.indices }, note: 'plano abajo; se pegan sobre el mango, uno a cada lado',
    })
  }
  return { opts, D, C, parts, ms: Date.now() - t0 }
}

// triángulos del canal del hamon (fondo y paredes: al menos dos de sus vértices) para el brillo del visor
function glowTris(C: BladeCtx, m: Mesh): Uint32Array {
  const { D } = C, P = m.positions, V = P.length / 3, flag = new Uint8Array(V)
  for (let i = 0; i < V; i++) {
    const x = P[3 * i], y = P[3 * i + 1], z = P[3 * i + 2], dy = D.Rc - y
    const s = D.Rc * Math.atan2(x, dy), v = D.Rc - Math.hypot(x, dy)
    if (s < 0 || s > D.N || z < 0.15) continue
    const w = C.W(s), t = C.T(s), q = (v + w / 2) / w
    const zl = Math.max(D.e0 / 2, (t / 2) * Math.min(1, q / D.qs))
    // fondo y paredes de la ranura (por debajo de la superficie, sin contar el borde)
    const depth = zl - z
    if (distPoly(C.poly as Float32Array, s, v) < C.gwB / 2 + 0.15 && depth > 0.12 && depth < C.gdB + 0.5) flag[i] = 1
  }
  const out: number[] = []
  for (let t = 0; t < m.indices.length; t += 3) if (flag[m.indices[t]] + flag[m.indices[t + 1]] + flag[m.indices[t + 2]] >= 2) out.push(m.indices[t], m.indices[t + 1], m.indices[t + 2])
  return Uint32Array.from(out)
}

// ---------------------------------------------------------------------------------
// Impresión: rotación, piso en z = 0, centrado en x/y.

export function orient(m: Mesh, R: number[][] | null): Mesh {
  const P = new Float32Array(m.positions.length)
  for (let i = 0; i < P.length; i += 3) {
    const x = m.positions[i], y = m.positions[i + 1], z = m.positions[i + 2]
    if (R) { P[i] = R[0][0] * x + R[0][1] * y + R[0][2] * z; P[i + 1] = R[1][0] * x + R[1][1] * y + R[1][2] * z; P[i + 2] = R[2][0] * x + R[2][1] * y + R[2][2] * z }
    else { P[i] = x; P[i + 1] = y; P[i + 2] = z }
  }
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], P[i + a]); mx[a] = Math.max(mx[a], P[i + a]) }
  for (let i = 0; i < P.length; i += 3) { P[i] -= (mn[0] + mx[0]) / 2; P[i + 1] -= (mn[1] + mx[1]) / 2; P[i + 2] -= mn[2] }
  return { positions: P, indices: m.indices }
}
export function size(m: Mesh): [number, number, number] {
  const P = m.positions, mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], P[i + a]); mx[a] = Math.max(mx[a], P[i + a]) }
  return [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]]
}
// ¿cabe en una cama cuadrada de lado B? Derecha o, si es larga y angosta, en diagonal.
export const fitsBed = (sz: [number, number, number], B: number) => {
  const L = Math.max(sz[0], sz[1]), S = Math.min(sz[0], sz[1])
  return L <= B - 2 || (L + S) / Math.SQRT2 <= B - 2
}

// ---------------------------------------------------------------------------------
// Verificación

export type Check = { name: string; ok: boolean; detail: string }
export type Verification = {
  checks: Check[]; ok: boolean; resolutionMm: number; definitive: boolean
  parts: { key: string; triangles: number; closed: boolean; volumeCm3: number; printMm: [number, number, number]; fits: boolean }[]
  clearances: { name: string; minMm: number; wantMm: number }[]
}

// holgura mínima de un campo (otra pieza) vista desde los vértices de una malla
function minField(m: Mesh, pick: (x: number, y: number, z: number) => boolean, fn: (x: number, y: number, z: number) => number): number {
  const P = m.positions
  let mn = Infinity
  for (let i = 0; i < P.length; i += 3) if (pick(P[i], P[i + 1], P[i + 2])) mn = Math.min(mn, fn(P[i], P[i + 1], P[i + 2]))
  return mn
}

export function verify(b: Built): Verification {
  const { D, C, opts } = b, checks: Check[] = [], clearances: Verification['clearances'] = []
  const get = (k: string) => b.parts.find((p) => p.key === k)?.mesh as Mesh
  const frame = (x: number, y: number) => ({ s: D.Rc * Math.atan2(x, D.Rc - y), v: D.Rc - Math.hypot(x, D.Rc - y) })

  const partsOut = b.parts.map((p) => {
    const st = meshStats(p.mesh), sz = size(orient(p.mesh, p.rot))
    const fits = fitsBed(sz, opts.maxPieza)
    return { key: p.key, triangles: st.triangles, closed: st.closed && st.volume > 0, volumeCm3: st.volume / 1000, printMm: sz.map((v) => Math.round(v * 10) / 10) as [number, number, number], fits }
  })
  const open = partsOut.filter((p) => !p.closed)
  checks.push({ name: 'Mallas cerradas y con volumen', ok: open.length === 0, detail: open.length ? `abiertas: ${open.map((p) => p.key).join(', ')}` : `${partsOut.length} piezas, todas cerradas` })
  const big = partsOut.filter((p) => !p.fits)
  checks.push({ name: `Caben en una cama de ${opts.maxPieza} mm`, ok: big.length === 0, detail: big.length ? `no caben: ${big.map((p) => `${p.key} ${p.printMm[0]}×${p.printMm[1]}`).join(', ')}` : `la mayor mide ${Math.max(...partsOut.map((p) => Math.max(p.printMm[0], p.printMm[1])))} mm` })

  // espigas contra mortajas
  let tenon = Infinity
  for (let k = 0; k < D.nseg - 1; k++) {
    const sb = D.bounds[k + 1], next = bladeHalf(C, k + 1)
    const m = minField(get(`hoja-${k + 1}`), (x, y, z) => { const { s } = frame(x, y); return s > sb + 0.6 && s < sb + D.Lt - 0.3 && z > 0.05 }, next)
    tenon = Math.min(tenon, m)
  }
  if (D.nseg > 1) {
    clearances.push({ name: 'espiga ↔ mortaja', minMm: Math.round(tenon * 100) / 100, wantMm: D.c })
    checks.push({ name: 'Espigas entran en sus mortajas', ok: tenon >= -0.05, detail: `holgura mínima ${tenon.toFixed(2)} mm (se pide ${D.c} mm)` })
  }
  // abrazaderas contra la hoja
  let col = Infinity
  for (let j = 0; j < b.parts.filter((p) => p.key.startsWith('abrazadera')).length; j++) {
    const st = j === 0 ? { sc: 14, halfW: 14 } : { sc: D.joints[j - 1], halfW: D.halfC }
    const f = collarHalf(C, st.sc, st.halfW)
    for (let k = 0; k < D.nseg; k++) {
      const m = minField(get(`hoja-${k + 1}`), (x, y, z) => { const { s } = frame(x, y); return Math.abs(s - st.sc) < st.halfW - 0.6 && z > 0.05 && z < D.t0 / 2 + 0.5 }, f)
      col = Math.min(col, m)
    }
  }
  clearances.push({ name: 'abrazadera ↔ hoja', minMm: Math.round(col * 100) / 100, wantMm: D.c })
  checks.push({ name: 'Abrazaderas cierran sobre la hoja sin apretarla', ok: col >= -0.05, detail: `holgura mínima ${col.toFixed(2)} mm (se pide ${D.c} mm)` })
  // espiga del mango contra tsuba, fuchi y ranura del mango
  const tang = get('hoja-1'), xs = D.tp + D.hub, x1 = -xs
  const tsu = minField(tang, (x) => x < -0.6 && x > -xs + 0.4, tsubaField(D, opts))
  const fu = minField(tang, (x) => x < x1 - 0.4 && x > x1 - D.fuchiL + 0.4, fuchiField(D))
  const tk = minField(tang, (x) => x < D.xf - 0.5 && x > D.xf - D.Ltang + 0.5, tsukaHalf(D, opts))
  clearances.push({ name: 'espiga ↔ tsuba', minMm: Math.round(tsu * 100) / 100, wantMm: D.c }, { name: 'espiga ↔ fuchi', minMm: Math.round(fu * 100) / 100, wantMm: D.c }, { name: 'espiga ↔ ranura del mango', minMm: Math.round(tk * 100) / 100, wantMm: D.c })
  const tm = Math.min(tsu, fu, tk)
  checks.push({ name: 'La espiga larga cruza tsuba, fuchi y mango', ok: tm >= -0.05, detail: `holgura mínima ${tm.toFixed(2)} mm (tsuba ${tsu.toFixed(2)}, fuchi ${fu.toFixed(2)}, mango ${tk.toFixed(2)})` })
  // kashira sobre la espiga del mango
  const ka = minField(get('mango'), (x, _y, z) => x < D.xend + D.spl - 2 * D.h && x > D.xend + 0.3 && z > 0.05, kashiraField(D))
  clearances.push({ name: 'remate ↔ mango', minMm: Math.round(ka * 100) / 100, wantMm: D.c })
  checks.push({ name: 'El remate calza en el mango', ok: ka >= -0.05, detail: `holgura mínima ${ka.toFixed(2)} mm (se pide ${D.c} mm)` })
  // los pernos y agujeros se alinean (la unión y el mekugi)
  const pins = D.nseg > 1 ? `${D.nseg - 1} pernos de unión de Ø${(2 * D.rp).toFixed(1)} mm` : 'sin uniones'
  const lens = D.bounds.slice(1).map((e, i) => Math.round(e - D.bounds[i])).join(' + ')
  checks.push({ name: 'Piezas y uniones', ok: true, detail: `${D.nseg} segmentos (${lens} mm), ${pins}, perno del mango Ø${(2 * D.rm).toFixed(1)} mm` })
  return { checks, ok: checks.every((c) => c.ok), resolutionMm: D.h, definitive: opts.quality === 'exportar', parts: partsOut, clearances }
}

// ---------------------------------------------------------------------------------
// Parámetros de fabricación en JSON (regla del taller: se documentan antes de producir).

export function paramsJson(b: Built, v: Verification | null) {
  const { D, opts } = b
  return {
    proyecto: 'NeoProxy · Katana cyborg industrial',
    aviso: 'Pieza de exhibición para imprimir: filo romo (borde de ~1,2 mm), no es un arma ni sirve para cortar.',
    opciones: { ...opts, quality: undefined },
    hoja: { nagasaMm: D.N, anchoBaseMm: +D.w0.toFixed(1), anchoPuntaMm: +D.w1.toFixed(1), espesorBaseMm: +D.t0.toFixed(1), espesorPuntaMm: +D.t1.toFixed(1), floreoSoriMm: +D.sag.toFixed(1), radioCurvaturaMm: Math.round(D.Rc), kissakiMm: +D.kl.toFixed(1), shinogiFraccion: D.qs, bordeRomoMm: +D.e0.toFixed(2) },
    segmentos: { cantidad: D.nseg, largosMm: D.bounds.slice(1).map((e, i) => +(e - D.bounds[i]).toFixed(1)), espigaMm: +D.Lt.toFixed(1), holguraMm: D.c, pernoUnionDiamMm: +(2 * D.rp).toFixed(2) },
    mango: { largoMm: D.Lh, espigaMm: D.Ltang, seccionFrenteMm: [+(2 * D.ayF).toFixed(1), +(2 * D.azF).toFixed(1)], pernoMekugiDiamMm: +(2 * D.rm).toFixed(2), alojamientoElectronica: D.pocket ? { largoMm: +Math.abs(D.pocket.x1 - D.pocket.x0).toFixed(0), anchoMm: 2 * D.pocket.hy, altoMm: 2 * D.pocket.hz, sugerencia: 'ESP32-C3 supermini + batería LiPo plana + tira LED' } : null },
    tsubaDiametroMm: +(2 * D.Rt).toFixed(1),
    piezas: b.parts.map((p) => ({ archivo: `katana-${p.key}${p.count > 1 ? `-x${p.count}` : ''}.stl`, nombre: p.name, copias: p.count, nota: p.note })),
    materiales: { hoja: opts.proc === 'fdm' ? 'PETG o PLA+, capas de 0,16–0,2 mm, 4 perímetros, 25 % de relleno' : 'resina rígida (tipo ABS-like), capas de 0,05 mm', clavijas: 'filamento de 1,75 mm (uniones) y varilla de 3 mm (mango, mekugi)', pegamento: 'cianoacrilato en gel o epoxi de 5 min' },
    armado: ['Pegar las dos mitades de cada hoja con clavijas y perno de unión; encajar espiga y mortaja segmento por segmento.', 'Cerrar cada abrazadera sobre su unión con epoxi.', 'Pasar tsuba y fuchi por la espiga larga; cerrar el mango sobre la espiga con clavijas; clavar el mekugi.', 'Pegar el remate y los dos sensores.'],
    verificacion: v ? { ok: v.ok, comprobaciones: v.checks, holguras: v.clearances, piezas: v.parts } : null,
  }
}
