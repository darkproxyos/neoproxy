import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NeoProxy OS | Creative Operating System',
  description: 'NPos v0.2 — Laboratorio generativo, fabricación y memoria.',
}

import { AestheticProvider } from '@/components/npos/AestheticProvider'

export default function NPosLayout({ children }: { children: React.ReactNode }) {
  return (
    <AestheticProvider>
      <style>{`
        .npos-root {
          background: var(--background);
          color: var(--foreground);
          font-family: 'Space Mono', monospace;
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }

        .npos-root * { box-sizing: border-box; }
      `}</style>
      <div className="npos-root">
        <div className="crt-scanlines" />
        <div className="tech-grid" />
        {children}
      </div>
    </AestheticProvider>
  )
}
