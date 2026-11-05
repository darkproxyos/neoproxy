// Galería de especímenes curados: piezas reales, generadas en una máquina
// local (corridas largas, de minutos a horas, con el motor de space
// colonization de app/lab/proxygenesis/engine/spaceColonization.ts, o el
// modelo de coiling de shell.ts) y subidas a mano al repo tras revisión. A
// diferencia de la galería local del generador (localStorage, se regenera
// desde semilla+parámetros al instante), acá el STL final SÍ se persiste:
// estas corridas no son instantáneas de reproducir.

// 'muda' y 'retazos' no son corridas de proxygenesis — son capturas
// reales de un proceso vivo de /experimental (ver reading.prose de esos
// dos especímenes para la aclaración honesta de qué significa "captura"
// ahí: una pose congelada de algo que nunca deja de moverse/crecer).
export type CuratedMode = 'arbol' | 'coral' | 'concha' | 'red' | 'muda' | 'retazos'

export type CuratedStats = {
  seed: number
  nodeCount: number
  iteration: number
  maxIterations: number
  elapsedSeconds: number
  iterationsPerSecond: number
  params: Record<string, number | string>
}

// Pensadores reales ya presentes en /knowledge (components/knowledge/
// entries.ts), citados textual o casi-textualmente de sus entradas —
// ver ese archivo para la ficha completa de cada uno. Cada espécimen cita
// un subconjunto propio, no siempre el mismo: la lectura filosófica
// depende de qué parámetros/algoritmo usó ESA corrida en particular, no
// es un bloque genérico pegado a todos por igual.
export const THINKERS: Record<string, { name: string; years: string; line: string }> = {
  'runions-lane-prusinkiewicz': {
    name: 'Runions, Lane & Prusinkiewicz', years: '2007',
    line: 'La forma no está en la regla — emerge de competir por el mismo espacio.',
  },
  'maturana_varela': {
    name: 'Maturana & Varela', years: '1928– // 1946–2001',
    line: 'El límite no viene de afuera — lo produce el mismo proceso que encierra.',
  },
  'prigogine': {
    name: 'Ilya Prigogine', years: '1917–2003',
    line: 'El orden no es un objeto, es un proceso que hay que sostener activamente.',
  },
  'margulis': {
    name: 'Lynn Margulis', years: '1938–2011',
    line: 'Dos organismos antes distintos se fusionan tan profundo que nace algo genuinamente nuevo.',
  },
  'raup': {
    name: 'David Raup', years: '1933–2015',
    line: 'La biología solo ocupa una esquina de lo posible.',
  },
  'kauffman': {
    name: 'Stuart Kauffman', years: '1939–',
    line: 'El orden no siempre se gana por selección — a veces se obtiene gratis.',
  },
  'mandelbrot': {
    name: 'Benoit Mandelbrot', years: '1924–2010',
    line: 'La naturaleza rara vez usa las formas lisas de la geometría clásica.',
  },
  'barabasi': {
    name: 'Albert-László Barabási', years: '1967–',
    line: '"El rico se hace más rico", corriendo desde el primer nodo de la red.',
  },
  'mcculloch': {
    name: 'Warren McCulloch', years: '1898–1969',
    line: 'La mente, por primera vez, tuvo un plano de circuito.',
  },
  'hopfield': {
    name: 'John Hopfield', years: '1933–',
    line: 'No hay búsqueda: hay gravedad.',
  },
  'shannon': {
    name: 'Claude Shannon', years: '1916–2001',
    line: 'Un bit no dice nada — mide cuánto no sabías.',
  },
  'lorenz': {
    name: 'Edward Lorenz', years: '1917–2008',
    line: 'No hay azar en la ecuación: hay sensibilidad.',
  },
  'aristidou-fabrik': {
    name: 'Aristidou & Lasenby', years: '2011',
    line: 'No hay ángulos que calcular — solo distancias que corregir, una y otra vez.',
  },
  'witten-sander': {
    name: 'Witten & Sander', years: '1981',
    line: 'Nadie dibuja la forma — la deciden, acumuladas, miles de choques al azar.',
  },
}

export type CuratedReading = {
  thinkerIds: string[]
  prose: string[]
}

export type CuratedSpecimen = {
  id: string
  title: string
  mode: CuratedMode
  stlPath: string // relativo a /public, ej. /proxygenesis/stls/arbol-01.stl
  thumbnail?: string // relativo a /public, screenshot real del espécimen; sin esto, la tarjeta cae a un placeholder
  audioPath?: string // relativo a /public; si está, el visor muestra un reproductor y el espécimen reacciona en vivo (color + pulso) al audio real mientras suena
  stats: CuratedStats
  reading: CuratedReading
  createdAt: string
}

export async function loadCuratedSpecimens(): Promise<CuratedSpecimen[]> {
  try {
    const res = await fetch('/proxygenesis/especimenes.json')
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}
