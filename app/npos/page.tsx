"use client";

import Link from 'next/link'

const modules = [
  {
    href: '/npos/lab',
    icon: '⚗️',
    name: 'Generative Lab',
    desc: 'Laboratorio de geometría. Exploración procedural: algoritmos, formas caóticas, esculturas matemáticas.',
  },
  {
    href: '/npos/stardust',
    icon: '✨',
    name: 'Stardust Engine',
    desc: 'Motor de partículas y geometría cuántica. Renderizado PBR de alta fidelidad con consola de comandos neural.',
  },
  {
    href: '/npos/fabrication',
    icon: '🔧',
    name: 'Fabrication Lab',
    desc: 'La conexión con el taller físico. Arte digital que se convierte en objeto real mediante resina, luz y electrónica.',
  },
  {
    href: '/npos/memory',
    icon: '🧬',
    name: 'Memory Lab',
    desc: 'Archivo vivo de conversaciones con IA, procesos creativos, errores y descubrimientos. El diario del sistema.',
  },
]

export default function NPosPortal() {
  return (
    <div className="npos-portal">
      {/* Tag */}
      <div className="portal-tag">
        <span className="tag-prefix">//</span> NeoProxy OS — v0.2 — Surface Portal
      </div>

      {/* Title */}
      <div className="portal-title">
        <h1>
          <span className="title-neo">Neo</span><span className="title-proxy">Proxy</span>
          <span className="title-subtitle">Creative Operating System</span>
        </h1>
      </div>

      {/* Flow */}
      <div className="portal-flow">
        {['Idea', 'IA', 'Geometría', 'Objeto', 'Experiencia'].map((n, i, arr) => (
          <div key={n} className="flow-item">
            <span className="flow-step">{n}</span>
            {i < arr.length - 1 && <span className="flow-arrow">→</span>}
          </div>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="modules-grid">
        {modules.map((m) => (
          <Link key={m.href} href={m.href} className="module-card">
            <span className="module-icon">{m.icon}</span>
            <div className="module-name">{m.name}</div>
            <p className="module-desc">{m.desc}</p>
          </Link>
        ))}
      </div>

      {/* Footer nav */}
      <div className="portal-footer">
        <Link href="/" className="footer-home">
          <span className="footer-neo">Neo</span>Proxy 
          <span className="footer-subtitle">← main site</span>
        </Link>
        <div className="footer-status">
          NPos KERNEL: <span className="status-active">IDLE</span>
        </div>
      </div>

      <style jsx>{`
        .npos-portal {
          position: relative;
          min-height: calc(100vh - 60px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          z-index: 1;
          background: #080d14;
          color: #ffffff;
        }

        /* Mobile First - Base Styles (320px+) */
        .portal-tag {
          font-family: 'Space Mono', monospace;
          font-size: clamp(0.625rem, 2vw, 0.7rem);
          color: #00d4ff;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-align: center;
          justify-content: center;
        }

        .tag-prefix {
          color: #4a6080;
        }

        .portal-title {
          text-align: center;
          margin-bottom: 3rem;
        }

        .portal-title h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2rem, 8vw, 3rem);
          font-weight: 800;
          line-height: 0.9;
          letter-spacing: -0.03em;
          margin: 0;
        }

        .title-neo {
          color: #00d4ff;
          display: block;
        }

        .title-proxy {
          color: white;
          display: block;
        }

        .title-subtitle {
          display: block;
          font-size: 0.32em;
          color: #4a6080;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          font-weight: 400;
          margin-top: 0.8rem;
        }

        .portal-flow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 3rem;
          font-family: 'Space Mono', monospace;
          font-size: clamp(0.625rem, 2.5vw, 0.75rem);
        }

        .flow-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .flow-step {
          padding: 0.4rem 0.9rem;
          border: 1px solid #0f1f35;
          background: #080d14;
          color: #00d4ff;
          letter-spacing: 0.1em;
          border-radius: 4px;
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .flow-arrow {
          color: #4a6080;
        }

        .modules-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1px;
          background: #0f1f35;
          border: 1px solid #0f1f35;
          max-width: 900px;
          width: 100%;
          margin: 0 auto;
        }

        .module-card {
          background: #080d14;
          padding: 2rem 1.5rem;
          text-decoration: none;
          display: block;
          transition: all 0.3s ease;
          text-align: center;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .module-card:hover {
          background: #0d1825;
          transform: translateY(-2px);
        }

        .module-icon {
          font-size: clamp(1.25rem, 4vw, 1.5rem);
          display: block;
          margin-bottom: 1rem;
        }

        .module-name {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1rem, 3vw, 1.1rem);
          font-weight: 700;
          color: white;
          margin-bottom: 0.5rem;
        }

        .module-desc {
          font-size: clamp(0.75rem, 2.5vw, 0.85rem);
          color: #4a6080;
          line-height: 1.4;
          margin: 0;
        }

        .portal-footer {
          margin-top: 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          max-width: 900px;
          width: 100%;
          margin-left: auto;
          margin-right: auto;
        }

        .footer-home {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(1rem, 3vw, 1.2rem);
          color: white;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .footer-neo {
          color: #00d4ff;
        }

        .footer-subtitle {
          font-family: 'Space Mono', monospace;
          color: #4a6080;
          font-size: 0.65em;
          font-weight: 400;
        }

        .footer-status {
          font-family: 'Space Mono', monospace;
          font-size: clamp(0.625rem, 2vw, 0.65rem);
          color: #4a6080;
          letter-spacing: 0.15em;
        }

        .status-active {
          color: #5ef0c0;
        }

        /* Small Phones (480px+) */
        @media (min-width: 480px) {
          .npos-portal {
            padding: 2.5rem 1.5rem;
          }

          .portal-tag {
            font-size: 0.8rem;
            margin-bottom: 2.5rem;
          }

          .portal-title h1 {
            font-size: clamp(2.5rem, 7vw, 3.5rem);
          }

          .portal-flow {
            font-size: 0.875rem;
            gap: 0.75rem;
            margin-bottom: 3.5rem;
          }

          .flow-step {
            padding: 0.5rem 1.25rem;
            min-height: 44px;
          }

          .module-card {
            padding: 2.5rem 2rem;
            min-height: 140px;
          }

          .module-icon {
            font-size: 1.75rem;
            margin-bottom: 1.25rem;
          }

          .module-name {
            font-size: 1.25rem;
          }

          .module-desc {
            font-size: 1rem;
          }

          .portal-footer {
            margin-top: 3.5rem;
            gap: 1.5rem;
          }

          .footer-home {
            font-size: 1.4rem;
          }

          .footer-status {
            font-size: 0.75rem;
          }
        }

        /* Tablets (768px+) */
        @media (min-width: 768px) {
          .npos-portal {
            padding: 4rem 2rem;
          }

          .portal-tag {
            font-size: 0.9rem;
            margin-bottom: 3rem;
          }

          .portal-title h1 {
            font-size: clamp(3rem, 6vw, 4rem);
          }

          .portal-flow {
            font-size: 1rem;
            gap: 1rem;
            margin-bottom: 4rem;
            flex-wrap: nowrap;
          }

          .flow-step {
            padding: 0.6rem 1.5rem;
            min-height: 48px;
          }

          .modules-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2px;
          }

          .module-card {
            padding: 3rem 2.5rem;
            min-height: 160px;
          }

          .module-icon {
            font-size: 2rem;
            margin-bottom: 1.5rem;
          }

          .module-name {
            font-size: 1.4rem;
          }

          .module-desc {
            font-size: 1.1rem;
          }

          .portal-footer {
            margin-top: 4rem;
            gap: 2rem;
          }

          .footer-home {
            font-size: 1.6rem;
          }

          .footer-status {
            font-size: 0.875rem;
          }
        }

        /* Desktop (1024px+) */
        @media (min-width: 1024px) {
          .npos-portal {
            padding: 5rem 3rem;
          }

          .portal-tag {
            font-size: 1rem;
            margin-bottom: 4rem;
          }

          .portal-title h1 {
            font-size: clamp(3.5rem, 5vw, 5rem);
          }

          .portal-flow {
            font-size: 1.125rem;
            gap: 1.25rem;
            margin-bottom: 5rem;
          }

          .flow-step {
            padding: 0.75rem 2rem;
            min-height: 56px;
          }

          .module-card {
            padding: 4rem 3rem;
            min-height: 200px;
          }

          .module-icon {
            font-size: 2.5rem;
            margin-bottom: 2rem;
          }

          .module-name {
            font-size: 1.6rem;
          }

          .module-desc {
            font-size: 1.25rem;
          }

          .portal-footer {
            margin-top: 5rem;
            gap: 2.5rem;
          }

          .footer-home {
            font-size: 1.8rem;
          }

          .footer-status {
            font-size: 1rem;
          }
        }

        /* Large Desktop (1280px+) */
        @media (min-width: 1280px) {
          .npos-portal {
            padding: 6rem 4rem;
          }

          .portal-title h1 {
            font-size: clamp(4rem, 4.5vw, 6rem);
          }

          .modules-grid {
            max-width: 1200px;
          }

          .module-card {
            padding: 5rem 4rem;
            min-height: 240px;
          }
        }

        /* Landscape Orientation for Mobile */
        @media (max-width: 768px) and (orientation: landscape) {
          .npos-portal {
            padding: 1.5rem 1rem;
            min-height: calc(100vh - 60px);
          }

          .portal-tag {
            font-size: 0.625rem;
            margin-bottom: 1.5rem;
          }

          .portal-title h1 {
            font-size: clamp(1.5rem, 6vw, 2rem);
          }

          .portal-flow {
            font-size: 0.625rem;
            gap: 0.375rem;
            margin-bottom: 2rem;
            flex-wrap: nowrap;
          }

          .flow-step {
            padding: 0.25rem 0.75rem;
            min-height: 32px;
            font-size: 0.5rem;
          }

          .module-card {
            padding: 1.5rem 1rem;
            min-height: 100px;
          }

          .module-icon {
            font-size: 1rem;
            margin-bottom: 0.75rem;
          }

          .module-name {
            font-size: 0.875rem;
          }

          .module-desc {
            font-size: 0.625rem;
          }

          .portal-footer {
            margin-top: 2rem;
            gap: 0.75rem;
          }

          .footer-home {
            font-size: 0.875rem;
          }

          .footer-status {
            font-size: 0.5rem;
          }
        }

        /* High DPI Displays */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .flow-step,
          .module-card {
            border-width: 0.5px;
          }
        }
      `}</style>
    </div>
  )
}
