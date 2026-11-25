// @ts-nocheck — Playwright no es dependencia del repo: se importa en caliente y no se tipa aquí.
//
// CAPAS de punta a punta, en Chromium:
//   1. pintar y girar la perilla en vivo → la huella de la pila coincide con la del motor en Node
//   2. el enlace compartido reconstruye la misma pieza (mismo id, misma huella)
//   3. una semilla destacada se reproduce igual que en Node
//   4. el STL descargado es una malla cerrada y manifold, apoyada en z = 0
//   5. los controles (reproducir, repetir, capas, formas, base, resina, eventos, vistas) no rompen la página
//
//   npm run dev  (o next start)  y, en otra terminal:
//   npx tsx scripts/e2e/capas.mts [--base http://localhost:3000]
//
// Requiere Playwright con Chromium (npm i -D playwright && npx playwright install chromium).
import fs from 'fs'
import os from 'os'
import path from 'path'
import { createRequire } from 'module'
import { runRecipe, volumeHash } from '../../lib/capas/session'
import { PRESETS, presetRecipe } from '../../lib/capas/presets'

const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d }
const BASE = arg('base', 'http://localhost:3000')
let chromium
try { ({ chromium } = createRequire(import.meta.url)('playwright')) } catch { console.error('Falta Playwright: npm i -D playwright && npx playwright install chromium'); process.exit(2) }

let fails = 0
const ok = (cond: boolean, msg: string) => { console.log(`${cond ? '  ok ' : '  FALLA'} ${msg}`); if (!cond) fails++ }
const NOISE = /socket|WebSocket|:4000|status of 500|ERR_TUNNEL|authjs|auth\//i // ruido ajeno a la página (chat, sesión)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'capas-e2e-'))
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })

async function open(ctxOpts = {}, url = `${BASE}/capas`) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 }, acceptDownloads: true, ...ctxOpts })
  const page = await ctx.newPage(); const errs: string[] = []
  page.on('pageerror', (e) => { if (!NOISE.test(e.message)) errs.push(e.message.slice(0, 140)) })
  page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) errs.push(m.text().slice(0, 140)) })
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('canvas'); await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' }).catch(() => {})
  return { ctx, page, errs }
}
const full = (p) => p.waitForFunction(() => /240\s*\/\s*240/.test(document.body.innerText), null, { timeout: 240000 })
const download = async (p, trigger, name) => { const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 180000 }), trigger.click()]); const f = path.join(tmp, name); await dl.saveAs(f); return f }
const ficha = async (p) => JSON.parse(fs.readFileSync(await download(p, p.locator('button', { hasText: 'RECETA + FICHA' }), `ficha-${Date.now()}.json`), 'utf8'))
const nodeHash = (doc) => volumeHash(runRecipe(doc.receta, doc.pieza.capas_de_simulacion).volume())

// ---- 1 y 2: pintar en vivo, girar la perilla, comparar con Node y reabrir por enlace --------------
for (const law of ['MITOSIS', 'DEFECTOS', 'ESPIRALES']) {
  console.log(`\n== ${law}: pintar, girar la perilla y comparar con Node ==`)
  const { ctx, page: p, errs } = await open()
  await p.locator('[role=tab]', { hasText: law }).click()
  await p.locator('button', { hasText: '×1' }).first().click()
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500)
  const b = await p.locator('canvas').first().boundingBox()
  const knob = p.locator('input.cap-range').nth(1)
  for (let i = 0; i < 5; i++) {
    await p.mouse.move(b.x + b.width * (0.2 + 0.12 * i), b.y + b.height * 0.25); await p.mouse.down()
    await p.mouse.move(b.x + b.width * (0.25 + 0.1 * i), b.y + b.height * 0.7, { steps: 6 }); await p.mouse.up()
    await p.waitForTimeout(250)
    if (i === 1) await knob.fill('0.9', { timeout: 3000 }).catch(() => {})
    if (i === 3) await knob.fill('0.15', { timeout: 3000 }).catch(() => {})
  }
  await full(p); await p.waitForTimeout(3500)
  const doc = await ficha(p)
  ok(doc.receta.strokes.length > 0 && doc.receta.knobs.length === 2, `la receta registró ${doc.receta.strokes.length} pinceladas y ${doc.receta.knobs.length} giros de perilla`)
  ok(nodeHash(doc) === doc.huella_de_la_pila, `huella en Chromium ${doc.huella_de_la_pila} = huella en Node ${nodeHash(doc)}`)
  const { ctx: c2, page: p2, errs: e2 } = await open({}, doc.enlace)
  await full(p2); await p2.waitForTimeout(3500)
  const doc2 = await ficha(p2)
  ok(doc2.id === doc.id && doc2.huella_de_la_pila === doc.huella_de_la_pila, `el enlace reconstruye la misma pieza (${doc2.id}, huella ${doc2.huella_de_la_pila})`)
  ok(errs.length + e2.length === 0, `sin errores de página${errs.concat(e2).length ? ': ' + errs.concat(e2) : ''}`)
  await c2.close(); await ctx.close()
}

