'use client'

import { useEffect, useRef, useState } from 'react'

// ARCHIVO / ALIMENTACIÓN — página oculta, sin link desde ningún otro lugar
// del sitio (no está en nav-config.ts, no se referencia desde ninguna otra
// ruta). Solo se llega tipeando /archivo/alimentacion directo en la barra.
// Infografía de nutrición y ciencia de la alimentación, con eje biohacking,
// en español (registro rioplatense — "vos"), con el mismo lenguaje visual
// que el resto de /archivo: fondo casi negro, paneles de vidrio con borde
// de color y glow, tipografía Space Mono, headers en mayúscula con
// letter-spacing. Acento propio de esta página: verde lima / biohacking
// #b4e61d, distinto de los acentos ya usados en el resto del sitio
// (fabricación azul, laboratorio naranja, experimental rojo, conocimiento
// violeta, proxyverse verde-menta, manifiesto dorado, particulas cian,
// mente magenta, lenguaje verde-teal).
//
// Esto es contenido educativo de referencia, NO asesoramiento médico ni
// nutricional personalizado (ver sello de documento, campo ALCANCE). Los
// valores de referencia diaria citados son cifras de guías públicas tipo
// DRI/RDA — se presentan como rangos, no como prescripción individual. La
// sección final (XIV) separa explícitamente lo que es ciencia consensuada
// de lo que es terreno de investigación activa o debate abierto.

const mono = "'Space Mono', monospace"
const ACCENT = '#b4e61d'
const TEXT = '#c8daf0'
const TEXT_DIM = '#8fb8d6'
const LABEL_DIM = '#4a6080'

