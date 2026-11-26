'use client'

// YI JING — oráculo real de las tres monedas, segundo instrumento de
// Codex Arcanum (el primero fue /experimental/sigilo, para Grimorios).
// A diferencia de sigilo (determinístico a propósito: la misma frase
// da siempre el mismo glifo), acá la aleatoriedad es real y deliberada
// -- Math.random en cada moneda, sin semilla, porque el método de las
// monedas siempre fue, literalmente, azar. Forzarlo a ser reproducible
// le quitaría el único mecanismo que de verdad tiene.
//
// Las 64 lecturas que arma (ver engine/hexagrams.ts) son síntesis
// propia de NeoProxy sobre la combinación real de los dos trigramas,
// no una traducción de los juicios clásicos -- ver la nota de
// honestidad completa en /arcano/yijing, sección VIII.

import { useRef, useState } from 'react'
import Link from 'next/link'
import { castSixLines, primaryLines, transformedLines, type CastLine } from '@/app/arcano/yijing/engine/oracle'
import { buildHexagram, TRIGRAMS, type Hexagram } from '@/app/arcano/yijing/engine/hexagrams'

const mono = "'Space Mono', monospace"
const JADE = '#1f6b52'
const JADE_BRIGHT = '#3fcf9e'
const GOLD = '#c9a24d'

function HexagramLines({ lines, cast, size = 220 }: { lines: boolean[]; cast?: CastLine[]; size?: number }) {
  // de abajo hacia arriba -- se invierte el array para dibujarlo de arriba hacia abajo en pantalla
  const rows = [...lines].map((yang, i) => ({ yang, changing: cast?.[i]?.isChanging ?? false })).reverse()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: size }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 10, display: 'flex', gap: row.yang ? 0 : 8 }}>
            {row.yang ? (
              <div style={{ flex: 1, background: row.changing ? GOLD : JADE_BRIGHT, boxShadow: `0 0 8px ${row.changing ? GOLD : JADE_BRIGHT}88` }} />
            ) : (
              <>
                <div style={{ flex: 1, background: row.changing ? GOLD : JADE_BRIGHT, boxShadow: `0 0 8px ${row.changing ? GOLD : JADE_BRIGHT}88` }} />
                <div style={{ flex: 1, background: row.changing ? GOLD : JADE_BRIGHT, boxShadow: `0 0 8px ${row.changing ? GOLD : JADE_BRIGHT}88` }} />
              </>
            )}
          </div>
          <div style={{ width: 14, fontSize: 11, color: GOLD, textAlign: 'center' }}>
            {row.changing ? (row.yang ? '○' : '✕') : ''}
          </div>
        </div>
      ))}
    </div>
  )
}

function HexagramCard({ hex, label, color }: { hex: Hexagram; label: string; color: string }) {
  const upper = TRIGRAMS[hex.upper]
  const lower = TRIGRAMS[hex.lower]
  return (
    <div style={{ border: `1px solid ${color}44`, background: `${color}0a`, padding: '20px 22px' }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: `${color}cc`, marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <HexagramLines lines={hex.lines} size={100} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 16, color: '#fff', letterSpacing: 0.5, marginBottom: 6 }}>{hex.title}</div>
          <div style={{ fontSize: 9, color: '#8fb8a8', letterSpacing: 1, marginBottom: 12 }}>
            {upper.chars} {upper.pinyin} ({upper.image}) sobre {lower.chars} {lower.pinyin} ({lower.image})
          </div>
          <p style={{ fontSize: 11, lineHeight: 1.8, color: '#c8e8da', margin: 0 }}>{hex.reading}</p>
        </div>
      </div>
    </div>
  )
}

