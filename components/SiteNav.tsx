'use client'
import Link from 'next/link'

const mono = "'Space Mono', monospace"

const navItems = [
  { label: 'HOME', href: '/' },
  { label: 'MANIFESTO', href: '/manifesto' },
  { label: 'ARSENAL', href: '/arsenal' },
  { label: 'FABRICATION', href: '/fabrication' },
  { label: 'ARTIFACTS', href: '/artifacts' },
]

export default function SiteNav() {
  return (
    <nav className="main-nav" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '18px 32px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
      background: 'rgba(0, 2, 5, 0.85)', backdropFilter: 'blur(6px)', borderBottom: '1px solid rgba(0, 212, 255, 0.15)'
    }}>
      <Link href="/" style={{ fontFamily: mono, fontSize: 13, color: '#00d4ff', letterSpacing: 4, textDecoration: 'none', flexShrink: 0 }}>
        NEO·PROXY
      </Link>
      <div className="nav-links" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        {navItems.map(({ label, href }) => (
          <Link key={label} href={href} className="nav-link" style={{
            fontFamily: mono, fontSize: 11, color: '#8fb8d6', letterSpacing: 2, textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap'
          }}>
            {label}
          </Link>
        ))}
      </div>
      <Link href="/npos" style={{
        fontFamily: mono, fontSize: 10, color: '#00d4ff', letterSpacing: 3, textDecoration: 'none',
        border: '1px solid #00d4ff66', padding: '8px 16px', flexShrink: 0
      }}>
        ACCESS
      </Link>
    </nav>
  )
}
