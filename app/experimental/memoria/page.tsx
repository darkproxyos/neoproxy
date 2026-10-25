'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { entries } from '@/components/knowledge/entries'
import {
  GRID_SIZE, N, CAPACITY, PATTERN_DEFS, patternFromRows, randomPattern,
  trainHopfield, energyOf, stepHopfieldAsync, corrupt, overlap, mulberry32,
  type Pattern,
} from './engine/hopfield'

// NPX-XP-MEMORIA — quinto modo del laboratorio. Los otros cuatro (forma,
// tiempo, lenguaje, relación) no cubren esto: una red que APRENDE
// patrones y los recupera de una versión rota de ellos, no porque los
// busque en una tabla, sino porque cada patrón guardado es un pozo de
// energía — arrancar cerca de uno hace que el sistema "ruede cuesta
// abajo" hasta caer ahí adentro. Por eso esta es la única página del
// laboratorio que no usa Babylon: el objeto es un bitmap 2D, no una
// escena 3D, y forzarlo a 3D no sumaría nada.

const mono = "'Space Mono', monospace"
const RED = '#cc0000'
const CYAN = '#00d4ff'

const REAL_PATTERNS: Pattern[] = PATTERN_DEFS.map((d) => patternFromRows(d.rows))

function AuthorCard({ entryId, accent }: { entryId: string; accent: string }) {
  const entry = entries.find((e) => e.id === entryId)
  if (!entry) return null
  return (
    <Link href={`/knowledge?entry=${entry.id}`} style={{
      display: 'block', marginTop: 10, padding: '10px 12px', border: `1px solid ${accent}33`,
      background: `${accent}0a`, textDecoration: 'none',
    }}>
      <div style={{ fontSize: 9, color: accent, letterSpacing: 1, marginBottom: 4 }}>
        {entry.name.toUpperCase()} · {entry.years}
      </div>
      <div style={{ fontSize: 9, color: '#8fb8d6', letterSpacing: 0.5, marginBottom: 6 }}>{entry.role}</div>
      <div style={{ fontSize: 9, color: '#4a6080', fontStyle: 'italic', lineHeight: 1.6 }}>{entry.formulaLabel}</div>
    </Link>
  )
}

