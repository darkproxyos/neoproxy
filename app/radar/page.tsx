import type { Metadata } from 'next'
import RadarApp from '@/components/radar/RadarApp'

export const metadata: Metadata = { title: 'RADAR // NEGOCIO // NeoProxy', robots: { index: false, follow: false } }
// generar ideas con IA puede tardar medio minuto
export const maxDuration = 60

// Sin login: el catálogo, el calendario y el tablero (guardado en tu navegador) son
// libres; lo que gasta créditos pide la clave personal (ver app/radar/actions.ts).
export default function RadarPage() {
  return <RadarApp />
}
