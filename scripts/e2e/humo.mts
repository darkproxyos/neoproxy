// @ts-nocheck — Playwright no es dependencia del repo: se importa en caliente y no se tipa aquí.
//
// HUMO SÓLIDO de punta a punta, en Chromium:
//   1. el humo corre (el contador avanza) y no hay errores en consola
//   2. CONGELAR produce una pieza medida; el STL descargado es una malla cerrada y manifold en z = 0
//   3. el enlace a un instante reconstruye la misma pieza (mismos triángulos)
//   4. MODO REEL ocupa la pantalla en 9:16, llega al sólido y al cierre
//   5. en un teléfono no hay desborde horizontal
//
//   npm run dev  (o next start)  y, en otra terminal:
//   npx tsx scripts/e2e/humo.mts [--base http://localhost:3000] [--shots carpeta]
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
const NOISE = /socket|WebSocket|:4000|status of 500|ERR_TUNNEL|authjs|auth\//i
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'humo-e2e-'))
const shot = async (p, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, name) }) } }
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })

async function open(ctxOpts = {}, url = `${BASE}/humo`) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true, ...ctxOpts })
  const page = await ctx.newPage(); const errs: string[] = []
  page.on('pageerror', (e) => { if (!NOISE.test(e.message)) errs.push(e.message.slice(0, 160)) })
  page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) errs.push(m.text().slice(0, 160)) })
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('canvas'); await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' }).catch(() => {})
  return { ctx, page, errs }
}
const pct = (p) => p.evaluate(() => { const t = document.body.innerText; if (/FIN DEL TRAMO/.test(t)) return 100; const m = t.match(/t = [\d,]+ · (\d+) %/); return m ? +m[1] : -1 })
const stat = (p, k) => p.evaluate((k) => { for (const d of document.querySelectorAll('div')) if (d.children.length === 2 && d.children[0].textContent === k) return d.children[1].textContent; return null }, k)
const frozen = (p) => p.waitForFunction(() => /CONGELADO/.test(document.body.innerText) && !/TRIÁNGULOS\s*…/.test(document.body.innerText), null, { timeout: 120000 })

function stlCheck(file: string) {
  const b = fs.readFileSync(file), n = b.readUInt32LE(80)
  const key = (o) => b.toString("hex", o, o + 12) // bits exactos: redondear fundiría vértices vecinos distintos
  const ids = new Map(), edges = new Map(); let zmin = Infinity
  const id = (k) => { if (!ids.has(k)) ids.set(k, ids.size); return ids.get(k) }
  for (let t = 0; t < n; t++) {
    const o = 84 + 50 * t + 12, v = [0, 1, 2].map((j) => { zmin = Math.min(zmin, b.readFloatLE(o + 12 * j + 8)); return id(key(o + 12 * j)) })
    for (let j = 0; j < 3; j++) { const a = v[j], c = v[(j + 1) % 3], e = a < c ? `${a}_${c}` : `${c}_${a}`; edges.set(e, (edges.get(e) || 0) + 1) }
  }
  let bad = 0; for (const c of edges.values()) if (c !== 2) bad++
  return { tris: n, bad, zmin, size: b.length === 84 + 50 * n }
}

