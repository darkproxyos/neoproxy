'use client'

import { useEffect, useState } from 'react'
import { computeIdentity, getGrietaFragments, hasEntitySighting, GRIETA_DONOR_IDS } from './proxyverse/identity'
import { agents } from './proxyverse/agents'

const LAST_VISIT_KEY = 'neoproxy-memory-last-visit'
const SHOWN_KEY = 'neoproxy-memory-fragment-shown'
const RETURN_GAP_MS = 20 * 60 * 1000
const VISIBLE_MS = 5200

// Un único dato real de tu sesión anterior (identity.ts, todo local a este
// navegador), mostrado borroso y fragmentado a propósito — no es un bug de
// render, es el punto: la memoria corta no vuelve entera. Solo se dispara
// al volver después de un rato real (RETURN_GAP_MS desde la última visita
// registrada), nunca en la primera carga ni en un refresh dentro de la
// misma sesión.
function buildFragment(): string | null {
  const identity = computeIdentity()
  const grietas = getGrietaFragments()
  const sighting = hasEntitySighting()
  const candidates: string[] = []

  if (identity.dominant) {
    const n = identity.chatCounts[identity.dominant.id] || 0
    if (n > 0) candidates.push(`...hablaste con ${identity.dominant.name} ${n} ${n === 1 ? 'vez' : 'veces'}...`)
  }
  if (identity.portrait) {
    const agent = agents.find(a => a.id === identity.portrait!.agentId)
    if (agent) candidates.push(`...tu retrato resonó ${identity.portrait.affinity}% con ${agent.name}...`)
  }
  if (identity.trickster.bestLevel > 0) {
    candidates.push(`...llegaste al nivel ${identity.trickster.bestLevel} en Trickster...`)
  }
  if (identity.proxygenesisCount > 0) {
    candidates.push(`...dejaste ${identity.proxygenesisCount} ${identity.proxygenesisCount === 1 ? 'espécimen' : 'especímenes'} en Proxygenesis...`)
  }
  if (identity.nfcScans > 0) {
    candidates.push(`...escaneaste ${identity.nfcScans} ${identity.nfcScans === 1 ? 'artefacto' : 'artefactos'}...`)
  }
  if (grietas.length > 0) {
    candidates.push(`...juntaste ${grietas.length} de ${GRIETA_DONOR_IDS.length} fragmentos de Prototype...`)
  }
  if (sighting) candidates.push('...viste algo que el sistema no explica en ningún lado...')

  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export default function FragmentedMemory() {
  const [fragment, setFragment] = useState<string | null>(null)

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SHOWN_KEY)) return

      const last = Number(window.localStorage.getItem(LAST_VISIT_KEY) ?? 'NaN')
      const now = Date.now()
      window.localStorage.setItem(LAST_VISIT_KEY, String(now))
      if (!Number.isFinite(last) || now - last < RETURN_GAP_MS) return

      const text = buildFragment()
      if (!text) return

      window.sessionStorage.setItem(SHOWN_KEY, '1')
      setFragment(text)
      const t = window.setTimeout(() => setFragment(null), VISIBLE_MS)
      return () => window.clearTimeout(t)
    } catch {
      // localStorage/sessionStorage no disponible: sin memoria corta, no
      // pasa nada.
    }
  }, [])

  if (!fragment) return null

  return (
    <div className="fragmented-memory" aria-hidden="true">
      {fragment}
    </div>
  )
}
