import Link from 'next/link'

export const metadata = { title: 'EXPERIMENTAL // NeoProxy' }

const mono = "'Space Mono', monospace"
const RED = '#cc0000'

interface ExperimentEntry {
  id: string
  code: string
  title: string
  href: string
  blurb: string
  controls: string
  secondary?: { label: string; href: string }
}

interface LabMode extends ExperimentEntry {
  step: number
  object: string
  color: string
  authors: string
}

// Los 6 modos no son 6 experimentos sueltos — son 6 respuestas a la misma
// pregunta ("¿qué clase de objeto estudiás?"), en el orden en que se
// fueron construyendo: una forma, un comportamiento en el tiempo, un
// argumento, una relación, una memoria, una población. SÍNTESIS (adentro
// de EVOLUCIÓN) además cruza dos de estos seis entre sí — el laboratorio
// no es una lista, es un sistema. Color y autores por modo, verificados
// contra el código real de cada página — nada acá es decorativo.
const LAB_MODES: LabMode[] = [
  {
    id: 'workbench',
    step: 1,
    object: 'FORMA',
    color: '#cc0000',
    authors: 'Runions, Lane & Prusinkiewicz · Raup · Turing · Lorenz',
    code: 'NPX-XP-WORKBENCH',
    title: 'WORKBENCH',
    href: '/experimental/workbench',
    blurb: 'Banco de trabajo real: una sola forma 3D donde se apilan teorías científicas como capas — esqueleto por Space Colonization (Runions, Lane & Prusinkiewicz 2007) o espiral de Raup (1962), patrón de reacción-difusión de Turing (1952) pintado sobre la superficie, y un sistema caótico real (Lorenz y otros 9) deformando los nodos. Cada capa cita a su autor. Export a .STL.',
    controls: 'STACK DE CAPAS + SLIDERS — EXPORT .STL',
  },
  {
    id: 'enjambre',
    step: 2,
    object: 'TIEMPO',
    color: '#ffb800',
    authors: 'Craig Reynolds · Bak, Tang & Wiesenfeld',
    code: 'NPX-XP-ENJAMBRE',
    title: 'ENJAMBRE',
    href: '/experimental/enjambre',
    blurb: 'Sistemas que corren solos, no se generan una vez. Bandada de boids (Craig Reynolds, 1987 — separación, alineación, cohesión, nada de coordinador) o un montículo de arena que deriva solo al borde del colapso (Bak, Tang & Wiesenfeld, 1987 — criticalidad auto-organizada, avalanchas en vivo).',
    controls: 'SIMULACIÓN EN VIVO — PARÁMETROS AJUSTABLES',
  },
  {
    id: 'dialectica',
    step: 3,
    object: 'LENGUAJE',
    color: '#ff3fa4',
    authors: 'Chalmers · Dennett · Baudrillard · Haraway +4',
    code: 'NPX-XP-DIALÉCTICA',
    title: 'DIALÉCTICA',
    href: '/experimental/dialectica',
    blurb: 'No genera formas ni corre simulaciones, pone a discutir a los pensadores reales de /knowledge entre sí. 6 tensiones filosóficas documentadas (Chalmers vs Dennett sobre el problema difícil, Baudrillard vs Haraway sobre lo real, Byung-Chul Han vs Zuboff sobre el poder digital, y más): tesis, antítesis, réplica, y un cierre honesto sobre si hay síntesis o la tensión queda abierta.',
    controls: 'DEBATE EN VIVO — CADA UNO ARGUMENTA SOLO DESDE SU POSICIÓN REAL',
  },
  {
    id: 'red',
    step: 4,
    object: 'RELACIÓN',
    color: '#00d4ff',
    authors: 'Erdős & Rényi · Barabási · Judea Pearl',
    code: 'NPX-XP-RED',
    title: 'RED',
    href: '/experimental/red',
    blurb: 'El objeto es la relación, no la forma. Grafos aleatorios de Erdős–Rényi vs libres de escala de Barabási-Albert — misma cantidad de nodos, distribución de grado radicalmente distinta, graficada en vivo. O una red bayesiana real (Judea Pearl): fijás evidencia en un nodo y la probabilidad posterior de los demás se recalcula por inferencia exacta, no una animación de mentira.',
    controls: 'LAYOUT DE FUERZAS + INFERENCIA EXACTA EN VIVO',
  },
  {
    id: 'memoria',
    step: 5,
    object: 'MEMORIA',
    color: '#00ff9d',
    authors: 'John Hopfield',
    code: 'NPX-XP-MEMORIA',
    title: 'MEMORIA',
    href: '/experimental/memoria',
    blurb: 'Cada recuerdo guardado es un pozo de energía, no una fila en una tabla. Red de Hopfield (1982) real: rompé un patrón con ruido o pixel por pixel y dejala converger — rueda cuesta abajo en su propia energía hasta caer exactamente en el original. Sobrecargala con más patrones de la cuenta y mirá cómo el recuerdo empieza a fallar de verdad, no en teoría.',
    controls: 'BITMAP CLICKEABLE — CONVERGENCIA EN VIVO, SIN BABYLON',
  },
  {
    id: 'evolucion',
    step: 6,
    object: 'POBLACIÓN',
    color: '#6366f1',
    authors: 'Dawkins · Holland · Alsing',
    code: 'NPX-XP-EVOLUCIÓN',
    title: 'EVOLUCIÓN',
    href: '/experimental/evolucion',
    blurb: 'El más complejo de los seis — acá el objeto no es una forma, es una POBLACIÓN cambiando a través de generaciones. Selección artificial (Dawkins, Biomorfos 1986): elegís vos, sin fórmula, cuál de 9 variantes sobrevive. Algoritmo genético (Holland, 1975): una población compite por una función de fitness medible. Síntesis (Alsing, 2008): cruza con MEMORIA — evolucionar una silueta real hasta que se parezca a un patrón guardado, mismo principio que evolucionar la Mona Lisa con polígonos.',
    controls: 'TRES PARADIGMAS — Y UNO CRUZA CON MEMORIA',
  },
]

