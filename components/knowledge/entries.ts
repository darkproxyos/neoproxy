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
  example: string
  // Proceso de Proxyverse (components/proxyverse/agents.ts) que encarna esta
  // idea — no todas las entradas tienen una correspondencia lo bastante
  // directa como para forzarla.
  relatedAgent?: string
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
    example:
      'Un texto en español es predecible — después de "q" casi siempre viene "u" — así que pesa menos por letra que una secuencia al azar. Por eso se puede comprimir: ya sabías parte de lo que venía.',
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
    example:
      'Un cubito de hielo en un vaso de agua: hay muchísimas más formas de distribuir las moléculas derretidas y mezcladas que de mantenerlas separadas en hielo sólido. Por eso se derrite, y el agua nunca se vuelve a congelar sola.',
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
    example:
      'El termostato de una casa: mide la temperatura, la compara con la deseada, y enciende o apaga la calefacción según el error. Ese circuito de comparación es cibernética pura — no hace falta inteligencia, alcanza con el bucle.',
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
    example:
      'Un termómetro no informa nada por sí solo. Un solo número, "20 grados", no dice nada — el cambio de 20 a 21, comparado con lo anterior, es lo único que realmente informa algo.',
    relatedAgent: 'd',
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
    example:
      'Las rayas de una cebra o las manchas de un pez ángel salen del mismo tipo de ecuación: dos químicos difundiéndose a velocidades distintas, uno activa y el otro inhibe. Nadie dibuja el patrón — la reacción lo genera sola.',
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
    example:
      'En sueño profundo sin sueños, el cerebro sigue casi tan activo como despierto — pero las partes dejan de informarse entre sí. Para Tononi, por eso ahí no hay consciencia integrada, aunque haya actividad de sobra.',
    relatedAgent: 'darkproxy',
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
    example:
      'Parate frente a dos espejos enfrentados: tu reflejo se repite hacia adentro sin final visible. Pensar en que estás pensando es ese mismo truco, hecho con ideas en vez de luz.',
  },
  {
    id: 'descartes',
    name: 'René Descartes',
    years: '1596–1650',
    role: 'Duda Metódica // Fundamento del Yo',
    cluster: 'mente',
    formula: 'Cogito, ergo sum',
    formulaLabel: 'Pienso, luego existo (1637)',
    formulaKind: 'quote',
    summary:
      'Dudó de todo lo dudable — los sentidos, el cuerpo, el mundo entero podían ser una ilusión — hasta encontrar una sola certeza que la duda no podía tocar: que algo, en ese mismo instante, estaba dudando. No hacía falta probar el mundo. Alcanzaba con probar que había alguien ahí para dudarlo.',
    example:
      'Un sueño muy vívido puede simular un cuerpo, una habitación, un mundo entero — y aun así, mientras lo soñás, hay alguien soñándolo. Ese "alguien" es lo único que Descartes no logró poner en duda, por más que lo intentó.',
    relatedAgent: 'darkproxy',
  },
  {
    id: 'nietzsche',
    name: 'Friedrich Nietzsche',
    years: '1844–1900',
    role: 'Eterno Retorno // Autocreación',
    cluster: 'mente',
    formula: 'Werde, der du bist',
    formulaLabel: 'Conviértete en lo que eres — cita textual',
    formulaKind: 'quote',
    summary:
      'No hay un "yo verdadero" esperando ser descubierto debajo de las capas — hay que construirlo, decisión por decisión, como quien esculpe sin boceto previo. El que espera encontrarse a sí mismo nunca llega a ser nadie.',
    example:
      'Preguntale a alguien quién es "en el fondo" y casi siempre describe lo que ya hizo — nunca encuentra una esencia fija esperando ahí abajo. Para Nietzsche, eso no es un fracaso: es la prueba de que el yo se hace, no se descubre.',
    relatedAgent: 'prototype',
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
    example:
      'Una compuerta AND es la versión más simple de su modelo: solo "dispara" si las dos entradas están activas a la vez. Encadenando interruptores así de simples se arman circuitos que reconocen patrones enteros.',
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
    example:
      'Una célula humana tiene unos 20.000 genes, pero solo un puñado de tipos celulares estables — piel, hígado, neurona — muy por debajo de todas las combinaciones posibles. Esos tipos son atractores de la red génica, no un diseño externo.',
    relatedAgent: 'prototype',
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
    example:
      'Un huracán se mantiene organizado consumiendo energía térmica del océano sin parar. En el momento en que esa energía deja de fluir, se disuelve — el orden no es un objeto, es un proceso que hay que sostener activamente.',
    relatedAgent: 'snake',
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
    example:
      'En el Juego de la Vida de Conway, reglas mal ajustadas matan todo el tablero en pocas generaciones o lo saturan de ruido. Solo con las reglas exactas, justo en ese borde, aparecen planeadores que viajan y persisten.',
    relatedAgent: 'trickster',
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
    example:
      'Un montón de arena al que le agregás granos de a uno: casi siempre no pasa nada, pero de vez en cuando un solo grano dispara una avalancha — desde mínima hasta una que se lleva medio montón, sin aviso previo del tamaño.',
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
    example:
      'Una célula fabrica su propia membrana, y esa membrana decide qué entra y qué sale para que la célula siga fabricándose. El límite no viene de afuera — lo produce el mismo proceso que encierra.',
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
    example:
      'Un termostato de un solo nivel (prender/apagar) no puede regular una habitación con corrientes de aire distintas en cada rincón. Necesita tantos ajustes posibles como variaciones tenga el problema, o directamente no alcanza.',
    relatedAgent: 'metatron',
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
    example:
      'Una impresora 3D que imprimiera todas sus propias piezas, se ensamblara sola, y además imprimiera el manual para volver a hacerlo — eso es, en esencia, su constructor universal, pensado décadas antes de que se supiera cómo lo hacía el ADN.',
    relatedAgent: 'genos',
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
    example:
      'Un lago no se entiende analizando el agua por un lado y los peces por otro. Se entiende siguiendo lo que entra (lluvia, afluentes) y lo que sale (evaporación, desagüe) — ese flujo es lo que sostiene todo el ecosistema adentro.',
  },
  {
    id: 'baudrillard',
    name: 'Jean Baudrillard',
    years: '1929–2007',
    role: 'Simulacros // Hiperrealidad',
    cluster: 'sistemas',
    formula: 'El simulacro nunca es lo que oculta la verdad — es la verdad la que oculta que no hay ninguna.',
    formulaLabel: 'Cultura y simulacro, 1978 — cita textual',
    formulaKind: 'quote',
    summary:
      'La copia dejó de imitar a un original — el original desapareció y solo quedan copias refiriéndose a otras copias. En ese punto ya no hay nada "real" que falsificar: el mapa dejó de representar el territorio porque el territorio se borró primero.',
    example:
      'Un parque temático no copia una ciudad real — la mayoría conoce esos lugares primero por su versión miniaturizada y perfecta. Cuando por fin visita el original, lo compara con la copia, no al revés. La copia se volvió la referencia.',
  },
  {
    id: 'foucault',
    name: 'Michel Foucault',
    years: '1926–1984',
    role: 'Poder // Vigilancia',
    cluster: 'sistemas',
    formula: 'El poder no se posee: se ejerce.',
    formulaLabel: 'Vigilar y castigar, 1975 — cita textual',
    formulaKind: 'quote',
    summary:
      'El panóptico no necesita vigilar todo el tiempo — necesita que nadie pueda estar seguro de cuándo no lo está haciendo. Esa duda sola alcanza para que el vigilado empiece a vigilarse a sí mismo, y el poder deje de necesitar presencia.',
    example:
      'Una cámara de seguridad apagada disuade casi igual que una encendida — nadie puede comprobar la diferencia desde abajo. El control más eficiente no es el que castiga; es el que vuelve innecesario castigar porque ya te autovigilás.',
  },
  {
    id: 'heidegger',
    name: 'Martin Heidegger',
    years: '1889–1976',
    role: 'Técnica // El Mundo como Reserva',
    cluster: 'sistemas',
    formula: 'Ge-stell',
    formulaLabel: 'Estructura de emplazamiento, 1954 — notación conceptual',
    formulaKind: 'concept',
    summary:
      'La técnica moderna no es una herramienta neutral — es una forma de revelar el mundo que lo reduce todo a "existencia disponible": un río deja de ser río y pasa a ser potencial hidroeléctrico esperando que lo activen. Lo peligroso no es la máquina. Es dejar de poder ver el mundo de otra forma.',
    example:
      'Un bosque visto por un ingeniero forestal ya no es un bosque — es "tantos metros cúbicos de madera disponible". La mirada no cambió el árbol. Cambió lo único que el árbol puede significar desde ese momento en adelante.',
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

  // filósofos — cruzan hacia las ideas científicas que ya estaban en la red
  ['descartes', 'hofstadter'],
  ['descartes', 'tononi'],
  ['descartes', 'nietzsche'],
  ['nietzsche', 'kauffman'],
  ['baudrillard', 'maturana_varela'],
  ['baudrillard', 'foucault'],
  ['foucault', 'bateson'],
  ['heidegger', 'vonneumann'],
  ['heidegger', 'bertalanffy'],
]
