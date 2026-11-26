'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// EL UMBRAL. Entre el Afuera y la Zona: la pantalla de un televisor en un canal muerto
// ("el cielo sobre el puerto era del color de la televisión sintonizada en un canal
// muerto", Neuromante) y una voz que te habla de tú, como a un cómplice, y que avisa que
// no siempre dice la verdad (homenaje a Mr. Robot). Recuerda cuántas veces viniste
// (solo un número, en este navegador). Siempre hay salida: cruzar ya, volver o la tienda.

const mono = "'Space Mono', monospace"
const LINEAS: Record<'primera' | 'vuelta' | 'habitual', string[]> = {
  primera: [
    'Llegaste. La mayoría se queda afuera, mirando las vitrinas.',
    'Lo que viste afuera es la versión que se deja ver.',
    'Adentro las cosas no se diseñan: caen de una ley. Humo, rayos, órbitas, arena.',
    'Ahí nada te miente. Cada cosa dice cuánto se equivoca.',
    'Yo no prometo lo mismo.',
    'No camines en línea recta.',
  ],
  vuelta: [
    'Volviste.',
    'Eso dice más de ti que de este lugar.',
    'Adentro todo sigue donde lo dejaste. Tú no.',
  ],
  habitual: [
    'Ya conoces el camino.',
    'Igual no camines en línea recta.',
  ],
}

const ls = { get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* nada */ } } }
const ss = { get: (k: string) => { try { return sessionStorage.getItem(k) } catch { return null } }, set: (k: string, v: string) => { try { sessionStorage.setItem(k, v) } catch { /* nada */ } } }

// zumbido eléctrico y estática (sintetizados), solo si se piden
class Zumbido {
  ctx = new AudioContext(); g = this.ctx.createGain()
  constructor() {
    this.g.gain.value = 0; this.g.connect(this.ctx.destination)
    for (const [f, a] of [[50, 0.5], [100, 0.3], [150, 0.12]]) { const o = this.ctx.createOscillator(), og = this.ctx.createGain(); o.frequency.value = f; og.gain.value = a; o.connect(og); og.connect(this.g); o.start() }
    const n = this.ctx.sampleRate * 2, b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
    const s = this.ctx.createBufferSource(); s.buffer = b; s.loop = true
    const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.6
    const sg = this.ctx.createGain(); sg.gain.value = 0.35; s.connect(bp); bp.connect(sg); sg.connect(this.g); s.start()
    this.g.gain.setTargetAtTime(0.06, this.ctx.currentTime, 0.4)
  }
  surge() { this.g.gain.setTargetAtTime(0.22, this.ctx.currentTime, 0.15) }
  stop() { this.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1); setTimeout(() => this.ctx.close(), 400) }
}

