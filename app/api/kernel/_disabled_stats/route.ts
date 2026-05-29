import { NextResponse } from 'next/server'
import { db } from '@/lib/core-db'
import { users, sessions } from '@/src/db/schema'
import { sql } from 'drizzle-orm'
import { auth } from '@/auth'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()

    // 1. Usuarios registrados
    const usersCountResult = await db.select({ count: sql<number>`count(*)` }).from(users)
    const usersCount = usersCountResult[0]?.count || 0

    // 2. Sesiones activas
    const now = Date.now()
    const activeSessionsResult = await db.select({ count: sql<number>`count(*)` })
      .from(sessions)
      .where(sql`${sessions.expiresAt} > ${now}`)
    const sessionsCount = activeSessionsResult[0]?.count || 0

    // 3. Uptime del servidor
    const uptime = process.uptime()

    // 4. Rutas activas
    const routesCount = 12

    // 5. Último login
    const lastSessionResult = await db.select({ 
      maxExpires: sql<number>`max(${sessions.expiresAt})` 
    }).from(sessions)
    const lastLogin = lastSessionResult[0]?.maxExpires || null

    // 6. Operador actual
    const currentOperator = session?.user?.name || 'ANONYMOUS'

    return NextResponse.json({
      usersCount,
      sessionsCount,
      uptime,
      routesCount,
      lastLogin,
      currentOperator
    })
  } catch (error) {
    console.error('Kernel stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch kernel stats' }, { status: 500 })
  }
}
