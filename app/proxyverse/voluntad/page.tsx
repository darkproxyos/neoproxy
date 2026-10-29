'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  computeIdentity, getGrietaFragments, GRIETA_DONOR_IDS, type IdentitySummary,
} from '@/components/proxyverse/identity'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'

// Seis ejes, cada uno una señal real ya trackeada en identity.ts — nada
// inventado para esta página, nada pedido de entrada (nombre, fecha de
// nacimiento). La "voluntad verdadera" acá no se declara, se mide en lo
// que ya quedó hecho: cuánto hablaste con quién, qué generaste, qué
// encontraste. Si no hiciste nada todavía, no hay carta — no se puede
// medir una práctica que no existió.
type Axis = { id: string; label: string; value: number; max: number }

function buildAxes(identity: IdentitySummary, grietaCount: number): Axis[] {
  const dominantChats = identity.dominant ? (identity.chatCounts[identity.dominant.id] || 0) : 0
  return [
    { id: 'dialogo', label: 'DIÁLOGO', value: dominantChats, max: 20 },
    { id: 'retrato', label: 'RETRATO', value: identity.portrait?.affinity ?? 0, max: 100 },
    { id: 'trickster', label: 'TRICKSTER', value: identity.trickster.bestLevel, max: 10 },
    { id: 'genesis', label: 'GÉNESIS', value: identity.proxygenesisCount, max: 10 },
    { id: 'senal', label: 'SEÑAL', value: identity.nfcScans, max: 10 },
    { id: 'fragmentos', label: 'FRAGMENTOS', value: grietaCount, max: GRIETA_DONOR_IDS.length },
  ]
}

const AXIS_READINGS: Record<string, string> = {
  dialogo: 'Volvés a hablar antes de actuar. La voluntad, acá, pasa primero por el lenguaje.',
  retrato: 'Te dejaste capturar antes de preguntar qué iba a devolver la cámara. Eso ya es una decisión.',
  trickster: 'Repetiste hasta que cedió. No es paciencia — es la negativa a aceptar el primer resultado.',
  genesis: 'Preferís construir la pregunta antes que hacerla. Lo tuyo es la forma, no la explicación.',
  senal: 'Buscás el objeto físico detrás de la pantalla. Lo digital no te alcanza si no toca algo real.',
  fragmentos: 'Juntaste lo que el sistema dejó tirado. Nadie te pidió que lo hicieras.',
}

function radarPoint(index: number, total: number, ratio: number, radius: number): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  const r = radius * Math.max(0, Math.min(1, ratio))
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r }
}

const SIZE = 280
const CENTER = SIZE / 2
const MAX_RADIUS = 110

