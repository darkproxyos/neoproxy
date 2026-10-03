'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { agents } from '@/components/proxyverse/agents'
import { PROXYBILIDAD_START, clampIndex, effectiveOddsBias, effectiveProfile, nextIndex } from './proxybilidad'

const AGENT_KEY = 'np-market-agent'
const INDEX_KEY = 'np-proxybilidad'

function pickAgentId(): string {
  const ids = agents.map(a => a.id)
  return ids[Math.floor(Math.random() * ids.length)]
}

// Un agente "posee" el mercado por toda la duración de esta pestaña — se
// sortea una vez (sessionStorage, no localStorage) y mueve el índice de
// PROXYBILIDAD con cada ronda jugada en cualquiera de los dos juegos.
// getOddsBias() se recalcula en el momento exacto de cada ronda (no queda
// fijo entre renders) — así Prototype pide prestado un perfil distinto
// cada vez que de verdad se juega, no solo cuando el componente redibuja.
export function useSessionMarket() {
  const [agentId, setAgentId] = useState<string | null>(null)
  const [index, setIndexState] = useState<number | null>(null)
  const indexRef = useRef(PROXYBILIDAD_START)

  useEffect(() => {
    let storedAgent = window.sessionStorage.getItem(AGENT_KEY)
    if (!storedAgent) {
      storedAgent = pickAgentId()
      window.sessionStorage.setItem(AGENT_KEY, storedAgent)
    }
    setAgentId(storedAgent)

    const storedIndex = Number(window.sessionStorage.getItem(INDEX_KEY))
    const startIndex = Number.isFinite(storedIndex) && storedIndex > 0 ? clampIndex(storedIndex) : PROXYBILIDAD_START
    indexRef.current = startIndex
    setIndexState(startIndex)
  }, [])

  const getOddsBias = useCallback(() => {
    if (!agentId) return 1
    return effectiveOddsBias(indexRef.current, effectiveProfile(agentId))
  }, [agentId])

  const registerRound = useCallback((won: boolean) => {
    if (!agentId) return
    const profile = effectiveProfile(agentId)
    const next = nextIndex(indexRef.current, profile, won)
    indexRef.current = next
    window.sessionStorage.setItem(INDEX_KEY, String(next))
    setIndexState(next)
  }, [agentId])

  const agent = agents.find(a => a.id === agentId) ?? null

  return { agent, index, getOddsBias, registerRound }
}
