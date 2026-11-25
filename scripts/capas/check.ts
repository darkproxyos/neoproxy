// Comprobaciones de CAPAS que no dependen del navegador.
//   npx tsx scripts/capas/check.ts [--res 130] [--law coral] [--update-golden]
//
// Lo que cada prueba demuestra y lo que no:
//   · Dipolo exacto: un dipolo pintado en un campo uniforme suma exactamente un vórtice + y uno −.
//     (La suma total de cargas en un toroide es SIEMPRE 0 para cualquier campo, incluso con NaN:
//     es una identidad de cómo se cuenta, así que no prueba nada de la física; se deja solo como
//     chequeo del contador.)
//   · Mundo finito: pinceladas al azar no dejan NaN ni infinitos (un NaN se contagia a todo el
//     mundo; el pincel de vórtices tuvo ese error y la prueba de carga total lo dejó pasar).
//   · Aspecto causal: el valor que da el solver coincide con el cuantil de cuántas veces cruza el
//     mundo cada trozo de superficie, calculado aparte. Es una identidad de la definición, no una
//     medición física del frente.
//   · Corte vs capa: el área de la sección de la malla coincide con la de la capa simulada. Es
//     coherencia de la malla con el muestreo, no validación física.
//   · Reproducible: la misma receta da la misma pila (huella FNV-1a) y las huellas de referencia
//     (scripts/capas/golden.json) no cambian. Si cambian a propósito: --update-golden, sube
//     `v` de la receta y conserva el motor anterior, o los enlaces viejos darán otra pieza.
//     Entre motores: `bun scripts/capas/hash.ts` (JavaScriptCore) debe dar lo mismo que Node (V8).
import fs from 'fs'
import { LAW_IDS, topologicalCharge, type LawId } from '../../lib/capas/laws'
import { Session, defaultRecipe, runRecipe, volumeHash, encodeRecipe, decodeRecipe, recipeId, WORLD } from '../../lib/capas/session'
import { analyzeTimeline } from '../../lib/capas/events'
import { buildMesh, crossSectionArea, simulatedArea, resolveAspect } from '../../lib/capas/mesh'
import { BASE_FRAC, footprint, causalAspect, crossingDistribution } from '../../lib/capas/volume'
import { referenceRecipes } from './hash'

const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d }
const RES = Number(arg('res', '130')), SIZE = 60
const only = arg('law', '')
const GOLDEN = new URL('./golden.json', `file://${__dirname}/`).pathname
let fails = 0
const ok = (cond: boolean, msg: string) => { console.log(`${cond ? '  ok ' : '  FALLA'} ${msg}`); if (!cond) fails++ }

// 1. defectos: el contador de carga y el dipolo
{
  console.log('== carga topológica (defectos) ==')
  const uniform = () => { const s = new Session({ ...defaultRecipe('defectos', 11), slices: 30 }, false); s.world.a.fill(1); s.world.b.fill(0); return s }
  const s0 = uniform(); const q0 = topologicalCharge(s0.world)
  ok(q0.plus === 0 && q0.minus === 0, `campo uniforme: sin vórtices (+${q0.plus} −${q0.minus})`)
  const s1 = uniform(); s1.paint(64, 64, 10, 1)
  const q1 = topologicalCharge(s1.world)
  ok(q1.plus === 1 && q1.minus === 1, `un dipolo pintado suma exactamente un vórtice + y uno − (+${q1.plus} −${q1.minus})`)
  s1.paint(20, 100, 8, 1) // este cruza el borde del toroide
  const q2 = topologicalCharge(s1.world)
  ok(q2.plus === 2 && q2.minus === 2, `un segundo dipolo, cruzando el borde: +2 y −2 (+${q2.plus} −${q2.minus})`)
  const s2 = new Session({ ...defaultRecipe('defectos', 11), slices: 160 }, false)
  let worst = 0
  for (let i = 0; i < 159; i++) { s2.advance(1); worst = Math.max(worst, Math.abs(topologicalCharge(s2.world).total)) }
  const q3 = topologicalCharge(s2.world)
  ok(worst === 0 && q3.plus > 0, `contador: suma 0 en 160 capas con ${q3.plus} vórtices + vivos al final (identidad del toroide, no prueba de la física)`)
}

// 2. mundo finito con pinceladas al azar, y reproducción de lo pintado en vivo
{
  console.log('\n== pinceladas al azar ==')
  const refs = referenceRecipes()
  for (const id of LAW_IDS) {
    const { recipe, live } = refs[`${id}/pinceladas`]
    const rep = runRecipe(recipe, recipe.strokes.length ? 120 : 1)
    const finite = [rep.world.a, rep.world.b].every((arr) => arr.every((v) => Number.isFinite(v)))
    ok(finite, `${id}: ${recipe.strokes.length} pinceladas y ${recipe.knobs.length} giros de perilla; el mundo sigue siendo finito`)
    ok(volumeHash(rep.volume()) === live, `${id}: reproducir la receta da la misma pila que la sesión pintada en vivo (${live})`)
  }
}