export default function Umbral() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [lines, setLines] = useState<string[] | null>(null)
  const [idx, setIdx] = useState(0), [chars, setChars] = useState(0)
  const [ready, setReady] = useState(false), [crossing, setCrossing] = useState(false)
  const [sound, setSound] = useState(false)
  const zum = useRef<Zumbido | null>(null)
  const surge = useRef(0) // intensidad extra de la estática al cruzar

  // ya cruzó en esta sesión: directo adentro (salvo ?quedarse)
  useEffect(() => {
    if (ss.get('npx-cruzo') && !/[?&]quedarse\b/.test(window.location.search)) { router.replace('/fenomenos'); return }
    const v = Number(ls.get('npx-umbral-visitas') || 0) + 1
    ls.set('npx-umbral-visitas', String(v))
    setLines(v === 1 ? LINEAS.primera : v < 5 ? LINEAS.vuelta : LINEAS.habitual)
  }, [router])

  // la voz: letra por letra; tocar completa la línea o pasa a la siguiente
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  useEffect(() => {
    if (!lines || idx >= lines.length) { if (lines) setReady(true); return }
    const full = lines[idx].length
    if (reduced) { setChars(full); const t = setTimeout(() => { setIdx((i) => i + 1); setChars(0) }, 1400); return () => clearTimeout(t) }
    if (chars < full) { const t = setTimeout(() => setChars((c) => c + 1), lines[idx][chars] === ' ' ? 18 : 34); return () => clearTimeout(t) }
    const t = setTimeout(() => { setIdx((i) => i + 1); setChars(0) }, 900 + 28 * full)
    return () => clearTimeout(t)
  }, [lines, idx, chars, reduced])
  const advance = () => {
    if (!lines || idx >= lines.length) return
    if (chars < lines[idx].length) setChars(lines[idx].length); else { setIdx((i) => i + 1); setChars(0) }
  }

  // estática de canal muerto: grilla chica, ampliada sin suavizar, con cortes horizontales
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const W = 160, H = 100, g = c.getContext('2d')!
    c.width = W; c.height = H
    const img = g.createImageData(W, H), d = img.data
    let roll = 0, tear = -1, tearUntil = 0, raf = 0, last = 0
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      if (now - last < 42) return // ~24 cuadros por segundo
      last = now
      const extra = surge.current
      roll = (roll + 0.7) % H
      if (now > tearUntil && Math.random() < 0.04) { tear = Math.floor(Math.random() * H); tearUntil = now + 120 + Math.random() * 200 }
      for (let y = 0; y < H; y++) {
        const shift = tear >= 0 && now < tearUntil && Math.abs(y - tear) < 3 ? 6 : 0
        const band = Math.abs(y - roll) < 2 ? 38 : 0
        for (let x = 0; x < W; x++) {
          const v = Math.min(255, 70 + Math.random() * 120 + band + extra * 160 + shift * 8)
          const o = 4 * (y * W + x)
          d[o] = v * 0.86; d[o + 1] = v * 0.9; d[o + 2] = Math.min(255, v * 1.02 + 10); d[o + 3] = 255
        }
      }
      g.putImageData(img, 0, 0)
      if (reduced) cancelAnimationFrame(raf)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  useEffect(() => () => { zum.current?.stop() }, [])
  const toggleSound = () => { if (zum.current) { zum.current.stop(); zum.current = null; setSound(false) } else { zum.current = new Zumbido(); setSound(true) } }

  const cross = () => {
    if (crossing) return
    setCrossing(true); ss.set('npx-cruzo', '1'); zum.current?.surge()
    const t0 = performance.now()
    const up = () => { const u = Math.min(1, (performance.now() - t0) / 900); surge.current = u * u; if (u < 1) requestAnimationFrame(up); else router.push('/fenomenos') }
    requestAnimationFrame(up)
  }

  const shown = lines ? lines.slice(0, idx) : []
  const current = lines && idx < lines.length ? lines[idx].slice(0, chars) : null
  return (
    <div onClick={advance} style={{ position: 'relative', height: '100vh', minHeight: 560, overflow: 'hidden', background: '#0d0f13', fontFamily: mono, cursor: lines && idx < lines.length ? 'pointer' : 'default' }}>
      <canvas ref={canvasRef} aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated', opacity: crossing ? 1 : 0.42, transition: 'opacity .9s' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 40% 55%, transparent 25%, #05070acc 80%)' }} />
      {/* sombra detrás de la voz: se lee sobre la estática */}
      <div aria-hidden style={{ position: 'absolute', left: 0, bottom: 0, width: 'min(100%, 900px)', height: '70vh', background: 'radial-gradient(ellipse at 15% 75%, #05070af0 0%, #05070ab0 40%, transparent 72%)', opacity: crossing ? 0 : 1, transition: 'opacity .6s' }} />
      <div role="log" aria-live="polite" style={{ position: 'absolute', left: 'max(6vw, 18px)', right: 'max(6vw, 18px)', bottom: '22vh', maxWidth: 620, color: '#eef2f8', textShadow: '0 1px 8px #000, 0 0 2px #000', opacity: crossing ? 0 : 1, transition: 'opacity .6s' }}>
        {shown.map((l, i) => <p key={i} style={{ margin: '0 0 14px', fontSize: 'clamp(14px, 2.1vw, 18px)', lineHeight: 1.7, opacity: i >= shown.length - 2 ? 0.72 : 0.45 }}>{l}</p>)}
        {current !== null && <p style={{ margin: 0, fontSize: 'clamp(15px, 2.3vw, 20px)', lineHeight: 1.7 }}>{current}<span className="umbral-cursor">█</span></p>}
        {ready && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="press" onClick={cross} style={{ minHeight: 52, padding: '0 30px', fontFamily: mono, fontSize: 13, letterSpacing: 5, background: '#eef2f8', color: '#05070a', border: 'none', cursor: 'pointer' }}>CRUZAR →</button>
            <Link href="/" style={{ minHeight: 52, display: 'flex', alignItems: 'center', padding: '0 20px', fontSize: 11, letterSpacing: 3, color: '#c8d2e0', border: '1px solid #ffffff40', textDecoration: 'none' }}>VOLVER AL AFUERA</Link>
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', top: 'max(84px, 11vh)', left: 'max(6vw, 18px)', fontSize: 10, letterSpacing: 5, color: '#c8d2e0aa' }}>NPX // EL UMBRAL</div>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', right: 'max(4vw, 14px)', bottom: 'max(4vh, 18px)', display: 'flex', gap: 16, alignItems: 'center', fontSize: 10, letterSpacing: 2, opacity: crossing ? 0 : 1 }}>
        <button type="button" onClick={toggleSound} style={{ background: 'none', border: 'none', color: sound ? '#eef2f8' : '#8b95a5', fontFamily: mono, fontSize: 10, letterSpacing: 2, cursor: 'pointer', padding: 8 }}>{sound ? '♪ ZUMBIDO' : '♪ SIN SONIDO'}</button>
        <Link href="/shop" style={{ color: '#8b95a5', textDecoration: 'none', padding: 8 }}>TIENDA</Link>
        {!ready && <button type="button" onClick={cross} style={{ background: 'none', border: 'none', color: '#c8d2e0', fontFamily: mono, fontSize: 10, letterSpacing: 2, cursor: 'pointer', padding: 8 }}>CRUZAR YA →</button>}
      </div>
      <style>{`
        .umbral-cursor { animation: umbral-blink 1s steps(1) infinite; margin-left: 2px; }
        @keyframes umbral-blink { 50% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .umbral-cursor { animation: none; } }
      `}</style>
    </div>
  )
}
