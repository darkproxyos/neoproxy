// NPX-02 VÉRTICE — de los parámetros a las piezas: malla nítida, simplificada, con su orientación
// de impresión, su verificación de encajes y los parámetros de fabricación en JSON.

import { dcMesh, type Fn3 } from '../dc'
import { simplify } from '../qem'
import { meshStats } from '../../antesis/check'
import { mirrorZ, translate, orient, size, fitsBed, minField, tube, RX180, AXIS_UP_X, type Mesh, type Rot } from '../mesh'
import {
  cleanOpts, derive, coreField, edgeField, plateField, guardField, guardGeom, gripField, pommelField, dialField, hosePath, Ah, Dt, SQ2,
  type Dims, type VerticeOpts, type Side,
} from './model'

export type Role = 'nucleo' | 'filo' | 'blindaje' | 'guarda' | 'dial' | 'mango' | 'pomo' | 'manguera' | 'varilla'
export type Meta = {
  key: string; name: string; group: Role; side: Side | null
  rot: Rot                       // rotación de impresión
  explode: [number, number, number]
  print: { file: string; count: number } | null
  note: string
}
export type Part = Meta & {
  mesh: Mesh                     // simplificada (la que se ve y se exporta)
  raw: Mesh | null               // la del dual contouring, sin simplificar (para medir holguras)
  field: Fn3 | null              // campo en coordenadas del mundo (para medir holguras desde otras piezas)
  glow?: Uint8Array              // triángulos del canal de la fibra
}
// Cada pieza: sus datos (baratos), su campo (barato de crear) y su malla (lo caro).
export type Spec = Meta & { field: () => Fn3 | null; build: () => { mesh: Mesh; raw: Mesh | null; glow?: Uint8Array }; cost: number }

const flipZ = (f: Fn3): Fn3 => (x, y, z) => f(x, y, -z)

