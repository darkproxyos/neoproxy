// RADAR: comprobaciones sin red ni gasto.
//   npx tsx scripts/radar/check.mts
// 1. el calendario comercial cae en las fechas correctas (domingos de Chile, Black Friday)
// 2. el clasificador de licencias separa lo vendible de lo no comercial
// 3. el generador de ideas arma bien la solicitud a Claude (cliente real del SDK con un
//    fetch simulado: no sale nada a la red) y lee la respuesta estructurada
// 5-7. CAZADOR: lee kg/litros de los títulos, marca oportunidades sin falsos positivos, y
//    el cliente de Mercado Libre (contra una API simulada) busca, cae al catálogo si la
//    búsqueda está bloqueada (403), renueva el token vencido y no reintenta con token malo
import Anthropic from '@anthropic-ai/sdk'
import { calendario, vendible, puntaje, IDEAS, enlaces } from '../../lib/radar/ideas'
import { generarIdeas } from '../../lib/radar/ia'
import { cantidad, evaluar, limpiarVigilancia, enlacesML, VIGILANCIAS_BASE, type Oferta } from '../../lib/radar/ofertas'
import { cazar, tendencias, diagnostico, MLError, _reiniciarML } from '../../lib/radar/ml'

let fails = 0
const ok = (c: boolean, m: string) => { console.log(`${c ? '  ok ' : '  FALLA'} ${m}`); if (!c) fails++ }
const iso = (d: Date) => d.toISOString().slice(0, 10)

console.log('1. Calendario')
const cal = calendario(new Date(2026, 10, 26)) // 26 nov 2026
const f = Object.fromEntries(cal.map((t) => [t.id, t]))
ok(iso(f['black-friday'].fecha) === '2026-11-27' && f['black-friday'].dias === 1, `Black Friday 2026: ${iso(f['black-friday'].fecha)} (mañana)`)
ok(iso(f.navidad.fecha) === '2026-12-25' && f.navidad.dias === 29 && iso(f.navidad.empezar) === '2026-11-27', `Navidad en ${f.navidad.dias} días: empezar a producir el ${iso(f.navidad.empezar)} (28 días antes)`)
ok(iso(f.madre.fecha) === '2027-05-09', `Día de la Madre 2027 (segundo domingo de mayo): ${iso(f.madre.fecha)}`)
ok(iso(f.padre.fecha) === '2027-06-20', `Día del Padre 2027 (tercer domingo de junio): ${iso(f.padre.fecha)}`)
ok(iso(f.nino.fecha) === '2027-08-08', `Día del Niño 2027 (segundo domingo de agosto): ${iso(f.nino.fecha)}`)
ok(iso(f.patrias.fecha) === '2027-09-18', `Fiestas Patrias: ${iso(f.patrias.fecha)} (la de 2026 ya pasó)`)
ok(cal.every((t, k) => k === 0 || cal[k - 1].dias <= t.dias), 'ordenadas de la más cercana a la más lejana')

console.log('2. Licencias')
const L: [string, 'si' | 'no' | 'revisar'][] = [
  ['Creative Commons - Attribution - Non-Commercial', 'no'], ['Creative Commons - Attribution - Non-Commercial - Share Alike', 'no'],
  ['Creative Commons - Attribution', 'si'], ['Creative Commons - Attribution - Share Alike', 'si'], ['Creative Commons - Public Domain Dedication', 'si'],
  ['GNU - GPL', 'si'], ['All Rights Reserved', 'no'], ['Standard Digital File License', 'no'], ['', 'revisar'], ['Licencia rara 3.0', 'revisar'],
]
for (const [l, want] of L) ok(vendible(l) === want, `«${l || '(vacía)'}» → ${vendible(l)}`)

console.log('3. Catálogo')
ok(new Set(IDEAS.map((i) => i.id)).size === IDEAS.length, `${IDEAS.length} ideas, sin ids repetidos`)
const sc = IDEAS.map((i) => puntaje(i, cal).total)
ok(sc.every((s) => s >= 0 && s <= 100), `puntajes entre ${Math.min(...sc)} y ${Math.max(...sc)}`)
ok(enlaces('Llavero personalizado 3D').mercadoLibre === 'https://listado.mercadolibre.cl/llavero-personalizado-3d', 'enlace de Mercado Libre bien formado')

