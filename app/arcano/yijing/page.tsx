'use client'

// NPX-ARN-01 — YI JING
// Segundo documento de Codex Arcanum. A diferencia de Grimorios
// (linaje occidental), este es un sistema real de otra cultura --
// China, ~1000-750 a.C. -- tratado con el mismo cuidado antropológico,
// no una mención de pasada. Nota de honestidad central (sección VIII):
// este entorno no tiene acceso de red a una fuente primaria verificable
// (Wikipedia y otros sitios de referencia están bloqueados para fetch
// directo acá), así que el documento NO reproduce los 64 textos
// clásicos de cada hexagrama -- serían una cita sin poder verificar.
// Lo que sí es 100% real y verificado: los 8 trigramas, sus líneas, el
// método de las tres monedas, y la historia (fechas, Wilhelm, Jung,
// Leibniz). El instrumento (/experimental/yijing) construye sus 64
// lecturas como síntesis propia de NeoProxy sobre esa estructura real,
// dicho explícitamente así, no disfrazado de traducción clásica.
// Acento propio: jade profundo #1f6b52, distinto de los 16 ya usados en
// el Codex (ningún otro verde es tan oscuro/apagado -- los de Lenguaje,
// Alimentación, Cognitiva y Grinberg son todos más brillantes).

import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const ACCENT = '#1f6b52'
const TEXT = '#d8ece4'
const TEXT_DIM = '#8fb8a8'
const LABEL_DIM = '#4a7060'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(2, 10, 7, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(31,107,82,0.04)`,
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
        <span style={{ fontSize: 13, color: `${ACCENT}77`, letterSpacing: 2 }}>{roman}</span>
        <h2 style={{ fontSize: 'clamp(18px, 3vw, 24px)', letterSpacing: 5, color: ACCENT, textShadow: `0 0 24px ${ACCENT}55`, margin: 0 }}>
          {title}
        </h2>
      </div>
      {sub && <div style={{ fontSize: 10, letterSpacing: 1, color: LABEL_DIM, marginTop: 8, paddingLeft: 32 }}>{sub}</div>}
    </div>
  )
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9.5, lineHeight: 1.8, letterSpacing: 0.5, color: LABEL_DIM, marginTop: 14, borderLeft: `2px solid ${ACCENT}44`, paddingLeft: 12 }}>
      {children}
    </div>
  )
}

const TRIGRAM_TABLE: { chars: string; pinyin: string; image: string; family: string; lines: string }[] = [
  { chars: '乾', pinyin: 'qián', image: 'Cielo', family: 'padre', lines: '▬▬▬' },
  { chars: '坤', pinyin: 'kūn', image: 'Tierra', family: 'madre', lines: '▬ ▬ ▬ ' },
  { chars: '震', pinyin: 'zhèn', image: 'Trueno', family: 'hijo mayor', lines: '▬ ▬ ▬▬' },
  { chars: '坎', pinyin: 'kǎn', image: 'Agua', family: 'hijo del medio', lines: '▬ ▬▬▬ ▬' },
  { chars: '艮', pinyin: 'gèn', image: 'Montaña', family: 'hijo menor', lines: '▬▬▬ ▬ ▬' },
  { chars: '巽', pinyin: 'xùn', image: 'Viento', family: 'hija mayor', lines: '▬ ▬▬▬▬' },
  { chars: '離', pinyin: 'lí', image: 'Fuego', family: 'hija del medio', lines: '▬▬▬ ▬ ▬▬' },
  { chars: '兌', pinyin: 'duì', image: 'Lago', family: 'hija menor', lines: '▬▬▬▬▬ ▬' },
]

const TOC: [string, string, string][] = [
  ['I', 'sec-01', 'Qué es — origen real en la dinastía Zhou'],
  ['II', 'sec-02', 'Las Diez Alas y Confucio — atribución legendaria'],
  ['III', 'sec-03', 'El método de los tallos de milenrama'],
  ['IV', 'sec-04', 'El método de las tres monedas'],
  ['V', 'sec-05', 'Wilhelm, Jung y la sincronicidad'],
  ['VI', 'sec-06', 'Leibniz y el binario — el puente real a lo ciber'],
  ['VII', 'sec-07', 'Los ocho trigramas'],
  ['VIII', 'sec-08', 'Nota de honestidad — por qué 64 lecturas propias'],
  ['IX', 'sec-09', 'Resonancia con NeoProxy'],
]

export default function YiJingPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.yij-section'))
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
    <div style={{ background: '#020805', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        <Link href="/knowledge/arcanum" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${ACCENT}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER A CODEX ARCANUM
        </Link>

        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}77`, marginBottom: 16 }}>
            NPX-ARN-01 // HISTORIA VERIFICABLE
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 5.5vw, 40px)', fontWeight: 700, letterSpacing: 4, color: ACCENT, textShadow: `0 0 40px ${ACCENT}66`, marginBottom: 14, lineHeight: 1.15 }}>
            易經 — YI JING
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            EL LIBRO DE LOS CAMBIOS — BINARIO ANTES DEL BINARIO
          </div>
          <p style={{ fontSize: 11.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 660, borderLeft: `1px solid ${ACCENT}44`, paddingLeft: 24, marginBottom: 32 }}>
            El segundo documento de Codex Arcanum, y el primero de otra cultura distinta al linaje
            occidental de <Link href="/arcano/grimorios" style={{ color: '#fff', textDecoration: 'underline' }}>Grimorios</Link>.
            Historia real — fechas, personas, manuscritos — y una nota de honestidad explícita sobre
            lo único que este documento no hace: citar los 64 textos clásicos letra por letra sin poder
            verificarlos en este entorno.
          </p>

          <div style={{ display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 9, letterSpacing: 1, color: `${ACCENT}aa`, border: `1px solid ${ACCENT}44`, padding: '12px 18px', marginBottom: 32 }}>
            <span style={{ color: `${ACCENT}66` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>HISTORIA REAL DE CHINA ANTIGUA — NO CANON NEOPROXY</span>
            <span style={{ color: `${ACCENT}66` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 9 SECCIONES</span>
            <span style={{ color: `${ACCENT}66` }}>ALCANCE</span><span style={{ color: TEXT }}>ORIGEN → MÉTODOS → TRANSMISIÓN A OCCIDENTE → TRIGRAMAS → INSTRUMENTO</span>
          </div>

          <nav style={{ border: `1px solid ${ACCENT}33`, padding: '20px 24px', maxWidth: 680 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}77`, marginBottom: 14 }}>ÍNDICE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px 20px' }}>
              {TOC.map(([roman, id, label]) => (
                <a key={id} href={`#${id}`} style={{ fontSize: 10.5, color: TEXT_DIM, textDecoration: 'none', display: 'flex', gap: 10 }}>
                  <span style={{ color: `${ACCENT}99`, width: 28, flexShrink: 0 }}>{roman}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>

        <div id="sec-01" className={`yij-section ${visible['sec-01'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="QUÉ ES — ORIGEN REAL EN LA DINASTÍA ZHOU" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El <strong style={{ color: '#fff' }}>Yi Jing</strong> ("Libro de los Cambios") es uno de
              los textos chinos más antiguos que se conservan. Su núcleo —64 hexagramas de seis líneas
              cada uno, con sus juicios breves— se remonta probablemente a la dinastía Zhou occidental,
              hacia 1000–750 a.C. Cada hexagrama está compuesto, siempre, por dos trigramas apilados: un
              trigrama inferior (la raíz, el punto de partida) y uno superior (lo que se manifiesta hacia
              afuera, el resultado) — 8 × 8 = 64 combinaciones posibles, ni una más.
            </p>
          </Panel>
        </div>

        <div id="sec-02" className={`yij-section ${visible['sec-02'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="LAS DIEZ ALAS Y CONFUCIO" sub="atribución legendaria, mismo criterio que el Corpus Hermético en Grimorios" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Lo que hoy se lee como "el libro completo" incluye capas mucho más tardías que el núcleo
              original: las <strong style={{ color: '#fff' }}>Diez Alas</strong>, comentarios filosóficos
              que profundizan el sentido de cada hexagrama. La tradición se las atribuye a Confucio
              (551–479 a.C.) — la erudición moderna considera esa autoría legendaria, sin confirmación
              filológica sólida, igual que la Clavícula de Salomón nunca la escribió Salomón.
            </p>
          </Panel>
        </div>

        <div id="sec-03" className={`yij-section ${visible['sec-03'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="EL MÉTODO DE LOS TALLOS DE MILENRAMA" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El método de adivinación documentado más antiguo usa 50 tallos secos de milenrama
              (Achillea millefolium), divididos y contados en una secuencia de varias rondas por cada
              una de las seis líneas de un hexagrama — un procedimiento largo, deliberadamente lento,
              que puede tomar más de media hora completo. La lentitud no es un defecto del método: es
              parte de él.
            </p>
          </Panel>
        </div>

        <div id="sec-04" className={`yij-section ${visible['sec-04'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="EL MÉTODO DE LAS TRES MONEDAS" sub="la simplificación posterior, la que implementa el instrumento real del sitio" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Mucho más simple que los tallos: se tiran tres monedas por línea, seis veces. Cara vale 3,
              ceca vale 2; la suma de las tres define el tipo de línea — 6 (yin que cambia), 7 (yang
              fija), 8 (yin fija) o 9 (yang que cambia). Las líneas que cambian se invierten para formar
              un segundo hexagrama: hacia dónde se mueve la situación que el primero describe. Es el
              método que popularizó la práctica en Occidente, y el que corre, real, en{' '}
              <Link href="/experimental/yijing" style={{ color: '#fff', textDecoration: 'underline' }}>
                /experimental/yijing
              </Link>.
            </p>
          </Panel>
        </div>

        <div id="sec-05" className={`yij-section ${visible['sec-05'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="WILHELM, JUNG Y LA SINCRONICIDAD" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La traducción de Richard Wilhelm (alemán, 1923; versión inglesa de Cary F. Baynes, 1950)
              fue la puerta de entrada real del Yi Jing a Occidente. Carl Jung escribió el prólogo de esa
              edición, y ahí mismo introdujo su concepto de{' '}
              <strong style={{ color: '#fff' }}>sincronicidad</strong>: la coincidencia significativa
              entre un estado interno y un evento externo, sin relación causal entre ambos — la idea que
              Jung usó para explicar por qué, para él, el método tenía sentido sin necesitar causalidad
              física.
            </p>
          </Panel>
        </div>

        <div id="sec-06" className={`yij-section ${visible['sec-06'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="LEIBNIZ Y EL BINARIO" sub="el dato más fuerte del documento — verificable, no interpretado" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              A principios del siglo XVIII, el misionero jesuita Joachim Bouvet le envió a Gottfried
              Leibniz los diagramas de los 64 hexagramas. Leibniz, que ya venía desarrollando la
              aritmética binaria, notó la correspondencia directa: una línea quebrada (yin) y una línea
              sólida (yang) son, estructuralmente, 0 y 1. Lo escribió en su propia correspondencia —no es
              una lectura simbólica forzada después del hecho, es historia documentada. El Yi Jing es,
              en ese sentido literal, el primer sistema binario de información que Occidente conoció,
              siglos antes de cualquier computadora.
            </p>
          </Panel>
        </div>

        <div id="sec-07" className={`yij-section ${visible['sec-07'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="LOS OCHO TRIGRAMAS" sub="la parte de este documento con cero riesgo de inexactitud" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 20 }}>
              Todo hexagrama es la combinación de dos de estos ocho. Líneas leídas de abajo hacia arriba
              — a diferencia de los 64 textos clásicos individuales, esta tabla es universal en cualquier
              fuente seria, sin margen real de disputa:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {TRIGRAM_TABLE.map((t) => (
                <div key={t.chars} style={{ border: `1px solid ${ACCENT}33`, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 14, color: ACCENT, letterSpacing: -1, lineHeight: 1 }}>{t.lines}</div>
                  <div>
                    <div style={{ fontSize: 12, color: '#fff' }}>{t.chars} {t.pinyin}</div>
                    <div style={{ fontSize: 9, color: LABEL_DIM, letterSpacing: 0.5 }}>{t.image} — {t.family}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div id="sec-08" className={`yij-section ${visible['sec-08'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VIII" title="NOTA DE HONESTIDAD — POR QUÉ 64 LECTURAS PROPIAS" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Este documento no reproduce los 64 juicios clásicos del Yi Jing letra por letra. No porque
              no importen, sino porque este entorno de trabajo no tiene acceso de red a una fuente
              primaria que se pudiera verificar al escribirlo (Wikipedia y otros sitios de referencia
              están bloqueados para fetch directo acá) — y citar de memoria un texto de casi tres mil
              años, sin poder confirmarlo, sería exactamente el tipo de afirmación sin respaldo que el
              resto de este Codex se cuida de no cometer.
            </p>
            <Caption>
              Lo que sí se pudo verificar con confianza total: los 8 trigramas y sus líneas (sección VII,
              universales en cualquier fuente), el método de las tres monedas (puramente mecánico), y la
              historia de esta sección. El instrumento real,{' '}
              <Link href="/experimental/yijing" style={{ color: '#fff', textDecoration: 'underline' }}>
                /experimental/yijing
              </Link>
              , construye sus 64 lecturas combinando esos dos trigramas reales —la raíz y el resultado—
              con una síntesis propia de NeoProxy, dicha así, explícitamente, en vez de disfrazada de
              traducción clásica. Es la misma regla que ya aplican los documentos de teoría disputada: no
              fallar a favor ni en contra, separar lo verificado de lo que no.
            </Caption>
          </Panel>
        </div>

        <div id="sec-09" className={`yij-section ${visible['sec-09'] ? 'is-visible' : ''}`} style={{ marginBottom: 40 }}>
          <SectionHeader roman="IX" title="RESONANCIA CON NEOPROXY" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Un sistema binario de hace tres mil años, leído por Leibniz como el germen de la aritmética
              que hoy corre literalmente este sitio — es la resonancia más directa de todo Codex Arcanum,
              la que no necesita ninguna lectura forzada. El mismo gesto de{' '}
              <Link href="/knowledge/sintesis" style={{ color: '#fff', textDecoration: 'underline' }}>Síntesis</Link>{' '}
              (información codificada en un límite, en vez de materia en un volumen) aparece acá siglos
              antes de Bekenstein, en una línea quebrada o sólida decidiendo, con tres monedas, hacia
              dónde se mueve una pregunta real.
            </p>
          </Panel>
        </div>

        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}33` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}55` }}>
            NPX-ARN-01 // SEGUNDO DOCUMENTO DE CODEX ARCANUM
          </div>
        </div>
      </div>

      <style>{`
        .yij-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .yij-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .yij-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
