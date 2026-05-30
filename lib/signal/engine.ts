import { db } from '@/lib/core-db'
import { signalTransactions } from '@/src/db/schema'
import { eq, sum } from 'drizzle-orm'

export const SIGNAL_EVENTS = {
  FIRST_LOGIN:        5,
  REFERRAL_REGISTER: 10,
  REFERRAL_PURCHASE: 100,
  PURCHASE_STL:      50,   // + 5% del valor
  PURCHASE_HARDWARE: 0,    // + 10% del valor
  CODEX_CORRECTION:  20,
  CODEX_PROJECT:     50,
  CODEX_STL:         30,
  MONTHLY_SUB:       25,
}

export async function addSignal(
  userId: string,
  amount: number,
  reason: keyof typeof SIGNAL_EVENTS | string,
  referenceId?: string
) {
  await db.insert(signalTransactions).values({
    userId,
    amount,
    reason,
    referenceId: referenceId || null,
    createdAt: Date.now(),
  })
  return getSignalBalance(userId)
}

export async function getSignalBalance(userId: string): Promise<number> {
  const result = await db
    .select({ total: sum(signalTransactions.amount) })
    .from(signalTransactions)
    .where(eq(signalTransactions.userId, userId))
  return Number(result[0]?.total || 0)
}

export async function getSignalHistory(userId: string) {
  return db
    .select()
    .from(signalTransactions)
    .where(eq(signalTransactions.userId, userId))
    .orderBy(signalTransactions.createdAt)
}

export function calcDiscount(balance: number): number {
  if (balance >= 1000) return 30
  if (balance >= 500)  return 15
  if (balance >= 100)  return 5
  return 0
}
