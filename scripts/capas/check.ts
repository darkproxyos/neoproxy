// Comprobaciones de CAPAS que no dependen del navegador:
//   1. la carga topológica total de los defectos es 0 en todas las capas (toroide)
//   2. el corte de la malla a una altura coincide con la capa simulada (área)
//   3. la receta reproduce el mismo universo (huella) y la compresión a enlace es ida y vuelta
//   npx tsx scripts/capas/check.ts [--res 130] [--law coral]
import { LAWS, LAW_IDS, topologicalCharge, type LawId } from '../../lib/capas/laws'
import { Session, defaultRecipe, runRecipe, volumeHash, encodeRecipe, decodeRecipe, recipeId, WORLD } from '../../lib/capas/session'
import { mulberry32 } from '../../lib/specimens/rng'
import { footprint } from '../../lib/capas/volume'
import { analyzeTimeline } from '../../lib/capas/events'
import { buildMesh, crossSectionArea, simulatedArea, resolveAspect } from '../../lib/capas/mesh'

const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d }
const RES = Number(arg('res', '130')), SIZE = 60
const only = arg('law', '')
let fails = 0
const ok = (cond: boolean, msg: string) => { console.log(`${cond ? '  ok ' : '  FALLA'} ${msg}`); if (!cond) fails++ }

// 1. carga topológica: se sigue la sesión capa a capa
{
  const s = new Session({ ...defaultRecipe('defectos', 11), slices: 160 })
  let worst = 0, maxPairs = 0
  for (let i = 0; i < 159; i++) {
    s.advance(1)
    const q = topologicalCharge(s.world)
    worst = Math.max(worst, Math.abs(q.total)); maxPairs = Math.max(maxPairs, q.plus)
  }
  const q = topologicalCharge(s.world)
  console.log(`defectos: carga final +${q.plus} −${q.minus}; máximo de vórtices + simultáneos ${maxPairs}`)
  ok(worst === 0, `carga topológica total = 0 en las 160 capas (peor desvío ${worst})`)
  // el dipolo sembrado también la conserva
  const d = new Session({ ...defaultRecipe('defectos', 11), slices: 30 }); d.advance(20)
  const before = topologicalCharge(d.world)
  d.paint(60, 60, 10, 1); d.paint(20, 100, 8, 1)
  const after = topologicalCharge(d.world)
  ok(after.total === 0 && after.plus >= before.plus, `dipolos sembrados: +${before.plus}→+${after.plus}, total ${after.total}`)
}

