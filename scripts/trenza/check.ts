// TRENZA: comprobaciones del motor y de la pieza.
//   npx tsx scripts/trenza/check.ts           todo
//   npx tsx scripts/trenza/check.ts --hash    solo la huella (para comparar motores: node y bun)
import { ORBITS, computeTrack, strandsFrom } from '../../lib/trenza/orbit'
import { integrate, initial, energy, returnError, braidWord, reduceWord } from '../../lib/trenza/nbody'
import { solidify } from '../../lib/trenza/solid'

let fails = 0
const ok = (c: boolean, m: string) => { console.log(`${c ? '  ok ' : '  FALLA'} ${m}`); if (!c) fails++ }
const hash = () => {
  let h = 2166136261
  for (const o of ORBITS.slice(0, 4)) {
    const tr = integrate(initial(o.p1, o.p2), o.T)
    const y = tr.y[tr.y.length - 1], b = new Uint8Array(Float64Array.from(y).buffer)
    for (const v of b) { h ^= v; h = Math.imul(h, 16777619) >>> 0 }
    h ^= tr.steps; h = Math.imul(h, 16777619) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}
if (process.argv.includes('--hash')) { console.log(hash()); process.exit(0) }

console.log('== catálogo ==')
for (const o of ORBITS) {
  // cierre con la tolerancia del refinamiento (1e-13) y con la del navegador (1e-12)
  const e13 = returnError(o.p1, o.p2, o.T, 1e-13), e12 = returnError(o.p1, o.p2, o.T, 1e-12)
  const tr = integrate(initial(o.p1, o.p2), o.T), E0 = energy(initial(o.p1, o.p2)), dE = Math.abs((energy(tr.y[tr.y.length - 1]) - E0) / E0)
  const w = reduceWord(braidWord(tr, o.T))
  ok(e13 < 1e-9 && e12 < 1e-7 && dE < 1e-9 && JSON.stringify(w) === JSON.stringify(o.word), `${o.name.padEnd(13)} cierra a ${e13.toExponential(1)} (navegador ${e12.toExponential(1)}; publicada ${o.published.returnError}), ΔE ${dE.toExponential(1)}, trenza de ${w.length} cruces`)
}
const ocho = ORBITS.find((o) => o.id === 'ocho')!
ok(JSON.stringify(ocho.word) === JSON.stringify([1, -2, 1, -2, 1, -2]), 'el ocho da la palabra (σ₁ σ₂⁻¹)³')
ok(ocho.diverge.eps6 === null, 'el ocho aguanta más de 40 vueltas con una diferencia de 10⁻⁶')

console.log('\n== piezas ==')
for (const id of ['ocho', 'mariposa-1', 'anteojos', 'polilla-1']) {
  const o = ORBITS.find((x) => x.id === id)!
  for (const plates of ['base', 'ambas'] as const) {
    const t0 = Date.now()
    const r = solidify(strandsFrom(computeTrack(o, 1), o.T, 1, 0.01, o.T / 1500), { res: 112, sizeMm: 90, aspect: 1.6, radius: 0.045, plates, speedWeight: 0.8 })
    const m = r?.metrics
    ok(!!m && m.closed && m.components === 1 && m.nonManifoldEdges === 0, `${o.name.padEnd(11)} ${plates.padEnd(5)}: ${m?.tris} triángulos, cerrada ${m?.closed}, ${m?.components} pieza, ${r?.widthMm.toFixed(0)}×${r?.heightMm.toFixed(0)} mm, voladizo ${m ? (100 * m.overhangFrac).toFixed(0) : '?'} %, puntaje ${m?.printScore.toFixed(2)} (${Date.now() - t0} ms)`)
  }
}

console.log('\n== determinismo ==')
const h1 = hash(), h2 = hash()
ok(h1 === h2, `la misma órbita da los mismos bits (${h1})`)
console.log(fails ? `\n${fails} fallas` : '\ntodo en orden')
process.exit(fails ? 1 : 0)
