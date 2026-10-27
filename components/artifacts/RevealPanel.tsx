'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import type { ArtifactReveal } from './registry'
import { playRevealSound } from './playReveal'

const mono = "'Space Mono', monospace"

// Pieza de UI compartida por los dos consumidores DOM del pipeline de
// artefactos (/realidad-aumentada/marcador y /experimental/scan) — NeoCam
// no la usa porque dibuja sobre un <canvas> 2D, no DOM, pero lee el mismo
// ArtifactReveal (ver app/realidad-aumentada/neocam/engine/marker.ts).
export default function RevealPanel({ reveal }: { reveal: ArtifactReveal }) {
  const playedForRef = useRef<string | null>(null)

  useEffect(() => {
    if (playedForRef.current === reveal.id) return
    playedForRef.current = reveal.id
    playRevealSound(reveal)
  }, [reveal])

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        className="marcador-reveal-text"
        style={{
          fontFamily: mono, fontSize: 'clamp(24px, 6vw, 48px)', fontWeight: 700, letterSpacing: 3,
          color: reveal.color, textShadow: `0 0 12px ${reveal.color}, 0 0 34px ${reveal.glow}, 0 0 60px ${reveal.glow}`,
          padding: '0 20px',
        }}
      >
        {reveal.text}
      </div>
      {reveal.agentId && (
        <Link href={`/proxyverse/${reveal.agentId}`} style={{
          display: 'inline-block', marginTop: 16, fontFamily: mono, fontSize: 9, letterSpacing: 2,
          color: reveal.color, border: `1px solid ${reveal.color}66`, padding: '8px 16px', textDecoration: 'none',
        }}>
          VER PERFIL →
        </Link>
      )}
    </div>
  )
}
