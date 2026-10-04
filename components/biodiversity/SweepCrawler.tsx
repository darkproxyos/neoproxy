'use client'

// Especie 1: movimiento continuo. Barre de punta a punta del bloque de
// texto en una sola pasada, dejando un brillo de paso. Contraste a
// propósito con GlitchMite (especie 2): acá no hay quietud, es puro flujo.
export default function SweepCrawler({
  id, color, top, left, width, height, duration, onDone,
}: {
  id: number
  color: string
  top: number
  left: number
  width: number
  height: number
  duration: number
  onDone: () => void
}) {
  const barWidth = 90
  const sweepEnd = Math.max(0, width - barWidth)

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', top, left, width, height,
        zIndex: 40, pointerEvents: 'none', overflow: 'hidden',
      }}
    >
      <div
        className="bio-sweep"
        style={{
          position: 'absolute', top: 0, left: 0, height: '100%', width: barWidth,
          background: `linear-gradient(90deg, transparent, ${color}4d, ${color}1a, transparent)`,
          mixBlendMode: 'screen',
          animation: `bio-crawl-${id} ${duration}s linear forwards`,
        }}
        onAnimationEnd={onDone}
      >
        <svg
          width="26" height="20" viewBox="0 0 26 20"
          style={{ position: 'absolute', top: '50%', right: -4, transform: 'translateY(-50%)' }}
        >
          <ellipse cx="13" cy="10" rx="4" ry="3" fill={color} opacity="0.9" />
          <g stroke={color} strokeWidth="1" opacity="0.8" className="bio-legs-a">
            <line x1="11" y1="9" x2="2" y2="3" />
            <line x1="11" y1="10" x2="1" y2="10" />
            <line x1="11" y1="11" x2="2" y2="17" />
          </g>
          <g stroke={color} strokeWidth="1" opacity="0.8" className="bio-legs-b">
            <line x1="15" y1="9" x2="24" y2="3" />
            <line x1="15" y1="10" x2="25" y2="10" />
            <line x1="15" y1="11" x2="24" y2="17" />
          </g>
        </svg>
      </div>

      <style>{`
        @keyframes bio-crawl-${id} {
          0% { transform: translateX(0); opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { transform: translateX(${sweepEnd}px); opacity: 0; }
        }
        .bio-legs-a, .bio-legs-b {
          transform-origin: 13px 10px;
          animation: bio-twitch 0.22s ease-in-out infinite alternate;
        }
        .bio-legs-b { animation-direction: alternate-reverse; }
        @keyframes bio-twitch {
          from { transform: rotate(-6deg); }
          to { transform: rotate(6deg); }
        }
      `}</style>
    </div>
  )
}
