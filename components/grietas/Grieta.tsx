'use client'

import { useEffect, useRef, useState } from 'react'
import { agents } from '@/components/proxyverse/agents'
import { recordGrietaFragment, GRIETA_DONOR_IDS } from '@/components/proxyverse/identity'
import { findWordSpan, revertSpan, GLITCH_STRIKE_CLASS } from '@/components/biodiversity/glitchWord'

const DONOR_COLORS = GRIETA_DONOR_IDS.map(id => agents.find(a => a.id === id)!.color)

// Antes de cerrarse (por click o por vencerse sola), la grieta contagia
// palabras reales cercanas a donde apareció — mismo mecanismo que GlitchMite
// (components/biodiversity/glitchWord.ts), así que Grietas y
// ProxyBiodiversity comparten literalmente el código del glitch de texto, no
// solo el estilo. Cuántas palabras se contagian depende de la entropía real
// del sitio (--neo-entropy, ver EntropyField.tsx) — con el sistema en calma
// es solo una, corrupto es un ataque de a tres.
const INFECT_HOLD_MS = 460

function readEntropyFraction(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--neo-entropy')
  const value = parseFloat(raw)
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0
}

function findNearbyTextRoot(x: number, y: number): HTMLElement {
  // elementsFromPoint devuelve la pila completa superpuesta en ese pixel, de
  // la más próxima a la más lejana — salta la grieta misma (sin texto) y los
  // overlays fijos vacíos (ruido de fondo, GhostPresence, etc.) hasta llegar
  // al primer elemento real de la página con texto debajo del punto exacto
  // donde apareció, en vez de escalar por los ancestros de un solo hit.
  const stack = document.elementsFromPoint(x, y) as HTMLElement[]
  for (const el of stack) {
    if (el === document.body || el === document.documentElement) break
    // Salta la grieta misma (su <style> interno cuenta como "texto" para
    // textContent aunque no sea una palabra visible) y cualquier otro
    // elemento sin texto visible real.
    if (el.getAttribute('aria-label') === 'Grieta') continue
    if ((el.textContent ?? '').trim().length >= 12) return el
  }
  return document.body
}

function infectNearbyWords(topVh: number, leftVw: number, color: string): HTMLSpanElement[] {
  const x = (leftVw / 100) * window.innerWidth
  const y = (topVh / 100) * window.innerHeight
  const root = findNearbyTextRoot(x, y)
  const wordCount = readEntropyFraction() >= 0.7 ? 3 : readEntropyFraction() >= 0.3 ? 2 : 1

  const infected: HTMLSpanElement[] = []
  for (let i = 0; i < wordCount; i++) {
    const found = findWordSpan(root)
    if (!found) break
    found.span.style.setProperty('--glitch-color', color)
    found.span.style.setProperty('--glitch-glow', `${color}99`)
    found.span.classList.add(GLITCH_STRIKE_CLASS)
    infected.push(found.span)
  }
  return infected
}

// A propósito mucho más raro que ProxyBiodiversity (que aparece garantizado
// cada 55-80s): acá se tira una moneda cada CHECK_INTERVAL_MS, y la mayoría
// de las veces no pasa nada. Tiempo medio hasta la primera aparición ≈
// CHECK_INTERVAL_MS / SPAWN_CHANCE ≈ 12-13 minutos de pestaña visible — una
// visita típica no debería encontrar una sin quedarse un rato largo.
const CHECK_INTERVAL_MS = 90_000
const SPAWN_CHANCE = 0.12
const VISIBLE_MS = 14_000

type ActiveGrieta = { id: number; top: number; left: number }

let grietaId = 0

