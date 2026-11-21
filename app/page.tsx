'use client'

// HOME — SELECTOR. Pedido explícito: la home deja de ser una sola pantalla
// fija y pasa a ser varias "home index" reales entre las que el sitio
// elige — pensado para crecer con el tiempo (más variantes artísticas,
// más técnicas), no para quedarse en tres para siempre.
//
// Hoy hay tres variantes reales:
//   - /home-3d      — la nube cinemática 3D (la home de siempre hasta acá,
//                     ver ese archivo para todo su historial v1-v5).
//   - /home-grafico — el mapa del sitio entero estilo /experimental/
//                     cartografia (pedido explícito, nació de que esa
//                     página le gustó al usuario como idea de navegación).
//   - /home-senal   — "RUIDO → SEÑAL", pieza cinemática puramente visual
//                     y auditiva (pedido explícito: "pensemos como
//                     cineastas, un concepto de entrada") — cámara
//                     dirigida, sin control libre, audio 100% generativo.
// Cada una sigue siendo una ruta real propia además de elegible acá —
// sirve para linkear o probar una puntual sin depender del horario.
//
// Regla de selección (deliberadamente simple y fácil de tocar, nada de
// Mission/Intent/Pipeline para esto): franja horaria según la hora local
// del visitante, repartida en tres tercios iguales de 8h — arbitrario a
// propósito, se ajusta cambiando HOUR_RULES. /home-senal entra en el
// tercio de la tarde (12-20h, más probable que haya alguien mirando con
// sonido, no de madrugada con auriculares puestos sin querer). Override
// manual con ?home=nube, ?home=grafico o ?home=senal (útil para demos y
// para probar cualquiera sin esperar el horario). "Cierto estado del
// sitio" (no solo hora) queda abierto para cuando haya una señal real del
// sitio a la que atar esto — no se inventa una placeholder acá todavía.
//
// La decisión se toma recién en el cliente (useEffect, no en el primer
// render) porque la hora del visitante no existe todavía en el server:
// decidir durante el render mismo dispararía un hydration mismatch real
// (mismo tipo de bug ya visto y corregido en /experimental/cartografia).
// Primer pintado: un fondo neutro idéntico en server y cliente: luego del
// mount se elige variante y recién ahí se monta (las tres con ssr:false).

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const HomeNube = dynamic(() => import('./home-3d/page'), { ssr: false })
const HomeGrafico = dynamic(() => import('./home-grafico/page'), { ssr: false })
const HomeSenal = dynamic(() => import('./home-senal/page'), { ssr: false })

type Variant = 'nube' | 'grafico' | 'senal'

const HOUR_RULES: { from: number; to: number; variant: Variant }[] = [
  { from: 20, to: 24, variant: 'nube' },
  { from: 0, to: 4, variant: 'nube' },
  { from: 4, to: 12, variant: 'grafico' },
  { from: 12, to: 20, variant: 'senal' },
]

function pickByHour(hour: number): Variant {
  return HOUR_RULES.find((r) => hour >= r.from && hour < r.to)?.variant ?? 'nube'
}

export default function HomeDispatcher() {
  const [variant, setVariant] = useState<Variant | null>(null)

  useEffect(() => {
    const override = new URLSearchParams(window.location.search).get('home')
    if (override === 'nube' || override === 'grafico' || override === 'senal') {
      setVariant(override)
      return
    }
    setVariant(pickByHour(new Date().getHours()))
  }, [])

  if (!variant) return <div style={{ background: '#01040a', minHeight: '100vh' }} />
  if (variant === 'nube') return <HomeNube />
  if (variant === 'grafico') return <HomeGrafico />
  return <HomeSenal />
}
