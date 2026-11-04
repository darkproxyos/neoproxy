// Galería de especímenes curados: piezas reales, generadas en una máquina
// local (corridas largas, de minutos a horas, con el motor de space
// colonization de app/lab/proxygenesis/engine/spaceColonization.ts) y
// subidas a mano al repo tras revisión. A diferencia de la galería local
// del generador (localStorage, se regenera desde semilla+parámetros al
// instante), acá el STL final SÍ se persiste: estas corridas no son
// instantáneas de reproducir.

export type CuratedMode = 'arbol' | 'coral' | 'concha'

export type CuratedStats = {
  seed: number
  nodeCount: number
  iteration: number
  maxIterations: number
  elapsedSeconds: number
  iterationsPerSecond: number
  params: Record<string, number | string>
}

export type CuratedSpecimen = {
  id: string
  title: string
  mode: CuratedMode
  stlPath: string // relativo a /public, ej. /proxygenesis/stls/arbol-01.stl
  thumbnail?: string // relativo a /public, screenshot real del espécimen; sin esto, la tarjeta cae a un placeholder
  stats: CuratedStats
  note?: string
  createdAt: string
}

export async function loadCuratedSpecimens(): Promise<CuratedSpecimen[]> {
  try {
    const res = await fetch('/proxygenesis/especimenes.json')
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}
