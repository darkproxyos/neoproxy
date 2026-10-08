'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import HemibrainScene, { type HemibrainSceneHandle, type HemiNeuron, type HemiEdge } from '@/components/hemibrain/HemibrainScene'
import { NT_COLORS, NT_LABELS, ntColor } from '@/components/hemibrain/neurotransmitters'

const mono = "'Space Mono', monospace"
const ACCENT = '#ffb800'

type Meta = {
  source: string
  circuit: string
  totalHemibrainNeurons: number
  totalMushroomBodyNeurons: number
  includedNeurons: number
  includedNonKenyon: number
  includedKenyonSample: number
  totalKenyonCellsInHemibrain: number
  edgesShown: number
  edgeThresholdSynapses: number
  note: string
}

const NT_ORDER = ['dopamine', 'acetylcholine', 'gaba', 'glutamate', 'serotonin', 'octopamine', 'neither', 'unknown']

function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false)
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])
  return isTouch
}

export default function HemibrainPage() {
  const sceneRef = useRef<HemibrainSceneHandle>(null)
  const isTouch = useIsTouchDevice()

  const [neurons, setNeurons] = useState<HemiNeuron[]>([])
  const [edges, setEdges] = useState<HemiEdge[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [visibleNt, setVisibleNt] = useState<Set<string>>(new Set(NT_ORDER))
  const [showKenyon, setShowKenyon] = useState(false)
  const [showEdges, setShowEdges] = useState(false)
  const [selected, setSelected] = useState<HemiNeuron | null>(null)
  const [settingsReady, setSettingsReady] = useState(false)

  useEffect(() => {
    // Mobile arranca más liviano: sin muestra de Kenyon cells ni sinapsis —
    // el usuario las prende si quiere, en vez de cargar 670 líneas + 7000 edges de una.
    setShowKenyon(!isTouch)
    setShowEdges(!isTouch)
    setSettingsReady(true)
  }, [isTouch])

  useEffect(() => {
    Promise.all([
      fetch('/data/hemibrain/neurons.json').then(r => r.json()),
      fetch('/data/hemibrain/edges.json').then(r => r.json()),
      fetch('/data/hemibrain/meta.json').then(r => r.json()),
    ])
      .then(([n, e, m]) => {
        setNeurons(n)
        setEdges(e)
        setMeta(m)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const toggleNt = (nt: string) => {
    setVisibleNt(prev => {
      const next = new Set(prev)
      if (next.has(nt)) next.delete(nt)
      else next.add(nt)
      return next
    })
  }

  const handleSelect = (neuron: HemiNeuron | null) => {
    setSelected(neuron)
    if (neuron) sceneRef.current?.focusOn(neuron.id)
    else sceneRef.current?.resetView()
  }

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/lab" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 20,
        }}>
          ← VOLVER A EXPERIMENTAL
        </Link>

        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}44`, marginBottom: 16 }}>
          // CONECTOMA REAL — HEMIBRAIN v1.2.1
        </div>
        <h1 style={{
          fontFamily: mono, fontSize: 32, letterSpacing: 8, color: ACCENT,
          textShadow: `0 0 30px ${ACCENT}44`, marginBottom: 20,
        }}>
          HEMIBRAIN
        </h1>
        <p style={{
          fontFamily: mono, fontSize: 12, lineHeight: 2, letterSpacing: 0.5, color: '#8fb8d6',
          maxWidth: 760, marginBottom: 40, borderLeft: `1px solid ${ACCENT}33`, paddingLeft: 24,
        }}>
          Esto no es una simulación ni arte generativo — es morfología real: neuronas reconstruidas
          por microscopía electrónica del cerebro de <em>Drosophila melanogaster</em>, del circuito
          de cuerpos fungiformes (<em>mushroom body</em>), el centro de aprendizaje y memoria del
          insecto. Cada línea es el esqueleto 3D de una neurona real, coloreado por su
          neurotransmisor predicho. Las aristas finas son sinapsis reales entre esas neuronas.
        </p>

        {loading && (
          <div style={{ fontFamily: mono, fontSize: 11, color: '#4a6080', letterSpacing: 2, padding: '60px 0' }}>
            CARGANDO CONECTOMA... (~1.8 MB)
          </div>
        )}

        {error && (
          <div style={{ fontFamily: mono, fontSize: 11, color: '#ff2d55', letterSpacing: 2, padding: '60px 0' }}>
            NO SE PUDO CARGAR EL CONECTOMA. Reintentá recargando la página.
          </div>
        )}

        {!loading && !error && settingsReady && (
          <div className="hb-layout" style={{ display: 'flex', gap: 24 }}>
            <div style={{
              flex: '1 1 auto', minWidth: 0, height: '70vh', minHeight: 480,
              border: `1px solid ${ACCENT}22`, background: 'rgba(0,4,10,0.4)',
              position: 'relative', overflow: 'hidden',
            }}>
              <HemibrainScene
                ref={sceneRef}
                neurons={neurons}
                edges={edges}
                visibleNt={visibleNt}
                showKenyon={showKenyon}
                showEdges={showEdges}
                onSelect={handleSelect}
              />
              <div style={{
                position: 'absolute', bottom: 12, left: 12, fontFamily: mono, fontSize: 8,
                letterSpacing: 2, color: `${ACCENT}55`, pointerEvents: 'none',
              }}>
                ARRASTRAR: ORBITAR // SCROLL: ZOOM // CLICK: ENFOCAR NEURONA
              </div>
            </div>

            <div className="hb-sidebar" style={{ flex: '0 0 340px', minWidth: 0 }}>
              {/* Detail panel */}
              <div style={{
                border: `1px solid ${ACCENT}22`, background: 'rgba(0,4,10,0.6)',
                padding: 20, minHeight: 160, marginBottom: 20,
              }}>
                {selected ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: ntColor(selected.nt) }}>
                        {NT_LABELS[selected.nt] ?? selected.nt.toUpperCase()}
                      </div>
                      <button
                        onClick={() => handleSelect(null)}
                        aria-label="Cerrar"
                        style={{
                          background: 'none', border: `1px solid ${ACCENT}44`, color: ACCENT,
                          width: 28, height: 28, cursor: 'pointer', fontFamily: mono, fontSize: 12, flexShrink: 0,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 15, color: '#fff', letterSpacing: 1, marginBottom: 6, wordBreak: 'break-word' }}>
                      {selected.instance}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 10, color: '#8fb8d6', letterSpacing: 1, marginBottom: 4 }}>
                      TIPO: {selected.cellType}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 10, color: '#4a6080', letterSpacing: 1, marginBottom: 4 }}>
                      CLASE: {selected.cellClass.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 10, color: '#4a6080', letterSpacing: 1, marginBottom: 4 }}>
                      FLUJO: {selected.flow}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 9, color: '#2a3a52', letterSpacing: 1, marginTop: 12 }}>
                      body ID: {selected.id}
                    </div>
                  </>
                ) : (
                  <div style={{ fontFamily: mono, fontSize: 11, color: '#4a6080', letterSpacing: 1, lineHeight: 1.8 }}>
                    TOCÁ UNA NEURONA EN LA ESCENA PARA VER SU IDENTIDAD REAL (TIPO CELULAR, NEUROTRANSMISOR, ID DE CUERPO CELULAR).
                  </div>
                )}
              </div>

              {/* Controls */}
              <div style={{ border: `1px solid ${ACCENT}22`, background: 'rgba(0,4,10,0.6)', padding: 20, marginBottom: 20 }}>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: ACCENT, marginBottom: 14 }}>
                  NEUROTRANSMISOR // FILTRO
                </div>
                {NT_ORDER.map(nt => (
                  <label key={nt} style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                    fontFamily: mono, fontSize: 10, letterSpacing: 1, cursor: 'pointer',
                    color: visibleNt.has(nt) ? '#c8daf0' : '#4a6080',
                  }}>
                    <input
                      type="checkbox"
                      checked={visibleNt.has(nt)}
                      onChange={() => toggleNt(nt)}
                      style={{ accentColor: NT_COLORS[nt] }}
                    />
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', background: NT_COLORS[nt],
                      boxShadow: `0 0 6px ${NT_COLORS[nt]}`, display: 'inline-block', flexShrink: 0,
                    }} />
                    {NT_LABELS[nt]}
                  </label>
                ))}

                <div style={{ borderTop: `1px solid ${ACCENT}22`, marginTop: 14, paddingTop: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontFamily: mono, fontSize: 10, letterSpacing: 1, cursor: 'pointer' }}>
                    <input type="checkbox" checked={showKenyon} onChange={() => setShowKenyon(v => !v)} />
                    MOSTRAR MUESTRA DE KENYON CELLS
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: mono, fontSize: 10, letterSpacing: 1, cursor: 'pointer' }}>
                    <input type="checkbox" checked={showEdges} onChange={() => setShowEdges(v => !v)} />
                    MOSTRAR SINAPSIS ({meta?.edgesShown.toLocaleString('es')} conexiones)
                  </label>
                </div>
              </div>

              {/* Meta / honesty panel */}
              {meta && (
                <div style={{ border: `1px solid ${ACCENT}22`, background: 'rgba(0,4,10,0.6)', padding: 20 }}>
                  <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: ACCENT, marginBottom: 12 }}>
                    QUÉ ESTÁS VIENDO
                  </div>
                  <p style={{ fontFamily: mono, fontSize: 10, color: '#8fb8d6', lineHeight: 1.9, marginBottom: 10 }}>
                    {meta.includedNeurons} neuronas reales de las {meta.totalMushroomBodyNeurons.toLocaleString('es')} del
                    circuito completo de cuerpos fungiformes ({meta.includedNonKenyon} no-Kenyon al 100% +
                    muestra del {Math.round(meta.includedKenyonSample / meta.totalKenyonCellsInHemibrain * 100)}% de
                    las {meta.totalKenyonCellsInHemibrain.toLocaleString('es')} Kenyon cells) — del total de{' '}
                    {meta.totalHemibrainNeurons.toLocaleString('es')} neuronas del hemisferio reconstruido.
                  </p>
                  <p style={{ fontFamily: mono, fontSize: 9, color: '#4a6080', lineHeight: 1.8 }}>
                    {meta.note}
                  </p>
                  <div style={{ fontFamily: mono, fontSize: 8, color: '#2a3a52', letterSpacing: 0.5, marginTop: 12, lineHeight: 1.7 }}>
                    {meta.source}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .hb-layout { flex-direction: column !important; }
          .hb-sidebar { flex: 1 1 auto !important; }
        }
      `}</style>
    </div>
  )
}
