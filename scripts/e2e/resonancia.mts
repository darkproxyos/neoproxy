// @ts-nocheck — Playwright no es dependencia del repo: se importa en caliente y no se tipa aquí.
//
// RESONANCIA y el hub FENÓMENOS, en Chromium:
//   1. la arena se junta en las líneas quietas; tocar una resonancia cambia la nota
//   2. PLACA y COLUMNA: STL cerrado y manifold, apoyado en z = 0
//   3. el enlace a una PLACA la reconstruye igual (mismos triángulos)
//   4. MODO REEL en un teléfono: 9:16, por encima de todo, recorre todas las fases
//   5. /fenomenos enlaza los fenómenos de la serie, con sus imágenes, y el menú lleva a él
//
//   npm run dev  (o next start)  y, en otra terminal:
//   npx tsx scripts/e2e/resonancia.mts [--base http://localhost:3000]
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
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'resonancia-e2e-'))
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] })
async function open(ctxOpts = {}, url = `${BASE}/resonancia`) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true, ...ctxOpts })
  const page = await ctx.newPage(); const errs: string[] = []
  page.on('pageerror', (e) => { if (!NOISE.test(e.message)) errs.push(e.message.slice(0, 160)) })
  page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) errs.push(m.text().slice(0, 160)) })
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' }).catch(() => {})
  return { ctx, page, errs }
}
const stat = (p, k) => p.evaluate((k) => { for (const d of document.querySelectorAll('div')) if (d.children.length === 2 && d.children[0].textContent === k) return d.children[1].textContent; return null }, k)
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
const nodesPct = (p) => p.evaluate(() => +(document.body.innerText.match(/arena en las líneas quietas: (\d+) %/)?.[1] ?? -1))
const download = async (p, name) => { const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 180000 }), p.locator('button', { hasText: 'DESCARGAR STL' }).click()]); const f = path.join(tmp, name); await dl.saveAs(f); return stlCheck(f) }

