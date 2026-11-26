import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RAYO — una descarga eléctrica hecha pieza | NeoProxy',
  description: 'Rayos calculados con el modelo de ruptura dieléctrica: la descarga avanza donde el campo eléctrico es más fuerte. Su dimensión fractal coincide con la publicada. Dado vuelta, el rayo es un árbol imprimible.',
}

export default function Layout({ children }: { children: React.ReactNode }) { return children }
