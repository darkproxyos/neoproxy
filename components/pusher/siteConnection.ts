'use client'

import PusherClient from 'pusher-js'
import { getChatCounts, getLastPortraitMatch } from '@/components/proxyverse/identity'
import { agents } from '@/components/proxyverse/agents'
import { SITE_PRESENCE_CHANNEL } from './constants'

// Un solo socket de Pusher por pestaña, compartido entre PresenceCounter y
// GhostPresence — antes cada uno iba a abrir su propia conexión y suscribirse
// por separado al mismo canal de presencia, lo que hubiera contado a un
// mismo visitante como 2 miembros (el auth endpoint generaba un user_id
// nuevo por cada llamada). Con una sola conexión, un solo visitor_id
// estable por pestaña, y Pusher dedupea la suscripción si dos componentes
// piden el mismo canal sobre el mismo cliente.
export { SITE_PRESENCE_CHANNEL }

function resolveDominantAgent(): { agentId: string; color: string } | null {
  const counts = getChatCounts()
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  const topAgentId = top && top[1] > 0 ? top[0] : null
  const candidateId = topAgentId ?? getLastPortraitMatch()?.agentId ?? null
  if (!candidateId) return null
  const agent = agents.find(a => a.id === candidateId)
  return agent ? { agentId: agent.id, color: agent.color } : null
}

function getVisitorId(): string {
  const KEY = 'neoproxy-presence-visitor-id'
  try {
    let id = window.sessionStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      window.sessionStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

let client: PusherClient | null = null
let visitorId: string | null = null

export function getSitePusher(): { pusher: PusherClient; visitorId: string } {
  if (!client) {
    visitorId = getVisitorId()
    const dominant = resolveDominantAgent()
    client = new PusherClient('e1dd2b8f196d106ff74f', {
      cluster: 'mt1',
      authEndpoint: '/api/pusher/auth',
      auth: {
        params: {
          visitor_id: visitorId,
          agent_id: dominant?.agentId ?? '',
          agent_color: dominant?.color ?? '',
        },
      },
    })
  }
  return { pusher: client, visitorId: visitorId! }
}
