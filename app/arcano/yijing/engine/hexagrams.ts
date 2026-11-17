import { TRIGRAMS, TRIGRAM_ORDER, trigramFromLines, type TrigramId } from './trigrams'

// Las 64 lecturas -- nota de honestidad, no decoración: la estructura de
// acá (qué dos trigramas componen cada hexagrama, qué línea es cuál) es
// 100% real y verificable, es simple combinatoria sobre los 8 trigramas
// de trigrams.ts. El TEXTO de cada lectura, en cambio, es síntesis
// propia de NeoProxy sobre esa combinación real -- no una traducción de
// los juicios clásicos del Yi Jing. Este entorno no tiene acceso de red
// a una fuente primaria verificable para citar los 64 textos
// tradicionales letra por letra (ver /arcano/yijing, sección VIII), así
// que en vez de arriesgar una cita mal recordada de un texto de miles de
// años, el oráculo construye su propia lectura -- en diálogo con la
// tradición (upper = lo que se manifiesta hacia afuera, lower = la raíz
// desde donde se parte, igual que en el sistema real), nunca
// presentada como el texto clásico.

export type HexagramReading = { title: string; reading: string }

type Key = `${TrigramId}-${TrigramId}` // `${upper}-${lower}`

const READINGS: Record<Key, HexagramReading> = {
  // ===== UPPER: QIAN (Cielo) =====
  'qian-qian': { title: 'El cielo duplicado', reading: 'Fuerza pura sosteniendo fuerza pura: no hay nada en el camino que la frene ni la corrija. Lo que entra con esta intención sale amplificado, para bien o para mal — revisá la raíz antes de confiar en el impulso.' },
  'qian-kun': { title: 'La tierra bajo el cielo abierto', reading: 'Lo receptivo como punto de partida, lo creativo como destino: algo que empezó entregado, dócil, encuentra al final el espacio para volverse fuerza propia. La paciencia de la raíz termina pagando.' },
  'qian-zhen': { title: 'El trueno que asciende al cielo', reading: 'Un impulso inicial brusco que termina convirtiéndose en una fuerza sostenida y clara. Lo que arrancó como sacudida se ordena, con el tiempo, en algo con dirección propia.' },
  'qian-kan': { title: 'El abismo bajo el cielo firme', reading: 'Peligro en la raíz, claridad arriba: hay que atravesar lo incierto para llegar a algo sólido. No se puede saltar ese tramo — el cielo firme está del otro lado, no antes.' },
  'qian-gen': { title: 'La montaña que sostiene el cielo', reading: 'Quietud en la base, fuerza pura en la cima: lo que se construye despacio, sin apuro, termina sosteniendo algo mucho más grande que el esfuerzo inicial que le dio origen.' },
  'qian-xun': { title: 'El viento que se vuelve cielo', reading: 'Algo gradual, casi imperceptible al principio, termina ocupando todo el espacio disponible. La penetración lenta gana donde la fuerza directa no hubiera entrado.' },
  'qian-li': { title: 'El fuego bajo el cielo abierto', reading: 'Claridad que arranca pequeña y encuentra, arriba, todo el espacio para expandirse sin resistencia. Lo que ilumina bien desde temprano no necesita forzar su propio alcance.' },
  'qian-dui': { title: 'El lago que refleja el cielo', reading: 'Alegría genuina en la raíz, fuerza pura como resultado: lo que se disfruta de verdad, sin fingir, termina siendo también lo más sólido que se construyó.' },

  // ===== UPPER: KUN (Tierra) =====
  'kun-qian': { title: 'El cielo bajo la tierra', reading: 'Fuerza pura en la raíz, entrega total como resultado: lo más potente que tenés solo rinde si termina al servicio de algo más grande que vos mismo. Fuerza sin entrega se agota sola.' },
  'kun-kun': { title: 'La tierra duplicada', reading: 'Receptividad total, de principio a fin — nada se le opone ni la cuestiona. El riesgo no es la fuerza en contra, es nunca encontrar un límite real que la enfoque.' },
  'kun-zhen': { title: 'El trueno que se disuelve en tierra', reading: 'Un impulso fuerte al principio que termina asentándose, integrándose, perdiendo el filo que tenía al arrancar. No es fracaso: es lo que un comienzo brusco necesita para durar.' },
  'kun-kan': { title: 'El abismo que se asienta en tierra', reading: 'Peligro que, en vez de resolverse, termina absorbido por algo más grande y más paciente que él. La raíz incierta se vuelve, con tiempo, parte del paisaje.' },
  'kun-gen': { title: 'La montaña que se vuelve llanura', reading: 'Lo que empezó firme y quieto termina entregado, disuelto en algo más amplio. Un límite muy sostenido, con el tiempo suficiente, deja de hacer falta.' },
  'kun-xun': { title: 'El viento que se pierde en la tierra', reading: 'Algo gradual que, en vez de imponerse, termina absorbido por la paciencia de lo que lo recibe. La penetración suave no siempre gana — a veces la entrega gana primero.' },
  'kun-li': { title: 'El fuego que se apaga en tierra', reading: 'Claridad que arde con fuerza al principio y termina, con el tiempo, entregada a algo más silencioso. No toda luz necesita seguir ardiendo para haber servido.' },
  'kun-dui': { title: 'El lago que se seca en tierra', reading: 'Alegría genuina que termina asentándose en algo más estable y menos brillante. El placer de la raíz se transforma en satisfacción tranquila, no en euforia sostenida.' },

  // ===== UPPER: ZHEN (Trueno) =====
  'zhen-qian': { title: 'El cielo que estalla en trueno', reading: 'Fuerza pura en la base que termina liberándose de golpe, como una sacudida que no se podía contener más. Lo que se vino acumulando en silencio, en algún momento, truena.' },
  'zhen-kun': { title: 'La tierra que se sacude', reading: 'Entrega total que, de repente, se interrumpe con un impulso que nadie vio venir. La pasividad sostenida tiene un límite, y cuando se rompe, se rompe de golpe.' },
  'zhen-zhen': { title: 'El trueno duplicado', reading: 'El impacto se repite antes de que el primero termine de asentarse. Hay que aprender a moverse mientras tiembla el piso, porque esta vez no hay pausa entre una sacudida y la siguiente.' },
  'zhen-kan': { title: 'El abismo que truena', reading: 'Peligro que, en vez de acecharte en silencio, se anuncia con una sacudida clara. Es la versión más incómoda del riesgo y también la más honesta: por lo menos no te toma desprevenido.' },
  'zhen-gen': { title: 'La montaña que tiembla', reading: 'Algo muy quieto, muy sostenido, de golpe se sacude — y después vuelve a la quietud, distinto. No todo impulso busca durar; algunos solo necesitan reacomodar lo que ya estaba.' },
  'zhen-xun': { title: 'El viento después del trueno', reading: 'Un impacto inicial fuerte que, pasado el primer momento, se vuelve algo gradual y constante. El shock abre la puerta; lo que entra después, entra despacio.' },
  'zhen-li': { title: 'El fuego que estalla', reading: 'Claridad que no crece de a poco sino que aparece de golpe, con fuerza — una revelación más que un aprendizaje lento. Hay verdades que no se acumulan, se descubren de un salto.' },
  'zhen-dui': { title: 'El lago que se agita', reading: 'Alegría que no es calma sino sobresalto — algo bueno que llega de golpe, sin aviso. El placer inesperado también cuenta, aunque no se parezca al que uno estaba esperando.' },

  // ===== UPPER: KAN (Agua) =====
  'kan-qian': { title: 'El cielo bajo el abismo', reading: 'Fuerza pura en la raíz que termina atravesando una zona de riesgo real. No alcanza con tener la fuerza: hay que estar dispuesto a cruzar lo incierto para que sirva de algo.' },
  'kan-kun': { title: 'La tierra bajo el abismo', reading: 'Entrega total que, en el camino, se encuentra con un peligro que no esperaba. La pasividad no protege de todo — en algún punto hay que decidir, no solo entregarse.' },
  'kan-zhen': { title: 'El trueno que cae en el abismo', reading: 'Un impulso fuerte que termina metiéndose, sin darse cuenta, en una situación de riesgo real. La energía inicial no alcanza sola — hace falta cautela después del primer movimiento.' },
  'kan-kan': { title: 'El abismo duplicado', reading: 'Peligro sobre peligro, sin tregua entre uno y otro. Es la situación más exigente de las 64 — y también la que, si se atraviesa entera, deja la confianza más sólida de todas.' },
  'kan-gen': { title: 'La montaña bajo el abismo', reading: 'Algo firme y quieto que igual se enfrenta a un riesgo real por delante. La solidez de la base no elimina el peligro — lo hace atravesable, que no es lo mismo.' },
  'kan-xun': { title: 'El viento que entra al abismo', reading: 'Algo gradual y suave que termina, sin buscarlo, adentro de una situación de riesgo. La penetración lenta a veces lleva a lugares que no se veían desde afuera.' },
  'kan-li': { title: 'El fuego bajo el abismo', reading: 'Claridad real que igual tiene que atravesar una zona incierta antes de mostrarse del todo. Ver bien no siempre alcanza para evitar el riesgo — a veces solo ayuda a cruzarlo mejor.' },
  'kan-dui': { title: 'El lago sobre el abismo', reading: 'Alegría genuina construida justo encima de algo inestable. El placer es real, pero conviene no olvidar lo que hay debajo — no es motivo para no disfrutarlo, sí para no confiarse del todo.' },

  // ===== UPPER: GEN (Montaña) =====
  'gen-qian': { title: 'El cielo bajo la montaña', reading: 'Fuerza pura que termina encontrando un límite firme, algo que la contiene sin apagarla. No toda fuerza necesita expandirse sin freno — a veces lo que la vuelve útil es justo el límite.' },
  'gen-kun': { title: 'La tierra bajo la montaña', reading: 'Entrega total que termina sostenida por algo quieto y firme. La pasividad, cuando encuentra un límite claro que la sostiene, deja de ser indefinición y se vuelve descanso real.' },
  'gen-zhen': { title: 'El trueno bajo la montaña', reading: 'Un impulso fuerte que queda contenido, con el tiempo, dentro de algo más estable. La sacudida inicial no desaparece — se queda guardada, lista, debajo de la quietud.' },
  'gen-kan': { title: 'El abismo bajo la montaña', reading: 'Peligro real que queda contenido por algo firme y quieto encima. El riesgo sigue ahí, pero ya no define todo lo que pasa — hay un límite que lo sostiene.' },
  'gen-gen': { title: 'La montaña duplicada', reading: 'Quietud total, de principio a fin, sin ningún impulso que la interrumpa. Es el momento de parar del todo — no para siempre, pero sí lo suficiente como para que el límite haga su trabajo.' },
  'gen-xun': { title: 'El viento bajo la montaña', reading: 'Algo gradual y suave que termina contenido por un límite firme. La penetración lenta encuentra, al final, algo que no cede — y ese límite es, acá, lo que faltaba.' },
  'gen-li': { title: 'El fuego bajo la montaña', reading: 'Claridad real que queda guardada, contenida, debajo de algo más quieto. No toda luz necesita mostrarse enseguida — a veces lo útil es esperar a que el límite la deje salir.' },
  'gen-dui': { title: 'El lago bajo la montaña', reading: 'Alegría genuina que encuentra un límite firme que la contiene sin apagarla. El placer que se sostiene mejor no es el que se expande sin freno, es el que encuentra su propia orilla.' },

  // ===== UPPER: XUN (Viento) =====
  'xun-qian': { title: 'El cielo bajo el viento', reading: 'Fuerza pura que termina moviéndose despacio, gradual, en vez de de golpe. Lo más potente que tenés, cuando se aplica sin apuro, penetra más profundo que si se soltara todo de una vez.' },
  'xun-kun': { title: 'La tierra bajo el viento', reading: 'Entrega total que, de a poco, va siendo movida por algo constante y suave. El cambio más duradero no es el que sacude — es el que se repite, lento, hasta que la raíz misma se transforma.' },
  'xun-zhen': { title: 'El trueno bajo el viento', reading: 'Un impulso fuerte que, con el tiempo, se vuelve algo gradual y sostenido. El shock inicial se transforma en constancia — lo que empezó como sacudida termina siendo hábito.' },
  'xun-kan': { title: 'El abismo bajo el viento', reading: 'Peligro real que se va moviendo, de a poco, hacia algo más manejable. No se resuelve de golpe — se erosiona despacio, con paciencia, igual que el viento desgasta la piedra.' },
  'xun-gen': { title: 'La montaña bajo el viento', reading: 'Algo firme y quieto que, con el tiempo suficiente, empieza a ceder un poco. Ni el límite más sólido es completamente inmóvil frente a lo que insiste despacio y sin pausa.' },
  'xun-xun': { title: 'El viento duplicado', reading: 'Penetración suave sobre penetración suave, sin un solo golpe directo en todo el proceso. Es el cambio más difícil de notar mientras pasa y el más profundo una vez que ya pasó.' },
  'xun-li': { title: 'El fuego bajo el viento', reading: 'Claridad que, alimentada despacio y sin pausa, termina creciendo más de lo que parecía posible al principio. El fuego que dura no es el que arde más fuerte, es el que nunca se queda sin aire.' },
  'xun-dui': { title: 'El lago bajo el viento', reading: 'Alegría genuina que se mueve, de a poco, hacia algo distinto de lo que era al principio. El placer que se deja transformar con el tiempo no se pierde — cambia de forma.' },

  // ===== UPPER: LI (Fuego) =====
  'li-qian': { title: 'El cielo bajo el fuego', reading: 'Fuerza pura que termina mostrándose con total claridad, sin nada que la oculte. Lo que es fuerte de verdad no necesita esconderse — esta combinación es la de la fuerza que se deja ver entera.' },
  'li-kun': { title: 'La tierra bajo el fuego', reading: 'Entrega total que, al final, queda completamente iluminada — se ve con claridad qué era esa pasividad en realidad. A veces lo que más cuesta ver es lo que más tiempo estuvo quieto cerca nuestro.' },
  'li-zhen': { title: 'El trueno bajo el fuego', reading: 'Un impulso fuerte que termina revelando algo, de golpe, con total claridad. El shock y la revelación llegan juntos acá — no hay tiempo de prepararse para lo que se ve.' },
  'li-kan': { title: 'El abismo bajo el fuego', reading: 'Peligro real que, por fin, se ve con claridad total — ya no está oculto, ya no sorprende. Ver el riesgo entero no lo hace desaparecer, pero cambia completamente cómo se lo atraviesa.' },
  'li-gen': { title: 'La montaña bajo el fuego', reading: 'Algo firme y quieto que queda, al fin, completamente a la vista. El límite que se sostuvo en silencio durante tanto tiempo ahora se puede nombrar con claridad.' },
  'li-xun': { title: 'El viento bajo el fuego', reading: 'Algo gradual y suave que termina revelado, visible, después de moverse despacio durante mucho tiempo. Lo que penetra sin ruido también, tarde o temprano, sale a la luz.' },
  'li-li': { title: 'El fuego duplicado', reading: 'Claridad total, sin ninguna zona en sombra — todo se ve, todo se sabe, no queda nada oculto. Es luminosidad máxima, y como toda luz sin pausa, también puede encandilar en vez de solo mostrar.' },
  'li-dui': { title: 'El lago bajo el fuego', reading: 'Alegría genuina que se muestra entera, sin disimulo, a plena vista de todos. El placer que no necesita esconderse es, de las 64 combinaciones, una de las más livianas de sostener.' },

  // ===== UPPER: DUI (Lago) =====
  'dui-qian': { title: 'El cielo bajo el lago', reading: 'Fuerza pura que termina disfrutada, celebrada, en vez de solo ejercida. Lo más potente que tenés, cuando además te alegra usarlo, deja de sentirse como esfuerzo.' },
  'dui-kun': { title: 'La tierra bajo el lago', reading: 'Entrega total que termina encontrando, por fin, un motivo real de alegría. La pasividad sostenida durante tanto tiempo no fue en vano — algo bueno estaba esperando del otro lado.' },
  'dui-zhen': { title: 'El trueno bajo el lago', reading: 'Un impulso fuerte que termina, contra lo esperado, en algo placentero y liviano. El susto inicial no siempre anticipa el final — a veces lo que sacude también es, después, lo que alegra.' },
  'dui-kan': { title: 'El abismo bajo el lago', reading: 'Peligro real que convive, incómodamente, con algo de verdadera alegría cerca. No hay que fingir que el riesgo desapareció para poder disfrutar lo bueno que también está ahí.' },
  'dui-gen': { title: 'La montaña bajo el lago', reading: 'Algo firme y quieto que termina encontrando, al fin, un espacio de disfrute real. El límite más sostenido también necesita, en algún momento, un motivo para alegrarse de haber aguantado.' },
  'dui-xun': { title: 'El viento bajo el lago', reading: 'Algo gradual y suave que, de a poco, va encontrando más y más motivos de alegría genuina. El placer que se construye despacio suele ser el que menos se evapora.' },
  'dui-li': { title: 'El fuego bajo el lago', reading: 'Claridad total que, además de verse, se disfruta — no toda verdad revelada duele, esta se celebra. Ver con claridad y alegrarse de lo que se ve pueden pasar al mismo tiempo.' },
  'dui-dui': { title: 'El lago duplicado', reading: 'Alegría genuina sobre alegría genuina, sin ninguna sombra en el medio. Es el disfrute más puro de las 64 combinaciones — y, como toda cosa sin fricción, conviene no confundirlo con que ya no hace falta nada más.' },
}

export type Hexagram = {
  upper: TrigramId
  lower: TrigramId
  lines: boolean[] // 6, de abajo hacia arriba
  title: string
  reading: string
}

export function buildHexagram(lines: boolean[]): Hexagram {
  const lower = trigramFromLines([lines[0], lines[1], lines[2]])
  const upper = trigramFromLines([lines[3], lines[4], lines[5]])
  const key = `${upper.id}-${lower.id}` as Key
  const r = READINGS[key]
  return { upper: upper.id, lower: lower.id, lines, title: r.title, reading: r.reading }
}

export { TRIGRAMS, TRIGRAM_ORDER }
