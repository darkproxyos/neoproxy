// Montaje de las miniaturas que se ven esta semana (o la semana indicada).
//   npx tsx scripts/specimens/week-montage.ts <salida.png> [--week N]
import fs from 'node:fs'
import sharp from 'sharp'
import { visibleIndices, weekIndex } from '../../lib/specimens/select'

const pool = JSON.parse(fs.readFileSync('public/proxygenesis/pool.json', 'utf8'))
const wi = process.argv.indexOf('--week')
const week = wi >= 0 ? Number(process.argv[wi + 1]) : weekIndex(Date.now())
const items = visibleIndices(pool.hall.length, week).map((i) => pool.hall[i] as { id: string; family: string })
const T = 150, C = 10

async function main() {
  const comp = await Promise.all(items.map(async (it, n) => ({
    input: await sharp(`public/proxygenesis/pool-thumbs/${it.id}.webp`).resize(T, T).png().toBuffer(),
    left: (n % C) * T, top: Math.floor(n / C) * T,
  })))
  await sharp({ create: { width: C * T, height: Math.ceil(items.length / C) * T, channels: 4, background: '#05080c' } }).composite(comp).png().toFile(process.argv[2])
  console.log(`semana ${week}:`, items.map((it) => it.family.slice(0, 4)).join(' '))
}
main()
