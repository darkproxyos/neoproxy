// Genera el pool de especímenes experimentales.
//
//   scripts/specimens/build-pool.sh [--count 6000] [--seed 2029] [--res 56] [--hall 400]
//
// Tres etapas, cada una repartida en 4 núcleos (ver build-pool.sh):
//   --shard k --of 4   mide los candidatos i con i % 4 == k
//   --merge 4          junta, elige el salón y escribe pool.json
//   --thumbs k --of 4  renderiza las miniaturas del salón a THUMB_RES
//
// 1. Genera `count` recetas: 60 % algoritmos puros (más de los que dan obra, ver
//    GEN_SHARE) y 40 % cruces (simbiosis) entre ellos.
// 2. Cada una se convierte en malla y se mide (lib/specimens/analyze.ts).
// 3. Se elige un salón de `hall` piezas con cupos según FAMILY_WEIGHT y, dentro
//    de cada grupo, máxima distancia entre formas ponderada por calidad (ver
//    lib/specimens/select.ts): no las `hall` que más puntúan, que serían casi
//    todas iguales.
// 4. Solo el salón se persiste: miniaturas + {familia, semilla, métricas}. No se
//    guarda ningún STL: la receta regenera la malla idéntica en el navegador.
//
// Para renovar el salón: correr con otra --seed (otra tanda de candidatos).

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { FAMILIES, PURE_FAMILIES, FAMILY_COLOR, sampleRecipe, buildField, type Family } from '../../lib/specimens/families'
import { sampleGrid, polygonize } from '../../lib/specimens/polygonize'
import { analyze, orientForPrint, DEFAULT_SIZE_MM, type Metrics } from '../../lib/specimens/analyze'
import { selectHall, groupKey, MIN_PRINT_SCORE, type Candidate } from '../../lib/specimens/select'
import { renderMesh } from './raster'
import { mulberry32 } from '../../lib/specimens/rng'

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? Number(process.argv[i + 1]) : def
}
const COUNT = arg('count', 6000)
const SEED = arg('seed', 2029)
const RES = arg('res', 56)
const HALL = arg('hall', 400)
// resoluciones: se puntúa a RES (barato), se ve a VIEW_RES y se exporta a STL_RES
const VIEW_RES = arg('viewres', 96)
const STL_RES = arg('stlres', 144)
const THUMB_RES = arg('thumbres', 112)
const THUMB = process.argv.includes('--thumbs') ? arg('thumbs', 0) : -1
const SHARD = process.argv.includes('--shard') ? arg('shard', 0) : -1
const OF = arg('of', 1)
const MERGE = process.argv.includes('--merge') ? arg('merge', 0) : 0

// Reparto de candidatas: se generan más de lo que da piezas de obra. Esto solo
// decide QUÉ pares (familia, semilla) se evalúan; la receta depende únicamente
// de la familia y la semilla, así que no afecta a las piezas ya medidas.
const GEN_SHARE: Record<string, number> = {
  vessel: 6, filigree: 5, flow: 3, hilbert: 3, reaction: 2.5,
  tpms: 1.5, mandelbulb: 1.5, voronoi: 1.5, knot: 1.2, kifs: 1.5, network: 1.5, attractor: 1.5, turing: 1.5,
  autopoiesis: 1.5, dla: 1.2, shell: 1.2, twist: 1, colonization: 0.5, automaton: 0.6,
  metaballs: 0.5, harmonics: 0.3, superformula: 0.5, phyllotaxis: 0.5, ruffle: 0.3, mandelbox: 0.4, apollonian: 0.3,
}
const PURE_TOTAL = PURE_FAMILIES.reduce((a, f) => a + (GEN_SHARE[f] ?? 1), 0)
const SYM_SHARE = PURE_TOTAL * (2 / 3) // 40 % de las candidatas son cruces
const familyAt = (i: number): Family => {
  let x = mulberry32(SEED * 131 + i)() * (PURE_TOTAL + SYM_SHARE)
  for (const f of PURE_FAMILIES) { x -= GEN_SHARE[f] ?? 1; if (x <= 0) return f }
  return 'symbiosis'
}
const shardFile = (k: number) => path.join(os.tmpdir(), `np-pool-${SEED}-${COUNT}-${RES}-shard${k}.json`)
const OUT = path.join(process.cwd(), 'public/proxygenesis')
const THUMBS = path.join(OUT, 'pool-thumbs')
const T = 256

