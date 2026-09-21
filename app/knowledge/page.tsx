'use client'

import { useRef, useState } from 'react'
import KnowledgeScene, { type KnowledgeSceneHandle } from '@/components/knowledge/KnowledgeScene'
import { entries, clusters, type Cluster } from '@/components/knowledge/entries'

const mono = "'Space Mono', monospace"

const CLUSTER_ORDER: Cluster[] = ['informacion', 'mente', 'autoorganizacion', 'sistemas']

function FormulaTag({ kind }: { kind: 'equation' | 'quote' | 'concept' }) {
  const labels = { equation: 'ECUACIÓN', quote: 'CITA TEXTUAL', concept: 'NOTACIÓN CONCEPTUAL' }
  const dim = { equation: '#00ffcc', quote: '#b06bff', concept: '#4a6080' }
  return (
    <span style={{
      fontFamily: mono, fontSize: 8, letterSpacing: 2, color: dim[kind],
      border: `1px solid ${dim[kind]}55`, padding: '2px 6px', display: 'inline-block',
    }}>
      {labels[kind]}
    </span>
  )
}

export default function KnowledgePage() {
  const sceneRef = useRef<KnowledgeSceneHandle>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = entries.find(e => e.id === selectedId) || null

  const handleSelect = (id: string | null) => {
    setSelectedId(id)
    if (id) sceneRef.current?.focusOn(id)
    else sceneRef.current?.resetView()
  }

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '104px 24px 80px' }}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: '#00d4ff44', marginBottom: 20 }}>
          NPX-KNW-00 // ARQUITECTURA INVISIBLE
        </div>

        <h1 style={{
          fontFamily: mono, fontSize: 32, letterSpacing: 10, color: '#00d4ff', marginBottom: 28,
          textShadow: '0 0 30px rgba(0,212,255,0.35)',
        }}>
          CONOCIMIENTO
        </h1>

        <p style={{
          fontFamily: mono, fontSize: 12, lineHeight: 2, letterSpacing: 0.5, color: '#8fb8d6',
          maxWidth: 760, marginBottom: 48, borderLeft: '1px solid #00d4ff22', paddingLeft: 24,
        }}>
          Antes de la interfaz hay una pregunta que ninguna interfaz responde: qué es una señal,
          qué es un límite, qué es un yo. Esta es la red de quienes se atrevieron a medirlo — no
          a resolver el misterio, sino a ponerle una ecuación encima. Cada nodo es una pieza de la
          arquitectura invisible que sostiene la Wired: información, mente, auto-organización,
          sistemas que se producen a sí mismos sin pedir permiso. Tocá un nodo. La red no explica —
          señala.
        </p>

        <div className="knw-layout" style={{ display: 'flex', gap: 24 }}>
          <div style={{
            flex: '1 1 auto', minWidth: 0, height: '70vh', minHeight: 480,
            border: '1px solid rgba(0, 212, 255, 0.15)', background: 'rgba(0,4,10,0.4)',
            position: 'relative', overflow: 'hidden',
          }}>
            <KnowledgeScene ref={sceneRef} onSelect={handleSelect} />
            <div style={{
              position: 'absolute', bottom: 12, left: 12, fontFamily: mono, fontSize: 8,
              letterSpacing: 2, color: '#00d4ff55', pointerEvents: 'none',
            }}>
              ARRASTRAR: ORBITAR // SCROLL: ZOOM // CLICK: ENFOCAR NODO
            </div>
          </div>

          <div className="knw-sidebar" style={{ flex: '0 0 340px', minWidth: 0 }}>
            {/* Detail panel */}
            <div style={{
              border: '1px solid rgba(0, 212, 255, 0.15)', background: 'rgba(0,4,10,0.6)',
              padding: 20, minHeight: 220, marginBottom: 20,
            }}>
              {selected ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{
                      fontFamily: mono, fontSize: 9, letterSpacing: 2,
                      color: clusters[selected.cluster].color,
                    }}>
                      {clusters[selected.cluster].label}
                    </div>
                    <button
                      onClick={() => handleSelect(null)}
                      aria-label="Cerrar"
                      style={{
                        background: 'none', border: '1px solid #00d4ff44', color: '#00d4ff',
                        width: 28, height: 28, cursor: 'pointer', fontFamily: mono, fontSize: 12, flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 16, color: '#fff', letterSpacing: 1, marginBottom: 4 }}>
                    {selected.name}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: '#4a6080', letterSpacing: 1, marginBottom: 4 }}>
                    {selected.years}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: '#8fb8d6', letterSpacing: 1, marginBottom: 16 }}>
                    {selected.role}
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <FormulaTag kind={selected.formulaKind} />
                  </div>
                  <div style={{
                    fontFamily: mono, fontSize: 13, color: '#00ffcc', letterSpacing: 0.5, lineHeight: 1.6,
                    marginBottom: 16, wordBreak: 'break-word',
                  }}>
                    {selected.formula}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 9, color: '#4a6080', letterSpacing: 1, marginBottom: 16 }}>
                    {selected.formulaLabel}
                  </div>

                  <p style={{ fontFamily: mono, fontSize: 11, lineHeight: 1.9, color: '#c8daf0' }}>
                    {selected.summary}
                  </p>
                </>
              ) : (
                <div style={{ fontFamily: mono, fontSize: 11, color: '#4a6080', letterSpacing: 1, lineHeight: 1.8 }}>
                  SELECCIONÁ UN NODO EN LA RED, O UN NOMBRE DE LA LISTA, PARA VER SU ECUACIÓN Y SU LUGAR EN EL SISTEMA.
                </div>
              )}
            </div>

            {/* Legend + list */}
            {CLUSTER_ORDER.map(cluster => (
              <div key={cluster} style={{ marginBottom: 20 }}>
                <div style={{
                  fontFamily: mono, fontSize: 9, letterSpacing: 2, color: clusters[cluster].color,
                  marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', background: clusters[cluster].color,
                    boxShadow: `0 0 8px ${clusters[cluster].color}`, display: 'inline-block',
                  }} />
                  {clusters[cluster].label}
                </div>
                {entries.filter(e => e.cluster === cluster).map(e => (
                  <button
                    key={e.id}
                    onClick={() => handleSelect(e.id)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', background: selectedId === e.id ? `${clusters[cluster].color}18` : 'transparent',
                      border: 'none', borderLeft: selectedId === e.id ? `2px solid ${clusters[cluster].color}` : '2px solid transparent',
                      color: selectedId === e.id ? clusters[cluster].color : '#8fb8d6', cursor: 'pointer',
                      fontFamily: mono, fontSize: 11, letterSpacing: 0.5, padding: '10px 12px', minHeight: 40,
                    }}
                  >
                    {e.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .knw-layout { flex-direction: column !important; }
          .knw-sidebar { flex: 1 1 auto !important; }
        }
      `}</style>
    </div>
  )
}
