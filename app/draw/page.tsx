'use client'
import { useEffect, useRef, useState } from 'react'

export default function DrawCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<'brush'|'line'|'erase'>('brush')
  const [color, setColor] = useState('#00ffcc')
  const [size, setSize] = useState(4)
  const drawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Fondo negro
    ctx.fillStyle = '#010810'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Grid sutil
    ctx.strokeStyle = '#00d4ff08'
    ctx.lineWidth = 0.5
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
    }

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
      return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top }
    }

    const startDraw = (e: MouseEvent | TouchEvent) => {
      drawing.current = true
      lastPos.current = getPos(e)
    }

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!drawing.current) return
      const pos = getPos(e)
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)

      if (tool === 'erase') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.strokeStyle = 'rgba(0,0,0,1)'
        ctx.lineWidth = size * 4
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = color
        ctx.lineWidth = size
        ctx.shadowBlur = 12
        ctx.shadowColor = color
      }

      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.shadowBlur = 0
      lastPos.current = pos
    }

    const stopDraw = () => { drawing.current = false }

    canvas.addEventListener('mousedown', startDraw)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', stopDraw)
    canvas.addEventListener('touchstart', startDraw)
    canvas.addEventListener('touchmove', draw)
    canvas.addEventListener('touchend', stopDraw)

    return () => {
      canvas.removeEventListener('mousedown', startDraw)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', stopDraw)
    }
  }, [tool, color, size])

  const colors = ['#00ffcc', '#00d4ff', '#6644ff', '#ff4444', '#ffdd00', '#ff44aa', '#ffffff', '#00ff44']

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#010810' }}>
      <canvas ref={canvasRef} style={{ display: 'block', cursor: 'crosshair' }} />

      {/* Toolbar */}
      <div style={{
        position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 12, alignItems: 'center',
        background: '#020c18ee', border: '1px solid #00d4ff22',
        padding: '10px 20px', backdropFilter: 'blur(8px)',
        fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 3
      }}>
        {['brush', 'erase'].map(t => (
          <button key={t} onClick={() => setTool(t as any)} style={{
            background: tool === t ? '#00d4ff22' : 'none',
            border: `1px solid ${tool === t ? '#00d4ff' : '#00d4ff33'}`,
            color: '#00d4ff', padding: '4px 12px', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 9, letterSpacing: 3
          }}>{t.toUpperCase()}</button>
        ))}

        <div style={{ width: 1, height: 20, background: '#00d4ff22' }} />

        {colors.map(c => (
          <div key={c} onClick={() => { setTool('brush'); setColor(c) }} style={{
            width: 18, height: 18, borderRadius: '50%', background: c,
            cursor: 'pointer', border: color === c ? '2px solid white' : '2px solid transparent',
            boxShadow: `0 0 8px ${c}88`
          }} />
        ))}

        <div style={{ width: 1, height: 20, background: '#00d4ff22' }} />

        <input type="range" min={1} max={30} value={size}
          onChange={e => setSize(Number(e.target.value))}
          style={{ width: 80, accentColor: '#00d4ff' }} />

        <div style={{ color: '#00d4ff44', fontSize: 9 }}>{size}px</div>

        <div style={{ width: 1, height: 20, background: '#00d4ff22' }} />

        <button onClick={() => {
          const canvas = canvasRef.current!
          const ctx = canvas.getContext('2d')!
          ctx.fillStyle = '#010810'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }} style={{
          background: 'none', border: '1px solid #ff444433',
          color: '#ff4444', padding: '4px 12px', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 9, letterSpacing: 3
        }}>CLEAR</button>

        <button onClick={() => {
          const link = document.createElement('a')
          link.download = 'neoproxy-draw.png'
          link.href = canvasRef.current!.toDataURL()
          link.click()
        }} style={{
          background: 'none', border: '1px solid #00d4ff33',
          color: '#00d4ff', padding: '4px 12px', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 9, letterSpacing: 3
        }}>SAVE</button>
      </div>

      <a href="/" style={{
        position: 'fixed', bottom: 20, left: 20,
        fontFamily: 'monospace', color: '#00d4ff22',
        fontSize: 10, letterSpacing: 3, textDecoration: 'none'
      }}>← EXIT</a>
    </div>
  )
}
