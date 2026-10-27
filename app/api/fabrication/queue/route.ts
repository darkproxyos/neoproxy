import { NextRequest, NextResponse } from 'next/server'
import { eq, sql, desc } from 'drizzle-orm'
import { db } from '@/src/db'
import { fabricationSubmissions, fabricationVotes } from '@/src/db/schema'
import { isoWeekKey } from '@/lib/isoWeek'

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

    return NextResponse.json({
      weekOf,
      submissions: rows.map(r => ({ ...r, votedByMe: !!r.votedByMe })),
    })
  } catch (error) {
    console.error('Error en fabrication/queue:', error)
    return NextResponse.json({ weekOf: isoWeekKey(), submissions: [] })
  }
}
