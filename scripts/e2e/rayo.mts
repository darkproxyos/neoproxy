// @ts-nocheck — Playwright no es dependencia del repo: se importa en caliente y no se tipa aquí.
//
// RAYO de punta a punta, en Chromium:
//   1. la descarga crece, toca tierra y aparecen sus números (pasos, canal, dimensión)
//   2. CONGELAR EN PIEZA: STL cerrado y manifold, apoyado en z = 0
//   3. el enlace al rayo lo reconstruye igual (mismos pasos, misma dimensión, mismos triángulos)
//   4. MODO REEL en un teléfono: 9:16, por encima de todo, recorre todas las fases
//
//   npm run dev  (o next start)  y, en otra terminal:
//   npx tsx scripts/e2e/rayo.mts [--base http://localhost:3000]
import fs from 'fs'
import os from 'os'
import path from 'path'
import { createRequire } from 'module'

const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d }
const BASE = arg('base', 'http://localhost:3000')
let chromium
try { ({ chromium } = createRequire(import.meta.url)('playwright')) } catch { console.error('Falta Playwright: npm i -D playwright && npx playwright install chromium'); process.exit(2) }
let fails = 0
const ok = (cond: boolean, msg: string) => { console.log(`${cond ? '  ok ' : '  FALLA'} ${msg}`); if (!cond) fails++ }
const NOISE = /socket|WebSocket|:4000|status of 500|status of 404|ERR_TUNNEL|authjs|auth\//i
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rayo-e2e-'))
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] })
async function open(ctxOpts = {}, url = `${BASE}/rayo`) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true, ...ctxOpts })
  const page = await ctx.newPage(); const errs: string[] = []
  page.on('pageerror', (e) => { if (!NOISE.test(e.message)) errs.push(e.message.slice(0, 160)) })
  page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) errs.push(m.text().slice(0, 160)) })
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' }).catch(() => {})
  return { ctx, page, errs }
}
const stat = (p, k) => p.evaluate((k) => { for (const d of document.querySelectorAll('div')) if (d.children.length === 2 && d.children[0].textContent === k) return d.children[1].textContent; return null }, k)
const struck = (p) => p.waitForFunction(() => /IMPACTO · \d+ pasos/.test(document.body.innerText), null, { timeout: 90000 })
const measured = (p) => p.waitForFunction(() => { for (const d of document.querySelectorAll('div')) if (d.children.length === 2 && d.children[0].textContent === 'TRIÁNGULOS') return d.children[1].textContent !== '…'; return false }, null, { timeout: 120000 })
function stlCheck(file: string) {
  const b = fs.readFileSync(file), n = b.readUInt32LE(80)
  const ids = new Map(), edges = new Map(); let zmin = Infinity
  const id = (k) => { if (!ids.has(k)) ids.set(k, ids.size); return ids.get(k) }
  for (let t = 0; t < n; t++) {
    const o = 84 + 50 * t + 12, v = [0, 1, 2].map((j) => { zmin = Math.min(zmin, b.readFloatLE(o + 12 * j + 8)); return id(b.toString('hex', o + 12 * j, o + 12 * j + 12)) })
    for (let j = 0; j < 3; j++) { const a = v[j], c = v[(j + 1) % 3], e = a < c ? `${a}_${c}` : `${c}_${a}`; edges.set(e, (edges.get(e) || 0) + 1) }
  }
  let bad = 0; for (const c of edges.values()) if (c !== 2) bad++
  return { tris: n, bad, zmin, size: b.length === 84 + 50 * n }
}

