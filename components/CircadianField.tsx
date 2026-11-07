'use client'

import { useEffect } from 'react'

type Daypart = 'noche' | 'alba' | 'dia' | 'ocaso'

function daypart(hour: number): Daypart {
  if (hour >= 22 || hour < 5) return 'noche'
  if (hour < 8) return 'alba'
  if (hour < 18) return 'dia'
  return 'ocaso'
}

// Los valores de gridColor subieron (antes ~0.03-0.04) al pasar .tech-grid
// de grilla plana a máscara con el tile de circuito (ver globals.css): la
// forma de ese tile ya absorbe parte de la intensidad, así que con el alpha
// viejo el circuito quedaba casi invisible.
const PALETTE: Record<Daypart, { scanlineRgb: string; gridColor: string }> = {
  noche: { scanlineRgb: '10, 5, 30', gridColor: 'rgba(106, 92, 255, 0.14)' },
  alba: { scanlineRgb: '15, 25, 45', gridColor: 'rgba(143, 184, 214, 0.12)' },
  dia: { scanlineRgb: '0, 25, 20', gridColor: 'rgba(0, 255, 204, 0.14)' },
  ocaso: { scanlineRgb: '40, 10, 20', gridColor: 'rgba(255, 120, 70, 0.15)' },
}

const RECHECK_MS = 10 * 60 * 1000

// Hora real del dispositivo del visitante, no narrativa: cuatro franjas
// horarias que recolorean las dos capas ambiente que ya existen en todo el
// sitio (scanlines + grid, ver app/globals.css) en vez de agregar una capa
// nueva — de madrugada el sitio se enfría hacia Lain, de día se acerca al
// verde clínico de Ghost in the Shell. Mismo patrón que EntropyField.tsx:
// setProperty directo sobre documentElement, sin estado de React.
export default function CircadianField() {
  useEffect(() => {
    const apply = () => {
      const part = daypart(new Date().getHours())
      const { scanlineRgb, gridColor } = PALETTE[part]
      document.documentElement.style.setProperty('--circadian-scanline-rgb', scanlineRgb)
      document.documentElement.style.setProperty('--grid-color', gridColor)
    }
    apply()
    const id = window.setInterval(apply, RECHECK_MS)
    return () => window.clearInterval(id)
  }, [])

  return null
}
