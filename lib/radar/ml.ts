// Mercado Libre Chile — API oficial (app en developers.mercadolibre.cl). Solo servidor:
// se importa desde app/radar/actions.ts ('use server') y lib/radar/fuentes.ts.
//
// Desde 2025 Mercado Libre cerró la búsqueda anónima, y hay apps a las que
// /sites/MLC/search les responde 403 incluso con token. Por eso la búsqueda tiene
// respaldo: si la búsqueda normal está bloqueada, se usa el catálogo
// (/products/search + precio ganador de cada producto). diagnostico() muestra qué
// camino responde con tu app.
import { evaluar, type Evaluacion, type Oferta, type Vigilancia } from './ofertas'

const API = 'https://api.mercadolibre.com'
type Rec = Record<string, unknown>
export class MLError extends Error {
  constructor(msg: string, public status?: number, public enToken = false, public falta?: string) { super(msg) }
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : undefined)
const https = (u?: string) => u?.replace(/^http:\/\//, 'https://')

export const mlConfigurado = () => !!(process.env.MERCADOLIBRE_CLIENT_ID && process.env.MERCADOLIBRE_CLIENT_SECRET)

let token: { value: string; until: number } | null = null
async function auth(): Promise<string> {
  const id = process.env.MERCADOLIBRE_CLIENT_ID, secret = process.env.MERCADOLIBRE_CLIENT_SECRET
  if (!id || !secret) throw new MLError('Mercado Libre sin conectar', undefined, true, 'MERCADOLIBRE_CLIENT_ID y MERCADOLIBRE_CLIENT_SECRET')
  if (token && token.until > Date.now() + 60_000) return token.value
  const r = await fetch(`${API}/oauth/token`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }), cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
  })
  if (!r.ok) throw new MLError(`Mercado Libre no entregó token (${r.status}): revisa el Client ID y el Client Secret`, r.status, true)
  const j = (await r.json()) as { access_token?: string; expires_in?: number }
  if (!j.access_token) throw new MLError('Mercado Libre no entregó token', r.status, true)
  token = { value: j.access_token, until: Date.now() + (j.expires_in ?? 3600) * 1000 }
  return token.value
}

// caché en memoria: cada instancia del servidor repite la misma consulta como mucho
// una vez por periodo, para no gastar la cuota de la app
const cache = new Map<string, { t: number; v: unknown }>()
export async function mlGet<T = unknown>(path: string, ttlMs = 30 * 60_000): Promise<T> {
  const hit = cache.get(path)
  if (ttlMs > 0 && hit && Date.now() - hit.t < ttlMs) return hit.v as T
  for (let intento = 0; ; intento++) {
    const tk = await auth()
    const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${tk}`, accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(12_000) })
    if (r.status === 401 && intento === 0) { token = null; continue } // token vencido o revocado: uno nuevo y otra vez
    if (!r.ok) throw new MLError(`Mercado Libre respondió ${r.status} en ${path.split('?')[0]}`, r.status)
    const v = (await r.json()) as T
    if (ttlMs > 0) {
      cache.set(path, { t: Date.now(), v })
      if (cache.size > 400) cache.delete(cache.keys().next().value as string)
    }
    return v
  }
}

// --- búsqueda con respaldo -----------------------------------------------------------
export type Busqueda = { via: 'busqueda' | 'catalogo'; total: number; items: Oferta[] }

function deBusqueda(x: Rec): Oferta | null {
  const id = str(x.id), precio = num(x.price)
  if (!id || precio === undefined || precio <= 0) return null
  if (x.currency_id !== undefined && x.currency_id !== 'CLP') return null
  return {
    id, titulo: str(x.title) ?? 'Sin título', precio,
    original: num(x.original_price),
    url: str(x.permalink) ?? `https://articulo.mercadolibre.cl/${id.replace(/^MLC/, 'MLC-')}`,
    img: https(str(x.thumbnail)),
    envioGratis: (x.shipping as Rec | undefined)?.free_shipping === true,
    usado: x.condition === 'used',
  }
}

async function porCatalogo(q: string): Promise<Busqueda> {
  const j = await mlGet<{ results?: Rec[]; paging?: { total?: number } }>(`/products/search?${new URLSearchParams({ status: 'active', site_id: 'MLC', q })}`)
  const prods = (j.results ?? []).slice(0, 12)
  const items = await Promise.all(prods.map(async (p): Promise<Oferta | null> => {
    const id = str(p.id)
    if (!id) return null
    let precio: number | undefined, original: number | undefined, envioGratis: boolean | undefined
    try {
      const d = await mlGet<Rec>(`/products/${id}`)
      const b = d.buy_box_winner as Rec | undefined
      precio = num(b?.price); original = num(b?.original_price); envioGratis = (b?.shipping as Rec | undefined)?.free_shipping === true
    } catch { /* sin ganador: se prueba con las publicaciones del producto */ }
    if (precio === undefined) {
      try {
        const it = await mlGet<{ results?: Rec[] }>(`/products/${id}/items`)
        const best = (it.results ?? []).filter((x) => num(x.price) !== undefined).sort((a, b) => (num(a.price) ?? 0) - (num(b.price) ?? 0))[0]
        precio = num(best?.price); original = num(best?.original_price); envioGratis = (best?.shipping as Rec | undefined)?.free_shipping === true
      } catch { /* producto sin publicaciones activas */ }
    }
    if (precio === undefined || precio <= 0) return null
    const pics = p.pictures as Rec[] | undefined
    return { id, titulo: str(p.name) ?? 'Producto', precio, original, url: `https://www.mercadolibre.cl/p/${id}`, img: https(str(pics?.[0]?.url)), envioGratis }
  }))
  const ok = items.filter((x): x is Oferta => !!x)
  return { via: 'catalogo', total: j.paging?.total ?? ok.length, items: ok }
}

