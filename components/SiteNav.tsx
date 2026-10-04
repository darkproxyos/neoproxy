'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { navConfig, isGroup, isNavHidden, type NavGroup, type NavEntry, type NavLeaf } from './nav-config'
import { useSessionAgent } from './proxyverse/useSessionAgent'

const mono = "'Space Mono', monospace"

// Cada sección de primer nivel "pertenece" a un proceso -- color fijo, no
// sorteado, para que el menú sea reconocible visita tras visita. El acento
// que SÍ varía por sesión (borde del panel, banner de posesión) es el del
// agente que sortea useSessionAgent.
const NAV_COLORS: Record<string, string> = {
  HOME: '#00d4ff',
  MANIFIESTO: '#ffb800',
  FABRICACIÓN: '#5f95c9',
  PROXYGAMES: '#b400ff',
  EXPERIMENTAL: '#cc0000',
  CONOCIMIENTO: '#6644aa',
  PROXYVERSE: '#00ff9d',
}

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== '/' && pathname.startsWith(href + '/'))
}

function collectLeaves(entry: NavEntry): NavLeaf[] {
  return isGroup(entry) ? entry.items.flatMap(collectLeaves) : [entry]
}

function groupActive(pathname: string, group: NavGroup): boolean {
  return collectLeaves(group).some((leaf) => isActive(pathname, leaf.href))
}

