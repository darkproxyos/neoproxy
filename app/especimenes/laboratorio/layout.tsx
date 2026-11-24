import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Laboratorio de especímenes: formas experimentales para imprimir // NeoProxy',
  description:
    '1000 formas generadas por 8 algoritmos, medidas por imprimibilidad y filtradas por diversidad. 50 visibles cada semana, descarga el STL o pídelo impreso en PLA o resina.',
}

export default function LaboratorioLayout({ children }: { children: React.ReactNode }) {
  return children
}
