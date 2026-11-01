'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const mono = "'Space Mono', monospace"

// Comandos reales a rutas que ya existen en el sitio — nada inventado para
// esta capa, ningún atajo a algo que no esté shippeado. Pensado como la
// Navi de Lain: una capa de texto por encima de todo, para quien ya conoce
// el sitio y no quiere navegar menú por menú (o para que descubra lo que
// no está linkeado desde ningún lado, como /system/entropia).
const ROUTES: Record<string, string> = {
  proxyverse: '/proxyverse',
  metatron: '/proxyverse/metatron',
  d: '/proxyverse/d',
  snake: '/proxyverse/snake',
  genos: '/proxyverse/genos',
  trickster: '/proxyverse/trickster',
  prototype: '/proxyverse/prototype',
  darkproxy: '/proxyverse/darkproxy',
  casino: '/proxyverse/trickster/casino',
  concilio: '/proxyverse/concilio',
  suenos: '/proxyverse/suenos',
  voluntad: '/proxyverse/voluntad',
  id: '/proxyverse/id',
  oraculo: '/experimental/oraculo',
  sigilo: '/experimental/sigilo',
  scan: '/experimental/scan',
  dialectica: '/experimental/dialectica',
  enjambre: '/experimental/enjambre',
  evolucion: '/experimental/evolucion',
  memoria: '/experimental/memoria',
  workbench: '/experimental/workbench',
  red: '/experimental/red',
  proxygenesis: '/lab/proxygenesis',
  atractores: '/lab/atractores',
  cola: '/fabrication/cola',
  archivo: '/fabrication/archivo',
  gallery: '/fabrication/gallery',
  marcador: '/realidad-aumentada/marcador',
  mascara: '/realidad-aumentada/mascara',
  neocam: '/realidad-aumentada/neocam',
  freestyle: '/realidad-aumentada/freestyle',
  knowledge: '/knowledge',
  shop: '/shop',
  entropia: '/system/entropia',
}

const META_COMMANDS = new Set(['ayuda', 'help', 'limpiar', 'clear', 'salir', 'exit', 'cerrar'])

type LogLine = { id: number; text: string; kind: 'echo' | 'ok' | 'error' | 'info' }

let lineId = 0

function isTypingTarget(el: Element | null): boolean {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable
}

export default function ConsoleOverlay() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [log, setLog] = useState<LogLine[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' && !isTypingTarget(document.activeElement)) {
        e.preventDefault()
        setOpen(prev => !prev)
        return
      }
      if (e.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const push = (text: string, kind: LogLine['kind']) => {
    lineId += 1
    setLog(prev => [...prev.slice(-19), { id: lineId, text, kind }])
  }

  const run = () => {
    const raw = input.trim()
    if (!raw) return
    const cmd = raw.toLowerCase()
    push(`> ${raw}`, 'echo')
    setInput('')

    if (cmd === 'ayuda' || cmd === 'help') {
      push(`rutas: ${Object.keys(ROUTES).join(', ')}`, 'info')
      push('limpiar / salir también funcionan.', 'info')
      return
    }
    if (cmd === 'limpiar' || cmd === 'clear') {
      setLog([])
      return
    }
    if (cmd === 'salir' || cmd === 'exit' || cmd === 'cerrar') {
      setOpen(false)
      return
    }
    const target = ROUTES[cmd]
    if (target) {
      push(`redirigiendo a ${target}...`, 'ok')
      router.push(target)
      window.setTimeout(() => setOpen(false), 400)
      return
    }
    push('comando no reconocido. probá "ayuda".', 'error')
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(0, 2, 5, 0.86)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '12vh 24px 24px',
      }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{
          width: '100%', maxWidth: 560, border: '1px solid #39ff1455', background: '#010a06ee',
          boxShadow: '0 0 40px #39ff1422', fontFamily: mono,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #39ff1422', fontSize: 9, letterSpacing: 3, color: '#39ff14aa' }}>
          NPX-NAVI // ` PARA CERRAR
        </div>
        <div style={{ maxHeight: 220, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {log.length === 0 && (
            <div style={{ fontSize: 10, color: '#39ff1444', letterSpacing: 1 }}>
              escribí "ayuda" para ver las rutas disponibles.
            </div>
          )}
          {log.map(l => (
            <div
              key={l.id}
              style={{
                fontSize: 10, letterSpacing: 0.5, lineHeight: 1.6, wordBreak: 'break-word',
                color: l.kind === 'echo' ? '#c8daf0' : l.kind === 'error' ? '#ff5577' : l.kind === 'ok' ? '#39ff14' : '#6a7a8a',
              }}
            >
              {l.text}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderTop: '1px solid #39ff1422' }}>
          <span style={{ color: '#39ff14', fontSize: 12 }}>&gt;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
            placeholder="comando..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#39ff14',
              fontFamily: mono, fontSize: 12, letterSpacing: 1,
            }}
          />
        </div>
      </div>
    </div>
  )
}
