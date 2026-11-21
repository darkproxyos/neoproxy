// Datos reales para /experimental/graficos -- cada dataset de acá ya
// existe en otra parte del sitio (home 3D, catálogo de experimental,
// catálogo de juegos) o cita hechos verificables (año real de publicación
// de cada algoritmo que corre en vivo en /experimental). Nada inventado
// para esta vista -- es una galería de formas de D3 sobre información que
// ya es del proyecto.

// --- 1. Red de fuerzas: las mismas zonas y uniones del Home 3D
// (app/page.tsx ZONES/ZONE_LINKS), portadas a mano acá porque esa página
// no las exporta -- si cambian ahí, hay que actualizar esto también. ---
export type GraphNode = { id: string; label: string; color: string; group: 'zone' | 'sub'; href: string }
export type GraphLink = { source: string; target: string }

export const ZONE_GRAPH_NODES: GraphNode[] = [
  { id: 'manifiesto', label: 'MANIFIESTO', color: '#ffb800', group: 'zone', href: '/manifesto' },
  { id: 'fabricacion', label: 'FABRICACIÓN', color: '#5f95c9', group: 'zone', href: '/fabrication' },
  { id: 'impresion3d', label: 'IMPRESIÓN 3D', color: '#5f95c9', group: 'sub', href: '/fabrication' },
  { id: 'artefactos', label: 'ARTEFACTOS', color: '#5f95c9', group: 'sub', href: '/artifacts' },
  { id: 'especimenes', label: 'ESPECÍMENES', color: '#ff8c1a', group: 'zone', href: '/especimenes' },
  { id: 'experimental', label: 'EXPERIMENTAL', color: '#cc0000', group: 'zone', href: '/experimental' },
  { id: 'oraculo', label: 'ORÁCULO', color: '#cc0000', group: 'sub', href: '/experimental/oraculo' },
  { id: 'sigilo', label: 'SIGILO', color: '#cc0000', group: 'sub', href: '/experimental/sigilo' },
  { id: 'enjambre', label: 'ENJAMBRE', color: '#cc0000', group: 'sub', href: '/experimental/enjambre' },
  { id: 'proxyverse', label: 'PROXYVERSE', color: '#00ff9d', group: 'zone', href: '/proxyverse' },
  { id: 'conocimiento', label: 'CODEX COGITO', color: '#6644aa', group: 'zone', href: '/knowledge' },
  { id: 'filosofia', label: 'FILOSOFÍA', color: '#6644aa', group: 'sub', href: '/knowledge/filosofia' },
]

export const ZONE_GRAPH_LINKS: GraphLink[] = [
  { source: 'fabricacion', target: 'especimenes' },
  { source: 'especimenes', target: 'experimental' },
  { source: 'experimental', target: 'conocimiento' },
  { source: 'experimental', target: 'proxyverse' },
  { source: 'conocimiento', target: 'proxyverse' },
  { source: 'fabricacion', target: 'impresion3d' },
  { source: 'fabricacion', target: 'artefactos' },
  { source: 'experimental', target: 'oraculo' },
  { source: 'experimental', target: 'sigilo' },
  { source: 'experimental', target: 'enjambre' },
  { source: 'conocimiento', target: 'filosofia' },
]

// --- 2. Dispersión temporal: los algoritmos reales que corren en vivo en
// /experimental (Workbench, Enjambre, Red, Memoria, Evolución), por año
// real de publicación -- mismos colores que LAB_MODES en
// app/experimental/page.tsx, para que el color siga significando lo mismo
// en todo el sitio. DIALÉCTICA queda afuera: discute pensadores, no corre
// un algoritmo con año propio. ---
export type AlgorithmPoint = { name: string; year: number; mode: string; modeColor: string; href: string }

export const ALGORITHMS_TIMELINE: AlgorithmPoint[] = [
  { name: 'Turing — reacción-difusión', year: 1952, mode: 'WORKBENCH', modeColor: '#cc0000', href: '/experimental/workbench' },
  { name: 'Erdős–Rényi — grafos aleatorios', year: 1959, mode: 'RED', modeColor: '#00d4ff', href: '/experimental/red' },
  { name: 'Raup — coiling (conchas)', year: 1962, mode: 'WORKBENCH', modeColor: '#cc0000', href: '/experimental/workbench' },
  { name: 'Lorenz — atractor caótico', year: 1963, mode: 'WORKBENCH', modeColor: '#cc0000', href: '/experimental/workbench' },
  { name: 'Holland — algoritmo genético', year: 1975, mode: 'EVOLUCIÓN', modeColor: '#6366f1', href: '/experimental/evolucion' },
  { name: 'Hopfield — memoria asociativa', year: 1982, mode: 'MEMORIA', modeColor: '#00ff9d', href: '/experimental/memoria' },
  { name: 'Dawkins — biomorfos', year: 1986, mode: 'EVOLUCIÓN', modeColor: '#6366f1', href: '/experimental/evolucion' },
  { name: 'Reynolds — boids', year: 1987, mode: 'ENJAMBRE', modeColor: '#ffb800', href: '/experimental/enjambre' },
  { name: 'Bak, Tang & Wiesenfeld — sandpile', year: 1987, mode: 'ENJAMBRE', modeColor: '#ffb800', href: '/experimental/enjambre' },
  { name: 'Pearl — redes bayesianas', year: 1988, mode: 'RED', modeColor: '#00d4ff', href: '/experimental/red' },
  { name: 'Barabási–Albert — redes libres de escala', year: 1999, mode: 'RED', modeColor: '#00d4ff', href: '/experimental/red' },
  { name: 'Runions, Lane & Prusinkiewicz — space colonization', year: 2007, mode: 'WORKBENCH', modeColor: '#cc0000', href: '/experimental/workbench' },
  { name: 'Alsing — síntesis genética de imágenes', year: 2008, mode: 'EVOLUCIÓN', modeColor: '#6366f1', href: '/experimental/evolucion' },
]

// --- 3. Catálogo de PROXYGAMES por estado -- mismos ids/status que
// app/games/page.tsx CATALOG (10 juegos: 4 jugables, 6 demo). ---
export type GameStatusEntry = { title: string; status: 'jugable' | 'demo' }

export const GAMES_BY_STATUS: GameStatusEntry[] = [
  { title: 'SHOOTER', status: 'demo' },
  { title: 'TR1CK5T3R', status: 'demo' },
  { title: 'ESPECTRO', status: 'jugable' },
  { title: 'FREESTYLE // APRENDIZAJE', status: 'jugable' },
  { title: 'TR1CK5T3R // ESPEJO', status: 'demo' },
  { title: 'FREESTYLE', status: 'jugable' },
  { title: 'DIGIZ', status: 'jugable' },
  { title: 'MÖBIUS', status: 'demo' },
  { title: 'FREESTYLE // VOZ', status: 'demo' },
  { title: 'MIMOS VS PAYASOS', status: 'demo' },
]
