// @ts-nocheck — Playwright no es dependencia del repo: se importa en caliente y no se tipa aquí.
//
// Zoom de los visores 3D (GEOMETRÍAS, laboratorio de ESPECÍMENES y CAPAS):
//   · móvil simulado: pellizco de dos dedos y botones + / − / ⟲
//   · escritorio: rueda del ratón
//   · el explorador de GEOMETRÍAS conserva el zoom al regenerar la pieza
//
//   npm run dev   (o next start)  y, en otra terminal:
//   npx tsx scripts/e2e/zoom.mts [--base http://localhost:3000]
//
// Requiere Playwright con Chromium (npm i -D playwright && npx playwright install chromium).
// El móvil simulado declara 5 puntos táctiles, como un teléfono real: la emulación de
// Playwright declara 1 y Babylon, que reserva una casilla por punto táctil, ignora el
// segundo dedo y el pellizco parece roto aunque no lo esté.
import fs from 'fs'

const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d }
const BASE = arg('base', 'http://localhost:3000')

import { createRequire } from 'module'
let chromium
// createRequire (y no import()) para que se resuelva también desde NODE_PATH, donde Playwright suele estar instalado
try { ({ chromium } = createRequire(import.meta.url)('playwright')) } catch { console.error('Falta Playwright: npm i -D playwright && npx playwright install chromium'); process.exit(2) }

const pool = JSON.parse(fs.readFileSync(new URL('../../public/proxygenesis/pool.json', import.meta.url), 'utf8'))
const specimenId = pool.hall[0].id
const targets = [
  { name: 'GEOMETRÍAS', url: `${BASE}/geometrias/conway`, wait: 'canvas[data-cam-radius]', settle: 2500, regenerate: true },
  { name: 'ESPECÍMENES', url: `${BASE}/especimenes/laboratorio?id=${specimenId}`, wait: '[role=dialog] canvas[data-cam-radius]', settle: 2500 },
  { name: 'CAPAS', url: `${BASE}/capas`, wait: 'canvas[data-cam-radius]', settle: 6000 },
]

let fails = 0
const ok = (cond: boolean, msg: string) => { console.log(`${cond ? '  ok ' : '  FALLA'} ${msg}`); if (!cond) fails++ }
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
for (const t of targets) {
  console.log(`\n== ${t.name} ==`)
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })
  // como texto: tsx/esbuild inyecta `__name` en las funciones que se serializan a la página y allí no existe
  await m.addInitScript("Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 5 })")
  const p = await m.newPage()
  const errs: string[] = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)))
  await p.goto(t.url, { waitUntil: 'domcontentloaded' })
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' }).catch(() => {})
  await p.waitForSelector(t.wait, { timeout: 120000 }); await p.waitForTimeout(t.settle)
  const c = p.locator(t.wait).first(); await c.scrollIntoViewIfNeeded(); await p.waitForTimeout(400)
  const b = await c.boundingBox(), cdp = await m.newCDPSession(p)
  const rad = () => c.evaluate((el) => Number(el.dataset.camRadius))
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2
  const spread = async (a: number, z: number) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx - a, y: cy, id: 1 }, { x: cx + a, y: cy, id: 2 }] })
    for (let i = 1; i <= 15; i++) { const h = a + ((z - a) * i) / 15; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx - h, y: cy, id: 1 }, { x: cx + h, y: cy, id: 2 }] }) }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(500)
  }
  ok(b.height >= 300, `el visor ocupa su caja en el móvil (${Math.round(b.width)}×${Math.round(b.height)}; en GEOMETRÍAS y ESPECÍMENES antes salía en 340×170)`)
  const r0 = await rad(); await spread(30, 75); const r1 = await rad()
  ok(r1 / r0 > 0.3 && r1 / r0 < 0.55, `pellizco: separar los dedos ×2,5 acerca la cámara (${r0} → ${r1}, ${(r1 / r0).toFixed(2)}×; natural ≈ 0,40×)`)
  const tap = async (label: string) => { const bt = p.locator(`button[aria-label="${label}"]`).first(); await bt.scrollIntoViewIfNeeded(); await bt.tap(); await p.waitForTimeout(300); return rad() }
  const r2 = await tap('Acercar'); ok(Math.abs(r2 / r1 - 0.78) < 0.02, `botón +: ${r1} → ${r2} (${(r2 / r1).toFixed(2)}×)`)
  const r3 = await tap('Alejar'); ok(r3 > r2, `botón −: ${r2} → ${r3}`)
  const r4 = await tap('Restablecer la vista'); ok(Math.abs(r4 - r0) < 1, `botón ⟲ vuelve al radio inicial (${r4} ≈ ${r0})`)
  if (t.regenerate) {
    const z = await tap('Acercar')
    await p.locator('button', { hasText: /OTRA SEMILLA/i }).first().tap(); await p.waitForTimeout(4500)
    const after = await rad(); ok(Math.abs(after - z) < 1, `regenerar la pieza conserva el zoom (${z} → ${after})`)
  }
  ok(errs.length === 0, `sin errores de página${errs.length ? ': ' + errs : ''}`)
  await m.close()
  const d = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const dp = await d.newPage(); await dp.goto(t.url, { waitUntil: 'domcontentloaded' })
  await dp.addStyleTag({ content: 'nextjs-portal{display:none!important}' }).catch(() => {})
  await dp.waitForSelector(t.wait, { timeout: 120000 }); await dp.waitForTimeout(t.settle)
  const dc = dp.locator(t.wait).first(), db = await dc.boundingBox(), dr = () => dc.evaluate((el) => Number(el.dataset.camRadius))
  const w0 = await dr(); await dp.mouse.move(db.x + db.width / 2, db.y + db.height / 2); await dp.mouse.wheel(0, -500); await dp.waitForTimeout(700)
  const w1 = await dr(); ok(w1 < w0, `escritorio: la rueda acerca (${w0} → ${w1})`)
  await d.close()
}
await browser.close()
console.log(fails ? `\n${fails} FALLAS` : '\ntodo en orden')
process.exit(fails ? 1 : 0)