// ---------------------------------------------------------------------------
// Bloques de layout reutilizables
// ---------------------------------------------------------------------------

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(8, 14, 2, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(180,230,29,0.02)`,
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
        <span style={{ fontSize: 13, color: `${ACCENT}66`, letterSpacing: 2 }}>{roman}</span>
        <h2
          style={{
            fontSize: 'clamp(18px, 3vw, 24px)',
            letterSpacing: 5,
            color: ACCENT,
            textShadow: `0 0 24px ${ACCENT}44`,
            margin: 0,
            fontWeight: 700,
          }}
        >
          {title}
        </h2>
      </div>
      {sub && (
        <div style={{ fontSize: 10, letterSpacing: 1, color: LABEL_DIM, marginTop: 8, paddingLeft: 32 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9.5,
        lineHeight: 1.8,
        letterSpacing: 0.5,
        color: LABEL_DIM,
        marginTop: 14,
        borderLeft: `2px solid ${ACCENT}33`,
        paddingLeft: 12,
      }}
    >
      {children}
    </div>
  )
}

function Stat({ label, value, color = ACCENT }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 9 }}>
      <span style={{ color: `${color}99`, letterSpacing: 1.5 }}>{label}</span>
      <span style={{ color: '#e8f2ff', letterSpacing: 0.3, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11.5, lineHeight: 2, letterSpacing: 0.3, color: TEXT_DIM, marginTop: 0, marginBottom: 14 }}>
      {children}
    </p>
  )
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span style={{ color: '#fff', fontWeight: 700 }}>{children}</span>
}

// ---------------------------------------------------------------------------
// Datos — macronutrientes
// ---------------------------------------------------------------------------
type MacroKcal = { label: string; kcal: number }
const MACRO_KCAL: MacroKcal[] = [
  { label: 'Proteínas', kcal: 4 },
  { label: 'Carbohidratos', kcal: 4 },
  { label: 'Grasas', kcal: 9 },
]

type AmdrRange = { label: string; min: number; max: number }
const AMDR: AmdrRange[] = [
  { label: 'Carbohidratos', min: 45, max: 65 },
  { label: 'Grasas', min: 20, max: 35 },
  { label: 'Proteínas', min: 10, max: 35 },
]

const ESSENTIAL_AMINO_ACIDS = [
  'Histidina', 'Isoleucina', 'Leucina', 'Lisina', 'Metionina',
  'Fenilalanina', 'Treonina', 'Triptófano', 'Valina',
]

// ---------------------------------------------------------------------------
// Datos — vitaminas y minerales
// ---------------------------------------------------------------------------
type NutrientRow = { nombre: string; rda: string; funcion: string; fuente: string; nota?: string }

const VITAMINS_LIPOSOLUBLE: NutrientRow[] = [
  { nombre: 'A', rda: '~700–900 mcg RAE/día', funcion: 'Visión, inmunidad', fuente: 'Hígado, zanahoria, batata' },
  { nombre: 'D', rda: '~15–20 mcg (600–800 UI)/día', funcion: 'Absorción de calcio, hueso, inmunidad', fuente: 'Sol, pescados grasos, alimentos fortificados' },
  { nombre: 'E', rda: '~15 mg/día', funcion: 'Antioxidante', fuente: 'Frutos secos, semillas, aceites vegetales' },
  { nombre: 'K', rda: '~90–120 mcg/día', funcion: 'Coagulación, hueso', fuente: 'Vegetales de hoja verde' },
]

const VITAMINS_HIDROSOLUBLE: NutrientRow[] = [
  { nombre: 'B1 (tiamina)', rda: '~1.1–1.2 mg/día', funcion: 'Metabolismo energético', fuente: 'Cereales integrales, cerdo' },
  { nombre: 'B2 (riboflavina)', rda: '~1.1–1.3 mg/día', funcion: 'Metabolismo energético', fuente: 'Lácteos, huevo' },
  { nombre: 'B3 (niacina)', rda: '~14–16 mg/día', funcion: 'Metabolismo energético, reparación de ADN', fuente: 'Carne, pescado, cereales' },
  { nombre: 'B6', rda: '~1.3–1.7 mg/día', funcion: 'Síntesis de neurotransmisores', fuente: 'Pollo, pescado, papa' },
  { nombre: 'B9 (folato)', rda: '~400 mcg/día', funcion: 'Síntesis de ADN', fuente: 'Vegetales de hoja, legumbres', nota: 'crítico durante el embarazo — previene defectos del tubo neural' },
  { nombre: 'B12', rda: '~2.4 mcg/día', funcion: 'Función nerviosa, glóbulos rojos', fuente: 'Carne, pescado, lácteos', nota: 'ausente en fuentes vegetales — punto real a resolver en dietas veganas (suplementación o fortificación)' },
  { nombre: 'C', rda: '~75–90 mg/día', funcion: 'Síntesis de colágeno, antioxidante, inmunidad', fuente: 'Cítricos, pimiento' },
]

const MINERALS: NutrientRow[] = [
  { nombre: 'Calcio', rda: '~1000–1200 mg/día', funcion: 'Hueso, contracción muscular, señalización nerviosa', fuente: 'Lácteos, vegetales de hoja' },
  { nombre: 'Hierro', rda: '~8 mg/día (hombres) / ~18 mg/día (mujeres en edad fértil)', funcion: 'Transporte de oxígeno (hemoglobina)', fuente: 'Carne roja, legumbres, espinaca', nota: 'hierro hemo (fuentes animales) se absorbe mejor que el no-hemo (vegetal); la vitamina C mejora la absorción del no-hemo' },
  { nombre: 'Magnesio', rda: '~310–420 mg/día', funcion: 'Función muscular/nerviosa, producción de ATP, cofactor de cientos de enzimas', fuente: 'Frutos secos, semillas, hoja verde' },
  { nombre: 'Zinc', rda: '~8–11 mg/día', funcion: 'Inmunidad, cicatrización, gusto', fuente: 'Carne, mariscos, legumbres' },
  { nombre: 'Potasio', rda: '~2600–3400 mg/día', funcion: 'Presión arterial, función muscular/nerviosa', fuente: 'Banana, papa, hoja verde', nota: 'cifra de guías recientes, comúnmente citada' },
  { nombre: 'Sodio', rda: 'límite superior ~2300 mg/día', funcion: 'Balance de fluidos, función nerviosa', fuente: '—', nota: 'es un techo a no superar, no un objetivo a maximizar' },
  { nombre: 'Yodo', rda: '~150 mcg/día', funcion: 'Producción de hormona tiroidea', fuente: 'Sal yodada, mariscos' },
  { nombre: 'Selenio', rda: '~55 mcg/día', funcion: 'Antioxidante, función tiroidea', fuente: 'Nueces de Brasil (fuente excepcionalmente concentrada), mariscos' },
]

// ---------------------------------------------------------------------------
// Datos — micronutrientes para la mente
// ---------------------------------------------------------------------------
type MindNutrient = { title: string; detail: string }
const MIND_NUTRIENTS: MindNutrient[] = [
  { title: 'DHA (OMEGA-3)', detail: 'Componente estructural de las membranas neuronales — se concentra especialmente en la sustancia gris y la retina. Ligado a la fluidez de la membrana y a la función sináptica.' },
  { title: 'COLINA', detail: 'Precursor directo de la acetilcolina, neurotransmisor clave para la atención y la memoria. Fuentes densas: huevo (yema), hígado.' },
  { title: 'B12 Y HIERRO', detail: 'Ambos necesarios para la función nerviosa normal; su deficiencia se asocia de forma bien documentada a fatiga mental y, en casos severos, a deterioro cognitivo.' },
  { title: 'MAGNESIO', detail: 'Interviene en la regulación de la excitabilidad nerviosa — se lo asocia a relajación y calidad del sueño, aunque la evidencia específica para esos usos es parcial (ver Sección XII).' },
  { title: 'VITAMINA D', detail: 'El tejido cerebral expresa receptores de vitamina D. Su deficiencia es común, sobre todo en climas con poca exposición solar — la relación exacta con el estado de ánimo y la cognición sigue en estudio.' },
]

// ---------------------------------------------------------------------------
// Datos — grupos alimentarios
// ---------------------------------------------------------------------------
type FoodGroup = { title: string; funcion: string; ejemplos: string; porcion: string }
const FOOD_GROUPS: FoodGroup[] = [
  { title: 'VERDURAS', funcion: 'Fibra, vitaminas, minerales, fitoquímicos — baja densidad calórica', ejemplos: 'hoja verde, crucíferas, zanahoria, zapallo', porcion: '≈ 2–3 porciones/día, variando color y tipo' },
  { title: 'FRUTAS', funcion: 'Vitaminas (especialmente C), fibra, azúcares naturales con la fibra intacta', ejemplos: 'cítricos, banana, frutos rojos, manzana', porcion: '≈ 2 porciones/día' },
  { title: 'CEREALES INTEGRALES', funcion: 'Carbohidrato complejo, fibra, energía sostenida', ejemplos: 'avena, arroz integral, quinoa, pan integral', porcion: 'preferir integral sobre refinado en la mayoría de las comidas' },
  { title: 'LEGUMBRES', funcion: 'Proteína vegetal, fibra, hierro no-hemo', ejemplos: 'lentejas, garbanzos, porotos, arvejas', porcion: '≈ varias veces por semana' },
  { title: 'PROTEÍNAS MAGRAS', funcion: 'Aminoácidos esenciales, hierro, zinc, B12 (en fuentes animales)', ejemplos: 'pescado, pollo, huevo, carnes magras, tofu', porcion: 'repartida en varias comidas, no concentrada en una sola' },
  { title: 'LÁCTEOS / ALTERNATIVAS', funcion: 'Calcio, proteína, vitamina D (si está fortificada)', ejemplos: 'leche, yogur, quesos, alternativas fortificadas', porcion: '≈ 2–3 porciones/día' },
  { title: 'GRASAS SALUDABLES', funcion: 'Omega-3/6, vitaminas liposolubles, estructura de membrana celular', ejemplos: 'aceite de oliva, palta, frutos secos, pescados grasos', porcion: 'con moderación — densidad calórica alta (9 kcal/g)' },
]

// ---------------------------------------------------------------------------
// Datos — biohacking / timing nutricional
// ---------------------------------------------------------------------------
type FastingProtocol = { title: string; detail: string }
const FASTING_PROTOCOLS: FastingProtocol[] = [
  { title: '16:8', detail: 'Ventana de alimentación de 8 horas, ayuno de 16 — el protocolo de ayuno intermitente más popular y más fácil de sostener en el día a día.' },
  { title: '5:2', detail: 'Alimentación normal 5 días de la semana, restricción calórica severa (≈500–600 kcal) los otros 2, no consecutivos.' },
  { title: 'DÍA ALTERNADO', detail: 'Alternancia estricta entre un día de alimentación normal y un día de ayuno o restricción severa — el protocolo más exigente de sostener.' },
]

type Supplement = { title: string; detail: string }
const SUPPLEMENTS: Supplement[] = [
  { title: 'CREATINA', detail: 'Uno de los suplementos más estudiados que existen. ~3–5 g/día de mantenimiento. Evidencia sólida para fuerza y masa muscular; la investigación sobre posibles efectos cognitivos está en curso, sin conclusión cerrada todavía.' },
  { title: 'OMEGA-3 / ACEITE DE PESCADO', detail: 'Cubre ALA/EPA/DHA cuando la dieta no alcanza los rangos comúnmente citados (Sección V) — relevante sobre todo con bajo consumo de pescado graso.' },
  { title: 'VITAMINA D', detail: 'Deficiencia muy común, en especial en climas con poca exposición solar o estilos de vida mayormente en interiores.' },
  { title: 'MAGNESIO', detail: 'Déficit relativamente común en la dieta moderna — evidencia mixta y parcial para sueño y relajación: un uso extendido en biohacking, pero sin sobrevender la certeza de ese beneficio específico.' },
  { title: 'CAFEÍNA', detail: 'Efecto cognitivo real y bien documentado (alerta, atención sostenida). Límite superior comúnmente citado de ~400 mg/día para adultos sanos sin condiciones que lo contraindiquen.' },
]

// ---------------------------------------------------------------------------
// Datos — línea de tiempo de la ciencia de la nutrición
// ---------------------------------------------------------------------------
type TimelineEntry = { year: string; title: string; detail: string }
const NUTRITION_TIMELINE: TimelineEntry[] = [
  { year: '1747', title: 'El experimento del escorbuto', detail: 'James Lind realiza, a bordo de un barco de la marina británica, uno de los primeros ensayos controlados de la historia de la medicina: marineros con escorbuto reciben distintos tratamientos, y los que comen cítricos mejoran — décadas antes de aislarse la vitamina C.' },
  { year: '1897', title: 'Beriberi y arroz pulido', detail: 'Christiaan Eijkman liga el beriberi al consumo de arroz pulido (sin cáscara) en las Indias Orientales Holandesas — el origen del descubrimiento de la tiamina (B1). Recibe el Nobel en 1929.' },
  { year: '1912', title: 'Se acuña "vitamina"', detail: 'Casimir Funk propone el término "vitamina" (vital + amina) para las sustancias orgánicas esenciales presentes en trazas en los alimentos.' },
  { year: '1922', title: 'Vitamina D y raquitismo', detail: 'Elmer McCollum liga la vitamina D a la prevención del raquitismo.' },
  { year: '~1926–1929', title: 'B12 y anemia perniciosa', detail: 'George Minot y William Murphy ligan un factor dietario (hoy identificado como B12) a la cura de la anemia perniciosa.' },
  { year: '1932', title: 'Se aísla la vitamina C', detail: 'Albert Szent-Györgyi y Walter Haworth aíslan y caracterizan químicamente el ácido ascórbico (vitamina C).' },
  { year: '1941', title: 'Primeras RDA', detail: 'Se publican en EE.UU. las primeras Recommended Dietary Allowances — el origen del tipo de cifras de referencia diaria que todavía se usan hoy, revisadas y actualizadas.' },
  { year: '2007', title: 'Human Microbiome Project', detail: 'Arranca el estudio sistemático y a gran escala de la microbiota humana — el punto de partida de buena parte de lo que hoy se sabe sobre el eje intestino-cerebro (Sección XI).' },
]

// ---------------------------------------------------------------------------
// Datos — fronteras abiertas
// ---------------------------------------------------------------------------
type Frontier = { title: string; detail: string }
const FRONTIER_TOPICS: Frontier[] = [
  { title: 'NUTRIGENÓMICA Y NUTRICIÓN PERSONALIZADA POR PERFIL GENÉTICO', detail: 'La idea de ajustar recomendaciones dietarias según variantes genéticas individuales es un campo emergente, con resultados preliminares interesantes, pero todavía no es una ciencia madura ni traducible a recomendaciones firmes de uso general.' },
  { title: 'RESTRICCIÓN CALÓRICA Y LONGEVIDAD', detail: 'Extensamente estudiada en modelos animales (desde levaduras hasta primates), donde extiende la vida útil en varias especies. La evidencia en humanos es mucho más limitada —no hay forma ética de correr el experimento ideal a largo plazo— y los resultados disponibles son objeto de debate activo.' },
  { title: 'AYUNO PROLONGADO', detail: 'Interés creciente, tanto popular como de investigación, pero la evidencia sólida para muchos de los beneficios que se le atribuyen más allá de la pérdida de peso todavía está en desarrollo, no asentada.' },
  { title: 'MICROBIOMA Y NUTRICIÓN DE PRECISIÓN', detail: 'Área de investigación muy activa — pero en la mayoría de los hallazgos sobre microbiota y salud, si la relación es causal o solo correlacional todavía no está del todo clara.' },
]

// ---------------------------------------------------------------------------
// Diagramas y gráficos — SVG e inline, sin librerías
// ---------------------------------------------------------------------------

function MacroKcalChart() {
  const maxKcal = 10
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {MACRO_KCAL.map(m => (
        <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 118, fontSize: 11, color: '#fff', letterSpacing: 1, flexShrink: 0 }}>{m.label}</div>
          <div style={{ flexGrow: 1, height: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                width: `${(m.kcal / maxKcal) * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${ACCENT}44, ${ACCENT})`,
                boxShadow: `0 0 8px ${ACCENT}66`,
              }}
            />
          </div>
          <div style={{ width: 76, fontSize: 10.5, color: `${ACCENT}cc`, flexShrink: 0 }}>{m.kcal} kcal/g</div>
        </div>
      ))}
    </div>
  )
}

function AmdrChart() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {AMDR.map(a => (
        <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 118, fontSize: 11, color: '#fff', letterSpacing: 1, flexShrink: 0 }}>{a.label}</div>
          <div style={{ flexGrow: 1, height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                left: `${a.min}%`,
                width: `${a.max - a.min}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${ACCENT}55, ${ACCENT}aa)`,
                boxShadow: `0 0 8px ${ACCENT}55`,
              }}
            />
          </div>
          <div style={{ width: 90, fontSize: 10, color: `${ACCENT}cc`, flexShrink: 0 }}>{a.min}–{a.max}%</div>
        </div>
      ))}
      <div style={{ fontSize: 9, letterSpacing: 0.5, color: LABEL_DIM, marginTop: 2 }}>
        % de las calorías diarias totales — AMDR (Acceptable Macronutrient Distribution Range), rango comúnmente publicado
      </div>
    </div>
  )
}

function AminoAcidGrid() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {ESSENTIAL_AMINO_ACIDS.map(a => (
        <div
          key={a}
          style={{
            border: `1px solid ${ACCENT}55`,
            borderRadius: 20,
            padding: '7px 16px',
            fontSize: 10,
            letterSpacing: 1,
            color: ACCENT,
            background: `${ACCENT}0d`,
          }}
        >
          {a.toUpperCase()}
        </div>
      ))}
    </div>
  )
}

function NutrientTable({ rows }: { rows: NutrientRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
        <thead>
          <tr>
            {['NOMBRE', 'VALOR DE REFERENCIA (adulto, aprox.)', 'FUNCIÓN', 'FUENTE'].map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: 'left',
                  fontSize: 9.5,
                  letterSpacing: 1.5,
                  color: ACCENT,
                  borderBottom: `1px solid ${ACCENT}55`,
                  padding: '10px 14px',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.nombre} style={{ background: i % 2 === 0 ? 'rgba(180,230,29,0.03)' : 'transparent' }}>
              <td style={{ padding: '12px 14px', fontSize: 11, color: '#fff', letterSpacing: 0.5, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                {row.nombre}
              </td>
              <td style={{ padding: '12px 14px', fontSize: 10, color: TEXT_DIM, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                {row.rda}
              </td>
              <td style={{ padding: '12px 14px', fontSize: 10.5, lineHeight: 1.6, color: TEXT, verticalAlign: 'top' }}>
                {row.funcion}
              </td>
              <td style={{ padding: '12px 14px', fontSize: 10, lineHeight: 1.6, color: TEXT_DIM, verticalAlign: 'top' }}>
                {row.fuente}
                {row.nota && <div style={{ color: LABEL_DIM, marginTop: 4, fontSize: 9 }}>— {row.nota}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FoodGroupCard({ g }: { g: FoodGroup }) {
  return (
    <div
      style={{
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        padding: '18px 18px 16px',
        background: 'rgba(8, 14, 2, 0.4)',
      }}
    >
      <div style={{ fontSize: 11.5, letterSpacing: 1.5, color: ACCENT, marginBottom: 10, textShadow: `0 0 10px ${ACCENT}44` }}>
        {g.title}
      </div>
      <div style={{ fontSize: 10, lineHeight: 1.7, color: TEXT_DIM, marginBottom: 10 }}>{g.funcion}</div>
      <div style={{ fontSize: 9.5, color: TEXT, marginBottom: 6 }}>
        <span style={{ color: LABEL_DIM }}>EJEMPLOS — </span>{g.ejemplos}
      </div>
      <div style={{ fontSize: 9, color: LABEL_DIM }}>{g.porcion}</div>
    </div>
  )
}

function GutBrainDiagram() {
  return (
    <svg viewBox="0 0 640 300" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* cerebro (simplificado) */}
      <ellipse cx="130" cy="90" rx="92" ry="66" fill={`${ACCENT}14`} stroke={ACCENT} strokeWidth={2} />
      <path d="M70,70 C85,55 105,50 130,52 M70,100 C90,112 110,110 125,98 M150,55 C175,58 192,75 190,95"
        stroke={`${ACCENT}99`} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <text x="130" y="178" fontSize="12" letterSpacing="2" fill={ACCENT} fontFamily={mono} textAnchor="middle">CEREBRO</text>

      {/* intestino (simplificado, forma serpenteante) */}
      <path
        d="M440,70 C500,70 500,110 460,120 C420,130 420,165 460,175 C500,185 500,225 450,228 C400,231 395,195 420,180"
        fill="none" stroke={ACCENT} strokeWidth={14} strokeLinecap="round" opacity={0.35}
      />
      <path
        d="M440,70 C500,70 500,110 460,120 C420,130 420,165 460,175 C500,185 500,225 450,228 C400,231 395,195 420,180"
        fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round"
      />
      <text x="455" y="260" fontSize="12" letterSpacing="2" fill={ACCENT} fontFamily={mono} textAnchor="middle">INTESTINO</text>

      {/* nervio vago — línea de comunicación bidireccional */}
      <line x1="222" y1="110" x2="400" y2="110" stroke={`${ACCENT}aa`} strokeWidth={2} strokeDasharray="3,4" />
      <path d="M232,104 l-10,6 l10,6 Z" fill={ACCENT} />
      <path d="M390,104 l10,6 l-10,6 Z" fill={ACCENT} />
      <text x="310" y="95" fontSize="9.5" letterSpacing="1" fill={ACCENT} fontFamily={mono} textAnchor="middle">NERVIO VAGO</text>
      <text x="310" y="130" fontSize="8" letterSpacing="0.3" fill={LABEL_DIM} fontFamily={mono} textAnchor="middle">
        comunicación bidireccional, de las vías más estudiadas del eje intestino-cerebro
      </text>

      {/* datos clave */}
      <text x="310" y="200" fontSize="9" letterSpacing="0.3" fill={TEXT_DIM} fontFamily={mono} textAnchor="middle">
        ≈ 90% de la serotonina corporal se produce en el intestino
      </text>
      <text x="310" y="218" fontSize="9" letterSpacing="0.3" fill={TEXT_DIM} fontFamily={mono} textAnchor="middle">
        proporción bacterias:células humanas ≈ 1:1 (estimación revisada, Sender et al. 2016)
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Línea de tiempo — fila
// ---------------------------------------------------------------------------
function TimelineRow({ entry, isLast }: { entry: TimelineEntry; isLast: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14, flexShrink: 0 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 10px ${ACCENT}aa`, flexShrink: 0, marginTop: 4 }} />
        {!isLast && <div style={{ width: 1, flexGrow: 1, background: `${ACCENT}33`, marginTop: 4 }} />}
      </div>
      <div style={{ paddingBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT, letterSpacing: 1, textShadow: `0 0 10px ${ACCENT}55` }}>{entry.year}</span>
          <span style={{ fontSize: 11, letterSpacing: 1, color: '#fff' }}>{entry.title}</span>
        </div>
        <div style={{ fontSize: 10, lineHeight: 1.7, color: TEXT_DIM, marginTop: 6, maxWidth: 580 }}>{entry.detail}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sección con reveal — IntersectionObserver
