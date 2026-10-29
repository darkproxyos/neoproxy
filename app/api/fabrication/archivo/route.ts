import { NextRequest, NextResponse } from 'next/server'
import { ne, sql, desc } from 'drizzle-orm'
import { db } from '@/src/db'
import { fabricationSubmissions, fabricationVotes } from '@/src/db/schema'
import { isoWeekKey } from '@/lib/isoWeek'

export const dynamic = 'force-dynamic'

const MAX_ROWS = 200

// A diferencia de /api/fabrication/queue (solo la semana ISO actual), esto
// es el archivo completo: nada de lo que se envió alguna vez desaparece,
// solo deja de competir cuando su semana termina.
export async function GET() {
  try {
    const currentWeek = isoWeekKey()

    const rows = await db.select({
      id: fabricationSubmissions.id,
      mode: fabricationSubmissions.mode,
      label: fabricationSubmissions.label,
      thumbnail: fabricationSubmissions.thumbnail,
      status: fabricationSubmissions.status,
      weekOf: fabricationSubmissions.weekOf,
      createdAt: fabricationSubmissions.createdAt,
      votes: sql<number>`count(${fabricationVotes.visitorId})`,
    })
      .from(fabricationSubmissions)
      .leftJoin(fabricationVotes, sql`${fabricationVotes.submissionId} = ${fabricationSubmissions.id}`)
      .where(ne(fabricationSubmissions.weekOf, currentWeek))
      .groupBy(fabricationSubmissions.id)
      .orderBy(desc(fabricationSubmissions.weekOf), desc(sql`count(${fabricationVotes.visitorId})`))
      .limit(MAX_ROWS)

    const weeks: Record<string, typeof rows> = {}
    for (const row of rows) {
      if (!weeks[row.weekOf]) weeks[row.weekOf] = []
      weeks[row.weekOf].push(row)
    }
    const weekOrder = Object.keys(weeks).sort((a, b) => b.localeCompare(a))

    return NextResponse.json({
      weeks: weekOrder.map(weekOf => ({ weekOf, submissions: weeks[weekOf] })),
    })
  } catch (error) {
    console.error('Error en fabrication/archivo:', error)
    return NextResponse.json({ weeks: [] })
  }
}
