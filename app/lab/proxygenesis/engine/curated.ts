// Colección curada: especímenes reales, generados en una máquina local
// (corridas largas, de minutos a horas, con space colonization — ver
// spaceColonization.ts) y subidos a mano al repo. A diferencia de
// gallery.ts (localStorage, se regenera desde semilla+parámetros al
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
