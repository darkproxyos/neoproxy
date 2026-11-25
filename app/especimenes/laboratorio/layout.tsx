import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Laboratorio de especímenes: formas que evolucionan // NeoProxy',
  description:
    '26 algoritmos y sus cruces generan formas que evolucionan por generaciones: sobreviven las más aptas y distintas, el resto desaparece. 96 visibles cada semana; vota, descarga el STL o pídelo impreso en PLA o resina.',
}

export default function LaboratorioLayout({ children }: { children: React.ReactNode }) {
  return children
}
