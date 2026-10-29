// Galería local de sigilos forjados — mismo patrón que
// app/lab/proxygenesis/engine/gallery.ts: vive 100% en localStorage, sin
// backend. Guarda la intención + el set de letras resultante, no el SVG
// completo — el glifo se puede reconstruir al instante desde las letras
// (es determinístico), así que no hace falta persistir el path.

export type GallerySigil = {
  id: string
  intention: string
  keptLetters: string[]
  createdAt: string
}

const STORAGE_KEY = 'neoproxy-sigilo-gallery'
const MAX_ENTRIES = 40

export function loadSigilGallery(): GallerySigil[] {
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

export function saveSigilToGallery(entry: Omit<GallerySigil, 'id' | 'createdAt'>): GallerySigil | null {
  if (typeof window === 'undefined') return null
  const full: GallerySigil = {
    ...entry,
    id: `sgl_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`,
    createdAt: new Date().toISOString(),
  }
  const next = [full, ...loadSigilGallery()].slice(0, MAX_ENTRIES)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return full
  } catch {
    return null
  }
}

export function deleteSigilFromGallery(id: string): GallerySigil[] {
  const next = loadSigilGallery().filter(s => s.id !== id)
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }
  return next
}
