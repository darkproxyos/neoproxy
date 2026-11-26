// ANTESIS: comprobaciones del mecanismo y de las piezas.
//   npx tsx scripts/antesis/check.ts           todo (unos minutos)
//   npx tsx scripts/antesis/check.ts --rapido  una semilla por arreglo
import { arrangement, frames } from '../../lib/antesis/layout'
import { combos, pickCombo, gearPair, outline, FIT, coneAngles } from '../../lib/antesis/gear'
import { toothClearance, neighborPhaseError } from '../../lib/antesis/check'
import { build, verify, aoutFor } from '../../lib/antesis/build'

let fails = 0
const ok = (c: boolean, m: string) => { console.log(`${c ? '  ok ' : '  FALLA'} ${m}`); if (!c) fails++ }
const quick = process.argv.includes('--rapido')
const SIZES = { tetra: 64, octa: 64, icosa: 90 } as const

console.log('\n1. Conos que ruedan sin resbalar')
for (const sym of ['tetra', 'octa', 'icosa'] as const) {
  const arr = arrangement(sym)
  for (const c of combos(sym, aoutFor(SIZES[sym]), 'fdm').slice(0, 6)) {
    const { dA, dB } = coneAngles(c.NA, c.NB, arr.sigma)
    const e = Math.abs(c.NA * Math.sin(dB) - c.NB * Math.sin(dA))
    if (e > 1e-12) ok(false, `${sym} ${c.NA}:${c.NB}: NA·sen δB − NB·sen δA = ${e}`)
  }
  ok(true, `${sym}: NA·sen δB = NB·sen δA en todas las combinaciones (Σ = ${(arr.sigma * 180 / Math.PI).toFixed(3)}°)`)
}

console.log('\n2. Cada engranaje mira a todos sus vecinos con un diente (A) o un hueco (B)')
for (const sym of ['tetra', 'octa', 'icosa'] as const) {
  const arr = arrangement(sym), F = frames(arr)
  const eA = neighborPhaseError(F.A, arr.B, F.neighborsA, arr.kA), eB = neighborPhaseError(F.B, arr.A, F.neighborsB, 3)
  ok(eA < 1e-9 && eB < 1e-9, `${sym}: ${arr.A.length} A con ${arr.kA} vecinos, ${arr.B.length} B con 3; desalineación máxima ${Math.max(eA, eB).toExponential(1)} rad`)
}

console.log('\n3. Los dientes (aproximación de Tredgold)')
for (const sym of ['tetra', 'octa', 'icosa'] as const) {
  const arr = arrangement(sym), F = frames(arr), Aout = aoutFor(SIZES[sym])
  const c = pickCombo(combos(sym, Aout, 'fdm'), 1.35, 'fdm')!
  const { A, B } = gearPair({ sym, Aout, combo: c, proc: 'fdm' })
  const e0 = [arr.edges[0]] as [number, number][]
  const zero = toothClearance(arr, F.A, F.B, { ...A, U: outline(A.N, A.delta, Aout, A.m, 0, 0) }, { ...B, U: outline(B.N, B.delta, Aout, B.m, 0, 0.5) }, 64, e0)
  ok(zero.penetrations === 0 && Math.abs(zero.minClear) < 0.01, `${sym} ${c.NA}:${c.NB}: sin juego, los flancos se tocan sin trabarse en todo un paso (holgura mínima ${zero.minClear.toFixed(4)} mm)`)
  const real = toothClearance(arr, F.A, F.B, A, B, 64, e0)
  ok(real.penetrations === 0, `${sym}: con el juego de FDM (${FIT.fdm.backlash} mm), holgura mínima ${real.minClear.toFixed(3)} mm`)
  const all = toothClearance(arr, F.A, F.B, A, B, 8)
  ok(all.penetrations === 0, `${sym}: las ${all.pairs} uniones a la vez, en 8 fases: holgura mínima ${all.minClear.toFixed(3)} mm`)
  const wrong = toothClearance(arr, F.A, F.B, A, { ...B, U: outline(B.N, B.delta, Aout, B.m, FIT.fdm.backlash, 0) }, 16, e0)
  ok(wrong.penetrations > 0, `${sym}: control — con la fase de B equivocada la prueba sí detecta el choque (${wrong.minClear.toFixed(2)} mm)`)
}

console.log('\n4. Flores completas: dientes, barrido, mallas')
const seeds = quick ? [1] : [1, 2, 3, 4, 5, 6]
for (const sym of ['tetra', 'octa', 'icosa'] as const) for (const proc of ['fdm', 'resina'] as const) {
  if (quick && proc === 'resina') continue
  let worstSweep = Infinity, worstTeeth = Infinity, closed = true, okAll = true
  for (const seed of seeds) for (const invert of [false, true]) {
    if (quick && invert) continue
    const b = build({ sym, size: SIZES[sym], ratio: 1.35, proc, seed, reach: 1.72, invert, quality: 'vista' })
    const v = verify(b, true)
    worstSweep = Math.min(worstSweep, v.sweepMin); worstTeeth = Math.min(worstTeeth, v.teethAll.minClear)
    closed = closed && v.meshes.every((m) => m.closed && m.volumeCm3 > 0)
    if (!v.ok) { okAll = false; console.log('     ', sym, proc, seed, invert, JSON.stringify(v.sweep), v.stack) }
  }
  ok(okAll, `${sym} ${proc}: ${seeds.length * (quick ? 1 : 2)} flores — piezas que giran a ≥ ${worstSweep.toFixed(2)} mm, dientes a ≥ ${worstTeeth.toFixed(3)} mm, mallas ${closed ? 'cerradas' : 'ABIERTAS'}`)
}

console.log('\n5. Reproducible')
const h = (sym: 'octa' | 'icosa') => {
  const b = build({ sym, size: SIZES[sym], ratio: 1.35, proc: 'fdm', seed: 12, reach: 1.72, invert: false, quality: 'vista' })
  let x = 2166136261
  for (const p of b.parts) for (const v of p.mesh.positions) { x ^= Math.round(v * 1000) & 0xffff; x = Math.imul(x, 16777619) >>> 0 }
  return x.toString(16)
}
const a1 = h('octa'), a2 = h('octa')
ok(a1 === a2, `la misma flor (octa, semilla 12) da las mismas mallas: ${a1}`)

console.log(fails ? `\n${fails} FALLAS` : '\nTodo bien.')
process.exit(fails ? 1 : 0)
