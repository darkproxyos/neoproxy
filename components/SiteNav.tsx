'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { navConfig, isGroup, isNavHidden, type NavGroup } from './nav-config'

const mono = "'Space Mono', monospace"

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== '/' && pathname.startsWith(href + '/'))
}

function SessionBlock({ compact }: { compact?: boolean }) {
  const { data: session } = useSession()

  if (session) {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span>
          OPERATOR: <strong>{session.user?.name?.toUpperCase()}</strong>
          {' // '}
          ROLE: {((session.user as any)?.role || 'user').toUpperCase()}
        </span>
        <button
          onClick={() => signOut()}
          style={{
            color: '#ff4444', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit', minHeight: compact ? 'auto' : 44,
          }}
        >
          [LOGOUT]
        </button>
      </span>
    )
  }

  return (
    <Link href="/login" style={{ color: '#00d4ff88', textDecoration: 'none' }}>
      OPERATOR: ANONYMOUS // [ACCESO]
    </Link>
  )
}

export default function SiteNav() {
  const pathname = usePathname()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenGroup(null)
        setMobileOpen(false)
      }
    }
    function onClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [])

  useEffect(() => {
    setOpenGroup(null)
    setMobileOpen(false)
  }, [pathname])

  if (!pathname || isNavHidden(pathname)) return null

  const groupActive = (group: NavGroup) => group.items.some((it) => isActive(pathname, it.href))

  return (
    <>
    <nav ref={navRef as any} className="site-nav" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '16px 32px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
      background: 'rgba(0, 2, 5, 0.85)', backdropFilter: 'blur(6px)', borderBottom: '1px solid rgba(0, 212, 255, 0.15)'
    }}>
      <Link href="/" style={{ fontFamily: mono, fontSize: 13, color: '#00d4ff', letterSpacing: 4, textDecoration: 'none', flexShrink: 0 }}>
        NEO·PROXY
      </Link>

      <div className="site-nav-links" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {navConfig.map((entry) => {
          if (isGroup(entry)) {
            const active = groupActive(entry)
            const open = openGroup === entry.label
            return (
              <div key={entry.label} style={{ position: 'relative' }}>
                <button
                  onClick={() => setOpenGroup(open ? null : entry.label)}
                  aria-expanded={open}
                  className="site-nav-link"
                  style={{
                    fontFamily: mono, fontSize: 11, letterSpacing: 2, whiteSpace: 'nowrap',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0',
                    color: active ? '#00d4ff' : '#8fb8d6',
                  }}
                >
                  {entry.label} {open ? '▲' : '▼'}
                </button>
                {open && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: 8, minWidth: 200,
                    background: 'rgba(0, 4, 10, 0.96)', border: '1px solid rgba(0, 212, 255, 0.2)',
                    backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', padding: '6px 0',
                  }}>
                    {entry.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        style={{
                          fontFamily: mono, fontSize: 11, letterSpacing: 1.5, textDecoration: 'none',
                          padding: '10px 18px', minHeight: 44, display: 'flex', alignItems: 'center',
                          color: isActive(pathname, item.href) ? '#00d4ff' : '#8fb8d6',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          if (!entry.live) {
            return (
              <span key={entry.label} title="Próximamente" style={{
                fontFamily: mono, fontSize: 11, letterSpacing: 2, color: '#4a6080', cursor: 'default', whiteSpace: 'nowrap',
              }}>
                {entry.label}
              </span>
            )
          }

          return (
            <Link key={entry.href} href={entry.href} className="site-nav-link" style={{
              fontFamily: mono, fontSize: 11, letterSpacing: 2, textDecoration: 'none', whiteSpace: 'nowrap',
              color: isActive(pathname, entry.href) ? '#00d4ff' : '#8fb8d6',
            }}>
              {entry.label}
            </Link>
          )
        })}
      </div>

      <div className="site-nav-side" style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div className="site-nav-session" style={{
          fontFamily: mono, fontSize: 10, color: '#00d4ff', letterSpacing: 1.5, whiteSpace: 'nowrap',
        }}>
          <SessionBlock compact />
        </div>
        <Link href="/npos" style={{
          fontFamily: mono, fontSize: 10, color: '#00d4ff', letterSpacing: 3, textDecoration: 'none',
          border: '1px solid #00d4ff66', padding: '8px 16px', flexShrink: 0
        }}>
          ACCESS
        </Link>
        <button
          className="site-nav-toggle"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          style={{
            display: 'none', background: 'none', border: '1px solid #00d4ff44', color: '#00d4ff',
            width: 44, height: 44, cursor: 'pointer', fontFamily: mono, fontSize: 16,
          }}
        >
          ☰
        </button>
      </div>
    </nav>

      {mobileOpen && (
        <div className="site-nav-mobile-panel" style={{
          position: 'fixed', inset: 0, zIndex: 100, background: '#000205ee', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', padding: '20px 24px', overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
              style={{
                background: 'none', border: '1px solid #00d4ff44', color: '#00d4ff',
                width: 44, height: 44, cursor: 'pointer', fontFamily: mono, fontSize: 16,
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 24, flexGrow: 1 }}>
            {navConfig.map((entry) => {
              if (isGroup(entry)) {
                return (
                  <div key={entry.label} style={{ marginBottom: 12 }}>
                    <div style={{
                      fontFamily: mono, fontSize: 11, letterSpacing: 2, color: '#4a6080', padding: '10px 4px',
                    }}>
                      {entry.label}
                    </div>
                    {entry.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        style={{
                          fontFamily: mono, fontSize: 14, letterSpacing: 1.5, textDecoration: 'none',
                          padding: '12px 20px', minHeight: 44, display: 'flex', alignItems: 'center',
                          color: isActive(pathname, item.href) ? '#00d4ff' : '#8fb8d6',
                        }}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )
              }

              if (!entry.live) {
                return (
                  <div key={entry.label} style={{
                    fontFamily: mono, fontSize: 14, letterSpacing: 2, color: '#4a6080',
                    padding: '12px 4px', minHeight: 44, display: 'flex', alignItems: 'center',
                  }}>
                    {entry.label} <span style={{ fontSize: 9, marginLeft: 8 }}>· PRÓXIMAMENTE</span>
                  </div>
                )
              }

              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    fontFamily: mono, fontSize: 14, letterSpacing: 2, textDecoration: 'none',
                    padding: '12px 4px', minHeight: 44, display: 'flex', alignItems: 'center',
                    color: isActive(pathname, entry.href) ? '#00d4ff' : '#8fb8d6',
                  }}
                >
                  {entry.label}
                </Link>
              )
            })}
          </div>
          <div style={{
            fontFamily: mono, fontSize: 10, color: '#00d4ff', letterSpacing: 1.5, paddingTop: 20,
            borderTop: '1px solid rgba(0, 212, 255, 0.15)',
          }}>
            <SessionBlock />
          </div>
        </div>
      )}
    </>
  )
}
