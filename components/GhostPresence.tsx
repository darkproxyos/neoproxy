'use client'

import { useEffect, useRef, useState } from 'react'
import { getSitePusher, SITE_PRESENCE_CHANNEL } from './pusher/siteConnection'

type Member = { id: string; info?: { agentId?: string; color?: string } }
type TrailPoint = { x: number; y: number; t: number }
type Cursor = { x: number; y: number; color: string; trail: TrailPoint[] }
type Pulse = { id: number }

const MOVE_THROTTLE_MS = 90
const NEUTRAL_COLOR = '#4a6080'
const TRAIL_MS = 650
const TRAIL_POINTS = 6
// Influencia Grinberg, sin nombrarlo: un campo de atención compartida que
// se activa recién cuando hay suficientes procesos reales sincronizados a
// la vez, no uno solo. 3 visitantes reales conectados (contándote a vos)
// alcanza para que el sitio reaccione para TODOS al mismo tiempo — ver
// app/api/presence/sync/route.ts, que reenvía el pulso por el servidor para
// que todo el mundo lo vea en el mismo instante, no cada uno por su cuenta.
const SYNC_THRESHOLD = 3

let pulseId = 0

export default function GhostPresence() {
  const [members, setMembers] = useState<Record<string, Member>>({})
  const [cursors, setCursors] = useState<Record<string, Cursor>>({})
  const [pulses, setPulses] = useState<Pulse[]>([])
  const selfIdRef = useRef<string | null>(null)
  const selfColorRef = useRef<string | null>(null)
  const lastSentRef = useRef(0)
  const prevCountRef = useRef(0)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const { pusher, visitorId } = getSitePusher()
    selfIdRef.current = visitorId
    const channel = pusher.subscribe(SITE_PRESENCE_CHANNEL)

    const maybeTriggerSync = (count: number) => {
      const prev = prevCountRef.current
      prevCountRef.current = count
      if (prev < SYNC_THRESHOLD && count >= SYNC_THRESHOLD) {
        fetch('/api/presence/sync', { method: 'POST' }).catch(() => {})
      }
    }

    const onSubSucceeded = (members: {
      each: (cb: (m: { id: string; info?: Member['info'] }) => void) => void
      myID: string
      get: (id: string) => { id: string; info?: Member['info'] } | null
      count: number
    }) => {
      const next: Record<string, Member> = {}
      members.each(m => { next[m.id] = { id: m.id, info: m.info } })
      setMembers(next)
      const self = members.get(members.myID)
      if (self?.info?.color) selfColorRef.current = self.info.color
      maybeTriggerSync(members.count)
    }
    const onMemberAdded = (m: Member) => {
      setMembers(prev => {
        const next = { ...prev, [m.id]: m }
        maybeTriggerSync(Object.keys(next).length)
        return next
      })
      if (m.id === selfIdRef.current && m.info?.color) selfColorRef.current = m.info.color
    }
    const onMemberRemoved = (m: Member) => {
      setMembers(prev => {
        const next = { ...prev }
        delete next[m.id]
        prevCountRef.current = Object.keys(next).length
        return next
      })
      setCursors(prev => { const next = { ...prev }; delete next[m.id]; return next })
    }
    const onCursorMove = (data: { visitorId: string; x: number; y: number; color: string | null }) => {
      if (data.visitorId === selfIdRef.current) return
      const now = Date.now()
      setCursors(prev => {
        const prevTrail = prev[data.visitorId]?.trail ?? []
        const trail = [...prevTrail, { x: data.x, y: data.y, t: now }]
          .filter(p => now - p.t < TRAIL_MS)
          .slice(-TRAIL_POINTS)
        return { ...prev, [data.visitorId]: { x: data.x, y: data.y, color: data.color || NEUTRAL_COLOR, trail } }
      })
    }
    const onSyncPulse = () => {
      const id = ++pulseId
      setPulses(prev => [...prev, { id }])
      window.setTimeout(() => setPulses(prev => prev.filter(p => p.id !== id)), 1600)
    }

    channel.bind('pusher:subscription_succeeded', onSubSucceeded)
    channel.bind('pusher:member_added', onMemberAdded)
    channel.bind('pusher:member_removed', onMemberRemoved)
    channel.bind('cursor-move', onCursorMove)
    channel.bind('sync-pulse', onSyncPulse)

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
      channel.unbind('sync-pulse', onSyncPulse)
      if (moveHandler) window.removeEventListener('mousemove', moveHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const entries = Object.entries(cursors).filter(([id]) => members[id] && id !== selfIdRef.current)

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 997, pointerEvents: 'none' }}>
      {pulses.map(p => (
        <div key={p.id} className="sync-pulse-ring" />
      ))}
      {entries.map(([id, c]) => (
        <div key={id}>
          {c.trail.slice(0, -1).map((pt, i) => {
            const age = (Date.now() - pt.t) / TRAIL_MS
            const opacity = Math.max(0, 0.5 * (1 - age))
            const size = 3 + i * 0.6
            return (
              <div
                key={pt.t}
                style={{
                  position: 'absolute', left: `${pt.x * 100}%`, top: `${pt.y * 100}%`,
                  width: size, height: size, borderRadius: '50%',
                  background: c.color, opacity, transform: 'translate(-50%, -50%)',
                }}
              />
            )
          })}
          <div
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
        </div>
      ))}
    </div>
  )
}
