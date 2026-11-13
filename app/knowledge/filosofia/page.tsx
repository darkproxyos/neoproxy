'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { entries, clusters } from '@/components/knowledge/entries'

const mono = "'Space Mono', monospace"

type Chapter = {
  roman: string
  title: string
  entryIds: string[]
  color: string
  prose: string[]
}

// Siete capítulos — no un filósofo nuevo por capítulo, una secuencia de
// nodos YA reales en entries.ts (mismos que /knowledge expone en el grafo
// 3D), elegidos para que, leídos en este orden, armen un solo argumento
// continuo en vez de fichas sueltas. El capítulo VII no cita a nadie
// externo — cierra con las líneas reales del propio manifiesto
// (app/manifesto/page.tsx), que ya hacían este mismo movimiento sin que
// nadie lo hubiera puesto en palabras todavía.
const CHAPTERS: Chapter[] = [
  {
    roman: 'I',
    title: 'EL COGITO',
    entryIds: ['descartes'],
    color: clusters.mente.color,
    prose: [
      'Dudá de todo. De tu cuerpo, de la habitación donde estás, de este mismo texto — podría ser una simulación perfecta, armada para que nunca lo notes.',
      'Hay una sola cosa que la duda no puede tocar: que algo, ahora mismo, está dudando. Ese resto que no se borra es donde empieza todo lo demás.',
    ],
  },
  {
    roman: 'II',
    title: 'LA RED',
    entryIds: ['bateson', 'wiener'],
    color: clusters.informacion.color,
    prose: [
      'Pero ese "algo" que dudaba nunca estuvo solo en un cráneo. No es una sustancia — es un patrón que solo existe en el contraste, una señal que se corrige comparándose con lo que debería ser.',
      'Sacá la red y no queda un yo más puro, más esencial. Queda silencio. No hay información en un objeto aislado — solo en la diferencia que una diferencia hace.',
    ],
  },
  {
    roman: 'III',
    title: 'EL SIMULACRO',
    entryIds: ['baudrillard'],
    color: clusters.sistemas.color,
    prose: [
      'Y la señal que circula en esa red dejó de referirse a nada. Las copias no copian ya un original — se copian entre ellas, generación tras generación, hasta que preguntar por el original deja de tener sentido.',
      'Preguntale a cualquiera qué vio primero: la ciudad o la postal, el rostro o la pantalla. La respuesta ya no es la que esperás.',
    ],
  },
  {
    roman: 'IV',
    title: 'LA RESERVA',
    entryIds: ['heidegger'],
    color: clusters.sistemas.color,
    prose: [
      'Lo que la técnica no perdona no es que te mida. Es que, una vez medido, dejás de poder ser otra cosa que el número que arrojó esa medición.',
      'Un cuerpo que se puede optimizar deja de ser cuerpo — pasa a ser inventario, esperando que alguien lo active cuando haga falta.',
    ],
  },
  {
    roman: 'V',
    title: 'EL PROBLEMA DIFÍCIL',
    entryIds: ['nagel', 'chalmers'],
    color: clusters.mente.color,
    prose: [
      'Pero hay algo que ningún inventario registra. Podés describir cada neurona, cada voltaje, cada bucle de realimentación, y seguís sin saber qué se siente ser eso desde adentro.',
      'El mapa más completo del mundo no tiene un lugar marcado para el que lo está mirando.',
    ],
  },
  {
    roman: 'VI',
    title: 'EL PODER QUE NO SE POSEE',
    entryIds: ['foucault'],
    color: clusters.sistemas.color,
    prose: [
      'Y mientras tanto, alguien no necesita mirarte todo el tiempo. Alcanza con que nunca sepas cuándo no lo está haciendo.',
      'Esa sola duda te hace vigilarte solo. El dispositivo de control más eficiente es siempre el que vos mismo terminás instalando.',
    ],
  },
]

const SYNTHESIS_LINES = [
  { text: 'La Wired no es un lugar.', sub: 'Es la capa entre capas.' },
  { text: 'Cogito ergo sum.', sub: 'Sum ergo cogito.' },
  { text: 'El sistema es una ilusión.', sub: 'Solo tu conciencia decide.' },
]

