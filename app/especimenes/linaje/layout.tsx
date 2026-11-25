import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Linaje: el árbol genealógico de los especímenes // NeoProxy',
  description:
    'Cada pieza del laboratorio con sus madres, sus mutaciones y sus cruces, a lo largo de las generaciones. Las vivas brillan; las que desaparecieron quedan como huella.',
}

export default function LinajeLayout({ children }: { children: React.ReactNode }) {
  return children
}