const CATALOG: ExperimentEntry[] = [
  {
    id: 'proxygenesis',
    code: 'NPX-XP-GENESIS',
    title: 'PROXYGENESIS',
    href: '/lab/proxygenesis',
    blurb: 'Generador de formas orgánicas para imprimir en resina: coral y árbol con Space Colonization Algorithm (Runions et al., 2007), y conchas con el modelo de coiling de Raup (1962) — parámetros reales de espacio, no ruido decorativo. Export a .STL.',
    controls: 'SLIDERS DE ESPACIO + SEMILLA — EXPORT .STL',
  },
  {
    id: 'lab',
    code: 'NPX-XP-LAB',
    title: 'LABORATORIO',
    href: '/lab',
    blurb: 'El resto del ala de investigación: motor de atractores del caos (10 sistemas dinámicos, exportables a .STL), datos reales de conectómica de Drosophila (Hemibrain), y una escena de prueba.',
    controls: '3 SUB-EXPERIMENTOS ADENTRO',
  },
  {
    id: 'stardust',
    code: 'NPX-XP-STARDUST',
    title: 'STARDUST',
    href: '/npos/stardust',
    blurb: 'Campo de partículas procedural ligado al estado del kernel — si la carga de CPU simulada supera el 80%, el caos del campo sube solo, sin que lo toques. Panel de síntesis con parámetros ajustables y consola de comandos propia.',
    controls: 'PANEL DE PARÁMETROS + CONSOLA DE COMANDOS',
  },
  {
    id: 'etereo',
    code: 'NPX-XP-ETEREO',
    title: 'ETÉREO',
    href: '/etereo',
    blurb: 'Campo de luces flotantes en canvas 2D que reacciona de verdad al mouse y al touch — una fuerza de repulsión real, no decoración. Respeta "preferir menos movimiento" del sistema operativo.',
    controls: 'MOUSE / TOUCH — FUERZA DE REPULSIÓN',
  },
  {
    id: 'synth',
    code: 'NPX-XP-SYNTH',
    title: 'SYNTH',
    href: '/draw/synth',
    blurb: 'Dibujá y escuchá: cada trazo se convierte en notas de una escala pentatónica. Siete timbres, incluidos piano, flauta y violín con muestras reales (no solo osciladores) — el trazo se pinta como spray de partículas, no como línea.',
    controls: 'DIBUJÁ CON MOUSE / TOUCH / LÁPIZ',
  },
  {
    id: 'scan',
    code: 'NPX-XP-SCAN',
    title: 'SCAN',
    href: '/experimental/scan',
    blurb: 'Lector genérico de tags NFC (Web NFC): muestra el payload crudo de cualquier tag — tipo de registro, texto decodificado y hex. Todavía no hay un artefacto físico ni un esquema de datos propio detrás; es el punto de partida para cuando exista uno.',
    controls: 'REQUIERE CHROME PARA ANDROID + NFC',
  },
]