console.log('4. Generador de ideas (solicitud simulada)')
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- cuerpo JSON capturado de la solicitud simulada
let cap: { url: string; headers: Record<string, string>; body: Record<string, any> } | null = null
const ideas = { ideas: [1, 2, 3].map((k) => ({ nombre: `Idea ${k}`, porque: 'x', material: 'PLA', derechos: 'propio', esfuerzo: 1, valor: 2, volumen: 3, aprox: '10 g', temporada: 'Navidad', reel: 'r', ojo: 'o', buscar: 'b', primerPaso: 'p' })) }
const fakeFetch = async (url: unknown, init: { headers: HeadersInit; body: string }) => {
  const h: Record<string, string> = {}; new Headers(init.headers).forEach((v, k) => { h[k] = v })
  cap = { url: String(url), headers: h, body: JSON.parse(init.body) }
  return new Response(JSON.stringify({ id: 'msg_prueba', type: 'message', role: 'assistant', model: 'claude-opus-5-5', stop_reason: 'end_turn', stop_sequence: null,
    content: [{ type: 'text', text: JSON.stringify(ideas) }], usage: { input_tokens: 1, output_tokens: 1 } }), { status: 200, headers: { 'content-type': 'application/json' } })
}
const client = new Anthropic({ apiKey: 'sk-prueba-local', baseURL: 'https://api.anthropic.com', fetch: fakeFetch as unknown as typeof fetch })
const r = await generarIdeas(client, { foco: 'regalos para profesores', material: 'ambos', cantidad: 3, evitar: ['Mi idea vieja'] })
const b = cap!.body
ok(cap!.url.endsWith('/v1/messages?beta=true') || cap!.url.endsWith('/v1/messages'), `POST ${cap!.url.replace('https://api.anthropic.com', '')}`)
ok(b.model === 'claude-opus-5-5' && b.max_tokens === 16000, `modelo ${b.model}, max_tokens ${b.max_tokens}`)
ok((cap!.headers['anthropic-beta'] ?? '').includes('server-side-fallback-2026-07-01') && b.fallbacks === 'default', 'respaldo del servidor activado (fallbacks: "default")')
ok(b.output_config?.effort === 'medium' && b.output_config?.format?.type === 'json_schema', `salida estructurada (${b.output_config?.format?.type}), esfuerzo ${b.output_config?.effort}`)
ok(b.thinking === undefined && b.temperature === undefined, 'sin parámetros que Opus 5.5 rechaza (thinking desactivado, temperature)')
const msg = String(b.messages?.[0]?.content ?? '')
ok(/regalos para profesores/.test(msg) && /Mi idea vieja/.test(msg) && /Navidad en \d+ días/.test(msg), 'el pedido lleva el foco, las ideas a evitar y las fechas que vienen')
ok(r.ok && r.data.length === 3, `respuesta leída: ${r.ok ? r.data.map((x) => x.nombre).join(', ') : r.error}`)

console.log('5. Cantidades en el título')
const C: [string, string | undefined][] = [
  ['Resina Elegoo Standard 405nm 1kg Gris', '1 kg'], ['Filamento PLA 1.75mm 1 Kg Negro', '1 kg'], ['Filamento PLA+ 1kg 1.75 mm', '1 kg'],
  ['Pack 2 Resina Anycubic 1kg', '2 kg'], ['Resina 500g Lavable Agua', '0.5 kg'], ['2 x 1kg Filamento PETG', '2 kg'],
  ['Filamento PLA 1kg (3 rollos)', '3 kg'], ['Resina Uv 1000ml', '1 L'], ['Alcohol Isopropílico 99% 1 Litro', '1 L'],
  ['Isopropilico 99,9% 5 lts', '5 L'], ['Pack 2 Kg Resina Gris', '2 kg'], ['Resina 1kg Pack 2', '2 kg'], ['Rollo PLA 250 g', '0.25 kg'],
  ['Impresora 3d Elegoo Saturn 4 Ultra 16k 12k', undefined], ['Impresora 3D Bambu Lab A1 Mini', undefined], ['Kit 3d Boquillas 0.4mm', undefined],
]
for (const [t, want] of C) { const c = cantidad(t); const got = c ? `${c.valor} ${c.unidad}` : undefined; ok(got === want, `«${t}» → ${got ?? 'sin cantidad'}`) }

