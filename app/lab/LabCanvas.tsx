'use client'

import { useEffect, useRef, useState } from 'react'

const mono = "'Space Mono', monospace"
const COLORS = ['#00ffcc', '#00d4ff', '#6644ff', '#ff4444', '#ffdd00', '#ff44aa', '#ffffff', '#ff8c1a']

// Primer experimento real del laboratorio nuevo: un canvas de dibujo libre,
// adaptado del mecanismo que ya probó funcionar en app/draw/page.tsx (mismo
// manejo de mouse/touch, mismo modo "erase" por destination-out) pero
// embebido en el layout de la página en vez de pantalla completa, porque
// acá convive con el header del laboratorio, no lo reemplaza.
export default function LabCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const [tool, setTool] = useState<'brush' | 'erase'>('brush')
  const [color, setColor] = useState(COLORS[0])
  const [size, setSize] = useState(5)
  const drawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  // el listener de draw se registra una sola vez (useEffect de abajo) para
  // no perder el trazo en curso si tool/color/size cambian a mitad de
  // gesto -- lee estos refs en vez de depender de los valores de estado.
  const toolRef = useRef(tool); toolRef.current = tool
  const colorRef = useRef(color); colorRef.current = color
  const sizeRef = useRef(size); sizeRef.current = size

  const paintBackground = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#010810'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#00d4ff0a'
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 36) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 36) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current!
    const container = containerRef.current!
    const ctx = canvas.getContext('2d')!
    ctxRef.current = ctx

    const resize = () => {
      // un resize real de <canvas> borra el contenido -- no hay forma de
      // conservar el dibujo al cambiar de tamaño sin guardarlo aparte, así
      // que esto solo corre al montar (ver el [] de abajo), no en cada
      // resize de ventana.
      canvas.width = container.clientWidth
      canvas.height = Math.round(container.clientWidth * 0.6)
      paintBackground(canvas, ctx)
    }
    resize()

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
      e.preventDefault()
      const pos = getPos(e)
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)

      if (toolRef.current === 'erase') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.strokeStyle = 'rgba(0,0,0,1)'
        ctx.lineWidth = sizeRef.current * 4
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = colorRef.current
        ctx.lineWidth = sizeRef.current
        ctx.shadowBlur = 10
        ctx.shadowColor = colorRef.current
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
    window.addEventListener('mouseup', stopDraw)
    canvas.addEventListener('touchstart', startDraw, { passive: true })
    canvas.addEventListener('touchmove', draw, { passive: false })
    canvas.addEventListener('touchend', stopDraw)

    return () => {
      canvas.removeEventListener('mousedown', startDraw)
      canvas.removeEventListener('mousemove', draw)
      window.removeEventListener('mouseup', stopDraw)
      canvas.removeEventListener('touchstart', startDraw)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', stopDraw)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (canvas && ctx) paintBackground(canvas, ctx)
  }

  const save = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'neoproxy-lab.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
        marginBottom: 14, padding: '10px 14px', border: '1px solid #ff8c1a22',
        fontFamily: mono,
      }}>
        {(['brush', 'erase'] as const).map(t => (
          <button key={t} onClick={() => setTool(t)} style={{
            background: tool === t ? '#ff8c1a22' : 'none',
            border: `1px solid ${tool === t ? '#ff8c1a' : '#ff8c1a33'}`,
            color: '#ff8c1a', padding: '5px 12px', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 9, letterSpacing: 3,
          }}>
            {t === 'brush' ? 'PINCEL' : 'BORRAR'}
          </button>
        ))}

        <div style={{ width: 1, height: 20, background: '#ff8c1a22' }} />

        {COLORS.map(c => (
          <button
            key={c} aria-label={`color ${c}`}
            onClick={() => { setTool('brush'); setColor(c) }}
            style={{
              width: 18, height: 18, borderRadius: '50%', background: c, padding: 0,
              cursor: 'pointer', border: color === c ? '2px solid white' : '2px solid transparent',
              boxShadow: `0 0 8px ${c}88`,
            }}
          />
        ))}

        <div style={{ width: 1, height: 20, background: '#ff8c1a22' }} />

        <input
          type="range" min={1} max={30} value={size}
          onChange={e => setSize(Number(e.target.value))}
          style={{ width: 80, accentColor: '#ff8c1a' }}
        />
        <div style={{ color: '#ff8c1a88', fontSize: 9, width: 28 }}>{size}px</div>

        <div style={{ width: 1, height: 20, background: '#ff8c1a22' }} />

        <button onClick={clear} style={{
          background: 'none', border: '1px solid #ff444433', color: '#ff4444',
          padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 9, letterSpacing: 3,
        }}>
          LIMPIAR
        </button>
        <button onClick={save} style={{
          background: 'none', border: '1px solid #ff8c1a33', color: '#ff8c1a',
          padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 9, letterSpacing: 3,
        }}>
          GUARDAR
        </button>
      </div>

      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', touchAction: 'none', cursor: 'crosshair', border: '1px solid #ff8c1a33' }}
      />
    </div>
  )
}
