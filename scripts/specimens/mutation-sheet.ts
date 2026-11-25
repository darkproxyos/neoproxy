// Hoja de mutaciones: cada fila es una madre y cada columna una hija con más fuerza.
//   npx tsx scripts/specimens/mutation-sheet.ts <salida.png> [--res 72] [--strengths 0,0.2,0.4,0.7,1,1.5]
//   (las madres salen del pool actual: familias indicadas con --fam a,b,c)
import fs from 'node:fs'
import sharp from 'sharp'
import { FAMILY_COLOR, buildField, type Family } from '../../lib/specimens/families'
import { resolveGenome, type Genome } from '../../lib/specimens/genome'
import { sampleGrid, polygonize } from '../../lib/specimens/polygonize'
import { analyze, orientForPrint, DEFAULT_SIZE_MM } from '../../lib/specimens/analyze'
import { renderMesh } from './raster'

const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d }
const RES = Number(arg('res', '72'))
const strengths = arg('strengths', '0,0.2,0.4,0.7,1,1.5').split(',').map(Number)
const fams = arg('fam', 'dla,flow,vessel,symbiosis,filigree,reaction').split(',') as Family[]
const pool = JSON.parse(fs.readFileSync('public/proxygenesis/pool.json', 'utf8'))
const T = 170
const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

async function main() {
  const tiles: { input: Buffer; left: number; top: number }[] = []
  fams.forEach((f, row) => {
    const it = pool.hall.filter((x: { family: Family }) => x.family === f)[2]
    const base: Genome = it.g ?? { f: it.family, s: it.seed }
    const out: string[] = []
    strengths.forEach((k, col) => {
      const g: Genome = k === 0 ? base : { ...base, m: [...(base.m ?? []), [4242 + col, k]] }
      const rec = resolveGenome(g)
      const grid = sampleGrid(buildField(rec), RES)
      const res = analyze(polygonize(grid), grid, DEFAULT_SIZE_MM)
      if (!res) { out.push('vacía'); return }
      out.push(res.metrics.printScore.toFixed(2))
      const raw = renderMesh(orientForPrint(res.mesh, res.metrics.up, DEFAULT_SIZE_MM), { size: T, color: hex(FAMILY_COLOR[f]) })
      tiles.push({ input: Buffer.from(raw), left: col * T, top: row * T })
    })
    console.log(f.padEnd(12), 'score:', out.join(' '))
  })
  const comp = await Promise.all(tiles.map(async (t) => ({ input: await sharp(t.input, { raw: { width: T, height: T, channels: 4 } }).png().toBuffer(), left: t.left, top: t.top })))
  await sharp({ create: { width: strengths.length * T, height: fams.length * T, channels: 4, background: '#05080c' } }).composite(comp).png().toFile(process.argv[2])
}
main()