console.log('\n== la arena y las notas ==')
{
  const { ctx, page: p, errs } = await open()
  await p.waitForSelector('canvas'); await p.waitForTimeout(4000)
  const n0 = await nodesPct(p); ok(n0 > 60, `en la primera resonancia la arena se junta en las líneas (${n0} %)`)
  await p.locator('button[title^="Modo 14"]').click(); await p.waitForTimeout(1500)
  ok(await p.evaluate(() => /517\s*Hz/.test(document.body.innerText)), 'tocar el modo 14 lleva a 517 Hz')
  await p.waitForTimeout(4000); const n1 = await nodesPct(p); ok(n1 > 60, `la arena dibuja la nueva figura (${n1} %)`)
  await p.locator('button', { hasText: 'SIN SONIDO' }).click(); await p.waitForTimeout(500)
  ok(await p.locator('button', { hasText: '♪ SONIDO' }).count() === 1, 'el sonido se enciende')
  await p.locator('button', { hasText: 'VIBRACIÓN' }).click(); await p.waitForTimeout(500)
  await p.locator('button', { hasText: '◆ PLACA' }).click()
  await p.waitForFunction(() => /CERRADA/.test(document.body.innerText), null, { timeout: 120000 })
  ok(await stat(p, 'CERRADA') === 'sí', `placa: ${await stat(p, 'MEDIDAS')}, ${await stat(p, 'TRIÁNGULOS')} triángulos`)
  const hashP = await p.evaluate(() => document.querySelector('[data-piece-hash]')?.getAttribute('data-piece-hash'))
  const c1 = await download(p, 'placa.stl'); ok(c1.size && c1.bad === 0 && Math.abs(c1.zmin) < 1e-3, `STL de la placa: ${c1.tris} triángulos, aristas no manifold ${c1.bad}, z mínima ${c1.zmin.toFixed(3)}`)
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'])
  await p.locator('button', { hasText: 'COPIAR ENLACE' }).click(); await p.waitForTimeout(300)
  const link = await p.evaluate(() => navigator.clipboard.readText()); ok(/#r=centro,517\.\d{3},\d+,placa,/.test(link), `enlace: ${link.replace(BASE, '')}`)
  await p.locator('button', { hasText: '▥ COLUMNA' }).click()
  await p.waitForFunction(() => /PUNTAJE DE IMPRESIÓN/.test(document.body.innerText) && !/APILANDO/.test(document.body.innerText), null, { timeout: 120000 })
  ok(true, `columna: ${await stat(p, 'MEDIDAS')}, ${await stat(p, 'PIEZAS')} pieza(s), puntaje ${await stat(p, 'PUNTAJE DE IMPRESIÓN')}`)
  const c2 = await download(p, 'columna.stl'); ok(c2.size && c2.bad === 0 && Math.abs(c2.zmin) < 1e-3, `STL de la columna: ${c2.tris} triángulos, aristas no manifold ${c2.bad}`)
  ok(errs.length === 0, `sin errores en consola${errs.length ? ': ' + errs.join(' | ') : ''}`)
  await ctx.close()
  const o2 = await open({}, link)
  await o2.page.waitForFunction(() => !!document.querySelector('[data-piece-hash]')?.getAttribute('data-piece-hash'), null, { timeout: 120000 })
  const hash2 = await o2.page.evaluate(() => document.querySelector('[data-piece-hash]').getAttribute('data-piece-hash'))
  ok(!!hashP && hash2 === hashP, `el enlace reconstruye la misma placa, grano por grano (huella ${hashP} = ${hash2})`)
  await o2.ctx.close()
}

console.log('\n== modo reel en un teléfono ==')
{
  const { ctx, page: p, errs } = await open({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  await p.waitForSelector('canvas'); await p.waitForTimeout(2000)
  ok(await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 0, 'sin desborde horizontal en 412 px')
  await p.evaluate(() => window.scrollTo(0, 400))
  await p.locator('button', { hasText: 'MODO REEL' }).click(); await p.waitForTimeout(1000)
  const box = await p.evaluate(() => { const r = document.querySelector('.rs-reel > div').getBoundingClientRect(); const hit = [[innerWidth / 2, innerHeight / 2], [innerWidth - 30, 25], [innerWidth - 40, innerHeight - 30]].every(([x, y]) => document.elementFromPoint(x, y)?.closest('.rs-reel')); return [r.width, r.height, r.top, hit ? 1 : 0] })
  ok(Math.abs(box[0] / box[1] - 9 / 16) < 0.02 && box[2] >= 0 && box[3] === 1, `reel en 9:16 dentro de la pantalla y por encima de todo (${box[0].toFixed(0)}×${box[1].toFixed(0)})`)
  for (const ph of ['nota', 'placa', 'columna', 'fin']) await p.waitForFunction((ph) => document.querySelector('.rs-reel')?.getAttribute('data-phase') === ph, ph, { timeout: 90000 })
  ok(true, 'recorre título → notas → placa → columna → cierre')
  await p.locator('button', { hasText: 'SALIR' }).click(); await p.waitForTimeout(300)
  ok(await p.locator('.rs-reel').count() === 0, 'SALIR vuelve a la página')
  ok(errs.length === 0, `sin errores en consola${errs.length ? ': ' + errs.join(' | ') : ''}`)
  await ctx.close()
}

console.log('\n== FENÓMENOS ==')
{
  const { ctx, page: p, errs } = await open({}, `${BASE}/fenomenos`)
  await p.waitForSelector('h1')
  const hrefs = await p.evaluate(() => [...document.querySelectorAll('a.fx-card')].map((a) => a.getAttribute('href')))
  ok(JSON.stringify(hrefs) === JSON.stringify(['/capas', '/humo', '/trenza', '/resonancia', '/rayo']), `cinco fenómenos: ${hrefs.join(' ')}`)
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(1500)
  const imgs = await p.evaluate(() => [...document.querySelectorAll('a.fx-card img')].map((i) => (i as HTMLImageElement).naturalWidth))
  ok(imgs.length === 10 && imgs.every((w) => w > 0), `diez imágenes cargadas (${imgs.join(',')})`)
  const navOk = await p.evaluate(() => [...document.querySelectorAll('a')].some((a) => a.getAttribute('href') === '/umbral' && /FENÓMENOS/.test(a.textContent ?? '')))
  ok(navOk, 'el menú lleva a FENÓMENOS (por el Umbral)')
  const m = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, `${BASE}/fenomenos`)
  await m.page.waitForSelector('h1'); await m.page.waitForTimeout(800)
  ok(await m.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 0, 'sin desborde horizontal en 390 px')
  ok(errs.length === 0 && m.errs.length === 0, `sin errores en consola${errs.length + m.errs.length ? ': ' + [...errs, ...m.errs].join(' | ') : ''}`)
  await m.ctx.close(); await ctx.close()
}

await browser.close()
console.log(fails ? `\n${fails} fallas` : '\ntodo en orden')
process.exit(fails ? 1 : 0)
