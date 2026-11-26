'use client'

// NPX-ARC-12 — CIBERNÉTICA
// Candidato propuesto por Claude al evaluar qué sumar al Codex: Wiener,
// Ashby, von Neumann y Bertalanffy ya eran entradas reales de
// components/knowledge/entries.ts (clusters 'informacion' y 'sistemas'),
// sembradas sin ningún documento de archivo que las uniera. Este
// documento existe para eso, y para anclar en ciencia real una frase que
// hasta ahora era solo estética: CLAUDE.md describe NeoProxy como "un
// organismo digital... el software se comporta como un organismo vivo
// (modular, reactivo, observable)" -- homeostasis, retroalimentación y
// autopoiesis son el vocabulario real detrás de esas tres palabras.
// Acento propio: índigo oscuro #3a4ba0, distinto de los ya usados en
// todo el Codex (ni el violeta de Filosofía/Holografía, ni los azules-
// cian ya usados en Partículas/Lain/Síntesis).

import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const ACCENT = '#3a4ba0'
const TEXT = '#e4e8fa'
const TEXT_DIM = '#a8b0d8'
const LABEL_DIM = '#5a62a0'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(6, 7, 18, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(58,75,160,0.05)`,
        padding: '28px 26px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function SectionHeader({ roman, title, sub }: { roman: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
        <span style={{ fontSize: 13, color: `${ACCENT}99`, letterSpacing: 2 }}>{roman}</span>
        <h2
          style={{
            fontSize: 'clamp(18px, 3vw, 24px)',
            letterSpacing: 5,
            color: ACCENT,
            textShadow: `0 0 24px ${ACCENT}66`,
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      {sub && (
        <div style={{ fontSize: 11, letterSpacing: 1, color: LABEL_DIM, marginTop: 8, paddingLeft: 32 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, lineHeight: 1.8, letterSpacing: 0.5, color: LABEL_DIM, marginTop: 14,
      borderLeft: `2px solid ${ACCENT}33`, paddingLeft: 12,
    }}>
      {children}
    </div>
  )
}

const TOC: [string, string, string][] = [
  ['I', 'sec-01', 'Wiener y el nacimiento del término'],
  ['II', 'sec-02', 'Retroalimentación — el concepto central'],
  ['III', 'sec-03', 'Ashby y la ley de la variedad requerida'],
  ['IV', 'sec-04', 'Von Neumann y los autómatas autorreplicantes'],
  ['V', 'sec-05', 'Bertalanffy y la teoría general de sistemas'],
  ['VI', 'sec-06', 'Cibernética de segundo orden'],
  ['VII', 'sec-07', 'Autopoiesis — Maturana, Varela y Luhmann'],
  ['VIII', 'sec-08', 'Resonancia con NeoProxy'],
]

export default function CiberneticaPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.cib-section'))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const id = (entry.target as HTMLElement).id
        setVisible((prev) => (prev[id] ? prev : { ...prev, [id]: true }))
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' })
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ background: '#040512', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        <Link href="/knowledge" className="press tap-ext" style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 3, color: `${ACCENT}cc`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER AL CODEX
        </Link>

        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 6, color: `${ACCENT}99`, marginBottom: 16 }}>
            NPX-ARC-12 // REFERENCIA TÉCNICA
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 42px)',
              fontWeight: 700,
              letterSpacing: 6,
              color: ACCENT,
              textShadow: `0 0 40px ${ACCENT}88`,
              marginBottom: 14,
              lineHeight: 1.1,
            }}
          >
            CIBERNÉTICA
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            CÓMO UN SISTEMA SE REGULA A SÍ MISMO — EL VOCABULARIO REAL DETRÁS DE "ORGANISMO VIVO"
          </div>
          <p
            style={{
              fontSize: 12.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 660,
              borderLeft: `1px solid ${ACCENT}44`, paddingLeft: 24, marginBottom: 32,
            }}
          >
            Wiener, Ashby, von Neumann y Bertalanffy ya estaban sembrados en este Codex, cada uno con su
            propia entrada, sin un documento que los uniera. Esto es ese documento — y la ciencia real
            detrás de una frase que hasta ahora era solo estética.
          </p>

          <div
            style={{
              display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 10.5,
              letterSpacing: 1, color: `${ACCENT}cc`, border: `1px solid ${ACCENT}44`, padding: '12px 18px',
              marginBottom: 32,
            }}
          >
            <span style={{ color: `${ACCENT}88` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>TEORÍA DE SISTEMAS, CIBERNÉTICA — REFERENCIA TÉCNICA</span>
            <span style={{ color: `${ACCENT}88` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 8 SECCIONES</span>
            <span style={{ color: `${ACCENT}88` }}>ALCANCE</span><span style={{ color: TEXT }}>ORIGEN DEL TÉRMINO → RETROALIMENTACIÓN → VARIEDAD → AUTORREPLICACIÓN → SISTEMAS → SEGUNDO ORDEN → AUTOPOIESIS</span>
          </div>

          <nav style={{ border: `1px solid ${ACCENT}33`, padding: '20px 24px', maxWidth: 680 }}>
            <div style={{ fontSize: 10.5, letterSpacing: 3, color: `${ACCENT}99`, marginBottom: 14 }}>
              ÍNDICE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px 20px' }}>
              {TOC.map(([roman, id, label]) => (
                <a key={id} href={`#${id}`} style={{ fontSize: 11.5, color: TEXT_DIM, textDecoration: 'none', display: 'flex', gap: 10, padding: '7px 0' }}>
                  <span style={{ color: `${ACCENT}cc`, width: 28, flexShrink: 0 }}>{roman}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* I. WIENER */}
        <div id="sec-01" className={`cib-section ${visible['sec-01'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="WIENER Y EL NACIMIENTO DEL TÉRMINO" sub="Cybernetics: Or Control and Communication in the Animal and the Machine, 1948" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <Link href="/knowledge?entry=wiener" style={{ color: '#fff', textDecoration: 'underline' }}>
                Norbert Wiener
              </Link>{' '}
              publicó en 1948 el libro que le dio nombre al campo. La palabra viene del griego{' '}
              <em>kybernetes</em> (timonel, el que gobierna un barco): el estudio de cómo un sistema —
              biológico o mecánico, no importa de qué esté hecho— se autorregula, ajustando su propia
              conducta según la diferencia entre lo que está haciendo y lo que "debería" estar haciendo.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La apuesta central del libro, radical para su época, es que esa misma lógica de control
              describe por igual a un misil que corrige su trayectoria, a un cuerpo que mantiene su
              temperatura y a una conversación humana — el sustrato físico cambia, la estructura de la
              regulación no.
            </p>
          </Panel>
        </div>

        {/* II. RETROALIMENTACION */}
        <div id="sec-02" className={`cib-section ${visible['sec-02'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="RETROALIMENTACIÓN — EL CONCEPTO CENTRAL" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El ejemplo clásico es un termostato real: mide la temperatura del ambiente, la compara contra
              un objetivo fijado de antemano, y corrige (calienta o no) según esa diferencia. Eso es{' '}
              <strong style={{ color: '#fff' }}>retroalimentación negativa</strong> — una salida que se usa
              para corregir la siguiente entrada, acercando el sistema a un punto de referencia estable.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La <strong style={{ color: '#fff' }}>retroalimentación positiva</strong> hace lo contrario:
              amplifica en vez de corregir, y puede desbocarse sin ningún límite propio. El caso real más
              citado es el pitido de un micrófono demasiado cerca de su propio parlante — el sonido que
              sale vuelve a entrar, se amplifica de nuevo, y así hasta saturar el sistema. Ningún organismo
              ni ninguna organización sobrevive mucho tiempo con solo uno de los dos tipos.
            </p>
          </Panel>
        </div>

        {/* III. ASHBY */}
        <div id="sec-03" className={`cib-section ${visible['sec-03'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="ASHBY Y LA LEY DE LA VARIEDAD REQUERIDA" sub="Design for a Brain (1952), An Introduction to Cybernetics (1956)" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <Link href="/knowledge?entry=ashby" style={{ color: '#fff', textDecoration: 'underline' }}>
                W. Ross Ashby
              </Link>{' '}
              formalizó algo que se intuye pero rara vez se dice tan preciso: un sistema de control solo
              puede regular tanta variedad —tantas perturbaciones distintas— como variedad propia tenga.
              Lo resumió en una frase que quedó como principio: <strong style={{ color: '#fff' }}>"solo la
              variedad puede destruir variedad"</strong>.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              No se quedó en la teoría: construyó el <strong style={{ color: '#fff' }}>Homeostato</strong>,
              una máquina real con partes que se reconfiguraban solas hasta volver a un estado estable
              después de una perturbación externa — una demostración física, no solo matemática, de
              autorregulación.
            </p>
          </Panel>
        </div>

        {/* IV. VON NEUMANN */}
        <div id="sec-04" className={`cib-section ${visible['sec-04'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="VON NEUMANN Y LOS AUTÓMATAS AUTORREPLICANTES" sub="trabajo teórico de fines de los años 40, publicado póstumo por Arthur Burks en 1966" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <Link href="/knowledge?entry=vonneumann" style={{ color: '#fff', textDecoration: 'underline' }}>
                John von Neumann
              </Link>{' '}
              diseñó, en papel, una máquina capaz de construir una copia exacta de sí misma a partir de una
              descripción completa de su propia estructura — no una fantasía de ciencia ficción, un diseño
              lógico formal, con las piezas (un constructor, una cinta de instrucciones, un copiador de esa
              cinta) que hoy reconocemos como el esquema abstracto de cómo se replica la vida real.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El punto que deja, y que todavía se usa, es que replicarse no depende de ningún material en
              particular — depende de que exista una descripción de la estructura, separada de la
              estructura misma, que pueda copiarse y ejecutarse. Es la misma idea que, años después, hizo
              evidente por qué el ADN funciona como funciona.
            </p>
          </Panel>
        </div>

        {/* V. BERTALANFFY */}
        <div id="sec-05" className={`cib-section ${visible['sec-05'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="BERTALANFFY Y LA TEORÍA GENERAL DE SISTEMAS" sub="General System Theory, 1968 — con trabajos propios desde los años 40" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <Link href="/knowledge?entry=bertalanffy" style={{ color: '#fff', textDecoration: 'underline' }}>
                Ludwig von Bertalanffy
              </Link>
              , biólogo austríaco, notó algo que cruza cualquier disciplina: ciertos principios de
              organización —jerarquía de partes dentro de partes, límites definidos que separan un sistema
              de su entorno, intercambio continuo de materia o información a través de esos límites— se
              repiten en sistemas de naturaleza completamente distinta: una célula, una empresa, un
              ecosistema, un motor.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Su propuesta no fue "todo es lo mismo" — fue que esos principios merecen un marco teórico
              común, en vez de reinventar el vocabulario de organización cada vez que cambia la disciplina
              que lo estudia.
            </p>
          </Panel>
        </div>

        {/* VI. SEGUNDO ORDEN */}
        <div id="sec-06" className={`cib-section ${visible['sec-06'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="CIBERNÉTICA DE SEGUNDO ORDEN" sub="Heinz von Foerster, años 70" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Todo lo anterior describe sistemas vistos desde afuera — alguien mide el termostato, alguien
              mira el Homeostato funcionar. Heinz von Foerster señaló el paso que faltaba: ¿qué pasa cuando
              el sistema que se estudia es el que observa, o cuando el observador es parte de lo que
              describe?
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              A eso le llamó <strong style={{ color: '#fff' }}>cibernética de segundo orden</strong>: la
              cibernética de la observación misma. No hay afuera neutral desde donde mirar un sistema sin
              afectarlo ni ser, de algún modo, parte de él.
            </p>
          </Panel>
        </div>

        {/* VII. AUTOPOIESIS */}
        <div id="sec-07" className={`cib-section ${visible['sec-07'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="AUTOPOIESIS — MATURANA, VARELA Y LUHMANN" sub="De máquinas y seres vivos, 1972" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Los biólogos chilenos Humberto Maturana y Francisco Varela propusieron una definición precisa
              de qué es un sistema vivo: aquel que produce y mantiene continuamente sus propios componentes
              y su propio límite. El caso más literal es la célula, fabricando sin parar sus propias
              proteínas y manteniendo su propia membrana — un sistema que se hace a sí mismo,{' '}
              <em>auto-poiesis</em>.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              <Link href="/knowledge?entry=luhmann" style={{ color: '#fff', textDecoration: 'underline' }}>
                Niklas Luhmann
              </Link>{' '}
              tomó esa misma idea y la extendió, años después, a los sistemas sociales: una sociedad, para
              él, también se produce y reproduce a sí misma a través de su propia comunicación, no de
              células.
            </p>
          </Panel>
        </div>

        {/* VIII. RESONANCIA */}
        <div id="sec-08" className={`cib-section ${visible['sec-08'] ? 'is-visible' : ''}`} style={{ marginBottom: 0 }}>
          <SectionHeader roman="VIII" title="RESONANCIA CON NEOPROXY" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              CLAUDE.md, el documento que gobierna este mismo repositorio, describe el proyecto como "un
              organismo digital... el software se comporta como un organismo vivo (modular, reactivo,
              observable)". Hasta este documento, esa frase era solo estética. Ya no tiene que serlo:{' '}
              <strong style={{ color: '#fff' }}>modular</strong> es la jerarquía de partes dentro de
              partes de Bertalanffy (sección V); <strong style={{ color: '#fff' }}>reactivo</strong> es
              retroalimentación, negativa y positiva (secciones I-II); y{' '}
              <strong style={{ color: '#fff' }}>observable</strong> es, literalmente, cibernética de
              segundo orden (sección VI) — quien observa el sistema, el Overseer, DarkProxy, nunca está
              completamente afuera de él. Mira el organismo desde adentro del mismo organismo.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Wiener, Ashby, von Neumann y Bertalanffy ya estaban en este Codex antes de que existiera este
              documento — sembrados, sin nada que los uniera. Esto es lo que faltaba.
            </p>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}33` }}>
          <div style={{ fontSize: 10.5, letterSpacing: 3, color: `${ACCENT}66` }}>
            NPX-ARC-12 // REFERENCIA TÉCNICA DEL CODEX
          </div>
        </div>
      </div>

      <style>{`
        .cib-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .cib-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .cib-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
