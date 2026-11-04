'use client'
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { loadCuratedSpecimens, THINKERS, type CuratedSpecimen, type CuratedMode } from '@/components/proxygenesis/curated'
import { clusters } from '@/components/knowledge/entries'

const SpecimenViewer = dynamic(() => import('@/components/proxygenesis/SpecimenViewer'), { ssr: false })

const mono = "'Space Mono', monospace"
const MODE_COLOR: Record<CuratedMode, string> = { coral: '#ff5e9e', arbol: '#00ff9d', concha: '#ffb800' }
const MODE_LABEL: Record<CuratedMode, string> = { coral: 'CORAL', arbol: 'ÁRBOL', concha: 'CONCHA' }

const AUTOORG = clusters.autoorganizacion.color

const Corner = ({ pos, color }: { pos: 'tl' | 'tr' | 'bl' | 'br'; color: string }) => {
  const size = 14
  const style: React.CSSProperties = {
    position: 'absolute', width: size, height: size, borderColor: color, pointerEvents: 'none', zIndex: 2,
    ...(pos === 'tl' && { top: 0, left: 0, borderTop: '2px solid', borderLeft: '2px solid' }),
    ...(pos === 'tr' && { top: 0, right: 0, borderTop: '2px solid', borderRight: '2px solid' }),
    ...(pos === 'bl' && { bottom: 0, left: 0, borderBottom: '2px solid', borderLeft: '2px solid' }),
    ...(pos === 'br' && { bottom: 0, right: 0, borderBottom: '2px solid', borderRight: '2px solid' }),
  }
  return <div style={style} />
}

