import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KATANA CYBORG // NeoProxy',
  description: 'Un katana cyborg industrial paramétrico: hoja curva en segmentos, abrazaderas, tsuba de engranaje y mango con hueco para electrónica. Se imprime en piezas, sin soportes, y se descarga en STL.',
}

export default function Layout({ children }: { children: React.ReactNode }) { return children }
