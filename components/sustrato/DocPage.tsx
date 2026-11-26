'use client'

// Plantilla compartida para los documentos largos de /sustrato (la
// sección de electrónica/robótica: fundamentos, Arduino, sensores,
// Raspberry Pi, Jetson, STM32, FPGA, comparativa). Mismo lenguaje visual
// que los documentos del Codex (Panel/SectionHeader/Caption/TOC/scroll
// reveal por IntersectionObserver), pero ahora como un módulo compartido
// de verdad en vez de copiado a mano en cada archivo -- con seis+
// documentos reales pidiendo exactamente esta misma plantilla de una, no
// tenía sentido seguir duplicándola (la misma lógica que ya sacó
// SITE_BRANCH_COLOR y polytopes4d.ts a módulos propios esta sesión).
//
// Cada <Section> maneja su propio IntersectionObserver (un ref + un
// estado local), no uno centralizado en el Shell -- evita pasar un mapa
// de visibilidad a mano por cada sección de cada página.

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'

export const mono = "'Space Mono', monospace"

const AccentContext = createContext('#00d4ff')

export type TocEntry = { roman: string; id: string; label: string }
export type StatEntry = { label: string; value: string }

export function Panel({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  const accent = useContext(AccentContext)
  return (
    <div style={{
      background: 'rgba(5, 8, 14, 0.55)', border: `1px solid ${accent}33`, borderRadius: 4,
      boxShadow: `0 0 28px ${accent}11, inset 0 0 40px rgba(255,255,255,0.02)`, padding: '28px 26px', ...style,
    }}>
      {children}
    </div>
  )
}

export function SectionHeader({ roman, title, sub }: { roman: string; title: string; sub?: string }) {
  const accent = useContext(AccentContext)
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
        <span style={{ fontSize: 13, color: `${accent}66`, letterSpacing: 2 }}>{roman}</span>
        <h2 style={{ fontSize: 'clamp(18px, 3vw, 24px)', letterSpacing: 5, color: accent, textShadow: `0 0 24px ${accent}44`, margin: 0 }}>
          {title}
        </h2>
      </div>
      {sub && <div style={{ fontSize: 11, letterSpacing: 1, color: '#6f86a3', marginTop: 8, paddingLeft: 32 }}>{sub}</div>}
    </div>
  )
}

export function Caption({ children }: { children: ReactNode }) {
  const accent = useContext(AccentContext)
  return (
    <div style={{ fontSize: 11, lineHeight: 1.8, letterSpacing: 0.5, color: '#6f86a3', marginTop: 14, borderLeft: `2px solid ${accent}33`, paddingLeft: 12 }}>
      {children}
    </div>
  )
}

export function P({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 12.5, lineHeight: 2, color: '#9fb4cc', margin: 0, marginBottom: 16 }}>{children}</p>
}

export function B({ children }: { children: ReactNode }) {
  return <strong style={{ color: '#fff' }}>{children}</strong>
}

// tabla de specs compacta -- reusada por casi todas las entradas de
// sensores/placas (nombre de campo + valor), sin inventar una tabla HTML
// por página.
export function SpecLine({ label, value }: { label: string; value: ReactNode }) {
  const accent = useContext(AccentContext)
  return (
    <div style={{ display: 'flex', gap: 10, fontSize: 11.5, lineHeight: 1.9, marginBottom: 4 }}>
      <span style={{ color: `${accent}aa`, minWidth: 92, flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#c8daf0' }}>{value}</span>
    </div>
  )
}

export function Section({ roman, title, sub, id, children }: {
  roman: string; title: string; sub?: string; id: string; children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { setVisible(true); observer.unobserve(el) }
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} id={id} className={`sus-section ${visible ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
      <SectionHeader roman={roman} title={title} sub={sub} />
      <Panel>{children}</Panel>
    </div>
  )
}

export function SustratoDoc({
  code, title, subtitle, accent, intro, classification, revision, alcance, toc, backHref = '/sustrato', backLabel = '← VOLVER A SUSTRATO', children,
}: {
  code: string
  title: string
  subtitle: string
  accent: string
  intro: ReactNode
  classification: string
  revision: string
  alcance: string
  toc: TocEntry[]
  backHref?: string
  backLabel?: string
  children: ReactNode
}) {
  return (
    <AccentContext.Provider value={accent}>
      <div style={{ background: '#05080c', minHeight: '100vh', fontFamily: mono, color: '#c8daf0', position: 'relative' }}>
        <div className="crt-scanlines" />
        <div className="tech-grid" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
          <Link href={backHref} className="press" style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 3, color: `${accent}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
            {backLabel}
          </Link>

          <div style={{ marginBottom: 90 }}>
            <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 6, color: `${accent}66`, marginBottom: 16 }}>
              {code} // SUSTRATO
            </div>
            <h1 style={{ fontSize: 'clamp(26px, 5.5vw, 40px)', fontWeight: 700, letterSpacing: 4, color: accent, textShadow: `0 0 40px ${accent}55`, marginBottom: 14, lineHeight: 1.15 }}>
              {title}
            </h1>
            <div style={{ fontSize: 12, letterSpacing: 3, color: '#9fb4cc', marginBottom: 32 }}>
              {subtitle}
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 2.1, letterSpacing: 0.3, color: '#9fb4cc', maxWidth: 660, borderLeft: `1px solid ${accent}33`, paddingLeft: 24, marginBottom: 32 }}>
              {intro}
            </div>

            <div style={{ display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 10.5, letterSpacing: 1, color: `${accent}99`, border: `1px solid ${accent}33`, padding: '12px 18px', marginBottom: 32 }}>
              <span style={{ color: `${accent}55` }}>CLASIFICACIÓN</span><span style={{ color: '#c8daf0' }}>{classification}</span>
              <span style={{ color: `${accent}55` }}>REVISIÓN</span><span style={{ color: '#c8daf0' }}>{revision}</span>
              <span style={{ color: `${accent}55` }}>ALCANCE</span><span style={{ color: '#c8daf0' }}>{alcance}</span>
            </div>

            <nav style={{ border: `1px solid ${accent}22`, padding: '20px 24px', maxWidth: 680 }}>
              <div style={{ fontSize: 10.5, letterSpacing: 3, color: `${accent}66`, marginBottom: 14 }}>ÍNDICE</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px 20px' }}>
                {toc.map((t) => (
                  <a key={t.id} href={`#${t.id}`} style={{ fontSize: 11.5, color: '#9fb4cc', textDecoration: 'none', display: 'flex', gap: 10 }}>
                    <span style={{ color: `${accent}88`, width: 28, flexShrink: 0 }}>{t.roman}</span>
                    <span>{t.label}</span>
                  </a>
                ))}
              </div>
            </nav>
          </div>

          {children}
        </div>

        <style>{`
          .sus-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
          .sus-section.is-visible { opacity: 1; transform: translateY(0); }
          @media (prefers-reduced-motion: reduce) {
            .sus-section { transition: none !important; opacity: 1 !important; transform: none !important; }
          }
        `}</style>
      </div>
    </AccentContext.Provider>
  )
}
