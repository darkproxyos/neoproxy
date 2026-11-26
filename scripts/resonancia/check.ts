// RESONANCIA: comprobaciones del motor y de las piezas.
//   npx tsx scripts/resonancia/check.ts          todo
//   npx tsx scripts/resonancia/check.ts --hash   solo la huella (para comparar motores: node y bun)
import MODES from '../../lib/resonancia/modes.json'
import { modeGrids, coupling, resonances, response, Sand, onNodes, hz } from '../../lib/resonancia/plate'
import { relief, column } from '../../lib/resonancia/solid'

let fails = 0
const ok = (c: boolean, m: string) => { console.log(`${c ? '  ok ' : '  FALLA'} ${m}`); if (!c) fails++ }
const G = 160
const hash = () => {
  const grids = modeGrids(G), cpl = coupling('centro'), r = resonances('centro')[2]
  const R = response(grids, G, cpl, r.lambda), s = new Sand(5000, 3); s.step(R.amp, G, 300)
  let h = 2166136261
  for (const arr of [R.amp, s.x, s.y]) for (const v of new Uint8Array(arr.buffer)) { h ^= v; h = Math.imul(h, 16777619) >>> 0 }
  return h.toString(16).padStart(8, '0')
}
if (process.argv.includes('--hash')) { console.log(hash()); process.exit(0) }

console.log('== modos de la placa libre ==')
const L = (MODES as { leissa: { leissa: number; ritz: number; err: number }[] }).leissa
for (const x of L) ok(Math.abs(x.err) < 2e-4, `λ ${x.leissa} (Leissa 1969) → ${x.ritz} (error ${(100 * x.err).toFixed(4)} %)`)
const modes = (MODES as { modes: { lambda: number; conv: number }[] }).modes
ok(modes.every((m) => m.conv < 1e-3), `${modes.length} modos, todos cambian < 0,1 % entre 196 y 256 funciones de base`)

console.log('\n== la arena encuentra las líneas quietas ==')
const grids = modeGrids(G), cpl = coupling('centro'), res = resonances('centro')
for (const r of res.slice(0, 5)) {
  const R = response(grids, G, cpl, r.lambda), s = new Sand(30000, 1), before = onNodes(s, R.amp, G)
  s.step(R.amp, G, 1200)
  const after = onNodes(s, R.amp, G)
  ok(after > 0.6 && after > before + 0.25, `${hz(r.lambda).toFixed(0)} Hz (modo ${r.k + 1}): ${(100 * before).toFixed(0)} % → ${(100 * after).toFixed(0)} % de la arena en las líneas`)
}

console.log('\n== piezas ==')
{
  const R = response(grids, G, cpl, res[2].lambda), s = new Sand(30000, 1); s.step(R.amp, G, 1500)
  const r = relief(s, { G: 200, sizeMm: 100, baseMm: 2.4, reliefMm: 1.8, rim: true })
  ok(r.closed, `placa: ${r.tris} triángulos, cerrada ${r.closed}, ${r.sizeMm}×${r.sizeMm}×${r.heightMm.toFixed(1)} mm`)
}
const cache = new Map<number, Float32Array[]>(), gridsAt = (g: number) => { if (!cache.has(g)) cache.set(g, modeGrids(g)); return cache.get(g)! }
for (const [a, b] of [[0, 2], [1, 3]]) {
  const c = column(gridsAt, cpl, { N: 112, sizeMm: 90, lambdaA: res[a].lambda * 0.995, lambdaB: res[b].lambda * 1.005, band: 0.07, aspect: 1.5 }), m = c?.metrics
  ok(!!m && m.closed && m.nonManifoldEdges === 0 && m.droppedVolumeFrac < 0.05 && m.printScore > 0.9, `columna ${hz(res[a].lambda).toFixed(0)}→${hz(res[b].lambda).toFixed(0)} Hz: ${m?.tris} triángulos, cerrada ${m?.closed}, ${m?.components} pieza(s) (sueltas ${(100 * (m?.droppedVolumeFrac ?? 0)).toFixed(1)} %), voladizo ${(100 * (m?.overhangFrac ?? 0)).toFixed(0)} %, pared ${m?.wallP10Mm.toFixed(2)} mm, puntaje ${m?.printScore.toFixed(2)}`)
}

console.log('\n== determinismo ==')
const h1 = hash(), h2 = hash()
ok(h1 === h2, `la misma nota y la misma semilla dan la misma arena (${h1})`)
console.log(fails ? `\n${fails} fallas` : '\ntodo en orden')
process.exit(fails ? 1 : 0)
