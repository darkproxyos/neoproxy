'use client'

// CODEX ARCANUM — tercera pata del Codex, junto a los documentos de
// archivo (/archivo/*, ciencia real + ficción + teoría disputada) y el
// espacio 3D (/lab/codex). A pedido explícito: indagar la magia desde
// sus inicios -- autores, métodos, registros, culturas -- y leerla como
// un protocolo de información pre-científico, en diálogo directo con la
// tesis que /knowledge/sintesis ya dejó planteada para el resto del
// Codex. Mismo criterio de honestidad que el resto del sitio: separar lo
// históricamente verificable (manuscritos, fechas, personas reales) de
// lo que cada practicante afirmó sin que eso tenga aval. Arrancó con un
// solo documento de archivo (Grimorios) y un instrumento real
// (/experimental/sigilo, extendido con un ritual de carga). Yi Jing
// suma el primer sistema de otra cultura y un segundo instrumento real
// (/experimental/yijing) -- crece desde acá, no pretende estar completo.

import Link from 'next/link'

const mono = "'Space Mono', monospace"
const GOLD = '#c9a24d'
const RED = '#8b1538'
const JADE = '#3fcf9e'

type ArcanumDoc = {
  code: string; title: string; href: string; color: string; blurb: string
}

const ARCANUM_DOCS: ArcanumDoc[] = [
  {
    code: 'NPX-ARN-00', title: 'GRIMORIOS Y SISTEMAS OCCIDENTALES', href: '/arcano/grimorios',
    color: RED,
    blurb: 'De heka egipcio a la magia del caos — manuscritos, fechas y personas reales, con cada atribución legendaria marcada como tal.',
  },
  {
    code: 'NPX-ARN-01', title: '易經 YI JING', href: '/arcano/yijing',
    color: JADE,
    blurb: 'El primer sistema de otra cultura en este Codex — China, ~1000-750 a.C. Historia real, los 8 trigramas verificables, y la nota honesta de por qué las 64 lecturas del instrumento son síntesis propia.',
  },
]

