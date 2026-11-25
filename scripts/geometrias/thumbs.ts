// Para cada geometría: elige la mejor de 40 semillas (aptitud medida) y deja su
// miniatura para el hub y la semilla inicial del explorador.
//   npx tsx scripts/geometrias/thumbs.ts
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { GEOMETRY_FAMILIES, FAMILY_COLOR, buildField, type GeometryFamily } from '../../lib/specimens/families'
import { resolveGenome } from '../../lib/specimens/genome'
import { sampleGrid, polygonize } from '../../lib/specimens/polygonize'
import { analyze, orientForPrint, DEFAULT_SIZE_MM } from '../../lib/specimens/analyze'
import { renderMesh } from '../specimens/raster'

const OUT = path.join(process.cwd(), 'public/geometrias/thumbs')
const T = 320
const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const run = (f: GeometryFamily, seed: number, res: number) => {
  const grid = sampleGrid(buildField(resolveGenome({ f, s: seed })), res)
  return analyze(polygonize(grid), grid, DEFAULT_SIZE_MM, { minFill: 0.003 })
}

async function main() {
  const only = process.argv[2] ? (process.argv[2].split(',') as GeometryFamily[]) : [...GEOMETRY_FAMILIES]
  const file = path.join(process.cwd(), 'lib/specimens/geo-heroes.json')
  const heroes: Record<string, number> = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
  for (const f of only) {
    let best = -1, bestSeed = 1
    for (let i = 0; i < 40; i++) {
      const seed = 1000 + i * 7919
      const r = run(f, seed, 56)
      if (r && r.metrics.fitness > best) { best = r.metrics.fitness; bestSeed = seed }
    }
    heroes[f] = bestSeed
    const r = run(f, bestSeed, 112)!
    const raw = renderMesh(orientForPrint(r.mesh, r.metrics.up, DEFAULT_SIZE_MM), { size: T * 2, color: hex(FAMILY_COLOR[f]) })
    await sharp(Buffer.from(raw), { raw: { width: T * 2, height: T * 2, channels: 4 } }).resize(T, T).webp({ quality: 86 }).toFile(path.join(OUT, `${f}.webp`))
    console.log(f.padEnd(13), 'semilla', bestSeed, 'aptitud', best.toFixed(2))
  }
  fs.writeFileSync(file, JSON.stringify(heroes, null, 2) + '\n')
}
main()
