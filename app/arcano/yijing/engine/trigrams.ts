// Los 8 trigramas (bagua) -- la unidad real más pequeña del Yi Jing, de
// donde salen los 64 hexagramas (cada uno es, literalmente, dos
// trigramas apilados: 8 × 8 = 64). Líneas de abajo hacia arriba, como
// se leen siempre en el sistema real -- true = yang (sólida), false =
// yin (quebrada). Esta tabla es la parte del documento con cero riesgo
// de inexactitud: los 8 trigramas y sus líneas son universales en
// cualquier fuente, a diferencia de los textos clásicos de los 64
// hexagramas individuales (ver nota de honestidad en /arcano/yijing).

export type TrigramId = 'qian' | 'kun' | 'zhen' | 'kan' | 'gen' | 'xun' | 'li' | 'dui'

export type Trigram = {
  id: TrigramId
  chars: string
  pinyin: string
  image: string
  family: string
  attribute: string
  lines: [boolean, boolean, boolean]
}

export const TRIGRAMS: Record<TrigramId, Trigram> = {
  qian: { id: 'qian', chars: '乾', pinyin: 'qián', image: 'Cielo', family: 'el padre', attribute: 'lo creativo, la fuerza pura', lines: [true, true, true] },
  kun: { id: 'kun', chars: '坤', pinyin: 'kūn', image: 'Tierra', family: 'la madre', attribute: 'lo receptivo, la entrega total', lines: [false, false, false] },
  zhen: { id: 'zhen', chars: '震', pinyin: 'zhèn', image: 'Trueno', family: 'el hijo mayor', attribute: 'lo que se moviliza, el impulso inicial', lines: [true, false, false] },
  kan: { id: 'kan', chars: '坎', pinyin: 'kǎn', image: 'Agua', family: 'el hijo del medio', attribute: 'lo abismal, el peligro que no se detiene', lines: [false, true, false] },
  gen: { id: 'gen', chars: '艮', pinyin: 'gèn', image: 'Montaña', family: 'el hijo menor', attribute: 'la quietud, el límite que sostiene', lines: [false, false, true] },
  xun: { id: 'xun', chars: '巽', pinyin: 'xùn', image: 'Viento', family: 'la hija mayor', attribute: 'la penetración suave, lo gradual', lines: [false, true, true] },
  li: { id: 'li', chars: '離', pinyin: 'lí', image: 'Fuego', family: 'la hija del medio', attribute: 'la claridad que se adhiere, la llama', lines: [true, false, true] },
  dui: { id: 'dui', chars: '兌', pinyin: 'duì', image: 'Lago', family: 'la hija menor', attribute: 'la alegría, la apertura serena', lines: [true, true, false] },
}

export const TRIGRAM_ORDER: TrigramId[] = ['qian', 'kun', 'zhen', 'kan', 'gen', 'xun', 'li', 'dui']

// De 3 líneas (abajo a arriba) a qué trigrama es -- usado para identificar
// el trigrama inferior (líneas 1-3) y superior (líneas 4-6) de cualquier
// hexagrama real que arme el oráculo.
export function trigramFromLines(lines: [boolean, boolean, boolean]): Trigram {
  const found = TRIGRAM_ORDER.find((id) => {
    const t = TRIGRAMS[id].lines
    return t[0] === lines[0] && t[1] === lines[1] && t[2] === lines[2]
  })
  return TRIGRAMS[found ?? 'qian']
}