export default function YiJingOraclePage() {
  const [question, setQuestion] = useState('')
  const [cast, setCast] = useState<CastLine[]>([])
  const [casting, setCasting] = useState(false)
  const [primary, setPrimary] = useState<Hexagram | null>(null)
  const [transformed, setTransformed] = useState<Hexagram | null>(null)
  const timersRef = useRef<number[]>([])

  const lanzar = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t))
    timersRef.current = []
    setCast([])
    setPrimary(null)
    setTransformed(null)
    setCasting(true)

    const allLines = castSixLines()
    allLines.forEach((line, i) => {
      const t = window.setTimeout(() => {
        setCast((prev) => [...prev, line])
      }, (i + 1) * 650)
      timersRef.current.push(t)
    })

    const tEnd = window.setTimeout(() => {
      const p = buildHexagram(primaryLines(allLines))
      setPrimary(p)
      const tl = transformedLines(allLines)
      if (tl) setTransformed(buildHexagram(tl))
      setCasting(false)
    }, allLines.length * 650 + 300)
    timersRef.current.push(tEnd)
  }

  return (
    <div style={{ background: '#020805', minHeight: '100vh', color: '#d8ece4', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/experimental" className="press tap-ext" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a7060', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
          ← VOLVER A EXPERIMENTAL
        </Link>

        <div style={{ fontSize: 9, color: `${JADE_BRIGHT}99`, letterSpacing: 6, marginBottom: 16 }}>
          NPX-XP-YIJING // MÉTODO REAL DE LAS TRES MONEDAS
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: 4, color: JADE_BRIGHT, textShadow: `0 0 30px ${JADE_BRIGHT}44`, marginBottom: 16, lineHeight: 1 }}>
          易經 YI JING
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8a8', letterSpacing: 0.5, lineHeight: 2, maxWidth: 600, marginBottom: 12 }}>
          Seis líneas, tres monedas cada una, de abajo hacia arriba — el mismo método que popularizó la
          práctica en Occidente. A diferencia del{' '}
          <Link href="/experimental/sigilo" style={{ color: GOLD, textDecoration: 'none' }}>sigilo</Link>,
          acá nada es determinístico a propósito: es azar real, sin semilla — es lo que el método de las
          monedas siempre fue. Las 64 lecturas son una síntesis propia de NeoProxy sobre la combinación
          real de los dos trigramas, no una traducción de los textos clásicos — ver{' '}
          <Link href="/arcano/yijing" style={{ color: GOLD, textDecoration: 'none' }}>por qué</Link> en
          Codex Arcanum.
        </p>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={casting}
          placeholder="¿SOBRE QUÉ QUERÉS TIRAR? (OPCIONAL)"
          rows={2}
          style={{
            width: '100%', background: '#020c08', border: `1px solid ${JADE}66`, color: '#d8ece4',
            fontFamily: mono, fontSize: 12, padding: '14px 16px', outline: 'none', letterSpacing: 0.5,
            resize: 'vertical', marginBottom: 20, opacity: casting ? 0.6 : 1,
          }}
        />

        <button onClick={lanzar} disabled={casting} className="press" style={{
          fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '12px 28px', cursor: casting ? 'default' : 'pointer',
          background: `${JADE}22`, border: `1px solid ${JADE_BRIGHT}88`, color: JADE_BRIGHT,
          opacity: casting ? 0.6 : 1, marginBottom: 40,
        }}>
          {casting ? `TIRANDO LÍNEA ${cast.length + 1} / 6...` : primary ? '◆ TIRAR DE NUEVO' : '◆ LANZAR LAS MONEDAS'}
        </button>

        {cast.length > 0 && (
          <div className="fade-in" style={{ marginBottom: 40, display: 'flex', justifyContent: 'center', border: `1px solid ${JADE}44`, background: 'rgba(0,10,6,0.4)', padding: '28px 20px' }}>
            <HexagramLines lines={[...cast.map((l) => l.isYang), ...Array(6 - cast.length).fill(false)].slice(0, 6)} cast={cast} />
          </div>
        )}

        {primary && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
            <HexagramCard hex={primary} label={transformed ? 'HEXAGRAMA PRIMARIO — DÓNDE ESTÁS' : 'HEXAGRAMA — DÓNDE ESTÁS'} color={JADE_BRIGHT} />
            {transformed && (
              <>
                <div style={{ textAlign: 'center', fontSize: 14, color: GOLD }}>↓ líneas en cambio ↓</div>
                <HexagramCard hex={transformed} label="HEXAGRAMA TRANSFORMADO — HACIA DÓNDE SE MUEVE" color={GOLD} />
              </>
            )}
          </div>
        )}

        {primary && (
          <div className="fade-in" style={{
            fontSize: 9.5, lineHeight: 1.8, color: '#6a9a86', letterSpacing: 0.3,
            border: `1px solid ${JADE}33`, background: `${JADE}08`, padding: '16px 18px', marginBottom: 20,
          }}>
            Esto no predice nada — es azar real (tres monedas, sin semilla) leído a través de una
            estructura real (los 8 trigramas). Lo que hagas con la lectura depende de vos, no de las
            monedas.
          </div>
        )}

        {!casting && (
          <div style={{ fontSize: 8, letterSpacing: 0.5, color: `${JADE}77` }}>
            NPX-XP-YIJING // v1 — oráculo de monedas, lecturas propias sobre trigramas reales.
          </div>
        )}
      </div>
    </div>
  )
}
