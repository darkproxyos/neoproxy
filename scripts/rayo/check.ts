// RAYO: comprobaciones del modelo y de la pieza.
//   npx tsx scripts/rayo/check.ts          todo
//   npx tsx scripts/rayo/check.ts --hash   solo la huella (para comparar motores: node y bun)
import { create, grow, massRadius, boxDimension } from '../../lib/rayo/dbm'
import { solidify } from '../../lib/rayo/solid'

let fails = 0
const ok = (c: boolean, m: string) => { console.log(`${c ? '  ok ' : '  FALLA'} ${m}`); if (!c) fails++ }
const BOX = { nx: 64, ny: 64, nz: 96 }
const bolt = (eta: number, seed: number) => { const d = create({ geometry: 'plano', ...BOX, eta, seed, maxSites: 20000, tower: 4 }); while (!d.done) grow(d); return d }
const hash = () => {
  let h = 2166136261
  for (const s of [1, 2]) { const d = bolt(2.5, s); for (const i of d.sites) { h ^= i & 255; h = Math.imul(h, 16777619) >>> 0; h ^= i >>> 8; h = Math.imul(h, 16777619) >>> 0 } }
  return h.toString(16).padStart(8, '0')
}
if (process.argv.includes('--hash')) { console.log(hash()); process.exit(0) }
const stats = (v: number[]) => { const m = v.reduce((a, b) => a + b) / v.length; return { m, s: Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, v.length - 1)) } }

console.log('== dimensión fractal (η = 1, crecimiento radial) ==')
const d2: number[] = []
for (const seed of [1, 2, 3, 4, 5, 6]) { const d = create({ geometry: 'disco', nx: 301, ny: 301, nz: 1, eta: 1, seed, maxSites: 8000, globalEvery: 4 }); while (!d.done) grow(d); d2.push(massRadius(d, 4, 67)) }
const a2 = stats(d2)
ok(Math.abs(a2.m - 1.71) < 0.06, `2D: D = ${a2.m.toFixed(3)} ± ${a2.s.toFixed(3)} (6 semillas); publicado: 1,75 ± 0,02 (Niemeyer et al. 1984), 1,71 para DLA`)
const d3: number[] = []
for (const seed of [1, 2, 3, 4, 5, 6]) { const n = 91, d = create({ geometry: 'esfera', nx: n, ny: n, nz: n, eta: 1, seed, maxSites: 30000 }); while (!d.done) grow(d); d3.push(massRadius(d, 4, 20)) }
const a3 = stats(d3)
ok(Math.abs(a3.m - 2.5) < 0.15, `3D: D = ${a3.m.toFixed(3)} ± ${a3.s.toFixed(3)} (6 semillas, cúmulos de ~5000 sitios); publicado: ≈ 2,5 para DLA en 3D`)
const e2: number[] = []
for (const seed of [1, 2, 3]) { const d = create({ geometry: 'disco', nx: 301, ny: 301, nz: 1, eta: 2, seed, maxSites: 8000, globalEvery: 4 }); while (!d.done) grow(d); e2.push(massRadius(d, 4, 67)) }
const b2 = stats(e2)
ok(b2.m < a2.m - 0.2, `más η, menos ramas: en 2D con η = 2, D = ${b2.m.toFixed(3)} ± ${b2.s.toFixed(3)}`)

const rel = (ge: number) => stats([1, 2, 3].map((seed) => { const d = create({ geometry: 'disco', nx: 301, ny: 301, nz: 1, eta: 1, seed, maxSites: 8000, globalEvery: ge }); while (!d.done) grow(d); return massRadius(d, 4, 67) }))
const r1 = rel(1), r8 = rel(8)
ok(Math.abs(r1.m - r8.m) < Math.max(0.05, r1.s + r8.s), `relajar toda la grilla en cada paso o cada 8 da lo mismo: D = ${r1.m.toFixed(3)} contra ${r8.m.toFixed(3)}`)

console.log('\n== rayos y piezas (grilla 64×64×96) ==')
for (const eta of [2, 2.5, 3]) for (const seed of [1, 2]) {
  const d = bolt(eta, seed), r = solidify(d, { res: 170, sizeMm: 100, thick: 0.65, prune: 6, base: true }), m = r?.metrics
  ok(d.hit >= 0 && !!m && m.closed && m.components === 1 && m.printScore > 0.8, `η ${eta} rayo ${seed}: ${d.sites.length} pasos, toca ${d.hit >= 0}, D cajas ${boxDimension(d).toFixed(2)} · pieza ${m?.tris} triángulos, cerrada ${m?.closed}, ${m?.components} pieza, ${r?.widthMm.toFixed(0)}×${r?.heightMm.toFixed(0)} mm, voladizo ${(100 * (m?.overhangFrac ?? 0)).toFixed(0)} %, pared ${m?.wallP10Mm.toFixed(2)} mm, puntaje ${m?.printScore.toFixed(2)}`)
}

console.log('\n== determinismo ==')
const h1 = hash(), h2 = hash()
ok(h1 === h2, `la misma η y la misma semilla dan el mismo rayo (${h1})`)
console.log(fails ? `\n${fails} fallas` : '\ntodo en orden')
process.exit(fails ? 1 : 0)
