import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FENÓMENOS — física que se imprime | NeoProxy',
  description: 'Una serie de piezas nacidas de leyes de la naturaleza: un mundo plano que se apila, anillos de humo que se congelan, tres soles que trenzan su órbita, arena que dibuja el sonido. Cada una se calcula, se mide y se imprime.',
}

export default function Layout({ children }: { children: React.ReactNode }) { return children }
