// Tipos compartidos para el Gran Mapa del Conocimiento (/knowledge/mapa).
// Pedido explícito, inspirado en la IDEA de los posters "Map of X" de
// Dominic Walliman (Domain of Science) -- el conocimiento que organizan
// (qué subcampos tiene la física, qué es el cálculo, qué hace CRISPR) es
// de la humanidad, no de él, así que se puede representar con honestidad
// sin copiarle el dibujo, el texto exacto ni el layout. Lo que NO se
// reusa: su estilo de caricatura a mano, sus colores, sus chistes, su
// selección/orden exacto de íconos. Cada dominio de abajo es taxonomía
// académica estándar (lo que cualquier currícula universitaria real
// reconocería), redactada de cero en español, con el estilo visual
// propio de NeoProxy.

export type ConceptNode = {
  label: string
  // Nota corta real -- una fecha, una fórmula, un nombre -- no una
  // explicación larga (esto es un mapa, no un documento de archivo).
  detail?: string
  // Si el concepto ya tiene un documento propio y profundo en el Codex,
  // el nodo entero se vuelve clickeable hacia ahí.
  href?: string
}

export type SubField = {
  title: string
  nodes: ConceptNode[]
}

export type Domain = {
  id: string
  title: string
  color: string
  intro: string
  subfields: SubField[]
}
