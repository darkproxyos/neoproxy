// RADAR: comprobaciones sin red ni gasto.
//   npx tsx scripts/radar/check.mts
// 1. el calendario comercial cae en las fechas correctas (domingos de Chile, Black Friday)
// 2. el clasificador de licencias separa lo vendible de lo no comercial
// 3. el generador de ideas arma bien la solicitud a Claude (cliente real del SDK con un
//    fetch simulado: no sale nada a la red) y lee la respuesta estructurada
import Anthropic from '@anthropic-ai/sdk'
import { calendario, vendible, puntaje, IDEAS, enlaces } from '../../lib/radar/ideas'
import { generarIdeas } from '../../lib/radar/ia'

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

console.log(fails ? `\n${fails} FALLAS` : '\nTodo bien.')
process.exit(fails ? 1 : 0)