console.log('6. Oportunidades')
const of = (id: string, titulo: string, precio: number, original?: number): Oferta => ({ id, titulo, precio, original, url: `https://x/${id}` })
const resinas = [
  of('a', 'Resina 405nm 1kg', 22000), of('b', 'Resina 405nm 1kg', 21000), of('c', 'Resina 405nm 1kg', 23000), of('d', 'Resina 405nm 1kg', 24000),
  of('e', 'Pack 2 Resina 405nm 1kg', 34000), // 17.000/kg: 23 % bajo lo típico (22.000)
  of('f', 'Resina 405nm 500g', 7500), // 15.000/kg: oportunidad
  of('g', 'Resina 405nm 1kg', 25000, 34000), // 26 % de descuento declarado
  of('h', 'Resina 405nm 10kg', 30000), // 3.000/kg: peso mal leído o cebo → raro, no oportunidad
  of('i', 'Resina 405nm botella', 9000), // sin peso: no se compara
]
const ev = evaluar(resinas, { tipo: 'material' })
const by = Object.fromEntries(ev.items.map((x) => [x.id, x]))
ok(ev.mediana === 22000, `precio típico por kg: ${ev.mediana} (sin contar el sospechoso de $3.000)`)
ok(by.f.ganga && by.f.porUnidad === 15000 && by.f.bajoMediana === 32, `500 g a $7.500 = $15.000/kg, ${by.f.bajoMediana}% bajo lo típico → oportunidad`)
ok(by.g.ganga && by.g.descuento === 26, `26 % de descuento declarado → oportunidad`)
ok(by.e.ganga && by.e.porUnidad === 17000 && by.e.bajoMediana === 23, 'pack de 2 kg a $17.000/kg: 23 % bajo lo típico → oportunidad')
ok(!by.a.ganga && !by.c.ganga, 'las de precio normal no se marcan')
ok(by.h.raro && !by.h.ganga, '$3.000/kg es sospechoso: marcado para revisar, no como oportunidad')
ok(by.i.porUnidad === undefined && !by.i.ganga, 'sin peso en el título: se muestra, no se compara')
ok(ev.items[0].ganga && ev.items[ev.items.length - 1].id === 'h', 'orden: oportunidades primero, sospechosos al final')
const conTope = evaluar(resinas, { tipo: 'material', tope: 21500 })
ok(Object.fromEntries(conTope.items.map((x) => [x.id, x])).b.enTope, 'con tope $21.500/kg, la de $21.000 avisa')
const impresoras = [of('p1', 'Impresora Resina Mars', 220000), of('p2', 'Impresora Resina Saturn', 400000), of('p3', 'Impresora Resina Photon', 250000),
  of('p4', 'Impresora Resina Halot', 260000), of('p5', 'Impresora Resina Mars 4', 160000), of('fep', 'Lámina FEP para impresora resina', 15000)]
const ei = Object.fromEntries(evaluar(impresoras, { tipo: 'equipo' }).items.map((x) => [x.id, x]))
ok(ei.fep.raro && !ei.fep.ganga, 'una lámina FEP de $15.000 entre impresoras no es «oferta de impresora»')
const tipImp = evaluar(impresoras, { tipo: 'equipo' }).mediana
ok(tipImp === 250000, `típico de impresoras $${tipImp} (la lámina FEP no lo baja)`)
ok(ei.p5.ganga && !ei.p1.ganga, `impresora a $160.000 → oportunidad (${ei.p5.motivos.join(', ')}); la de $220.000 no`)
ok(enlacesML('Resina lavable 405nm').barato === 'https://listado.mercadolibre.cl/resina-lavable-405nm_OrderId_PRICE_NoIndex_True', 'enlace «más barato primero»')
ok(limpiarVigilancia({ q: ' x' }) === null && limpiarVigilancia({ q: 'petg 1kg', tipo: 'otro', tope: -5 })?.tipo === 'material' && limpiarVigilancia({ q: 'petg', tope: -5 })?.tope === undefined, 'lo que llega del navegador se limpia')