// 3. por ley: motor, malla y reproducibilidad
for (const id of (only ? [only] : [...LAW_IDS]) as LawId[]) {
  console.log(`\n== ${id} ==`)
  const r = defaultRecipe(id, 7)
  const t0 = Date.now()
  const vol = runRecipe(r).volume()
  const t1 = Date.now()
  const aspect = resolveAspect(vol, r.theta, r.aspect)
  const tl = analyzeTimeline(vol, r.theta, footprint(r.shape, aspect, r.slices), r.base ? Math.ceil(BASE_FRAC * (r.slices - 1)) : 0)
  console.log(`sim ${t1 - t0} ms (${((t1 - t0) / r.slices).toFixed(1)} ms por capa) | partes máx ${tl.peak} | nacimientos ${tl.counts.birth} divisiones ${tl.counts.split} fusiones ${tl.counts.merge} muertes ${tl.counts.death}`)
  // aspecto causal = cuantil de cuántas veces cruza el mundo cada trozo de superficie
  const dist = Array.from(crossingDistribution(vol, r.theta)).sort((a, b) => a - b)
  const q = dist[Math.min(dist.length - 1, Math.floor(0.97 * dist.length))], a = causalAspect(vol, r.theta)
  if (q >= 0.25 && q <= 6) ok(Math.abs(a - q) / q < 0.02, `aspecto causal ${a.toFixed(3)} = cuantil 97 % de «anchos del mundo recorridos» ${q.toFixed(3)} (calculado aparte, ${dist.length} caras)`)
  else console.log(`  (el cuantil ${q.toFixed(3)} cae fuera del rango [0,25; 6] del solver: no se compara)`)
  const t2 = Date.now()
  const res = buildMesh(vol, { theta: r.theta, aspect: r.aspect, planned: r.slices, shape: r.shape, base: r.base, res: RES, sizeMm: SIZE })
  if (!res) { ok(false, 'no produjo malla'); continue }
  const m = res.metrics
  console.log(`malla ${Date.now() - t2} ms | aspecto ${res.aspect.toFixed(2)} | ${res.widthMm.toFixed(1)}×${res.heightMm.toFixed(1)} mm | tris ${m.tris} comp ${m.components} género ${m.genus} cerrada ${m.closed} | voladizo malla ${(100 * m.overhangFrac).toFixed(1)}% campo ${(100 * res.overhangPhys).toFixed(1)}% | score ${m.printScore.toFixed(2)} | cae ${(100 * m.droppedVolumeFrac).toFixed(1)}%`)
  ok(m.closed, 'malla cerrada (sin aristas abiertas ni no-manifold)')
  const errs: string[] = []
  let worst = 0
  for (const frac of [0.25, 0.4, 0.55, 0.7]) {
    const s0 = frac * (r.slices - 1)
    const zmm = (s0 - res.sliceOfZ.s0) / res.sliceOfZ.k
    const area = crossSectionArea(res.mesh, zmm), ref = simulatedArea(vol, r.theta, s0, { shape: r.shape, aspect, sizeMm: SIZE, planned: r.slices })
    const e = Math.abs(area - ref) / Math.max(1e-9, ref)
    worst = Math.max(worst, m.droppedVolumeFrac < 0.02 ? e : 0)
    errs.push(`capa ${s0.toFixed(0)}: malla ${area.toFixed(1)} vs mundo ${ref.toFixed(1)} mm² (${(100 * e).toFixed(1)}%)`)
  }
  console.log('  ' + errs.join('\n  '))
  if (m.droppedVolumeFrac < 0.02) ok(worst < 0.1, `el corte de la malla coincide con la capa simulada (peor error ${(100 * worst).toFixed(1)}%; coherencia, no validación física)`)
  else console.log(`  (la malla descartó ${(100 * m.droppedVolumeFrac).toFixed(1)}% del volumen en partes sueltas: no se compara el área)`)
  ok(volumeHash(vol) === volumeHash(runRecipe(r).volume()), `la receta ${recipeId(r)} se repite bit a bit (huella ${volumeHash(vol)})`)
}

// 4. huellas de referencia (cualquier cambio del motor las mueve)
{
  console.log('\n== huellas de referencia ==')
  const now: Record<string, string> = {}
  for (const [k, v] of Object.entries(referenceRecipes())) now[k] = volumeHash(runRecipe(v.recipe).volume())
  if (process.argv.includes('--update-golden')) { fs.writeFileSync(GOLDEN, JSON.stringify(now, null, 2) + '\n'); console.log(`  golden.json reescrito con ${Object.keys(now).length} huellas`) }
  else {
    const gold = JSON.parse(fs.readFileSync(GOLDEN, 'utf8')) as Record<string, string>
    for (const k of Object.keys(gold)) ok(gold[k] === now[k], `${k.padEnd(20)} ${now[k]} ${gold[k] === now[k] ? '' : `(esperada ${gold[k]}: el motor cambió; si es a propósito, --update-golden y sube la versión de la receta)`}`)
  }
}

// 5. enlace
{
  console.log('\n== enlace ==')
  const { recipe } = referenceRecipes()['mitosis/pinceladas']
  const link = encodeRecipe(recipe), back = decodeRecipe(link)
  ok(!!back && JSON.stringify(back) === JSON.stringify(recipe), `enlace de ${link.length} caracteres: ida y vuelta exacta (${recipe.strokes.length} pinceladas, ${recipe.knobs.length} giros de perilla; mundo ${WORLD}×${WORLD})`)
  ok(volumeHash(runRecipe(back!).volume()) === volumeHash(runRecipe(recipe).volume()), 'la reproducción desde el enlace da la misma pila')
}
console.log(fails ? `\n${fails} FALLAS` : '\ntodo en orden')
process.exit(fails ? 1 : 0)
