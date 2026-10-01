import Link from 'next/link'
import { agents } from '@/components/proxyverse/agents'
import GalleryGrid from '@/components/gallery/GalleryGrid'

const genos = agents.find(a => a.id === 'genos')!

export default function Artifacts() {
  return (
    <main style={{ padding: '104px 40px 40px', fontFamily: 'Space Mono, monospace', background: '#020408', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ marginTop: '2rem', color: '#00d4ff' }}>RELICS_&_ARTIFACTS</h1>

      <Link href={`/proxyverse/${genos.id}`} style={{
        display: 'block', marginTop: '2rem', maxWidth: 600, padding: '16px 20px',
        border: `1px solid ${genos.color}33`, background: `${genos.color}0a`, textDecoration: 'none',
      }}>
        <div style={{ fontSize: 9, color: genos.color, letterSpacing: 2, marginBottom: 6 }}>
          {genos.name} // {genos.role}
        </div>
        <p style={{ fontSize: 11, color: '#c8daf0', letterSpacing: 0.5, lineHeight: 1.8, fontStyle: 'italic', margin: 0 }}>
          "{genos.quote}"
        </p>
      </Link>

      <div style={{ marginTop: '5rem' }}>
        <h2 style={{ fontSize: 13, letterSpacing: 3, color: '#00d4ff', borderBottom: '1px solid #0f1f35', paddingBottom: 16 }}>
          GALERÍA_NEOPROXY // IMPRESIÓN_3D_&_RESINA
        </h2>
        <p style={{ color: '#4a6080', fontSize: '11px', lineHeight: 1.8, maxWidth: 680, marginTop: '14px' }}>
          Registro fotográfico del taller físico. No todo tiene checkout — algunas piezas son relicto,
          otras son prueba de proceso. Ordenadas por lo que son, no por cuándo se hicieron.
        </p>

        <GalleryGrid />
      </div>
    </main>
  )
}
