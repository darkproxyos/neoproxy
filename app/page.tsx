'use client'

// HOME — SELECTOR. Pedido explícito: la home deja de ser una sola pantalla
// fija y pasa a ser varias "home index" reales entre las que el sitio
// elige — pensado para crecer con el tiempo (más variantes artísticas,
// más técnicas), no para quedarse en tres para siempre.
//
// Hoy hay cuatro variantes reales (la cuarta, /home-circulos, es la vista de círculos del mismo mapa):
//   - /home-3d      — la nube cinemática 3D (la home de siempre hasta acá,
//                     ver ese archivo para todo su historial v1-v5).
//   - /home-grafico — el mapa del sitio entero estilo /experimental/
//                     cartografia (pedido explícito, nació de que esa
//                     página le gustó al usuario como idea de navegación).
//   - /home-senal   — "RUIDO → SEÑAL", pieza cinemática puramente visual
//                     y auditiva (pedido explícito: "pensemos como
//                     cineastas, un concepto de entrada") — cámara
//                     dirigida, sin control libre, audio 100% generativo.
// Las tres, además de elegibles acá, siguen siendo rutas reales propias,
// y las tres están listadas (con su blurb real) en /home-galeria -- la
// vista de catálogo pedida explícitamente, linkeada desde HOME en el menú.
//
// Regla de selección: aleatoria, pedido explícito ("hagámoslo aleatorio
// por ahora") en vez de la franja horaria que había antes -- ese código
// (HOUR_RULES, reparto en tercios de 8h) se reemplaza entero por esto,
// no queda comentado al lado ni como fallback silencioso. Override manual
// con ?home=nube, ?home=grafico o ?home=senal sigue andando igual (útil
// para demos o para linkear una puntual sin depender del azar) -- la
// galería es la otra forma real de elegir a propósito. "Por ahora" porque
// es explícitamente provisorio: el día que haya una señal real del
// estado del sitio a la que atar esto, o se quiera volver a horario,
// cambia acá nomás, en pickVariant.
//
// La decisión se toma recién en el cliente (useEffect, no en el primer
// render) porque un valor al azar (como la hora) no existe todavía en el
// server: decidir durante el render mismo dispararía un hydration
// mismatch real (mismo tipo de bug ya visto y corregido en
// /experimental/cartografia). Primer pintado: un fondo neutro idéntico en
// server y cliente; luego del mount se elige variante y recién ahí se
// monta (las tres con ssr:false).

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const HomeNube = dynamic(() => import('./home-3d/page'), { ssr: false })
const HomeGrafico = dynamic(() => import('./home-grafico/page'), { ssr: false })
const HomeSenal = dynamic(() => import('./home-senal/page'), { ssr: false })
const HomeCirculos = dynamic(() => import('./home-circulos/page'), { ssr: false })

export type HomeVariant = 'nube' | 'grafico' | 'senal' | 'circulos'
export const HOME_VARIANTS: HomeVariant[] = ['nube', 'grafico', 'senal', 'circulos']

function pickVariant(): HomeVariant {
  return HOME_VARIANTS[Math.floor(Math.random() * HOME_VARIANTS.length)]
}

export default function HomeDispatcher() {
  const [variant, setVariant] = useState<HomeVariant | null>(null)

  useEffect(() => {
    const override = new URLSearchParams(window.location.search).get('home')
    const pedido = HOME_VARIANTS.find((v) => v === override)
    if (pedido) {
      setVariant(pedido)
      return
    }
    setVariant(pickVariant())
  }, [])

  if (!variant) return <div style={{ background: '#01040a', minHeight: '100vh' }} />
  if (variant === 'nube') return <HomeNube />
  if (variant === 'grafico') return <HomeGrafico />
  if (variant === 'circulos') return <HomeCirculos />
  return <HomeSenal />
}
