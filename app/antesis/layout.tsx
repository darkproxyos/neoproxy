import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ANTESIS — flores de engranajes // NeoProxy',
  description: 'Un generador de flores mecánicas: engranajes cónicos sobre una esfera que giran todos juntos, con pétalos y coronas generativos que nunca se tocan. Cada pieza se descarga como STL para imprimir y armar.',
}

export default function Layout({ children }: { children: React.ReactNode }) { return children }
