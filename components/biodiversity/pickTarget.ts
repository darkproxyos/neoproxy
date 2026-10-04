export const MIN_TEXT_LENGTH = 40

// Candidatos: bloques de texto con contenido real, visibles por completo
// en el viewport (ni tapados por el nav fijo arriba, ni cortados abajo).
// Compartido por todas las especies de ProxyBiodiversidad.
export function pickTarget(): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll('p, li, blockquote')) as HTMLElement[]
  const visible = candidates.filter(el => {
    const text = el.textContent?.trim() ?? ''
    if (text.length < MIN_TEXT_LENGTH) return false
    const rect = el.getBoundingClientRect()
    return rect.top > 80 && rect.bottom < window.innerHeight - 40 && rect.width > 120
  })
  if (visible.length === 0) return null
  return visible[Math.floor(Math.random() * visible.length)]
}
