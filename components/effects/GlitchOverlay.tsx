'use client'

import { useEffect, useState } from 'react'

interface GlitchOverlayProps {
  intensity?: number // 0-1
  trigger?: boolean // manual trigger
  autoGlitch?: boolean // random auto glitches
  interval?: number // ms between auto glitches
}

export default function GlitchOverlay({
  intensity = 0.5,
  trigger = false,
  autoGlitch = false,
  interval = 5000
}: GlitchOverlayProps) {
  const [isGlitching, setIsGlitching] = useState(false)

  useEffect(() => {
    if (trigger) {
      setIsGlitching(true)
      const timer = setTimeout(() => setIsGlitching(false), 200)
      return () => clearTimeout(timer)
    }
  }, [trigger])

  useEffect(() => {
    if (!autoGlitch) return

    const scheduleGlitch = () => {
      const delay = Math.random() * interval + 1000
      return setTimeout(() => {
        setIsGlitching(true)
        setTimeout(() => setIsGlitching(false), 100 + Math.random() * 150)
        scheduleGlitch()
      }, delay)
    }

    const timer = scheduleGlitch()
    return () => clearTimeout(timer)
  }, [autoGlitch, interval])

  if (!isGlitching) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{
        background: `linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 0, 0, ${0.1 * intensity}) 20%,
          transparent 40%,
          rgba(0, 255, 255, ${0.1 * intensity}) 60%,
          transparent 80%,
          rgba(180, 0, 255, ${0.1 * intensity}) 100%
        )`,
        mixBlendMode: 'screen',
        animation: 'glitchShift 0.1s infinite'
      }}
    >
      <style jsx>{`
        @keyframes glitchShift {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(2px, -2px); }
          60% { transform: translate(-2px, 0); }
          80% { transform: translate(2px, 2px); }
          100% { transform: translate(0); }
        }
      `}</style>
    </div>
  )
}

// Hook for programmatic glitch control
export function useGlitch() {
  const [trigger, setTrigger] = useState(false)

  const glitch = () => {
    setTrigger(true)
    setTimeout(() => setTrigger(false), 200)
  }

  return { glitch, trigger }
}
