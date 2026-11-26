// ANTESIS — de los parámetros a las piezas, con su verificación.

import { arrangement, frames, type Symmetry, type Frame } from './layout'
import { FIT, combos, pickCombo, gearPair, gearMesh, pinMesh, stackIssues, type Combo, type GearGeom, type Mesh, type Process, type PinGeom } from './gear'
import { envelopes, decoParams, petalBalls, crownBalls, decoMesh, coreMesh, type Ball, type DecoParams, type Envelopes } from './parts'
import { toothClearance, MeridianField, sweepClearance, blockSamples, meshStats } from './check'

export type AntesisOpts = {
  sym: Symmetry
  size: number        // diámetro de la esfera de engranajes (mm)
  ratio: number       // proporción de dientes NA/NB buscada
  combo?: { NA: number; NB: number }
  proc: Process
  seed: number
  reach: number       // alcance de la flor (múltiplo del radio de la esfera)
  invert: boolean     // pétalos en los B y coronas en los A
  quality: 'vista' | 'exportar'
}

export const DEFAULTS: AntesisOpts = { sym: 'octa', size: 64, ratio: 1.35, proc: 'fdm', seed: 1, reach: 1.72, invert: false, quality: 'vista' }

export type Part = { key: string; name: string; count: number; mesh: Mesh; color: string }
export type Verification = {
  teeth: { minClear: number; penetrations: number; pairs: number; steps: number }
  teethAll: { minClear: number; penetrations: number; pairs: number }
  sweep: { label: string; clearance: number }[]
  sweepMin: number
  meshes: { key: string; closed: boolean; triangles: number; volumeCm3: number }[]
  stack: string[]
  ok: boolean
}
export type Built = {
  opts: AntesisOpts
  combo: Combo
  A: GearGeom; B: GearGeom; pin: PinGeom
  framesA: Frame[]; framesB: Frame[]
  roles: { A: 'petalo' | 'corona'; B: 'petalo' | 'corona' }
  deco: DecoParams
  env: Envelopes
  ballsA: Ball[]; ballsB: Ball[]
  parts: Part[]
  plateT: number
  coreR: number
  bounds: number // radio total (mm)
}

export function aoutFor(size: number) { return size / 2 / 1.03 }

export function comboList(sym: Symmetry, size: number, proc: Process) { return combos(sym, aoutFor(size), proc) }

export function build(o: AntesisOpts): Built {
  const fit = FIT[o.proc], arr = arrangement(o.sym), Aout = aoutFor(o.size)
  const list = combos(o.sym, Aout, o.proc)
  let combo = o.combo ? list.find((c) => c.NA === o.combo!.NA && c.NB === o.combo!.NB) : undefined
  combo = combo ?? pickCombo(list, o.ratio, o.proc) ?? undefined
  if (!combo) throw new Error('Con este tamaño no hay engranajes imprimibles: agranda la esfera o usa resina.')
  const { A, B, pin } = gearPair({ sym: o.sym, Aout, combo, proc: o.proc })
  const F = frames(arr)
  const plateT = o.proc === 'fdm' ? 1.6 : 1.3
  const thick = fit.petal, h = o.quality === 'exportar' ? 0.22 : 0.34
  const d = decoParams(o.seed, o.reach)
  const petalIsA = !o.invert
  const P = petalIsA ? A : B, C = petalIsA ? B : A
  const sigPP = petalIsA ? arr.sigmaAA : arr.sigmaBB, sigCC = petalIsA ? arr.sigmaBB : arr.sigmaAA
  const rt = Math.max(thick * 0.62, 0.9), stalkR = rt + 1.5 + 0.35
  const env = envelopes(arr, P, C, sigPP, sigCC, fit, d, plateT, stalkR)
  const pb = petalBalls(P, env, d, thick, h, plateT), cb = crownBalls(C, env, d, thick, h, plateT)
  const ballsA = petalIsA ? pb : cb, ballsB = petalIsA ? cb : pb
  const coreH = o.quality === 'exportar' ? 0.3 : 0.5
  const core = coreMesh(arr, A, B, pin.r1 + fit.pinCore, pin.L1, coreH)
  const coreR = Math.sqrt(Math.max(A.zb, B.zb) ** 2 + (Math.max(A.rS, B.rS) + 2.2) ** 2)
  const nA = arr.A.length, nB = arr.B.length
  const parts: Part[] = [
    { key: 'nucleo', name: 'Núcleo', count: 1, mesh: core, color: '#1b1f2a' },
    { key: 'engranaje-a', name: `Engranaje A · ${combo.NA} dientes`, count: nA, mesh: gearMesh(A), color: '#c9a8ff' },
    { key: 'engranaje-b', name: `Engranaje B · ${combo.NB} dientes`, count: nB, mesh: gearMesh(B), color: '#8fe3d0' },
    { key: 'deco-a', name: petalIsA ? 'Pétalos (sobre A)' : 'Corona (sobre A)', count: nA, mesh: decoMesh(A, ballsA, plateT, fit, h), color: '#a070ff' },
    { key: 'deco-b', name: petalIsA ? 'Corona (sobre B)' : 'Pétalos (sobre B)', count: nB, mesh: decoMesh(B, ballsB, plateT, fit, h), color: '#ff7ab8' },
    { key: 'pasador-a', name: 'Pasador A', count: nA, mesh: pinMesh(A, pin, fit.pinCore), color: '#e8e2d0' },
    { key: 'pasador-b', name: 'Pasador B', count: nB, mesh: pinMesh(B, pin, fit.pinCore), color: '#e8e2d0' },
  ]
  let bounds = coreR
  for (const b of [...ballsA, ...ballsB]) bounds = Math.max(bounds, Math.hypot(b.x, b.y, b.z) + b.r)
  bounds = Math.max(bounds, A.zOut / Math.cos(A.tip), B.zOut / Math.cos(B.tip))
  return {
    opts: o, combo, A, B, pin, framesA: F.A, framesB: F.B,
    roles: { A: petalIsA ? 'petalo' : 'corona', B: petalIsA ? 'corona' : 'petalo' },
    deco: d, env, ballsA, ballsB, parts, plateT, coreR, bounds,
  }
}

