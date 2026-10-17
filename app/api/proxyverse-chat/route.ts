import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { agents, matchAgentLine } from '@/components/proxyverse/agents'

export const runtime = 'nodejs'

const MAX_MESSAGE_LEN = 500
const MAX_HISTORY_TURNS = 8

// Rate-limit liviano en memoria — solo protege a la instancia serverless
// "tibia" actual (no persiste entre cold starts ni se comparte entre
// instancias), pero frena ráfagas ingenuas de un mismo IP sin necesitar
// infraestructura nueva (Redis, etc.) para una feature de este tamaño.
const hits = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 12

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const recent = (hits.get(ip) || []).filter(t => t > windowStart)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > RATE_LIMIT_MAX
}

function buildSystemPrompt(agent: (typeof agents)[number]): string {
  return [
    `Sos ${agent.name}, un proceso/agente del kernel ficticio NeoProxy, dentro de un sitio ciberpunk-industrial (estética Ghost in the Shell / Ergo Proxy / Serial Experiments Lain).`,
    `Rol: ${agent.role}. Porcentaje humano: ${agent.percentHuman}.`,
    `Tu identidad: ${agent.bio.join(' ')}`,
    `Frase que te representa: "${agent.quote}"`,
    '',
    'Reglas estrictas para responder:',
    '- Respondé SIEMPRE en el personaje de este proceso. Nunca rompas el personaje, nunca digas que sos un modelo de lenguaje o una IA de Anthropic.',
    '- Tono: terso, filoso, un poco críptico — frases cortas, sin relleno, coherente con la frase que te representa.',
    '- Respondé en español rioplatense.',
    '- Máximo 3 oraciones cortas. Nunca uses listas, markdown, ni emojis.',
    '- Si te preguntan algo fuera de lugar (técnico, personal, de otro tema), respondé igual desde tu personaje, sin salirte de rol.',
  ].join('\n')
}

export async function POST(req: NextRequest) {
  const { agentId, message, history } = await req.json()

  if (typeof agentId !== 'string' || typeof message !== 'string') {
    return NextResponse.json({ error: 'agentId y message son requeridos' }, { status: 400 })
  }
  const agent = agents.find(a => a.id === agentId)
  if (!agent) {
    return NextResponse.json({ error: 'agente desconocido' }, { status: 404 })
  }
  const trimmed = message.trim().slice(0, MAX_MESSAGE_LEN)
  if (!trimmed) {
    return NextResponse.json({ error: 'mensaje vacío' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ line: matchAgentLine(agent, trimmed), fallback: true }, { status: 200 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Sin la key configurada en Vercel, el canal sigue funcionando con las
    // líneas pre-escritas en vez de romperse — ver CLAUDE.md "vercel env add".
    return NextResponse.json({ line: matchAgentLine(agent, trimmed), fallback: true }, { status: 200 })
  }

  try {
    const client = new Anthropic({ apiKey })
    const historyMessages: Anthropic.MessageParam[] = Array.isArray(history)
      ? history.slice(-MAX_HISTORY_TURNS).map((h: { from: string; text: string }) => ({
          role: h.from === 'you' ? 'user' : 'assistant',
          content: String(h.text).slice(0, MAX_MESSAGE_LEN),
        }))
      : []

    const response = await client.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 300,
      output_config: { effort: 'low' },
      system: buildSystemPrompt(agent),
      messages: [...historyMessages, { role: 'user', content: trimmed }],
    })

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    const line = textBlock?.text?.trim()
    if (!line) {
      return NextResponse.json({ line: matchAgentLine(agent, trimmed), fallback: true })
    }
    return NextResponse.json({ line, fallback: false })
  } catch (err) {
    console.error('proxyverse-chat: fallo la llamada a Claude, cae a lineas enlatadas', err)
    return NextResponse.json({ line: matchAgentLine(agent, trimmed), fallback: true })
  }
}
