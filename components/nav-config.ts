export type NavLeaf = {
  label: string
  href: string
  live: boolean
}

export type NavGroup = {
  label: string
  live: boolean
  items: NavEntry[]
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
    ],
  },
  { label: 'PROXYGAMES', href: '/games', live: true },
  {
    label: 'EXPERIMENTAL',
    live: true,
    items: [
      { label: 'Laboratorio', href: '/lab', live: true },
      { label: 'Proxygenesis', href: '/lab/proxygenesis', live: true },
      { label: 'Hemibrain', href: '/lab/hemibrain', live: true },
      { label: 'Stardust', href: '/npos/stardust', live: true },
      { label: 'Etéreo', href: '/etereo', live: true },
      {
        label: 'Realidad Aumentada',
        live: true,
        items: [
          { label: 'Máscara Facial', href: '/realidad-aumentada', live: true },
          { label: 'AR Combat', href: '/ar', live: true },
          { label: 'Modo Clásico', href: '/realidad-aumentada/index.html', live: true },
        ],
      },
      { label: 'Synth', href: '/draw/synth', live: true },
    ],
  },
  { label: 'CONOCIMIENTO', href: '/knowledge', live: true },
  { label: 'PROXYVERSE', href: '/proxyverse', live: true },
]

// Rutas donde el SiteNav global no se monta: herramientas fullscreen con
// chrome propio (lab, wired, ar, realidad-aumentada, draw/draw-synth) o
// vistas que no deben mostrar navegacion (login/admin/kernel). Wired, Planet
// y Spaceship son canvas/iframe a pantalla completa — el SiteNav global
// flotando encima choca con el HUD propio de cada juego. El catálogo
// (/games) sí lo muestra, por eso solo se ocultan las sub-rutas.
export const navHiddenPrefixes = ['/login', '/admin', '/kernel', '/lab', '/games/wired', '/games/planet', '/games/spaceship', '/ar', '/realidad-aumentada', '/draw', '/etereo']

export function isNavHidden(pathname: string): boolean {
  return navHiddenPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))
}
