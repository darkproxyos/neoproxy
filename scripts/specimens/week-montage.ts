// Montaje de las miniaturas que se ven esta semana (o la semana indicada).
//   npx tsx scripts/specimens/week-montage.ts <salida.png> [--week N]
import fs from 'node:fs'
import sharp from 'sharp'
import { visibleIndices, weekIndex } from '../../lib/specimens/select'

const pool = JSON.parse(fs.readFileSync('public/proxygenesis/pool.json', 'utf8'))
const wi = process.argv.indexOf('--week')
const week = wi >= 0 ? Number(process.argv[wi + 1]) : weekIndex(Date.now())
const idx = visibleIndices(pool.hall.length, week)
const T = 150, C = 10

async function main() {
  const comp = await Promise.all(idx.map(async (i, n) => ({
    input: await sharp(`public/proxygenesis/pool-thumbs/${pool.hall[i].id}.webp`).resize(T, T).png().toBuffer(),
    left: (n % C) * T, top: Math.floor(n / C) * T,
  })))
  await sharp({ create: { width: C * T, height: Math.ceil(idx.length / C) * T, channels: 4, background: '#05080c' } }).composite(comp).png().toFile(process.argv[2])
  console.log(`semana ${week}:`, idx.map((i) => pool.hall[i].family.slice(0, 4)).join(' '))
}
main()