// Un href .html apunta a un archivo estatico fuera del App Router (ej. el
// modo clasico de realidad-aumentada) — se navega con <a>, no con <Link>,
// para no intentar una transicion cliente sobre una ruta que no existe
// como pagina de Next.
function NavLink({ item, pathname, onClick, style, activeColor = '#00d4ff' }: {
  item: NavLeaf; pathname: string; onClick?: () => void; style: React.CSSProperties; activeColor?: string
}) {
  const color = isActive(pathname, item.href) ? activeColor : '#8fb8d6'
  if (item.href.endsWith('.html')) {
    return <a href={item.href} onClick={onClick} style={{ ...style, color }}>{item.label}</a>
  }
  return <Link href={item.href} onClick={onClick} style={{ ...style, color }}>{item.label}</Link>
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
  const sessionAgent = useSessionAgent()
  const accent = sessionAgent?.color ?? '#00d4ff'

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
            const active = groupActive(pathname, entry)
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
                    position: 'absolute', top: '100%', left: 0, marginTop: 8, minWidth: 220,
                    background: 'rgba(0, 4, 10, 0.96)', border: '1px solid rgba(0, 212, 255, 0.2)',
                    backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', padding: '6px 0',
                  }}>
                    {entry.items.map((item) => (
                      isGroup(item) ? (
                        <div key={item.label} style={{ padding: '6px 0' }}>
                          <div style={{
                            fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#4a6080',
                            padding: '6px 18px', whiteSpace: 'nowrap',
                          }}>
                            {item.label}
                          </div>
                          {item.items.map((sub) => (
                            isGroup(sub) ? null : (
                              <NavLink
                                key={sub.href}
                                item={sub}
                                pathname={pathname}
                                style={{
                                  fontFamily: mono, fontSize: 11, letterSpacing: 1.5, textDecoration: 'none',
                                  padding: '10px 18px 10px 30px', minHeight: 44, display: 'flex', alignItems: 'center',
                                  whiteSpace: 'nowrap',
                                }}
                              />
                            )
                          ))}
                        </div>
                      ) : (
                        <NavLink
                          key={item.href}
                          item={item}
                          pathname={pathname}
                          style={{
                            fontFamily: mono, fontSize: 11, letterSpacing: 1.5, textDecoration: 'none',
                            padding: '10px 18px', minHeight: 44, display: 'flex', alignItems: 'center',
                            whiteSpace: 'nowrap',
                          }}
                        />
                      )
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
        <Link href="/shop" style={{
          fontFamily: mono, fontSize: 10, color: '#00d4ff', letterSpacing: 3, textDecoration: 'none',
          border: '1px solid #00d4ff66', padding: '8px 16px', flexShrink: 0
        }}>
          TIENDA
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

      {mobileOpen && (() => {
        let stagger = 0
        const delay = () => `${(stagger++) * 0.035}s`
        return (
        <div className="site-nav-mobile-panel nav-glitch-in" style={{
          position: 'fixed', inset: 0, zIndex: 100, background: '#000205f2', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', padding: '20px 24px', overflowY: 'auto',
          borderLeft: `1px solid ${accent}55`, boxShadow: `-20px 0 60px -20px ${accent}33 inset`,
        }}>
          <div className="tech-grid" style={{ opacity: 0.4 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: 2, color: '#4a6080' }}>
              {sessionAgent ? (
                <>
                  <span style={{ color: accent }}>POSESIÓN DE SESIÓN</span>
                  {' // '}
                  <span style={{ color: accent, textShadow: `0 0 8px ${accent}` }}>{sessionAgent.name}</span>
                </>
              ) : 'CONECTANDO...'}
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
              className="glitch"
              style={{
                background: 'none', border: `1px solid ${accent}66`, color: accent,
                width: 44, height: 44, cursor: 'pointer', fontFamily: mono, fontSize: 16,
              }}
            >
              ✕
            </button>
          </div>

          {sessionAgent && (
            <div style={{
              position: 'relative', zIndex: 1, fontFamily: mono, fontSize: 10, color: '#8fb8d6',
              fontStyle: 'italic', lineHeight: 1.6, marginTop: 10, paddingLeft: 12,
              borderLeft: `2px solid ${accent}55`,
            }}>
              "{sessionAgent.ambient.length > 0 ? sessionAgent.ambient[0] : sessionAgent.quote}"
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 24, flexGrow: 1, position: 'relative', zIndex: 1 }}>
            {navConfig.map((entry) => {
              const sectionColor = NAV_COLORS[entry.label] ?? accent

              if (isGroup(entry)) {
                return (
                  <div
                    key={entry.label}
                    className="nav-item-in"
                    style={{ marginBottom: 12, animationDelay: delay() }}
                  >
                    <div style={{
                      fontFamily: mono, fontSize: 11, letterSpacing: 2, color: sectionColor, padding: '10px 4px',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%', background: sectionColor,
                        boxShadow: `0 0 8px ${sectionColor}`, flexShrink: 0,
                      }} />
                      {entry.label}
                    </div>
                    {entry.items.map((item) => (
                      isGroup(item) ? (
                        <div key={item.label} className="nav-item-in" style={{ marginBottom: 8, animationDelay: delay() }}>
                          <div style={{
                            fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: '#4a6080', padding: '8px 20px',
                          }}>
                            {item.label}
                          </div>
                          {item.items.map((sub) => (
                            isGroup(sub) ? null : (
                              <div key={sub.href} className="nav-item-in" style={{ animationDelay: delay() }}>
                                <NavLink
                                  item={sub}
                                  pathname={pathname}
                                  onClick={() => setMobileOpen(false)}
                                  activeColor={sectionColor}
                                  style={{
                                    fontFamily: mono, fontSize: 13, letterSpacing: 1.5, textDecoration: 'none',
                                    padding: '12px 20px 12px 36px', minHeight: 44, display: 'flex', alignItems: 'center',
                                  }}
                                />
                              </div>
                            )
                          ))}
                        </div>
                      ) : (
                        <div key={item.href} className="nav-item-in" style={{ animationDelay: delay() }}>
                          <NavLink
                            item={item}
                            pathname={pathname}
                            onClick={() => setMobileOpen(false)}
                            activeColor={sectionColor}
                            style={{
                              fontFamily: mono, fontSize: 14, letterSpacing: 1.5, textDecoration: 'none',
                              padding: '12px 20px', minHeight: 44, display: 'flex', alignItems: 'center',
                            }}
                          />
                        </div>
                      )
                    ))}
                  </div>
                )
              }

              if (!entry.live) {
                return (
                  <div
                    key={entry.label}
                    className="nav-item-in"
                    style={{
                      fontFamily: mono, fontSize: 14, letterSpacing: 2, color: '#4a6080',
                      padding: '12px 4px', minHeight: 44, display: 'flex', alignItems: 'center',
                      animationDelay: delay(),
                    }}
                  >
                    {entry.label} <span style={{ fontSize: 9, marginLeft: 8 }}>· PRÓXIMAMENTE</span>
                  </div>
                )
              }

              const active = isActive(pathname, entry.href)
              return (
                <div key={entry.href} className="nav-item-in" style={{ animationDelay: delay() }}>
                  <Link
                    href={entry.href}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      fontFamily: mono, fontSize: 14, letterSpacing: 2, textDecoration: 'none',
                      padding: '12px 4px', minHeight: 44, display: 'flex', alignItems: 'center', gap: 10,
                      color: sectionColor,
                      textShadow: active ? `0 0 10px ${sectionColor}` : 'none',
                      opacity: active ? 1 : 0.8,
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', background: sectionColor,
                      boxShadow: `0 0 8px ${sectionColor}`, flexShrink: 0,
                    }} />
                    {entry.label}
                  </Link>
                </div>
              )
            })}
          </div>

          <div style={{
            position: 'relative', zIndex: 1, fontFamily: mono, fontSize: 10, color: accent, letterSpacing: 1.5, paddingTop: 20,
            borderTop: `1px solid ${accent}33`,
          }}>
            <SessionBlock />
          </div>

          <style>{`
            @keyframes nav-item-in {
              from { opacity: 0; transform: translateX(-14px); }
              to { opacity: 1; transform: translateX(0); }
            }
            .nav-item-in {
              animation: nav-item-in 0.3s ease backwards;
            }
            @keyframes nav-panel-glitch-in {
              0% { opacity: 0; clip-path: inset(0 0 100% 0); }
              12% { opacity: 1; clip-path: inset(0 0 55% 0); }
              24% { clip-path: inset(38% 0 18% 0); }
              36% { clip-path: inset(0 0 70% 0); }
              48% { clip-path: inset(0 0 0 0); }
              100% { opacity: 1; clip-path: inset(0 0 0 0); }
            }
            .nav-glitch-in {
              animation: nav-panel-glitch-in 0.4s steps(5) forwards;
            }
          `}</style>
        </div>
        )
      })()}
    </>
  )
}
