'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createHash, timingSafeEqual } from 'crypto'
import { thingiverse, mercadoLibre, ESTADO } from '@/lib/radar/fuentes'
import { generarIdeas, type PedidoIdeas } from '@/lib/radar/ia'

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
