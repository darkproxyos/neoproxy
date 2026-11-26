import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TRENZA — tres cuerpos, una órbita, una pieza | NeoProxy',
  description: 'Órbitas periódicas reales del problema de los tres cuerpos. Con el tiempo como altura, el baile de tres soles es una trenza; la trenza se vuelve una pieza imprimible. Y una millonésima de diferencia la deshace.',
}

export default function Layout({ children }: { children: React.ReactNode }) { return children }
