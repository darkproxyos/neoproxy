import Link from 'next/link'

export const metadata = { title: 'LABORATORIO // NeoProxy' }

const mono = "'Space Mono', monospace"
const RED = '#cc0000'

type LabStatus = 'activo' | 'prueba' | 'placeholder'

interface LabEntry {
  id: string
  code: string
  title: string
  href: string
  status: LabStatus
  blurb: string
  controls: string
}

// Descripciones verificadas contra el código real de cada página — mismo
// criterio que app/games/page.tsx y app/experimental/page.tsx.
const CATALOG: LabEntry[] = [
  {
    id: 'atractores',
    code: 'NPX-LAB-CHAOS',
    title: 'ATRACTORES DEL CAOS',
    href: '/lab/atractores',
    status: 'activo',
    blurb: 'Motor de atractores extraños en 3D: Lorenz, Thomas, Aizawa, De Jong, Chen, Halvorsen, Clifford, Rössler, un nudo tórico y un pseudo-atractor de L-System — diez sistemas dinámicos, cada uno exportable como malla .STL lista para imprimir.',
    controls: 'CÁMARA ORBITAL — SELECCIONÁ UN ALGORITMO',
  },
  {
    id: 'hemibrain',
    code: 'NPX-LAB-HEMIBRAIN',
    title: 'HEMIBRAIN',
    href: '/lab/hemibrain',
    status: 'activo',
    blurb: 'Reconstrucción 3D de neuronas reales del cuerpo fungiforme de Drosophila melanogaster, del dataset público Hemibrain v1.2.1 — morfología real, no arte generativo. Toggles por neurotransmisor, sinapsis y células de Kenyon.',
    controls: 'TOGGLES POR NEUROTRANSMISOR — CLICK ENFOCA NEURONA',
  },
  {
    id: 'sandbox',
    code: 'NPX-LAB-SANDBOX',
    title: 'SANDBOX',
    href: '/lab/sandbox',
    status: 'prueba',
    blurb: 'Escena de prueba: una esfera con glow y cámara orbital, usada para verificar que el motor 3D monta bien antes de construir algo encima. Sin parámetros ajustables todavía.',
    controls: 'CÁMARA ORBITAL — SIN MÁS CONTROLES',
  },
  {
    id: 'proxygenesis',
    code: 'NPX-LAB-PROXYGENESIS',
    title: 'PROXYGENESIS',
    href: '/lab/proxygenesis',
    status: 'placeholder',
    blurb: 'Página de intención para el NMK (NeoProxy Morphogenetic Kernel) — todavía no corre ningún kernel. Marcada en el propio código como v0.0, pre-kernel.',
    controls: 'SIN INTERACCIÓN — TODAVÍA',
  },
]

const STATUS_LABEL: Record<LabStatus, string> = { activo: 'ACTIVO', prueba: 'PRUEBA', placeholder: 'PLACEHOLDER' }
const STATUS_COLOR: Record<LabStatus, string> = { activo: '#00ffcc', prueba: '#ffb800', placeholder: '#4a6080' }

export default function LabHubPage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/experimental" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A EXPERIMENTAL
        </Link>

        <div style={{ fontSize: 9, color: `${RED}66`, letterSpacing: 6, marginBottom: 16 }}>
          // LABORATORIO — ALA DE INVESTIGACIÓN
        </div>
        <h1 style={{
          fontSize: 40, fontWeight: 700, letterSpacing: 6, color: RED,
          textShadow: `0 0 40px ${RED}44`, marginBottom: 16, lineHeight: 1,
        }}>
          LABORATORIO
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 620, marginBottom: 12 }}>
          Todavía no es EL laboratorio — es el índice de lo que ya corre adentro, mientras se arma
          la versión real. Un motor de atractores del caos funcionando de punta a punta, datos
          reales de conectómica, una escena de prueba, y la intención escrita de un kernel
          morfogenético que todavía no arrancó.
        </p>
        <p style={{ fontSize: 10, color: '#4a6080', letterSpacing: 1, lineHeight: 1.9, maxWidth: 620, marginBottom: 56 }}>
          Esta página va a crecer — lo de abajo es lo que existe hoy, no una maqueta de lo que falta.
        </p>

        <div style={{ fontSize: 10, color: RED, letterSpacing: 4, marginBottom: 22 }}>
          EXPERIMENTOS
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 32 }}>
          {CATALOG.map(entry => (
            <Link
              key={entry.id}
              href={entry.href}
              className="artifact-card"
              style={{ display: 'block', padding: 24, textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a6080' }}>{entry.code}</div>
                <div style={{
                  fontSize: 8, letterSpacing: 1.5, padding: '3px 8px', whiteSpace: 'nowrap',
                  color: STATUS_COLOR[entry.status],
                  border: `1px solid ${STATUS_COLOR[entry.status]}44`,
                }}>
                  {STATUS_LABEL[entry.status]}
                </div>
              </div>
              <div style={{ fontSize: 20, letterSpacing: 2, color: '#fff', marginBottom: 10 }}>{entry.title}</div>
              <p style={{ fontSize: 11, color: '#8fb8d6', lineHeight: 1.8, marginBottom: 16 }}>{entry.blurb}</p>
              <div style={{ fontSize: 8, letterSpacing: 1, color: '#3a4a60' }}>{entry.controls}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
