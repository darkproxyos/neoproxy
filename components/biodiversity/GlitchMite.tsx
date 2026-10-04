'use client'

import { useEffect, useRef, useState } from 'react'

// Especie 2: quietud puntuada por acción. A diferencia de SweepCrawler (que
// nunca para), el ácaro se posa sobre una palabra real, se queda quieto un
// momento, y de golpe ataca -- le cambia la tipografía a la palabra en vivo
// (span real insertado vía splitText/replaceWith, no una copia encima) antes
// de revertirla y saltar a la siguiente. Tres golpes, después se va.
const CYCLES = 3
const STILL_MS = 1000
const STRIKE_MS = 320
const HOLD_MS = 480
const GLITCH_CLASS = 'bio-glitch-word'

function findWordSpan(root: HTMLElement): { span: HTMLSpanElement; rect: DOMRect } | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  let node: Node | null
  while ((node = walker.nextNode())) {
    if (node.textContent && node.textContent.trim().length > 0) textNodes.push(node as Text)
  }
  if (textNodes.length === 0) return null

  const textNode = textNodes[Math.floor(Math.random() * textNodes.length)]
  const text = textNode.textContent ?? ''
  const matches = Array.from(text.matchAll(/[\p{L}]{3,}/gu))
  if (matches.length === 0) return null
  const match = matches[Math.floor(Math.random() * matches.length)]
  const start = match.index ?? 0
  const end = start + match[0].length

  try {
    if (end < text.length) textNode.splitText(end)
    const wordNode = start > 0 ? textNode.splitText(start) : textNode
    const span = document.createElement('span')
    span.className = GLITCH_CLASS
    span.textContent = wordNode.textContent
    wordNode.replaceWith(span)
    return { span, rect: span.getBoundingClientRect() }
  } catch {
    return null
  }
}

function revertSpan(span: HTMLSpanElement) {
  try {
    span.replaceWith(document.createTextNode(span.textContent ?? ''))
  } catch {
    // ya pudo haber sido removido por otra causa (navegación, etc.) -- no pasa nada
  }
}

export default function GlitchMite({
  target, color, onDone,
}: {
  target: HTMLElement
  color: string
  onDone: () => void
}) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const [phase, setPhase] = useState<'still' | 'strike'>('still')
  const [visible, setVisible] = useState(true)
  const activeSpan = useRef<HTMLSpanElement | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    let cycle = 0
    let cancelled = false

    const schedule = (fn: () => void, ms: number) => {
      const t = setTimeout(() => { if (!cancelled) fn() }, ms)
      timers.current.push(t)
    }

    const finish = () => {
      if (activeSpan.current) revertSpan(activeSpan.current)
      activeSpan.current = null
      setVisible(false)
      schedule(onDone, 250)
    }

    const runCycle = () => {
      if (cancelled) return
      // target puede quedar huérfano si el layout raíz no desmonta entre
      // navegaciones (no lo hace) -- si ya no está en el documento, cortar acá.
      if (cycle >= CYCLES || !document.contains(target)) { finish(); return }
      cycle++

      const found = findWordSpan(target)
      if (!found) { finish(); return }
      activeSpan.current = found.span
      setPos({ top: found.rect.top, left: found.rect.left, width: found.rect.width, height: found.rect.height })
      setPhase('still')

      schedule(() => {
        found.span.classList.add('bio-glitch-strike')
        setPhase('strike')
        schedule(() => {
          schedule(() => {
            revertSpan(found.span)
            activeSpan.current = null
            runCycle()
          }, HOLD_MS)
        }, STRIKE_MS)
      }, STILL_MS)
    }

    runCycle()

    return () => {
      cancelled = true
      timers.current.forEach(clearTimeout)
      if (activeSpan.current) revertSpan(activeSpan.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  if (!pos || !visible) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', top: pos.top - 14, left: pos.left + pos.width / 2 - 9, width: 18, height: 18,
        zIndex: 41, pointerEvents: 'none', transition: 'top 0.25s ease, left 0.25s ease',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" className={phase === 'strike' ? 'bio-mite-strike' : 'bio-mite-still'}>
        <circle cx="9" cy="9" r="3.4" fill={color} opacity="0.95" />
        <g stroke={color} strokeWidth="1" opacity="0.75">
          <line x1="6" y1="7" x2="1" y2="4" />
          <line x1="6" y1="11" x2="1" y2="14" />
          <line x1="12" y1="7" x2="17" y2="4" />
          <line x1="12" y1="11" x2="17" y2="14" />
        </g>
      </svg>

      <style>{`
        .bio-mite-still { animation: bio-mite-breathe 1.1s ease-in-out infinite; }
        @keyframes bio-mite-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .bio-mite-strike { animation: bio-mite-jitter 0.12s steps(2) 3; }
        @keyframes bio-mite-jitter {
          0% { transform: translate(0, 0); }
          50% { transform: translate(-2px, 1.5px) scale(1.25); }
          100% { transform: translate(2px, -1.5px) scale(1.25); }
        }
        .${GLITCH_CLASS} {
          display: inline-block;
          transition: transform 0.12s ease;
        }
        .${GLITCH_CLASS}.bio-glitch-strike {
          font-family: var(--font-inter), sans-serif;
          font-style: italic;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: ${color};
          text-shadow: 0 0 8px ${color}99;
          animation: bio-word-glitch 0.3s steps(3);
        }
        @keyframes bio-word-glitch {
          0% { transform: translate(0); }
          33% { transform: translate(-2px, 1px) skewX(-6deg); }
          66% { transform: translate(2px, -1px) skewX(4deg); }
          100% { transform: translate(0) skewX(0deg); }
        }
      `}</style>
    </div>
  )
}
