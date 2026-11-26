import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HUMO SÓLIDO — anillos de humo congelados | NeoProxy',
  description: 'Anillos de humo calculados con la física de los vórtices: se adelantan, chocan, se anudan. Congelas un instante y el humo se vuelve una pieza imprimible en resina.',
}

export default function Layout({ children }: { children: React.ReactNode }) { return children }