export default function CodexArcanumPage() {
  return (
    <div style={{ background: '#040202', minHeight: '100vh', color: '#e8d8c8', position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '104px 24px 120px' }}>
        <Link href="/knowledge" className="press tap-ext" style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 3, color: '#6f86a3', textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER AL CODEX
        </Link>

        <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 6, color: `${GOLD}66`, marginBottom: 16 }}>
          NPX-KNW-ARN // LA MISMA PREGUNTA, LA VERSIÓN MÁS ANTIGUA
        </div>
        <h1 style={{
          fontFamily: mono, fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700, letterSpacing: 8, color: GOLD,
          textShadow: `0 0 40px ${GOLD}44`, marginBottom: 16, lineHeight: 1,
        }}>
          CODEX ARCANUM
        </h1>
        <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: 2, color: `${GOLD}aa`, marginBottom: 36 }}>
          MAGIA, LEÍDA COMO PROTOCOLO, NO COMO DECORACIÓN
        </div>

        <p style={{
          fontFamily: mono, fontSize: 12, lineHeight: 2.1, letterSpacing: 0.3, color: '#c9b8a8',
          maxWidth: 660, marginBottom: 20, borderLeft: `1px solid ${GOLD}33`, paddingLeft: 24,
        }}>
          <Link href="/knowledge/sintesis" style={{ color: '#fff', textDecoration: 'underline' }}>Síntesis</Link> ya
          dejó planteado que todo el Codex pregunta una sola cosa, en registros distintos: ¿la realidad es
          materia, o información codificada en un límite? La magia histórica — un sigilo, un nombre de
          poder, un sistema de correspondencias — es la versión más antigua de esa misma apuesta: tratar un
          símbolo como si pudiera cruzar el límite entre signo y efecto, siglos antes de tener una ecuación
          detrás. La ficción (Lain, Ghost in the Shell) y la física disputada (Grinberg, Garnier Malet) ya
          ocupaban ese mismo lugar en el argumento. Esto es el tercer frente — el más antiguo de los tres.
        </p>

        <p style={{
          fontFamily: mono, fontSize: 12, lineHeight: 2.1, letterSpacing: 0.3, color: '#c9b8a8',
          maxWidth: 660, marginBottom: 56, borderLeft: `1px solid ${GOLD}33`, paddingLeft: 24,
        }}>
          El mismo criterio de rigor que ya rige Grinberg y Garnier Malet aplica acá, sin excepción: cada
          documento separa lo históricamente verificable — un manuscrito que existe, una fecha, una persona
          real — de lo que un practicante afirmó sin que eso tenga aval. Ningún documento de esta sección
          dice que un sistema "funciona" en el sentido sobrenatural que le dieron sus propios practicantes.
          Lo que sí documenta, con el mismo cuidado, es el efecto psicológico real del ritual — la parte que
          de verdad se puede medir.
        </p>

        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 3, color: '#80705a', marginBottom: 16 }}>
          DOCUMENTOS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 56 }}>
          {ARCANUM_DOCS.map((doc) => (
            <Link key={doc.code} href={doc.href} className="press" style={{
              display: 'block', padding: '20px 20px 22px', textDecoration: 'none',
              border: `1px solid ${doc.color}44`, background: `${doc.color}0f`,
            }}>
              <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 2, color: `${doc.color}cc`, marginBottom: 12 }}>
                {doc.code}
              </div>
              <div style={{ fontFamily: mono, fontSize: 15, letterSpacing: 1, color: '#fff', marginBottom: 10 }}>
                {doc.title}
              </div>
              <p style={{ fontFamily: mono, fontSize: 11.5, lineHeight: 1.8, color: '#c9b8a8', margin: 0 }}>
                {doc.blurb}
              </p>
            </Link>
          ))}
        </div>

        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 3, color: '#80705a', marginBottom: 16 }}>
          INSTRUMENTOS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 56 }}>
          <Link href="/experimental/sigilo" className="press" style={{
            display: 'block', textDecoration: 'none', padding: '20px 24px',
            border: `1px solid ${GOLD}44`, background: `linear-gradient(135deg, ${GOLD}0f, transparent)`,
          }}>
            <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 3, color: `${GOLD}88`, marginBottom: 8 }}>
              NPX-XP-SIGILO // DETERMINÍSTICO A PROPÓSITO
            </div>
            <div style={{ fontFamily: mono, fontSize: 16, letterSpacing: 1.5, color: GOLD, marginBottom: 8, textShadow: `0 0 16px ${GOLD}55` }}>
              FORJAR Y CARGAR UN SIGILO →
            </div>
            <p style={{ fontFamily: mono, fontSize: 11.5, lineHeight: 1.8, color: '#c9b8a8', margin: 0 }}>
              El método de Austin Osman Spare (cap. VIII de Grimorios): reducción de letras, glifo sobre
              una rueda fija, y un ritual de carga cronometrado con respiración guiada.
            </p>
          </Link>
          <Link href="/experimental/yijing" className="press" style={{
            display: 'block', textDecoration: 'none', padding: '20px 24px',
            border: `1px solid ${JADE}44`, background: `linear-gradient(135deg, ${JADE}0f, transparent)`,
          }}>
            <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 3, color: `${JADE}aa`, marginBottom: 8 }}>
              NPX-XP-YIJING // AZAR REAL, SIN SEMILLA
            </div>
            <div style={{ fontFamily: mono, fontSize: 16, letterSpacing: 1.5, color: JADE, marginBottom: 8, textShadow: `0 0 16px ${JADE}55` }}>
              LANZAR LAS TRES MONEDAS →
            </div>
            <p style={{ fontFamily: mono, fontSize: 11.5, lineHeight: 1.8, color: '#c9b8a8', margin: 0 }}>
              El método real del Yi Jing (ver cap. IV): seis líneas de monedas reales, el hexagrama
              primario y, si cambia, hacia dónde se mueve.
            </p>
          </Link>
        </div>

        <div style={{ borderTop: `1px solid ${GOLD}22`, paddingTop: 28 }}>
          <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 2, color: '#80705a', marginBottom: 10 }}>
            LO QUE TODAVÍA NO ESTÁ
          </div>
          <p style={{ fontFamily: mono, fontSize: 11.5, lineHeight: 1.9, color: '#8a7868', maxWidth: 620, margin: 0 }}>
            Dos linajes ya cubiertos, el occidental (Egipto, hermetismo, grimorios, Renacimiento, revival
            del siglo XIX, magia del caos) y el chino (Yi Jing) — los dos con un instrumento real
            corriendo detrás. Otros sistemas — vudú, chamanismo amazónico y siberiano, curanderismo
            mesoamericano — merecen el mismo trato antropológico cuidadoso que el resto del Codex, no una
            mención de pasada: quedan pendientes a propósito, para no tratarlos peor que a Agrippa, a
            Crowley o al Yi Jing.
          </p>
        </div>
      </div>
    </div>
  )
}