export async function buscar(q: string, o: { categoria?: string; barato?: boolean } = {}): Promise<Busqueda> {
  try {
    const p = new URLSearchParams({ q, limit: '50' })
    if (o.categoria) p.set('category', o.categoria)
    if (o.barato) p.set('sort', 'price_asc')
    const j = await mlGet<{ paging?: { total?: number }; results?: Rec[] }>(`/sites/MLC/search?${p}`)
    const items = (j.results ?? []).map(deBusqueda).filter((x): x is Oferta => !!x)
    return { via: 'busqueda', total: j.paging?.total ?? items.length, items }
  } catch (e) {
    // búsqueda bloqueada para esta app (403): el catálogo suele seguir abierto
    if (e instanceof MLError && !e.enToken && e.status === 403) return porCatalogo(q)
    throw e
  }
}

async function categoria(q: string): Promise<{ id: string; nombre?: string } | undefined> {
  try {
    const d = await mlGet<Rec[]>(`/sites/MLC/domain_discovery/search?${new URLSearchParams({ q, limit: '1' })}`, 24 * 3600_000)
    const id = str(d?.[0]?.category_id)
    return id ? { id, nombre: str(d[0].category_name) } : undefined
  } catch { return undefined }
}

export type Caza = Evaluacion & { id: string; via: Busqueda["via"]; total: number; categoria?: string }

// una vigilancia: la categoría que Mercado Libre asocia a la búsqueda (para no mezclar
// resina epóxica con resina UV, ni láminas FEP con impresoras), lo más relevante y lo
// más barato, sin repetir, y la evaluación de cada publicación
export async function cazar(v: Vigilancia): Promise<Caza> {
  const cat = await categoria(v.q)
  let rel = await buscar(v.q, { categoria: cat?.id })
  let usarCat = !!cat
  if (cat && rel.via === 'busqueda' && rel.items.length < 5) { rel = await buscar(v.q); usarCat = false } // categoría equivocada
  const todos = [...rel.items]
  if (rel.via === 'busqueda') {
    try {
      const bar = await buscar(v.q, { categoria: usarCat ? cat?.id : undefined, barato: true })
      const ya = new Set(todos.map((x) => x.id))
      for (const x of bar.items) if (!ya.has(x.id)) { todos.push(x); ya.add(x.id) }
    } catch { /* con lo relevante basta */ }
  }
  return { id: v.id, via: rel.via, total: rel.total, categoria: usarCat ? cat?.nombre : undefined, ...evaluar(todos, v) }
}

// --- tendencias: lo que más crece en las búsquedas de Chile esta semana ----------------
export type Tendencias = { lista: { keyword: string; url: string }[]; categorias: { id: string; nombre: string }[] }
export async function tendencias(cat?: string): Promise<Tendencias> {
  const t = await mlGet<Rec[]>(`/trends/MLC${cat ? `/${cat}` : ''}`, 6 * 3600_000)
  const lista = (Array.isArray(t) ? t : []).map((x) => ({ keyword: str(x.keyword) ?? '', url: str(x.url) ?? '' })).filter((x) => x.keyword)
  let categorias: Tendencias['categorias'] = []
  try {
    const c = await mlGet<Rec[]>('/sites/MLC/categories', 24 * 3600_000)
    categorias = (Array.isArray(c) ? c : []).map((x) => ({ id: str(x.id) ?? '', nombre: str(x.name) ?? '' })).filter((x) => x.id && x.nombre)
  } catch { /* sin lista de categorías: solo «todo Chile» */ }
  return { lista, categorias }
}

// --- diagnóstico: qué partes de la API responden con tu app --------------------------
export type Prueba = { nombre: string; ok: boolean; detalle: string }
export async function diagnostico(): Promise<Prueba[]> {
  const out: Prueba[] = []
  try { await auth(); out.push({ nombre: 'Token de la app', ok: true, detalle: 'Client ID y Secret aceptados' }) } catch (e) {
    return [{ nombre: 'Token de la app', ok: false, detalle: (e as Error).message }]
  }
  const pruebas: [string, string, string][] = [
    ['Búsqueda de publicaciones', '/sites/MLC/search?q=resina&limit=1', 'ofertas con descuento, envío gratis y usados'],
    ['Catálogo de productos', `/products/search?${new URLSearchParams({ status: 'active', site_id: 'MLC', q: 'resina' })}`, 'respaldo de las ofertas'],
    ['Tendencias', '/trends/MLC', 'pestaña TENDENCIAS'],
    ['Categorías', '/sites/MLC/categories', 'filtro de tendencias'],
  ]
  await Promise.all(pruebas.map(async ([nombre, path, uso], k) => {
    try { await mlGet(path, 0); out[k + 1] = { nombre, ok: true, detalle: `responde · sirve para ${uso}` } } catch (e) {
      const s = e instanceof MLError ? e.status : undefined
      out[k + 1] = { nombre, ok: false, detalle: s === 403 ? `bloqueada para esta app (403) · afecta ${uso}` : (e as Error).message }
    }
  }))
  return out
}

// solo para scripts/radar/check.mts: olvida token y caché entre escenarios simulados
export function _reiniciarML() { token = null; cache.clear() }
