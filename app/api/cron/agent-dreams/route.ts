import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { gte, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/src/db'
import { agentDiaryEntries, memoryEvents, systemState, fabricationSubmissions } from '@/src/db/schema'
import { agents, buildAgentDiaryPrompt, DIARY_AGENT_IDS } from '@/components/proxyverse/agents'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function todayKey(): string {
  return new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD', UTC
}

async function buildRealSignals(): Promise<string> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const parts: string[] = []

  try {
    const stateRows = await db.select().from(systemState).limit(1)
    const state = stateRows[0]
    if (state) {
      parts.push(`entropía del sistema en ${state.entropyLevel.toFixed(1)}%, corrupción total ${state.totalCorruption.toFixed(1)}, coherencia total ${state.totalCoherence.toFixed(1)}`)
    }
  } catch (err) {
    console.error('agent-dreams: no se pudo leer systemState:', err)
  }

  try {
    const recentEvents = await db.select({
      eventType: memoryEvents.eventType,
      count: sql<number>`count(*)`,
    }).from(memoryEvents).where(gte(memoryEvents.timestamp, since)).groupBy(memoryEvents.eventType)
    if (recentEvents.length > 0) {
      parts.push(`eventos de memoria en las últimas 24hs: ${recentEvents.map(e => `${e.eventType} x${e.count}`).join(', ')}`)
    } else {
      parts.push('sin eventos de memoria nuevos en las últimas 24hs')
    }
  } catch (err) {
    console.error('agent-dreams: no se pudo leer memoryEvents:', err)
  }

  try {
    const recentSubmissions = await db.select({ count: sql<number>`count(*)` })
      .from(fabricationSubmissions).where(gte(fabricationSubmissions.createdAt, since))
    const count = recentSubmissions[0]?.count ?? 0
    parts.push(count > 0 ? `${count} especímenes nuevos entraron a la cola de fabricación` : 'nadie mandó nada nuevo a la cola de fabricación')
  } catch (err) {
    console.error('agent-dreams: no se pudo leer fabricationSubmissions:', err)
  }

  return parts.length > 0 ? parts.join('; ') + '.' : 'el sistema estuvo en silencio total — ninguna señal nueva.'
}

export async function GET(req: NextRequest) {
  // Mismo patrón documentado por Vercel para cron jobs: el header lo agrega
  // Vercel automáticamente al invocar según vercel.json, no hace falta
  // configurarlo a mano acá — solo setear CRON_SECRET como env var.
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 })
  }

  const dateKey = todayKey()
  const signals = await buildRealSignals()
  const client = new Anthropic({ apiKey })

  const results: { agentId: string; status: 'created' | 'skipped' | 'error' }[] = []

  for (const agentId of DIARY_AGENT_IDS) {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) { results.push({ agentId, status: 'error' }); continue }

    try {
      const existing = await db.select({ agentId: agentDiaryEntries.agentId })
        .from(agentDiaryEntries)
        .where(sql`${agentDiaryEntries.agentId} = ${agentId} AND ${agentDiaryEntries.dateKey} = ${dateKey}`)
        .limit(1)
      if (existing.length > 0) { results.push({ agentId, status: 'skipped' }); continue }

      const response = await client.messages.create({
        model: 'claude-opus-5-5',
        max_tokens: 200,
        system: buildAgentDiaryPrompt(agent, signals),
        messages: [{ role: 'user', content: 'Escribí tu entrada de diario de hoy.' }],
      })
      const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
      const entry = textBlock?.text?.trim()
      if (!entry) { results.push({ agentId, status: 'error' }); continue }

      await db.insert(agentDiaryEntries).values({ agentId, dateKey, entry }).onConflictDoNothing()
      revalidatePath(`/proxyverse/${agentId}`)
      results.push({ agentId, status: 'created' })
    } catch (err) {
      console.error(`agent-dreams: error con ${agentId}:`, err)
      results.push({ agentId, status: 'error' })
    }
  }

  return NextResponse.json({ dateKey, signals, results })
}
