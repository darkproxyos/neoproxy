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

// Agrupa el índice del panel mobile en bloques editoriales — puramente
// presentacional, no reestructura nav-config.ts. La clave es la sección
// de primer nivel que abre cada bloque.
const NAV_GROUP_LABEL: Record<string, string> = {
  HOME: 'NÚCLEO',
  'FABRICACIÓN': 'PRODUCCIÓN',
  PROXYGAMES: 'EXPERIENCIAS',
  CONOCIMIENTO: 'SABER',
}

// Pictograma mínimo por sección — trazo, no relleno, para no competir con
// el nodo de color que ya identifica la zona.
function NavIcon({ label, color }: { label: string; color: string }) {
  const common = { width: 15, height: 15, viewBox: '0 0 16 16', fill: 'none', stroke: color, strokeWidth: 1.4 } as const
  switch (label) {
    case 'HOME':
      return <svg {...common} aria-hidden><path d="M2 8 L8 2.5 L14 8" /><path d="M3.5 7 V14 H12.5 V7" /><path d="M6.5 14 V10 H9.5 V14" /></svg>
    case 'MANIFIESTO':
      return <svg {...common} aria-hidden><path d="M4 1.5 V14.5" /><path d="M4 2.5 H12.5 L10.5 5 L12.5 7.5 H4" /></svg>
    case 'FABRICACIÓN':
      return <svg {...common} aria-hidden><path d="M8 1.5 L14 4.8 V11.2 L8 14.5 L2 11.2 V4.8 Z" /><path d="M2 4.8 L8 8 L14 4.8" /><path d="M8 8 V14.5" /></svg>
    case 'ESPECÍMENES':
      return <svg {...common} aria-hidden><path d="M8 1.5 L14 5 V11 L8 14.5 L2 11 V5 Z" /><circle cx="8" cy="8" r="1.4" fill={color} stroke="none" /></svg>
    case 'PROXYGAMES':
      return <svg {...common} aria-hidden><rect x="1.5" y="5.5" width="13" height="7" rx="3" /><circle cx="5.3" cy="9" r="0.9" fill={color} stroke="none" /><circle cx="10.7" cy="9" r="0.9" fill={color} stroke="none" /></svg>
    case 'REALIDAD AUMENTADA':
      return <svg {...common} aria-hidden><path d="M2 2 H5 M2 2 V5 M14 2 H11 M14 2 V5 M2 14 H5 M2 14 V11 M14 14 H11 M14 14 V11" /><circle cx="8" cy="8" r="2" /></svg>
    case 'EXPERIMENTAL':
      return <svg {...common} aria-hidden><path d="M6.3 1.5 H9.7 V5.8 L13 13 C13.4 13.8 12.8 14.5 12 14.5 H4 C3.2 14.5 2.6 13.8 3 13 L6.3 5.8 Z" /><path d="M5 10.5 H11" /></svg>
    case 'CONOCIMIENTO':
      return <svg {...common} aria-hidden><path d="M2 3 C4 2 6.5 2 8 3.3 C9.5 2 12 2 14 3 V12.5 C12 11.5 9.5 11.5 8 12.8 C6.5 11.5 4 11.5 2 12.5 Z" /><path d="M8 3.3 V12.8" /></svg>
    case 'PROXYVERSE':
      return <svg {...common} aria-hidden><circle cx="8" cy="3" r="1.6" /><circle cx="3" cy="12" r="1.6" /><circle cx="13" cy="12" r="1.6" /><path d="M7.2 4.3 L4 10.6 M8.8 4.3 L12 10.6" /></svg>
    default:
      return null
  }
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

// Nodo + axón — indicador orgánico de vida, no solo un cambio de color.
// Un ítem activo "respira" (pulsa) en vez de quedarse plano.
function LifeNode({ color, active, size = 6 }: { color: string; active: boolean; size?: number }) {
  return (
    <span
      aria-hidden
      className={active ? 'nav-node nav-node-active' : 'nav-node'}
      style={{
        width: size, height: size, borderRadius: '50%', background: color,
        boxShadow: active ? `0 0 8px ${color}, 0 0 2px ${color}` : 'none',
        flexShrink: 0, opacity: active ? 1 : 0.45,
      }}
    />
  )
}

// Reemplaza el "▼ / ▲" de texto: una sinapsis chica cuyo axón gira 180°
// al abrir — mitad orgánico (soma + axón), mitad esquema de circuito.
function SynapseChevron({ color, open }: { color: string; open: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden style={{ flexShrink: 0 }}>
      <circle cx="5" cy="3" r="1.6" fill={color} style={{ transition: 'fill 0.25s ease' }} />
      <line
        x1="5" y1="4.6" x2="5" y2="8.4" stroke={color} strokeWidth="1.1" strokeLinecap="round"
        style={{
          transformOrigin: '5px 4.6px',
          transform: open ? 'rotate(180deg) scaleY(1.15)' : 'rotate(0deg)',
          transition: 'transform 0.3s cubic-bezier(.4,1.6,.4,1), stroke 0.25s ease',
        }}
      />
    </svg>
  )
}

// Reemplaza "☰ / ✕": tres trazos que se funden en una X — morph real, no
// un glifo de fuente que cambia.
function HamburgerIcon({ color, open }: { color: string; open: boolean }) {
  const bar = (yClosed: number, rotate: number, yOpen: number): React.CSSProperties => ({
    position: 'absolute', left: 3, right: 3, height: 1.6, background: color, borderRadius: 1,
    top: open ? yOpen : yClosed,
    transform: open ? `rotate(${rotate}deg)` : 'rotate(0deg)',
    transformOrigin: 'center',
    transition: 'top 0.25s cubic-bezier(.4,1.6,.4,1), transform 0.25s cubic-bezier(.4,1.6,.4,1), opacity 0.2s ease',
    opacity: open && rotate === 0 ? 0 : 1,
  })
  return (
    <span style={{ position: 'relative', width: 16, height: 16, display: 'inline-block' }}>
      <span style={bar(4, 45, 7)} />
      <span style={bar(7.5, 0, 7.5)} />
      <span style={bar(11, -45, 7)} />
    </span>
  )
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
      background: 'rgba(0, 2, 5, 0.85)', backdropFilter: 'blur(6px)',
    }}>
      <div className="nav-pulse-line" aria-hidden style={{ ['--pulse-color' as any]: accent }} />

      <Link href="/" style={{
        fontFamily: mono, fontSize: 13, color: '#00d4ff', letterSpacing: 4, textDecoration: 'none',
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <LifeNode color={accent} active size={7} />
        NEO·PROXY
      </Link>

      <div className="site-nav-links" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {navConfig.map((entry) => {
          if (isGroup(entry)) {
            const active = groupActive(pathname, entry)
            const open = openGroup === entry.label
            const groupColor = NAV_COLORS[entry.label] ?? '#00d4ff'
            return (
              <div key={entry.label} style={{ position: 'relative' }}>
                <button
                  onClick={() => setOpenGroup(open ? null : entry.label)}
                  aria-expanded={open}
                  className="site-nav-link"
                  style={{
                    fontFamily: mono, fontSize: 11, letterSpacing: 2, whiteSpace: 'nowrap',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0',
                    color: active ? groupColor : '#8fb8d6',
                    display: 'flex', alignItems: 'center', gap: 7,
                  }}
                >
                  <LifeNode color={groupColor} active={active} />
                  {entry.label}
                  <SynapseChevron color={active || open ? groupColor : '#8fb8d6'} open={open} />
                </button>
                {open && (
                  <div className="nav-dropdown" style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: 10, minWidth: 230,
                    borderColor: `${groupColor}55`,
                    ['--dd-color' as any]: groupColor,
                  }}>
                    <span className="nav-corner nav-corner-tl" />
                    <span className="nav-corner nav-corner-br" />
                    <div className="nav-dropdown-texture" aria-hidden />
                    <div style={{ position: 'relative', padding: '8px 0' }}>
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
                                <div key={sub.href} className="nav-dropdown-item">
                                  <NavLink
                                    item={sub}
                                    pathname={pathname}
                                    activeColor={groupColor}
                                    style={{
                                      fontFamily: mono, fontSize: 11, letterSpacing: 1.5, textDecoration: 'none',
                                      padding: '10px 18px 10px 30px', minHeight: 44, display: 'flex', alignItems: 'center',
                                      whiteSpace: 'nowrap', position: 'relative',
                                    }}
                                  />
                                </div>
                              )
                            ))}
                          </div>
                        ) : (
                          <div key={item.href} className="nav-dropdown-item">
                            <NavLink
                              item={item}
                              pathname={pathname}
                              activeColor={groupColor}
                              style={{
                                fontFamily: mono, fontSize: 11, letterSpacing: 1.5, textDecoration: 'none',
                                padding: '10px 18px', minHeight: 44, display: 'flex', alignItems: 'center',
                                whiteSpace: 'nowrap', position: 'relative',
                              }}
                            />
                          </div>
                        )
                      ))}
                    </div>
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

          const entryColor = NAV_COLORS[entry.label] ?? '#00d4ff'
          const active = isActive(pathname, entry.href)
          return (
            <Link key={entry.href} href={entry.href} className="site-nav-link" style={{
              fontFamily: mono, fontSize: 11, letterSpacing: 2, textDecoration: 'none', whiteSpace: 'nowrap',
              color: active ? entryColor : '#8fb8d6', display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <LifeNode color={entryColor} active={active} />
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
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <HamburgerIcon color="#00d4ff" open={false} />
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
          <div className="nav-dropdown-texture" aria-hidden style={{ position: 'fixed', inset: 0 }} />

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
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <HamburgerIcon color={accent} open />
            </button>
          </div>

          {sessionAgent && (
            <div style={{
              position: 'relative', zIndex: 1, fontFamily: "'Newsreader', serif", fontSize: 15, color: '#e8ecf2',
              fontStyle: 'italic', fontWeight: 400, lineHeight: 1.45, marginTop: 12, paddingLeft: 12,
              borderLeft: `2px solid ${accent}55`,
            }}>
              {sessionAgent.ambient.length > 0 ? sessionAgent.ambient[0] : sessionAgent.quote}
            </div>
          )}

          <div className="nav-spine" style={{ ['--spine-color' as any]: accent }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 24, flexGrow: 1, position: 'relative', zIndex: 1 }}>
              {navConfig.flatMap((entry, idx) => {
                const sectionColor = NAV_COLORS[entry.label] ?? accent
                const groupLabel = NAV_GROUP_LABEL[entry.label]
                const num = String(idx + 1).padStart(2, '0')
                const divider = groupLabel ? (
                  <div key={`div-${entry.label}`} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    margin: idx === 0 ? '0 0 2px 4px' : '16px 0 2px 4px',
                  }}>
                    <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: 3, color: '#3a4a60' }}>{groupLabel}</span>
                    <div style={{ flex: 1, height: 1, background: '#3a4a6055' }} />
                  </div>
                ) : null

                if (isGroup(entry)) {
                  const groupIsActive = groupActive(pathname, entry)
                  const content = (
                    <div
                      key={entry.label}
                      className="nav-item-in"
                      style={{ marginBottom: 12, animationDelay: delay() }}
                    >
                      <div style={{
                        fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '10px 4px',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <span style={{ fontSize: 9, color: '#3a4a60', width: 16, flexShrink: 0 }}>{num}</span>
                        <NavIcon label={entry.label} color={sectionColor} />
                        <span style={{ flex: 1, color: groupIsActive ? sectionColor : '#d7e4f0' }}>{entry.label}</span>
                        <LifeNode color={sectionColor} active={groupIsActive} />
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
                  return divider ? [divider, content] : [content]
                }

                if (!entry.live) {
                  const content = (
                    <div
                      key={entry.label}
                      className="nav-item-in"
                      style={{
                        fontFamily: mono, fontSize: 14, letterSpacing: 2, color: '#4a6080',
                        padding: '12px 4px', minHeight: 44, display: 'flex', alignItems: 'center', gap: 10,
                        animationDelay: delay(),
                      }}
                    >
                      <span style={{ fontSize: 9, color: '#3a4a60', width: 16, flexShrink: 0 }}>{num}</span>
                      {entry.label} <span style={{ fontSize: 9, marginLeft: 8 }}>· PRÓXIMAMENTE</span>
                    </div>
                  )
                  return divider ? [divider, content] : [content]
                }

                const active = isActive(pathname, entry.href)
                const content = (
                  <div key={entry.href} className="nav-item-in" style={{ animationDelay: delay() }}>
                    <Link
                      href={entry.href}
                      onClick={() => setMobileOpen(false)}
                      style={{
                        fontFamily: mono, fontSize: 14, letterSpacing: 2, textDecoration: 'none',
                        padding: '12px 4px', minHeight: 44, display: 'flex', alignItems: 'center', gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 9, color: '#3a4a60', width: 16, flexShrink: 0 }}>{num}</span>
                      <NavIcon label={entry.label} color={sectionColor} />
                      <span style={{
                        flex: 1, color: active ? sectionColor : '#d7e4f0',
                        textShadow: active ? `0 0 10px ${sectionColor}` : 'none',
                      }}>
                        {entry.label}
                      </span>
                      <LifeNode color={sectionColor} active={active} />
                    </Link>
                  </div>
                )
                return divider ? [divider, content] : [content]
              })}
            </div>
          </div>

          <div style={{
            position: 'relative', zIndex: 1, marginTop: 20, padding: '14px 14px 2px',
            border: `1px solid ${accent}22`, fontFamily: mono, fontSize: 10, color: accent, letterSpacing: 1.5,
          }}>
            <span aria-hidden style={{ position: 'absolute', top: -1, left: -1, width: 7, height: 7, borderTop: `1px solid ${accent}aa`, borderLeft: `1px solid ${accent}aa` }} />
            <span aria-hidden style={{ position: 'absolute', top: -1, right: -1, width: 7, height: 7, borderTop: `1px solid ${accent}aa`, borderRight: `1px solid ${accent}aa` }} />
            <span aria-hidden style={{ position: 'absolute', bottom: -1, left: -1, width: 7, height: 7, borderBottom: `1px solid ${accent}aa`, borderLeft: `1px solid ${accent}aa` }} />
            <span aria-hidden style={{ position: 'absolute', bottom: -1, right: -1, width: 7, height: 7, borderBottom: `1px solid ${accent}aa`, borderRight: `1px solid ${accent}aa` }} />
            <div style={{ paddingBottom: 14 }}>
              <SessionBlock />
            </div>
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

      <style>{`
        /* Línea de pulso bajo la barra — un trazo que recorre el borde en
           vez de un borde estático: la barra "late" en lugar de solo estar. */
        .nav-pulse-line {
          position: absolute; left: 0; right: 0; bottom: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--pulse-color, #00d4ff) 20%, var(--pulse-color, #00d4ff) 80%, transparent);
          opacity: 0.35;
          background-size: 200% 100%;
          animation: nav-pulse-travel 6s ease-in-out infinite;
        }
        @keyframes nav-pulse-travel {
          0%, 100% { background-position: 100% 0; opacity: 0.2; }
          50% { background-position: 0% 0; opacity: 0.55; }
        }

        .nav-node { transition: opacity 0.3s ease, box-shadow 0.3s ease; }
        .nav-node-active { animation: nav-node-breathe 2.6s ease-in-out infinite; }
        @keyframes nav-node-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.35); }
        }

        /* Panel desplegable: crece desde el trigger como una raíz, no
           aparece de golpe. */
        .nav-dropdown {
          background: rgba(0, 4, 10, 0.97);
          border: 1px solid;
          backdrop-filter: blur(10px);
          transform-origin: top center;
          animation: nav-dropdown-grow 0.3s cubic-bezier(.3,1.4,.4,1) backwards;
          overflow: hidden;
        }
        @keyframes nav-dropdown-grow {
          0% { opacity: 0; transform: scaleY(0.4) translateY(-6px); }
          60% { opacity: 1; }
          100% { opacity: 1; transform: scaleY(1) translateY(0); }
        }
        .nav-dropdown-texture {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image: repeating-linear-gradient(135deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 7px);
        }
        .nav-corner {
          position: absolute; width: 9px; height: 9px; pointer-events: none; z-index: 1;
          border-color: var(--dd-color, #00d4ff);
        }
        .nav-corner-tl { top: -1px; left: -1px; border-top: 2px solid; border-left: 2px solid; }
        .nav-corner-br { bottom: -1px; right: -1px; border-bottom: 2px solid; border-right: 2px solid; }

        .nav-dropdown-item { position: relative; }
        .nav-dropdown-item::before {
          content: ''; position: absolute; left: 6px; top: 50%; bottom: 50%; width: 1.5px;
          background: var(--dd-color, #00d4ff); opacity: 0;
          transition: top 0.2s ease, bottom 0.2s ease, opacity 0.2s ease;
        }
        .nav-dropdown-item:hover::before { top: 22%; bottom: 22%; opacity: 0.8; }
        .nav-dropdown-item:hover a { color: var(--dd-color, #00d4ff) !important; }

        /* Columna vertebral del panel mobile: une los nodos como una
           espina/raíz en vez de dejarlos sueltos. */
        .nav-spine { position: relative; }
        .nav-spine::before {
          content: ''; position: absolute; left: 7px; top: 34px; bottom: 60px; width: 1px;
          background: linear-gradient(to bottom, transparent, var(--spine-color, #00d4ff)44, var(--spine-color, #00d4ff)22, transparent);
        }
      `}</style>
    </>
  )
}
