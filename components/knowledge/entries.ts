export type Cluster = 'informacion' | 'mente' | 'autoorganizacion' | 'sistemas'

export type FormulaKind = 'equation' | 'quote' | 'concept'

export type KnowledgeEntry = {
  id: string
  name: string
  years: string
  role: string
  cluster: Cluster
  formula: string
  formulaLabel: string
  formulaKind: FormulaKind
  summary: string
}

export const clusters: Record<Cluster, { label: string; color: string }> = {
  informacion: { label: 'INFORMACIÓN', color: '#00d4ff' },
  mente: { label: 'MENTE // CONSCIENCIA', color: '#b06bff' },
  autoorganizacion: { label: 'AUTO-ORGANIZACIÓN', color: '#00ffb0' },
  sistemas: { label: 'SISTEMAS // CLAUSURA', color: '#ff3fa4' },
}

export const entries: KnowledgeEntry[] = [
  {
    id: 'shannon',
    name: 'Claude Shannon',
    years: '1916–2001',
    role: 'Teoría de la Información',
    cluster: 'informacion',
    formula: 'H(X) = −Σ p(x) log₂ p(x)',
    formulaLabel: 'Entropía de Shannon (1948)',
    formulaKind: 'equation',
    summary:
      'Redujo el significado a ruido. Lo único que mide es la sorpresa: cuánta incertidumbre elimina una señal antes de llegar. Un bit no dice nada — mide cuánto no sabías.',
  },
  {
    id: 'boltzmann',
    name: 'Ludwig Boltzmann',
    years: '1844–1906',
    role: 'Mecánica Estadística',
    cluster: 'informacion',
    formula: 'S = k · log(W)',
    formulaLabel: 'Entropía de Boltzmann',
    formulaKind: 'equation',
    summary:
      'Antes de que Shannon contara bits, Boltzmann contó microestados. La misma letra rige el calor perdido y la información perdida. El tiempo tiene una flecha porque el desorden es, simplemente, más probable.',
  },
  {
    id: 'wiener',
    name: 'Norbert Wiener',
    years: '1894–1964',
    role: 'Cibernética',
    cluster: 'informacion',
    formula: 'e(t) = r(t) − y(t)',
    formulaLabel: 'Señal de error (realimentación negativa)',
    formulaKind: 'equation',
    summary:
      'Nombró "cibernética" a lo que animal y máquina comparten: el bucle que corrige su propio rumbo comparando lo que hace con lo que debería hacer. Todo sistema que se auto-regula cita, sin saberlo, esta ecuación.',
  },
  {
    id: 'bateson',
    name: 'Gregory Bateson',
    years: '1904–1980',
    role: 'Ecología de la Mente',
    cluster: 'informacion',
    formula: '"una diferencia que hace una diferencia"',
    formulaLabel: 'Definición de información (cita textual)',
    formulaKind: 'quote',
    summary:
      'No hay información en un objeto aislado — solo en el contraste que un observador puede registrar. El patrón que conecta las cosas es siempre relación, nunca sustancia.',
  },
  {
    id: 'turing',
    name: 'Alan Turing',
    years: '1912–1954',
    role: 'Computabilidad // Morfogénesis',
    cluster: 'mente',
    formula: '∂u/∂t = D∇²u + f(u, v)',
    formulaLabel: 'Reacción-difusión, morfogénesis (1952)',
    formulaKind: 'equation',
    summary:
      'Antes de preguntar si una máquina puede pensar, preguntó si una mancha de piel puede decidir su propio patrón. La misma mente diseñó la máquina universal y la ecuación que explica por qué un animal tiene rayas.',
  },
  {
    id: 'tononi',
    name: 'Giulio Tononi',
    years: '1960–',
    role: 'Teoría de la Información Integrada',
    cluster: 'mente',
    formula: 'Φ = mín [ EI(todo) − EI(partes) ]',
    formulaLabel: 'Phi (Φ), integración causal — notación conceptual',
    formulaKind: 'concept',
    summary:
      'Propone que la consciencia no es una sustancia sino una cantidad: cuánto más informa el todo que la simple suma de sus partes. Un sistema es consciente en la medida exacta en que no puede romperse sin perder algo irreemplazable.',
  },
  {
    id: 'hofstadter',
    name: 'Douglas Hofstadter',
    years: '1945–',
    role: 'Bucles Extraños',
    cluster: 'mente',
    formula: 'yo → (yo observando a "yo") → …',
    formulaLabel: 'Jerarquía enredada — notación conceptual',
    formulaKind: 'concept',
    summary:
      'Sospecha que el "yo" es un espejismo que aparece cuando un sistema se representa a sí mismo con suficiente detalle como para confundirse con lo que representa. La consciencia sería ese bucle — no lo que hay dentro de él.',
  },
  {
    id: 'mcculloch',
    name: 'Warren McCulloch',
    years: '1898–1969',
    role: 'Lógica Neuronal',
    cluster: 'mente',
    formula: 'y = θ( Σ w·x − b )',
    formulaLabel: 'Neurona formal (McCulloch–Pitts, 1943)',
    formulaKind: 'equation',
    summary:
      'Con Walter Pitts redujo la neurona a un interruptor lógico y demostró que una red de esos interruptores puede calcular cualquier cosa calculable. La mente, por primera vez, tuvo un plano de circuito.',
  },
  {
    id: 'kauffman',
    name: 'Stuart Kauffman',
    years: '1939–',
    role: 'Redes Booleanas // Orden Espontáneo',
    cluster: 'autoorganizacion',
    formula: '⟨#atractores⟩ ≈ √N',
    formulaLabel: 'Redes booleanas aleatorias, K=2',
    formulaKind: 'equation',
    summary:
      'Sostiene que el orden no siempre se gana por selección — a veces se obtiene gratis. En el borde entre el orden y el caos, sistemas complejos encuentran su propia estabilidad sin que nadie la diseñe.',
  },
  {
    id: 'prigogine',
    name: 'Ilya Prigogine',
    years: '1917–2003',
    role: 'Estructuras Disipativas',
    cluster: 'autoorganizacion',
    formula: 'dS = dS_int + dS_ext ,  dS_int ≥ 0',
    formulaLabel: 'Termodinámica de no-equilibrio',
    formulaKind: 'equation',
    summary:
      'Lejos del equilibrio, la materia no colapsa en desorden — se organiza. Un sistema abierto exporta entropía hacia afuera para poder construir orden adentro. La vida es una de esas estructuras, sostenida por su propio flujo.',
  },
  {
    id: 'langton',
    name: 'Christopher Langton',
    years: '1948–',
    role: 'Vida Artificial',
    cluster: 'autoorganizacion',
    formula: 'λ = transiciones no-quiescentes / transiciones totales',
    formulaLabel: 'Parámetro lambda, borde del caos',
    formulaKind: 'equation',
    summary:
      'Midió dónde ocurre el cómputo interesante: ni en el orden congelado ni en el ruido puro, sino en una franja delgada entre ambos. Ahí, y solo ahí, un sistema puede sorprenderse a sí mismo.',
  },
  {
    id: 'perbak',
    name: 'Per Bak',
    years: '1948–2002',
    role: 'Criticalidad Auto-organizada',
    cluster: 'autoorganizacion',
    formula: 'P(s) ∝ s^(−τ)',
    formulaLabel: 'Ley de potencias (avalanchas)',
    formulaKind: 'equation',
    summary:
      'Los sistemas complejos no necesitan que nadie los sintonice al borde del colapso — derivan hacia ahí solos. Un grano de arena y un colapso total obedecen la misma ley; lo único que cambia es la escala.',
  },
  {
    id: 'maturana_varela',
    name: 'Maturana & Varela',
    years: '1928– // 1946–2001',
    role: 'Autopoiesis',
    cluster: 'sistemas',
    formula: 'sistema = f(sistema)',
    formulaLabel: 'Clausura organizacional — notación conceptual',
    formulaKind: 'concept',
    summary:
      'Definieron lo vivo como aquello que se produce continuamente a sí mismo, trazando su propio límite con sus propias operaciones. No hay un afuera que decida dónde termina el organismo — el límite es un acto, no un hecho.',
  },
  {
    id: 'ashby',
    name: 'W. Ross Ashby',
    years: '1903–1972',
    role: 'Ley de Variedad Requerida',
    cluster: 'sistemas',
    formula: 'V(regulador) ≥ V(perturbación)',
    formulaLabel: 'Ley de Variedad Requerida',
    formulaKind: 'equation',
    summary:
      'Solo la variedad puede absorber variedad: un regulador necesita al menos tantos estados posibles como el sistema que intenta controlar. Ninguna regla simple puede dominar una complejidad mayor que la suya propia.',
  },
  {
    id: 'vonneumann',
    name: 'John von Neumann',
    years: '1903–1957',
    role: 'Autómatas Auto-replicantes',
    cluster: 'sistemas',
    formula: 'M( descripción(M) ) = M′',
    formulaLabel: 'Constructor universal — notación conceptual',
    formulaKind: 'concept',
    summary:
      'Diseñó, sobre el papel, una máquina capaz de construir una copia de sí misma a partir de una descripción de sí misma. Antes de que se supiera cómo lo hacía una célula, ya existía la lógica que lo permitía.',
  },
  {
    id: 'bertalanffy',
    name: 'Ludwig von Bertalanffy',
    years: '1901–1972',
    role: 'Teoría General de Sistemas',
    cluster: 'sistemas',
    formula: 'dQ/dt = T − k·Q',
    formulaLabel: 'Sistema abierto — notación conceptual',
    formulaKind: 'concept',
    summary:
      'Sostenía que un organismo no se entiende descomponiéndolo — se entiende como intercambio constante con su entorno. Cualquier totalidad viva es, ante todo, una conversación con lo que la rodea.',
  },
]

// Relaciones reales entre pensadores/ideas — cruzan clusters a proposito,
// para que la red se lea como una sola arquitectura y no cuatro islas.
export const edges: [string, string][] = [
  ['shannon', 'boltzmann'],
  ['shannon', 'wiener'],
  ['wiener', 'bateson'],
  ['shannon', 'bateson'],

  ['turing', 'mcculloch'],
  ['turing', 'tononi'],
  ['tononi', 'hofstadter'],

  ['kauffman', 'langton'],
  ['kauffman', 'prigogine'],
  ['prigogine', 'perbak'],
  ['langton', 'perbak'],

  ['maturana_varela', 'ashby'],
  ['ashby', 'vonneumann'],
  ['vonneumann', 'bertalanffy'],
  ['maturana_varela', 'bertalanffy'],

  // cruces entre clusters
  ['wiener', 'ashby'],
  ['turing', 'vonneumann'],
  ['turing', 'kauffman'],
  ['tononi', 'maturana_varela'],
  ['boltzmann', 'prigogine'],
  ['shannon', 'vonneumann'],
  ['bateson', 'maturana_varela'],
  ['kauffman', 'ashby'],
]