export function specs(optsIn: Partial<VerticeOpts>): { D: Dims; list: Spec[] } {
  const o = cleanOpts(optsIn), D = derive(o), h = D.h, pad = 3 * h
  const exp = o.quality === 'exportar', tol = exp ? 0.02 : 0.05
  const labels = exp
  const list: Spec[] = []
  const halfMesh = (f: Fn3, x0: number, y0: number, x1: number, y1: number, zTop: number, z0 = 0) =>
    dcMesh(f, [x0 - pad, y0 - pad, z0 - 2.5 * h], [x1 + pad, y1 + pad, zTop + pad], h)
  const fin = (raw: Mesh, side: Side | null) => {
    const s = simplify(raw, tol)
    return side === 'B' ? { mesh: mirrorZ(s), raw: mirrorZ(raw) } : { mesh: s, raw }
  }
  const name = (s: string) => `vertice-${s}.stl`
  const yTopBlade = D.ySp0 + (o.punta === 'espolon' ? 0.13 * D.W : 0) + 1
  const world = (fu: Fn3, side: Side | null) => (side === 'B' ? flipZ(fu) : fu)

  // ---- núcleo: láminas A y B
  for (const side of ['A', 'B'] as Side[]) {
    const b = side === 'A' ? D.bA : D.bB, sgn = side === 'A' ? 1 : -1
    for (let k = 0; k < D.n; k++) {
      const key = `nucleo-${side}${k + 1}`
      const x0 = k === 0 ? D.xT0 - 1 : b[k] - 4, x1 = k === D.n - 1 ? D.Lc + 1 : b[k + 1] + D.Dd + 1
      list.push({
        key, name: `Núcleo ${side}${k + 1}${k === 0 ? ' (con la espiga)' : k === D.n - 1 ? ' (punta)' : ''}`, group: 'nucleo', side,
        rot: side === 'A' ? null : RX180, explode: [0.12 * k, 0, 0.9 * sgn], print: { file: name(key), count: 1 },
        note: `lámina ${side}, cara de corte sobre la cama${k < D.n - 1 ? '; cola de milano adelante' : ''}${k > 0 ? '; mortaja atrás' : ''}${k === 0 ? '; la espiga entra a la guarda y al mango' : ''}`,
        cost: (x1 - x0) * 3,
        field: () => world(coreField(D, side, k, labels), side),
        build: () => {
          const r = fin(halfMesh(coreField(D, side, k, labels), x0, D.yR - 1, x1, yTopBlade, D.Th), side)
          return { ...r, glow: o.fibra ? fiberTris(D, r.mesh, sgn) : undefined }
        },
      })
    }
  }
  // ---- filo
  for (const side of ['A', 'B'] as Side[]) {
    const cuts = side === 'A' ? D.cutsA : D.cutsB
    for (let j = 0; j <= cuts.length; j++) {
      const key = `filo-${side}${j + 1}`
      const x0 = j === 0 ? D.Bk[0] - 2 : cuts[j - 1] - 4, x1 = j === cuts.length ? D.L + 1 : cuts[j] + 0.7 * D.bandE + 4
      list.push({
        key, name: `Filo ${side}${j + 1}${j === cuts.length ? ' (punta)' : ''}`, group: 'filo', side,
        rot: side === 'A' ? null : RX180, explode: [0.12 * j, -0.9, side === 'A' ? 0.9 : -0.9], print: { file: name(key), count: 1 },
        note: 'bisel hacia arriba, cara de corte sobre la cama; entra al núcleo con colas de milano', cost: (x1 - x0) * 1.6,
        field: () => world(edgeField(D, side, j, labels), side),
        build: () => {
          let y1 = -1e9
          for (let x = x0; x <= x1; x += 4) y1 = Math.max(y1, D.yJ(x) + 6.5)
          if (j === cuts.length) y1 = Math.max(y1, yTopBlade)
          return fin(halfMesh(edgeField(D, side, j, labels), x0, Math.min(D.yEd0, D.yEd1) - 1, x1, y1, D.Th), side)
        },
      })
    }
  }
  // ---- blindajes
  for (const p of D.plates) for (const side of ['A', 'B'] as Side[]) {
    const key = `${p.key}-${side}`
    list.push({
      key, name: p.hilt ? `Placa de matrícula (${side})` : `Blindaje ${p.key.split('-')[1]} (${side})`, group: 'blindaje', side,
      rot: side === 'A' ? null : RX180, explode: [0, 0.25, side === 'A' ? 2.0 : -2.0], print: { file: name(key), count: 1 },
      note: p.hilt ? 'cara plana sobre la cama; lleva la matrícula grabada' : 'cara plana sobre la cama; tapa y ata las uniones de las dos láminas con clavijas',
      cost: (p.x1 - p.x0) * 1.2,
      field: () => world(plateField(D, p, side, labels), side),
      build: () => fin(dcMesh(plateField(D, p, side, labels), [p.poly.bx0 - pad, p.poly.by0 - pad, D.Th - 2.5 * h], [p.poly.bx1 + pad, p.poly.by1 + pad, D.Th + Ah + 0.8 + pad], h), side),
    })
  }
  // ---- guarda (las dos mitades son espejo exacto)
  const G = guardGeom(D)
  for (const side of ['A', 'B'] as Side[]) {
    const key = `guarda-${side}`
    list.push({
      key, name: `Guarda, mitad ${side}`, group: 'guarda', side, rot: side === 'A' ? null : RX180,
      explode: [-0.5, 0, side === 'A' ? 0.75 : -0.75], print: { file: name(key), count: 1 },
      note: o.fibra ? 'cara de corte sobre la cama; adentro, el compartimento de la pila y el LED bajo el dial' : 'cara de corte sobre la cama',
      cost: 250, field: () => world(guardField(D), side),
      build: () => fin(halfMesh(guardField(D), -D.Gt, Math.min(G.outline.by0, G.yBot), G.outline.bx1, Math.max(G.outline.by1, G.yTop), D.Gz + 1.2), side),
    })
  }
  // ---- dial (el mismo archivo, dos veces)
  for (const side of ['A', 'B'] as Side[]) {
    const key = `dial-${side}`
    const place = (m: Mesh) => { const t = translate(m, G.dial[0], G.dial[1], D.Gz - 2); return side === 'A' ? t : mirrorZ(t) }
    list.push({
      key, name: 'Dial del reactor', group: 'dial', side, rot: null, explode: [-0.5, 0, side === 'A' ? 2.3 : -2.3],
      print: side === 'A' ? { file: name('dial'), count: 2 } : null,
      note: 'plano sobre la cama; en material translúcido brilla con el LED. Va a presión: se saca para cambiar la pila', cost: 40,
      field: () => { const f0 = dialField(); return world((x, y, z) => f0(x - G.dial[0], y - G.dial[1], z - (D.Gz - 2)), side) },
      build: () => { const raw = dcMesh(dialField(), [-15 - pad, -15 - pad, -2.5 * h], [15 + pad, 15 + pad, Dt + pad], h); return { mesh: place(simplify(raw, tol)), raw: place(raw) } },
    })
  }
  // ---- mango
  for (const side of ['A', 'B'] as Side[]) {
    const key = `mango-${side}`
    list.push({
      key, name: `Mango, mitad ${side}`, group: 'mango', side, rot: side === 'A' ? null : RX180, explode: [-1.3, 0, side === 'A' ? 0.75 : -0.75],
      print: { file: name(key), count: 1 }, note: 'cara de corte sobre la cama; encierra la espiga y la varilla', cost: 600,
      field: () => world(gripField(D), side),
      build: () => fin(halfMesh(gripField(D), D.xEnd - D.Lsp - 1, -D.Gy - 1.4, D.xGf + 1, D.Gy + 1.4, D.Gzz + 1.4), side),
    })
  }
  // ---- pomo
  list.push({
    key: 'pomo', name: 'Pomo', group: 'pomo', side: null, rot: AXIS_UP_X, explode: [-2.4, 0, 0], print: { file: name('pomo'), count: 1 },
    note: 'de pie, la cara de atrás sobre la cama; recibe la punta del mango, la varilla y la manguera', cost: 300,
    field: () => pommelField(D),
    build: () => {
      const yc = 5.5, hy = D.Gy + 10.5, hz = D.Gzz + 5
      const raw = dcMesh(pommelField(D), [D.x0P - pad, yc - hy - pad, -hz - pad], [D.xP + pad, Math.max(yc + hy, D.Gy + 15) + pad, hz + pad], h)
      return { mesh: simplify(raw, tol), raw }
    },
  })
  // ---- varilla (no se imprime)
  list.push({
    key: 'varilla', name: 'Varilla de 4 mm (no se imprime)', group: 'varilla', side: null, rot: null, explode: [0.4, 0, 0], print: null,
    note: 'varilla de carbono o acero de 4 mm', cost: 5, field: () => null,
    build: () => ({ mesh: tube([[D.xRod0, D.yRod, 0], [D.xRod1, D.yRod, 0]], 2, 12), raw: null }),
  })
  // ---- manguera (no se imprime)
  list.push({
    key: 'manguera', name: 'Manguera (tubo de 6 mm, no se imprime)', group: 'manguera', side: null, rot: null, explode: [-1.3, 1.1, 0], print: null,
    note: 'tubo de PVC o silicona de 6 mm de diámetro exterior', cost: 5, field: () => null,
    build: () => ({ mesh: tube(hosePath(D).map(([x, y]) => [x, y, 0] as [number, number, number]), 3, 14), raw: null }),
  })
  return { D, list }
}

