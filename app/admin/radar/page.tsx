import type { Metadata } from 'next'
import { auth } from '@/auth'
import RadarApp from '@/components/radar/RadarApp'

export const metadata: Metadata = { title: 'RADAR // NEGOCIO // NeoProxy', robots: { index: false, follow: false } }
// generar ideas con IA puede tardar medio minuto
export const maxDuration = 60

export default async function RadarPage() {
  const bypass = process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === 'true'
  const session = bypass ? null : await auth()
  const root = bypass || (session?.user as { role?: string } | undefined)?.role === 'root'
  if (!root) {
    return (
      <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: "'Space Mono', monospace", display: 'grid', placeItems: 'center', padding: 24 }}>
        <p style={{ fontSize: 13, letterSpacing: 2 }}>RADAR es privado: solo la cuenta root.</p>
      </div>
    )
  }
  return <RadarApp />
}