console.log('7. Cliente de Mercado Libre (API simulada)')
process.env.MERCADOLIBRE_CLIENT_ID = 'id-prueba'; process.env.MERCADOLIBRE_CLIENT_SECRET = 'secreto-prueba'
type Llamada = { path: string; q: URLSearchParams; auth?: string }
let llamadas: Llamada[] = []
let rutas: (path: string, q: URLSearchParams, n: number) => Response = () => new Response('{}', { status: 500 })
const J = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { 'content-type': 'application/json' } })
globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const u = new URL(String(input))
  const auth = new Headers(init?.headers).get('authorization') ?? undefined
  llamadas.push({ path: u.pathname, q: u.searchParams, auth })
  return rutas(u.pathname, u.searchParams, llamadas.filter((l) => l.path === u.pathname).length)
}) as typeof fetch
const item = (id: string, title: string, price: number, extra: Record<string, unknown> = {}) => ({ id, title, price, currency_id: 'CLP', permalink: `https://articulo.mercadolibre.cl/${id}`, thumbnail: `http://http2.mlstatic.com/${id}-I.jpg`, condition: 'new', shipping: { free_shipping: false }, ...extra })

// A: la búsqueda responde
_reiniciarML(); llamadas = []
rutas = (p, q) => {
  if (p === '/oauth/token') return J({ access_token: 'tk-1', expires_in: 21600 })
  if (p === '/sites/MLC/domain_discovery/search') return J([{ category_id: 'MLC4321', category_name: 'Resinas para impresión 3D' }])
  if (p === '/sites/MLC/search') {
    const base = [item('MLC1', 'Resina 405nm 1kg Elegoo', 22000), item('MLC2', 'Resina 405nm 1kg Anycubic', 23000, { original_price: 31000 }), item('MLC3', 'Resina 1kg', 21000, { condition: 'used' }),
      item('MLC4', 'Resina 405nm 1kg', 24000), item('MLC5', 'Resina 405nm 1kg', 22500, { shipping: { free_shipping: true } }), item('MLC6', 'Resina importada 1kg', 30, { currency_id: 'USD' })]
    return J({ paging: { total: 812 }, results: q.get('sort') === 'price_asc' ? [item('MLC7', 'Resina 405nm 500g', 7000), base[2], base[0]] : base })
  }
  return J({}, 404)
}
const A1 = await cazar({ id: 'resina', nombre: 'Resina', q: 'resina 405nm 1kg', tipo: 'material' })
const s1 = llamadas.filter((l) => l.path === '/sites/MLC/search')
ok(A1.via === 'busqueda' && A1.total === 812 && A1.categoria === 'Resinas para impresión 3D', `búsqueda normal, ${A1.total} publicaciones, categoría «${A1.categoria}»`)
ok(s1.length === 2 && s1.every((l) => l.q.get('category') === 'MLC4321' && l.auth === 'Bearer tk-1') && s1.some((l) => l.q.get('sort') === 'price_asc'), 'pide lo relevante y lo más barato, en la categoría, con el token')
ok(A1.items.length === 6 && !A1.items.some((x) => x.id === 'MLC6'), '6 publicaciones sin repetir; la que está en dólares queda fuera')
const a1 = Object.fromEntries(A1.items.map((x) => [x.id, x]))
ok(a1.MLC7.ganga && a1.MLC7.porUnidad === 14000 && a1.MLC2.descuento === 26 && a1.MLC3.usado === true && a1.MLC5.envioGratis === true && !!a1.MLC1.img?.startsWith('https://'), 'precio por kg, descuento, usado, envío gratis e imagen https')
const n0 = llamadas.length
await cazar({ id: 'resina', nombre: 'Resina', q: 'resina 405nm 1kg', tipo: 'material' })
ok(llamadas.length === n0, 'repetir la misma vigilancia no vuelve a gastar cuota (caché)')

