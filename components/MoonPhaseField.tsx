'use client'

import { useEffect } from 'react'

// Luna nueva de referencia conocida: 2000-01-06 18:14 UTC, mes sinódico
// real (29.530588853 días) — fórmula astronómica estándar, no una API de
// terceros ni un valor inventado. fullness va de 0 (luna nueva) a 1 (luna
// llena) como una onda triangular sobre la fase 0-1.
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0)
const SYNODIC_MONTH_MS = 29.530588853 * 24 * 60 * 60 * 1000
const RECHECK_MS = 30 * 60 * 1000

function moonFullness(now: number): number {
  const elapsed = now - KNOWN_NEW_MOON_MS
  const phase = (elapsed % SYNODIC_MONTH_MS) / SYNODIC_MONTH_MS
  return 1 - Math.abs(phase - 0.5) * 2
}

// Dato real (posición real de la luna hoy), no narrativa: un glow plateado
// muy sutil en app/globals.css (.moon-glow) que crece hacia la luna llena y
// desaparece en luna nueva — mismo patrón que CircadianField.tsx, una
// variable CSS seteada directo, sin estado de React.
export default function MoonPhaseField() {
  useEffect(() => {
    const apply = () => {
      document.documentElement.style.setProperty('--moon-glow', moonFullness(Date.now()).toFixed(3))
    }
    apply()
    const id = window.setInterval(apply, RECHECK_MS)
    return () => window.clearInterval(id)
  }, [])

  return <div className="moon-glow" aria-hidden="true" />
}
