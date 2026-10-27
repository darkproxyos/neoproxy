'use client'

import { useEffect, useRef, useState } from 'react'
import { getSitePusher, SITE_PRESENCE_CHANNEL } from './pusher/siteConnection'

type Member = { id: string; info?: { agentId?: string; color?: string } }
type Cursor = { x: number; y: number; color: string }

const MOVE_THROTTLE_MS = 90
const NEUTRAL_COLOR = '#4a6080'

// Cursores de otros visitantes conectados ahora mismo, coloreados por el
// agente de Proxyverse que cada uno tiene más presente (ver
// components/pusher/siteConnection.ts) — "no estás solo en la red" sin
// backend nuevo más allá de reenviar posiciones por Pusher. Las posiciones
// propias se mandan al servidor (no via client events de Pusher, que
// necesitan habilitarse aparte en el dashboard) normalizadas 0-1, así cada
// visitante las reescala a su propio viewport.
export default function GhostPresence() {
  const [members, setMembers] = useState<Record<string, Member>>({})
  const [cursors, setCursors] = useState<Record<string, Cursor>>({})
  const selfIdRef = useRef<string | null>(null)
  const selfColorRef = useRef<string | null>(null)
  const lastSentRef = useRef(0)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const { pusher, visitorId } = getSitePusher()
    selfIdRef.current = visitorId
    const channel = pusher.subscribe(SITE_PRESENCE_CHANNEL)

    const onSubSucceeded = (members: {
      each: (cb: (m: { id: string; info?: Member['info'] }) => void) => void
      myID: string
      get: (id: string) => { id: string; info?: Member['info'] } | null
    }) => {
      const next: Record<string, Member> = {}
      members.each(m => { next[m.id] = { id: m.id, info: m.info } })
      setMembers(next)
      const self = members.get(members.myID)
      if (self?.info?.color) selfColorRef.current = self.info.color
    }
    const onMemberAdded = (m: Member) => {
      setMembers(prev => ({ ...prev, [m.id]: m }))
      if (m.id === selfIdRef.current && m.info?.color) selfColorRef.current = m.info.color
    }
    const onMemberRemoved = (m: Member) => {
      setMembers(prev => { const next = { ...prev }; delete next[m.id]; return next })
      setCursors(prev => { const next = { ...prev }; delete next[m.id]; return next })
    }
    const onCursorMove = (data: { visitorId: string; x: number; y: number; color: string | null }) => {
      if (data.visitorId === selfIdRef.current) return
      setCursors(prev => ({ ...prev, [data.visitorId]: { x: data.x, y: data.y, color: data.color || NEUTRAL_COLOR } }))
    }

    channel.bind('pusher:subscription_succeeded', onSubSucceeded)
    channel.bind('pusher:member_added', onMemberAdded)
    channel.bind('pusher:member_removed', onMemberRemoved)
    channel.bind('cursor-move', onCursorMove)

    let moveHandler: ((e: MouseEvent) => void) | null = null
    if (!reducedMotion) {
      moveHandler = (e: MouseEvent) => {
        const now = performance.now()
        if (now - lastSentRef.current < MOVE_THROTTLE_MS) return
        lastSentRef.current = now
        const id = selfIdRef.current
        if (!id) return
        const x = e.clientX / window.innerWidth
        const y = e.clientY / window.innerHeight
        fetch('/api/presence/cursor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId: id, x, y, color: selfColorRef.current }),
          keepalive: true,
        }).catch(() => {})
      }
      window.addEventListener('mousemove', moveHandler, { passive: true })
    }

    return () => {
      channel.unbind('pusher:subscription_succeeded', onSubSucceeded)
      channel.unbind('pusher:member_added', onMemberAdded)
      channel.unbind('pusher:member_removed', onMemberRemoved)
      channel.unbind('cursor-move', onCursorMove)
      if (moveHandler) window.removeEventListener('mousemove', moveHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const entries = Object.entries(cursors).filter(([id]) => members[id] && id !== selfIdRef.current)
  if (entries.length === 0) return null

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 997, pointerEvents: 'none' }}>
      {entries.map(([id, c]) => (
        <div
          key={id}
          style={{
            position: 'absolute',
            left: `${c.x * 100}%`,
            top: `${c.y * 100}%`,
            transform: 'translate(-2px, -2px)',
            transition: 'left 0.12s linear, top 0.12s linear',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ filter: `drop-shadow(0 0 4px ${c.color}aa)` }}>
            <path d="M1 1 L1 12 L4.5 9 L6.8 13 L8.6 12 L6.3 8 L11 8 Z" fill={c.color} opacity="0.85" />
          </svg>
        </div>
      ))}
    </div>
  )
}
