'use client'

import { useEffect, useRef } from 'react'
import { findWordSpan, revertSpan, GLITCH_STRIKE_CLASS } from './biodiversity/glitchWord'
import { getSitePusher, SITE_PRESENCE_CHANNEL } from './pusher/siteConnection'

// Glitchi no tiene ícono, ni botón, ni posición visible antes de actuar —
// a diferencia de Grieta (que avisa con un glifo quieto antes de poder
// clickearse) o de GlitchMite (que se ve posarse sobre una palabra), esto
// le pasa a una palabra real cualquiera del documento sin aviso previo. La
// única cosa estable entre apariciones es la firma de color (--glitch-color
// = GLITCHI_COLOR, siempre la misma), que es lo que la distingue de un
// glitch anónimo más si alguien llega a notar el patrón.
const GLITCHI_COLOR = '#39ff14'
const CHECK_INTERVAL_MS = 20_000
const GLITCH_CHANCE = 0.02
const HOLD_MS = 650

export default function Glitchi() {
  const busyRef = useRef(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    const signWord = () => {
      if (busyRef.current) return
      const found = findWordSpan(document.body)
      if (!found) return
      busyRef.current = true
      found.span.style.setProperty('--glitch-color', GLITCHI_COLOR)
      found.span.style.setProperty('--glitch-glow', `${GLITCHI_COLOR}99`)
      found.span.classList.add(GLITCH_STRIKE_CLASS)
      window.setTimeout(() => {
        revertSpan(found.span)
        busyRef.current = false
      }, HOLD_MS)
    }

    // Agencia propia: un intervalo independiente, sin relación con la
    // entropía real ni con Grieta — Glitchi actúa aunque nadie más esté
    // pasando nada.
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (Math.random() < GLITCH_CHANCE) signWord()
    }, CHECK_INTERVAL_MS)

    // Reacciona también cuando Entropy se mueve por su cuenta (mismo canal
    // que EntropyEntity.tsx) — dos identidades separadas que a veces
    // coinciden en el mismo instante sin que una dependa de la otra.
    const { pusher } = getSitePusher()
    const channel = pusher.subscribe(SITE_PRESENCE_CHANNEL)
    const onEntropySignal = () => signWord()
    channel.bind('entropy-entity-signal', onEntropySignal)

    return () => {
      window.clearInterval(interval)
      channel.unbind('entropy-entity-signal', onEntropySignal)
    }
  }, [])

  return null
}
