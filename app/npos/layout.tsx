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
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400&family=Syne:wght@400;700;800&display=swap');

        .npos-root {
          background: var(--neo-bg);
          color: var(--neo-text);
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          line-height: 1.7;
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
          transition: background 1s ease, color 0.5s ease;
        }

        .npos-root * { box-sizing: border-box; }

        .npos-noise {
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 100;
          opacity: 0.35;
        }

        .npos-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 0;
        }
      `}</style>
      <div className="npos-root">
        <div className="npos-noise" />
        <div className="npos-grid" />
        {children}
      </div>
    </AestheticProvider>
  )
}