for (const id of (only ? [only] : [...LAW_IDS]) as LawId[]) {
  console.log(`\n== ${id} ==`)
  const r = defaultRecipe(id, 7)
  const t0 = Date.now()
  const s = runRecipe(r)
  const vol = s.volume()
  const t1 = Date.now()
  const tl = analyzeTimeline(vol, r.theta, footprint(r.shape, resolveAspect(vol, r.theta, r.aspect), r.slices))
  console.log(`sim ${t1 - t0} ms | partes máx ${tl.peak} | nacimientos ${tl.counts.birth} divisiones ${tl.counts.split} fusiones ${tl.counts.merge} muertes ${tl.counts.death}`)
  const t2 = Date.now()
  const res = buildMesh(vol, { theta: r.theta, aspect: r.aspect, planned: r.slices, shape: r.shape, base: r.base, res: RES, sizeMm: SIZE })
  if (!res) { ok(false, 'no produjo malla'); continue }
  const m = res.metrics
  console.log(`malla ${Date.now() - t2} ms | aspecto ${res.aspect.toFixed(2)} | ${(res.widthMm).toFixed(1)}×${res.heightMm.toFixed(1)} mm | tris ${m.tris} comp ${m.components} género ${m.genus} cerrada ${m.closed} | voladizo malla ${(100 * m.overhangFrac).toFixed(1)}% campo ${(100 * res.overhangPhys).toFixed(1)}% | score ${m.printScore.toFixed(2)} | cae ${(100 * m.droppedVolumeFrac).toFixed(1)}%`)
  ok(m.closed, 'malla cerrada (sin aristas abiertas ni no-manifold)')
  // 2. área del corte contra la capa simulada, a varias alturas (fuera de la base y de la cúpula)
  const aspect = resolveAspect(vol, r.theta, r.aspect)
  const errs: string[] = []
  let worst = 0
  for (const frac of [0.25, 0.4, 0.55, 0.7]) {
    const s0 = frac * (r.slices - 1)
    const zmm = (s0 - res.sliceOfZ.s0) / res.sliceOfZ.k
    const a = crossSectionArea(res.mesh, zmm), b = simulatedArea(vol, r.theta, s0, { shape: r.shape, aspect, sizeMm: SIZE, planned: r.slices })
    const e = Math.abs(a - b) / Math.max(1e-9, b)
    worst = Math.max(worst, m.droppedVolumeFrac < 0.02 ? e : 0)
    errs.push(`capa ${s0.toFixed(0)}: malla ${a.toFixed(1)} vs mundo ${b.toFixed(1)} mm² (${(100 * e).toFixed(1)}%)`)
  }
  console.log('  ' + errs.join('\n  '))
  if (m.droppedVolumeFrac < 0.02) ok(worst < 0.1, `el corte impreso coincide con la capa simulada (peor error ${(100 * worst).toFixed(1)}%)`)
  else console.log(`  (la malla descartó ${(100 * m.droppedVolumeFrac).toFixed(1)}% del volumen en partes sueltas: no se compara el área)`)
  // 3. reproducibilidad
  const h1 = volumeHash(vol), h2 = volumeHash(runRecipe(r).volume())
  ok(h1 === h2, `la receta ${recipeId(r)} se repite bit a bit (huella ${h1})`)
}

// pinceladas al azar sobre cada ley: el mundo no puede llenarse de NaN ni de infinitos
{
  console.log('\n== pinceladas al azar ==')
  for (const id of LAW_IDS) {
    const rnd = mulberry32(99)
    const s = new Session({ ...defaultRecipe(id, 5), slices: 120 }, false)
    for (let i = 0; i < 119; i++) {
      for (let k = 0; k < 3; k++) if (rnd() < 0.35) s.paint(Math.floor(rnd() * WORLD), Math.floor(rnd() * WORLD), 2 + Math.floor(rnd() * 15), rnd() < 0.75 ? 1 : -1)
      s.advance(1)
    }
    const finite = [s.world.a, s.world.b].every((arr) => arr.every((v) => Number.isFinite(v)))
    ok(finite, `${id}: ${s.recipe.strokes.length} pinceladas al azar y el mundo sigue siendo finito`)
    if (id === 'defectos') { const q = topologicalCharge(s.world); ok(q.total === 0, `defectos tras pinceladas: carga total ${q.total} (+${q.plus} −${q.minus})`) }
  }
}

// receta con pinceladas y perillas: ida y vuelta por enlace y repetición
{
  console.log('\n== receta con pinceladas ==')
  const r = defaultRecipe('mitosis', 21)
  const s = new Session(r, false)
  for (let i = 0; i < 100; i++) {
    if (i % 17 === 3) s.paint(30 + i, 40 + (i % 5) * 20, 6, 1)
    if (i % 29 === 5) s.paint(90, 90, 8, -1)
    if (i === 40) s.setKnob(0.9)
    if (i === 70) s.setKnob(0.2)
    s.advance(1)
  }
  const live = volumeHash(s.volume())
  const link = encodeRecipe(s.recipe), back = decodeRecipe(link)
  ok(!!back && JSON.stringify(back) === JSON.stringify(s.recipe), `enlace de ${link.length} caracteres: ida y vuelta exacta (${s.recipe.strokes.length} pinceladas, ${s.recipe.knobs.length} cambios de perilla)`)
  const rep = runRecipe(back!, s.count)
  ok(volumeHash(rep.volume()) === live, `la reproducción desde el enlace da la misma pila que la sesión en vivo (${live})`)
  console.log(`  mundo ${WORLD}×${WORLD}, ${s.count} capas`)
}
console.log(fails ? `\n${fails} FALLAS` : '\ntodo en orden')
process.exit(fails ? 1 : 0)