export default function EspecimenesPage() {
  const [specimens, setSpecimens] = useState<CuratedSpecimen[] | null>(null)
  const [open, setOpen] = useState<CuratedSpecimen | null>(null)
  const [filter, setFilter] = useState<CuratedMode | 'all'>('all')

  useEffect(() => {
    loadCuratedSpecimens().then(setSpecimens)
  }, [])

  const counts = useMemo(() => {
    const c: Record<CuratedMode | 'all', number> = { all: specimens?.length ?? 0, arbol: 0, coral: 0, concha: 0 }
    specimens?.forEach(s => { c[s.mode]++ })
    return c
  }, [specimens])

  const totalNodes = useMemo(() => (specimens ?? []).reduce((acc, s) => acc + s.stats.nodeCount, 0), [specimens])
  const filtered = useMemo(() => specimens?.filter(s => filter === 'all' || s.mode === filter) ?? [], [specimens, filter])

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative', overflowX: 'hidden' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '104px 32px 100px' }}>
        <Link href="/fabrication" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A FABRICACIÓN
        </Link>

        <div style={{ fontSize: 9, color: `${AUTOORG}66`, letterSpacing: 6, marginBottom: 16 }}>
          // PROXYGENESIS — ORGANISMOS GENERADOS
        </div>
        <h1 style={{
          fontSize: 40, fontWeight: 700, letterSpacing: 6, color: AUTOORG,
          textShadow: `0 0 40px ${AUTOORG}44`, marginBottom: 16, lineHeight: 1,
        }}>
          ESPECÍMENES
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 680, marginBottom: 20 }}>
          Formas crecidas, no modeladas — árboles, corales y conchas generados con un algoritmo real de
          colonización espacial, cada uno corrido horas en una máquina dedicada hasta que terminó de
          crecer solo. Cada pieza acá es un STL real y persistido, con los datos exactos de su propia
          corrida: semilla, nodos, velocidad, parámetros.
        </p>
        <Link href="/lab/proxygenesis" style={{ fontSize: 10, color: AUTOORG, letterSpacing: 1 }}>
          → Generar los tuyos en el laboratorio
        </Link>

        <p style={{ fontSize: 10, color: `${AUTOORG}99`, letterSpacing: 0.5, lineHeight: 1.9, maxWidth: 680, marginTop: 20, fontStyle: 'italic' }}>
          Cada espécimen trae su propia lectura — qué pensador real conecta con el algoritmo y los
          parámetros de ESA corrida en particular, no un texto genérico pegado a todos. Abrí uno para verla.
        </p>

        {/* Stats bar + filtros */}
        <div style={{
          marginTop: 48, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center',
          justifyContent: 'space-between', borderTop: `1px solid ${AUTOORG}22`, borderBottom: `1px solid ${AUTOORG}22`,
          padding: '14px 0',
        }}>
          <div style={{ display: 'flex', gap: 24, fontSize: 9, letterSpacing: 1, color: '#4a6080' }}>
            <span><span style={{ color: AUTOORG }}>{counts.all}</span> ESPECÍMENES</span>
            <span><span style={{ color: AUTOORG }}>{totalNodes.toLocaleString()}</span> NODOS TOTALES</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['all', 'arbol', 'coral', 'concha'] as const).map(m => {
              const active = filter === m
              const c = m === 'all' ? AUTOORG : MODE_COLOR[m]
              const label = m === 'all' ? 'TODOS' : MODE_LABEL[m]
              return (
                <button key={m} onClick={() => setFilter(m)} style={{
                  fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '6px 12px', cursor: 'pointer',
                  background: active ? `${c}22` : 'transparent', border: `1px solid ${active ? c : '#1a2b3f'}`,
                  color: active ? c : '#4a6080',
                }}>
                  {label} ({counts[m]})
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {specimens === null && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ aspectRatio: '4 / 3', border: '1px solid #1a2b3f', background: 'linear-gradient(100deg, #0a1018 40%, #121b28 50%, #0a1018 60%)', backgroundSize: '200% 100%', animation: 'especimenes-shimmer 1.6s ease-in-out infinite' }} />
          ))}

          {specimens !== null && filtered.length === 0 && (
            <div style={{ fontSize: 10, color: '#3a4a60', letterSpacing: 1, lineHeight: 2, gridColumn: '1 / -1' }}>
              {specimens.length === 0
                ? 'TODAVÍA SIN ESPECÍMENES. Esta colección se llena a mano, con corridas locales reales revisadas antes de subirlas.'
                : 'SIN ESPECÍMENES EN ESTE MODO TODAVÍA.'}
            </div>
          )}

          {filtered.map(s => {
            const color = MODE_COLOR[s.mode]
            return (
              <button key={s.id} onClick={() => setOpen(s)} className="specimen-card" style={{
                overflow: 'hidden', textAlign: 'left', cursor: 'pointer', background: `${color}08`,
                border: `1px solid ${color}33`, padding: 0, fontFamily: mono, position: 'relative',
              }}>
                <div className="specimen-thumb" style={{ position: 'relative', aspectRatio: '4 / 3', background: `${color}10`, borderBottom: `1px solid ${color}33`, overflow: 'hidden' }}>
                  {s.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.thumbnail} alt={s.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 9, color: `${color}aa`, letterSpacing: 2 }}>[+] VER EN 3D</span>
                    </div>
                  )}
                  <div className="specimen-scanlines" style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'overlay',
                    background: `repeating-linear-gradient(to bottom, transparent 0px, transparent 1px, ${color}22 2px, transparent 3px)`,
                  }} />
                  <span className="specimen-tag" style={{
                    position: 'absolute', bottom: 8, right: 10, fontSize: 8, letterSpacing: 1, color,
                    background: 'rgba(0,4,10,0.75)', padding: '3px 7px', border: `1px solid ${color}44`,
                  }}>
                    VER EN 3D →
                  </span>
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, letterSpacing: 2, color }}>{MODE_LABEL[s.mode]}</span>
                    <span style={{ fontSize: 8, color: '#4a6080' }}>{new Date(s.createdAt).toLocaleDateString('es-AR')}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#fff', marginBottom: 10 }}>{s.title}</div>
                  <div style={{ fontSize: 9, color: '#4a6080', marginBottom: 10 }}>
                    NODOS: {s.stats.nodeCount.toLocaleString()} // {s.stats.iterationsPerSecond} iter/s // {s.stats.elapsedSeconds}s
                  </div>
                  {s.reading.thinkerIds.length > 0 && (
                    <div style={{ fontSize: 8, letterSpacing: 0.5, color: `${color}99`, fontStyle: 'italic' }}>
                      // lee: {s.reading.thinkerIds.map(id => THINKERS[id]?.name).filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {open && (
        <div
          onClick={() => setOpen(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(2,4,8,0.94)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px',
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{
            width: '100%', maxWidth: 1100, maxHeight: '88vh', display: 'grid',
            gridTemplateColumns: '1.4fr 1fr', border: `1px solid ${MODE_COLOR[open.mode]}44`, background: '#000205',
          }}>
            <div style={{ height: '72vh', position: 'relative' }}>
              <Corner pos="tl" color={MODE_COLOR[open.mode]} />
              <Corner pos="bl" color={MODE_COLOR[open.mode]} />
              <SpecimenViewer stlPath={open.stlPath} color={MODE_COLOR[open.mode]} />
            </div>
            <div style={{ padding: 24, overflowY: 'auto', height: '72vh', position: 'relative' }}>
              <Corner pos="tr" color={MODE_COLOR[open.mode]} />
              <Corner pos="br" color={MODE_COLOR[open.mode]} />
              <button onClick={() => setOpen(null)} style={{
                fontFamily: mono, fontSize: 9, letterSpacing: 1, color: '#4a6080', background: 'transparent',
                border: '1px solid #4a608044', padding: '4px 10px', cursor: 'pointer', marginBottom: 20,
              }}>
                ✕ CERRAR
              </button>
              <div style={{ fontSize: 11, letterSpacing: 2, color: MODE_COLOR[open.mode], marginBottom: 6 }}>
                {MODE_LABEL[open.mode]}
              </div>
              <div style={{ fontSize: 18, color: '#fff', marginBottom: 20 }}>{open.title}</div>

              <div style={{ fontSize: 9, letterSpacing: 3, color: `${MODE_COLOR[open.mode]}aa`, marginBottom: 12 }}>
                // LECTURA
              </div>
              {open.reading.prose.map((p, i) => (
                <p key={i} style={{ fontSize: 10, color: '#c8daf0', lineHeight: 1.9, marginBottom: 12 }}>{p}</p>
              ))}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                {open.reading.thinkerIds.map(id => {
                  const t = THINKERS[id]
                  if (!t) return null
                  return (
                    <Link key={id} href={`/knowledge?entry=${id}`} style={{
                      display: 'block', fontSize: 8, letterSpacing: 0.5, color: `${MODE_COLOR[open.mode]}dd`, textDecoration: 'none',
                      border: `1px solid ${MODE_COLOR[open.mode]}33`, padding: '6px 10px', lineHeight: 1.5,
                    }}>
                      <span style={{ color: MODE_COLOR[open.mode], letterSpacing: 1 }}>{t.name}</span>
                      <span style={{ color: '#4a6080' }}> · {t.years}</span>
                    </Link>
                  )
                })}
              </div>

              <div style={{ fontSize: 10, letterSpacing: 2, color: '#4a6080', marginBottom: 8, borderBottom: '1px solid #4a608033', paddingBottom: 4 }}>
                DATOS DE LA CORRIDA
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px', marginBottom: 8 }}>
                {[
                  ['Semilla', open.stats.seed],
                  ['Nodos', open.stats.nodeCount.toLocaleString()],
                  ['Iteraciones', `${open.stats.iteration.toLocaleString()} / ${open.stats.maxIterations.toLocaleString()}`],
                  ['Tiempo', `${open.stats.elapsedSeconds}s`],
                  ['Velocidad', `${open.stats.iterationsPerSecond} iter/s`],
                ].map(([label, value]) => (
                  <div key={label as string} style={{ fontSize: 10, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: '#4a6080', fontSize: 8, letterSpacing: 1 }}>{label.toString().toUpperCase()}</div>
                    <div style={{ color: '#c8daf0' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 10, letterSpacing: 2, color: '#4a6080', margin: '20px 0 8px', borderBottom: '1px solid #4a608033', paddingBottom: 4 }}>
                PARÁMETROS
              </div>
              {Object.entries(open.stats.params).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#4a6080' }}>{label}</span>
                  <span style={{ color: '#c8daf0' }}>{String(value)}</span>
                </div>
              ))}

              <a href={open.stlPath} download style={{
                display: 'block', textAlign: 'center', marginTop: 20, fontSize: 10, letterSpacing: 1, padding: '10px 0',
                background: `${MODE_COLOR[open.mode]}15`, border: `1px solid ${MODE_COLOR[open.mode]}66`, color: MODE_COLOR[open.mode],
                textDecoration: 'none',
              }}>
                DESCARGAR STL
              </a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes especimenes-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .specimen-card { transition: border-color 0.25s ease, transform 0.25s ease; }
        .specimen-card:hover { transform: translateY(-3px); }
        .specimen-thumb img { transition: transform 0.5s ease, filter 0.35s ease; filter: saturate(1.1) contrast(1.05); }
        .specimen-card:hover .specimen-thumb img { transform: scale(1.06); filter: saturate(1.3) contrast(1.12) brightness(1.05); }
        .specimen-tag { opacity: 0; transition: opacity 0.2s ease; }
        .specimen-card:hover .specimen-tag { opacity: 1; }
        @media (hover: none) {
          .specimen-tag { opacity: 0.85; }
        }
      `}</style>
    </div>
  )
}
