import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CAPAS — la escultura del tiempo | NeoProxy',
  description: 'Un mundo plano gobernado por una ecuación real, que se pinta en vivo. El tiempo lo apila hacia arriba: la pieza es su historia y cada capa de resina, un instante. STL de 60 mm con el recuento de soportes a la vista.',
}

export default function Layout({ children }: { children: React.ReactNode }) { return children }
