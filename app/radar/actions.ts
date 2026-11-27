'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createHash, timingSafeEqual } from 'crypto'
import { thingiverse, mercadoLibre, ESTADO } from '@/lib/radar/fuentes'
import { generarIdeas, type PedidoIdeas } from '@/lib/radar/ia'
import { cazar, tendencias, diagnostico, MLError, type Caza } from '@/lib/radar/ml'
import { limpiarVigilancia, type Vigilancia } from '@/lib/radar/ofertas'

// /radar no pide login. Lo que gasta (la IA con tu clave de Anthropic, las cuotas de
// Thingiverse y Mercado Libre) pide la clave personal RADAR_CLAVE, que se carga en
// Vercel con `vercel env add RADAR_CLAVE` y se escribe una vez en el navegador.
const SIN_CLAVE = { ok: false as const, error: 'Clave de RADAR incorrecta o sin cargar' }
async function claveOk(clave: string | undefined) {
  const real = process.env.RADAR_CLAVE
  if (!real || !clave) return false
  const a = createHash('sha256').update(clave).digest(), b = createHash('sha256').update(real).digest()
  const ok = timingSafeEqual(a, b)
  if (!ok) await new Promise((r) => setTimeout(r, 400)) // frena a quien pruebe claves al azar
  return ok
}

export async function radarEstado(clave?: string) {
  const configurada = !!process.env.RADAR_CLAVE
  const valida = await claveOk(clave)
  return { ok: true as const, data: { configurada, valida, ...(valida ? ESTADO() : { thingiverse: false, mercadoLibre: false, ia: false }) } }
}

export async function radarThingiverse(clave: string, modo: 'popular' | 'newest' | 'featured', q?: string) {
  if (!(await claveOk(clave))) return SIN_CLAVE
  return thingiverse(modo, q?.trim() || undefined)
}

export async function radarMercado(clave: string, q: string) {
  if (!(await claveOk(clave))) return SIN_CLAVE
  if (!q.trim()) return { ok: false as const, error: 'Escribe qué buscar' }
  return mercadoLibre(q.trim())
}

// ---------------------------------------------------------------------------------
// CAZADOR (lib/radar/ml.ts + lib/radar/ofertas.ts): ofertas en lo que vigilas,
// tendencias de búsqueda en Chile y un diagnóstico de qué responde con tu app.

const mlFallo = (e: unknown) => {
  if (e instanceof MLError) return { ok: false as const, error: e.message, falta: e.falta }
  console.error('radar: fallo en Mercado Libre', e)
  return { ok: false as const, error: 'No se pudo conectar con Mercado Libre.' }
}

export async function radarCazar(clave: string, vigilancias: unknown[]) {
  if (!(await claveOk(clave))) return SIN_CLAVE
  const vs = (Array.isArray(vigilancias) ? vigilancias : []).slice(0, 12).map(limpiarVigilancia).filter((v): v is Vigilancia => !!v)
  if (!vs.length) return { ok: false as const, error: 'No hay nada que vigilar' }
  const res = await Promise.all(vs.map(async (v): Promise<Caza | { id: string; error: string; falta?: string }> => {
    try { return await cazar(v) } catch (e) { const f = mlFallo(e); return { id: v.id, error: f.error, falta: 'falta' in f ? f.falta : undefined } }
  }))
  // si todas fallan por lo mismo (sin conectar, token malo), se informa una vez
  const errs = res.filter((r): r is { id: string; error: string; falta?: string } => 'error' in r && !('items' in r))
  if (errs.length === res.length) return { ok: false as const, error: errs[0].error, falta: errs[0].falta }
  return { ok: true as const, data: res }
}

export async function radarTendencias(clave: string, cat?: string) {
  if (!(await claveOk(clave))) return SIN_CLAVE
  if (cat && !/^MLC\d{1,12}$/.test(cat)) return { ok: false as const, error: 'Categoría inválida' }
  try { return { ok: true as const, data: await tendencias(cat) } } catch (e) { return mlFallo(e) }
}

export async function radarDiagnosticoML(clave: string) {
  if (!(await claveOk(clave))) return SIN_CLAVE
  return { ok: true as const, data: await diagnostico() }
}

// ---------------------------------------------------------------------------------
// Ideas nuevas con IA (lib/radar/ia.ts): solo cuando las pides; cada clic consume tokens
// de tu clave de Anthropic.

export async function radarGenerarIdeas(clave: string, input: PedidoIdeas) {
  if (!(await claveOk(clave))) return SIN_CLAVE
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false as const, error: 'Falta ANTHROPIC_API_KEY en el servidor' }
  try {
    return await generarIdeas(new Anthropic({ apiKey }), input)
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return { ok: false as const, error: 'Demasiadas solicitudes seguidas; espera un minuto.' }
    if (err instanceof Anthropic.AuthenticationError) return { ok: false as const, error: 'La clave de Anthropic no es válida.' }
    if (err instanceof Anthropic.APIError) return { ok: false as const, error: `Error de la API (${err.status ?? '?'}).` }
    console.error('radar: fallo generando ideas', err)
    return { ok: false as const, error: 'No se pudo conectar con la IA.' }
  }
}
