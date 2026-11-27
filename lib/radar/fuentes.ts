// RADAR — conectores a fuentes externas (solo servidor). Cada uno usa la API oficial y
// se activa con su variable de entorno; sin ella, el radar lo muestra como «por conectar».
// Las respuestas se guardan en caché (una hora) para no gastar la cuota de cada API.
// solo se importa desde app/radar/actions.ts ('use server')
import { vendible } from './ideas'
import { buscar, mlConfigurado, type MLError } from './ml'

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
  mercadoLibre: mlConfigurado(),
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

// ---- Mercado Libre Chile: precios de lo que ya se vende (detalle en lib/radar/ml.ts) ----
export type Mercado = { q: string; total: number; n: number; via: 'busqueda' | 'catalogo'; p25?: number; mediana?: number; p75?: number; muestra: { titulo: string; precio: number; url: string; img?: string }[] }

export async function mercadoLibre(q: string): Promise<Res<Mercado>> {
  try {
    const b = await buscar(q)
    const precios = b.items.map((x) => x.precio).sort((a, c) => a - c)
    const q_ = (f: number) => (precios.length ? precios[Math.min(precios.length - 1, Math.floor(f * (precios.length - 1)))] : undefined)
    return {
      ok: true,
      data: {
        q, total: b.total, n: precios.length, via: b.via, p25: q_(0.25), mediana: q_(0.5), p75: q_(0.75),
        muestra: b.items.slice(0, 6).map((x) => ({ titulo: x.titulo, precio: x.precio, url: x.url, img: x.img })),
      },
    }
  } catch (e) {
    const err = e as MLError
    return { ok: false, error: err.message, falta: err.falta }
  }
}