console.log('\n== una descarga ==')
{
  const { ctx, page: p, errs } = await open()
  await p.waitForSelector('canvas')
  await p.waitForFunction(() => /DESCARGA · \d+ pasos/.test(document.body.innerText), null, { timeout: 60000 }); ok(true, 'la descarga crece')
  await struck(p)
  const pasos = await stat(p, 'PASOS'), canal = await stat(p, 'CANAL PRINCIPAL'), dim = await stat(p, 'DIMENSIÓN (CAJAS)')
  ok(!!pasos && pasos !== '…' && /\d/.test(dim ?? ''), `toca tierra: ${pasos} pasos, canal de ${canal}, dimensión ${dim}`)
  await p.locator('button', { hasText: 'SIN SONIDO' }).click(); await p.waitForTimeout(300)
  await p.locator('button', { hasText: 'CONGELAR EN PIEZA' }).click(); await measured(p)
  const tris = await stat(p, 'TRIÁNGULOS')
  ok(await stat(p, 'PIEZAS') === '1', `pieza: ${await stat(p, 'MEDIDAS')}, ${tris} triángulos, puntaje ${await stat(p, 'PUNTAJE DE IMPRESIÓN')}`)
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 180000 }), p.locator('button', { hasText: 'DESCARGAR STL' }).click()])
  const f = path.join(tmp, 'rayo.stl'); await dl.saveAs(f); const c = stlCheck(f)
  ok(c.size && c.bad === 0 && Math.abs(c.zmin) < 1e-3, `STL ${c.tris} triángulos, aristas no manifold ${c.bad}, z mínima ${c.zmin.toFixed(4)}`)
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'])
  await p.locator('button', { hasText: 'COPIAR ENLACE' }).click(); await p.waitForTimeout(300)
  const link = await p.evaluate(() => navigator.clipboard.readText()); ok(/\/rayo#y=2\.5,1,0\.65,6,1,pieza$/.test(link), `enlace: ${link.replace(BASE, '')}`)
  await p.locator('button', { hasText: 'OTRO RAYO' }).click(); await struck(p)
  ok(await stat(p, 'PASOS') !== pasos, `otro rayo es distinto (${await stat(p, 'PASOS')} pasos)`)
  ok(errs.length === 0, `sin errores en consola${errs.length ? ': ' + errs.join(' | ') : ''}`)
  await ctx.close()
  const o2 = await open({}, link)
  await struck(o2.page); await measured(o2.page)
  ok(await stat(o2.page, 'PASOS') === pasos && await stat(o2.page, 'DIMENSIÓN (CAJAS)') === dim && await stat(o2.page, 'TRIÁNGULOS') === tris, `el enlace reconstruye el mismo rayo y la misma pieza (${pasos} pasos, ${tris} triángulos)`)
  await o2.ctx.close()
}

console.log('\n== modo reel en un teléfono ==')
{
  const { ctx, page: p, errs } = await open({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  await p.waitForSelector('canvas'); await struck(p)
  ok(await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 0, 'sin desborde horizontal en 412 px')
  await p.evaluate(() => window.scrollTo(0, 400))
  await p.locator('button', { hasText: 'MODO REEL' }).click(); await p.waitForTimeout(1000)
  const box = await p.evaluate(() => { const r = document.querySelector('.ry-reel > div').getBoundingClientRect(); const hit = [[innerWidth / 2, innerHeight / 2], [innerWidth - 30, 25], [innerWidth - 40, innerHeight - 30]].every(([x, y]) => document.elementFromPoint(x, y)?.closest('.ry-reel')); return [r.width, r.height, r.top, hit ? 1 : 0] })
  ok(Math.abs(box[0] / box[1] - 9 / 16) < 0.02 && box[2] >= 0 && box[3] === 1, `reel en 9:16 dentro de la pantalla y por encima de todo (${box[0].toFixed(0)}×${box[1].toFixed(0)})`)
  for (const ph of ['descarga', 'impacto', 'pieza', 'fin']) await p.waitForFunction((ph) => document.querySelector('.ry-reel')?.getAttribute('data-phase') === ph, ph, { timeout: 90000 })
  ok(true, 'recorre título → descarga → impacto → pieza → cierre')
  await p.locator('button', { hasText: 'SALIR' }).click(); await p.waitForTimeout(300)
  ok(await p.locator('.ry-reel').count() === 0, 'SALIR vuelve a la página')
  ok(errs.length === 0, `sin errores en consola${errs.length ? ': ' + errs.join(' | ') : ''}`)
  await ctx.close()
}

await browser.close()
console.log(fails ? `\n${fails} fallas` : '\ntodo en orden')
process.exit(fails ? 1 : 0)