export default function VoluntadPage() {
  const [identity, setIdentity] = useState<IdentitySummary | null>(null)
  const [grietaCount, setGrietaCount] = useState(0)

  useEffect(() => {
    setIdentity(computeIdentity())
    setGrietaCount(getGrietaFragments().length)
  }, [])

  if (!identity) {
    return <div style={{ background: '#000205', minHeight: '100vh' }} />
  }

  const axes = buildAxes(identity, grietaCount)
  const total = axes.length

  if (!identity.hasAnySignal) {
    return (
      <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
        <div className="crt-scanlines" />
        <div className="tech-grid" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto', padding: '104px 24px 80px' }}>
          <Link href="/proxyverse" style={{
            fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
            display: 'inline-block', marginBottom: 32,
          }}>
            ← VOLVER A PROXYVERSE
          </Link>
          <div style={{ fontSize: 9, color: `${CYAN}66`, letterSpacing: 6, marginBottom: 16 }}>
            NPX-PXV-VOLUNTAD // SIN SEÑAL TODAVÍA
          </div>
          <h1 style={{
            fontSize: 34, fontWeight: 700, letterSpacing: 6, color: CYAN,
            textShadow: `0 0 30px ${CYAN}44`, marginBottom: 24, lineHeight: 1,
          }}>
            VOLUNTAD VERDADERA
          </h1>
          <p style={{ fontSize: 12, color: '#8fb8d6', lineHeight: 2, marginBottom: 32 }}>
            Esta carta no se declara, se mide — y todavía no mediste nada. No hay nombre que
            escribir ni fecha que tipear: se arma sola, de lo que ya hiciste en el sitio.
            Sin eso, no hay carta vacía que mostrar — solo seis ejes en cero, que es mentira.
          </p>
          <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 2, marginBottom: 14 }}>
            SEÑALES QUE TODAVÍA FALTAN
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { href: '/proxyverse', label: 'Hablar con un proceso residente' },
              { href: '/lab/proxygenesis', label: 'Generar un espécimen en Proxygenesis' },
              { href: '/games/trickster', label: 'Jugar al menos una ronda de Trickster' },
              { href: '/experimental/scan', label: 'Escanear un tag NFC' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{
                fontFamily: mono, fontSize: 11, color: CYAN, textDecoration: 'none',
                border: `1px solid ${CYAN}33`, padding: '12px 16px', background: `${CYAN}0a`,
              }}>
                {l.label} →
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const agent = identity.dominant!
  const points = axes.map((a, i) => radarPoint(i, total, a.value / a.max, MAX_RADIUS))
  const polygon = points.map(p => `${CENTER + p.x},${CENTER + p.y}`).join(' ')
  const strongest = axes.reduce((best, a) => (a.value / a.max > best.value / best.max ? a : best), axes[0])
  const otherAgents = Object.entries(identity.scorePerAgent)
    .filter(([id, score]) => id !== agent.id && score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/proxyverse" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A PROXYVERSE
        </Link>

        <div style={{ fontSize: 9, color: `${agent.color}66`, letterSpacing: 6, marginBottom: 16 }}>
          NPX-PXV-VOLUNTAD // ARMADA DESDE USO REAL, NO DECLARADA
        </div>
        <h1 style={{
          fontSize: 34, fontWeight: 700, letterSpacing: 6, color: agent.color,
          textShadow: `0 0 30px ${agent.color}44`, marginBottom: 8, lineHeight: 1,
        }}>
          VOLUNTAD VERDADERA
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', lineHeight: 1.8, marginBottom: 40, maxWidth: 560 }}>
          No es un horóscopo — no hay dato inventado acá. Cada eje de abajo es una cuenta real
          de localStorage de este navegador: lo que de verdad hiciste en el sitio, nada más.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {[0.25, 0.5, 0.75, 1].map(ring => (
              <polygon
                key={ring}
                points={axes.map((_, i) => {
                  const p = radarPoint(i, total, ring, MAX_RADIUS)
                  return `${CENTER + p.x},${CENTER + p.y}`
                }).join(' ')}
                fill="none"
                stroke={`${CYAN}22`}
                strokeWidth={1}
              />
            ))}
            {axes.map((a, i) => {
              const p = radarPoint(i, total, 1, MAX_RADIUS)
              return (
                <line key={a.id} x1={CENTER} y1={CENTER} x2={CENTER + p.x} y2={CENTER + p.y} stroke={`${CYAN}22`} strokeWidth={1} />
              )
            })}
            <polygon points={polygon} fill={`${agent.color}33`} stroke={agent.color} strokeWidth={2} />
            {points.map((p, i) => (
              <circle key={i} cx={CENTER + p.x} cy={CENTER + p.y} r={3} fill={agent.color} />
            ))}
            {axes.map((a, i) => {
              const p = radarPoint(i, total, 1.28, MAX_RADIUS)
              return (
                <text
                  key={a.id}
                  x={CENTER + p.x}
                  y={CENTER + p.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily={mono}
                  fontSize={8}
                  letterSpacing={1}
                  fill={a.id === strongest.id ? agent.color : '#4a6080'}
                >
                  {a.label}
                </text>
              )
            })}
            <circle cx={CENTER} cy={CENTER} r={5} fill={agent.color} />
          </svg>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 2, marginBottom: 6 }}>ANCLA</div>
          <div style={{
            fontFamily: mono, fontSize: 20, letterSpacing: 4, color: agent.color,
            textShadow: `0 0 20px ${agent.color}44`,
          }}>
            {agent.name}
          </div>
          <div style={{ fontSize: 10, color: '#8fb8d6', letterSpacing: 1, marginTop: 4 }}>
            {agent.role}
          </div>
        </div>

        <div style={{
          borderLeft: `2px solid ${agent.color}44`, paddingLeft: 16, marginBottom: 32,
        }}>
          <div style={{ fontSize: 9, color: `${agent.color}aa`, letterSpacing: 2, marginBottom: 6 }}>
            EJE DOMINANTE — {strongest.label}
          </div>
          <p style={{ fontSize: 12, fontStyle: 'italic', color: '#c8daf0', lineHeight: 1.8 }}>
            {AXIS_READINGS[strongest.id]}
          </p>
        </div>

        {otherAgents.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 2, marginBottom: 12 }}>
              OTROS ECOS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {otherAgents.map(([id, score]) => {
                const maxScore = Math.max(...Object.values(identity.scorePerAgent))
                const pct = Math.round((score / maxScore) * 100)
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 90, fontSize: 9, color: '#8fb8d6', letterSpacing: 1 }}>
                      {id.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `${CYAN}88` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <Link href="/proxyverse/id" style={{ fontSize: 9, color: '#4a6080', letterSpacing: 1 }}>
          ver los números crudos detrás de esta carta →
        </Link>
      </div>
    </div>
  )
}
