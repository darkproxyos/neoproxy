'use client'

// LAIN — la capa atmosférica de todo el sitio: cables colgando sobre el borde de arriba,
// grano de señal, viñeta y un desgarro de imagen de vez en cuando; más un botón que
// enciende el zumbido de la red (apagado de inicio). No agrega ningún bucle de animación
// en JavaScript: los cables y el grano son CSS (transform), y el desgarro es un
// temporizador raro. Todo es pointer-events:none y respeta prefers-reduced-motion.
// Los estilos están en app/globals.css (.lain-*). El color de las páginas lo baja
// .neo-organism-filter (--lain-sat), no esta capa.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { crearZumbido, type Zumbido } from '@/lib/lain/sonido'

const KEY = 'npx-lain-sonido'
const subs = new Set<() => void>()
const pref = {
  subscribe(cb: () => void) { subs.add(cb); return () => { subs.delete(cb) } },
  get() { try { return localStorage.getItem(KEY) === '1' } catch { return false } },
  server() { return false },
  set(v: boolean) { try { localStorage.setItem(KEY, v ? '1' : '0') } catch { /* sin almacenamiento */ } subs.forEach((f) => f()) },
}

let zumbido: Zumbido | null = null
const z = () => (zumbido ??= crearZumbido())

// «capa» de la página: un número del 1 al 13 que sale de la ruta, siempre el mismo para la misma
function capa(ruta: string) {
  let h = 7
  for (let i = 0; i < ruta.length; i++) h = (h * 31 + ruta.charCodeAt(i)) % 9973
  return String((h % 13) + 1).padStart(2, '0')
}

export default function LainLayer() {
  const ruta = usePathname() ?? '/'
  const quiere = useSyncExternalStore(pref.subscribe, pref.get, pref.server)
  const [sonando, setSonando] = useState(false)
  const desgarro = useRef<HTMLDivElement>(null)

  // si lo dejaste encendido, suena con tu primer toque o tecla (el navegador no deja antes)
  useEffect(() => {
    if (!quiere || sonando) return
    const alGesto = () => { void z().iniciar().then(() => setSonando(true), () => setSonando(false)) }
    window.addEventListener('pointerdown', alGesto, { once: true })
    window.addEventListener('keydown', alGesto, { once: true })
    return () => { window.removeEventListener('pointerdown', alGesto); window.removeEventListener('keydown', alGesto) }
  }, [quiere, sonando])

  // el desgarro: una franja de señal que cruza la pantalla, cada 25 a 60 segundos
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let t: ReturnType<typeof setTimeout>
    const siguiente = () => {
      t = setTimeout(() => {
        const el = desgarro.current
        if (el && !document.hidden) {
          el.style.top = `${8 + Math.random() * 84}%`
          el.style.height = `${2 + Math.random() * 5}px`
          el.classList.remove('lain-desgarro-on')
          void el.offsetWidth // reinicia la animación
          el.classList.add('lain-desgarro-on')
        }
        siguiente()
      }, 25000 + Math.random() * 35000)
    }
    siguiente()
    return () => clearTimeout(t)
  }, [])

  const alternar = () => {
    if (quiere) { pref.set(false); z().detener(); setSonando(false); return }
    pref.set(true)
    void z().iniciar().then(() => setSonando(true), () => setSonando(false))
  }

  return (
    <>
      <div className="lain-cables" aria-hidden="true">
        <svg viewBox="0 0 1000 160" preserveAspectRatio="none">
          <path className="c1" d="M-10,22 Q250,96 500,62 T1010,40" />
          <path className="c2" d="M-10,44 Q300,128 560,90 T1010,70" />
          <path className="c3" d="M-10,10 Q200,64 470,36 T1010,18" />
          <path className="c4" d="M-10,70 Q340,142 640,104 T1010,92" />
        </svg>
      </div>
      <div className="lain-vineta" aria-hidden="true" />
      <div className="lain-grano" aria-hidden="true" />
      <div ref={desgarro} className="lain-desgarro" aria-hidden="true" />
      <button type="button" className="lain-control" aria-pressed={quiere} aria-label={quiere ? 'Apagar el zumbido ambiente' : 'Encender el zumbido ambiente'} title="Zumbido de la red" onClick={alternar}>
        CAPA {capa(ruta)} · SONIDO {quiere ? (sonando ? '●' : '◌') : '○'}
      </button>
    </>
  )
}
