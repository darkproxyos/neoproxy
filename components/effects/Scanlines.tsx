'use client'

interface ScanlinesProps {
  opacity?: number
  density?: number // pixels between lines
  color?: string
  animated?: boolean
}

export default function Scanlines({
  opacity = 0.03,
  density = 4,
  color = '#b400ff',
  animated = true
}: ScanlinesProps) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-40"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent ${density - 1}px,
          ${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')} ${density - 1}px,
          ${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')} ${density}px
        )`,
        animation: animated ? 'scanlineMove 10s linear infinite' : 'none'
      }}
    >
      <style jsx>{`
        @keyframes scanlineMove {
          0% { background-position: 0 0; }
          100% { background-position: 0 ${density * 4}px; }
        }
      `}</style>
    </div>
  )
}

// CRT-style scanlines with flicker
export function CRTScanlines({
  opacity = 0.05,
  flicker = true
}: {
  opacity?: number
  flicker?: boolean
}) {
  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background: `linear-gradient(
            rgba(18, 16, 16, 0) 50%,
            rgba(0, 0, 0, ${opacity}) 50%
          )`,
          backgroundSize: '100% 4px',
          animation: flicker ? 'flicker 0.15s infinite' : 'none'
        }}
      />
      <style jsx>{`
        @keyframes flicker {
          0% { opacity: 0.97; }
          50% { opacity: 1; }
          100% { opacity: 0.98; }
        }
      `}</style>
    </>
  )
}

// Combined effect for maximum aesthetic
export function CyberpunkEffects() {
  return (
    <>
      <Scanlines opacity={0.03} density={4} color="#b400ff" animated={false} />
      <CRTScanlines opacity={0.03} flicker={true} />
    </>
  )
}
