'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { tramoDe, type Tramo } from '@/lib/zona/rutas'
import Intertitulo, { type Cartel } from './Intertitulo'

// El clima del viaje: pone el tramo en <html data-tramo> (el CSS decide sepia, gris o color,
// con la transición lenta del filtro del sitio) y muestra el cartel de capítulo cuando se
// cambia de tramo. La Zona se anuncia cada vez que se entra desde otro tramo (como mucho una
// vez cada 10 minutos); el Afuera, solo al llegar al sitio.
export const CARTELES: Record<Tramo, Cartel> = {
  afuera: { tramo: 'I', titulo: 'EL AFUERA', sub: 'Aquí todo se ve. Por eso nada se ve del todo.' },
  umbral: { tramo: 'II', titulo: 'EL UMBRAL', sub: 'Entre lo que se muestra y lo que ocurre.' },
  zona: { tramo: 'III', titulo: 'LA ZONA', sub: 'Aquí las cosas no se diseñan: caen de una ley.' },
}

const get = (k: string) => { try { return sessionStorage.getItem(k) } catch { return null } }
const set = (k: string, v: string) => { try { sessionStorage.setItem(k, v) } catch { /* sin almacenamiento: no pasa nada */ } }

export default function Clima() {
  const path = usePathname() ?? '/'
  const prev = useRef<Tramo | null | undefined>(undefined)
  const [cartel, setCartel] = useState<Cartel | null>(null)

  useEffect(() => {
    // tras el primer pintado se vuelve a permitir la transición lenta del filtro
    const r = requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('tramo-boot')))
    return () => cancelAnimationFrame(r)
  }, [])

  const pending = useRef<Tramo | null>(null)
  const apply = (t: Tramo | null) => { const h = document.documentElement; if (t) h.setAttribute('data-tramo', t); else h.removeAttribute('data-tramo') }

  useEffect(() => {
    const t = tramoDe(path)
    const first = prev.current === undefined, changed = !first && prev.current !== t
    prev.current = t
    pending.current = null
    const quiet = /[?&]sin-carteles\b/.test(window.location.search)
    const now = Date.now()
    if (!quiet && t === 'zona' && changed && now - Number(get('npx-tramo-zona') || 0) > 10 * 60 * 1000) {
      // al cruzar: el cartel tapa la pantalla y el color vuelve recién cuando se corta,
      // para que se vea volver (si no, la transición ocurre detrás del negro)
      set('npx-tramo-zona', String(now)); pending.current = 'zona'; setCartel({ ...CARTELES.zona }); return
    }
    apply(t)
    if (!t || quiet) return
    if (t === 'afuera' && first && !get('npx-tramo-afuera')) { set('npx-tramo-afuera', '1'); setCartel({ ...CARTELES.afuera }) }
    if (t === 'umbral' && (first || changed)) setCartel({ ...CARTELES.umbral })
    if (t === 'zona' && first && now - Number(get('npx-tramo-zona') || 0) > 10 * 60 * 1000) { set('npx-tramo-zona', String(now)); setCartel({ ...CARTELES.zona }) }
  }, [path])

  return <Intertitulo cartel={cartel} onDone={() => { setCartel(null); if (pending.current) { apply(pending.current); pending.current = null } }} />
}
