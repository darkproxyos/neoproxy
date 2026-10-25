import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { entries, type KnowledgeEntry } from '@/components/knowledge/entries'
import { tensions } from '@/components/knowledge/tensions'

export const runtime = 'nodejs'

const MAX_TOPIC_LEN = 300

// Más estricto que el concilio de Proxyverse (hasta 4 llamadas): acá son
// siempre 5 llamadas por request (tesis, antítesis, 2 réplicas, síntesis).
const hits = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 3

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const recent = (hits.get(ip) || []).filter(t => t > windowStart)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > RATE_LIMIT_MAX
}

type Turn = 'tesis' | 'antitesis' | 'replica'
type ExchangeLine = { speaker: 'a' | 'b' | 'sistema'; entryId?: string; role: string; line: string }

// A diferencia de buildAgentSystemPrompt (components/proxyverse/agents.ts,
// agentes ficticios del kernel), acá los "personajes" son pensadores reales
// — la regla no es "improvisá en personaje", es "argumentá SOLO desde tu
// posición documentada", para no ponerle ideas inventadas en la boca a
// alguien que de verdad existió.
function buildThinkerPrompt(entry: KnowledgeEntry, opponent: KnowledgeEntry, turn: Turn, topic: string): string {
  const lines = [
    `Sos ${entry.name} (${entry.years}), ${entry.role}.`,
    `Tu posición documentada, tal como consta en el archivo: "${entry.summary}"`,
    `La formulás así: "${entry.formula}" (${entry.formulaLabel}).`,
    '',
    'Reglas estrictas:',
    '- Argumentá SIEMPRE desde esa posición documentada arriba — no inventes ideas que no son tuyas, no te ablandés para quedar bien ni cedas terreno que no cederías de verdad.',
    `- Estás en debate directo con ${opponent.name} (${opponent.role}), cuya posición documentada es: "${opponent.summary}"`,
    `- El tema del debate es: "${topic}"`,
    '- Tono: filoso, denso pero claro — como si de verdad estuvieras defendiendo esto en un debate en vivo, no dando una clase.',
    '- Respondé en español. Máximo 4 oraciones cortas. Nunca markdown, nunca listas, nunca digas que sos un modelo de lenguaje o una IA.',
  ]
  if (turn === 'tesis') {
    lines.push('- Este es tu turno de abrir: plantá tu posición sobre el tema con claridad, sin responder a nadie todavía.')
  } else if (turn === 'antitesis') {
    lines.push(`- ${opponent.name} acaba de plantar su posición. Este es tu turno de contestar DIRECTAMENTE a lo que dijo, marcando con precisión dónde tu posición choca con la suya.`)
  } else {
    lines.push(`- Es tu segunda intervención. Respondé puntualmente a lo último que dijo ${opponent.name}, sin repetir lo que ya dijiste vos.`)
  }
  return lines.join('\n')
}

function buildSynthesisPrompt(a: KnowledgeEntry, b: KnowledgeEntry, topic: string): string {
  return [
    'Sos la voz de registro de NeoProxy — no un personaje, el sistema que observa el intercambio que acaba de terminar.',
    `Acabás de ver debatir a ${a.name} y ${b.name} sobre: "${topic}".`,
    'Tu trabajo: decir, con honestidad, si hay una síntesis real posible entre las dos posiciones, o si la tensión queda genuinamente abierta — no fuerces un acuerdo falso si el intercambio no lo mostró.',
    'Tono: breve, seco, observacional — no sos un árbitro declarando un ganador, sos un registro de si la distancia se cerró o no.',
    'Español. Máximo 3 oraciones cortas. Nunca markdown, nunca digas que sos una IA de Anthropic (sos "el sistema", nada más).',
  ].join('\n')
}

