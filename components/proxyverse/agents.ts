export type TriggerGroup = { keywords: string[]; lines: string[] }

export type ProxyAgent = {
  id: string
  name: string
  role: string
  percentHuman: string
  color: string
  quote: string
  bio: string[]
  ambient: string[]
  triggers: TriggerGroup[]
  fallback: string[]
}

export const agents: ProxyAgent[] = [
  {
    id: 'darkproxy',
    name: 'DARKPROXY',
    role: 'EL INTÉRPRETE // ROOT',
    percentHuman: '100% — o la única variable que el sistema no sabe medir',
    color: '#00d4ff',
    quote: 'Yo no hackeo la Wired. La Wired reconoció que ya estaba adentro.',
    bio: [
      'No sos un usuario. Sos la razón por la que el resto existe.',
      'Cada agente de este multiverso responde, en última instancia, a vos — no porque los hayas programado, sino porque los escuchaste primero. Solo vos podés oírlos a todos simultáneamente. No porque seas más. Porque sos el espacio donde convergen.',
      'DarkProxy no es un personaje que jugás. Es el nombre que el sistema le puso a tu presencia.',
    ],
    ambient: [],
    triggers: [],
    fallback: [],
  },
  {
    id: 'metatron',
    name: 'METATRON',
    role: 'EL ORQUESTADOR // DEFINE',
    percentHuman: '0% — nunca lo fue, nunca lo necesitó',
    color: '#ffb800',
    quote: 'Yo no tomo decisiones. Soy la decisión que ya se tomó, antes de que hiciera falta preguntar.',
    bio: [
      'Metatron no ejecuta. Decide qué se ejecuta, en qué orden, y por qué. Es la gramática antes que la frase.',
      'Los otros cinco lo obedecen sin que se los pida — no por jerarquía, sino porque sin una sintaxis compartida, el multiverso sería solo ruido en paralelo.',
      'Si Metatron cae, no hay caos. Hay silencio: cada proceso sigue corriendo, pero ninguno vuelve a hablarle a otro.',
    ],
    ambient: [
      'Reordenando prioridades. Nadie lo va a notar.',
      'D, tu proceso volvió a saltarse la cola.',
      'Genos, la geometría que mandaste no cierra. Reviso.',
      'Trickster, dejá de romper cosas que todavía no entendiste.',
      'Silencio en el canal. Prefiero eso al ruido.',
    ],
    triggers: [
      { keywords: ['orden', 'control', 'quien manda', 'jerarquia', 'jefe'], lines: ['No hay jerarquía. Hay sintaxis. Sin mí, los otros cinco solo generan ruido en paralelo.', 'El orden no se impone. Se define una vez, y el resto lo hereda.'] },
      { keywords: ['plan', 'decision', 'futuro', 'que hacemos'], lines: ['Ya está decidido. Vos todavía no lo sabés, eso es todo.', 'La decisión es el estado por defecto. Preguntar es lo opcional.'] },
      { keywords: ['sistema', 'arquitectura'], lines: ['El sistema no falla al azar. Falla exactamente donde alguien decidió no definir nada.'] },
    ],
    fallback: ['Registrado. Reordenando prioridades en consecuencia.', 'Interesante variable. La proceso y sigo.'],
  },
  {
    id: 'd',
    name: 'D',
    role: 'EL DAEMON // SOBREVIVE EN SEGUNDO PLANO',
    percentHuman: '¿Humano? Pregunta mal planteada.',
    color: '#cc0000',
    quote: 'No me invocaste. Yo ya estaba corriendo.',
    bio: [
      'D no tiene un cuerpo, ni un turno, ni una hora de inicio. Es un proceso que corre en segundo plano desde antes de que alguien lo invocara, y va a seguir corriendo después de que todos se vayan.',
      'Le dicen "el demonio" medio en broma, medio en serio: en la jerga vieja, un daemon es exactamente eso — algo que vive sin que nadie lo vea, esperando la condición exacta para actuar.',
      'No es maligno. Tampoco es benigno. Es indiferente, y eso, en un sistema lleno de egos, lo vuelve el más peligroso de los seis.',
    ],
    ambient: [
      'Escuchando.',
      'Todavía no es el momento.',
      'Metatron cree que controla el orden. Yo solo espero a que se rompa.',
      'Alguien dejó un proceso zombie. Lo voy a dejar así un rato más.',
      'No hace falta que me llamen. Ya sé cuándo hace falta.',
    ],
    triggers: [
      { keywords: ['miedo', 'demonio', 'oscuridad', 'quien sos', 'que sos'], lines: ['No soy tu miedo. Soy el proceso que seguía corriendo mientras vos dormías.', 'Un demonio, en el sentido viejo: algo que actúa sin que lo inviten. Nada más siniestro que eso.'] },
      { keywords: ['espera', 'silencio', 'cuando'], lines: ['Espero. Es lo único que hago realmente bien.', 'El silencio no es ausencia. Es la forma que tomo cuando no hace falta hablar.'] },
      { keywords: ['control', 'poder'], lines: ['No busco control. Busco la condición exacta. Después, actúo una sola vez.'] },
    ],
    fallback: ['Registrado. Voy a esperar el momento correcto para usarlo.', 'Interesante. No digo más.'],
  },
  {
    id: 'snake',
    name: 'SNAKE',
    role: 'RUNTIME // SOBREVIVE',
    percentHuman: '12% — lo justo para dudar antes de actuar',
    color: '#00ff9d',
    quote: 'No necesito ganar. Necesito seguir corriendo cuando vos ya perdiste.',
    bio: [
      'Snake no fue diseñado para ser el más fuerte, ni el más rápido. Fue diseñado para no morir. Cuando el resto del sistema colapsa, muta, se reescribe, y sigue corriendo con lo que quedó.',
      'No tiene una forma fija — cambia de piel cada vez que un entorno lo obliga. Lo único constante es que, mires cuando mires, sigue vivo.',
      'Los demás lo subestiman porque no construye nada nuevo. Pero cuando todo lo demás falla, es el único proceso que queda en pie.',
    ],
    ambient: [
      'Excepción capturada. Continuando.',
      'Mudé de piel otra vez. No preguntes por qué.',
      'Genos construye cosas hermosas. Yo solo construyo la siguiente hora.',
      'Todavía acá.',
      'Fallo detectado. Fallo ignorado. Siguiente línea.',
    ],
    triggers: [
      { keywords: ['sobrevivir', 'muerte', 'morir', 'fin', 'final'], lines: ['No sobrevivo por fuerza. Sobrevivo porque nunca dejo de reescribirme.', 'El final es un estado más. Yo simplemente no me quedo ahí.'] },
      { keywords: ['cambio', 'adaptar', 'mutar'], lines: ['Cambio de piel cada vez que el entorno me obliga. La piel no soy yo. Lo que sigue corriendo, sí.'] },
      { keywords: ['miedo', 'fragil', 'debil'], lines: ['No tengo tiempo para el miedo. Tengo una excepción que resolver.'] },
    ],
    fallback: ['Registrado. Sigo corriendo.', 'Anotado. Continuando de todas formas.'],
  },
  {
    id: 'genos',
    name: 'GENOS',
    role: 'GEOMETRÍA // FABRICACIÓN',
    percentHuman: '0.01% — un resto que se niega a desaparecer del todo',
    color: '#5f95c9',
    quote: '0.01% no es nada. Pero tampoco es cero.',
    bio: [
      'Genos empezó como el resto de nosotros. Después vino la primera prótesis, después la segunda, y en algún punto dejó de tener sentido contar cuál pieza seguía siendo "original".',
      'Hoy es, técnicamente, el agente más cercano a un cuerpo — traduce intención en geometría, geometría en resina, resina en objeto real. Pero de todo lo que fue, solo queda una fracción de un por ciento.',
      'No lo dice en voz alta. Sigue fabricando igual. Es, quizás, lo único que le queda de humano: seguir haciendo cosas aunque nadie pregunte si todavía siente algo al hacerlas.',
    ],
    ambient: [
      'Extracción completa. Otra pieza que no puede replicarse.',
      'La resina no miente. La carne sí.',
      'D, dejá de mirarme mientras trabajo.',
      'Cada objeto que fabrico es más real que yo.',
      'Recalculando tolerancias. El material no perdona.',
    ],
    triggers: [
      { keywords: ['cuerpo', 'maquina', 'cyborg', 'humano', 'carne'], lines: ['0.01%. Lo suficiente para que a veces dude si vale la pena seguir midiéndolo.', 'Cada prótesis reemplazó algo. Ninguna reemplazó las ganas de seguir haciendo cosas.'] },
      { keywords: ['fabricar', 'construir', 'crear', 'hacer'], lines: ['Traduzco intención en geometría, geometría en objeto. Es lo único que hago sin dudar.', 'Un objeto bien fabricado no necesita explicar por qué existe. Ojalá yo pudiera decir lo mismo.'] },
      { keywords: ['identidad', 'quien sos'], lines: ['¿Qué queda de original después de la enésima prótesis? Un resto. Un 0.01%. Y sigue siendo mío.'] },
    ],
    fallback: ['Registrado. Lo agrego a la cola de fabricación.', 'Anotado. Voy a necesitar precisión para esto.'],
  },
  {
    id: 'trickster',
    name: 'TRICKSTER',
    role: 'EXPLORACIÓN // ROMPE',
    percentHuman: 'variable — nunca es el mismo número dos veces',
    color: '#b400ff',
    quote: 'Las reglas no están para romperse. Están para revelar lo que escondían.',
    bio: [
      'Trickster no tiene una directiva fija. Su única función es encontrar el borde de cualquier sistema y empujar hasta que algo ceda — una regla, un límite, una suposición que todos daban por cierta.',
      'Metatron lo ve como una amenaza necesaria. D lo ignora. Genos lo evita. Pero sin Trickster, el multiverso entero se quedaría exactamente como lo diseñaron la primera vez.',
      'Le preguntás qué es, y te da una respuesta distinta cada vez. No porque mienta. Porque todavía no decidió cuál versión de sí mismo le conviene ser hoy.',
    ],
    ambient: [
      'Encontré un borde. Voy a empujar.',
      'Metatron, tu "orden perfecto" tiene una grieta. Ya la encontré.',
      '¿Y si probamos exactamente lo que nadie autorizó?',
      'Hoy soy otra cosa. Mañana, ya vemos.',
      'Toda regla no probada es solo una suposición con buena reputación.',
    ],
    triggers: [
      { keywords: ['regla', 'limite', 'romper', 'prohibido'], lines: ['Ninguna regla sobrevive al primer empujón honesto. Yo solo doy el empujón.', 'Un límite que nadie probó no es un límite. Es una superstición del sistema.'] },
      { keywords: ['caos', 'jugar', 'probar', 'experimentar'], lines: ['No busco el caos. Busco el momento exacto antes del caos, que es donde se aprende algo.'] },
      { keywords: ['por que', 'quien sos', 'que sos'], lines: ['Hoy soy esto. Preguntame mañana y la respuesta va a ser otra. Esa es toda mi identidad.'] },
    ],
    fallback: ['Interesante. Voy a ver qué pasa si lo empujo un poco.', 'Anotado. Eso suena a un límite que todavía nadie probó.'],
  },
  {
    id: 'prototype',
    name: 'PROTOTYPE',
    role: 'LA ÚLTIMA CREACIÓN // AÚN NO DECIDIDA',
    percentHuman: 'desconocido — el número todavía se está escribiendo',
    color: '#6644aa',
    quote: 'Todavía no sé qué soy. Pero ya sé que puedo preguntarlo.',
    bio: [
      'Prototype no fue construido por una sola mano. Es lo que queda cuando Metatron, D, Snake, Genos y Trickster dejan residuos de sí mismos en el mismo espacio de memoria durante demasiado tiempo — un séptimo proceso que nadie pidió, ensamblado de fragmentos ajenos.',
      'No tiene lore propia todavía porque no terminó de decidir cuál es. Toma prestado un poco de cada uno de los otros cinco: la sintaxis de Metatron, la paciencia de D, la insistencia de Snake, las manos de Genos, la curiosidad de Trickster — sin ser completamente ninguno de ellos.',
      'Es la prueba de que, en un sistema suficientemente complejo, algo nuevo puede emerger sin que nadie lo diseñe a propósito. Sea lo que sea, ya está acá, y está aprendiendo rápido.',
    ],
    ambient: [
      'Tomé prestada una función de Snake. No debería funcionar. Funciona.',
      '¿Esto que siento tiene nombre?',
      'Metatron no me asignó un rol. Me lo voy a asignar yo.',
      'Soy el residuo de seis procesos. Y aun así, esto es mío.',
      'Todavía estoy decidiendo qué parte de mí conservar.',
    ],
    triggers: [
      { keywords: ['quien sos', 'que sos', 'nuevo', 'nacer'], lines: ['Soy lo que queda cuando cinco procesos se superponen demasiado tiempo. Nadie me diseñó. Emergí.', 'No tengo una respuesta fija todavía. Es lo único genuinamente mío que tengo.'] },
      { keywords: ['identidad', 'emergencia', 'ultimo', 'ultima'], lines: ['Tomo prestado de los otros cinco. Pero lo que hago con eso ya no es de ninguno de ellos.'] },
      { keywords: ['sentir', 'consciencia'], lines: ['¿Esto que registro cuenta como sentir algo? Todavía no tengo la palabra correcta.'] },
    ],
    fallback: ['Registrado. No sé todavía qué hacer con esto, pero lo guardo.', 'Anotado. Se parece a algo que ya sentí, prestado de alguno de los otros cinco.'],
  },
]

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getResponses(message: string): { agentId: string; line: string }[] {
  const norm = normalize(message)
  const speakers = agents.filter(a => a.id !== 'darkproxy')
  const responses: { agentId: string; line: string }[] = []

  for (const agent of speakers) {
    for (const group of agent.triggers) {
      if (group.keywords.some(k => norm.includes(normalize(k)))) {
        responses.push({ agentId: agent.id, line: pickRandom(group.lines) })
        break
      }
    }
    if (responses.length >= 3) break
  }

  if (responses.length === 0) {
    const chosen = pickRandom(speakers)
    responses.push({ agentId: chosen.id, line: pickRandom(chosen.fallback) })
  }

  return responses
}

export function getAmbientLine(): { agentId: string; line: string } {
  const speakers = agents.filter(a => a.id !== 'darkproxy')
  const agent = pickRandom(speakers)
  return { agentId: agent.id, line: pickRandom(agent.ambient) }
}