// B: la búsqueda está bloqueada para la app → catálogo
_reiniciarML(); llamadas = []
rutas = (p) => {
  if (p === '/oauth/token') return J({ access_token: 'tk-2', expires_in: 21600 })
  if (p === '/sites/MLC/domain_discovery/search') return J([])
  if (p === '/sites/MLC/search') return J({ message: 'forbidden', error: 'forbidden', status: 403 }, 403)
  if (p === '/products/search') return J({ paging: { total: 2 }, results: [{ id: 'MLC111', name: 'Impresora 3D Resina X', pictures: [{ url: 'http://http2.mlstatic.com/x.jpg' }] }, { id: 'MLC222', name: 'Impresora 3D Resina Y' }] })
  if (p === '/products/MLC111') return J({ id: 'MLC111', buy_box_winner: { item_id: 'MLC9', price: 250000, original_price: 320000, shipping: { free_shipping: true } } })
  if (p === '/products/MLC222') return J({ message: 'not found' }, 404)
  if (p === '/products/MLC222/items') return J({ results: [{ item_id: 'MLC8', price: 199990 }, { item_id: 'MLC7', price: 189990 }] })
  return J({}, 404)
}
const B1 = await cazar({ id: 'imp', nombre: 'Impresora', q: 'impresora 3d resina', tipo: 'equipo' })
const b1 = Object.fromEntries(B1.items.map((x) => [x.id, x]))
ok(B1.via === 'catalogo' && B1.items.length === 2, `búsqueda bloqueada (403) → catálogo, ${B1.items.length} productos`)
ok(b1.MLC111?.precio === 250000 && b1.MLC111.descuento === 22 && b1.MLC111.url === 'https://www.mercadolibre.cl/p/MLC111' && b1.MLC111.img === 'https://http2.mlstatic.com/x.jpg', 'precio ganador del producto, descuento, enlace y foto')
ok(b1.MLC222?.precio === 189990, 'sin ganador: el precio más bajo entre sus publicaciones')
ok(llamadas.filter((l) => l.path === '/sites/MLC/search').length === 1, 'no insiste con la búsqueda bloqueada')

// C: token rechazado → error claro, sin intentar nada más
_reiniciarML(); llamadas = []
rutas = (p) => (p === '/oauth/token' ? J({ error: 'invalid_client' }, 400) : J({}, 500))
let C1: unknown
try { await cazar(VIGILANCIAS_BASE[0]) } catch (e) { C1 = e }
ok(C1 instanceof MLError && C1.enToken && /Client ID/.test(C1.message) && llamadas.every((l) => l.path === '/oauth/token'), `token rechazado: «${(C1 as Error)?.message}»`)

// D: token vencido a mitad de camino → uno nuevo y sigue
_reiniciarML(); llamadas = []
let emitidos = 0
rutas = (p, _q, n) => {
  if (p === '/oauth/token') return J({ access_token: `tk-${++emitidos}`, expires_in: 21600 })
  if (p === '/trends/MLC/MLC1000') return n === 1 ? J({ message: 'expired' }, 401) : J([{ keyword: 'organizador de cables', url: 'https://listado.mercadolibre.cl/organizador-de-cables' }, { keyword: 'soporte celular' }])
  if (p === '/sites/MLC/categories') return J([{ id: 'MLC1000', name: 'Electrónica, Audio y Video' }])
  return J({}, 404)
}
const D1 = await tendencias('MLC1000')
ok(emitidos === 2 && D1.lista.length === 2 && D1.lista[0].keyword === 'organizador de cables' && D1.categorias[0].nombre.startsWith('Electrónica'), `401 → token nuevo y reintento: ${D1.lista.length} tendencias`)

// E: diagnóstico
_reiniciarML(); llamadas = []
rutas = (p) => {
  if (p === '/oauth/token') return J({ access_token: 'tk-e', expires_in: 21600 })
  if (p === '/sites/MLC/search') return J({ status: 403 }, 403)
  if (p === '/products/search' || p === '/trends/MLC') return J({ results: [] })
  if (p === '/sites/MLC/categories') return J([])
  return J({}, 404)
}
const E1 = await diagnostico()
ok(E1.length === 5 && E1[0].ok && !E1[1].ok && /403/.test(E1[1].detalle) && E1[2].ok && E1[3].ok && E1[4].ok, `diagnóstico: ${E1.map((x) => `${x.nombre} ${x.ok ? 'ok' : 'NO'}`).join(' · ')}`)

console.log(fails ? `\n${fails} FALLAS` : '\nTodo bien.')
process.exit(fails ? 1 : 0)
