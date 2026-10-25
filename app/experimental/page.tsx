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

// Descripciones verificadas contra el código real de cada página — mismo
// criterio que app/games/page.tsx. Proxygenesis se promovió a tarjeta
// propia (primera de la lista, pedido explícito) en vez de quedar
// escondida dentro de Laboratorio — ya no es el placeholder "sin kernel",
// es el experimento más terminado de toda la sección.
const CATALOG: ExperimentEntry[] = [
  {
    id: 'enjambre',
    code: 'NPX-XP-ENJAMBRE',
    title: 'ENJAMBRE',
    href: '/experimental/enjambre',
    blurb: 'Segundo modo del laboratorio: sistemas que corren solos, no se generan una vez. Bandada de boids (Craig Reynolds, 1987 — separación, alineación, cohesión, nada de coordinador) o un montículo de arena que deriva solo al borde del colapso (Bak, Tang & Wiesenfeld, 1987 — criticalidad auto-organizada, avalanchas en vivo).',
    controls: 'SIMULACIÓN EN VIVO — PARÁMETROS AJUSTABLES',
  },
  {
    id: 'workbench',
    code: 'NPX-XP-WORKBENCH',
    title: 'WORKBENCH',
    href: '/experimental/workbench',
    blurb: 'Banco de trabajo real: una sola forma 3D donde se apilan teorías científicas como capas — esqueleto por Space Colonization (Runions, Lane & Prusinkiewicz 2007) o espiral de Raup (1962), patrón de reacción-difusión de Turing (1952) pintado sobre la superficie, y un sistema caótico real (Lorenz y otros 9) deformando los nodos. Cada capa cita a su autor. Export a .STL.',
    controls: 'STACK DE CAPAS + SLIDERS — EXPORT .STL',
  },
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

        <div style={{ fontSize: 10, color: RED, letterSpacing: 4, marginBottom: 22 }}>
          CATÁLOGO
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
