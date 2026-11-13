'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { entries, clusters, type Cluster, type KnowledgeEntry } from '@/components/knowledge/entries'
import { agents } from '@/components/proxyverse/agents'

const mono = "'Space Mono', monospace"

const CLUSTER_ORDER: Cluster[] = ['informacion', 'mente', 'autoorganizacion', 'sistemas', 'geometria', 'computacion']

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

function KnowledgeRow({ entry, color, isOpen, onToggle }: {
  entry: KnowledgeEntry; color: string; isOpen: boolean; onToggle: () => void
}) {
  const agent = entry.relatedAgent ? agents.find(a => a.id === entry.relatedAgent) : undefined

  return (
    <div id={`entry-${entry.id}`} style={{ borderBottom: '1px solid #ffffff0a' }}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
          width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
          padding: '16px 4px', fontFamily: mono,
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 14, letterSpacing: 0.5, color: isOpen ? color : '#c8daf0' }}>
            {entry.name}
          </span>
          <span style={{ fontSize: 9, color: '#4a6080', letterSpacing: 1 }}>
            {entry.years} — {entry.role}
          </span>
        </span>
        <span aria-hidden="true" style={{
          fontSize: 16, color: isOpen ? color : '#4a6080', flexShrink: 0,
          transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease',
        }}>
          +
        </span>
      </button>

      {isOpen && (
        <div className="knw-accordion-body" style={{
          borderLeft: `2px solid ${color}55`, marginLeft: 2, paddingLeft: 18, paddingBottom: 28,
        }}>
          <div style={{ marginBottom: 8 }}>
            <FormulaTag kind={entry.formulaKind} />
          </div>
          <div style={{
            fontFamily: mono, fontSize: 13, color: '#00ffcc', letterSpacing: 0.5, lineHeight: 1.6,
            marginBottom: 16, wordBreak: 'break-word',
          }}>
            {entry.formula}
          </div>
          <div style={{ fontFamily: mono, fontSize: 9, color: '#4a6080', letterSpacing: 1, marginBottom: 16 }}>
            {entry.formulaLabel}
          </div>

          <p style={{ fontFamily: mono, fontSize: 11, lineHeight: 1.9, color: '#c8daf0', marginBottom: 20, maxWidth: 640 }}>
            {entry.summary}
          </p>

          <div style={{ borderLeft: `2px solid ${color}33`, paddingLeft: 14 }}>
            <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: 2, color, marginBottom: 8 }}>
              EJEMPLO
            </div>
            <p style={{ fontFamily: mono, fontSize: 11, lineHeight: 1.8, color: '#9fc4e0', maxWidth: 640 }}>
              {entry.example}
            </p>
          </div>

          {agent && (
            <Link href={`/proxyverse/${agent.id}`} style={{
              display: 'block', marginTop: 20, paddingTop: 16, maxWidth: 640,
              borderTop: `1px solid ${agent.color}33`, textDecoration: 'none',
            }}>
              <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: 2, color: agent.color, marginBottom: 6 }}>
                ESTO YA VIVE EN PROXYVERSE
              </div>
              <div style={{ fontFamily: mono, fontSize: 11, color: '#c8daf0', letterSpacing: 0.5 }}>
                {agent.name} — {agent.role} →
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default function KnowledgePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const toggle = (id: string) => setSelectedId(prev => (prev === id ? null : id))

  // Deep-link desde un perfil de Proxyverse (/knowledge?entry=vonneumann):
  // abre esa entrada apenas carga la página y la lleva a la vista.
  useEffect(() => {
    const entryId = new URLSearchParams(window.location.search).get('entry')
    if (!entryId || !entries.some(e => e.id === entryId)) return
    setSelectedId(entryId)
    window.setTimeout(() => {
      document.getElementById(`entry-${entryId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 50)
  }, [])

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '104px 24px 80px' }}>
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
          qué es un límite, qué es un yo. Esta es la lista de quienes se atrevieron a medirlo — no
          a resolver el misterio, sino a ponerle una ecuación encima. Cada nombre es una pieza de la
          arquitectura invisible que sostiene la Wired: información, mente, auto-organización,
          sistemas que se producen a sí mismos sin pedir permiso, geometría — la estructura que
          sostiene todo lo anterior, desde un punto sin tamaño hasta formas de 4 dimensiones que
          ni siquiera se pueden ver enteras, solo proyectar — y computación: la pila completa,
          capa por capa, de un bit a un modelo de lenguaje escribiendo estas mismas palabras.
          Tocá un nombre de la lista.
        </p>

        <Link href="/knowledge/filosofia" style={{
          display: 'inline-block', marginTop: -28, marginBottom: 48, fontFamily: mono, fontSize: 9,
          letterSpacing: 2, color: '#b06bff', textDecoration: 'none', border: '1px solid #b06bff44',
          padding: '10px 18px', background: '#b06bff0a',
        }}>
          → FILOSOFÍA: UN SOLO RECORRIDO, SEIS NODOS, UN ARGUMENTO
        </Link>

        {CLUSTER_ORDER.map(cluster => (
          <div key={cluster} style={{ marginBottom: 36 }}>
            <div style={{
              fontFamily: mono, fontSize: 10, letterSpacing: 2, color: clusters[cluster].color,
              marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: clusters[cluster].color,
                boxShadow: `0 0 8px ${clusters[cluster].color}`, display: 'inline-block',
              }} />
              {clusters[cluster].label}
            </div>

            {entries.filter(e => e.cluster === cluster).map(entry => (
              <KnowledgeRow
                key={entry.id}
                entry={entry}
                color={clusters[cluster].color}
                isOpen={selectedId === entry.id}
                onToggle={() => toggle(entry.id)}
              />
            ))}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes knw-expand {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .knw-accordion-body {
          animation: knw-expand 0.22s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .knw-accordion-body { animation: none; }
        }
      `}</style>
    </div>
  )
}
