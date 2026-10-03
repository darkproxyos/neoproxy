'use client'

import { useCallback, useEffect, useState } from 'react'

const KEY = 'np-proxycoins'
export const STARTING_BALANCE = 500

function readBalance(): number {
  if (typeof window === 'undefined') return STARTING_BALANCE
  const raw = window.localStorage.getItem(KEY)
  if (raw === null) return STARTING_BALANCE
  const n = Number(raw)
  return Number.isFinite(n) ? n : STARTING_BALANCE
}

// ProxyCoins viven solo en localStorage de este navegador — sin cuenta, sin
// valor real, sin forma de comprarlas. balance empieza en null para no
// chocar con la hidratación (el valor real solo existe del lado cliente).
export function useProxyCoins() {
  const [balance, setBalanceState] = useState<number | null>(null)

  useEffect(() => {
    setBalanceState(readBalance())
  }, [])

  const setBalance = useCallback((updater: number | ((prev: number) => number)) => {
    setBalanceState(prev => {
      const base = prev ?? STARTING_BALANCE
      const next = typeof updater === 'function' ? (updater as (p: number) => number)(base) : updater
      const clamped = Math.max(0, Math.round(next))
      if (typeof window !== 'undefined') window.localStorage.setItem(KEY, String(clamped))
      return clamped
    })
  }, [])

  const reset = useCallback(() => setBalance(STARTING_BALANCE), [setBalance])

  return { balance, setBalance, reset }
}
