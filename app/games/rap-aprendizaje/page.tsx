'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const VIOLET = '#b400ff'
const CYAN = '#00d4ff'
const mono = "'Space Mono', monospace"

// Modo aprendizaje: a diferencia de /games/rap (conceptos sueltos del lore),
// acá el vocabulario es grande y de filosofía/ciencia/matemática/lingüística,
// y está agrupado por TERMINACIÓN que rima (mismo final de palabra) — cada
// ronda elige un grupo y muestra varias palabras de ESE mismo grupo juntas,
// para practicar encontrar rimas, no solo conceptos para improvisar.
type RhymeGroup = { ending: string; words: string[] }

const RHYME_GROUPS: RhymeGroup[] = [
  {
    ending: '-CIÓN / -SIÓN',
    words: [
      'RAZÓN', 'FUNCIÓN', 'ECUACIÓN', 'DIMENSIÓN', 'PERCEPCIÓN', 'COGNICIÓN', 'INDUCCIÓN',
      'DEDUCCIÓN', 'ABSTRACCIÓN', 'REVOLUCIÓN', 'EVOLUCIÓN', 'PROPOSICIÓN', 'DEFINICIÓN',
      'OBSERVACIÓN', 'INTUICIÓN', 'NEGACIÓN', 'AFIRMACIÓN', 'REPRESENTACIÓN', 'EXTENSIÓN',
      'COMPRENSIÓN', 'DIVISIÓN', 'DERIVACIÓN',
    ],
  },
  {
    ending: '-ÍA',
    words: [
      'FILOSOFÍA', 'GEOMETRÍA', 'ENERGÍA', 'TEORÍA', 'ANALOGÍA', 'EPISTEMOLOGÍA', 'ONTOLOGÍA',
      'ANATOMÍA', 'BIOLOGÍA', 'ASTRONOMÍA', 'PSICOLOGÍA', 'METODOLOGÍA', 'TAUTOLOGÍA',
      'FONOLOGÍA', 'MORFOLOGÍA', 'ETIMOLOGÍA', 'ARMONÍA', 'UTOPÍA', 'ANARQUÍA', 'JERARQUÍA',
      'SIMETRÍA', 'ENTROPÍA',
    ],
  },
  {
    ending: '-ISMO',
    words: [
      'EMPIRISMO', 'RACIONALISMO', 'IDEALISMO', 'MATERIALISMO', 'ESTRUCTURALISMO',
      'DETERMINISMO', 'RELATIVISMO', 'ESCEPTICISMO', 'DUALISMO', 'MONISMO', 'NIHILISMO',
      'POSITIVISMO', 'EXISTENCIALISMO', 'PRAGMATISMO', 'FORMALISMO', 'CONDUCTISMO',
    ],
  },
  {
    ending: '-DAD',
    words: [
      'REALIDAD', 'VERDAD', 'IDENTIDAD', 'CAUSALIDAD', 'PROBABILIDAD', 'SUBJETIVIDAD',
      'OBJETIVIDAD', 'COMPLEJIDAD', 'CONTINUIDAD', 'NECESIDAD', 'POSIBILIDAD', 'UNIDAD',
      'DUALIDAD', 'PLURALIDAD', 'SIMULTANEIDAD', 'TEMPORALIDAD',
    ],
  },
  {
    ending: '-ENCIA',
    words: [
      'CONCIENCIA', 'EXISTENCIA', 'COHERENCIA', 'INFERENCIA', 'DIFERENCIA', 'SECUENCIA',
      'FRECUENCIA', 'EXPERIENCIA', 'PERMANENCIA', 'TRASCENDENCIA', 'INDEPENDENCIA',
      'CONSISTENCIA', 'EQUIVALENCIA', 'REFERENCIA',
    ],
  },
  {
    ending: '-ICA',
    words: [
      'LÓGICA', 'FÍSICA', 'QUÍMICA', 'MATEMÁTICA', 'LINGÜÍSTICA', 'ESTADÍSTICA', 'DIALÉCTICA',
      'ÉTICA', 'ESTÉTICA', 'RETÓRICA', 'SEMÁNTICA', 'SINTÁCTICA', 'PRAGMÁTICA', 'GRAMÁTICA',
      'MECÁNICA', 'GENÉTICA', 'CIBERNÉTICA', 'METAFÍSICA', 'ANALÍTICA', 'DOGMÁTICA', 'AXIOMÁTICA',
    ],
  },
  {
    ending: '-ICO / -ICA (adjetivos)',
    words: [
      'LÓGICO', 'FÍSICO', 'QUÍMICO', 'MATEMÁTICO', 'FILOSÓFICO', 'EMPÍRICO', 'DIALÉCTICO',
      'SIMBÓLICO', 'ALGORÍTMICO', 'AXIOMÁTICO', 'SISTEMÁTICO', 'DOGMÁTICO', 'PRAGMÁTICO',
      'SEMÁNTICO', 'CÓSMICO', 'ATÓMICO', 'CUÁNTICO', 'ORGÁNICO', 'DINÁMICO', 'ESTÁTICO',
      'LINGÜÍSTICO', 'METAFÓRICO',
    ],
  },
  {
    ending: '-URA',
    words: ['ESTRUCTURA', 'FIGURA', 'CULTURA', 'CONJETURA', 'ARQUITECTURA', 'CRIATURA', 'LECTURA'],
  },
  {
    ending: '-EZA',
    words: ['NATURALEZA', 'CERTEZA', 'BELLEZA', 'SUTILEZA', 'GRANDEZA', 'PUREZA', 'EXTRAÑEZA'],
  },
  {
    ending: '-EMA / -OMA',
    words: [
      'TEOREMA', 'SISTEMA', 'PROBLEMA', 'DILEMA', 'ESQUEMA', 'FONEMA', 'MORFEMA', 'LEXEMA',
      'POEMA', 'AXIOMA', 'IDIOMA', 'SÍNTOMA', 'DIPLOMA',
    ],
  },
  {
    ending: '-ESIS / -ISIS',
    words: ['HIPÓTESIS', 'TESIS', 'SÍNTESIS', 'ANÁLISIS', 'ANTÍTESIS'],
  },
  {
    ending: '-ISTA',
    words: [
      'LINGÜISTA', 'ESTRUCTURALISTA', 'EMPIRISTA', 'IDEALISTA', 'MATERIALISTA', 'DUALISTA',
      'RELATIVISTA', 'DETERMINISTA', 'POSITIVISTA', 'EXISTENCIALISTA',
    ],
  },
  {
    ending: '-AL',
    words: [
      'CAUSAL', 'FORMAL', 'RACIONAL', 'IRRACIONAL', 'UNIVERSAL', 'ESTRUCTURAL', 'EXPERIMENTAL',
      'CONCEPTUAL', 'EXISTENCIAL', 'MENTAL', 'NATURAL', 'VIRTUAL', 'DIGITAL', 'FUNDAMENTAL',
      'ESPACIAL', 'TEMPORAL',
    ],
  },
  {
    ending: '-OR',
    words: ['VECTOR', 'FACTOR', 'VALOR', 'ERROR', 'RIGOR', 'AUTOR', 'MOTOR'],
  },
]

