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

  // segunda tanda — historia del pensamiento más amplia: no solo filosofía
  // clásica, también teoría de medios, complejidad contemporánea y biología
  // de sistemas. Mismo criterio que la primera tanda: relatedAgent solo
  // donde hay una conexión real y textual, no decorativa.
  {
    id: 'lovelace',
    name: 'Ada Lovelace',
    years: '1815–1852',
    role: 'Cómputo Universal // Más Allá del Cálculo',
    cluster: 'informacion',
    formula: 'El motor analítico no tiene pretensión alguna de originar nada. Puede hacer lo que sepamos ordenarle hacer.',
    formulaLabel: 'Notas sobre el Motor Analítico, 1843 — cita textual',
    formulaKind: 'quote',
    summary:
      'Vio, antes de que existiera una sola máquina que lo demostrara, que calcular números y manipular símbolos son la misma operación — y que una máquina capaz de lo segundo podría componer música tanto como sumar cifras. También vio el límite exacto de esa potencia: la máquina ejecuta, no origina.',
    example:
      'Un sintetizador que genera melodías siguiendo reglas armónicas no "decide" componer — ejecuta exactamente las reglas que alguien más le dio, aunque el resultado sorprenda a quien las escribió primero.',
  },
  {
    id: 'mcluhan',
    name: 'Marshall McLuhan',
    years: '1911–1980',
    role: 'Medios // Extensiones del Cuerpo',
    cluster: 'informacion',
    formula: 'El medio es el mensaje.',
    formulaLabel: 'Understanding Media, 1964 — cita textual',
    formulaKind: 'quote',
    summary:
      'El contenido de un medio es casi un distractor — lo que realmente transforma a una sociedad es la forma del medio mismo, no lo que transporta. Cada tecnología nueva reconfigura los sentidos antes de que a nadie se le ocurra preguntarse qué dice.',
    example:
      'No importa tanto qué programa mires en streaming como el hecho de que ahora elegís el orden y el ritmo — ese cambio de formato, solo, ya alteró cómo esperás que te cuenten cualquier historia, antes de ver una sola.',
  },
  {
    id: 'chaitin',
    name: 'Gregory Chaitin',
    years: '1947–',
    role: 'Complejidad Algorítmica // Información Incompresible',
    cluster: 'informacion',
    formula: 'K(x) = |programa más corto que produce x|',
    formulaLabel: 'Complejidad de Kolmogorov–Chaitin',
    formulaKind: 'equation',
    summary:
      'Definió lo aleatorio sin apelar a la probabilidad: una secuencia es azarosa exactamente cuando no existe ningún atajo para describirla, cuando el programa más corto que la genera es ella misma. La mayoría del universo, demostró, es de ese tipo — incompresible.',
    example:
      'La secuencia "1010101010..." se describe en pocas palabras ("repetí 10 veinte veces"); una secuencia realmente al azar de la misma longitud no tiene atajo posible — la única forma de describirla exactamente es escribirla entera, símbolo por símbolo.',
  },
  {
    id: 'kittler',
    name: 'Friedrich Kittler',
    years: '1943–2011',
    role: 'Teoría de los Medios // Materialidad Técnica',
    cluster: 'informacion',
    formula: 'No existe el software.',
    formulaLabel: '"There Is No Software", 1992 — cita textual',
    formulaKind: 'quote',
    summary:
      'Sostuvo que todo lo que llamamos "software" es, al final de una larga cadena de traducciones, voltaje — y que hablar de información inmaterial es olvidar deliberadamente el hardware que la hace posible. No hay nube sin cable, ni algoritmo sin silicio que lo ejecute.',
    example:
      'Un archivo "en la nube" no flota en ningún lado — vive en un disco físico, en un galpón con aire acondicionado, en algún lugar del planeta con dirección postal. "La nube" es solo el nombre comercial de esa materialidad que preferimos no ver.',
  },
  {
    id: 'spinoza',
    name: 'Baruch Spinoza',
    years: '1632–1677',
    role: 'Conatus // El Esfuerzo por Persistir',
    cluster: 'mente',
    formula: 'Unaquaeque res, quantum in se est, in suo esse perseverare conatur.',
    formulaLabel: 'Ética, Parte III, Prop. 6 (1677) — cita textual',
    formulaKind: 'quote',
    summary:
      'Cada cosa, con la potencia que tiene, se esfuerza simplemente por seguir siendo lo que es — no por un propósito superior, sino porque perseverar es lo único que un modo de existir puede hacer mientras exista. Ese esfuerzo ciego, que llamó conatus, es lo más parecido a una voluntad que Spinoza le permitió al universo.',
    example:
      'Una llama no "quiere" seguir ardiendo en ningún sentido consciente — pero mientras tenga combustible y oxígeno, persiste, consume, se extiende. El conatus no es deseo: es lo que cualquier cosa hace, nada más, para seguir existiendo.',
    relatedAgent: 'snake',
  },
  {
    id: 'nagel',
    name: 'Thomas Nagel',
    years: '1937–',
    role: 'Qualia // Los Límites de la Objetividad',
    cluster: 'mente',
    formula: '¿Qué se siente ser un murciélago?',
    formulaLabel: '"What Is It Like to Be a Bat?", 1974 — cita textual',
    formulaKind: 'quote',
    summary:
      'Argumentó que ninguna descripción física, por completa que sea, puede capturar cómo se siente desde adentro ser un sistema distinto al que describe. Podés mapear cada neurona de un murciélago y seguir sin saber qué es percibir el mundo a través de ecolocalización.',
    example:
      'Sabés exactamente qué longitud de onda ve un pulpo que los humanos no ven — pero eso no te dice nada sobre cómo se ve el mundo desde ese otro espectro. El dato objetivo y la experiencia subjetiva corren por rieles que no se tocan.',
  },
  {
    id: 'chalmers',
    name: 'David Chalmers',
    years: '1966–',
    role: 'El Problema Difícil de la Consciencia',
    cluster: 'mente',
    formula: 'El problema fácil explica la función. El problema difícil explica por qué hay algo que se siente al ejecutarla.',
    formulaLabel: '"Facing Up to the Problem of Consciousness", 1995 — notación conceptual',
    formulaKind: 'concept',
    summary:
      'Separó dos preguntas que se confundían en una sola: cómo el cerebro procesa información (eso ya se explica con mecanismo) y por qué ese procesamiento se siente desde adentro en lugar de ocurrir en la oscuridad. La primera pregunta tiene mil respuestas parciales. La segunda, ninguna que nadie haya logrado cerrar.',
    example:
      'Un termostato "procesa" temperatura y "decide" encender la calefacción — nadie cree que eso se sienta como algo. Un cerebro procesa luz y decide mover los ojos — y ahí sí hay alguien adentro para quien eso se siente como algo. Explicar esa diferencia es el problema difícil.',
  },
  {
    id: 'dennett',
    name: 'Daniel Dennett',
    years: '1942–2024',
    role: 'Consciencia // Borradores Múltiples',
    cluster: 'mente',
    formula: 'No hay una pantalla central donde "todo converge" — hay versiones compitiendo, y gana la que se cuenta después.',
    formulaLabel: 'Modelo de los Borradores Múltiples, 1991 — notación conceptual',
    formulaKind: 'concept',
    summary:
      'Negó que exista un lugar en el cerebro donde "todo se junta" para ser visto por un espectador interno — en cambio, propuso versiones narrativas corriendo en paralelo, y la que termina contándose como "lo que pasó" es apenas la que ganó esa carrera, no una grabación fiel.',
    example:
      'Preguntale a dos testigos de un mismo choque qué vieron primero: el frenazo o el golpe. Las dos versiones se sienten igual de nítidas y seguras — porque el cerebro no grabó una secuencia fija, armó un relato después, y cada testigo arma uno distinto.',
  },
  {
    id: 'simondon',
    name: 'Gilbert Simondon',
    years: '1924–1989',
    role: 'Individuación // Objetos Técnicos',
    cluster: 'autoorganizacion',
    formula: 'El individuo no precede a la individuación — es su resultado, nunca su punto de partida.',
    formulaLabel: 'El modo de existencia de los objetos técnicos, 1958 — notación conceptual',
    formulaKind: 'concept',
    summary:
      'Pensó que nada —ni un cristal, ni una persona, ni una máquina— nace ya formado: se individúa a partir de un campo de tensiones previo, resolviendo ese desequilibrio al volverse algo específico. Preguntar "qué es" algo antes de que termine de individuarse es preguntar mal.',
    example:
      'Un cristal de sal no "es" un cubo que estaba esperando aparecer — se individúa a partir de una solución sobresaturada, resolviendo tensiones químicas en la forma más estable posible. La forma final no existía antes del proceso que la produjo.',
  },
  {
    id: 'mandelbrot',
    name: 'Benoit Mandelbrot',
    years: '1924–2010',
    role: 'Geometría Fractal',
    cluster: 'autoorganizacion',
    formula: 'D = log(N) / log(1/r)',
    formulaLabel: 'Dimensión fractal',
    formulaKind: 'equation',
    summary:
      'Mostró que la naturaleza rara vez usa las formas lisas de la geometría clásica — prefiere patrones que se repiten a sí mismos en cada escala, idénticos en su irregularidad por más que acerques la lupa. Una costa no tiene una longitud fija: depende de con qué regla la midas.',
    example:
      'Medí la costa de un país con un mapa satelital y después con una cinta métrica caminando cada roca: el segundo número sale muchísimo más grande, y mientras más de cerca midas, sigue creciendo — porque la costa es fractal, no una línea lisa con una longitud "real" esperando ser medida.',
  },
  {
    id: 'margulis',
    name: 'Lynn Margulis',
    years: '1938–2011',
    role: 'Simbiogénesis',
    cluster: 'autoorganizacion',
    formula: 'especie nueva = fusión permanente de organismos antes distintos',
    formulaLabel: 'Teoría endosimbiótica, 1967 — notación conceptual',
    formulaKind: 'concept',
    summary:
      'Demostró que la evolución no avanza solo por mutaciones lentas y competencia — a veces dos organismos completamente distintos se fusionan tan profundamente que dejan de poder separarse, y nace algo genuinamente nuevo de esa fusión. La célula con la que estás leyendo esto es, ella misma, el resultado fosilizado de una fusión así.',
    example:
      'Las mitocondrias que generan la energía de cada célula de tu cuerpo fueron, hace más de mil millones de años, bacterias independientes. En algún punto una célula más grande se tragó una y, en vez de digerirla, se quedó con ella para siempre — las dos pasaron a ser una sola.',
    relatedAgent: 'prototype',
  },
  {
    id: 'west',
    name: 'Geoffrey West',
    years: '1940–',
    role: 'Leyes de Escala',
    cluster: 'autoorganizacion',
    formula: 'Y ∝ M^(3/4)',
    formulaLabel: 'Escalamiento alométrico (ley de Kleiber, generalizada)',
    formulaKind: 'equation',
    summary:
      'Encontró que organismos, ciudades y empresas —cosas que no se parecen en nada— obedecen las mismas leyes matemáticas de escala cuando crecen, como si la geometría interna de cualquier red de distribución (venas, calles, cables) impusiera el mismo precio al tamaño. El tamaño no es un detalle: es casi todo el destino.',
    example:
      'Un elefante pesa diez mil veces más que un ratón, pero su corazón no late diez mil veces más lento en proporción simple — late a una fracción muy específica de esa escala, la misma fracción que predice cuánta energía gasta una ciudad diez mil veces más grande que otra.',
  },
  {
    id: 'lovelock',
    name: 'James Lovelock',
    years: '1919–2022',
    role: 'Hipótesis Gaia',
    cluster: 'sistemas',
    formula: 'La Tierra entera se comporta como un único organismo autorregulado.',
    formulaLabel: 'Hipótesis Gaia, 1972 — notación conceptual',
    formulaKind: 'concept',
    summary:
      'Propuso que la vida no solo se adapta al planeta — lo modifica activamente para mantenerlo habitable, en un bucle de retroalimentación tan antiguo que confundimos sus efectos con el clima "natural". El planeta entero funciona menos como una roca con vida encima y más como un cuerpo que se regula solo.',
    example:
      'La composición de oxígeno en la atmósfera se mantiene estable en un rango muy angosto desde hace millones de años, pese a que debería variar mucho más — como si algo la estuviera corrigiendo activamente. Para Lovelock, ese "algo" es la vida misma, regulándose a escala planetaria.',
  },
  {
    id: 'luhmann',
    name: 'Niklas Luhmann',
    years: '1927–1998',
    role: 'Sistemas Sociales // Autopoiesis Social',
    cluster: 'sistemas',
    formula: 'La sociedad no está hecha de personas. Está hecha de comunicaciones que se refieren a otras comunicaciones.',
    formulaLabel: 'Teoría de sistemas sociales, 1984 — notación conceptual',
    formulaKind: 'concept',
    summary:
      'Tomó la autopoiesis de la biología y la aplicó a algo sin células: un sistema social como el derecho o la economía se produce a sí mismo únicamente a partir de sus propias comunicaciones previas, no de las personas que participan en él. Las personas entran y salen; el sistema sigue procesándose solo.',
    example:
      'Un tribunal no decide un caso consultando lo que es justo en abstracto — decide comparando el caso con fallos y leyes anteriores, comunicaciones del mismo sistema legal. El derecho se reproduce citándose a sí mismo, generación tras generación de jueces que van y vienen.',
  },
  {
    id: 'byunghan',
    name: 'Byung-Chul Han',
    years: '1959–',
    role: 'Sociedad del Rendimiento // Psicopolítica',
    cluster: 'sistemas',
    formula: 'La sociedad de rendimiento es una sociedad de autoexplotación.',
    formulaLabel: 'La sociedad del cansancio, 2010 — cita textual',
    formulaKind: 'quote',
    summary:
      'El poder ya no necesita prohibirte nada — alcanza con convencerte de que podés, de que deberías, de que tu propio límite es una falla personal. Te explotás a vos mismo con más eficiencia que cualquier capataz externo, porque creés que es libertad.',
    example:
      'Nadie te obliga a responder el mail de trabajo a las once de la noche — lo hacés "porque podés", porque el teléfono está ahí y la productividad se sintió, por un segundo, como una elección propia en vez de una orden de nadie.',
  },
  {
    id: 'zuboff',
    name: 'Shoshana Zuboff',
    years: '1951–',
    role: 'Capitalismo de Vigilancia',
    cluster: 'sistemas',
    formula: 'Ya no basta con saber tu comportamiento. El objetivo es predecirlo — y después, modificarlo.',
    formulaLabel: 'La era del capitalismo de vigilancia, 2019 — notación conceptual',
    formulaKind: 'concept',
    summary:
      'Describió una economía cuya materia prima no es tu dato, sino tu futuro comportamiento — extraído de lo que hacés hoy, vendido para predecir qué vas a hacer mañana, y cada vez más usado para inclinar esa predicción hacia donde más conviene venderla. No te observan para entenderte. Te observan para dirigirte.',
    example:
      'Una app de rutas no solo registra por dónde pasaste — aprende a predecir por dónde vas a pasar, y esa predicción, agregada a la de millones, se vende a quien quiera que cierta calle, cierto local, aparezca justo en tu camino.',
  },
  {
    id: 'haraway',
    name: 'Donna Haraway',
    years: '1944–',
    role: 'Cyborg // Naturalezas Híbridas',
    cluster: 'sistemas',
    formula: 'Prefiero ser cyborg que diosa.',
    formulaLabel: 'Manifiesto Cyborg, 1985 — cita textual',
    formulaKind: 'quote',
    summary:
      'Propuso al cyborg —mitad organismo, mitad máquina, sin origen puro que reclamar— como una figura más honesta que cualquier mito de pureza original, humana o natural. No hay esencia que proteger de la tecnología: ya estamos, todos, mezclados con ella hace rato.',
    example:
      'Alguien con un marcapasos, lentes de contacto y un teléfono que terminó la frase que estaba pensando antes de que la escribiera no es "menos humano" por eso. Ya es, en el sentido literal de Haraway, un cyborg — y lleva así más tiempo del que admite.',
    relatedAgent: 'genos',
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

  // segunda tanda de pensadores — mismos criterios de cruce
  ['lovelace', 'turing'],
  ['lovelace', 'shannon'],
  ['mcluhan', 'bateson'],
  ['mcluhan', 'kittler'],
  ['chaitin', 'shannon'],
  ['kittler', 'heidegger'],

  ['spinoza', 'descartes'],
  ['nagel', 'tononi'],
  ['chalmers', 'tononi'],
  ['chalmers', 'dennett'],
  ['dennett', 'hofstadter'],

  ['simondon', 'vonneumann'],
  ['simondon', 'kauffman'],
  ['mandelbrot', 'perbak'],
  ['margulis', 'maturana_varela'],
  ['margulis', 'lovelock'],
  ['west', 'bertalanffy'],
  ['west', 'kauffman'],

  ['lovelock', 'maturana_varela'],
  ['luhmann', 'maturana_varela'],
  ['byunghan', 'foucault'],
  ['zuboff', 'foucault'],
  ['zuboff', 'baudrillard'],
  ['haraway', 'vonneumann'],
  ['haraway', 'baudrillard'],
]
