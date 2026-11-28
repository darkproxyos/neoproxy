'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createHash, timingSafeEqual } from 'crypto'
import { thingiverse, mercadoLibre, ESTADO } from '@/lib/radar/fuentes'
import { generarIdeas, generarProyectos, reanalizar, type PedidoIdeas } from '@/lib/radar/ia'
import { cazar, tendencias, diagnostico, MLError, type Caza } from '@/lib/radar/ml'
import { limpiarVigilancia, type Vigilancia } from '@/lib/radar/ofertas'
import { limpiarEntrada, type Entrada } from '@/lib/radar/proyectos'

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

// errores de la API de Anthropic, con el mismo texto para cualquier función de IA
function iaFallo(err: unknown, que: string) {
  if (err instanceof Anthropic.RateLimitError) return { ok: false as const, error: 'Demasiadas solicitudes seguidas; espera un minuto.' }
  if (err instanceof Anthropic.AuthenticationError) return { ok: false as const, error: 'La clave de Anthropic no es válida.' }
  if (err instanceof Anthropic.APIError) return { ok: false as const, error: `Error de la API (${err.status ?? '?'}).` }
  console.error(`radar: fallo ${que}`, err)
  return { ok: false as const, error: 'No se pudo conectar con la IA.' }
}

export async function radarGenerarIdeas(clave: string, input: PedidoIdeas) {
  if (!(await claveOk(clave))) return SIN_CLAVE
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false as const, error: 'Falta ANTHROPIC_API_KEY en el servidor' }
  try {
    return await generarIdeas(new Anthropic({ apiKey }), input)
  } catch (err) {
    return iaFallo(err, 'generando ideas')
  }
}

// PROTOTIPOS: ideas nuevas de negocio con electrónica y re-análisis del banco guardado.
export async function radarGenerarProyectos(clave: string, input: { foco: string; cantidad: number; presupuesto: number; evitar: string[] }) {
  if (!(await claveOk(clave))) return SIN_CLAVE
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false as const, error: 'Falta ANTHROPIC_API_KEY en el servidor' }
  const evitar = (Array.isArray(input.evitar) ? input.evitar : []).filter((x): x is string => typeof x === 'string').slice(0, 80).map((x) => x.slice(0, 120))
  try {
    return await generarProyectos(new Anthropic({ apiKey }), {
      foco: typeof input.foco === 'string' ? input.foco : '', cantidad: Number(input.cantidad) || 5,
      presupuesto: Number.isFinite(input.presupuesto) ? Math.max(0, input.presupuesto) : 0, evitar,
    })
  } catch (err) {
    return iaFallo(err, 'generando proyectos')
  }
}

export async function radarReanalizar(clave: string, entradas: unknown[], presupuesto: number) {
  if (!(await claveOk(clave))) return SIN_CLAVE
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false as const, error: 'Falta ANTHROPIC_API_KEY en el servidor' }
  const ideas = (Array.isArray(entradas) ? entradas : []).slice(0, 20).map(limpiarEntrada).filter((e): e is Entrada => !!e && e.estado !== 'descartada')
    .map((e) => ({ id: e.p.id, p: e.p, estado: e.estado, notas: e.notas }))
  if (!ideas.length) return { ok: false as const, error: 'No hay ideas para analizar.' }
  try {
    return await reanalizar(new Anthropic({ apiKey }), { ideas, presupuesto: Number.isFinite(presupuesto) ? Math.max(0, presupuesto) : 0 })
  } catch (err) {
    return iaFallo(err, 're-analizando')
  }
}
