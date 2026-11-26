'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  reduceIntention, buildSigilGlyph, buildConceptualInstruction,
  type ReducedIntention, type SigilGlyph, type ConceptualInstruction,
} from './engine/sigil'
import { loadSigilGallery, saveSigilToGallery, deleteSigilFromGallery, type GallerySigil } from './engine/gallery'

const mono = "'Space Mono', monospace"
const GREEN = '#00ff9d'
const VIOLET = '#b06bff'
const GOLD = '#c9a24d'

const SUGGESTED = [
  'VEO CON CLARIDAD',
  'SOSTENGO LA ATENCIÓN',
  'TERMINO LO QUE EMPIEZO',
  'CONFÍO EN EL PROCESO',
]

type Status = 'idle' | 'reducing' | 'drawing' | 'done' | 'charging' | 'charged'

// Ritual de carga -- el paso que el método histórico de Spare sí tiene y
// que esta herramienta no ofrecía hasta ahora: crear el sigilo es solo la
// mitad del procedimiento documentado; la otra mitad es llevar la
// atención a un estado de absorción breve (gnosis) y después soltar
// conscientemente el significado literal. Acá eso se implementa como un
// ciclo de respiración guiado y cronometrado -- nada de "energía", el
// mecanismo real detrás es atencional: narrowing de foco + el efecto de
// cierre que cualquier ritual estructurado produce, documentado en
// psicología (ver nota de cierre en pantalla). Tres ciclos de 4-4-6
// segundos, ~42s en total, siempre la misma duración -- determinístico
// como el resto de la herramienta, no al azar.
const BREATH_CYCLE = [
  { phase: 'INHALÁ', ms: 4000 },
  { phase: 'SOSTENÉ', ms: 4000 },
  { phase: 'EXHALÁ', ms: 6000 },
] as const
const BREATH_REPEATS = 3

function SigilSVG({ glyph, size = 200, animate = false }: { glyph: SigilGlyph; size?: number; animate?: boolean }) {
  const pathRef = useRef<SVGPathElement>(null)
  const [dashLen, setDashLen] = useState(1000)

  useEffect(() => {
    if (pathRef.current) {
      try { setDashLen(pathRef.current.getTotalLength() || 1) } catch { setDashLen(1000) }
    }
  }, [glyph.pathD])

  return (
    <svg viewBox="0 0 200 200" width={size} height={size}>
      {/* la rueda de fondo — las 26 posiciones fijas, siempre las mismas */}
      {glyph.wheelPoints.map(p => (
        <circle key={p.letter} cx={p.x} cy={p.y} r={1} fill={`${VIOLET}33`} />
      ))}
      <circle cx={100} cy={100} r={82} fill="none" stroke={`${VIOLET}1a`} strokeWidth={1} />

      {glyph.pathD && (
        <path
          ref={pathRef}
          d={glyph.pathD}
          fill="none"
          stroke={GREEN}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animate ? 'sigil-path-draw' : undefined}
          style={animate ? {
            strokeDasharray: dashLen,
            strokeDashoffset: dashLen,
            filter: `drop-shadow(0 0 6px ${GREEN}88)`,
          } : {
            filter: `drop-shadow(0 0 6px ${GREEN}88)`,
          }}
        />
      )}
      {glyph.points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === 0 || i === glyph.points.length - 1 ? 3.5 : 2}
          fill={i === 0 ? '#000' : GREEN}
          stroke={GREEN}
          strokeWidth={1.2}
        />
      ))}
    </svg>
  )
}

