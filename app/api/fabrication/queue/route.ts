import { NextRequest, NextResponse } from 'next/server'
import { eq, sql, desc } from 'drizzle-orm'
import { db } from '@/src/db'
import { fabricationSubmissions, fabricationVotes, memoryEvents } from '@/src/db/schema'
import { isoWeekKey } from '@/lib/isoWeek'

const CORRUPTED_WINNER_THRESHOLD = 50

// El nivel de entropía en el momento de declarar un ganador queda en el
// payload de memory_events (ver declareFabricationWinner en
// app/admin/actions.ts), no en una columna propia — esto arma el mapa
// submissionId → esa entropía leyendo los eventos recientes, para marcar
// "forjado bajo corrupción" en la UI. Volumen bajo (un ganador por semana
// como mucho), así que no hace falta una query más fina.
async function entropyAtDeclareBySubmission(): Promise<Record<string, number | null>> {
  const map: Record<string, number | null> = {}
  try {
    const events = await db.select({ payload: memoryEvents.payload })
      .from(memoryEvents)
      .where(eq(memoryEvents.eventType, 'FABRICATION_WINNER_DECLARED'))
      .orderBy(desc(memoryEvents.timestamp))
      .limit(50)
    for (const e of events) {
      const payload = e.payload as { submissionId?: string; entropyAtDeclare?: number | null }
      if (payload?.submissionId && !(payload.submissionId in map)) {
        map[payload.submissionId] = typeof payload.entropyAtDeclare === 'number' ? payload.entropyAtDeclare : null
      }
    }
  } catch {
    // sin esto la UI simplemente no marca ningún ganador como corrupto
  }
  return map
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const visitorId = req.nextUrl.searchParams.get('visitorId')
    const weekOf = isoWeekKey()

    const rows = await db.select({
      id: fabricationSubmissions.id,
      mode: fabricationSubmissions.mode,
      label: fabricationSubmissions.label,
      thumbnail: fabricationSubmissions.thumbnail,
      status: fabricationSubmissions.status,
      createdAt: fabricationSubmissions.createdAt,
      votes: sql<number>`count(${fabricationVotes.visitorId})`,
      votedByMe: visitorId
        ? sql<number>`max(case when ${fabricationVotes.visitorId} = ${visitorId} then 1 else 0 end)`
        : sql<number>`0`,
    })
      .from(fabricationSubmissions)
      .leftJoin(fabricationVotes, eq(fabricationVotes.submissionId, fabricationSubmissions.id))
      .where(eq(fabricationSubmissions.weekOf, weekOf))
      .groupBy(fabricationSubmissions.id)
      .orderBy(desc(sql`count(${fabricationVotes.visitorId})`))

    const hasWinner = rows.some(r => r.status === 'winner')
    const entropyMap = hasWinner ? await entropyAtDeclareBySubmission() : {}

    return NextResponse.json({
      weekOf,
      submissions: rows.map(r => ({
        ...r,
        votedByMe: !!r.votedByMe,
        entropyAtDeclare: r.status === 'winner' ? (entropyMap[r.id] ?? null) : null,
        corrupted: r.status === 'winner' && (entropyMap[r.id] ?? 0) >= CORRUPTED_WINNER_THRESHOLD,
      })),
    })
  } catch (error) {
    console.error('Error en fabrication/queue:', error)
    return NextResponse.json({ weekOf: isoWeekKey(), submissions: [] })
  }
}
