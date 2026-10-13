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
  { label: 'EXPERIMENTAL', href: '/experimental', live: true },
  { label: 'CONOCIMIENTO', href: '/knowledge', live: true },
  { label: 'PROXYVERSE', href: '/proxyverse', live: true },
]

// Rutas donde el SiteNav global no se monta: herramientas fullscreen con
// chrome propio (ar, realidad-aumentada, draw/draw-synth, los canvas 3D de
// /lab) o vistas que no deben mostrar navegacion (login/admin/kernel). Wired,
// Planet y Spaceship son canvas/iframe a pantalla completa — el SiteNav
// global flotando encima choca con el HUD propio de cada juego. Los
// catálogos (/games, /experimental, /lab) sí lo muestran, por eso solo se
// ocultan las sub-rutas que son herramientas fullscreen de verdad.
// /lab/proxygenesis dejó de ser texto estático: ahora es un generador 3D
// con su propia barra superior — el SiteNav global se le superponía.
export const navHiddenPrefixes = ['/login', '/admin', '/kernel', '/lab/atractores', '/lab/hemibrain', '/lab/sandbox', '/lab/proxygenesis', '/games/wired', '/games/planet', '/games/spaceship', '/games/trickster', '/games/trickster-mirror', '/games/rap', '/games/rap-aprendizaje', '/ar', '/realidad-aumentada', '/draw', '/etereo']

export function isNavHidden(pathname: string): boolean {
  return navHiddenPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))
}
