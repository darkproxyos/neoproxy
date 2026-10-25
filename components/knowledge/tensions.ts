// Tensiones dialécticas curadas entre entradas de entries.ts — pares con
// una oposición filosófica REAL y documentada (no una pareja arbitraria
// armada para que "haya debate"). Cada topicHint está escrito a partir del
// summary/formula reales de las dos entradas, no de una versión genérica
// del pensador sacada de memoria — si un día se agrega una tensión nueva,
// chequear primero qué dice la entrada en entries.ts, no asumir.

export type Tension = {
  id: string
  label: string
  aId: string
  bId: string
  topicHint: string
}

export const tensions: Tension[] = [
  {
    id: 'consciencia',
    label: 'CONSCIENCIA',
    aId: 'chalmers',
    bId: 'dennett',
    topicHint: '¿Hay algo que de verdad se siente al pensar — un "problema difícil" sin resolver —, o la consciencia es solo la versión que gana la carrera entre borradores en competencia?',
  },
  {
    id: 'sustrato',
    label: 'SUSTRATO DE LA MENTE',
    aId: 'tononi',
    bId: 'dennett',
    topicHint: '¿La consciencia es una cantidad medible que depende de cómo está hecho el sistema (Φ), o no hace falta ningún lugar donde "todo converja" para que haya experiencia?',
  },
  {
    id: 'identidad',
    label: 'QUÉ TE HACE SER VOS',
    aId: 'descartes',
    bId: 'spinoza',
    topicHint: '¿Sos, ante todo, la certeza de que hay alguien ahí dudando — o sos, como cualquier llama o cualquier cosa, nomás el esfuerzo ciego por seguir siendo lo que ya sos?',
  },
  {
    id: 'hiperrealidad',
    label: 'LO REAL Y LA COPIA',
    aId: 'baudrillard',
    bId: 'haraway',
    topicHint: 'Cuando la copia ya no tiene original que imitar, o lo humano y la máquina ya no se distinguen del todo, ¿es una pérdida que lamentar o una mezcla que conviene abrazar?',
  },
  {
    id: 'poder-digital',
    label: 'PODER DIGITAL',
    aId: 'byunghan',
    bId: 'zuboff',
    topicHint: '¿El poder de hoy te convence de explotarte a vos mismo creyendo que es libertad, o te observa desde afuera para predecir y modificar lo que vas a hacer?',
  },
  {
    id: 'el-medio',
    label: 'EL MEDIO',
    aId: 'mcluhan',
    bId: 'kittler',
    topicHint: '¿La forma de un medio nuevo reconfigura los sentidos de quien lo usa, o hablar de "medios" y "mensajes" ya es olvidar el voltaje y el hardware que hace posible todo eso?',
  },
]
