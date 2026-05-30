import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSignalBalance, getSignalHistory, addSignal } from '@/lib/signal/engine'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const balance = await getSignalBalance(userId)
  const history = await getSignalHistory(userId)
  const discount = balance >= 1000 ? 30 : balance >= 500 ? 15 : balance >= 100 ? 5 : 0
  return NextResponse.json({ balance, discount, history })
}