// triángulos del canal de la fibra (fondo y paredes) para el brillo de la vista
function fiberTris(D: Dims, m: Mesh, sgn: number): Uint8Array {
  const P = m.positions, V = P.length / 3, flag = new Uint8Array(V), fb = D.fiber
  if (!fb) return new Uint8Array(m.indices.length / 3)
  for (let i = 0; i < V; i++) {
    const x = P[3 * i], y = P[3 * i + 1], z = P[3 * i + 2] * sgn
    const d = Math.min(fb.d(x, y, 4), Math.hypot(x - D.fiberEnd[0], y - D.fiberEnd[1]) - 2.8 + D.wf / 2)
    if (d < D.wf / 2 + 0.05 && z < D.Th - 0.12 && z > D.Th - D.df - 0.1) flag[i] = 1
  }
  const I = m.indices, out = new Uint8Array(I.length / 3)
  for (let t = 0; t < out.length; t++) if (flag[I[3 * t]] + flag[I[3 * t + 1]] + flag[I[3 * t + 2]] >= 2) out[t] = 1
  return out
}

export type Built = { opts: VerticeOpts; D: Dims; parts: Part[]; ms: number }
const metaOf = (s: Spec): Meta => ({ key: s.key, name: s.name, group: s.group, side: s.side, rot: s.rot, explode: s.explode, print: s.print, note: s.note })
export const makePart = (s: Spec): Part => ({ ...metaOf(s), ...s.build(), field: s.field() })
export function build(optsIn: Partial<VerticeOpts>): Built {
  const t0 = Date.now(), { D, list } = specs(optsIn)
  return { opts: D.o, D, parts: list.map(makePart), ms: Date.now() - t0 }
}
// Para verificar en otro hilo: las mallas llegan hechas y los campos se vuelven a crear (son baratos).
export function rebuild(optsIn: Partial<VerticeOpts>, meshes: Record<string, { mesh: Mesh; raw: Mesh | null }>): Built {
  const { D, list } = specs(optsIn)
  // al exportar solo llegan las piezas que se imprimen (el segundo dial, la varilla y la manguera no)
  const parts = list.filter((s) => meshes[s.key]).map((s) => { const m = meshes[s.key]; return { ...metaOf(s), mesh: m.mesh, raw: m.raw, field: s.field() } })
  return { opts: D.o, D, parts, ms: 0 }
}

