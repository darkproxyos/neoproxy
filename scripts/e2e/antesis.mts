// @ts-nocheck — Playwright no es dependencia del repo: se importa en caliente y no se tipa aquí.
//
// ANTESIS de punta a punta, en Chromium:
//   1. la flor se calcula y se verifica (✓ ENGRANA Y GIRA SIN CHOCAR) y gira; MODO REEL 9:16
//   2. el enlace la reconstruye (simetría, semilla, dientes)
//   3. DESCARGAR TODO: un ZIP con 7 STL (cerrados, sobre z = 0) y el JSON de parámetros
//   4. en un teléfono: sin desborde horizontal
//
//   npm run dev  (o next start)  y, en otra terminal:
//   npx tsx scripts/e2e/antesis.mts [--base http://localhost:3000]
import fs from 'fs'
import os from 'os'
import path from 'path'
import { createRequire } from 'module'

const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d }
const BASE = arg('base', 'http://localhost:3000')
let chromium, devices
try { ({ chromium, devices } = createRequire(import.meta.url)('playwright')) } catch { console.error('Falta Playwright: npm i -D playwright && npx playwright install chromium'); process.exit(2) }
let fails = 0
const ok = (c: boolean, m: string) => { console.log(`${c ? '  ok ' : '  FALLA'} ${m}`); if (!c) fails++ }
const skipIntro = () => { try { sessionStorage.setItem('npx-tramo-afuera', '1'); sessionStorage.setItem('npx-tramo-zona', '1') } catch {} }

// ZIP sin compresión → { nombre: bytes }
function unzip(buf: Buffer) {
  const out: Record<string, Buffer> = {}
  let o = 0
  while (buf.readUInt32LE(o) === 0x04034b50) {
    const size = buf.readUInt32LE(o + 18), n = buf.readUInt16LE(o + 26), x = buf.readUInt16LE(o + 28)
    const name = buf.subarray(o + 30, o + 30 + n).toString('utf8')
    out[name] = buf.subarray(o + 30 + n + x, o + 30 + n + x + size)
    o += 30 + n + x + size
  }
  return out
}
function stlCheck(b: Buffer) {
  const n = b.readUInt32LE(80), keys = new Map<string, number>(), E = new Map<string, number>()
  let zmin = Infinity
  const id = (x: number, y: number, z: number) => { const k = `${x.toFixed(5)},${y.toFixed(5)},${z.toFixed(5)}`; if (!keys.has(k)) keys.set(k, keys.size); return keys.get(k) }
  for (let i = 0; i < n; i++) {
    const o = 84 + 50 * i, v: number[] = []
    for (let k = 0; k < 3; k++) { const x = b.readFloatLE(o + 12 + 12 * k), y = b.readFloatLE(o + 16 + 12 * k), z = b.readFloatLE(o + 20 + 12 * k); zmin = Math.min(zmin, z); v.push(id(x, y, z)) }
    for (const [a, c] of [[v[0], v[1]], [v[1], v[2]], [v[2], v[0]]]) { const k = a < c ? `${a}-${c}` : `${c}-${a}`; E.set(k, (E.get(k) ?? 0) + 1) }
  }
  let bad = 0; for (const c of E.values()) if (c !== 2) bad++
  return { n, bad, zmin }
}

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
try {
  console.log('1. la flor')
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true })
  const p = await ctx.newPage(); await p.addInitScript(skipIntro)
  await p.goto(`${BASE}/antesis#s=octa&d=64&f=12&a=1.72&r=1.35&p=fdm&c=neoproxy`, { waitUntil: 'load' })
  await p.waitForFunction(() => /ENGRANA Y GIRA SIN CHOCAR|REVISA/.test(document.body.innerText), null, { timeout: 120000 })
  const txt = await p.evaluate(() => document.body.innerText)
  ok(/✓ ENGRANA Y GIRA SIN CHOCAR/.test(txt), 'verificada en el navegador')
  ok(/Las 24 uniones engranan a la vez/.test(txt), 'las 24 uniones del octaedro engranan a la vez')
  const a0 = Number(await p.$eval('canvas', (c) => c.dataset.angle)); await p.waitForTimeout(800)
  const a1 = Number(await p.$eval('canvas', (c) => c.dataset.angle))
  ok(a1 > a0, `gira (ángulo ${a0.toFixed(2)} → ${a1.toFixed(2)} rad)`)

  await p.getByRole('button', { name: /MODO REEL/ }).click()
  await p.waitForTimeout(4500)
  const r = await p.evaluate(() => { const b = document.querySelector('.an-reel-box')?.getBoundingClientRect(); return { on: !!b, ratio: b ? b.height / b.width : 0, txt: document.querySelector('.an-reel')?.textContent || '' } })
  ok(r.on && Math.abs(r.ratio - 16 / 9) < 0.02 && /ANTESIS/.test(r.txt), `MODO REEL: pantalla 9:16 (${r.ratio.toFixed(3)}) con su título`)
  await p.keyboard.press('Escape'); await p.waitForTimeout(400)
  ok(!(await p.$('.an-reel')), 'Esc sale del reel')

  console.log('2. el enlace')
  await p.goto(`${BASE}/antesis#s=tetra&d=70&f=5&a=1.8&r=1.35&p=resina&c=fucsia`, { waitUntil: 'load' })
  await p.reload({ waitUntil: 'load' })
  await p.waitForFunction(() => /ENGRANA Y GIRA SIN CHOCAR|REVISA/.test(document.body.innerText) && /TETRA/.test(document.body.innerText), null, { timeout: 120000 })
  const t2 = await p.evaluate(() => document.body.innerText)
  ok(/FLOR 5 · TETRA/.test(t2) && /✓ ENGRANA/.test(t2), 'tetraedro, semilla 5, resina: reconstruida y verificada')

  console.log('3. las piezas')
  const t0 = Date.now()
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 180000 }), p.getByRole('button', { name: /DESCARGAR TODO/ }).click()])
  const file = path.join(os.tmpdir(), dl.suggestedFilename()); await dl.saveAs(file)
  const files = unzip(fs.readFileSync(file))
  const stls = Object.keys(files).filter((f) => f.endsWith('.stl'))
  ok(stls.length === 7 && 'antesis-parametros.json' in files, `ZIP en ${((Date.now() - t0) / 1000).toFixed(1)} s: ${stls.length} STL + JSON`)
  for (const f of stls) { const c = stlCheck(files[f]); ok(c.bad === 0 && Math.abs(c.zmin) < 1e-3, `${f}: ${c.n} triángulos, cerrado, apoyado en z = 0`) }
  const j = JSON.parse(files['antesis-parametros.json'].toString('utf8'))
  ok(j.verificacion?.ok === true && j.piezas.every((q) => q.archivo in files), 'el JSON trae la verificación y nombra los archivos del ZIP')
  await ctx.close()

  console.log('4. en un teléfono')
  const m = await browser.newContext({ ...devices['Pixel 7'] }); const q = await m.newPage(); await q.addInitScript(skipIntro)
  await q.goto(`${BASE}/antesis`, { waitUntil: 'load' })
  await q.waitForFunction(() => /ENGRANA Y GIRA SIN CHOCAR|REVISA/.test(document.body.innerText), null, { timeout: 120000 })
  const over = await q.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  ok(over <= 0, `sin desborde horizontal (${over} px)`)
  await m.close()
} finally { await browser.close() }
console.log(fails ? `\n${fails} FALLAS` : '\nTodo bien.')
process.exit(fails ? 1 : 0)
