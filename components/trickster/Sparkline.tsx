'use client'

export default function Sparkline({ values, color, width = 120, height = 32 }: {
  values: number[]
  color: string
  width?: number
  height?: number
}) {
  if (values.length < 2) return <svg width={width} height={height} />

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = width / (values.length - 1)

  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`)
    .join(' ')

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} opacity={0.85} />
    </svg>
  )
}
