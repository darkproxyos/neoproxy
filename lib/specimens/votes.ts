// Votos de los visitantes y cómo pesan en la evolución.
//
// Cada visitante puede votar una vez por pieza (me gusta / no me gusta) y
// cambiar o retirar su voto. El gusto es una presión de selección más, junto a
// la imprimibilidad y la diferencia con lo que ya existe.

export type Votes = { l: number; d: number } // me gusta, no me gusta

// Probabilidad de agrado con prior bayesiano: con pocos votos manda el prior
// (0,5), así que una pieza con un solo voto no se dispara.
const PRIOR = 4
export const likeRate = (v?: Votes) => ((v?.l ?? 0) + PRIOR / 2) / ((v?.l ?? 0) + (v?.d ?? 0) + PRIOR)

// Factor sobre la aptitud: 1 sin votos (neutral), entre 0,5 y 1,5 con muchos.
export const tasteFactor = (v?: Votes) => 0.5 + likeRate(v)

// Herencia parcial del gusto: una hija lleva la mitad del factor de sus madres
// (que las mutantes de piezas queridas tengan más suerte, sin condenar a las demás).
export const inheritedTaste = (parents: (Votes | undefined)[]) => {
  if (!parents.length) return 1
  const mean = parents.reduce((a, p) => a + tasteFactor(p), 0) / parents.length
  return 1 + 0.5 * (mean - 1)
}
