'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { mincho } from './fuente'

export type Cartel = { tramo: string; titulo: string; sub: string }

// Un cartel de capítulo: corte seco a negro, texto blanco enorme, corte seco de vuelta.
// No se puede tocar (pointer-events: none): nunca bloquea la página que está debajo.
// Va en un portal a <body> para quedar fuera del filtro del sitio (que rompe position:fixed).
export default function Intertitulo({ cartel, ms = 1700, onDone }: { cartel: Cartel | null; ms?: number; onDone?: () => void }) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (!cartel) return
    setOn(true)
    const t = setTimeout(() => { setOn(false); onDone?.() }, ms)
    return () => clearTimeout(t)
  }, [cartel, ms]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!cartel || !on || typeof document === 'undefined') return null
  return createPortal(
    <div aria-hidden className={`intertitulo ${mincho.className}`} data-tramo-cartel={cartel.tramo}
      style={{ position: 'fixed', inset: 0, zIndex: 5000, background: '#000', color: '#fff', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 'min(88vw, 900px)', transformOrigin: 'left center' }}>
        <div style={{ fontSize: 'clamp(13px, 2.2vw, 22px)', letterSpacing: '0.35em', opacity: 0.85 }}>TRAMO</div>
        <div style={{ fontSize: 'clamp(84px, 19vw, 210px)', lineHeight: 0.86, transform: 'scaleX(0.78)', transformOrigin: 'left', margin: '2px 0 6px' }}>{cartel.tramo}</div>
        <div style={{ fontSize: 'clamp(40px, 9.5vw, 104px)', lineHeight: 0.95, transform: 'scaleX(0.8)', transformOrigin: 'left', whiteSpace: 'nowrap' }}>{cartel.titulo}</div>
        <div style={{ height: 2, background: '#fff', width: '62%', margin: '18px 0 14px' }} />
        <div style={{ fontSize: 'clamp(13px, 2.3vw, 22px)', lineHeight: 1.5, maxWidth: 620 }}>{cartel.sub}</div>
      </div>
    </div>,
    document.body,
  )
}
