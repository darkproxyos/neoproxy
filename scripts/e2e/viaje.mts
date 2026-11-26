// @ts-nocheck — Playwright no es dependencia del repo: se importa en caliente y no se tipa aquí.
//
// El viaje (Afuera → Umbral → Zona), en Chromium:
//   1. el Afuera llega en sepia desde el primer pintado, con el cartel I una sola vez por sesión
//   2. el Umbral: estática, la voz línea por línea, CRUZAR; recuerda las visitas
//   3. al cruzar: cartel III y el color vuelve después del cartel; el menú queda encendido
//   4. en la misma sesión /umbral lleva directo adentro; la tienda no cambia de color;
//      un enlace directo a un fenómeno funciona igual (el cartel no se puede tocar)
//   5. en un teléfono: el cartel y el Umbral caben sin desborde
//
//   npm run dev  (o next start)  y, en otra terminal:
//   npx tsx scripts/e2e/viaje.mts [--base http://localhost:3000]
import { createRequire } from 'module'

const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d }
const BASE = arg('base', 'http://localhost:3000')
let chromium
try { ({ chromium } = createRequire(import.meta.url)('playwright')) } catch { console.error('Falta Playwright: npm i -D playwright && npx playwright install chromium'); process.exit(2) }
let fails = 0
const ok = (cond: boolean, msg: string) => { console.log(`${cond ? '  ok ' : '  FALLA'} ${msg}`); if (!cond) fails++ }
const NOISE = /socket|WebSocket|:4000|status of 500|status of 404|ERR_TUNNEL|authjs|auth\//i
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
const state = (p) => p.evaluate(() => ({ tramo: document.documentElement.getAttribute('data-tramo'), sepia: getComputedStyle(document.documentElement).getPropertyValue('--tramo-sepia').trim(), cartel: document.querySelector('[data-tramo-cartel]')?.getAttribute('data-tramo-cartel') ?? null }))

console.log('\n== el viaje ==')
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }), p = await ctx.newPage(), errs: string[] = []
  p.on('pageerror', (e) => { if (!NOISE.test(e.message)) errs.push(e.message.slice(0, 160)) })
  p.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) errs.push(m.text().slice(0, 160)) })
  await p.goto(`${BASE}/manifesto`, { waitUntil: 'domcontentloaded' })
  const s0 = await p.evaluate(() => document.documentElement.getAttribute('data-tramo'))
  ok(s0 === 'afuera', `el Afuera se marca antes de hidratar (data-tramo=${s0})`)
  await p.waitForSelector('[data-tramo-cartel="I"]', { timeout: 20000 }); ok(true, 'cartel I · EL AFUERA')
  await p.waitForSelector('[data-tramo-cartel]', { state: 'detached', timeout: 5000 }); { const s = await state(p); ok(Math.abs(parseFloat(s.sepia) - 0.62) < 1e-6, `sepia en el Afuera (${s.sepia})`) }
  await p.reload(); await p.waitForTimeout(1500); ok((await state(p)).cartel === null, 'el cartel del Afuera no se repite en la sesión')
  await p.locator('a', { hasText: 'CRUZAR EL UMBRAL' }).click()
  await p.waitForURL('**/umbral'); await p.waitForSelector('[data-tramo-cartel="II"]', { timeout: 10000 }); ok(true, 'el manifiesto lleva al Umbral: cartel II')
  await p.waitForFunction(() => document.querySelectorAll('[role=log] p').length >= 2, null, { timeout: 20000 }); ok(true, 'la voz habla, línea por línea')
  for (let i = 0; i < 16; i++) { await p.mouse.click(400, 300); await p.waitForTimeout(120) }
  await p.locator('button', { hasText: 'CRUZAR →' }).click()
  await p.waitForURL('**/fenomenos', { timeout: 20000 })
  await p.waitForSelector('[data-tramo-cartel="III"]', { timeout: 3000 }).catch(() => {})
  const z1 = await state(p); ok(z1.cartel === 'III' && z1.tramo === 'umbral', `al cruzar: cartel III, y la Zona sigue gris debajo (${JSON.stringify(z1)})`)
  await p.waitForSelector('[data-tramo-cartel]', { state: 'detached', timeout: 5000 })
  const z2 = await state(p); ok(z2.tramo === 'zona', 'cuando el cartel se corta, el color empieza a volver')
  ok(await p.evaluate(() => { const a = [...document.querySelectorAll('nav a, header a, a')].find((x) => x.getAttribute('href') === '/umbral'); return !!a && getComputedStyle(a).color !== 'rgb(143, 184, 214)' }), 'FENÓMENOS queda encendido en el menú dentro de la Zona')
  await p.goto(`${BASE}/umbral`); await p.waitForURL('**/fenomenos', { timeout: 20000 }); ok(true, 'en la misma sesión, /umbral lleva directo a la Zona')
  await p.goto(`${BASE}/shop`); await p.waitForTimeout(800); ok((await state(p)).tramo === null, 'la tienda conserva sus colores')
  ok(errs.length === 0, `sin errores en consola${errs.length ? ': ' + errs.join(' | ') : ''}`)
  await ctx.close()
}

console.log('\n== volver, y entrar por un enlace directo ==')
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }), p = await ctx.newPage()
  await p.goto(`${BASE}/umbral`); await p.waitForFunction(() => document.querySelectorAll('[role=log] p').length >= 1, null, { timeout: 20000 })
  await p.evaluate(() => sessionStorage.clear()); await p.reload()
  await p.waitForFunction(() => /Volviste\./.test(document.body.innerText), null, { timeout: 20000 }); ok(true, 'la segunda visita: "Volviste."')
  const q = await ctx.newPage(); await q.goto(`${BASE}/trenza#t=ocho,1,1.60,0.045,0.80,0`)
  await q.waitForSelector('[data-tramo-cartel="III"]', { timeout: 20000 })
  ok(await q.evaluate(() => getComputedStyle(document.querySelector('[data-tramo-cartel]')).pointerEvents) === 'none', 'enlace directo a un fenómeno: cartel III, que no bloquea la página')
  await ctx.close()
}

console.log('\n== en un teléfono ==')
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), p = await ctx.newPage()
  await p.goto(`${BASE}/umbral`); await p.waitForSelector('[data-tramo-cartel="II"]', { timeout: 20000 })
  const w = await p.evaluate(() => { const c = document.querySelector('[data-tramo-cartel] > div'); return [c.scrollWidth, window.innerWidth, document.documentElement.scrollWidth] })
  ok(w[0] <= w[1] && w[2] <= w[1], `el cartel cabe en 390 px (${w.join(', ')})`)
  await p.waitForFunction(() => document.querySelectorAll('[role=log] p').length >= 2, null, { timeout: 20000 })
  ok(await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 0, 'el Umbral sin desborde horizontal')
  await ctx.close()
}

await browser.close()
console.log(fails ? `\n${fails} fallas` : '\ntodo en orden')
process.exit(fails ? 1 : 0)