// Verificación completa: dientes (giro de un paso en un par, y todas las uniones en
// algunas fases), barrido entre vecinos (y al encajar la decoración), mallas cerradas.
export function verify(b: Built, quick = false): Verification {
  const arr = arrangement(b.opts.sym), fit = FIT[b.opts.proc]
  const t1 = toothClearance(arr, b.framesA, b.framesB, b.A, b.B, quick ? 24 : 64, [arr.edges[0]])
  const t2 = toothClearance(arr, b.framesA, b.framesB, b.A, b.B, quick ? 2 : 6)
  const zMax = b.bounds + 3
  const plate = (g: GearGeom) => ({ z0: g.zOut, z1: g.zOut + b.plateT, r: g.plate, pad: 0.25 })
  const mer = (balls: Ball[]) => balls.map((q) => ({ z: q.z, r: Math.hypot(q.x, q.y), s: q.r + 0.1 }))
  const fullA = new MeridianField({ balls: mer(b.ballsA), plate: plate(b.A), block: b.A }, zMax, zMax)
  const fullB = new MeridianField({ balls: mer(b.ballsB), plate: plate(b.B), block: b.B }, zMax, zMax)
  const decoA = new MeridianField({ balls: mer(b.ballsA), plate: plate(b.A) }, zMax, zMax)
  const decoB = new MeridianField({ balls: mer(b.ballsB), plate: plate(b.B) }, zMax, zMax)
  const plateBalls = (g: GearGeom) => {
    const o: Ball[] = []
    for (let r = 0; r <= g.plate; r += 0.4) o.push({ x: r, y: 0, z: g.zOut + b.plateT, r: 0.25 })
    for (let z = g.zOut; z <= g.zOut + b.plateT; z += 0.4) o.push({ x: g.plate, y: 0, z, r: 0.25 })
    return o
  }
  const dA = [...b.ballsA, ...plateBalls(b.A)], dB = [...b.ballsB, ...plateBalls(b.B)]
  const sweep: { label: string; clearance: number }[] = []
  const [i0, j0] = arr.edges[0]
  const fa = b.framesA[i0], fb = b.framesB[j0]
  const lifts = quick ? [0] : [0, 1.1, 2.2]
  for (const lift of lifts) {
    sweep.push({ label: `decoración B ${lift ? `(encajando, +${lift} mm) ` : ''}contra engranaje A y su decoración`, clearance: sweepClearance(fullA, fa, fb, dB, lift) })
    sweep.push({ label: `decoración A ${lift ? `(encajando, +${lift} mm) ` : ''}contra engranaje B y su decoración`, clearance: sweepClearance(fullB, fb, fa, dA, lift) })
  }
  sweep.push({ label: 'engranaje B contra decoración A', clearance: sweepClearance(decoA, fa, fb, blockSamples(b.B)) })
  sweep.push({ label: 'engranaje A contra decoración B', clearance: sweepClearance(decoB, fb, fa, blockSamples(b.A)) })
  // vecinos de la misma clase (el más cercano)
  const nearest = (axes: number[][]) => { let best = 1, bi = 1; for (let k = 1; k < axes.length; k++) { const c = axes[0][0] * axes[k][0] + axes[0][1] * axes[k][1] + axes[0][2] * axes[k][2]; if (k === 1 || c > best) { best = c; bi = k } } return bi }
  const kA = nearest(arr.A), kB = nearest(arr.B)
  sweep.push({ label: 'dos A vecinos', clearance: sweepClearance(fullA, b.framesA[0], b.framesA[kA], [...dA, ...blockSamples(b.A)]) })
  sweep.push({ label: 'dos B vecinos', clearance: sweepClearance(fullB, b.framesB[0], b.framesB[kB], [...dB, ...blockSamples(b.B)]) })
  const sweepMin = Math.min(...sweep.map((s) => s.clearance))
  const meshes = b.parts.map((p) => { const s = meshStats(p.mesh); return { key: p.key, closed: s.closed, triangles: s.triangles, volumeCm3: s.volume / 1000 } })
  const stack = [...stackIssues(b.A, fit).map((s) => `A: ${s}`), ...stackIssues(b.B, fit).map((s) => `B: ${s}`)]
  const ok = t1.penetrations === 0 && t2.penetrations === 0 && sweepMin > 0.3 && meshes.every((m) => m.closed && m.volumeCm3 > 0) && stack.length === 0
  return {
    teeth: { minClear: t1.minClear, penetrations: t1.penetrations, pairs: 1, steps: t1.steps },
    teethAll: { minClear: t2.minClear, penetrations: t2.penetrations, pairs: t2.pairs },
    sweep, sweepMin, meshes, stack, ok,
  }
}