// ---------------------------------------------------------------------------------
// Verificación

export type Check = { name: string; ok: boolean; detail: string }
export type Verification = {
  checks: Check[]; ok: boolean; resolutionMm: number; definitive: boolean
  parts: { key: string; triangles: number; closed: boolean; volumeCm3: number; printMm: [number, number, number]; fits: boolean }[]
  clearances: { name: string; minMm: number; wantMm: number }[]
}

const r2 = (v: number) => Math.round(v * 100) / 100

export function verify(b: Built): Verification {
  const { D, opts } = b, c = D.c, checks: Check[] = [], clearances: Verification['clearances'] = []
  const get = (k: string) => b.parts.find((p) => p.key === k) as Part
  const printed = b.parts.filter((p) => p.print)
  const partsOut = printed.map((p) => {
    const st = meshStats(p.mesh), sz = size(orient(p.mesh, p.rot))
    return { key: p.key, triangles: st.triangles, closed: st.closed && st.volume > 0, volumeCm3: st.volume / 1000, printMm: sz.map((v) => Math.round(v * 10) / 10) as [number, number, number], fits: fitsBed(sz, opts.maxPieza) }
  })
  const open = partsOut.filter((p) => !p.closed)
  checks.push({ name: 'Mallas cerradas y con volumen', ok: open.length === 0, detail: open.length ? `abiertas: ${open.map((p) => p.key).join(', ')}` : `${partsOut.length} piezas distintas, todas cerradas` })
  const big = partsOut.filter((p) => !p.fits)
  checks.push({ name: `Caben en una cama de ${opts.maxPieza} mm`, ok: big.length === 0, detail: big.length ? `no caben: ${big.map((p) => `${p.key} ${p.printMm[0]}×${p.printMm[1]}`).join(', ')}` : `la mayor mide ${Math.max(...partsOut.map((p) => Math.max(p.printMm[0], p.printMm[1])))} mm` })

  const clear = (label: string, v: number, want: number, contact = false) => {
    clearances.push({ name: label, minMm: r2(v), wantMm: contact ? 0 : want })
    return v
  }
  // margen por la malla: los vértices del dual contouring quedan a menos de ~0,18 celdas de la superficie
  const tol = Math.round(0.18 * D.h * 100) / 100, mg = ` · margen de malla ±${tol.toFixed(2)}`
  const okGap = (v: number) => v >= c - tol
  const side = (s: Side) => s === 'A' ? 1 : -1

  // colas de milano del núcleo
  let dv = Infinity
  for (const s of ['A', 'B'] as Side[]) {
    const bb = s === 'A' ? D.bA : D.bB
    for (let k = 0; k < D.n - 1; k++) {
      const tab = get(`nucleo-${s}${k + 1}`).raw as Mesh, nxt = get(`nucleo-${s}${k + 2}`).field as Fn3, j = bb[k + 1]
      dv = Math.min(dv, minField(tab, (x, _y, z) => x > j + 0.3 && x < j + D.Dd + 0.3 && Math.abs(z) > 0.05 && Math.abs(z) < D.Th - 0.05, nxt))
    }
  }
  if (D.n > 1) {
    clear('cola de milano ↔ mortaja (núcleo)', dv, c)
    checks.push({ name: 'Las colas de milano del núcleo entran en sus mortajas', ok: okGap(dv), detail: `holgura mínima ${dv.toFixed(2)} mm (se pide ${c} mm${mg}), ${2 * (D.n - 1)} uniones` })
  }
  // filo contra núcleo (misma lámina) y cortes del filo
  let fe = Infinity, fc = Infinity
  for (const s of ['A', 'B'] as Side[]) {
    const cores = b.parts.filter((p) => p.group === 'nucleo' && p.side === s)
    const edges = b.parts.filter((p) => p.group === 'filo' && p.side === s)
    for (const ep of edges) {
      fe = Math.min(fe, minField(ep.raw as Mesh, (x, y, z) => Math.abs(y - D.yJ(x)) < 7 && Math.abs(z) > 0.05 && x < D.T[0] - 4, (x, y, z) => Math.min(...cores.map((cp) => (cp.field as Fn3)(x, y, z)))))
    }
    for (let j = 0; j < edges.length - 1; j++) {
      const cuts = s === 'A' ? D.cutsA : D.cutsB, xc = cuts[j]
      fc = Math.min(fc, minField(edges[j].raw as Mesh, (x, _y, z) => x > xc - 3 && Math.abs(z) > 0.05, edges[j + 1].field as Fn3))
    }
  }
  clear('filo ↔ núcleo', fe, c); if (D.ne > 1) clear('corte del filo', fc, c)
  checks.push({ name: 'El filo calza en el núcleo (unión y colas)', ok: okGap(fe) && (D.ne < 2 || okGap(fc)), detail: `holgura mínima ${fe.toFixed(2)} mm contra el núcleo${D.ne > 1 ? `, ${fc.toFixed(2)} mm en los cortes` : ''} (se pide ${c} mm${mg})` })
  // blindajes apoyados sin meterse en el núcleo ni el filo
  let pl = Infinity
  for (const p of b.parts.filter((q) => q.group === 'blindaje')) {
    const sg = side(p.side as Side), under = b.parts.filter((q) => (q.group === 'nucleo' || q.group === 'filo') && q.side === p.side)
    pl = Math.min(pl, minField(p.raw as Mesh, (_x, _y, z) => z * sg < D.Th + 0.4, (x, y, z) => Math.min(...under.map((q) => (q.field as Fn3)(x, y, z)))))
  }
  clear('blindaje ↔ núcleo (apoyo)', pl, 0, true)
  checks.push({ name: 'Los blindajes apoyan sobre el núcleo sin meterse', ok: pl >= -tol, detail: `penetración máxima ${Math.max(0, -pl).toFixed(2)} mm (contacto plano${mg})` })
  // espiga contra guarda y mango
  let tg = Infinity, tk = Infinity
  for (const s of ['A', 'B'] as Side[]) {
    const tang = get(`nucleo-${s}1`).raw as Mesh
    tg = Math.min(tg, minField(tang, (x, _y, z) => x < -0.3 && x > -D.Gt + 0.3 && Math.abs(z) > 0.05, get(`guarda-${s}`).field as Fn3))
    tk = Math.min(tk, minField(tang, (x, _y, z) => x < D.xGf - 0.3 && Math.abs(z) > 0.05, get(`mango-${s}`).field as Fn3))
  }
  clear('espiga ↔ guarda', tg, c); clear('espiga ↔ mango', tk, c)
  checks.push({ name: 'La espiga cruza la guarda y entra al mango', ok: okGap(tg) && okGap(tk), detail: `holgura mínima ${Math.min(tg, tk).toFixed(2)} mm (guarda ${tg.toFixed(2)}, mango ${tk.toFixed(2)})` })
  // mango contra pomo y guarda
  let gp = Infinity, gg = Infinity
  for (const s of ['A', 'B'] as Side[]) {
    const grip = get(`mango-${s}`).raw as Mesh
    gp = Math.min(gp, minField(grip, (x) => x < D.xEnd + 0.5, get('pomo').field as Fn3))
    gg = Math.min(gg, minField(grip, (x) => x > D.xGf - 1, get(`guarda-${s}`).field as Fn3))
  }
  clear('mango ↔ pomo', gp, c); clear('mango ↔ guarda', gg, c)
  checks.push({ name: 'El mango calza en el pomo y topa con la guarda', ok: okGap(gp) && okGap(gg), detail: `holgura mínima ${gp.toFixed(2)} mm en el pomo, ${gg.toFixed(2)} mm contra la guarda` })
  // dial en su asiento
  const dl = minField(get('dial-A').raw as Mesh, (_x, _y, z) => z > D.Gz - 2 + 0.3, get('guarda-A').field as Fn3)
  const dlf = minField(get('dial-A').raw as Mesh, () => true, get('guarda-A').field as Fn3)
  clear('dial ↔ asiento', dl, c)
  checks.push({ name: 'El dial entra en su asiento de la guarda', ok: okGap(dl) && dlf >= -tol, detail: `holgura lateral ${dl.toFixed(2)} mm; apoya en el fondo (${Math.max(0, -dlf).toFixed(2)} mm de roce)` })
  // la varilla pasa libre por todos sus canales
  const thru = b.parts.filter((p) => p.field && (p.group === 'nucleo' || p.group === 'mango' || p.group === 'pomo' || p.group === 'guarda'))
  let rod = Infinity
  for (let x = D.xRod0 + 0.6; x <= D.xRod1 - 0.6; x += 1.6) for (let a = 0; a < 12; a++) {
    const th = (2 * Math.PI * a) / 12, y = D.yRod + 2 * Math.cos(th), z = 2 * Math.sin(th)
    for (const p of thru) { const v = (p.field as Fn3)(x, y, z); if (v < rod) rod = v }
  }
  clear('varilla ↔ canales', rod, D.rr - 2)
  checks.push({ name: 'La varilla de 4 mm pasa libre de la punta al pomo', ok: rod >= D.rr - 2 - tol, detail: `largo ${Math.round(D.xRod1 - D.xRod0)} mm; holgura mínima ${rod.toFixed(2)} mm (radial ${(D.rr - 2).toFixed(2)} mm)` })
  // espesores que importan
  const floorF = D.Th - D.df, floorR = D.Th - D.rr
  checks.push({ name: 'Paredes mínimas sobre canales', ok: (!opts.fibra || floorF >= 1.2) && floorR >= 1.2, detail: `${opts.fibra ? `bajo la fibra ${floorF.toFixed(2)} mm, ` : ''}sobre la varilla ${floorR.toFixed(2)} mm (núcleo de ${(2 * D.Th).toFixed(1)} mm)` })
  checks.push({ name: 'Filo romo (pieza de exhibición)', ok: 2 * D.e >= 1.0, detail: `borde de ${(2 * D.e).toFixed(1)} mm, no corta` })
  return { checks, ok: checks.every((x) => x.ok), resolutionMm: D.h, definitive: opts.quality === 'exportar', parts: partsOut, clearances }
}

