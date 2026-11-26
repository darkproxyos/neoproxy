// @ts-nocheck — Playwright no es dependencia del repo: se importa en caliente y no se tipa aquí.
//
// TRENZA de punta a punta, en Chromium:
//   1. la historia corre sola (danza → trenza → pieza) y la pieza queda medida
//   2. el STL descargado es una malla cerrada y manifold apoyada en z = 0
//   3. el enlace a la pieza la reconstruye igual (mismos triángulos)
//   4. CAOS con una órbita frágil informa cuándo se separan los dos universos
//   5. MODO REEL en un teléfono: 9:16, por encima de todo, recorre todas las fases
//
//   npm run dev  (o next start)  y, en otra terminal:
//   npx tsx scripts/e2e/trenza.mts [--base http://localhost:3000] [--shots carpeta]
import fs from 'fs'
import os from 'os'
import path from 'path'
import { createRequire } from 'module'

const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d }
const BASE = arg('base', 'http://localhost:3000'), SHOTS = arg('shots', '')
let chromium
try { ({ chromium } = createRequire(import.meta.url)('playwright')) } catch { console.error('Falta Playwright: npm i -D playwright && npx playwright install chromium'); process.exit(2) }

let fails = 0
const ok = (cond: boolean, msg: string) => { console.log(`${cond ? '  ok ' : '  FALLA'} ${msg}`); if (!cond) fails++ }
const NOISE = /socket|WebSocket|:4000|status of 500|status of 404|ERR_TUNNEL|authjs|auth\//i
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trenza-e2e-'))
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
const shot = async (loc, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await loc.screenshot({ path: path.join(SHOTS, name) }) } }

async function open(ctxOpts = {}, url = `${BASE}/trenza`) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true, ...ctxOpts })
  const page = await ctx.newPage(); const errs: string[] = []
  page.on('pageerror', (e) => { if (!NOISE.test(e.message)) errs.push(e.message.slice(0, 160)) })
  page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) errs.push(m.text().slice(0, 160)) })
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('canvas'); await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' }).catch(() => {})
  return { ctx, page, errs }
}
const stat = (p, k) => p.evaluate((k) => { for (const d of document.querySelectorAll('div')) if (d.children.length === 2 && d.children[0].textContent === k) return d.children[1].textContent; return null }, k)
const measured = (p, t = 120000) => p.waitForFunction(() => { for (const d of document.querySelectorAll('div')) if (d.children.length === 2 && d.children[0].textContent === 'TRIÁNGULOS') return d.children[1].textContent !== '…'; return false }, null, { timeout: t })
function stlCheck(file: string) {
  const b = fs.readFileSync(file), n = b.readUInt32LE(80)
  const key = (o) => b.toString('hex', o, o + 12)
  const ids = new Map(), edges = new Map(); let zmin = Infinity
  const id = (k) => { if (!ids.has(k)) ids.set(k, ids.size); return ids.get(k) }
  for (let t = 0; t < n; t++) {
    const o = 84 + 50 * t + 12, v = [0, 1, 2].map((j) => { zmin = Math.min(zmin, b.readFloatLE(o + 12 * j + 8)); return id(key(o + 12 * j)) })
    for (let j = 0; j < 3; j++) { const a = v[j], c = v[(j + 1) % 3], e = a < c ? `${a}_${c}` : `${c}_${a}`; edges.set(e, (edges.get(e) || 0) + 1) }
  }
  let bad = 0; for (const c of edges.values()) if (c !== 2) bad++
  return { tris: n, bad, zmin, size: b.length === 84 + 50 * n }
}

