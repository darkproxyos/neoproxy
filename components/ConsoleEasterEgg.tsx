'use client'

import { useEffect } from 'react'

// Un mensaje para quien sí abre el inspector — la mayoría del sistema está
// diseñado para que nunca lo hagas.
export default function ConsoleEasterEgg() {
  useEffect(() => {
    const mono = 'font-family:monospace'
    console.log('%cNEOPROXY.ART', `${mono};color:#00d4ff;font-size:20px;font-weight:bold;text-shadow:0 0 8px #00d4ff`)
    console.log('%cNo abriste esto por accidente.', `${mono};color:#00ffcc;font-size:12px`)
    console.log('%cCasi todo lo demás está diseñado para que nunca mires acá.', `${mono};color:#8fb8d6;font-size:11px`)
    console.log('%c¿Qué más te dijeron que no mires?', `${mono};color:#ff2d55;font-size:12px;font-weight:bold`)
  }, [])

  return null
}
