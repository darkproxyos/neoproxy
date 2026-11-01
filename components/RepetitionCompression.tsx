'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const KEY_PREFIX = 'neoproxy-repeat-'
const START_AT = 3
const MAX_AT = 8

// Teoría de la información, no decoración: cuanto más repetitivo es tu
// comportamiento real (misma ruta, visitada muchas veces en esta sesión),
// menos información nueva generás — y el sitio literalmente se comprime
// para vos en esa página: menos detalle visual, como un archivo con poca
// entropía real que un compresor aplana. Por ruta, no global: visitar
// páginas distintas no cuenta como repetición.
function visitCount(pathname: string): number {
  try {
    const key = KEY_PREFIX + pathname
    const n = Number(window.sessionStorage.getItem(key) ?? '0') + 1
    window.sessionStorage.setItem(key, String(n))
    return n
  } catch {
    return 1
  }
}

export default function RepetitionCompression() {
  const pathname = usePathname()

  useEffect(() => {
    const count = visitCount(pathname)
    const level = Math.max(0, Math.min(1, (count - START_AT) / (MAX_AT - START_AT)))
    document.documentElement.style.setProperty('--repeat-compress', level.toFixed(2))
  }, [pathname])

  return null
}