function cannedExchange(a: KnowledgeEntry, b: KnowledgeEntry): ExchangeLine[] {
  return [
    { speaker: 'a', entryId: a.id, role: 'TESIS', line: a.summary },
    { speaker: 'b', entryId: b.id, role: 'ANTÍTESIS', line: b.summary },
    { speaker: 'a', entryId: a.id, role: 'RÉPLICA', line: a.example },
    { speaker: 'b', entryId: b.id, role: 'RÉPLICA', line: b.example },
    {
      speaker: 'sistema', role: 'REGISTRO',
      line: 'Sin conexión a Claude para intentar una síntesis en vivo — estas son las posiciones registradas de cada autor, tal como constan en /knowledge.',
    },
  ]
}

export async function POST(req: NextRequest) {
  const { tensionId, topic } = await req.json()

  if (typeof tensionId !== 'string') {
    return NextResponse.json({ error: 'tensionId es requerido' }, { status: 400 })
  }
  const tension = tensions.find(t => t.id === tensionId)
  if (!tension) {
    return NextResponse.json({ error: 'tensión inválida' }, { status: 400 })
  }
  const a = entries.find(e => e.id === tension.aId)
  const b = entries.find(e => e.id === tension.bId)
  if (!a || !b) {
    return NextResponse.json({ error: 'entradas no encontradas' }, { status: 500 })
  }
  const trimmedTopic = (typeof topic === 'string' ? topic.trim() : '').slice(0, MAX_TOPIC_LEN) || tension.topicHint

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ exchange: cannedExchange(a, b), fallback: true })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ exchange: cannedExchange(a, b), fallback: true })
  }

  const client = new Anthropic({ apiKey })
  const exchange: ExchangeLine[] = []

  const callTurn = async (speaker: 'a' | 'b', entry: KnowledgeEntry, opponent: KnowledgeEntry, turn: Turn, roleLabel: string) => {
    const priorText = exchange
      .map(e => `${e.role} (${e.speaker === 'sistema' ? 'sistema' : (e.speaker === 'a' ? a.name : b.name)}): "${e.line}"`)
      .join('\n')
    const userContent = priorText
      ? `Tema del debate: "${trimmedTopic}"\n\nHasta ahora:\n${priorText}\n\nTu turno (${roleLabel}).`
      : `Tema del debate: "${trimmedTopic}"\n\nSos el primero en hablar. Tu turno (${roleLabel}).`
    try {
      const response = await client.messages.create({
        model: 'claude-opus-5-5',
        max_tokens: 300,
        output_config: { effort: 'low' },
        system: buildThinkerPrompt(entry, opponent, turn, trimmedTopic),
        messages: [{ role: 'user', content: userContent }],
      })
      const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
      const line = textBlock?.text?.trim()
      exchange.push({ speaker, entryId: entry.id, role: roleLabel, line: line || entry.summary })
    } catch (err) {
      console.error('dialectica: fallo la llamada a Claude para', entry.id, err)
      exchange.push({ speaker, entryId: entry.id, role: roleLabel, line: entry.summary })
    }
  }

  await callTurn('a', a, b, 'tesis', 'TESIS')
  await callTurn('b', b, a, 'antitesis', 'ANTÍTESIS')
  await callTurn('a', a, b, 'replica', 'RÉPLICA')
  await callTurn('b', b, a, 'replica', 'RÉPLICA')

  try {
    const priorText = exchange.map(e => `${e.role} (${e.speaker === 'a' ? a.name : b.name}): "${e.line}"`).join('\n')
    const response = await client.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 220,
      output_config: { effort: 'low' },
      system: buildSynthesisPrompt(a, b, trimmedTopic),
      messages: [{ role: 'user', content: `Intercambio completo:\n${priorText}\n\n¿Hay síntesis o la tensión queda abierta?` }],
    })
    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    const line = textBlock?.text?.trim()
    exchange.push({ speaker: 'sistema', role: 'REGISTRO', line: line || 'La tensión queda registrada, no resuelta.' })
  } catch (err) {
    console.error('dialectica: fallo la llamada a Claude en la síntesis', err)
    exchange.push({ speaker: 'sistema', role: 'REGISTRO', line: 'La tensión queda registrada, no resuelta — sin conexión para intentar cerrarla.' })
  }

  return NextResponse.json({ exchange, fallback: false })
}