export default function ExperimentalHubPage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER AL INICIO
        </Link>

        <div style={{ fontSize: 9, color: `${RED}66`, letterSpacing: 6, marginBottom: 16 }}>
          // EXPERIMENTAL — ZONA SIN GARANTÍA
        </div>
        <h1 style={{
          fontSize: 40, fontWeight: 700, letterSpacing: 6, color: RED,
          textShadow: `0 0 40px ${RED}44`, marginBottom: 16, lineHeight: 1,
        }}>
          EXPERIMENTAL
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 620, marginBottom: 12 }}>
          Todo lo que no encaja todavía en una categoría fija: motores generativos, datos científicos
          reales, sintetizadores, face tracking. Nada acá tiene la promesa de estabilidad de PROXYGAMES —
          algunas piezas son herramientas terminadas, otras son apenas la intención de lo que van a ser.
        </p>
        <p style={{ fontSize: 10, color: '#4a6080', letterSpacing: 1, lineHeight: 1.9, maxWidth: 620, marginBottom: 56 }}>
          Cada tarjeta dice, sin maquillaje, qué tan hecha está cada cosa.
        </p>

        <div style={{ fontSize: 10, color: RED, letterSpacing: 4, marginBottom: 10 }}>
          EL LABORATORIO
        </div>
        <p style={{ fontSize: 10, color: '#4a6080', letterSpacing: 0.5, lineHeight: 1.9, maxWidth: 640, marginBottom: 28 }}>
          No son 6 experimentos sueltos — son 6 respuestas a la misma pregunta, "¿qué clase de objeto
          estudiás?": una forma, un comportamiento en el tiempo, un argumento, una relación, una
          memoria, una población. SÍNTESIS (adentro de EVOLUCIÓN) cruza dos de estos seis entre sí.
          El orden de abajo es el orden en que se fueron construyendo — número, color y autores reales
          de cada uno.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 56 }}>
          {LAB_MODES.map((mode, i) => (
            <Link key={mode.id} href={mode.href} className="fade-in" style={{
              display: 'block', textDecoration: 'none', color: 'inherit', padding: 24,
              background: 'rgba(2,4,8,0.8)', border: `1px solid ${mode.color}33`,
              borderLeft: `3px solid ${mode.color}`, animationDelay: `${i * 0.08}s`, opacity: 0,
              transition: 'all 0.25s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <span style={{ fontSize: 9, letterSpacing: 2, color: `${mode.color}aa` }}>{mode.code}</span>
                <span style={{
                  fontSize: 9, letterSpacing: 1, color: mode.color, border: `1px solid ${mode.color}55`,
                  padding: '2px 7px',
                }}>
                  {mode.step} / 6 — {mode.object}
                </span>
              </div>
              <div style={{ fontSize: 20, letterSpacing: 2, color: '#fff', marginBottom: 10 }}>{mode.title}</div>
              <p style={{ fontSize: 11, color: '#8fb8d6', lineHeight: 1.8, marginBottom: 14 }}>{mode.blurb}</p>
              <div style={{ fontSize: 8, letterSpacing: 1, color: `${mode.color}cc`, marginBottom: 8 }}>{mode.authors}</div>
              <div style={{ fontSize: 8, letterSpacing: 1, color: '#3a4a60' }}>{mode.controls}</div>
            </Link>
          ))}
        </div>

        <div style={{ fontSize: 10, color: '#b06bff', letterSpacing: 4, marginBottom: 10 }}>
          EL ORÁCULO
        </div>
        <p style={{ fontSize: 10, color: '#4a6080', letterSpacing: 0.5, lineHeight: 1.9, maxWidth: 640, marginBottom: 20 }}>
          No es un séptimo modo del laboratorio — no estudia un objeto nuevo, lee a través de los seis.
          Te tocan al azar tres posiciones documentadas de /knowledge, sin relación previa entre ellas,
          y el sistema busca una conexión real con tu pregunta en vez de generar una forma o correr una simulación.
        </p>
        <Link href="/experimental/oraculo" className="fade-in artifact-card" style={{
          display: 'block', textDecoration: 'none', color: 'inherit', padding: 24, marginBottom: 56,
          background: 'rgba(2,4,8,0.8)', border: '1px solid #b06bff33', borderLeft: '3px solid #b06bff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontSize: 9, letterSpacing: 2, color: '#b06bffaa' }}>NPX-XP-ORÁCULO</span>
            <span style={{
              fontSize: 9, letterSpacing: 1, color: '#b06bff', border: '1px solid #b06bff55', padding: '2px 7px',
            }}>
              CRUZA LOS 6
            </span>
          </div>
          <div style={{ fontSize: 20, letterSpacing: 2, color: '#fff', marginBottom: 10 }}>ORÁCULO</div>
          <p style={{ fontSize: 11, color: '#8fb8d6', lineHeight: 1.8, marginBottom: 14 }}>
            Tres cartas al azar de /knowledge — autores y algoritmos reales, sin relación documentada entre
            sí — y una lectura en vivo que busca una conexión honesta con tu pregunta, citando solo lo que
            esos tres de verdad sostuvieron.
          </p>
          <div style={{ fontSize: 8, letterSpacing: 1, color: '#b06bffcc', marginBottom: 8 }}>
            78 ENTRADAS POSIBLES · 3 AL AZAR POR TIRADA
          </div>
          <div style={{ fontSize: 8, letterSpacing: 1, color: '#3a4a60' }}>LECTURA EN VIVO — NUNCA LA MISMA COMBINACIÓN</div>
        </Link>

        <div style={{ fontSize: 10, color: '#00ff9d', letterSpacing: 4, marginBottom: 10 }}>
          EL SIGILO
        </div>
        <p style={{ fontSize: 10, color: '#4a6080', letterSpacing: 0.5, lineHeight: 1.9, maxWidth: 640, marginBottom: 20 }}>
          Tampoco es un séptimo modo — no genera una forma nueva ni simula nada, reduce. Un procedimiento
          real de reducción de texto a símbolo: se le sacan las letras repetidas a tu intención y lo que
          sobrevive se funde en un trazo sobre una rueda fija de 26 posiciones. Determinístico — mismo
          texto, mismo sigilo, siempre.
        </p>
        <Link href="/experimental/sigilo" className="fade-in artifact-card" style={{
          display: 'block', textDecoration: 'none', color: 'inherit', padding: 24, marginBottom: 56,
          background: 'rgba(2,4,8,0.8)', border: '1px solid #00ff9d33', borderLeft: '3px solid #00ff9d',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontSize: 9, letterSpacing: 2, color: '#00ff9daa' }}>NPX-XP-SIGILO</span>
            <span style={{
              fontSize: 9, letterSpacing: 1, color: '#00ff9d', border: '1px solid #00ff9d55', padding: '2px 7px',
            }}>
              REDUCE, NO GENERA
            </span>
          </div>
          <div style={{ fontSize: 20, letterSpacing: 2, color: '#fff', marginBottom: 10 }}>SIGILO</div>
          <p style={{ fontSize: 11, color: '#8fb8d6', lineHeight: 1.8, marginBottom: 14 }}>
            Escribís una intención, se eliminan las letras repetidas, y el set resultante se dibuja como
            un único trazo — procedimiento determinístico real, no una animación al azar.
          </p>
          <div style={{ fontSize: 8, letterSpacing: 1, color: '#00ff9dcc', marginBottom: 8 }}>
            GALERÍA LOCAL — CADA SIGILO QUEDA GUARDADO
          </div>
          <div style={{ fontSize: 8, letterSpacing: 1, color: '#3a4a60' }}>MISMO TEXTO, MISMO SIGILO — SIEMPRE</div>
        </Link>

        <div style={{ fontSize: 10, color: RED, letterSpacing: 4, marginBottom: 22 }}>
          OTROS EXPERIMENTOS
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 32 }}>
          {CATALOG.map(exp => (
            <div key={exp.id} className="artifact-card" style={{ padding: 24 }}>
              <Link href={exp.href} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a6080', marginBottom: 12 }}>{exp.code}</div>
                <div style={{ fontSize: 20, letterSpacing: 2, color: '#fff', marginBottom: 10 }}>{exp.title}</div>
                <p style={{ fontSize: 11, color: '#8fb8d6', lineHeight: 1.8, marginBottom: 16 }}>{exp.blurb}</p>
                <div style={{ fontSize: 8, letterSpacing: 1, color: '#3a4a60' }}>{exp.controls}</div>
              </Link>
              {exp.secondary && (
                <Link href={exp.secondary.href} style={{
                  display: 'block', marginTop: 14, paddingTop: 14, borderTop: `1px solid ${RED}22`,
                  fontSize: 9, letterSpacing: 1, color: `${RED}bb`, textDecoration: 'none',
                }}>
                  {exp.secondary.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
