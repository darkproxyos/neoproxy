import type { Metadata } from 'next'
import { Space_Mono, Inter } from 'next/font/google'
import './globals.css'
import SiteNav from '@/components/SiteNav'
import Chat from '@/components/Chat'
import ConsoleEasterEgg from '@/components/ConsoleEasterEgg'
import PresenceCounter from '@/components/PresenceCounter'
import AgentWatcher from '@/components/proxyverse/AgentWatcher'
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
          <div className="fixed inset-0 pointer-events-none z-0 mix-blend-screen opacity-10 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />
          {children}
          <Chat />
          <ConsoleEasterEgg />
          <PresenceCounter />
          <AgentWatcher />
        </Providers>
      </body>
    </html>
  )
}
