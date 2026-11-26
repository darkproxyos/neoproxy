// Comprobaciones de HUMO SÓLIDO.   npx tsx scripts/humo/check.ts
//   · velocidad de un anillo vs Kelvin: U = Γ/(4πR)·(ln(8R/δ) − 1) para el núcleo de Rosenhead–Moore
//     (la fórmula de Kelvin para un núcleo uniforme de radio a = δ·e^{3/4})
//   · impulso hidrodinámico (invariante exacto de un fluido ideal) a lo largo de cada experimento
//   · determinismo: la misma receta da la misma nube (y `bun scripts/humo/check.ts --hash` debe coincidir)
//   · el sólido de cada experimento es una malla cerrada
import { initState, step, impulse, impulseScale, singleRing, stepsFor, stateHash, DT, type ExperimentId } from '../../lib/humo/vortex'
import { solidify } from '../../lib/humo/solid'
import { EXP_PEDESTAL } from './pedestal'

let fails = 0
const ok = (c: boolean, m: string) => { console.log(`${c ? '  ok ' : '  FALLA'} ${m}`); if (!c) fails++ }
const IDS: ExperimentId[] = ['leapfrog', 'choque', 'oblicuo', 'nudo']
if (process.argv.includes('--hash')) {
  for (const e of IDS) { const s = initState({ exp: e, seed: 1, a: 0.5, b: 0.5 }, 1500); for (let k = 0; k < 80; k++) step(s, DT); console.log(e, stateHash(s)) }
  process.exit(0)
}
console.log('== Kelvin ==')
for (const R of [1, 2]) {
  const s = singleRing(R), z0 = 0
  for (let k = 0; k < 50; k++) step(s, DT)
  let z = 0; for (let i = 0; i < s.fil[0].n; i++) z += s.fil[0].x[3 * i + 2]; z /= s.fil[0].n
  const U = (z - z0) / s.t, K = (1 / (4 * Math.PI * R)) * (Math.log((8 * R) / s.delta) - 1)
  ok(Math.abs(U - K) / K < 0.05, `anillo R=${R}: velocidad ${U.toFixed(4)} vs Kelvin ${K.toFixed(4)} (${(100 * (U - K) / K).toFixed(1)} %)`)
}
console.log('\n== impulso y sólido por experimento ==')
for (const e of IDS) {
  const s = initState({ exp: e, seed: 1, a: 0.5, b: 0.5 }, 6000), p0 = impulse(s), sc = impulseScale(s), n = stepsFor(e)
  const t0 = Date.now(); let worst = 0
  for (let k = 0; k < n; k++) { step(s, DT); const p = impulse(s); worst = Math.max(worst, Math.hypot(p[0] - p0[0], p[1] - p0[1], p[2] - p0[2]) / sc) }
  const ms = Date.now() - t0
  ok(worst < (e === 'oblicuo' ? 0.15 : 0.08), `${e}: ${n} pasos en ${ms} ms (${(ms / n).toFixed(0)} ms por paso, 6000 partículas por anillo); deriva máxima del impulso ${(100 * worst).toFixed(1)} %`)
  const r = solidify(s, { res: 104, sizeMm: 60, density: 0.5, pedestal: EXP_PEDESTAL[e] })
  ok(!!r && r.metrics.closed, `${e}: sólido ${r ? `${r.metrics.tris} triángulos, cerrado ${r.metrics.closed}, ${r.widthMm.toFixed(0)}×${r.heightMm.toFixed(0)} mm, voladizo ${(100 * r.metrics.overhangFrac).toFixed(0)} %, puntaje ${r.metrics.printScore.toFixed(2)}` : 'no se formó'}`)
}
console.log('\n== determinismo ==')
const h = () => { const s = initState({ exp: 'oblicuo', seed: 3, a: 0.4, b: 0.7 }, 1500); for (let k = 0; k < 80; k++) step(s, DT); return stateHash(s) }
const h1 = h(), h2 = h(); ok(h1 === h2, `la misma receta da la misma nube (${h1})`)
console.log(fails ? `\n${fails} FALLAS` : '\ntodo en orden')
process.exit(fails ? 1 : 0)