// ---- 3 y 4: una semilla destacada y el STL ---------------------------------------------------------
{
  console.log('\n== semilla destacada y STL ==')
  const { ctx, page: p, errs } = await open()
  const preset = PRESETS.find((x) => x.id === 'coral-cuatro')
  await p.locator('button', { hasText: preset.label }).first().click()
  await p.locator('button', { hasText: '×8' }).first().click()
  await full(p); await p.waitForTimeout(3500)
  const doc = await ficha(p)
  ok(doc.receta.strokes.length === preset.strokes.length, `«${preset.label}»: la receta lleva sus ${preset.strokes.length} pinceladas`)
  ok(nodeHash(doc) === doc.huella_de_la_pila && volumeHash(runRecipe(presetRecipe(preset)).volume()) === doc.huella_de_la_pila, `«${preset.label}»: la huella en Chromium coincide con la de Node (${doc.huella_de_la_pila})`)
  await p.locator('button', { hasText: 'BORRADOR' }).click()
  const stl = fs.readFileSync(await download(p, p.locator('button', { hasText: /DESCARGAR STL/ }), 'pieza.stl'))
  const F = stl.readUInt32LE(80)
  ok(stl.length === 84 + F * 50, `STL binario coherente: ${F} triángulos, ${(stl.length / 1e6).toFixed(1)} MB`)
  const ids = new Map<string, number>(), edges = new Map<string, number>()
  let minZ = Infinity, maxZ = -Infinity, maxXY = 0
  for (let f = 0; f < F; f++) {
    const o = 84 + f * 50 + 12, id: number[] = []
    for (let k = 0; k < 3; k++) {
      const x = stl.readFloatLE(o + k * 12), y = stl.readFloatLE(o + k * 12 + 4), z = stl.readFloatLE(o + k * 12 + 8)
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); maxXY = Math.max(maxXY, Math.abs(x), Math.abs(y))
      const key = `${x},${y},${z}`; if (!ids.has(key)) ids.set(key, ids.size); id.push(ids.get(key)!)
    }
    for (let k = 0; k < 3; k++) { const a = id[k], c = id[(k + 1) % 3]; const e = a < c ? `${a}_${c}` : `${c}_${a}`; edges.set(e, (edges.get(e) ?? 0) + 1) }
  }
  let open_ = 0, multi = 0; for (const c of edges.values()) { if (c === 1) open_++; else if (c > 2) multi++ }
  ok(open_ === 0 && multi === 0, `malla cerrada y manifold (${open_} aristas abiertas, ${multi} no-manifold)`)
  ok(Math.abs(minZ) < 1e-3 && maxZ > 10, `apoyada en z = 0 (${minZ.toFixed(3)}) y de ${maxZ.toFixed(1)} mm de alto`)
  ok(errs.length === 0, `sin errores de página${errs.length ? ': ' + errs : ''}`)
  await ctx.close()
}

// ---- 5: recorrer los controles ---------------------------------------------------------------------
{
  console.log('\n== controles ==')
  const { ctx, page: p, errs } = await open()
  const cap = () => p.evaluate(() => document.body.innerText.match(/CAPA \d+ \/ \d+/)?.[0] ?? '?')
  const press = async (name: string, loc, wait = 600) => { try { await loc.click({ timeout: 4000 }); await p.waitForTimeout(wait); return true } catch { ok(false, `no se pudo pulsar ${name}`); return false } }
  await p.locator('button', { hasText: '×8' }).first().click(); await full(p); await p.waitForTimeout(1500)
  await press('IMPRIMIR', p.locator('button', { hasText: 'IMPRIMIR (REPRODUCIR)' }), 1500)
  const during = await cap(); ok(!/240 \/ 240/.test(during), `la reproducción mueve el cabezal (${during})`)
  await press('AHORA', p.locator('button', { hasText: /^AHORA$/ }))
  await press('REPETIR', p.locator('button', { hasText: 'REPETIR' })); await full(p)
  await press('CAPAS 120', p.locator('button', { hasText: /^120$/ })); await p.waitForFunction(() => /120\s*\/\s*120/.test(document.body.innerText), null, { timeout: 120000 })
  ok(true, 'REPETIR y 120 capas completan la pieza')
  for (const [name, re] of [['PRISMA', /^PRISMA$/], ['CÚPULA', /^CÚPULA$/], ['BASE', /^BASE$/], ['RESINA', /^RESINA$/], ['EVENTOS', /^EVENTOS$/], ['CAUSAL', /^CAUSAL$/]] as const) await press(name, p.locator('button', { hasText: re }))
  await p.locator('input.cap-range').nth(2).fill('0.55').catch(() => {}); await p.waitForTimeout(800)
  await p.locator('input.cap-range').nth(3).fill('1.8').catch(() => {}); await p.waitForTimeout(1500)
  const asp = await p.evaluate(() => [...document.querySelectorAll('div')].find((d) => d.textContent === 'ASPECTO CAUSAL')?.nextElementSibling?.textContent)
  ok(asp === '1,80', `el aspecto manual se aplica (${asp})`)
  await press('NUEVO UNIVERSO', p.locator('button', { hasText: 'NUEVO UNIVERSO' }), 1500)
  await press('ESPIRALES', p.locator('[role=tab]', { hasText: 'ESPIRALES' })); await press('vista FRENTE', p.locator('button', { hasText: 'FRENTE' }), 2000)
  await press('DEFECTOS', p.locator('[role=tab]', { hasText: 'DEFECTOS' })); await press('vista FASES', p.locator('button', { hasText: 'FASES' }), 2000)
  await press('REINICIAR', p.locator('button', { hasText: 'REINICIAR' }))
  ok(errs.length === 0, `sin errores de página tras recorrer los controles${errs.length ? ': ' + errs : ''}`)
  await ctx.close()
}
await browser.close()
fs.rmSync(tmp, { recursive: true, force: true })
console.log(fails ? `\n${fails} FALLAS` : '\ntodo en orden')
process.exit(fails ? 1 : 0)