export default function Grieta() {
  const [active, setActive] = useState<ActiveGrieta | null>(null)
  const [resolving, setResolving] = useState(false)
  // El setInterval de abajo vive en un solo efecto de montaje (no se
  // reprograma en cada render), así que su closure se queda con los
  // valores de active/resolving del primer render para siempre si los lee
  // directo del state — de ahí los refs, que sí reflejan el valor actual
  // en cada tick sin tener que recrear el interval.
  const activeRef = useRef<ActiveGrieta | null>(null)
  const resolvingRef = useRef(false)
  const despawnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const infectedSpansRef = useRef<HTMLSpanElement[]>([])

  const clearInfection = () => {
    infectedSpansRef.current.forEach(revertSpan)
    infectedSpansRef.current = []
  }

  const beginResolve = (color: string) => {
    if (!activeRef.current || resolvingRef.current) return
    if (despawnTimer.current) window.clearTimeout(despawnTimer.current)
    resolvingRef.current = true
    setResolving(true)
    const { top, left } = activeRef.current
    infectedSpansRef.current = infectNearbyWords(top, left, color)
    window.setTimeout(() => {
      clearInfection()
      activeRef.current = null
      resolvingRef.current = false
      setActive(null)
    }, INFECT_HOLD_MS)
  }

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    const spawn = () => {
      const next = {
        id: ++grietaId,
        top: 12 + Math.random() * 70,
        left: 8 + Math.random() * 80,
      }
      activeRef.current = next
      resolvingRef.current = false
      setActive(next)
      setResolving(false)
      despawnTimer.current = setTimeout(() => {
        const randomColor = DONOR_COLORS[Math.floor(Math.random() * DONOR_COLORS.length)]
        beginResolve(randomColor)
      }, VISIBLE_MS)
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (activeRef.current || resolvingRef.current) return
      if (Math.random() < SPAWN_CHANCE) spawn()
    }, CHECK_INTERVAL_MS)

    return () => {
      window.clearInterval(interval)
      if (despawnTimer.current) window.clearTimeout(despawnTimer.current)
      clearInfection()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClick = () => {
    if (!activeRef.current || resolvingRef.current) return
    const donorId = GRIETA_DONOR_IDS[Math.floor(Math.random() * GRIETA_DONOR_IDS.length)]
    recordGrietaFragment(donorId)
    beginResolve(agents.find(a => a.id === donorId)!.color)
  }

  if (!active) return null

  return (
    <button
      onClick={handleClick}
      aria-label="Grieta"
      style={{
        position: 'fixed', top: `${active.top}vh`, left: `${active.left}vw`,
        width: 36, height: 36, padding: 7, border: 'none', background: 'transparent',
        cursor: 'pointer', zIndex: 60,
      }}
      className={resolving ? 'grieta-resolve' : 'grieta-idle'}
    >
      <svg width="22" height="22" viewBox="0 0 22 22">
        <g className="grieta-shimmer" strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M11 1 L7 9 L13 10 L8 21" />
          <path d="M11 1 L15 9 L9 11 L14 21" opacity="0.5" />
        </g>
      </svg>

      <style>{`
        .grieta-shimmer path {
          animation: grieta-cycle 1.6s steps(${DONOR_COLORS.length}) infinite;
        }
        .grieta-shimmer path:last-child {
          animation-delay: 0.26s;
        }
        @keyframes grieta-cycle {
          ${DONOR_COLORS.map((c, i) => `${Math.round((i / DONOR_COLORS.length) * 100)}% { stroke: ${c}; }`).join('\n          ')}
          100% { stroke: ${DONOR_COLORS[0]}; }
        }
        .grieta-idle {
          animation: grieta-breathe 1.8s ease-in-out infinite;
        }
        @keyframes grieta-breathe {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.12); }
        }
        .grieta-resolve {
          animation: grieta-dissolve 0.46s ease-out forwards;
          pointer-events: none;
        }
        @keyframes grieta-dissolve {
          0% { opacity: 1; transform: scale(1.15); filter: blur(0); }
          100% { opacity: 0; transform: scale(2.2); filter: blur(3px); }
        }
      `}</style>
    </button>
  )
}
