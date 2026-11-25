// Pares madre -> hija (o madre A x madre B -> hija) con las miniaturas reales.
//   npx tsx scripts/specimens/lineage-montage.ts <salida.png> [--kind mutante|cruce] [--n 12]
import fs from 'node:fs'
import sharp from 'sharp'

const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d }
const kind = arg('kind', 'mutante'), N = Number(arg('n', '12'))
const pool = JSON.parse(fs.readFileSync('public/proxygenesis/pool.json', 'utf8'))
type It = { id: string; kind?: string; parents?: string[]; family: string }
const byId = new Map<string, It>(pool.hall.map((h: It) => [h.id, h]))
const T = 150
const thumb = (id: string) => `public/proxygenesis/pool-thumbs/${id}.webp`

async function main() {
  const kids = (pool.hall as It[]).filter((h) => h.kind === kind && h.parents?.every((p) => fs.existsSync(thumb(p)))).slice(0, N)
  const cols = kind === 'cruce' ? 3 : 2
  const comp: sharp.OverlayOptions[] = []
  for (let r = 0; r < kids.length; r++) {
    const ids = [...kids[r].parents!, kids[r].id]
    for (let c = 0; c < ids.length; c++) comp.push({ input: await sharp(thumb(ids[c])).resize(T, T).png().toBuffer(), left: c * T + (c === ids.length - 1 ? 24 : 0), top: r * T })
  }
  const per = 6, rows = Math.ceil(kids.length / per)
  // varias parejas por fila de la hoja
  const W = (cols * T + 24 + 16) * per
  const out = comp.map((o, i) => {
    const row = Math.floor(i / cols), pairCol = row % per, pairRow = Math.floor(row / per)
    return { ...o, left: (o.left as number) + pairCol * (cols * T + 40), top: pairRow * T }
  })
  await sharp({ create: { width: W, height: rows * T, channels: 4, background: '#05080c' } }).composite(out).png().toFile(process.argv[2])
  console.log(kids.map((k) => `${k.parents!.map((p) => byId.get(p)?.family.slice(0, 4)).join('x')}->${k.family.slice(0, 4)}`).join('  '))
}
main()