// Parámetros de fabricación en JSON (regla del taller: se documentan antes de producir).
export function paramsJson(b: Built, v: Verification | null) {
  const r = (x: number, k = 3) => Math.round(x * 10 ** k) / 10 ** k, deg = (x: number) => r((x * 180) / Math.PI, 3)
  const arr = arrangement(b.opts.sym), fit = FIT[b.opts.proc]
  const g = (x: GearGeom) => ({
    dientes: x.N, semiangulo_cono_primitivo_deg: deg(x.delta), semiangulo_puntas_deg: deg(x.tip), semiangulo_fondo_deg: deg(x.root),
    distancia_conica_exterior_mm: r(x.Aout), distancia_conica_interior_mm: r(x.Ain),
    plano_interior_z_mm: r(x.zIn), plano_exterior_z_mm: r(x.zOut),
    buje: { fondo_z_mm: r(x.zSb), radio_mm: r(x.rS) }, agujero_pasador_radio_mm: r(x.rB),
    alojamiento_cabeza: { piso_z_mm: r(x.zC), radio_mm: r(x.rCB) }, encaje_hexagonal: { piso_z_mm: r(x.zK), apotema_mm: r(x.sH) },
    cara_del_nucleo_z_mm: r(x.zb), plato_decoracion_radio_mm: r(x.plate), fase: x.phase === 0 ? 'diente hacia cada vecino' : 'hueco hacia cada vecino',
  })
  return {
    pieza: 'ANTESIS — flor de engranajes cónicos', version: 1, generado: 'neoproxy.art/antesis',
    opciones: b.opts,
    arreglo: { simetria: b.opts.sym, engranajes_A: arr.A.length, engranajes_B: arr.B.length, uniones: arr.edges.length, angulo_entre_ejes_vecinos_deg: deg(arr.sigma) },
    engrane: { modulo_exterior_mm: r(b.combo.m), angulo_presion_deg: 20, perfil: 'evolvente sobre el cono trasero (Tredgold), proyección central', juego_mm: fit.backlash, relacion: `${b.combo.NA}:${b.combo.NB}` },
    engranaje_A: g(b.A), engranaje_B: g(b.B),
    pasador: { radio_al_nucleo_mm: r(b.pin.r1), radio_de_giro_mm: r(b.pin.r2), radio_cabeza_mm: r(b.pin.r3), alto_cabeza_mm: b.pin.hH, largo_en_nucleo_mm: r(b.pin.L1) },
    holguras_mm: fit,
    decoracion: { roles: b.roles, ...b.deco, espesor_mm: fit.petal, plato_mm: b.plateT },
    piezas: b.parts.map((p) => ({ archivo: `antesis-${p.key}${p.count > 1 ? `-x${p.count}` : ''}.stl`, nombre: p.name, cantidad: p.count })),
    verificacion: v,
  }
}
