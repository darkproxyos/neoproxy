'use client'

import { useEffect, useState } from 'react'
import { agents, pickRandom, type ProxyAgent } from './agents'

const STORAGE_KEY = 'np-nav-agent'

// Un agente "posee" la sesión de navegación -- se sortea una vez por
// pestaña y persiste en sessionStorage (mismo criterio que el mercado de
// PROXYBILIDAD en el casino de Trickster), en vez de re-sortearse en cada
// página. Null hasta el primer efecto post-mount para no romper hidratación.
export function useSessionAgent(): ProxyAgent | null {
  const [agent, setAgent] = useState<ProxyAgent | null>(null)

  useEffect(() => {
    try {
      const storedId = sessionStorage.getItem(STORAGE_KEY)
      const found = storedId ? agents.find(a => a.id === storedId) : undefined
      if (found) {
        setAgent(found)
        return
      }
    } catch {
      // sessionStorage no disponible (modo privado, etc.) -- sigue sin persistir
    }
    const chosen = pickRandom(agents)
    setAgent(chosen)
    try { sessionStorage.setItem(STORAGE_KEY, chosen.id) } catch {}
  }, [])

  return agent
}
