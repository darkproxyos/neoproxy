'use client'

import { useEffect, useRef, useState } from 'react'
import { agents, pickRandom } from '@/components/proxyverse/agents'
import { pickTarget } from './pickTarget'
import SweepCrawler from './SweepCrawler'
import GlitchMite from './GlitchMite'

const BASE_INTERVAL_MS = 55_000
const JITTER_MS = 25_000

type Specimen =
  | { id: number; kind: 'sweep'; color: string; top: number; left: number; width: number; height: number; duration: number }
  | { id: number; kind: 'glitch'; color: string; target: HTMLElement }

let specimenId = 0

// ProxyBiodiversidad: pequeñas formas de vida que habitan el sitio. Dos
// especies con ritmos opuestos a propósito -- SweepCrawler es movimiento
// continuo sin pausa, GlitchMite es quietud interrumpida por golpes de
// acción. Nunca las dos a la vez; el ecosistema alterna entre ambas.
export default function ProxyBiodiversity() {
  const [specimen, setSpecimen] = useState<Specimen | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    const scheduleNext = () => {
      const delay = BASE_INTERVAL_MS + Math.random() * JITTER_MS
      timerRef.current = setTimeout(spawn, delay)
    }

    const spawn = () => {
      if (document.visibilityState !== 'visible') {
        scheduleNext()
        return
      }
      const target = pickTarget()
      if (!target) {
        scheduleNext()
        return
      }
      const agent = pickRandom(agents.filter(a => a.id !== 'darkproxy'))
      const kind: 'sweep' | 'glitch' = Math.random() < 0.5 ? 'sweep' : 'glitch'
      const id = ++specimenId

      if (kind === 'sweep') {
        const rect = target.getBoundingClientRect()
        const duration = Math.min(5, Math.max(2.2, rect.width / 220))
        setSpecimen({
          id, kind: 'sweep', color: agent.color,
          top: rect.top, left: rect.left, width: rect.width, height: rect.height, duration,
        })
      } else {
        setSpecimen({ id, kind: 'glitch', color: agent.color, target })
      }
      scheduleNext()
    }

    scheduleNext()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (!specimen) return null

  const handleDone = () => setSpecimen(prev => (prev?.id === specimen.id ? null : prev))

  if (specimen.kind === 'sweep') {
    return (
      <SweepCrawler
        key={specimen.id}
        id={specimen.id}
        color={specimen.color}
        top={specimen.top}
        left={specimen.left}
        width={specimen.width}
        height={specimen.height}
        duration={specimen.duration}
        onDone={handleDone}
      />
    )
  }

  return (
    <GlitchMite
      key={specimen.id}
      target={specimen.target}
      color={specimen.color}
      onDone={handleDone}
    />
  )
}