const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const r3 = (v: number) => Math.round(v * 1000) / 1000

function compact(m: Metrics) {
  return {
    printScore: r3(m.printScore), richness: r3(m.richness), fitness: r3(m.fitness),
    up: m.up, overhangFrac: r3(m.overhangFrac), contactFrac: r3(m.contactFrac),
    wallP10Mm: Math.round(m.wallP10Mm * 10) / 10, thinFrac: r3(m.thinFrac),
    material: m.material, bboxMm: m.bboxMm.map((v) => Math.round(v * 10) / 10),
    genus: m.genus, tris: m.tris, sizeMm: m.sizeMm, cell: m.cell,
  }
}

function evaluate(family: Family, seed: number, res = RES) {
  const recipe = sampleRecipe(family, seed)
  const grid = sampleGrid(buildField(recipe), res)
  const out = analyze(polygonize(grid), grid, DEFAULT_SIZE_MM)
  return { recipe, res: out }
}

async function thumbsStage() {
  const pool = JSON.parse(fs.readFileSync(path.join(OUT, 'pool.json'), 'utf8'))
  fs.mkdirSync(THUMBS, { recursive: true })
  let n = 0
  for (let i = 0; i < pool.hall.length; i++) {
    if (i % OF !== THUMB) continue
    const it = pool.hall[i]
    // la regeneración a la resolución de puntaje debe coincidir con lo medido
    const check = evaluate(it.family, it.seed)
    if (!check.res || check.res.metrics.tris !== it.m.tris) throw new Error(`regeneración no determinista en ${it.id}`)
    const { res } = evaluate(it.family, it.seed, THUMB_RES)
    if (!res) throw new Error(`no se pudo regenerar ${it.id} a ${THUMB_RES}`)
    const oriented = orientForPrint(res.mesh, res.metrics.up, DEFAULT_SIZE_MM)
    const raw = renderMesh(oriented, { size: T * 2, color: hex(FAMILY_COLOR[it.family as Family]) })
    await sharp(Buffer.from(raw), { raw: { width: T * 2, height: T * 2, channels: 4 } })
      .resize(T, T).webp({ quality: 84 }).toFile(path.join(THUMBS, `${it.id}.webp`))
    if (++n % 10 === 0) console.log(`  [miniaturas ${THUMB}] ${n}`)
  }
  console.log(`miniaturas ${THUMB}: ${n}`)
}

