// Galería local de especímenes generados — vive 100% en localStorage, sin
// backend. Guarda semilla/parámetros + una miniatura (no el mesh completo:
// un espécimen se puede volver a generar al instante desde sus parámetros,
// así que no hace falta persistir geometría).

export type GalleryMode = 'coral' | 'arbol' | 'concha'

export type GallerySpecimen = {
  id: string
  mode: GalleryMode
  params: Record<string, number | string>
  nodes: number
  faces: number
  thumbnail: string // dataURL jpeg chico
  createdAt: string
}

const STORAGE_KEY = 'neoproxy-proxygenesis-gallery'
const PENDING_KEY = 'neoproxy-proxygenesis-pending-load'
const MAX_ENTRIES = 24

export function loadGallery(): GallerySpecimen[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSpecimenToGallery(entry: Omit<GallerySpecimen, 'id' | 'createdAt'>): GallerySpecimen | null {
  if (typeof window === 'undefined') return null
  const full: GallerySpecimen = {
    ...entry,
    id: `spc_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`,
    createdAt: new Date().toISOString(),
  }
  const next = [full, ...loadGallery()].slice(0, MAX_ENTRIES)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return full
  } catch {
    // localStorage lleno (dataURLs grandes) — no rompemos la generación por esto.
    return null
  }
}

export function deleteSpecimenFromGallery(id: string): GallerySpecimen[] {
  const next = loadGallery().filter(s => s.id !== id)
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }
  return next
}

export function setPendingLoad(mode: GalleryMode, params: Record<string, number | string>) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(PENDING_KEY, JSON.stringify({ mode, params })) } catch {}
}

export function consumePendingLoad(): { mode: GalleryMode; params: Record<string, number | string> } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    window.localStorage.removeItem(PENDING_KEY)
    return JSON.parse(raw)
  } catch {
    return null
  }
}
