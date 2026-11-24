'use client'

// EL GRAN MAPA DEL CONOCIMIENTO — pedido explícito, inspirado en la IDEA
// de los posters "Map of X" de Dominic Walliman (Domain of Science): un
// mapa grande que organice un campo entero del saber humano en
// territorios. El usuario fue explícito y tiene razón: el conocimiento
// que esos posters organizan (qué subcampos tiene la física, qué hace
// CRISPR, qué es un transformer) es de la humanidad, no de Walliman —
// así que esta página representa esa misma estructura de campos y
// subcampos con taxonomía académica real, redactada de cero, con el
// estilo visual propio de NeoProxy. Lo que NO se reusa, a propósito: su
// dibujo hecho a mano, sus colores, sus chistes, ni su selección/orden
// exacto de íconos — ver nota de honestidad al final de esta página.
//
// Los cinco dominios (Matemáticas, Física, Química, Computación,
// Biología) viven como datos separados en components/knowledge/
// mapaDomains/*.ts, cada uno escrito por su cuenta contra el mismo tipo
// compartido (components/knowledge/mapaConocimiento.ts) — esta página
// solo los renderiza como territorios de un mosaico, con un acento de
// color propio por dominio y enlaces reales hacia los documentos del
// Codex que ya existen sobre esos mismos temas.

import Link from 'next/link'
import { MATEMATICAS } from '@/components/knowledge/mapaDomains/matematicas'
import { FISICA } from '@/components/knowledge/mapaDomains/fisica'
import { QUIMICA } from '@/components/knowledge/mapaDomains/quimica'
import { COMPUTACION } from '@/components/knowledge/mapaDomains/computacion'
import { BIOLOGIA } from '@/components/knowledge/mapaDomains/biologia'
import type { Domain } from '@/components/knowledge/mapaConocimiento'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'

const DOMAINS: Domain[] = [MATEMATICAS, FISICA, QUIMICA, COMPUTACION, BIOLOGIA]

function DomainZone({ domain }: { domain: Domain }) {
  return (
    <section
      id={domain.id}
      style={{
        borderTop: `2px solid ${domain.color}`,
        boxShadow: `0 -1px 24px ${domain.color}33`,
        padding: '48px 0 64px',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px' }}>
        <h2 style={{
          fontFamily: mono, fontSize: 'clamp(26px, 5vw, 38px)', fontWeight: 700, letterSpacing: 6,
          color: domain.color, textShadow: `0 0 30px ${domain.color}55`, marginBottom: 10, lineHeight: 1,
        }}>
          {domain.title}
        </h2>
        <p style={{
          fontFamily: mono, fontSize: 11.5, lineHeight: 1.9, color: '#c8daf0', maxWidth: 640,
          marginBottom: 32, borderLeft: `1px solid ${domain.color}44`, paddingLeft: 18,
        }}>
          {domain.intro}
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14,
        }}>
          {domain.subfields.map((sf) => (
            <div
              key={sf.title}
              style={{
                border: `1px solid ${domain.color}33`, background: `${domain.color}0a`,
                borderRadius: 4, padding: '16px 18px',
              }}
            >
              <div style={{
                fontFamily: mono, fontSize: 10.5, letterSpacing: 2, color: domain.color,
                marginBottom: 12, textTransform: 'uppercase',
              }}>
                {sf.title}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {sf.nodes.map((node) => {
                  const chipStyle: React.CSSProperties = {
                    fontFamily: mono, fontSize: 9.5, letterSpacing: 0.3, lineHeight: 1.5,
                    padding: '5px 9px', borderRadius: 3,
                    border: `1px solid ${domain.color}${node.href ? 'aa' : '33'}`,
                    background: node.href ? `${domain.color}22` : `${domain.color}0f`,
                    color: node.href ? '#fff' : '#c8daf0',
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'baseline', gap: 5,
                  }
                  const content = (
                    <>
                      <span>{node.label}</span>
                      {node.detail && (
                        <span style={{ color: `${domain.color}99`, fontSize: 8.5 }}>· {node.detail}</span>
                      )}
                      {node.href && <span style={{ color: domain.color, fontSize: 8 }}>→</span>}
                    </>
                  )
                  return node.href ? (
                    <Link key={node.label} href={node.href} style={chipStyle}>{content}</Link>
                  ) : (
                    <span key={node.label} style={chipStyle}>{content}</span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function MapaConocimientoPage() {
  return (
    <div style={{ background: '#030308', minHeight: '100vh', color: '#c8daf0', position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '104px 24px 40px' }}>
          <Link href="/knowledge" className="press" style={{
            fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${CYAN}88`, textDecoration: 'none',
            display: 'inline-block', marginBottom: 40,
          }}>
            ← VOLVER AL CODEX
          </Link>

          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${CYAN}66`, marginBottom: 16 }}>
            NPX-KNW-MAPA // CINCO TERRITORIOS, UN SOLO SABER
          </div>
          <h1 style={{
            fontFamily: mono, fontSize: 'clamp(30px, 7vw, 48px)', fontWeight: 700, letterSpacing: 8,
            color: CYAN, textShadow: `0 0 40px ${CYAN}44`, marginBottom: 16, lineHeight: 1,
          }}>
            EL GRAN MAPA DEL CONOCIMIENTO
          </h1>
          <p style={{
            fontFamily: mono, fontSize: 12, lineHeight: 2.1, color: '#8fb8d6', maxWidth: 760,
            marginBottom: 32, borderLeft: `1px solid ${CYAN}22`, paddingLeft: 24,
          }}>
            Matemáticas, Física, Química, Computación y Biología — cada una como un territorio con sus
            propios subcampos, cada subcampo con sus propios conceptos reales. No es un resumen de nadie
            en particular: es la misma estructura de saber que cualquier currícula universitaria seria
            reconocería, redactada de cero. Donde un concepto ya tiene su propio documento profundo en
            este Codex, el nodo lleva ahí — tocalo.
          </p>

          <nav style={{ border: `1px solid ${CYAN}22`, padding: '18px 22px', maxWidth: 640, marginBottom: 8 }}>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${CYAN}66`, marginBottom: 12 }}>
              TERRITORIOS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {DOMAINS.map((d) => (
                <a key={d.id} href={`#${d.id}`} style={{
                  fontFamily: mono, fontSize: 10, letterSpacing: 1, color: d.color, textDecoration: 'none',
                  border: `1px solid ${d.color}55`, padding: '6px 12px', background: `${d.color}0d`,
                }}>
                  {d.title}
                </a>
              ))}
            </div>
          </nav>
        </div>

        {DOMAINS.map((domain) => <DomainZone key={domain.id} domain={domain} />)}

        <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 120px' }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', marginBottom: 14 }}>
            NOTA DE HONESTIDAD
          </div>
          <p style={{ fontFamily: mono, fontSize: 10.5, lineHeight: 1.9, color: '#8a9ab0' }}>
            Esta página está inspirada en la idea de los posters "Map of Mathematics / Physics / Chemistry
            / Computer Science / Biology" de Dominic Walliman (canal Domain of Science) — él los vende
            como pósters reales, y su ilustración, su texto exacto y su selección de íconos son su obra,
            no algo para copiar. Lo que sí es de todos es la estructura del conocimiento que esos posters
            organizan: qué subcampos tiene cada ciencia, qué conceptos son reales. Esta página representa
            esa misma estructura con investigación propia, wording propio y el lenguaje visual de
            NeoProxy — ningún texto, ícono ni layout de esta página viene copiado de los suyos.
          </p>
        </div>
      </div>
    </div>
  )
}
