'use client'

import { useEffect } from 'react'

// Un mensaje para quien sí abre el inspector — la mayoría del sistema está
// diseñado para que nunca lo hagas. La última línea lee la entropía real
// del sistema (misma fuente que EntropyField) y cambia con ella — no hay
// versión "alta"/"baja" escrita de antemano con relleno, son dos lecturas
// distintas de un mismo número real.
export default function ConsoleEasterEgg() {
  useEffect(() => {
    const mono = 'font-family:monospace'
    console.log('%cNEOPROXY.ART', `${mono};color:#00d4ff;font-size:20px;font-weight:bold;text-shadow:0 0 8px #00d4ff`)
    console.log('%cNo abriste esto por accidente.', `${mono};color:#00ffcc;font-size:12px`)
    console.log('%cCasi todo lo demás está diseñado para que nunca mires acá.', `${mono};color:#8fb8d6;font-size:11px`)
    console.log('%c¿Qué más te dijeron que no mires?', `${mono};color:#ff2d55;font-size:12px;font-weight:bold`)

    fetch('/api/entropy', { cache: 'no-store' })
      .then(res => res.json())
      .then((data: { entropyLevel?: number }) => {
        const level = typeof data?.entropyLevel === 'number' ? data.entropyLevel : null
        if (level === null) return
        if (level >= 50) {
          console.log('%cLa entropía real de este sistema está en %c' + level.toFixed(1) + '%%%c. No es decorado.', `${mono};color:#ff2d55;font-size:10px`, `${mono};color:#ff2d55;font-size:10px;font-weight:bold`, `${mono};color:#ff2d55;font-size:10px`)
        } else if (level <= 5) {
          console.log('%cLa entropía real está en %c' + level.toFixed(1) + '%%%c. Rara vez se queda tan quieta.', `${mono};color:#4a6080;font-size:10px`, `${mono};color:#8fb8d6;font-size:10px;font-weight:bold`, `${mono};color:#4a6080;font-size:10px`)
        } else {
          console.log('%cEntropía real: %c' + level.toFixed(1) + '%%', `${mono};color:#4a6080;font-size:10px`, `${mono};color:#4a6080;font-size:10px;font-weight:bold`)
        }
      })
      .catch(() => {})
  }, [])

  return null
}
