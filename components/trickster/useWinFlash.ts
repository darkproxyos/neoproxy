'use client'

import { useCallback, useRef, useState } from 'react'

const FLASH_MS = 1700

// Celebración breve para jackpots grandes — un overlay de texto que aparece
// y se desvanece, no bloquea nada debajo.
export function useWinFlash() {
  const [flash, setFlash] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const trigger = useCallback((label: string) => {
    if (timer.current) clearTimeout(timer.current)
    setFlash(label)
    timer.current = setTimeout(() => setFlash(null), FLASH_MS)
  }, [])

  return { flash, trigger }
}