// ---------------------------------------------------------------------------------
// Parámetros de fabricación (regla del taller: se documentan antes de producir).

export const PALETAS = {
  carmesi: { nombre: 'Carmesí', nucleo: '#4a5260', filo: '#c8202c', blindaje: '#c9ced6', guarda: '#363c46', dial: '#ffb020', mango: '#24282f', pomo: '#363c46', manguera: '#0d0f12', varilla: '#15171b', luz: '#ff3a4c' },
  cobalto: { nombre: 'Cobalto', nucleo: '#3c4450', filo: '#1f6fe0', blindaje: '#e4e8ee', guarda: '#323842', dial: '#22e0ff', mango: '#22262d', pomo: '#323842', manguera: '#0d0f12', varilla: '#15171b', luz: '#22d8ff' },
  neon: { nombre: 'Neón', nucleo: '#262a31', filo: '#e2208c', blindaje: '#8a929e', guarda: '#1c1f25', dial: '#a0ff3c', mango: '#181b20', pomo: '#1c1f25', manguera: '#0d0f12', varilla: '#15171b', luz: '#a0ff3c' },
} as const

export function paramsJson(b: Built, v: Verification | null) {
  const { D, opts } = b, pal = PALETAS[opts.paleta]
  const printed = b.parts.filter((p) => p.print)
  const rodLen = Math.round(D.xRod1 - D.xRod0)
  const fibLen = D.fiber ? Math.round(D.fiberEnd[0] + D.Gt / 2 + 6 + 30) : 0
  const hose = hosePath(D); let hl = 0; for (let i = 1; i < hose.length; i++) hl += Math.hypot(hose[i][0] - hose[i - 1][0], hose[i][1] - hose[i - 1][1])
  const pins = 2 * D.plates.reduce((s, p) => s + p.pins.length, 0) + D.lamPins.length + 4
  return {
    proyecto: 'NeoProxy · Arsenal · NPX-02 VÉRTICE',
    version: '2.0',
    aviso: 'Pieza de exhibición para imprimir: filo romo de 1,2 mm, no es un arma ni sirve para cortar.',
    opciones: { ...opts, quality: undefined },
    medidas: {
      largoTotalMm: Math.round(D.L - D.x0P), hojaMm: D.L, altoHojaMm: D.W, espesorNucleoMm: +(2 * D.Th).toFixed(2), bordeMm: 2 * D.e,
      mangoMm: D.Lg, guardaMm: { espesor: D.Gt, alto: +(guardGeom(D).yTop - guardGeom(D).yBot).toFixed(1), grosor: +(2 * D.Gz).toFixed(1) },
      holguraMm: D.c, resolucionMm: D.h,
    },
    laminas: {
      segmentosPorLamina: D.n, largoSegmentoMm: +D.ell.toFixed(1), desfaseAB_Mm: +D.s.toFixed(1),
      unionesA: D.bA.slice(1, -1).map((x) => +x.toFixed(1)), unionesB: D.bB.slice(1, -1).map((x) => +x.toFixed(1)),
      colaDeMilanoMm: { profundidad: +D.Dd.toFixed(1), cuello: +D.neck.toFixed(1), cabeza: +D.head.toFixed(1) },
      filo: { piezasPorLamina: D.ne, cortesA: D.cutsA.map((x) => +x.toFixed(1)), cortesB: D.cutsB.map((x) => +x.toFixed(1)), colasA: D.tabsAx.length, colasB: D.tabsBx.length },
      ventanas: D.windows.length, blindajes: D.plates.length,
    },
    piezas: printed.map((p) => ({ archivo: p.print?.file, nombre: p.name, copias: p.print?.count, color: pal[p.group as keyof typeof pal], nota: p.note })),
    materiales: {
      filamento: opts.proc === 'fdm' ? 'PETG o PLA+, capas de 0,16–0,2 mm, 4 perímetros, 20–30 % de relleno giroide' : 'resina rígida (tipo ABS-like), capas de 0,05 mm',
      colores: { nucleo: pal.nucleo, filo: pal.filo, blindajes: pal.blindaje, guardaYPomo: pal.guarda, mango: pal.mango, dial: `${pal.dial} (mejor en PETG translúcido)` },
      herrajes: [
        { item: 'varilla de carbono o acero de 4 mm', cantidad: 1, largoMm: rodLen },
        { item: 'clavijas de filamento de 1,75 mm, cortadas a 2,8 mm', cantidad: pins },
        { item: 'tubo de PVC o silicona de 6 mm (exterior)', cantidad: 1, largoMm: Math.round(hl + 20) },
        ...(opts.fibra ? [{ item: 'fibra óptica de brillo lateral de 2 mm', cantidad: 2, largoMm: fibLen }, { item: 'LED de 3 mm + pila CR2032 + portapila + interruptor mini', cantidad: 2 }] : []),
        { item: 'cianoacrilato en gel y epoxi de 5 minutos', cantidad: 1 },
      ],
    },
    armado: [
      'Lámina A: poner los núcleos A1…An en fila sobre la mesa, cara de corte abajo, encajando cada cola de milano desde arriba. Encajar las piezas del filo A en sus colas. Pegar.',
      'Lámina B: igual. Sus uniones quedan desfasadas de las de A: al pegar una lámina sobre la otra, cada unión queda tapada.',
      'Poner la varilla de 4 mm en el canal de la lámina A y las clavijas de 1,75 mm en sus agujeros; pegar la lámina B encima, cara contra cara, con epoxi. Prensar plano.',
      opts.fibra ? 'Pegar la fibra óptica en el canal de cada cara (gota de cianoacrilato cada 5 cm), dejando la punta libre hacia la guarda.' : 'Sin fibra: el canal se puede rellenar con resina UV con pigmento.',
      'Pegar los blindajes sobre cada par de uniones, con sus clavijas; la placa de matrícula junto a la guarda.',
      `Cerrar las dos mitades de la guarda sobre la espiga${opts.fibra ? ', con el LED, la pila y la punta de la fibra adentro del compartimento' : ''}. El dial va a presión en su asiento.`,
      'Cerrar las dos mitades del mango sobre la espiga y la varilla, con clavijas y epoxi. Calzar el pomo sobre la punta del mango y la varilla.',
      'Pasar la manguera de 6 mm de la toma de la guarda a la del pomo.',
    ],
    verificacion: v ? { ok: v.ok, resolucionMm: v.resolutionMm, comprobaciones: v.checks, holguras: v.clearances, piezas: v.parts } : null,
  }
}

export { SQ2 }
