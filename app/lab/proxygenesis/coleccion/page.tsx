'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { loadCuratedSpecimens, type CuratedSpecimen, type CuratedMode } from '../engine/curated'

const SpecimenViewer = dynamic(() => import('@/components/proxygenesis/SpecimenViewer'), { ssr: false })

const mono = "'Space Mono', monospace"
const MODE_COLOR: Record<CuratedMode, string> = { coral: '#ff5e9e', arbol: '#00ff9d', concha: '#ffb800' }
const MODE_LABEL: Record<CuratedMode, string> = { coral: 'CORAL', arbol: 'ÁRBOL', concha: 'CONCHA' }

export default function ProxygenesisColeccionPage() {
  const [specimens, setSpecimens] = useState<CuratedSpecimen[] | null>(null)
  const [open, setOpen] = useState<CuratedSpecimen | null>(null)

  useEffect(() => {
    loadCuratedSpecimens().then(setSpecimens)
  }, [])

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 40, background: 'rgba(5,10,20,0.85)',
        borderBottom: '1px solid #00ff9d44', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', zIndex: 100, backdropFilter: 'blur(5px)',
      }}>
        <span style={{ fontSize: 11, letterSpacing: 2, color: '#00ff9d' }}>NEOPROXY // R&D // PROXYGENESIS.v1</span>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href="/lab/proxygenesis/galeria" style={{ color: '#4a6080', textDecoration: 'none', fontSize: 10, border: '1px solid #4a608044', padding: '2px 8px' }}>
            GALERÍA LOCAL
          </Link>
          <Link href="/lab/proxygenesis" style={{ color: '#00ff9d', textDecoration: 'none', fontSize: 10, border: '1px solid #00ff9d44', padding: '2px 8px' }}>
            ← VOLVER AL GENERADOR
          </Link>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '72px 24px 80px' }}>
        <div style={{ fontSize: 9, color: '#00ff9d66', letterSpacing: 6, marginBottom: 16 }}>
          // PROXYGENESIS — COLECCIÓN CURADA
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 700, letterSpacing: 6, color: '#00ff9d',
          textShadow: '0 0 40px #00ff9d44', marginBottom: 16, lineHeight: 1,
        }}>
          COLECCIÓN
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 620, marginBottom: 48 }}>
          Especímenes reales, crecidos fuera del navegador — corridas largas del mismo motor de Space
          Colonization, en una máquina dedicada, a veces horas de cómputo. A diferencia de la{' '}
          <Link href="/lab/proxygenesis/galeria" style={{ color: '#00ff9d' }}>galería local</Link> (vive en
          tu navegador, se regenera al instante desde su semilla), acá el STL final queda guardado tal cual
          creció.
        </p>

        {specimens === null && (
          <div style={{ fontSize: 10, color: '#3a4a60', letterSpacing: 1 }}>CARGANDO...</div>
        )}

        {specimens !== null && specimens.length === 0 && (
          <div style={{ fontSize: 10, color: '#3a4a60', letterSpacing: 1, lineHeight: 2 }}>
            TODAVÍA SIN ESPECÍMENES CURADOS. Esta sección se llena a mano, con corridas locales reales
            revisadas antes de subirlas.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          {specimens?.map(s => {
            const color = MODE_COLOR[s.mode]
            return (
              <button key={s.id} onClick={() => setOpen(s)} className="artifact-card" style={{
                overflow: 'hidden', textAlign: 'left', cursor: 'pointer', background: `${color}08`,
                border: `1px solid ${color}33`, padding: 0, fontFamily: mono,
              }}>
                <div style={{ height: 130, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${color}33` }}>
                  <span style={{ fontSize: 9, color: `${color}aa`, letterSpacing: 2 }}>[+] VER EN 3D</span>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, letterSpacing: 2, color }}>{MODE_LABEL[s.mode]}</span>
                    <span style={{ fontSize: 8, color: '#4a6080' }}>{new Date(s.createdAt).toLocaleDateString('es-AR')}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#c8daf0', marginBottom: 10 }}>{s.title}</div>
                  <div style={{ fontSize: 9, color: '#4a6080' }}>
                    NODOS: {s.stats.nodeCount.toLocaleString()} // {s.stats.iterationsPerSecond} iter/s // {s.stats.elapsedSeconds}s
                  </div>
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
            width: '100%', maxWidth: 1000, maxHeight: '88vh', display: 'grid',
            gridTemplateColumns: '1.4fr 1fr', border: `1px solid ${MODE_COLOR[open.mode]}44`, background: '#000205',
          }}>
            <div style={{ height: '70vh', position: 'relative' }}>
              <SpecimenViewer stlPath={open.stlPath} color={MODE_COLOR[open.mode]} />
            </div>
            <div style={{ padding: 24, overflowY: 'auto', height: '70vh' }}>
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

              {open.note && (
                <p style={{ fontSize: 10, color: '#8fb8d6', lineHeight: 1.8, marginBottom: 20 }}>{open.note}</p>
              )}

              <div style={{ fontSize: 10, letterSpacing: 2, color: '#4a6080', marginBottom: 8, borderBottom: '1px solid #4a608033', paddingBottom: 4 }}>
                DATOS DE LA CORRIDA
              </div>
              {[
                ['Semilla', open.stats.seed],
                ['Nodos', open.stats.nodeCount.toLocaleString()],
                ['Iteraciones', `${open.stats.iteration.toLocaleString()} / ${open.stats.maxIterations.toLocaleString()}`],
                ['Tiempo', `${open.stats.elapsedSeconds}s`],
                ['Velocidad', `${open.stats.iterationsPerSecond} iter/s`],
              ].map(([label, value]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#4a6080' }}>{label}</span>
                  <span style={{ color: '#c8daf0' }}>{value}</span>
                </div>
              ))}

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
                display: 'block', textAlign: 'center', marginTop: 24, fontSize: 10, letterSpacing: 1, padding: '10px 0',
                background: `${MODE_COLOR[open.mode]}15`, border: `1px solid ${MODE_COLOR[open.mode]}66`, color: MODE_COLOR[open.mode],
                textDecoration: 'none',
              }}>
                DESCARGAR STL
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