// ---------------------------------------------------------------------------
function Section({
  idx, registerRef, visible, children, last, id,
}: {
  idx: number
  registerRef: (idx: number) => (el: HTMLDivElement | null) => void
  visible: boolean[]
  children: React.ReactNode
  last?: boolean
  id?: string
}) {
  return (
    <div
      id={id}
      ref={registerRef(idx)}
      data-idx={idx}
      className={`ntr-section ${visible[idx] ? 'is-visible' : ''}`}
      style={{
        maxWidth: 780, margin: '0 auto', padding: idx === 0 ? '0 24px 120px' : `100px 24px ${last ? 60 : 120}px`,
        borderTop: idx === 0 ? undefined : `1px solid ${ACCENT}14`,
        scrollMarginTop: 40,
      }}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

const TOTAL_SECTIONS = 14

export default function AlimentacionPage() {
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const [visible, setVisible] = useState<boolean[]>(() => Array(TOTAL_SECTIONS).fill(false))

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
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
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' })

    sectionRefs.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const registerRef = (idx: number) => (el: HTMLDivElement | null) => {
    sectionRefs.current[idx] = el
  }

  let sIdx = 0
  const nextIdx = () => sIdx++

  return (
    <div style={{ background: '#000205', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* encabezado */}
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '104px 24px 0' }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-NTR-00 // DOCUMENTO TÉCNICO ARCHIVADO
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 44px)',
              fontWeight: 700,
              letterSpacing: 8,
              color: ACCENT,
              textShadow: `0 0 40px ${ACCENT}55`,
              marginBottom: 14,
              lineHeight: 1.05,
            }}
          >
            PROTOCOLO DE ALIMENTACIÓN
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            NUTRICIÓN Y CIENCIA DE LA ALIMENTACIÓN — PARA EL CUERPO Y LA MENTE
          </div>
          <p
            style={{
              fontSize: 11.5,
              lineHeight: 2.1,
              letterSpacing: 0.3,
              color: TEXT_DIM,
              maxWidth: 640,
              borderLeft: `1px solid ${ACCENT}33`,
              paddingLeft: 24,
              marginBottom: 32,
            }}
          >
            El cuerpo no procesa comida — procesa información. Cada macronutriente, cada vitamina,
            cada molécula que entra por la boca termina convertida en una señal: energía disponible,
            precursor de un neurotransmisor, cofactor de una enzima, instrucción para una bacteria
            intestinal. El eje intestino-cerebro (Sección XI) es el hilo que atraviesa todo el
            documento: lo que comés no solo mueve el cuerpo, también calibra la mente. Catorce capas,
            del macronutriente individual al debate todavía sin resolver.
          </p>

          {/* sello de documento */}
          <div
            style={{
              display: 'inline-grid',
              gridTemplateColumns: 'auto auto',
              gap: '4px 24px',
              fontSize: 9,
              letterSpacing: 1,
              color: `${ACCENT}99`,
              border: `1px solid ${ACCENT}33`,
              padding: '12px 18px',
              marginBottom: 32,
              maxWidth: 640,
            }}
          >
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>NO RESTRINGIDA — REFERENCIA DRI/RDA PÚBLICA</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 14 SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>REFERENCIA EDUCATIVA — NO ES ASESORAMIENTO MÉDICO NI NUTRICIONAL PERSONALIZADO</span>
          </div>

          {/* índice */}
          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 640, marginBottom: 90 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>
              ÍNDICE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '6px 20px' }}>
              {[
                ['I', 'sec-01', 'Introducción'],
                ['II', 'sec-02', 'Macronutrientes'],
                ['III', 'sec-03', 'Proteínas'],
                ['IV', 'sec-04', 'Carbohidratos'],
                ['V', 'sec-05', 'Grasas'],
                ['VI', 'sec-06', 'Vitaminas'],
                ['VII', 'sec-07', 'Minerales'],
                ['VIII', 'sec-08', 'Micronutrientes para la mente'],
                ['IX', 'sec-09', 'Hidratación'],
                ['X', 'sec-10', 'Grupos alimentarios'],
                ['XI', 'sec-11', 'Eje intestino-cerebro y microbiota'],
                ['XII', 'sec-12', 'Timing nutricional y biohacking'],
                ['XIII', 'sec-13', 'Línea de tiempo'],
                ['XIV', 'sec-14', 'Fronteras abiertas'],
              ].map(([roman, id, label]) => (
                <a key={id} href={`#${id}`} style={{ fontSize: 10.5, color: TEXT_DIM, textDecoration: 'none', display: 'flex', gap: 10 }}>
                  <span style={{ color: `${ACCENT}88`, width: 26, flexShrink: 0 }}>{roman}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* I. INTRODUCCIÓN */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-01">
          <SectionHeader roman="I" title="INTRODUCCIÓN" />
          <P>
            Durante buena parte del siglo XX, "nutrición" significó casi exclusivamente{' '}
            <Mono>calorías</Mono>: combustible entrando y saliendo. Es una parte real del cuadro, pero
            incompleta. Cada nutriente es también <Mono>información</Mono>: un aminoácido puede ser
            ladrillo estructural o precursor de un neurotransmisor; un ácido graso puede ser reserva
            energética o parte de la membrana de una neurona; una fibra no digerible por el cuerpo
            humano puede ser, para una bacteria intestinal, su única fuente de energía — y el producto
            de esa fermentación bacteriana, a su vez, una señal que llega al cerebro.
          </P>
          <P>
            Ese último ejemplo no es casual: se lo desarrolla en profundidad en la Sección XI, pero
            funciona como el hilo conductor de todo el documento. El <Mono>eje intestino-cerebro</Mono>{' '}
            — la comunicación bidireccional entre el sistema digestivo y el sistema nervioso central,
            en parte vía el nervio vago, en parte vía moléculas producidas por la microbiota — es el
            punto donde "comer para el cuerpo" y "comer para la mente" dejan de ser dos preguntas
            distintas.
          </P>
          <Caption>
            Este documento es una referencia educativa general, no asesoramiento médico ni
            nutricional personalizado — ver el campo ALCANCE del sello de documento, arriba. Los
            valores de referencia diaria citados en todo el texto son cifras de guías públicas tipo
            DRI/RDA, presentadas como rangos (varían por sexo, edad y nivel de actividad), no como
            prescripción individual.
          </Caption>
        </Section>

        {/* II. MACRONUTRIENTES */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-02">
          <SectionHeader roman="II" title="MACRONUTRIENTES" sub="densidad calórica y proporción diaria recomendada" />
          <P>
            Los tres macronutrientes aportan energía en cantidades muy distintas por gramo — la grasa
            tiene más del doble de densidad calórica que la proteína o el carbohidrato:
          </P>
          <Panel>
            <MacroKcalChart />
            <Caption>
              Nota al margen: el alcohol también aporta calorías — 7 kcal/g — sin ser un macronutriente
              esencial ni cumplir ninguna función estructural o metabólica necesaria.
            </Caption>
          </Panel>
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: TEXT_DIM, marginBottom: 12 }}>
              AMDR — RANGO ACEPTABLE DE DISTRIBUCIÓN DE MACRONUTRIENTES
            </div>
            <Panel>
              <AmdrChart />
            </Panel>
          </div>
        </Section>

        {/* III. PROTEÍNAS */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-03">
          <SectionHeader roman="III" title="PROTEÍNAS" />
          <P>
            Función estructural (músculo, piel, colágeno), enzimática (casi toda reacción metabólica
            depende de una enzima proteica), inmune (anticuerpos) y de transporte (la hemoglobina
            transporta oxígeno). De los 20 aminoácidos que forman las proteínas humanas, 9 son{' '}
            <Mono>esenciales</Mono>: el cuerpo no puede sintetizarlos, tienen que venir de la dieta.
          </P>
          <Panel>
            <AminoAcidGrid />
          </Panel>
          <P>
            Una fuente <Mono>completa</Mono> aporta los 9 en proporción suficiente (carne, pescado,
            huevo, lácteos, soja, quinoa). La mayoría de las fuentes vegetales individuales son{' '}
            <Mono>incompletas</Mono> — pero combinaciones complementarias, como arroz + legumbres,
            cubren el perfil completo sin necesidad de que cada alimento por separado sea completo.
          </P>
          <P>
            Ingesta de referencia: ≈ 0.8 g/kg de peso corporal/día para un adulto sedentario (cifra RDA
            estándar). La literatura de nutrición deportiva cita habitualmente un rango más alto para
            personas muy activas o deportistas — ≈ 1.2–2.0 g/kg/día — presentado como rango
            comúnmente citado en ese campo, no como una RDA formal.
          </P>
        </Section>

        {/* IV. CARBOHIDRATOS */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-04">
          <SectionHeader roman="IV" title="CARBOHIDRATOS" />
          <P>
            <Mono>Simples</Mono> (azúcares de una o dos unidades, absorción rápida) frente a{' '}
            <Mono>complejos</Mono> (cadenas largas de almidón, digestión más gradual). El{' '}
            <Mono>índice glucémico</Mono> describe qué tan rápido un alimento eleva la glucosa en
            sangre respecto de una referencia — útil como concepto, aunque en la práctica el efecto
            real de una comida depende también de con qué se combine ese carbohidrato (fibra, grasa,
            proteína en la misma comida lo modera).
          </P>
          <P>
            La <Mono>fibra</Mono> es, técnicamente, un carbohidrato que el cuerpo humano no puede
            digerir — y precisamente por eso cumple funciones clave: tránsito intestinal, saciedad, y
            sustrato de fermentación para la microbiota (Sección XI). Objetivo comúnmente citado:
            ≈ 25–38 g/día (varía según la guía y el sexo).
          </P>
          <P>
            Fuentes de carbohidrato complejo con fibra: legumbres, cereales integrales, verduras,
            frutas enteras. Fuentes de carbohidrato simple sin fibra acompañante: azúcar de mesa,
            bebidas azucaradas, harinas refinadas.
          </P>
        </Section>

        {/* V. GRASAS */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-05">
          <SectionHeader roman="V" title="GRASAS" sub="el macronutriente más denso — y el más ligado a la estructura del cerebro" />
          <P>
            Saturadas, insaturadas (mono y poliinsaturadas) y trans — esta última, prácticamente sin
            ninguna función biológica deseable, asociada de forma consistente a peor perfil
            cardiovascular. Dentro de las poliinsaturadas, dos familias esenciales: <Mono>omega-3</Mono>{' '}
            (ALA — de origen vegetal — y sus derivados EPA/DHA, principalmente de pescados grasos) y{' '}
            <Mono>omega-6</Mono> (muy presente en aceites vegetales comunes).
          </P>
          <Panel>
            <Stat label="CEREBRO — GRASA SOBRE PESO SECO" value="≈ 60%" />
            <Caption>
              Cifra real y comúnmente citada: descontando el agua, el cerebro humano es
              aproximadamente 60% grasa — el órgano más rico en lípidos del cuerpo después del tejido
              adiposo mismo. Buena parte de esa grasa forma las membranas neuronales y la vaina de
              mielina.
            </Caption>
          </Panel>
          <P>
            Ingesta comúnmente citada: ALA ≈ 1.1–1.6 g/día; EPA + DHA combinados, a menudo entre
            ≈ 250–500 mg/día en guías generales de salud — presentado como rango habitual, no como
            prescripción estricta.
          </P>
        </Section>

        {/* VI. VITAMINAS */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-06">
          <SectionHeader roman="VI" title="VITAMINAS" sub="liposolubles (se almacenan en grasa corporal) e hidrosolubles (se eliminan por orina, exceso mayormente no se acumula)" />
          <Panel style={{ padding: '20px 20px 26px', marginBottom: 20 }}>
            <div style={{ fontSize: 9.5, letterSpacing: 2, color: `${ACCENT}99`, marginBottom: 14 }}>
              LIPOSOLUBLES — A, D, E, K
            </div>
            <NutrientTable rows={VITAMINS_LIPOSOLUBLE} />
          </Panel>
          <Panel style={{ padding: '20px 20px 26px' }}>
            <div style={{ fontSize: 9.5, letterSpacing: 2, color: `${ACCENT}99`, marginBottom: 14 }}>
              HIDROSOLUBLES — COMPLEJO B Y C
            </div>
            <NutrientTable rows={VITAMINS_HIDROSOLUBLE} />
          </Panel>
          <Caption>
            Los valores son aproximados para un adulto — varían por sexo, edad y estado fisiológico
            (ej. embarazo, lactancia). Se presentan como referencia general, no como dosis
            individualizada.
          </Caption>
        </Section>

        {/* VII. MINERALES */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-07">
          <SectionHeader roman="VII" title="MINERALES" />
          <Panel style={{ padding: '20px 20px 26px' }}>
            <NutrientTable rows={MINERALS} />
          </Panel>
          <Caption>
            El sodio es el único caso de esta tabla donde la cifra citada es un techo a no superar, no
            un objetivo a alcanzar — a diferencia de todos los demás, que son objetivos mínimos de
            ingesta.
          </Caption>
        </Section>

        {/* VIII. MICRONUTRIENTES PARA LA MENTE */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-08">
          <SectionHeader roman="VIII" title="MICRONUTRIENTES PARA LA MENTE" sub="los puntos de contacto directo entre lo que se come y cómo funciona el cerebro" />
          <P>
            Ya aparecieron por separado en las secciones anteriores — acá se reúnen los que tienen una
            conexión más directa y mejor documentada con la función cognitiva. Vale la aclaración: son
            relaciones reales, pero moderadas — no hay un "superalimento" que por sí solo garantice
            mejor rendimiento mental.
          </P>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {MIND_NUTRIENTS.map(n => (
              <Panel key={n.title}>
                <div style={{ fontSize: 11.5, letterSpacing: 1.5, color: ACCENT, marginBottom: 10, textShadow: `0 0 10px ${ACCENT}44` }}>{n.title}</div>
                <div style={{ fontSize: 10.5, lineHeight: 1.8, color: TEXT_DIM }}>{n.detail}</div>
              </Panel>
            ))}
          </div>
        </Section>

        {/* IX. HIDRATACIÓN */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-09">
          <SectionHeader roman="IX" title="HIDRATACIÓN" />
          <Panel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Stat label="INGESTA TOTAL DE AGUA — MUJERES (incluye agua de los alimentos)" value="≈ 2.7 L/día" />
              <Stat label="INGESTA TOTAL DE AGUA — HOMBRES (incluye agua de los alimentos)" value="≈ 3.7 L/día" />
            </div>
            <Caption>
              Cifras de referencia de las US National Academies, que incluyen toda el agua ingerida —
              de bebidas y de alimentos, no solo "agua para beber". La regla popular de "8 vasos al
              día" es una simplificación práctica, no una cifra precisa basada en evidencia específica
              para cada persona.
            </Caption>
          </Panel>
          <P>
            Los <Mono>electrolitos</Mono> — sodio, potasio, magnesio — regulan junto con el agua el
            balance de fluidos dentro y fuera de la célula, y son necesarios para la conducción
            nerviosa y la contracción muscular normales; se pierden junto con el agua en el sudor, por
            lo que su reposición importa más con actividad física intensa o prolongada, no en
            hidratación de rutina.
          </P>
        </Section>

        {/* X. GRUPOS ALIMENTARIOS */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-10">
          <SectionHeader roman="X" title="GRUPOS ALIMENTARIOS" sub="guía práctica — función, ejemplos y frecuencia aproximada" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }}>
            {FOOD_GROUPS.map(g => (
              <FoodGroupCard key={g.title} g={g} />
            ))}
          </div>
        </Section>

        {/* XI. EJE INTESTINO-CEREBRO Y MICROBIOTA */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-11">
          <SectionHeader roman="XI" title="EJE INTESTINO-CEREBRO Y MICROBIOTA" sub="el hilo conductor de todo el documento, desarrollado" />
          <Panel>
            <GutBrainDiagram />
            <Caption>
              La vieja cifra popular de "10 veces más bacterias que células humanas" quedó
              desactualizada: una revisión de 2016 (Sender, Fuchs y Milo) recalculó la proporción a
              algo cercano a 1:1 — comparable, no una desproporción masiva. No cambia lo central: esa
              población bacteriana es metabólicamente muy activa y se comunica con el sistema nervioso.
            </Caption>
          </Panel>
          <P>
            El <Mono>nervio vago</Mono> es una de las vías mejor estudiadas de esa comunicación —
            bidireccional: lleva información del intestino al cerebro y también en sentido inverso.
            Otra vía es química: una fracción muy citada es que ≈ 90% de la serotonina del cuerpo se
            produce en el intestino (no toda esa serotonina periférica actúa igual que la cerebral,
            que no cruza la barrera hematoencefálica — pero la cifra ilustra cuánta actividad
            relacionada con ese neurotransmisor ocurre fuera del cerebro).
          </P>
          <P>
            La fibra actúa como <Mono>prebiótico</Mono> — alimento para las bacterias beneficiosas. Los
            alimentos fermentados (yogur, kéfir, chucrut, kimchi) aportan cultivos vivos
            (<Mono>probióticos</Mono> de ocurrencia natural) que pueden contribuir a la diversidad de
            la microbiota, aunque el efecto específico varía mucho según el alimento y la persona.
          </P>
        </Section>

        {/* XII. TIMING NUTRICIONAL Y BIOHACKING */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-12">
          <SectionHeader roman="XII" title="TIMING NUTRICIONAL Y BIOHACKING" sub="qué está bien establecido, qué todavía se está investigando" />
          <P>
            El <Mono>ayuno intermitente</Mono> restringe la ventana horaria de alimentación, no
            necesariamente qué se come. Protocolos más citados:
          </P>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            {FASTING_PROTOCOLS.map(f => (
              <Panel key={f.title}>
                <div style={{ fontSize: 12, letterSpacing: 2, color: ACCENT, marginBottom: 10, textShadow: `0 0 10px ${ACCENT}44` }}>{f.title}</div>
                <div style={{ fontSize: 10.5, lineHeight: 1.8, color: TEXT_DIM }}>{f.detail}</div>
              </Panel>
            ))}
          </div>
          <P>
            La <Mono>alimentación restringida en el tiempo</Mono> (time-restricted eating) y su
            relación con los ritmos circadianos es un área de investigación activa — el laboratorio de
            Satchin Panda, entre otros, viene estudiando hace años cómo el horario de las comidas
            afecta el metabolismo en modelos animales y, más recientemente, en humanos — con resultados
            prometedores pero sin conclusiones cerradas sobre magnitud ni sobre quién se beneficia más.
          </P>
          <P>
            Suplementos de biohacking más estudiados — en distinto grado de evidencia cada uno:
          </P>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {SUPPLEMENTS.map(s => (
              <Panel key={s.title}>
                <div style={{ fontSize: 12, letterSpacing: 2, color: ACCENT, marginBottom: 10, textShadow: `0 0 10px ${ACCENT}44` }}>{s.title}</div>
                <div style={{ fontSize: 10.5, lineHeight: 1.8, color: TEXT_DIM }}>{s.detail}</div>
              </Panel>
            ))}
          </div>
        </Section>

        {/* XIII. LÍNEA DE TIEMPO */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-13">
          <SectionHeader roman="XIII" title="LÍNEA DE TIEMPO" sub="hitos de la ciencia de la nutrición — años aproximados donde corresponde" />
          <Panel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {NUTRITION_TIMELINE.map((entry, i) => (
                <TimelineRow key={entry.year + entry.title} entry={entry} isLast={i === NUTRITION_TIMELINE.length - 1} />
              ))}
            </div>
          </Panel>
        </Section>

        {/* XIV. FRONTERAS ABIERTAS */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-14" last>
          <div style={{ fontSize: 9, letterSpacing: 6, color: `${ACCENT}55`, marginBottom: 10 }}>
            TERRENO ABIERTO // SIN CONSENSO, A DIFERENCIA DE TODO LO ANTERIOR
          </div>
          <h2
            style={{
              fontSize: 19, letterSpacing: 4, color: ACCENT, textShadow: `0 0 22px ${ACCENT}44`,
              fontWeight: 700, margin: '0 0 18px',
            }}
          >
            FRONTERAS ABIERTAS
          </h2>
          <P>
            Todo lo anterior en este documento es ciencia con consenso razonable: cifras de referencia
            pública, mecanismos bioquímicos bien descriptos, historia verificable. Esta sección es
            distinta a propósito — temas de investigación activa o debate abierto del ángulo
            biohacking, incluidos explícitamente como tales, no como hechos establecidos.
          </P>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FRONTIER_TOPICS.map(f => (
              <Panel key={f.title}>
                <div style={{ fontSize: 11.5, letterSpacing: 1.5, color: ACCENT, marginBottom: 10, textShadow: `0 0 10px ${ACCENT}44` }}>{f.title}</div>
                <div style={{ fontSize: 10.5, lineHeight: 1.8, color: TEXT_DIM }}>{f.detail}</div>
              </Panel>
            ))}
          </div>
        </Section>

        {/* footer */}
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 140px', textAlign: 'center' }}>
          <div style={{ fontSize: 9, letterSpacing: 4, color: `${ACCENT}33` }}>
            NPX-NTR-00 // DOCUMENTO SIN ENLAZAR — ARCHIVO ACCEDIDO DIRECTO, NO INDEXADO
          </div>
        </div>
      </div>

      <style>{`
        .ntr-section {
          opacity: 0;
          transform: translateY(26px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .ntr-section.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .ntr-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
