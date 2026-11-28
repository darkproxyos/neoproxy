import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
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
import Mobius from '@/components/Mobius'
import CircadianField from '@/components/CircadianField'
import ClickDesync from '@/components/ClickDesync'
import ConsoleOverlay from '@/components/ConsoleOverlay'
import FragmentedMemory from '@/components/FragmentedMemory'
import ScrollHeatmap from '@/components/ScrollHeatmap'
import MoonPhaseField from '@/components/MoonPhaseField'
import SteganoNoise from '@/components/SteganoNoise'
import RepetitionCompression from '@/components/RepetitionCompression'
import SandpileField from '@/components/SandpileField'
import Clima from '@/components/zona/Clima'
import LainLayer from '@/components/lain/LainLayer'
import { BOOT_SCRIPT } from '@/lib/zona/rutas'
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
    // suppressHydrationWarning: el guion de arranque marca el tramo en <html> antes de hidratar
    <html lang="es" suppressHydrationWarning>
      <head>
        <script id="tramo-boot" dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        {/* Space Mono por su nombre (lo usan estilos en línea y lienzos 2D en todo el sitio) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Newsreader:ital@1&display=swap" />
      </head>
      <body className={`${inter.variable} bg-[#020408] text-[#c8daf0] overflow-y-auto`}>
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
          <Mobius />
          <CircadianField />
          <ClickDesync />
          <ConsoleOverlay />
          <FragmentedMemory />
          <ScrollHeatmap />
          <MoonPhaseField />
          <RepetitionCompression />
          <SandpileField />
          <Clima />
          <LainLayer />
        </Providers>
      </body>
    </html>
  )
}
