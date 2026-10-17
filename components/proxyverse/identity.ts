// Proxy ID: agrega señales que ya se generan sueltas por el sitio (chat de
// Proxyverse, retrato de NeoCam, progreso de Trickster, piezas de
// Proxygenesis, tags NFC escaneados) en una sola identidad — todo vive en
// localStorage de este navegador, no hay cuenta ni backend detrás.

import { agents, type ProxyAgent } from './agents'
import { loadGallery } from '@/app/lab/proxygenesis/engine/gallery'

const CHAT_COUNTS_KEY = 'neoproxy-identity-chat-counts'
const PORTRAIT_KEY = 'neoproxy-identity-last-portrait'
const TRICKSTER_KEY = 'neoproxy-identity-trickster'
const SCAN_COUNT_KEY = 'neoproxy-identity-nfc-scans'

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function recordChatMessage(agentId: string) {
  const counts = safeGet<Record<string, number>>(CHAT_COUNTS_KEY, {})
  counts[agentId] = (counts[agentId] || 0) + 1
  safeSet(CHAT_COUNTS_KEY, counts)
}

export function getChatCounts(): Record<string, number> {
  return safeGet(CHAT_COUNTS_KEY, {})
}

export type PortraitRecord = { agentId: string; affinity: number; capturedAt: string }

export function recordPortraitMatch(agentId: string, affinity: number) {
  const record: PortraitRecord = { agentId, affinity, capturedAt: new Date().toISOString() }
  safeSet(PORTRAIT_KEY, record)
}

export function getLastPortraitMatch(): PortraitRecord | null {
  return safeGet<PortraitRecord | null>(PORTRAIT_KEY, null)
}

export type TricksterProgress = { bestLevel: number; victories: number }

export function recordTricksterProgress(level: number, victory: boolean) {
  const current = safeGet<TricksterProgress>(TRICKSTER_KEY, { bestLevel: 0, victories: 0 })
  const next: TricksterProgress = {
    bestLevel: Math.max(current.bestLevel, level),
    victories: current.victories + (victory ? 1 : 0),
  }
  safeSet(TRICKSTER_KEY, next)
}

export function getTricksterProgress(): TricksterProgress {
  return safeGet(TRICKSTER_KEY, { bestLevel: 0, victories: 0 })
}

export function recordNfcScan() {
  const count = safeGet<number>(SCAN_COUNT_KEY, 0)
  safeSet(SCAN_COUNT_KEY, count + 1)
}

export function getNfcScanCount(): number {
  return safeGet(SCAN_COUNT_KEY, 0)
}

export function getProxygenesisCount(): number {
  try {
    return loadGallery().length
  } catch {
    return 0
  }
}

export type IdentitySummary = {
  dominant: ProxyAgent | null
  scorePerAgent: Record<string, number>
  chatCounts: Record<string, number>
  portrait: PortraitRecord | null
  trickster: TricksterProgress
  nfcScans: number
  proxygenesisCount: number
  hasAnySignal: boolean
}

// Pesos deliberadamente simples y declarados acá, no inventados en el
// momento de mostrar: un mensaje de chat vale 4 puntos de afinidad (son
// baratos de generar, cuentan menos uno por uno), el match de NeoCam
// aporta directamente su % de afinidad (ya viene en la misma escala 0-100).
const POINTS_PER_CHAT_MESSAGE = 4

export function computeIdentity(): IdentitySummary {
  const chatCounts = getChatCounts()
  const portrait = getLastPortraitMatch()
  const trickster = getTricksterProgress()
  const nfcScans = getNfcScanCount()
  const proxygenesisCount = getProxygenesisCount()

  const scorePerAgent: Record<string, number> = {}
  for (const [id, n] of Object.entries(chatCounts)) {
    scorePerAgent[id] = (scorePerAgent[id] || 0) + n * POINTS_PER_CHAT_MESSAGE
  }
  if (portrait) {
    scorePerAgent[portrait.agentId] = (scorePerAgent[portrait.agentId] || 0) + portrait.affinity
  }

  let dominant: ProxyAgent | null = null
  let bestScore = 0
  for (const a of agents) {
    const s = scorePerAgent[a.id] || 0
    if (s > bestScore) { bestScore = s; dominant = a }
  }

  const hasAnySignal = bestScore > 0 || trickster.bestLevel > 0 || nfcScans > 0 || proxygenesisCount > 0

  return { dominant, scorePerAgent, chatCounts, portrait, trickster, nfcScans, proxygenesisCount, hasAnySignal }
}
