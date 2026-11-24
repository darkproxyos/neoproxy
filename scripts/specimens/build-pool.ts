// Genera el pool de especímenes experimentales.
//
//   npx tsx scripts/specimens/build-pool.ts [--count 1000] [--seed 2026] [--res 56] [--hall 150]
//
// 1. Genera `count` recetas repartidas parejo entre las 8 familias.
// 2. Cada una se convierte en malla y se mide (lib/specimens/analyze.ts).
// 3. Se elige un salón de `hall` piezas con cuota pareja por familia y, dentro
//    de cada una, máxima distancia entre formas ponderada por calidad (ver
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
import { FAMILIES, FAMILY_COLOR, sampleRecipe, buildField, type Family } from '../../lib/specimens/families'
import { sampleGrid, polygonize } from '../../lib/specimens/polygonize'
import { analyze, orientForPrint, DEFAULT_SIZE_MM, type Metrics } from '../../lib/specimens/analyze'
import { selectHall, MIN_PRINT_SCORE, type Candidate } from '../../lib/specimens/select'
import { renderMesh } from './raster'

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? Number(process.argv[i + 1]) : def
}
const COUNT = arg('count', 1000)
const SEED = arg('seed', 2026)
const RES = arg('res', 56)
const HALL = arg('hall', 150)
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

function evaluate(family: Family, seed: number) {
  const recipe = sampleRecipe(family, seed)
  const grid = sampleGrid(buildField(recipe), RES)
  const res = analyze(polygonize(grid), grid, DEFAULT_SIZE_MM)
  return { recipe, res }
}

async function main() {
  fs.mkdirSync(THUMBS, { recursive: true })
  for (const f of fs.readdirSync(THUMBS)) fs.unlinkSync(path.join(THUMBS, f))

  // cache de lo ya medido: ajustar solo la selección no obliga a remedir las 1000
  const cacheFile = path.join(os.tmpdir(), `np-pool-${SEED}-${COUNT}-${RES}.json`)
  const reuse = process.argv.includes('--reuse') && fs.existsSync(cacheFile)
  const cands: Candidate[] = []
  const rejected: Record<string, number> = { 'sin volumen o vacía': 0 }
  const generated: Record<string, number> = {}
  const t0 = Date.now()

  if (reuse) {
    const c = JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
    cands.push(...c.cands); Object.assign(rejected, c.rejected); Object.assign(generated, c.generated)
    console.log(`usando cache: ${cands.length} candidatos medidos`)
  }
  for (let i = 0; i < (reuse ? 0 : COUNT); i++) {
    const family = FAMILIES[i % FAMILIES.length]
    const seed = SEED * 100003 + i * 7919
    generated[family] = (generated[family] ?? 0) + 1
    const { recipe, res } = evaluate(family, seed)
    if (!res) { rejected['sin volumen o vacía']++; continue }
    cands.push({ id: `${family.slice(0, 3)}-${seed.toString(36)}`, recipe, metrics: res.metrics })
    if ((i + 1) % 50 === 0) {
      const el = (Date.now() - t0) / 1000
      console.log(`  ${i + 1}/${COUNT}  ${el.toFixed(0)}s  (faltan ~${((el / (i + 1)) * (COUNT - i - 1)).toFixed(0)}s)`)
    }
  }

  if (!reuse) fs.writeFileSync(cacheFile, JSON.stringify({ cands, rejected, generated }))
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
  const eliteCells = new Set(viable.map((c) => c.metrics.cell)).size
  const fit = hall.map((c) => c.metrics.fitness).sort((a, b) => a - b)

  // miniaturas del salón (se regenera la malla: nada se guarda en memoria)
  const items = []
  for (let n = 0; n < hall.length; n++) {
    const c = hall[n]
    const { res } = evaluate(c.recipe.family, c.recipe.seed)
    if (!res) throw new Error(`no se pudo regenerar ${c.id}`)
    if (res.metrics.tris !== c.metrics.tris) throw new Error(`regeneración no determinista en ${c.id}`)
    const oriented = orientForPrint(res.mesh, res.metrics.up, DEFAULT_SIZE_MM)
    const raw = renderMesh(oriented, { size: T * 2, color: hex(FAMILY_COLOR[c.recipe.family]) })
    await sharp(Buffer.from(raw), { raw: { width: T * 2, height: T * 2, channels: 4 } })
      .resize(T, T).webp({ quality: 82 }).toFile(path.join(THUMBS, `${c.id}.webp`))
    items.push({ id: c.id, family: c.recipe.family, seed: c.recipe.seed, m: compact(c.metrics) })
    if ((n + 1) % 25 === 0) console.log(`  miniaturas ${n + 1}/${hall.length}`)
  }

  const pool = {
    version: 1,
    generatedAt: new Date().toISOString(),
    seedBase: SEED, res: RES, sizeMm: DEFAULT_SIZE_MM,
    stats: {
      generated: COUNT, measured: cands.length, closed: closedCount, printable: viable.length,
      eliteCells, rejected, byFamily,
      hallFitness: { min: r3(fit[0]), median: r3(fit[Math.floor(fit.length / 2)]), max: r3(fit[fit.length - 1]) },
    },
    hall: items,
  }
  fs.writeFileSync(path.join(OUT, 'pool.json'), JSON.stringify(pool))
  console.log(`pool.json: ${(fs.statSync(path.join(OUT, 'pool.json')).size / 1024).toFixed(0)} KB | miniaturas: ${fs.readdirSync(THUMBS).length}`)
  console.log(`total ${((Date.now() - t0) / 1000).toFixed(0)}s`)
}

main()
