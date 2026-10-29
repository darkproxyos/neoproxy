import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { and, eq, gte, inArray, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/src/db'
import { agentDiaryEntries } from '@/src/db/schema'
import { DIARY_AGENT_IDS, NIGHTLY_COUNCIL_AGENT_ID, buildNightlyCouncilPrompt } from '@/components/proxyverse/agents'
import { isoWeekKey } from '@/lib/isoWeek'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function todayKey(): string {
  return new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD', UTC
}

// El lunes de la semana ISO actual, en el mismo formato 'YYYY-MM-DD' que
// usan las entradas diarias — así la ventana de lectura de la semana
// (gte(dateKey, weekStartKey())) queda en el mismo formato que la columna,
// sin tener que mezclar claves de dos formatos distintos.
function weekStartKey(): string {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - dayNum + 1)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 })
  }

  const currentWeek = isoWeekKey()

  try {
    // Idempotencia: la fila usa la fecha real del día en que corre (no la
    // semana ISO) como dateKey, así que un reintento del mismo cron el
    // mismo día cae en el mismo PK (agentId, dateKey) y onConflictDoNothing
    // lo cubre — pero un reintento manual en OTRO día de la misma semana
    // necesita este chequeo aparte para no duplicar el sueño colectivo.
    const [lastCouncil] = await db.select({ dateKey: agentDiaryEntries.dateKey })
      .from(agentDiaryEntries)
      .where(eq(agentDiaryEntries.agentId, NIGHTLY_COUNCIL_AGENT_ID))
      .orderBy(desc(agentDiaryEntries.dateKey))
      .limit(1)
    if (lastCouncil && isoWeekKey(new Date(lastCouncil.dateKey)) === currentWeek) {
      return NextResponse.json({ status: 'skipped', reason: 'ya hubo consejo nocturno esta semana ISO', week: currentWeek })
    }

    const weekEntries = await db.select({ agentId: agentDiaryEntries.agentId, entry: agentDiaryEntries.entry })
      .from(agentDiaryEntries)
      .where(and(inArray(agentDiaryEntries.agentId, DIARY_AGENT_IDS), gte(agentDiaryEntries.dateKey, weekStartKey())))
      .orderBy(agentDiaryEntries.dateKey)

    if (weekEntries.length === 0) {
      return NextResponse.json({ status: 'skipped', reason: 'ningún proceso escribió diario esta semana', week: currentWeek })
    }

    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 260,
      system: buildNightlyCouncilPrompt(weekEntries),
      messages: [{ role: 'user', content: 'Escribí la escena del sueño colectivo de esta semana.' }],
    })
    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    const entry = textBlock?.text?.trim()
    if (!entry) {
      return NextResponse.json({ error: 'claude no devolvió texto' }, { status: 500 })
    }

    const dateKey = todayKey()
    await db.insert(agentDiaryEntries)
      .values({ agentId: NIGHTLY_COUNCIL_AGENT_ID, dateKey, entry })
      .onConflictDoNothing()
    revalidatePath('/proxyverse/suenos')

    return NextResponse.json({ status: 'created', week: currentWeek, dateKey, sourceEntries: weekEntries.length })
  } catch (err) {
    console.error('consejo-nocturno: error:', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
