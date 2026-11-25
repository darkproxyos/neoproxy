import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GEOMETRÍAS: objetos exactos para explorar e imprimir // NeoProxy',
  description:
    'Poliedros de Conway, politopos 4D, fibración de Hopf, superficies matemáticas, orbitales, cristales, radiolarios e interferencia: objetos con nombre y teorema que se exploran con parámetros y se descargan como STL.',
}

export default function GeometriasLayout({ children }: { children: React.ReactNode }) {
  return children
}
