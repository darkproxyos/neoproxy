import type { Metadata } from 'next'
import { agents } from '@/components/proxyverse/agents'

// título de la pestaña con el nombre del agente (antes: «NeoProxy OS | Creative Layer»)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const a = agents.find((x) => x.id === id)
  return a ? { title: `${a.name} // PROXYVERSE // NeoProxy`, description: a.role } : { title: 'PROXYVERSE // NeoProxy' }
}

export default function Layout({ children }: { children: React.ReactNode }) { return children }
