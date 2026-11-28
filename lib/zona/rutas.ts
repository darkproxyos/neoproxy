// El viaje: qué tramo es cada ruta. Inspirado en Stalker (Tarkovski, 1979): el Afuera en
// sepia, el Umbral en el gris de un televisor sintonizado en un canal muerto (Neuromante),
// la Zona en color. Las rutas que no están aquí no cambian (juegos, laboratorio, admin…).
// La tienda queda fuera a propósito: los productos se ven con sus colores reales.
export type Tramo = 'afuera' | 'umbral' | 'zona'

export const AFUERA = ['/', '/home-3d', '/home-grafico', '/home-circulos', '/home-senal', '/home-galeria', '/home-classic', '/manifesto', '/fabrication', '/artifacts']
export const UMBRAL = ['/umbral']
export const ZONA = ['/fenomenos', '/capas', '/humo', '/trenza', '/resonancia', '/rayo', '/especimenes', '/geometrias', '/antesis', '/lab/primercuerpo']

// las rutas de la serie FENÓMENOS (la entrada del menú, que pasa por el Umbral, se enciende en todas)
export const SERIE = ['/umbral', '/fenomenos', '/capas', '/humo', '/trenza', '/resonancia', '/rayo']

const match = (path: string, list: string[]) => list.some((r) => (r === '/' ? path === '/' : path === r || path.startsWith(r + '/')))
export const enSerie = (path: string) => match(path, SERIE)

export function tramoDe(path: string): Tramo | null {
  if (match(path, UMBRAL)) return 'umbral'
  if (match(path, ZONA)) return 'zona'
  if (match(path, AFUERA)) return 'afuera'
  return null
}

// se ejecuta antes del primer pintado (ver app/layout.tsx): el clima correcto desde el
// primer fotograma, sin pasar por el color para después desteñirse
export const BOOT_SCRIPT = `(function(){try{var p=location.pathname,A=${JSON.stringify(AFUERA)},U=${JSON.stringify(UMBRAL)},Z=${JSON.stringify(ZONA)};
function m(l){for(var i=0;i<l.length;i++){var r=l[i];if(r==='/'?p==='/':(p===r||p.indexOf(r+'/')===0))return true}return false}
var t=m(U)?'umbral':m(Z)?'zona':m(A)?'afuera':'';var h=document.documentElement;if(t)h.setAttribute('data-tramo',t);h.classList.add('tramo-boot')}catch(e){}})()`