// ---- 1, 2 y 3 por experimento ---------------------------------------------------------------
for (const [label, id] of [['SALTO DE RANA', 'leapfrog'], ['CHOQUE OBLICUO', 'oblicuo'], ['NUDO', 'nudo']]) {
  console.log(`\n== ${label} ==`)
  const { ctx, page: p, errs } = await open()
  if (id !== 'leapfrog') await p.locator('button', { hasText: label }).first().click()
  const t0 = Date.now(); await p.waitForTimeout(2500); const a0 = await pct(p); await p.waitForTimeout(4000); const a1 = await pct(p)
  ok(a1 > a0 && a1 > 0, `el humo avanza (${a0} % → ${a1} % en ${((Date.now() - t0) / 1000).toFixed(0)} s)`)
  await p.waitForFunction(() => { const t = document.body.innerText, m = t.match(/· (\d+) %/); return /FIN DEL TRAMO/.test(t) || (m && +m[1] >= 55) }, null, { timeout: 180000 })
  await shot(p, `humo-${id}-corriendo.png`)
  await p.locator('button', { hasText: 'CONGELAR ESTE INSTANTE' }).click()
  await frozen(p); await p.waitForTimeout(1200)
  await shot(p, `humo-${id}-congelado.png`)
  const tris = await stat(p, 'TRIÁNGULOS'), score = await stat(p, 'PUNTAJE DE IMPRESIÓN'), sueltas = await stat(p, 'PARTES SUELTAS')
  ok(!!tris && tris !== '…', `pieza medida: ${tris} triángulos, puntaje ${score}, partes sueltas ${sueltas}`)
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 180000 }), p.locator('button', { hasText: 'DESCARGAR STL' }).click()])
  const f = path.join(tmp, `${id}.stl`); await dl.saveAs(f)
  const c = stlCheck(f)
  ok(c.size && c.bad === 0 && Math.abs(c.zmin) < 1e-3, `STL ${c.tris} triángulos, aristas no manifold ${c.bad}, z mínima ${c.zmin.toFixed(4)}`)
  // enlace a este instante → misma pieza
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'])
  await p.locator('button', { hasText: 'COPIAR ENLACE' }).click(); await p.waitForTimeout(300)
  const link = await p.evaluate(() => navigator.clipboard.readText())
  ok(/\/humo#h=/.test(link), `enlace: ${link.replace(BASE, '')}`)
  ok(errs.length === 0, `sin errores en consola${errs.length ? ': ' + errs.join(' | ') : ''}`)
  await ctx.close()
  const o2 = await open({}, link)
  await frozen(o2.page); await o2.page.waitForTimeout(500)
  const tris2 = await stat(o2.page, 'TRIÁNGULOS')
  ok(tris2 === tris, `el enlace reconstruye la misma pieza (${tris2} = ${tris})`)
  await o2.ctx.close()
}

// ---- 4: modo reel en un teléfono -----------------------------------------------------------
console.log('\n== MODO REEL ==')
{
  const { ctx, page: p, errs } = await open({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  ok(over <= 0, `sin desborde horizontal en 412 px (${over})`)
  await shot(p, 'humo-movil.png')
  await p.evaluate(() => window.scrollTo(0, 400))
  await p.locator('button', { hasText: 'MODO REEL' }).click()
  await p.waitForTimeout(1500)
  const box = await p.evaluate(() => { const r = document.querySelector('.humo-reel > div').getBoundingClientRect(); const hit = [[innerWidth / 2, innerHeight / 2], [innerWidth - 30, 25], [innerWidth - 40, innerHeight - 30]].every(([x, y]) => document.elementFromPoint(x, y)?.closest('.humo-reel')); return [r.width, r.height, r.top, hit ? 1 : 0] })
  ok(Math.abs(box[0] / box[1] - 9 / 16) < 0.02 && box[2] >= 0 && box[2] + box[1] <= 916 && box[3] === 1, `reel en 9:16 dentro de la pantalla y por encima de todo (${box[0].toFixed(0)}×${box[1].toFixed(0)}, arriba ${box[2].toFixed(0)})`)
  await shot(p, 'humo-reel-titulo.png')
  const phase = (ph) => p.waitForFunction((ph) => document.querySelector('.humo-reel')?.getAttribute('data-phase') === ph, ph, { timeout: 240000 })
  await phase('humo'); await p.waitForTimeout(4000); await shot(p, 'humo-reel-humo.png')
  await phase('solido'); await p.waitForTimeout(2500); await shot(p, 'humo-reel-solido.png')
  await phase('fin'); await p.waitForTimeout(1500); await shot(p, 'humo-reel-fin.png')
  const fin = await p.evaluate(() => getComputedStyle([...document.querySelectorAll('.humo-reel div')].find((d) => d.textContent?.startsWith('HUMO SÓLIDOHumo calculado')) ?? document.body).opacity)
  ok(fin === '1', `llega al cierre (opacidad ${fin})`)
  await p.locator('button', { hasText: 'SALIR' }).click(); await p.waitForTimeout(300)
  ok(await p.locator('.humo-reel').count() === 0, 'SALIR vuelve a la página')
  ok(errs.length === 0, `sin errores en consola${errs.length ? ': ' + errs.join(' | ') : ''}`)
  await ctx.close()
}

await browser.close()
console.log(fails ? `\n${fails} fallas` : '\ntodo en orden')
process.exit(fails ? 1 : 0)
