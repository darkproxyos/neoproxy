// Hoja de contactos para revisar a ojo los algoritmos.
//
//   npx tsx scripts/specimens/sheet.ts <salida.png> [--fam colonization,shell] [--n 6] [--res 56] [--seed 7]
//
// Una fila por familia (o las indicadas), `n` semillas por fila; imprime tiempo
// de generación, si la malla salió cerrada y su puntaje de imprimibilidad.

import sharp from 'sharp'
import { FAMILIES, GEOMETRY_FAMILIES, FAMILY_COLOR, sampleRecipe, buildField, type Family } from '../../lib/specimens/families'
import { sampleGrid, polygonize } from '../../lib/specimens/polygonize'
import { analyze, orientForPrint, DEFAULT_SIZE_MM } from '../../lib/specimens/analyze'
import { renderMesh } from './raster'

const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d }
const out = process.argv[2]
const fams = (arg('fam', '') ? arg('fam', '').split(',') : FAMILIES) as Family[]
const N = Number(arg('n', '6')), RES = Number(arg('res', '56')), SEED = Number(arg('seed', '7'))
const T = 160
const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

async function main() {
  const tiles: { input: Buffer; left: number; top: number }[] = []
  fams.forEach((f, row) => {
    const times: number[] = [], scores: string[] = []
    for (let i = 0; i < N; i++) {
      const seed = SEED * 100003 + i * 7919 + row * 13
      const t0 = Date.now()
      const rec = sampleRecipe(f, seed)
      const grid = sampleGrid(buildField(rec), RES)
      const res = analyze(polygonize(grid), grid, DEFAULT_SIZE_MM, { minFill: (GEOMETRY_FAMILIES as readonly string[]).includes(f) ? 0.003 : 0.015 })
      times.push(Date.now() - t0)
      if (!res) { scores.push('vacía'); continue }
      scores.push(`${res.metrics.printScore.toFixed(2)}${res.metrics.closed ? '' : '!'}`)
      const raw = renderMesh(orientForPrint(res.mesh, res.metrics.up, DEFAULT_SIZE_MM), { size: T, color: hex(FAMILY_COLOR[f]) })
      tiles.push({ input: Buffer.from(raw), left: i * T, top: row * T })
    }
    console.log(f.padEnd(13), 'ms:', times.join(' ').padEnd(34), 'score:', scores.join(' '))
  })
  const base = sharp({ create: { width: N * T, height: fams.length * T, channels: 4, background: '#05080c' } })
  const comp = await Promise.all(tiles.map(async (t) => ({
    input: await sharp(t.input, { raw: { width: T, height: T, channels: 4 } }).png().toBuffer(), left: t.left, top: t.top,
  })))
  await base.composite(comp).png().toFile(out)
  console.log('->', out)
}
main()
