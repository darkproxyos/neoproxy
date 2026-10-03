'use client'

import { useCallback, useEffect, useState } from 'react'

const KEY = 'np-casino-stats'

export type RoundResult = { won: boolean; wagered: number; payout: number }

export type CasinoStats = {
  totalWagered: number
  totalWon: number
  biggestWin: number
  streak: number
  bestStreak: number
  rounds: number
}

const DEFAULT_STATS: CasinoStats = {
  totalWagered: 0, totalWon: 0, biggestWin: 0, streak: 0, bestStreak: 0, rounds: 0,
}

function readStats(): CasinoStats {
  if (typeof window === 'undefined') return DEFAULT_STATS
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULT_STATS
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_STATS, ...parsed }
  } catch {
    return DEFAULT_STATS
  }
}

// Récords personales del casino — cuánto apostaste en total, tu jackpot más
// grande, tu racha más larga. Vive en localStorage, separado del saldo:
// aunque reinicies ProxyCoins, la historia de lo que hiciste queda.
export function useCasinoStats() {
  const [stats, setStats] = useState<CasinoStats | null>(null)

  useEffect(() => {
    setStats(readStats())
  }, [])

  const recordRound = useCallback((result: RoundResult) => {
    setStats(prev => {
      const base = prev ?? DEFAULT_STATS
      const nextStreak = result.won ? base.streak + 1 : 0
      const next: CasinoStats = {
        totalWagered: base.totalWagered + result.wagered,
        totalWon: base.totalWon + result.payout,
        biggestWin: Math.max(base.biggestWin, result.payout),
        streak: nextStreak,
        bestStreak: Math.max(base.bestStreak, nextStreak),
        rounds: base.rounds + 1,
      }
      window.localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const resetStats = useCallback(() => {
    window.localStorage.setItem(KEY, JSON.stringify(DEFAULT_STATS))
    setStats(DEFAULT_STATS)
  }, [])

  return { stats, recordRound, resetStats }
}
