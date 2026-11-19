// Mismo patrón que RHYME_GROUPS de app/games/rap-aprendizaje/page.tsx
// (palabras agrupadas por terminación que rima), pero con vocabulario
// propio de los temas de NeoProxy en vez del vocabulario de filosofía/
// ciencia: ciberpunk-industrial, organismo vivo, biomecánica al estilo
// Giger, kernel/corrupción/coherencia (las mismas palabras que maneja el
// Overseer real) y fabricación. Solo palabras sueltas que de verdad
// comparten terminación -- los nombres propios de agentes (DarkProxy,
// Metatron, etc.) no entran porque no riman entre sí.
export type RhymeGroup = { ending: string; words: string[] }

export const NEOPROXY_RHYME_GROUPS: RhymeGroup[] = [
  {
    ending: '-CIÓN / -SIÓN',
    words: [
      'CORRUPCIÓN', 'DISOLUCIÓN', 'FABRICACIÓN', 'FRICCIÓN', 'MUTACIÓN', 'INFECCIÓN',
      'ACTIVACIÓN', 'SIMULACIÓN', 'TRANSMISIÓN', 'CONEXIÓN', 'REVELACIÓN',
    ],
  },
  {
    ending: '-ENCIA',
    words: ['COHERENCIA', 'EMERGENCIA', 'DIVERGENCIA', 'INSURGENCIA', 'VIGILANCIA', 'RESISTENCIA', 'EXISTENCIA', 'APARIENCIA'],
  },
  {
    ending: '-ICO / -ICA',
    words: ['ORGÁNICO', 'MECÁNICO', 'ELECTRÓNICO', 'SINTÉTICO', 'CIBERNÉTICO', 'CAÓTICO', 'SIMBIÓTICO', 'PARASÍTICO', 'HERMÉTICO', 'ATÓMICO'],
  },
  {
    ending: '-OSO / -OSA',
    words: ['VISCOSO', 'TENEBROSO', 'MONSTRUOSO', 'NERVIOSO', 'LUMINOSO', 'SIGILOSO', 'VERTIGINOSO', 'PODEROSO'],
  },
  {
    ending: '-ANTE',
    words: ['MUTANTE', 'VIBRANTE', 'FLOTANTE', 'PENETRANTE', 'INQUIETANTE', 'CONSTANTE', 'DOMINANTE', 'RADIANTE', 'PALPITANTE'],
  },
  {
    ending: '-ENTE',
    words: ['LATENTE', 'DURMIENTE', 'INMINENTE', 'CORRIENTE', 'PERMANENTE', 'EMERGENTE', 'INSURGENTE', 'DIVERGENTE', 'RECURRENTE', 'TRANSPARENTE'],
  },
  {
    ending: '-AJE',
    words: ['ENSAMBLAJE', 'BLINDAJE', 'CAMUFLAJE', 'ENGRANAJE', 'LENGUAJE', 'ANCLAJE', 'MONTAJE', 'EMBALAJE'],
  },
  {
    ending: '-URA',
    words: ['ESTRUCTURA', 'ARQUITECTURA', 'FRACTURA', 'RUPTURA', 'TEXTURA', 'CRIATURA', 'ARMADURA'],
  },
]
