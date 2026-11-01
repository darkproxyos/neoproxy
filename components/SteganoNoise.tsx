'use client'

import { useEffect, useRef } from 'react'

const POLL_MS = 45_000

// Antes era un data-URL de SVG fijo (feTurbulence sin seed, siempre el
// mismo patrón de ruido). Ahora es un <svg> real en el DOM para poder
// tocarle el atributo seed: se deriva del nivel de entropía real y del
// minuto actual (redondeado), así que dos visitantes conectados en el
// mismo minuto ven exactamente el mismo patrón de ruido sin saberlo —
// una huella del estado real del sistema escondida en algo que ya existía,
// no un elemento nuevo.
function realSeed(entropyLevel: number): number {
  const minuteBucket = Math.floor(Date.now() / 60_000)
  // hash chico y determinístico, no necesita ser criptográfico
  let h = minuteBucket ^ Math.round(entropyLevel * 100)
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
  h = h ^ (h >>> 16)
  return Math.abs(h) % 9999
}

export default function SteganoNoise() {
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null)

  useEffect(() => {
    const apply = async () => {
      try {
        const res = await fetch('/api/entropy', { cache: 'no-store' })
        const data = res.ok ? await res.json() : null
        const entropyLevel = typeof data?.entropyLevel === 'number' ? data.entropyLevel : 0
        turbulenceRef.current?.setAttribute('seed', String(realSeed(entropyLevel)))
      } catch {
        // sin red: el seed del minuto anterior sigue siendo válido, no hace falta nada
      }
    }
    apply()
    const id = window.setInterval(apply, POLL_MS)
    return () => window.clearInterval(id)
  }, [])

  return (
    <svg
      className="entropy-noise fixed inset-0 pointer-events-none z-0 mix-blend-screen"
      width="100%" height="100%" aria-hidden="true"
    >
      <filter id="neoproxy-stegano-noise">
        <feTurbulence ref={turbulenceRef} type="fractalNoise" baseFrequency={0.9} numOctaves={4} stitchTiles="stitch" seed={1} />
      </filter>
      <rect width="100%" height="100%" filter="url(#neoproxy-stegano-noise)" />
    </svg>
  )
}