async function main() {
  if (THUMB >= 0) return thumbsStage()

  const cands: Candidate[] = []
  const rejected: Record<string, number> = { 'sin volumen o vacía': 0 }
  const generated: Record<string, number> = {}
  const t0 = Date.now()

  if (MERGE) {
    for (let k = 0; k < MERGE; k++) {
      const c = JSON.parse(fs.readFileSync(shardFile(k), 'utf8'))
      cands.push(...c.cands)
      for (const [f, n] of Object.entries(c.rejected)) rejected[f] = (rejected[f] ?? 0) + (n as number)
      for (const [f, n] of Object.entries(c.generated)) generated[f] = (generated[f] ?? 0) + (n as number)
    }
    console.log(`fusionados ${MERGE} fragmentos: ${cands.length} candidatos medidos`)
  } else {
    const mine = (i: number) => (SHARD < 0 ? true : i % OF === SHARD)
    for (let i = 0; i < COUNT; i++) {
      if (!mine(i)) continue
      const family = familyAt(i)
      const seed = SEED * 100003 + i * 7919
      generated[family] = (generated[family] ?? 0) + 1
      const { recipe, res } = evaluate(family, seed)
      if (!res) { rejected['sin volumen o vacía']++; continue }
      cands.push({ id: `${family.slice(0, 3)}-${seed.toString(36)}`, recipe, metrics: res.metrics })
      if (generated[family] && Object.values(generated).reduce((a, b) => a + b, 0) % 50 === 0) {
        const done = Object.values(generated).reduce((a, b) => a + b, 0)
        const total = SHARD < 0 ? COUNT : Math.ceil(COUNT / OF)
        const el = (Date.now() - t0) / 1000
        console.log(`  [${SHARD < 0 ? 'solo' : SHARD}] ${done}/${total}  ${el.toFixed(0)}s  (faltan ~${((el / done) * (total - done)).toFixed(0)}s)`)
      }
    }
    if (SHARD >= 0) {
      fs.writeFileSync(shardFile(SHARD), JSON.stringify({ cands, rejected, generated }))
      console.log(`fragmento ${SHARD}: ${cands.length} medidos en ${((Date.now() - t0) / 1000).toFixed(0)}s`)
      return
    }
  }

  const viable = cands.filter((c) => c.metrics.printScore >= MIN_PRINT_SCORE)
  const closedCount = cands.filter((c) => c.metrics.closed).length
  const hall = selectHall(cands, HALL)
  console.log(`candidatos medidos: ${cands.length} | cerradas: ${closedCount} | imprimibles (>=${MIN_PRINT_SCORE}): ${viable.length} | salón: ${hall.length}`)

  const byFamily: Record<string, { generated: number; viable: number; hall: number }> = {}
  for (const f of FAMILIES) {
    byFamily[f] = {
      generated: generated[f] ?? 0,
      viable: viable.filter((c) => c.recipe.family === f).length,
      hall: hall.filter((c) => c.recipe.family === f).length,
    }
  }
  const byOp: Record<string, { viable: number; hall: number }> = {}
  for (const c of viable) { const k = groupKey(c); if (k.startsWith('symbiosis:')) byOp[k.slice(10)] = { viable: (byOp[k.slice(10)]?.viable ?? 0) + 1, hall: 0 } }
  for (const c of hall) { const k = groupKey(c); if (k.startsWith('symbiosis:')) byOp[k.slice(10)].hall++ }
  const eliteCells = new Set(viable.map((c) => c.metrics.cell)).size
  const fit = hall.map((c) => c.metrics.fitness).sort((a, b) => a - b)

  fs.mkdirSync(THUMBS, { recursive: true })
  for (const f of fs.readdirSync(THUMBS)) fs.unlinkSync(path.join(THUMBS, f))
  const items = hall.map((c) => ({ id: c.id, family: c.recipe.family, seed: c.recipe.seed, m: compact(c.metrics) }))

  const pool = {
    version: 2,
    generatedAt: new Date().toISOString(),
    seedBase: SEED, res: RES, viewRes: VIEW_RES, stlRes: STL_RES, sizeMm: DEFAULT_SIZE_MM,
    stats: {
      generated: COUNT, measured: cands.length, closed: closedCount, printable: viable.length,
      eliteCells, rejected, byFamily, byOp,
      hallFitness: { min: r3(fit[0]), median: r3(fit[Math.floor(fit.length / 2)]), max: r3(fit[fit.length - 1]) },
    },
    hall: items,
  }
  fs.writeFileSync(path.join(OUT, 'pool.json'), JSON.stringify(pool))
  console.log(`pool.json: ${(fs.statSync(path.join(OUT, 'pool.json')).size / 1024).toFixed(0)} KB (miniaturas: etapa --thumbs)`)
  console.log(`total ${((Date.now() - t0) / 1000).toFixed(0)}s`)
}

main()