export default function SigiloPage() {
  const [intention, setIntention] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [reduced, setReduced] = useState<ReducedIntention | null>(null)
  const [glyph, setGlyph] = useState<SigilGlyph | null>(null)
  const [instruction, setInstruction] = useState<ConceptualInstruction | null>(null)
  const [gallery, setGallery] = useState<GallerySigil[]>([])
  const [saved, setSaved] = useState(false)
  const [breathPhase, setBreathPhase] = useState<{ phase: string; cycle: number } | null>(null)
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    setGallery(loadSigilGallery())
    return () => { timersRef.current.forEach(t => window.clearTimeout(t)) }
  }, [])

  const forjar = () => {
    const phrase = intention.trim() || SUGGESTED[Math.floor(Math.random() * SUGGESTED.length)]
    timersRef.current.forEach(t => window.clearTimeout(t))
    timersRef.current = []
    setSaved(false)
    setGlyph(null)
    setBreathPhase(null)
    const r = reduceIntention(phrase)
    setReduced(r)
    setInstruction(buildConceptualInstruction(r.keptLetters))
    setStatus('reducing')

    const t = window.setTimeout(() => {
      setGlyph(buildSigilGlyph(r.keptLetters))
      setStatus('drawing')
      const t2 = window.setTimeout(() => setStatus('done'), 1500)
      timersRef.current.push(t2)
    }, 900)
    timersRef.current.push(t)
  }

  const guardar = () => {
    if (!reduced) return
    saveSigilToGallery({ intention: reduced.original, keptLetters: reduced.keptLetters })
    setGallery(loadSigilGallery())
    setSaved(true)
  }

  const borrar = (id: string) => setGallery(deleteSigilFromGallery(id))

  const cargar = () => {
    setStatus('charging')
    let delay = 0
    for (let cycle = 0; cycle < BREATH_REPEATS; cycle++) {
      for (const step of BREATH_CYCLE) {
        const t = window.setTimeout(() => setBreathPhase({ phase: step.phase, cycle: cycle + 1 }), delay)
        timersRef.current.push(t)
        delay += step.ms
      }
    }
    const tEnd = window.setTimeout(() => {
      setBreathPhase(null)
      setStatus('charged')
    }, delay)
    timersRef.current.push(tEnd)
  }

  const busy = status === 'reducing' || status === 'drawing' || status === 'charging'

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/experimental" className="press tap-ext" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A EXPERIMENTAL
        </Link>

        <div style={{ fontSize: 9, color: `${GREEN}66`, letterSpacing: 6, marginBottom: 16 }}>
          NPX-XP-SIGILO // REDUCCIÓN DETERMINÍSTICA DE INTENCIÓN
        </div>
        <h1 style={{
          fontSize: 34, fontWeight: 700, letterSpacing: 6, color: GREEN,
          textShadow: `0 0 30px ${GREEN}44`, marginBottom: 16, lineHeight: 1,
        }}>
          SIGILO
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 600, marginBottom: 12 }}>
          Un procedimiento real y documentado, no una animación decorativa: tu intención se normaliza,
          se le quitan las letras repetidas quedándote con la primera aparición de cada una, y ese set
          se funde en un único trazo sobre una rueda fija de 26 posiciones (A–Z). Mismo texto, siempre
          el mismo sigilo — es reproducible a propósito, no al azar. Después de trazarlo hay un paso más:
          un ritual de carga cronometrado (respiración guiada, ~45 segundos) que cierra el procedimiento
          tal como lo describió Austin Osman Spare — ver{' '}
          <Link href="/arcano/grimorios" style={{ color: GOLD, textDecoration: 'none' }}>
            de dónde sale este método
          </Link>{' '}
          en Codex Arcanum.
        </p>

        <textarea
          value={intention}
          onChange={e => setIntention(e.target.value)}
          disabled={busy}
          placeholder={SUGGESTED[0]}
          rows={2}
          style={{
            width: '100%', background: '#020c08', border: `1px solid ${GREEN}33`, color: '#c8daf0',
            fontFamily: mono, fontSize: 12, padding: '14px 16px', outline: 'none', letterSpacing: 0.5,
            resize: 'vertical', marginBottom: 10, opacity: busy ? 0.6 : 1, textTransform: 'uppercase',
          }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
          {SUGGESTED.map(q => (
            <button key={q} onClick={() => setIntention(q)} disabled={busy} className="press" style={{
              fontFamily: mono, fontSize: 8, letterSpacing: 0.5, padding: '6px 10px', cursor: busy ? 'default' : 'pointer',
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${GREEN}33`, color: '#8fb8d6',
              opacity: busy ? 0.5 : 1,
            }}>
              {q}
            </button>
          ))}
        </div>

        <button onClick={forjar} disabled={busy} className="press" style={{
          fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '12px 28px', cursor: busy ? 'default' : 'pointer',
          background: `${GREEN}18`, border: `1px solid ${GREEN}66`, color: GREEN,
          opacity: busy ? 0.5 : 1, marginBottom: 40,
        }}>
          {status === 'reducing' ? 'REDUCIENDO...' : status === 'drawing' ? 'TRAZANDO...' : '▶ FORJAR SIGILO'}
        </button>

        {reduced && (
          <div className="fade-in" style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 2, marginBottom: 10 }}>
              PASO 1 — INTENCIÓN NORMALIZADA
            </div>
            <div style={{ fontSize: 16, letterSpacing: 2, lineHeight: 2, marginBottom: 20, wordBreak: 'break-all' }}>
              {reduced.normalizedLetters.map((ch, i) => (
                <span key={i} style={{
                  color: reduced.keptMask[i] ? GREEN : '#2a3a50',
                  textDecoration: reduced.keptMask[i] ? 'none' : 'line-through',
                  opacity: reduced.keptMask[i] ? 1 : 0.5,
                }}>
                  {ch}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 2, marginBottom: 10 }}>
              PASO 2 — SET RESULTANTE ({reduced.keptLetters.length} LETRAS)
            </div>
            <div style={{ fontSize: 16, letterSpacing: 3, color: GREEN, marginBottom: 20 }}>
              {reduced.keptLetters.join(' · ')}
            </div>
          </div>
        )}

        {glyph && (
          <div className="fade-in" style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 2, marginBottom: 14 }}>
              PASO 3 — GLIFO
            </div>
            <div
              className={status === 'charging' ? 'sigil-charging-pulse' : status === 'charged' ? 'sigil-fracture' : undefined}
              style={{
                display: 'flex', justifyContent: 'center',
                border: `1px solid ${status === 'charging' || status === 'charged' ? GOLD : GREEN}33`,
                background: 'rgba(0,10,6,0.5)', padding: 20, marginBottom: 16,
              }}
            >
              <SigilSVG glyph={glyph} size={260} animate={status === 'drawing' || status === 'done'} />
            </div>

            {status === 'done' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <button onClick={guardar} disabled={saved} className="press" style={{
                  fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '9px 16px',
                  cursor: saved ? 'default' : 'pointer', background: saved ? `${GREEN}18` : 'transparent',
                  border: `1px solid ${GREEN}66`, color: GREEN, opacity: saved ? 0.7 : 1,
                }}>
                  {saved ? '◉ GUARDADO' : '✦ GUARDAR EN GALERÍA'}
                </button>
                <button onClick={cargar} className="press" style={{
                  fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '9px 16px', cursor: 'pointer',
                  background: 'transparent', border: `1px solid ${GOLD}66`, color: GOLD,
                }}>
                  ◈ CARGAR (RITUAL, ~45S)
                </button>
              </div>
            )}

            {status === 'charging' && breathPhase && (
              <div className="fade-in" style={{ textAlign: 'center', padding: '28px 0' }}>
                <div style={{ fontSize: 9, color: `${GOLD}99`, letterSpacing: 3, marginBottom: 10 }}>
                  CICLO {breathPhase.cycle} / {BREATH_REPEATS}
                </div>
                <div style={{
                  fontSize: 26, letterSpacing: 6, color: GOLD, textShadow: `0 0 24px ${GOLD}55`,
                }}>
                  {breathPhase.phase}
                </div>
              </div>
            )}

            {status === 'charged' && (
              <div className="fade-in" style={{ marginTop: 20 }}>
                <div style={{
                  fontSize: 10, lineHeight: 1.9, color: `${GOLD}cc`, letterSpacing: 0.3,
                  border: `1px solid ${GOLD}33`, background: `${GOLD}0a`, padding: '16px 18px', marginBottom: 14, maxWidth: 560,
                }}>
                  <strong style={{ color: GOLD }}>Lo que acaba de pasar, en términos reales:</strong> ningún
                  mecanismo sobrenatural — tres ciclos de respiración sostenida angostan la atención sobre
                  un solo objeto (el glifo) el tiempo suficiente para producir una absorción leve, y la
                  estructura del ritual (inicio marcado, cierre marcado) es, por sí sola, lo que mide la
                  literatura sobre ritual y ansiedad: no hace falta creer en el sigilo para que el
                  procedimiento tenga un efecto real sobre quien lo hace. El método histórico de Spare pide,
                  después de esto, soltar conscientemente el significado literal — por eso el botón dice
                  "olvidar", no "repetir".
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <button onClick={guardar} disabled={saved} className="press" style={{
                    fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '9px 16px',
                    cursor: saved ? 'default' : 'pointer', background: saved ? `${GREEN}18` : 'transparent',
                    border: `1px solid ${GREEN}66`, color: GREEN, opacity: saved ? 0.7 : 1,
                  }}>
                    {saved ? '◉ GUARDADO' : '✦ GUARDAR EN GALERÍA'}
                  </button>
                  <button onClick={() => { setStatus('idle'); setGlyph(null); setReduced(null); setInstruction(null); setIntention('') }} className="press" style={{
                    fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '9px 16px', cursor: 'pointer',
                    background: 'transparent', border: `1px solid ${GOLD}66`, color: GOLD,
                  }}>
                    ✧ OLVIDAR Y EMPEZAR OTRO
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {instruction && (status === 'done' || status === 'charging' || status === 'charged') && (
          <div className="fade-in" style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 2, marginBottom: 10 }}>
              PASO 4 — INSTRUCCIÓN CONCEPTUAL
            </div>
            <p style={{ fontSize: 10, color: '#8fb8d6', lineHeight: 1.8, marginBottom: 16, maxWidth: 560 }}>
              Las mismas {reduced?.keptLetters.length ?? 0} letras del set, leídas distinto: no un glifo,
              una receta de texto (al estilo Sol LeWitt) — lo que sigue se dibuja exactamente como dice,
              nada librado al criterio de quien lo ejecuta.
            </p>
            <div style={{
              fontFamily: mono, fontSize: 12, letterSpacing: 1, color: VIOLET, lineHeight: 1.9,
              border: `1px solid ${VIOLET}44`, background: `${VIOLET}0a`, padding: '14px 18px', marginBottom: 16,
            }}>
              {instruction.text}
            </div>
            <div style={{
              display: 'flex', justifyContent: 'center', border: `1px solid ${VIOLET}33`,
              background: 'rgba(10,2,20,0.5)', padding: 20,
            }}>
              <svg viewBox="0 0 200 200" width={220} height={220}>
                <g transform={`rotate(${instruction.angleDeg} 100 100)`}>
                  {Array.from({ length: instruction.lines }, (_, i) => {
                    const offset = (i - (instruction.lines - 1) / 2) * instruction.spacing
                    return (
                      <line
                        key={i}
                        x1={10} y1={100 + offset} x2={190} y2={100 + offset}
                        stroke={VIOLET} strokeWidth={1.2} opacity={0.85}
                      />
                    )
                  })}
                </g>
              </svg>
            </div>
          </div>
        )}

        {gallery.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', marginBottom: 16 }}>
              GALERÍA LOCAL ({gallery.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
              {gallery.map(s => {
                const g = buildSigilGlyph(s.keptLetters)
                return (
                  <div key={s.id} className="artifact-card" style={{ padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                      <SigilSVG glyph={g} size={100} />
                    </div>
                    <div style={{ fontSize: 8, color: '#8fb8d6', letterSpacing: 0.5, marginBottom: 6, wordBreak: 'break-word' }}>
                      {s.intention}
                    </div>
                    <button onClick={() => borrar(s.id)} className="press" style={{
                      fontFamily: mono, fontSize: 7, letterSpacing: 1, padding: '4px 8px', cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(255,45,85,0.4)', color: '#ff2d55',
                    }}>
                      BORRAR
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
