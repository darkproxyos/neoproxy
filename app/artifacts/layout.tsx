import type { Metadata } from 'next'

// título propio de la pestaña (antes todas decían «NeoProxy OS | Creative Layer»)
export const metadata: Metadata = { title: "ARTEFACTOS // NeoProxy" }

export default function Layout({ children }: { children: React.ReactNode }) { return children }
