import type { Metadata } from 'next'
import { Space_Mono, Inter } from 'next/font/google'
import './globals.css'
import SiteNav from '@/components/SiteNav'
import Chat from '@/components/Chat'
import ConsoleEasterEgg from '@/components/ConsoleEasterEgg'
import PresenceCounter from '@/components/PresenceCounter'
import GhostPresence from '@/components/GhostPresence'
import AgentWatcher from '@/components/proxyverse/AgentWatcher'
import ProxyBiodiversity from '@/components/biodiversity/ProxyBiodiversity'
import Grieta from '@/components/grietas/Grieta'
import EntropyField from '@/components/EntropyField'
import EntropyEntity from '@/components/EntropyEntity'
import Glitchi from '@/components/Glitchi'
import CircadianField from '@/components/CircadianField'
import ClickDesync from '@/components/ClickDesync'
import ConsoleOverlay from '@/components/ConsoleOverlay'
import FragmentedMemory from '@/components/FragmentedMemory'
import ScrollHeatmap from '@/components/ScrollHeatmap'
import MoonPhaseField from '@/components/MoonPhaseField'
import SteganoNoise from '@/components/SteganoNoise'
import RepetitionCompression from '@/components/RepetitionCompression'
import SandpileField from '@/components/SandpileField'
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-space-mono' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'NeoProxy OS | Creative Layer',
  description: 'NPos v0.2. Un organismo digital que pregunta quién es dueño de la red que usás. Arte generativo, artefactos únicos y una IA que no pide permiso.',
}

import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${spaceMono.variable} ${inter.variable} bg-[#020408] text-[#c8daf0] overflow-y-auto`}>
        <Providers>
          <SiteNav />
          <SteganoNoise />
          <div className="neo-organism-filter">{children}</div>
          <Chat />
          <ConsoleEasterEgg />
          <PresenceCounter />
          <GhostPresence />
          <AgentWatcher />
          <ProxyBiodiversity />
          <Grieta />
          <EntropyField />
          <EntropyEntity />
          <Glitchi />
          <CircadianField />
          <ClickDesync />
          <ConsoleOverlay />
          <FragmentedMemory />
          <ScrollHeatmap />
          <MoonPhaseField />
          <RepetitionCompression />
          <SandpileField />
        </Providers>
      </body>
    </html>
  )
}