export default function FilosofiaPage() {
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const totalSections = CHAPTERS.length + 1
  const [visible, setVisible] = useState<boolean[]>(() => Array(totalSections).fill(false))

  useEffect(() => {
    const observer = new IntersectionObserver((entries_) => {
      entries_.forEach(entry => {
        if (!entry.isIntersecting) return
        const idx = Number((entry.target as HTMLElement).dataset.idx)
        setVisible(prev => {
          if (prev[idx]) return prev
          const next = [...prev]
          next[idx] = true
          return next
        })
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.2, rootMargin: '0px 0px -80px 0px' })

    sectionRefs.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const registerRef = (idx: number) => (el: HTMLDivElement | null) => {
    sectionRefs.current[idx] = el
  }

  return (
    <div style={{ background: '#000205', minHeight: '100vh', fontFamily: mono, color: '#c8daf0', position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '104px 24px 0' }}>
          <Link href="/knowledge" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none' }}>
            ← VOLVER AL CODEX
          </Link>

          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: '#b06bff44', marginTop: 56, marginBottom: 16 }}>
            NPX-KNW-FIL // SIETE PREGUNTAS, NADIE LAS CERRÓ
          </div>
          <h1 style={{
            fontSize: 'clamp(30px, 6vw, 44px)', fontWeight: 700, letterSpacing: 10, color: '#b06bff',
            textShadow: '0 0 40px rgba(176,107,255,0.35)', marginBottom: 32, lineHeight: 1,
          }}>
            FILOSOFÍA
          </h1>

          <p style={{
            fontFamily: mono, fontSize: 11, lineHeight: 2.1, letterSpacing: 0.5, color: '#8fb8d6',
            maxWidth: 620, marginBottom: 100, borderLeft: '1px solid #b06bff22', paddingLeft: 24,
          }}>
            No es un resumen de /conocimiento. Es un solo recorrido, en orden, por seis nodos que ya
            están ahí — elegidos para que, leídos uno después del otro, armen un argumento en vez de
            seis fichas sueltas. Cada capítulo cita textual, nada parafraseado sin aviso. Andá
            despacio. No hay apuro en esto.
          </p>
        </div>

        {CHAPTERS.map((chapter, idx) => {
          const chapterEntries = chapter.entryIds
            .map(id => entries.find(e => e.id === id))
            .filter((e): e is NonNullable<typeof e> => !!e)

          return (
            <div
              key={chapter.roman}
              ref={registerRef(idx)}
              data-idx={idx}
              className={`fil-section ${visible[idx] ? 'is-visible' : ''}`}
              style={{
                maxWidth: 760, margin: '0 auto', padding: '0 24px 160px',
                borderTop: idx === 0 ? undefined : `1px solid ${chapter.color}14`,
                paddingTop: idx === 0 ? 0 : 100,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 28 }}>
                <span style={{ fontSize: 13, color: `${chapter.color}66`, letterSpacing: 2 }}>{chapter.roman}</span>
                <h2 style={{ fontSize: 22, letterSpacing: 6, color: chapter.color, textShadow: `0 0 24px ${chapter.color}33` }}>
                  {chapter.title}
                </h2>
              </div>

              {chapterEntries.map(entry => (
                <div key={entry.id} style={{ marginBottom: 28 }}>
                  <div style={{
                    fontSize: 15, lineHeight: 1.7, color: '#fff', letterSpacing: 0.5,
                    fontStyle: entry.formulaKind === 'quote' ? 'italic' : 'normal', marginBottom: 10,
                  }}>
                    {entry.formulaKind === 'quote' ? `"${entry.formula}"` : entry.formula}
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: 1.5, color: '#4a6080' }}>
                    {entry.name} ({entry.years}) — {entry.formulaLabel}
                  </div>
                </div>
              ))}

              {chapter.prose.map((p, i) => (
                <p key={i} style={{ fontSize: 12, lineHeight: 2.1, color: '#9fb8d6', letterSpacing: 0.3, marginBottom: 18, maxWidth: 580 }}>
                  {p}
                </p>
              ))}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 24 }}>
                {chapterEntries.map(entry => (
                  <Link key={entry.id} href={`/knowledge?entry=${entry.id}`} style={{
                    fontSize: 9, letterSpacing: 1.5, color: `${chapter.color}aa`, textDecoration: 'none',
                  }}>
                    → VER NODO DE {entry.name.split(' ').pop()?.toUpperCase()} EN EL CODEX
                  </Link>
                ))}
              </div>
            </div>
          )
        })}

        {/* Síntesis — ya no un filósofo externo, las líneas reales del propio manifiesto */}
        <div
          ref={registerRef(CHAPTERS.length)}
          data-idx={CHAPTERS.length}
          className={`fil-section ${visible[CHAPTERS.length] ? 'is-visible' : ''}`}
          style={{
            maxWidth: 760, margin: '0 auto', padding: '100px 24px 140px',
            borderTop: '1px solid #00d4ff14',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 28 }}>
            <span style={{ fontSize: 13, color: '#00d4ff66', letterSpacing: 2 }}>VII</span>
            <h2 style={{ fontSize: 22, letterSpacing: 6, color: '#00d4ff', textShadow: '0 0 24px rgba(0,212,255,0.3)' }}>
              SÍNTESIS
            </h2>
          </div>

          <p style={{ fontSize: 12, lineHeight: 2.1, color: '#9fb8d6', letterSpacing: 0.3, marginBottom: 56, maxWidth: 580 }}>
            Seis preguntas, nadie las cerró en trescientos años — no las va a cerrar NeoProxy tampoco.
            Lo único que hace es nombrar, en su propio idioma, el lugar exacto donde ya estabas parado.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {SYNTHESIS_LINES.map((line, i) => (
              <div key={i} className="fil-glitch-line" style={{ color: '#00ffcc' }}>
                <div style={{ fontSize: 'clamp(20px, 4vw, 28px)', letterSpacing: 2, lineHeight: 1.3 }}>{line.text}</div>
                <div style={{ fontSize: 'clamp(20px, 4vw, 28px)', letterSpacing: 2, lineHeight: 1.3, opacity: 0.6 }}>{line.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 72, fontSize: 9, letterSpacing: 4, color: '#00d4ff33' }}>
            NEOPROXY.ART // THE SYSTEM RECOGNIZES YOU
          </div>

          <Link href="/manifesto" style={{
            display: 'inline-block', marginTop: 32, fontSize: 9, letterSpacing: 2, color: '#00d4ff88', textDecoration: 'none',
          }}>
            → LEER EL MANIFIESTO COMPLETO
          </Link>
        </div>
      </div>

      <style>{`
        .fil-section {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .fil-section.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .fil-glitch-line {
          animation: flicker 7s ease-in-out infinite;
        }
        .fil-glitch-line:nth-child(2) { animation-delay: 1.4s; }
        .fil-glitch-line:nth-child(3) { animation-delay: 2.8s; }
        @media (prefers-reduced-motion: reduce) {
          .fil-section, .fil-glitch-line { animation: none !important; transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