function sample<T>(pool: T[], n: number): T[] {
  const copy = [...pool]
  const picked: T[] = []
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length)
    picked.push(copy.splice(idx, 1)[0])
  }
  return picked
}

export default function RapLearningPage() {
  const [running, setRunning] = useState(false)
  const [group, setGroup] = useState<RhymeGroup | null>(null)
  const [words, setWords] = useState<string[]>([])
  const [intervalSec, setIntervalSec] = useState(6)
  const [tick, setTick] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function rollNext() {
    const g = RHYME_GROUPS[Math.floor(Math.random() * RHYME_GROUPS.length)]
    const n = Math.min(g.words.length, 6 + Math.floor(Math.random() * 5)) // 6..10, para que se note el volumen
    setGroup(g)
    setWords(sample(g.words, n))
    setTick((t) => t + 1)
  }

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!running) return
    rollNext()
    timerRef.current = setInterval(rollNext, intervalSec * 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, intervalSec])

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <style>{`
        @keyframes rapLearnProgressShrink { from { width: 100%; } to { width: 0%; } }
        @keyframes rapLearnFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{
        position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column',
        maxWidth: 960, margin: '0 auto', padding: '40px 24px 32px',
      }}>
        <Link href="/games" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${CYAN}66`, textDecoration: 'none',
          display: 'inline-block', marginBottom: 24,
        }}>
          ← VOLVER A PROXYGAMES
        </Link>

        <div style={{ fontSize: 9, color: `${CYAN}66`, letterSpacing: 6, marginBottom: 10 }}>
          // PROXYGAMES — FREESTYLE / APRENDIZAJE
        </div>
        <h1 style={{
          fontSize: 32, fontWeight: 700, letterSpacing: 6, color: CYAN,
          textShadow: `0 0 30px ${CYAN}44`, marginBottom: 10, lineHeight: 1,
        }}>
          APRENDIZAJE
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', lineHeight: 1.8, maxWidth: 600, marginBottom: 28 }}>
          Vocabulario grande de filosofía, ciencia, matemática y lingüística, ordenado por
          terminación que rima — cada ronda elige una terminación y tira varias palabras de
          ESE mismo grupo, para entrenar el oído a encontrar rimas, no solo a improvisar.
        </p>

        {/* Área de rima — ocupa el centro, crece con la pantalla. */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 280, border: `1px solid ${CYAN}33`, borderRadius: 12,
          background: `${CYAN}08`, padding: 24, marginBottom: 24, position: 'relative', overflow: 'hidden',
        }}>
          {!group ? (
            <div style={{ fontSize: 12, letterSpacing: 2, color: '#4a6080', textAlign: 'center' }}>
              TOCÁ "ARRANCAR" PARA EMPEZAR
            </div>
          ) : (
            <div key={tick} style={{ animation: 'rapLearnFadeIn 0.3s ease-out', textAlign: 'center' }}>
              <div style={{
                fontSize: 13, letterSpacing: 3, color: CYAN, marginBottom: 20,
                textShadow: `0 0 10px ${CYAN}88`,
              }}>
                RIMA: {group.ending}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 760 }}>
                {words.map((w, i) => (
                  <div key={i} style={{
                    fontSize: 20, fontWeight: 700, letterSpacing: 1, color: '#fff',
                    textShadow: `0 0 14px ${CYAN}aa`, padding: '9px 16px',
                    border: `1px solid ${CYAN}55`, borderRadius: 8, background: '#00141acc',
                  }}>
                    {w}
                  </div>
                ))}
              </div>
            </div>
          )}

          {running && (
            <div key={`bar-${tick}`} style={{
              position: 'absolute', bottom: 0, left: 0, height: 3, background: CYAN,
              animation: `rapLearnProgressShrink ${intervalSec}s linear forwards`,
            }} />
          )}
        </div>

        {/* Controles */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              fontFamily: mono, fontSize: 12, letterSpacing: 2, padding: '14px 28px', borderRadius: 8,
              cursor: 'pointer', background: running ? '#ff2b2b22' : `${CYAN}22`,
              border: `1px solid ${running ? '#ff2b2b' : CYAN}`, color: running ? '#ff6666' : CYAN,
            }}
          >
            {running ? 'PAUSAR' : 'ARRANCAR'}
          </button>
          <button
            onClick={rollNext}
            disabled={!running}
            style={{
              fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '14px 20px', borderRadius: 8,
              cursor: running ? 'pointer' : 'default', background: `${VIOLET}14`,
              border: `1px solid ${VIOLET}66`, color: running ? VIOLET : `${VIOLET}44`,
            }}
          >
            SIGUIENTE RIMA →
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', fontSize: 9, letterSpacing: 1.5, color: '#4a6080', marginBottom: 8 }}>
          <span>RITMO:</span>
          {[4, 6, 10].map((s) => (
            <button
              key={s}
              onClick={() => setIntervalSec(s)}
              style={{
                fontFamily: mono, fontSize: 9, letterSpacing: 1.5, padding: '6px 12px', borderRadius: 6,
                cursor: 'pointer', background: intervalSec === s ? `${CYAN}33` : 'transparent',
                border: `1px solid ${intervalSec === s ? CYAN : '#2a3a50'}`,
                color: intervalSec === s ? CYAN : '#4a6080',
              }}
            >
              {s}S
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/games/rap" style={{
            fontFamily: mono, fontSize: 9, letterSpacing: 2, color: `${VIOLET}88`, textDecoration: 'none',
          }}>
            → MODO LORE (conceptos del Proxyverse, sin agrupar por rima)
          </Link>
        </div>
      </div>
    </div>
  )
}