// ---- 1, 2, 3 ----
console.log('\n== la historia del ocho ==')
{
  const { ctx, page: p, errs } = await open()
  const vw = p.locator('canvas').first()
  await p.waitForFunction(() => /DANZA · vista desde arriba/.test(document.body.innerText), null, { timeout: 60000 })
  ok(true, 'arranca en la danza'); await p.waitForTimeout(2500); await shot(vw, 'trenza-1-danza.png')
  await p.waitForFunction(() => /TRENZA · el tiempo sube/.test(document.body.innerText), null, { timeout: 60000 })
  ok(true, 'pasa sola a la trenza'); await p.waitForTimeout(3000); await shot(vw, 'trenza-2-trenza.png')
  await p.waitForFunction(() => /\nPIEZA\n/.test(document.body.innerText), null, { timeout: 60000 })
  await measured(p); await p.waitForTimeout(2500); await shot(vw, 'trenza-3-pieza.png')
  const tris = await stat(p, 'TRIÁNGULOS'), piezas = await stat(p, 'PIEZAS'), score = await stat(p, 'PUNTAJE DE IMPRESIÓN')
  ok(!!tris && piezas === '1', `pieza medida: ${tris} triángulos, ${piezas} pieza, puntaje ${score}`)
  ok(await p.evaluate(() => document.body.innerText.includes('(σ₁ σ₂⁻¹)³')), 'muestra la palabra del ocho (σ₁ σ₂⁻¹)³')
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 180000 }), p.locator('button', { hasText: 'DESCARGAR STL' }).click()])
  const f = path.join(tmp, 'ocho.stl'); await dl.saveAs(f); const c = stlCheck(f)
  ok(c.size && c.bad === 0 && Math.abs(c.zmin) < 1e-3, `STL ${c.tris} triángulos, aristas no manifold ${c.bad}, z mínima ${c.zmin.toFixed(4)}`)
  // otra receta y su enlace
  await p.locator('button', { hasText: /^2$/ }).click()
  await p.waitForTimeout(500); await p.locator('button', { hasText: '◆ PIEZA' }).click()
  await p.waitForFunction((t) => { for (const d of document.querySelectorAll('div')) if (d.children.length === 2 && d.children[0].textContent === 'TRIÁNGULOS') return d.children[1].textContent !== '…' && d.children[1].textContent !== t; return false }, tris, { timeout: 120000 })
  const tris2 = await stat(p, 'TRIÁNGULOS')
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'])
  await p.locator('button', { hasText: 'COPIAR ENLACE' }).click(); await p.waitForTimeout(300)
  const link = await p.evaluate(() => navigator.clipboard.readText())
  ok(/\/trenza#t=ocho,2,/.test(link), `enlace: ${link.replace(BASE, '')}`)
  ok(errs.length === 0, `sin errores en consola${errs.length ? ': ' + errs.join(' | ') : ''}`)
  await ctx.close()
  const o2 = await open({}, link)
  await o2.page.waitForFunction(() => /\nPIEZA\n/.test(document.body.innerText), null, { timeout: 90000 }); await measured(o2.page)
  ok(await stat(o2.page, 'TRIÁNGULOS') === tris2, `el enlace reconstruye la misma pieza (${tris2})`)
  await o2.ctx.close()
}

// ---- 4 ----
console.log('\n== caos con anteojos ==')
{
  const { ctx, page: p, errs } = await open()
  await p.locator('button', { hasText: 'ANTEOJOS' }).click()
  await p.waitForTimeout(1500)
  await p.locator('button', { hasText: '✶ CAOS' }).click()
  await p.waitForFunction(() => /Se separan a la vuelta [\d,]+/.test(document.body.innerText), null, { timeout: 120000 })
  const t = await p.evaluate(() => document.body.innerText.match(/Se separan a la vuelta ([\d,]+)/)[1])
  ok(true, `los dos universos se separan a la vuelta ${t}`)
  await p.waitForTimeout(6000); await shot(p.locator('canvas').first(), 'trenza-4-caos.png')
  ok(errs.length === 0, `sin errores en consola${errs.length ? ': ' + errs.join(' | ') : ''}`)
  await ctx.close()
}

// ---- 5 ----
console.log('\n== modo reel en un teléfono ==')
{
  const { ctx, page: p, errs } = await open({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  ok(over <= 0, `sin desborde horizontal en 412 px (${over})`)
  await p.waitForFunction(() => /DANZA · vista desde arriba/.test(document.body.innerText), null, { timeout: 60000 })
  await p.evaluate(() => window.scrollTo(0, 500))
  await p.locator('button', { hasText: 'MODO REEL' }).click(); await p.waitForTimeout(1200)
  const box = await p.evaluate(() => { const r = document.querySelector('.tr-reel > div').getBoundingClientRect(); const hit = [[innerWidth / 2, innerHeight / 2], [innerWidth - 30, 25], [innerWidth - 40, innerHeight - 30]].every(([x, y]) => document.elementFromPoint(x, y)?.closest('.tr-reel')); return [r.width, r.height, r.top, hit ? 1 : 0] })
  ok(Math.abs(box[0] / box[1] - 9 / 16) < 0.02 && box[2] >= 0 && box[3] === 1, `reel en 9:16 dentro de la pantalla y por encima de todo (${box[0].toFixed(0)}×${box[1].toFixed(0)})`)
  const phase = (ph) => p.waitForFunction((ph) => document.querySelector('.tr-reel')?.getAttribute('data-phase') === ph, ph, { timeout: 90000 })
  for (const ph of ['titulo', 'danza', 'trenza', 'pieza', 'caos', 'fin']) {
    await phase(ph); await p.waitForTimeout(ph === 'titulo' ? 800 : ph === 'trenza' ? 4000 : ph === 'caos' ? 7000 : 2500)
    await shot(p, `trenza-reel-${ph}.png`)
  }
  ok(true, 'recorre título → danza → trenza → pieza → caos → cierre')
  await p.locator('button', { hasText: 'SALIR' }).click(); await p.waitForTimeout(300)
  ok(await p.locator('.tr-reel').count() === 0, 'SALIR vuelve a la página')
  ok(errs.length === 0, `sin errores en consola${errs.length ? ': ' + errs.join(' | ') : ''}`)
  await ctx.close()
}

await browser.close()
console.log(fails ? `\n${fails} fallas` : '\ntodo en orden')
process.exit(fails ? 1 : 0)
