// RADAR — ideas nuevas con IA (Claude). Una sola llamada con salida estructurada:
// el JSON vuelve validado contra el esquema. Solo se usa desde app/admin/radar/actions.ts.
import Anthropic from '@anthropic-ai/sdk'
import { betaJSONSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/beta/json-schema'
import { IDEAS, calendario } from './ideas'

const IDEA_SCHEMA = {
  type: 'object',
  properties: {
    ideas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          porque: { type: 'string' },
          material: { type: 'string', enum: ['PLA', 'Resina', 'PLA + resina'] },
          derechos: { type: 'string', enum: ['propio', 'generador', 'encargo', 'licencia'] },
          esfuerzo: { type: 'integer', enum: [1, 2, 3] },
          valor: { type: 'integer', enum: [1, 2, 3] },
          volumen: { type: 'integer', enum: [1, 2, 3] },
          aprox: { type: 'string' },
          temporada: { type: 'string' },
          reel: { type: 'string' },
          ojo: { type: 'string' },
          buscar: { type: 'string' },
          primerPaso: { type: 'string' },
        },
        required: ['nombre', 'porque', 'material', 'derechos', 'esfuerzo', 'valor', 'volumen', 'aprox', 'temporada', 'reel', 'ojo', 'buscar', 'primerPaso'],
        additionalProperties: false,
      },
    },
  },
  required: ['ideas'],
  additionalProperties: false,
} as const

export type IdeaIA = {
  nombre: string; porque: string; material: 'PLA' | 'Resina' | 'PLA + resina'; derechos: 'propio' | 'generador' | 'encargo' | 'licencia'
  esfuerzo: 1 | 2 | 3; valor: 1 | 2 | 3; volumen: 1 | 2 | 3; aprox: string; temporada: string; reel: string; ojo: string; buscar: string; primerPaso: string
}

const SYSTEM = `Eres el socio de negocios de un maker en Chile que imprime en 3D para vender. Tiene una impresora de resina (Anycubic Photon Mono 2, placa de unos 14 × 9 cm) y planea imprimir en PLA (FDM). Vende por Instagram, TikTok, WhatsApp y Mercado Libre; su marca es NeoProxy (arte generativo y tecnología), pero también quiere productos fuera de ese concepto si se venden.

Propón ideas de productos concretas y vendibles en Chile:
- Que se puedan hacer con su equipo, sin máquinas que no tiene.
- Con derechos claros: diseño propio, de sus generadores NeoProxy, encargo del cliente, o modelos que necesiten licencia comercial (dilo en «derechos» y explícalo en «ojo»). Nunca personajes ni logos de marcas.
- Realistas en costo y tiempo («aprox»: material y horas).
- Con un gancho de reel concreto y una búsqueda corta en castellano para validar precios en Mercado Libre («buscar»).
- «primerPaso»: lo primero que haría mañana para probarla.
Escribe en castellano de Chile, frases cortas, sin exagerar ni prometer ventas.`

export type PedidoIdeas = { foco: string; material: 'PLA' | 'Resina' | 'ambos'; cantidad: number; evitar: string[] }

export function pedido(input: PedidoIdeas, hoy = new Date()) {
  const cal = calendario(hoy).slice(0, 4).map((t) => `${t.nombre} en ${t.dias} días`).join('; ')
  const ya = [...IDEAS.map((i) => i.nombre), ...input.evitar].slice(0, 80).join('; ')
  const n = Math.max(3, Math.min(8, Math.round(input.cantidad || 5)))
  const user = [
    `Dame ${n} ideas nuevas.`,
    `Material: ${input.material === 'ambos' ? 'PLA o resina' : input.material}.`,
    input.foco.trim() ? `Foco pedido: ${input.foco.trim().slice(0, 400)}.` : 'Sin foco especial: lo que más convenga ahora.',
    `Próximas fechas comerciales: ${cal}. Si alguna está cerca, prioriza ideas para ella (en «temporada» pon el nombre de la fecha, o «todo el año»).`,
    `No repitas estas (ya están en su lista): ${ya}.`,
  ].join('\n')
  return { n, user }
}

export type ResultadoIdeas = { ok: true; data: IdeaIA[] } | { ok: false; error: string }

export async function generarIdeas(client: Anthropic, input: PedidoIdeas): Promise<ResultadoIdeas> {
  const { n, user } = pedido(input)
  const res = await client.beta.messages.parse({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: betaJSONSchemaOutputFormat(IDEA_SCHEMA) },
    system: SYSTEM,
    messages: [{ role: 'user', content: user }],
  })
  if (res.stop_reason === 'refusal') return { ok: false, error: 'El modelo no quiso responder esta vez; prueba con otro foco.' }
  if (res.stop_reason === 'max_tokens') return { ok: false, error: 'La respuesta quedó cortada; pide menos ideas.' }
  const out = res.parsed_output as { ideas?: IdeaIA[] } | null
  if (!out?.ideas?.length) return { ok: false, error: 'No llegaron ideas; intenta de nuevo.' }
  return { ok: true, data: out.ideas.slice(0, n) }
}
