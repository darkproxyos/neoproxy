// RADAR — conectores a fuentes externas (solo servidor). Cada uno usa la API oficial y
// se activa con su variable de entorno; sin ella, el radar lo muestra como «por conectar».
// Las respuestas se guardan en caché (una hora) para no gastar la cuota de cada API.
// solo se importa desde app/admin/radar/actions.ts ('use server')
import { vendible } from './ideas'

export type RadarItem = {
  id: string
  fuente: 'thingiverse'
  titulo: string
  url: string
  img?: string
  autor?: string
  likes?: number
  colecciones?: number
  licencia?: string
  vendible: 'si' | 'no' | 'revisar'
}
export type Res<T> = { ok: true; data: T } | { ok: false; error: string; falta?: string }

export const ESTADO = () => ({
  thingiverse: !!process.env.THINGIVERSE_TOKEN,
  mercadoLibre: !!(process.env.MERCADOLIBRE_CLIENT_ID && process.env.MERCADOLIBRE_CLIENT_SECRET),
  ia: !!process.env.ANTHROPIC_API_KEY,
})

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : undefined)

// ---- Thingiverse (API oficial: token de app en thingiverse.com/developers) ----
const TV = 'https://api.thingiverse.com'
async function tv(path: string) {
  const token = process.env.THINGIVERSE_TOKEN
  if (!token) throw Object.assign(new Error('Falta THINGIVERSE_TOKEN'), { falta: 'THINGIVERSE_TOKEN' })
  const r = await fetch(`${TV}${path}`, { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 3600 } })
  if (!r.ok) throw new Error(`Thingiverse respondió ${r.status}`)
  return r.json() as Promise<unknown>
}

export async function thingiverse(modo: 'popular' | 'newest' | 'featured', q?: string): Promise<Res<RadarItem[]>> {
  try {
    const raw = q
      ? await tv(`/search/${encodeURIComponent(q)}?type=things&per_page=24&sort=${modo === 'newest' ? 'newest' : 'popular'}`)
      : await tv(`/${modo}?per_page=24`)
    const list = (Array.isArray(raw) ? raw : (raw as { hits?: unknown[] })?.hits ?? []) as Record<string, unknown>[]
    const items: RadarItem[] = list.slice(0, 24).map((t) => ({
      id: String(t.id ?? ''),
      fuente: 'thingiverse' as const,
      titulo: str(t.name) ?? 'Sin título',
      url: str(t.public_url) ?? `https://www.thingiverse.com/thing:${t.id}`,
      img: str(t.preview_image) ?? str(t.thumbnail),
      autor: str((t.creator as Record<string, unknown> | undefined)?.name),
      likes: num(t.like_count),
      colecciones: num(t.collect_count),
      licencia: str(t.license),
      vendible: vendible(str(t.license)),
    })).filter((i) => i.id)
    // la licencia viene solo en la ficha de cada cosa: se completa para las primeras 12
    await Promise.all(items.slice(0, 12).map(async (it) => {
      if (it.licencia) return
      try { const d = (await tv(`/things/${it.id}`)) as Record<string, unknown>; it.licencia = str(d.license); it.vendible = vendible(it.licencia) } catch { /* queda «revisar» */ }
    }))
    return { ok: true, data: items }
  } catch (e) {
    const err = e as Error & { falta?: string }
    return { ok: false, error: err.message, falta: err.falta }
  }
}

// ---- Mercado Libre Chile (API oficial: app en developers.mercadolibre.cl) ----
let mlToken: { value: string; until: number } | null = null
async function mlAuth(): Promise<string | null> {
  const id = process.env.MERCADOLIBRE_CLIENT_ID, secret = process.env.MERCADOLIBRE_CLIENT_SECRET
  if (!id || !secret) return null
  if (mlToken && mlToken.until > Date.now() + 60_000) return mlToken.value
  const r = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }), cache: 'no-store',
  })
  if (!r.ok) throw new Error(`Mercado Libre no entregó token (${r.status})`)
  const j = (await r.json()) as { access_token?: string; expires_in?: number }
  if (!j.access_token) throw new Error('Mercado Libre no entregó token')
  mlToken = { value: j.access_token, until: Date.now() + (j.expires_in ?? 3600) * 1000 }
  return mlToken.value
}

export type Mercado = { q: string; total: number; n: number; p25?: number; mediana?: number; p75?: number; muestra: { titulo: string; precio: number; url: string; img?: string }[] }

export async function mercadoLibre(q: string): Promise<Res<Mercado>> {
  try {
    const token = await mlAuth()
    if (!token) return { ok: false, error: 'Mercado Libre sin conectar', falta: 'MERCADOLIBRE_CLIENT_ID y MERCADOLIBRE_CLIENT_SECRET' }
    const r = await fetch(`https://api.mercadolibre.com/sites/MLC/search?q=${encodeURIComponent(q)}&limit=50`, {
      headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 3600 },
    })
    if (!r.ok) throw new Error(`Mercado Libre respondió ${r.status}`)
    const j = (await r.json()) as { paging?: { total?: number }; results?: Record<string, unknown>[] }
    const res = j.results ?? []
    const precios = res.map((x) => num(x.price)).filter((p): p is number => p !== undefined).sort((a, b) => a - b)
    const q_ = (f: number) => (precios.length ? precios[Math.min(precios.length - 1, Math.floor(f * (precios.length - 1)))] : undefined)
    return {
      ok: true,
      data: {
        q, total: j.paging?.total ?? res.length, n: precios.length, p25: q_(0.25), mediana: q_(0.5), p75: q_(0.75),
        muestra: res.slice(0, 6).map((x) => ({ titulo: str(x.title) ?? '', precio: num(x.price) ?? 0, url: str(x.permalink) ?? '', img: str(x.thumbnail) })),
      },
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
