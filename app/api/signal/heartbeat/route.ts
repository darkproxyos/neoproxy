import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { addSignal, getSignalHistory } from '@/lib/signal/engine'

export const runtime = 'nodejs'

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const history = await getSignalHistory(userId)

  // Solo 1 heartbeat por día
  const today = new Date().toDateString()
  const alreadyToday = history.some(t =>
    t.reason === 'HEARTBEAT' &&
    new Date(t.createdAt).toDateString() === today
  )

  if (alreadyToday) {
    return NextResponse.json({ ok: false, msg: 'already synced today' })
  }

  await addSignal(userId, 5, 'HEARTBEAT')
  return NextResponse.json({ ok: true, signal: 5, msg: 'NODE_SYNCED +5 SIGNAL' })
}
