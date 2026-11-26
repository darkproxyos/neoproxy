'use server'

import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { thingiverse, mercadoLibre, ESTADO } from '@/lib/radar/fuentes'
import { generarIdeas, type PedidoIdeas } from '@/lib/radar/ia'

// Mismo criterio que app/admin/actions.ts: el middleware exige sesión para /admin y
// esto exige además el rol root (o el bypass temporal, si está activo).
const BYPASS_ADMIN_AUTH = process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === 'true'
async function esRoot() {
  if (BYPASS_ADMIN_AUTH) return true
  const session = await auth()
  return (session?.user as { role?: string } | undefined)?.role === 'root'
}

export async function radarEstado() {
  if (!(await esRoot())) return { ok: false as const, error: 'SIN ACCESO' }
  return { ok: true as const, data: ESTADO() }
}

export async function radarThingiverse(modo: 'popular' | 'newest' | 'featured', q?: string) {
  if (!(await esRoot())) return { ok: false as const, error: 'SIN ACCESO' }
  return thingiverse(modo, q?.trim() || undefined)
}

export async function radarMercado(q: string) {
  if (!(await esRoot())) return { ok: false as const, error: 'SIN ACCESO' }
  if (!q.trim()) return { ok: false as const, error: 'Escribe qué buscar' }
  return mercadoLibre(q.trim())
}

// ---------------------------------------------------------------------------------
// Ideas nuevas con IA (lib/radar/ia.ts): solo cuando las pides; cada clic consume tokens
// de tu clave de Anthropic.

export async function radarGenerarIdeas(input: PedidoIdeas) {
  if (!(await esRoot())) return { ok: false as const, error: 'SIN ACCESO' }
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
