'use client'

// HOME — SELECTOR. Pedido explícito: la home deja de ser una sola pantalla
// fija y pasa a ser varias "home index" reales entre las que el sitio
// elige — pensado para crecer con el tiempo (más variantes artísticas,
// más técnicas), no para quedarse en dos para siempre.
//
// Hoy hay dos variantes reales:
//   - /home-3d     — la nube cinemática 3D (la home de siempre hasta acá,
//                    ver ese archivo para todo su historial v1-v5).
//   - /home-grafico — el mapa del sitio entero estilo /experimental/
//                    cartografia (pedido explícito, nació de que esa
//                    página le gustó al usuario como idea de navegación).
// Cada una sigue siendo una ruta real propia además de elegible acá —
// sirve para linkear o probar una puntual sin depender del horario.
//
// Regla de selección (deliberadamente simple y fácil de tocar, nada de
// Mission/Intent/Pipeline para esto): franja horaria según la hora local
// del visitante — 12:00 a 23:59 la nube (más tráfico esperado, más
// "evento"), 00:00 a 11:59 el mapa (más calma, más "consulta técnica").
// Es arbitraria a propósito; se ajusta cambiando HOUR_RULES. Override
// manual con ?home=nube o ?home=grafico (útil para demos y para probar la
// otra sin esperar el horario). "Cierto estado del sitio" (no solo hora)
// queda abierto para cuando haya una señal real del sitio a la que atar
// esto — no se inventa una placeholder acá todavía.
//
// La decisión se toma recién en el cliente (useEffect, no en el primer
// render) porque la hora del visitante no existe todavía en el server:
// decidir durante el render mismo dispararía un hydration mismatch real
// (mismo tipo de bug ya visto y corregido en /experimental/cartografia).
// Primer pintado: un fondo neutro idéntico en server y cliente: luego del
// mount se elige variante y recién ahí se monta (ambas con ssr:false).

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const HomeNube = dynamic(() => import('./home-3d/page'), { ssr: false })
const HomeGrafico = dynamic(() => import('./home-grafico/page'), { ssr: false })

type Variant = 'nube' | 'grafico'

const HOUR_RULES: { from: number; to: number; variant: Variant }[] = [
  { from: 12, to: 24, variant: 'nube' },
  { from: 0, to: 12, variant: 'grafico' },
]

function pickByHour(hour: number): Variant {
  return HOUR_RULES.find((r) => hour >= r.from && hour < r.to)?.variant ?? 'nube'
}

export default function HomeDispatcher() {
  const [variant, setVariant] = useState<Variant | null>(null)

  useEffect(() => {
    const override = new URLSearchParams(window.location.search).get('home')
    if (override === 'nube' || override === 'grafico') {
      setVariant(override)
      return
    }
    setVariant(pickByHour(new Date().getHours()))
  }, [])

  if (!variant) return <div style={{ background: '#01040a', minHeight: '100vh' }} />
  return variant === 'nube' ? <HomeNube /> : <HomeGrafico />
}
