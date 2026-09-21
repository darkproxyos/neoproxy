export type NavLeaf = {
  label: string
  href: string
  live: boolean
}

export type NavGroup = {
  label: string
  live: boolean
  items: NavLeaf[]
}

export type NavEntry = NavLeaf | NavGroup

export function isGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry
}

export const navConfig: NavEntry[] = [
  { label: 'HOME', href: '/', live: true },
  { label: 'MANIFIESTO', href: '/manifesto', live: true },
  {
    label: 'FABRICACIÓN',
    live: true,
    items: [
      { label: 'Impresión 3D', href: '/fabrication', live: true },
      { label: 'Artefactos', href: '/artifacts', live: true },
      { label: 'Arsenal', href: '/arsenal', live: true },
      { label: 'Tienda', href: '/shop', live: true },
      { label: 'Drop 01', href: '/shop/drop01', live: true },
    ],
  },
  {
    label: 'EXPERIMENTAL',
    live: true,
    items: [
      { label: 'Laboratorio', href: '/lab', live: true },
      { label: 'Stardust', href: '/npos/stardust', live: true },
      { label: 'Wired', href: '/games/wired', live: true },
      { label: 'Realidad Aumentada', href: '/realidad-aumentada', live: true },
      { label: 'AR Combat', href: '/ar', live: true },
      { label: 'Synth', href: '/draw/synth', live: true },
    ],
  },
  { label: 'CONOCIMIENTO', href: '/knowledge', live: true },
  { label: 'PROXYVERSE', href: '/proxyverse', live: true },
]

// Rutas donde el SiteNav global no se monta: herramientas fullscreen con
// chrome propio (lab, wired, ar, realidad-aumentada, draw/draw-synth) o
// vistas que no deben mostrar navegacion (login/admin/kernel).
export const navHiddenPrefixes = ['/login', '/admin', '/kernel', '/lab', '/games/wired', '/ar', '/realidad-aumentada', '/draw']

export function isNavHidden(pathname: string): boolean {
  return navHiddenPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))
}
