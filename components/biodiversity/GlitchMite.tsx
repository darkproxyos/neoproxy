'use client'

import { useEffect, useRef, useState } from 'react'
import { findWordSpan, revertSpan, GLITCH_STRIKE_CLASS } from './glitchWord'

// Especie 2: quietud puntuada por acción. A diferencia de SweepCrawler (que
// nunca para), el ácaro se posa sobre una palabra real, se queda quieto un
// momento, y de golpe ataca -- le cambia la tipografía a la palabra en vivo
// (span real insertado vía splitText/replaceWith, no una copia encima) antes
// de revertirla y saltar a la siguiente. Tres golpes, después se va.
// La mecánica de envolver/revertir la palabra (findWordSpan/revertSpan) vive
// en ./glitchWord, compartida con Grieta.tsx.
const CYCLES = 3
const STILL_MS = 1000
const STRIKE_MS = 320
const HOLD_MS = 480

export default function GlitchMite({
  target, color, onDone,
}: {
  target: HTMLElement
  color: string
  onDone: () => void
}) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const [phase, setPhase] = useState<'still' | 'strike'>('still')
  const [visible, setVisible] = useState(true)
  const activeSpan = useRef<HTMLSpanElement | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    let cycle = 0
    let cancelled = false

    const schedule = (fn: () => void, ms: number) => {
      const t = setTimeout(() => { if (!cancelled) fn() }, ms)
      timers.current.push(t)
    }

    const finish = () => {
      if (activeSpan.current) revertSpan(activeSpan.current)
      activeSpan.current = null
      setVisible(false)
      schedule(onDone, 250)
    }

    const runCycle = () => {
      if (cancelled) return
      // target puede quedar huérfano si el layout raíz no desmonta entre
      // navegaciones (no lo hace) -- si ya no está en el documento, cortar acá.
      if (cycle >= CYCLES || !document.contains(target)) { finish(); return }
      cycle++

      const found = findWordSpan(target)
      if (!found) { finish(); return }
      activeSpan.current = found.span
      setPos({ top: found.rect.top, left: found.rect.left, width: found.rect.width, height: found.rect.height })
      setPhase('still')

      schedule(() => {
        found.span.style.setProperty('--glitch-color', color)
        found.span.style.setProperty('--glitch-glow', `${color}99`)
        found.span.classList.add(GLITCH_STRIKE_CLASS)
        setPhase('strike')
        schedule(() => {
          schedule(() => {
            revertSpan(found.span)
            activeSpan.current = null
            runCycle()
          }, HOLD_MS)
        }, STRIKE_MS)
      }, STILL_MS)
    }

    runCycle()

    return () => {
      cancelled = true
      timers.current.forEach(clearTimeout)
      if (activeSpan.current) revertSpan(activeSpan.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  if (!pos || !visible) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', top: pos.top - 14, left: pos.left + pos.width / 2 - 9, width: 18, height: 18,
        zIndex: 41, pointerEvents: 'none', transition: 'top 0.25s ease, left 0.25s ease',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" className={phase === 'strike' ? 'bio-mite-strike' : 'bio-mite-still'}>
        <circle cx="9" cy="9" r="3.4" fill={color} opacity="0.95" />
        <g stroke={color} strokeWidth="1" opacity="0.75">
          <line x1="6" y1="7" x2="1" y2="4" />
          <line x1="6" y1="11" x2="1" y2="14" />
          <line x1="12" y1="7" x2="17" y2="4" />
          <line x1="12" y1="11" x2="17" y2="14" />
        </g>
      </svg>

      <style>{`
        .bio-mite-still { animation: bio-mite-breathe 1.1s ease-in-out infinite; }
        @keyframes bio-mite-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .bio-mite-strike { animation: bio-mite-jitter 0.12s steps(2) 3; }
        @keyframes bio-mite-jitter {
          0% { transform: translate(0, 0); }
          50% { transform: translate(-2px, 1.5px) scale(1.25); }
          100% { transform: translate(2px, -1.5px) scale(1.25); }
        }
      `}</style>
    </div>
  )
}