export default function MemoriaPage() {
  const [patternId, setPatternId] = useState(PATTERN_DEFS[0].id)
  const [state, setState] = useState<Pattern>(() => REAL_PATTERNS[0].slice())
  const [noiseLevel, setNoiseLevel] = useState(0.25)
  const [extraPatterns, setExtraPatterns] = useState(0)
  const [running, setRunning] = useState(false)
  const [corrupted, setCorrupted] = useState(false)
  const [energy, setEnergy] = useState(0)
  const [steps, setSteps] = useState(0)
  const [energyHistory, setEnergyHistory] = useState<number[]>([])
  const [overlaps, setOverlaps] = useState<Record<string, number>>({})

  const weightsRef = useRef<Float32Array>(trainHopfield(REAL_PATTERNS))
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    const rand = mulberry32(42)
    const noise = Array.from({ length: extraPatterns }, () => randomPattern(rand))
    weightsRef.current = trainHopfield([...REAL_PATTERNS, ...noise])
    // Cambiar cuántos patrones hay guardados cambia el paisaje de energía
    // entero — sin esto, la energía mostrada en pantalla quedaría vieja
    // (calculada contra los pesos anteriores) hasta la próxima acción.
    setEnergy(energyOf(state, weightsRef.current))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraPatterns])

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t))
    timersRef.current = []
  }

  const computeOverlaps = (s: Pattern) => {
    const next: Record<string, number> = {}
    PATTERN_DEFS.forEach((d, i) => { next[d.id] = overlap(s, REAL_PATTERNS[i]) })
    return next
  }

  const loadPattern = (id: string) => {
    if (running) return
    clearTimers()
    const idx = PATTERN_DEFS.findIndex((d) => d.id === id)
    setPatternId(id)
    const fresh = REAL_PATTERNS[idx].slice()
    setState(fresh)
    setCorrupted(false)
    setSteps(0)
    const e = energyOf(fresh, weightsRef.current)
    setEnergy(e)
    setEnergyHistory([e])
    setOverlaps(computeOverlaps(fresh))
  }

  const handleCorrupt = () => {
    if (running) return
    const rand = mulberry32(Date.now() % 1e6)
    const next = corrupt(state, noiseLevel, rand)
    setState(next)
    setCorrupted(true)
    setSteps(0)
    const e = energyOf(next, weightsRef.current)
    setEnergy(e)
    setEnergyHistory([e])
    setOverlaps(computeOverlaps(next))
  }

  const toggleCell = (i: number) => {
    if (running) return
    const next = state.slice()
    next[i] = -next[i]
    setState(next)
    setCorrupted(true)
    const e = energyOf(next, weightsRef.current)
    setEnergy(e)
    setEnergyHistory([e])
    setOverlaps(computeOverlaps(next))
  }

  const converge = () => {
    if (running) return
    setRunning(true)
    let current = state
    let prevEnergy = energyOf(current, weightsRef.current)
    let stableCount = 0
    let step = 0
    const rand = mulberry32(Date.now() % 1e6)

    const doStep = () => {
      current = stepHopfieldAsync(current, weightsRef.current, rand)
      const e = energyOf(current, weightsRef.current)
      step++
      setState(current)
      setEnergy(e)
      setSteps(step)
      setEnergyHistory((h) => [...h, e])
      setOverlaps(computeOverlaps(current))

      if (Math.abs(e - prevEnergy) < 0.01) stableCount++
      else stableCount = 0
      prevEnergy = e

      if (stableCount >= 2 || step >= 25) { setRunning(false); return }
      const t = window.setTimeout(doStep, 170)
      timersRef.current.push(t)
    }
    doStep()
  }

  useEffect(() => {
    setOverlaps(computeOverlaps(state))
    setEnergy(energyOf(state, weightsRef.current))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const accent = RED
  const bestMatch = Object.entries(overlaps).sort((a, b) => b[1] - a[1])[0]
  const maxEnergyAbs = Math.max(1, ...energyHistory.map((e) => Math.abs(e)))

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/experimental" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A EXPERIMENTAL
        </Link>

        <div style={{ fontSize: 9, color: `${RED}66`, letterSpacing: 6, marginBottom: 16 }}>
          NPX-XP-MEMORIA // CADA RECUERDO ES UN POZO DE ENERGÍA
        </div>
        <h1 style={{
          fontSize: 34, fontWeight: 700, letterSpacing: 6, color: RED,
          textShadow: `0 0 30px ${RED}44`, marginBottom: 16, lineHeight: 1,
        }}>
          MEMORIA
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 620, marginBottom: 36 }}>
          Una red de Hopfield no busca el recuerdo en una tabla — lo reconstruye rodando cuesta
          abajo en su propia energía. Elegí un patrón, rompélo (con ruido o a mano, pixel por
          pixel), y dejá correr la red: si no la sobrecargaste de más, va a caer exactamente en
          el original.
        </p>

        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 9, color: RED, letterSpacing: 2, marginBottom: 10 }}>PATRÓN</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
              {PATTERN_DEFS.map((d) => (
                <button key={d.id} onClick={() => loadPattern(d.id)} disabled={running} style={{
                  fontFamily: mono, fontSize: 9, padding: '7px 10px', cursor: running ? 'default' : 'pointer', letterSpacing: 0.5,
                  background: patternId === d.id ? `${accent}22` : 'transparent',
                  border: `1px solid ${patternId === d.id ? accent : '#2a3a50'}`,
                  color: patternId === d.id ? accent : '#4a6080', opacity: running ? 0.6 : 1,
                }}>
                  {d.label}
                </button>
              ))}
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: 3,
              width: 340, height: 340, marginBottom: 16,
            }}>
              {state.map((v, i) => (
                <div key={i} onClick={() => toggleCell(i)} style={{
                  background: v === 1 ? accent : '#0a1018',
                  border: `1px solid ${v === 1 ? accent : '#1a2436'}`,
                  cursor: running ? 'default' : 'pointer',
                  boxShadow: v === 1 ? `0 0 5px ${accent}99` : 'none',
                }} />
              ))}
            </div>
            <div style={{ fontSize: 8, color: '#3a4a60', letterSpacing: 0.5, marginBottom: 16 }}>
              clic en un pixel = corromper a mano · {corrupted ? 'patrón corrompido' : 'patrón original, sin tocar'}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button onClick={handleCorrupt} disabled={running} style={{
                flex: 1, fontFamily: mono, fontSize: 9, padding: 10, cursor: running ? 'default' : 'pointer', letterSpacing: 1,
                background: 'transparent', border: `1px solid ${accent}`, color: accent, opacity: running ? 0.5 : 1,
              }}>
                ⚡ CORROMPER ({Math.round(noiseLevel * 100)}%)
              </button>
              <button onClick={converge} disabled={running} style={{
                flex: 1, fontFamily: mono, fontSize: 9, fontWeight: 700, padding: 10, cursor: running ? 'default' : 'pointer', letterSpacing: 1,
                background: accent, color: '#020408', border: 'none', opacity: running ? 0.6 : 1,
              }}>
                {running ? `CONVERGIENDO... (${steps})` : '▶ CONVERGER'}
              </button>
            </div>
            <input
              type="range" min={0} max={0.5} step={0.01} value={noiseLevel}
              onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
              disabled={running}
              style={{ width: '100%', accentColor: accent }}
            />
          </div>

          <div style={{ width: 280 }}>
            <div style={{ fontSize: 9, color: RED, letterSpacing: 2, marginBottom: 10 }}>ESTADO DE LA RED</div>

            <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 1, marginBottom: 4 }}>
              ENERGÍA: <span style={{ color: accent }}>{energy.toFixed(1)}</span> · PASOS: <span style={{ color: accent }}>{steps}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 36, marginBottom: 18, border: `1px solid ${accent}22`, padding: '3px 3px 0' }}>
              {energyHistory.map((e, i) => {
                const h = Math.max(4, (Math.abs(e) / maxEnergyAbs) * 100)
                return <div key={i} style={{ flex: 1, background: accent, opacity: 0.4 + 0.6 * (i / Math.max(1, energyHistory.length - 1)), height: `${h}%` }} />
              })}
            </div>

            <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 1, marginBottom: 8 }}>
              SOLAPAMIENTO CON CADA PATRÓN GUARDADO
            </div>
            {PATTERN_DEFS.map((d) => {
              const v = overlaps[d.id] ?? 0
              const isBest = bestMatch && bestMatch[0] === d.id
              return (
                <div key={d.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: isBest ? accent : '#8fb8d6', marginBottom: 3 }}>
                    <span>{d.label}{isBest ? ' ←' : ''}</span>
                    <span>{Math.round(v * 100)}%</span>
                  </div>
                  <div style={{ height: 4, background: '#111a28' }}>
                    <div style={{ height: '100%', width: `${v * 100}%`, background: isBest ? accent : '#2a3a50' }} />
                  </div>
                </div>
              )
            })}

            <div style={{ fontSize: 9, color: RED, letterSpacing: 2, margin: '22px 0 10px', borderTop: `1px solid ${RED}22`, paddingTop: 18 }}>
              SOBRECARGAR LA MEMORIA
            </div>
            <div style={{ fontSize: 9, color: '#4a6080', lineHeight: 1.8, marginBottom: 10 }}>
              Capacidad teórica de esta red: ≈{CAPACITY} patrones (N={N} neuronas). Agregá ruido
              guardado de más y mirá cómo el recuerdo empieza a fallar de verdad.
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#4a6080', marginBottom: 4 }}>
              <span>PATRONES DE RUIDO EXTRA</span>
              <span style={{ color: extraPatterns > CAPACITY - 4 ? '#ff2d55' : accent }}>{extraPatterns}</span>
            </div>
            <input
              type="range" min={0} max={30} step={1} value={extraPatterns}
              onChange={(e) => setExtraPatterns(parseInt(e.target.value, 10))}
              disabled={running}
              style={{ width: '100%', accentColor: accent, marginBottom: 14 }}
            />

            <AuthorCard entryId="hopfield" accent={accent} />
          </div>
        </div>
      </div>
    </div>
  )
}
