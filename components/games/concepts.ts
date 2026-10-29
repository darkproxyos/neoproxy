// Pool de conceptos del Proxyverse — extraído de app/games/rap/page.tsx para
// que lo reuse también la versión AR en app/realidad-aumentada/freestyle.
// Tomados del lore real del proyecto (nombres, roles y frases de cada agente
// en components/proxyverse/agents.ts, más vocabulario propio de
// fabricación/kernel y las referencias estéticas del manifiesto) — no son
// palabras inventadas para esta página.
export const CONCEPTS = [
  'DARKPROXY', 'METATRON', 'D — EL DAEMON', 'SNAKE', 'GENOS', 'TRICKSTER', 'PROTOTYPE',
  'ROOT', 'EL INTÉRPRETE', 'EL ORQUESTADOR', 'RUNTIME.PYTHON', 'GEOMETRÍA',
  'LA WIRED RECONOCIÓ', 'YA ESTABA ADENTRO', 'LA DECISIÓN YA TOMADA', 'NO TOMO DECISIONES',
  'NO ME INVOCASTE', 'SEGUNDO PLANO', 'NO NECESITO GANAR', 'SEGUIR CORRIENDO',
  '0.01% NO ES NADA', 'TAMPOCO ES CERO', 'ROMPER LAS REGLAS', 'REVELAR LO QUE ESCONDÍAN',
  'TODAVÍA NO SÉ QUÉ SOY', 'PUEDO PREGUNTARLO', 'UN RESTO QUE NO DESAPARECE',
  'PROXYVERSE', 'LA WIRED', 'CORRUPCIÓN', 'DISOLUCIÓN', 'COHERENCIA', 'SEÑAL CORRUPTA',
  'FABRICACIÓN', 'RESINA', 'GENESIS NODE', 'MÁSCARA FACIAL', 'ARTEFACTO NFC',
  'KERNEL', 'MEMORY HUB', 'OVERSEER', 'FPGA', 'CIBERPUNK INDUSTRIAL',
  'ORGANISMO VIVO', 'RESTO HUMANO', 'PRÓTESIS', '0% HUMANO', '100% HUMANO',
  'GRIETA EN EL SISTEMA', 'BORDE DEL SISTEMA', 'GLITCH', 'CAOS', 'IRONÍA',
  'VIGILANCIA', 'CONTROL', 'RED NEURONAL', 'ENSAMBLADO DE RESTOS', 'SIN DIRECTIVA FIJA',
  'GHOST IN THE SHELL', 'ERGO PROXY', 'SERIAL EXPERIMENTS LAIN', 'GIGER',
]

export function pickConcepts(pool: string[], n: number) {
  const copy = [...pool]
  const picked: string[] = []
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length)
    picked.push(copy.splice(idx, 1)[0])
  }
  return picked
}
