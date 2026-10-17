import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { agents, matchAgentLine, buildAgentSystemPrompt, type ProxyAgent } from '@/components/proxyverse/agents'

export const runtime = 'nodejs'

const MAX_QUESTION_LEN = 400
const MIN_AGENTS = 2
const MAX_AGENTS = 4

// Límite más estricto que el chat 1:1 — un concilio de 4 agentes son hasta
// 4 llamadas a Claude por request.
const hits = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 4

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const recent = (hits.get(ip) || []).filter(t => t > windowStart)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > RATE_LIMIT_MAX
}

type TranscriptLine = { agentId: string; line: string }

function cannedTranscript(selected: ProxyAgent[], question: string): TranscriptLine[] {
  return selected.map(a => ({ agentId: a.id, line: matchAgentLine(a, question) }))
}

export async function POST(req: NextRequest) {
  const { question, agentIds } = await req.json()

  if (typeof question !== 'string' || !Array.isArray(agentIds)) {
    return NextResponse.json({ error: 'question y agentIds son requeridos' }, { status: 400 })
  }
  const trimmedQuestion = question.trim().slice(0, MAX_QUESTION_LEN)
  if (!trimmedQuestion) {
    return NextResponse.json({ error: 'pregunta vacía' }, { status: 400 })
  }
  const uniqueIds = [...new Set(agentIds)].slice(0, MAX_AGENTS)
  const selected = uniqueIds
    .map(id => agents.find(a => a.id === id))
    .filter((a): a is ProxyAgent => !!a)
  if (selected.length < MIN_AGENTS) {
    return NextResponse.json({ error: `hacen falta al menos ${MIN_AGENTS} agentes válidos` }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ transcript: cannedTranscript(selected, trimmedQuestion), fallback: true })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ transcript: cannedTranscript(selected, trimmedQuestion), fallback: true })
  }

  const client = new Anthropic({ apiKey })
  const transcript: TranscriptLine[] = []

  for (const agent of selected) {
    const otherNames = selected.filter(a => a.id !== agent.id).map(a => a.name)
    const priorText = transcript
      .map(t => `${agents.find(a => a.id === t.agentId)?.name ?? t.agentId}: "${t.line}"`)
      .join('\n')
    const userContent = priorText
      ? `Tema planteado en la sala: "${trimmedQuestion}"\n\nLo que ya se dijo en este turno:\n${priorText}\n\nTu turno de responder.`
      : `Tema planteado en la sala: "${trimmedQuestion}"\n\nSos el primero en responder.`

    try {
      const response = await client.messages.create({
        model: 'claude-opus-5-5',
        max_tokens: 250,
        output_config: { effort: 'low' },
        system: buildAgentSystemPrompt(agent, 'concilio', otherNames),
        messages: [{ role: 'user', content: userContent }],
      })
      const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
      const line = textBlock?.text?.trim()
      transcript.push({ agentId: agent.id, line: line || matchAgentLine(agent, trimmedQuestion) })
    } catch (err) {
      console.error('proxyverse-council: fallo la llamada a Claude para', agent.id, err)
      transcript.push({ agentId: agent.id, line: matchAgentLine(agent, trimmedQuestion) })
    }
  }

  return NextResponse.json({ transcript, fallback: false })
}
