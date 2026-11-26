import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RESONANCIA — la arena dibuja el sonido | NeoProxy',
  description: 'Una placa de acero libre que vibra: cada nota dibuja una figura de Chladni en la arena. Modos calculados con Rayleigh–Ritz y comparados con las tablas de Leissa. La figura se imprime como relieve; el barrido entero, como columna.',
}

export default function Layout({ children }: { children: React.ReactNode }) { return children }
