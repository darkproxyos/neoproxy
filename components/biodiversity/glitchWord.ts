// Técnica compartida por GlitchMite (ProxyBiodiversity) y Grieta: toma una
// palabra real del DOM (no una copia encima), la envuelve en un span vía
// splitText/replaceWith, y la devuelve para que el que la llamó le aplique
// la animación — luego revertSpan() la deshace dejando el texto original
// intacto. Un solo lugar para esta mecánica en vez de reimplementarla cada
// vez que algo necesita glitchear texto vivo del sitio.

export const GLITCH_WORD_CLASS = 'bio-glitch-word'
export const GLITCH_STRIKE_CLASS = 'bio-glitch-strike'

const NON_TEXT_ANCESTOR = /^(STYLE|SCRIPT|NOSCRIPT)$/

export function findWordSpan(root: HTMLElement): { span: HTMLSpanElement; rect: DOMRect } | null {
  // SHOW_TEXT por sí solo también atraviesa el texto fuente de <style>/
  // <script> (ej. los bloques de CSS en JSX de Grieta/GlitchMite mismos) —
  // eso no es una palabra real visible en la página, así que se descarta
  // acá antes de que llegue a ser candidata.
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: n => (n.parentElement && NON_TEXT_ANCESTOR.test(n.parentElement.tagName))
      ? NodeFilter.FILTER_REJECT
      : NodeFilter.FILTER_ACCEPT,
  })
  const textNodes: Text[] = []
  let node: Node | null
  while ((node = walker.nextNode())) {
    if (node.textContent && node.textContent.trim().length > 0) textNodes.push(node as Text)
  }
  if (textNodes.length === 0) return null

  const textNode = textNodes[Math.floor(Math.random() * textNodes.length)]
  const text = textNode.textContent ?? ''
  const matches = Array.from(text.matchAll(/[\p{L}]{3,}/gu))
  if (matches.length === 0) return null
  const match = matches[Math.floor(Math.random() * matches.length)]
  const start = match.index ?? 0
  const end = start + match[0].length

  try {
    if (end < text.length) textNode.splitText(end)
    const wordNode = start > 0 ? textNode.splitText(start) : textNode
    const span = document.createElement('span')
    span.className = GLITCH_WORD_CLASS
    span.textContent = wordNode.textContent
    wordNode.replaceWith(span)
    return { span, rect: span.getBoundingClientRect() }
  } catch {
    return null
  }
}

export function revertSpan(span: HTMLSpanElement) {
  try {
    span.replaceWith(document.createTextNode(span.textContent ?? ''))
  } catch {
    // ya pudo haber sido removido por otra causa (navegación, etc.) -- no pasa nada
  }
}
