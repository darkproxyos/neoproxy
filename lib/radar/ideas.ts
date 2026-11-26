// RADAR — catálogo de ideas para imprimir y vender, y el calendario comercial de Chile.
//
// No son cifras de mercado: son ideas con su lógica (por qué se vende, cuánto cuesta
// hacerla, si tienes derecho a venderla). La demanda real se valida con los enlaces de
// búsqueda (Mercado Libre, Etsy) y, cuando esté conectado, con los datos de la API.

export type Cat = 'neoproxy' | 'regalo' | 'decoracion' | 'funcional' | 'juego' | 'joyeria' | 'servicio' | 'b2b'
export type Derechos = 'propio' | 'generador' | 'encargo' | 'licencia'
export type TemporadaId = 'san-valentin' | 'clases' | 'madre' | 'padre' | 'nino' | 'patrias' | 'halloween' | 'black-friday' | 'navidad'

export type Idea = {
  id: string
  nombre: string
  cat: Cat
  material: 'PLA' | 'Resina' | 'PLA + resina'
  derechos: Derechos
  esfuerzo: 1 | 2 | 3 // 1 = se imprime y se entrega; 3 = armado, pintura o encargo
  valor: 1 | 2 | 3    // valor percibido (cuánto puede costar sin parecer caro)
  volumen: 1 | 2 | 3  // cuánto se puede repetir y vender en serie
  aprox: string       // material y tiempo aproximados
  temporadas: TemporadaId[]
  porque: string
  reel: string
  ojo?: string
  buscar: string      // búsqueda para validar precio y competencia
  ruta?: string       // generador propio en el sitio
}

export const CAT_LABEL: Record<Cat, string> = {
  neoproxy: 'NeoProxy (tuyo)', regalo: 'Regalo', decoracion: 'Decoración', funcional: 'Funcional', juego: 'Juego y fidget', joyeria: 'Joyería', servicio: 'Servicio', b2b: 'Para negocios',
}
export const DERECHOS_LABEL: Record<Derechos, string> = {
  propio: 'Diseño tuyo: vendible',
  generador: 'De tu generador: vendible',
  encargo: 'Encargo del cliente',
  licencia: 'Necesita licencia comercial',
}

export const IDEAS: Idea[] = [
  // ---- NeoProxy: diseños propios, sin problema de derechos ----
  { id: 'antesis', nombre: 'ANTESIS: flor de engranajes', cat: 'neoproxy', material: 'PLA + resina', derechos: 'generador', esfuerzo: 3, valor: 3, volumen: 2,
    aprox: '~60 g PLA + ~55 ml resina · 2 días con armado', temporadas: ['madre', 'navidad', 'san-valentin'],
    porque: 'Objeto cinético único, con número de semilla y verificación: se vende como pieza de autor, no como impresión.', reel: 'Gira uno, giran los 14 — y «comenta un número: esa es tu flor».',
    buscar: 'escultura cinetica engranajes', ruta: '/antesis' },
  { id: 'antesis-kit', nombre: 'Kit ANTESIS para armar', cat: 'neoproxy', material: 'PLA + resina', derechos: 'generador', esfuerzo: 2, valor: 2, volumen: 3,
    aprox: 'mismas piezas, sin armado ni pegado', temporadas: ['navidad', 'nino', 'padre'],
    porque: 'Más barato de producir (el armado lo hace el cliente) y es una experiencia: regalo para gente de ciencia y makers.', reel: 'Unboxing de 43 piezas → la flor girando en 60 s (timelapse del armado).',
    buscar: 'kit armable engranajes', ruta: '/antesis' },
  { id: 'anillo-semilla', nombre: 'Anillo con semilla (DROP)', cat: 'neoproxy', material: 'Resina', derechos: 'generador', esfuerzo: 1, valor: 2, volumen: 3,
    aprox: '1–3 ml de resina · se imprimen 10+ por placa', temporadas: ['san-valentin', 'madre', 'navidad'],
    porque: 'Material casi gratis, alto margen; cada anillo es único y reproducible por su semilla.', reel: 'Placa saliendo de la tina con 12 anillos distintos; «el tuyo es el número…».',
    buscar: 'anillo resina diseño', ruta: '/shop/drop01' },
  { id: 'colgante-especimen', nombre: 'Colgante ESPÉCIMEN único', cat: 'neoproxy', material: 'Resina', derechos: 'generador', esfuerzo: 1, valor: 2, volumen: 3,
    aprox: '2–4 ml de resina', temporadas: ['san-valentin', 'madre', 'navidad'],
    porque: 'Joyería generativa: nadie más tiene el mismo. Se puede numerar y certificar con QR.', reel: 'Rueda de especímenes que mutan → uno queda congelado en resina.',
    buscar: 'colgante geometrico resina', ruta: '/especimenes' },
  { id: 'rayo-lampara', nombre: 'RAYO en resina con base de luz', cat: 'neoproxy', material: 'PLA + resina', derechos: 'generador', esfuerzo: 2, valor: 3, volumen: 2,
    aprox: '~30 ml resina transparente + base PLA + tira LED', temporadas: ['padre', 'navidad'],
    porque: 'Lámpara de escritorio con historia científica (una descarga real calculada). Regalo de alto valor.', reel: 'La descarga crece en pantalla → corte a la pieza encendida en la oscuridad.',
    buscar: 'lampara led escritorio resina', ruta: '/rayo' },
  { id: 'capas', nombre: 'CAPAS: escultura del tiempo', cat: 'neoproxy', material: 'Resina', derechos: 'generador', esfuerzo: 2, valor: 3, volumen: 1,
    aprox: '~25 ml resina', temporadas: ['navidad'],
    porque: 'Arte para escritorio con un mundo pintado por el cliente: encargo personalizado y caro.', reel: 'El cliente pinta su mundo → la pieza impresa capa por capa.',
    buscar: 'escultura decorativa resina', ruta: '/capas' },
  { id: 'nombre-pieza', nombre: 'Nombre convertido en pieza', cat: 'neoproxy', material: 'Resina', derechos: 'generador', esfuerzo: 1, valor: 2, volumen: 3,
    aprox: '2–6 ml resina', temporadas: ['san-valentin', 'madre', 'navidad', 'nino'],
    porque: 'Personalización sin trabajo manual: el nombre es la semilla. Ideal para parejas y familias.', reel: '«Escribe tu nombre en los comentarios» → la pieza de cada uno.',
    buscar: 'regalo personalizado nombre 3d', ruta: '/especimenes' },

  // ---- Regalos personalizados ----
  { id: 'litofania', nombre: 'Litofanía con foto del cliente', cat: 'regalo', material: 'PLA', derechos: 'encargo', esfuerzo: 1, valor: 3, volumen: 3,
    aprox: '20–40 g PLA blanco · 3–5 h', temporadas: ['madre', 'padre', 'navidad', 'san-valentin'],
    porque: 'Con luz aparece la foto: emociona, es muy personal y el costo es mínimo. Clásico de fechas.', reel: 'Pieza blanca sin nada → se enciende la luz y aparece la foto.',
    ojo: 'Pide al cliente una foto con buen contraste; las oscuras salen planas.', buscar: 'litofania personalizada' },
  { id: 'lampara-litofania', nombre: 'Lámpara cilíndrica de litofanía', cat: 'regalo', material: 'PLA', derechos: 'encargo', esfuerzo: 2, valor: 3, volumen: 2,
    aprox: '60–100 g PLA + base con LED', temporadas: ['madre', 'navidad'],
    porque: 'Versión premium de la litofanía (varias fotos alrededor). Precio alto, mismo flujo.', reel: 'Gira la lámpara y pasan los recuerdos.',
    buscar: 'lampara litofania' },
  { id: 'llavero-nombre', nombre: 'Llaveros con nombre o logo', cat: 'regalo', material: 'PLA', derechos: 'encargo', esfuerzo: 1, valor: 1, volumen: 3,
    aprox: '3–6 g PLA · muchos por cama', temporadas: ['patrias', 'navidad', 'clases'],
    porque: 'Producto de entrada: barato, rápido, sirve para eventos, colegios y empresas (por cantidad).', reel: 'Timelapse de una cama llena de nombres de los seguidores.',
    buscar: 'llavero personalizado 3d' },
  { id: 'topografico', nombre: 'Relieve topográfico (cerros, volcanes, Torres del Paine)', cat: 'decoracion', material: 'PLA', derechos: 'propio', esfuerzo: 2, valor: 3, volumen: 2,
    aprox: '80–200 g PLA · 6–12 h', temporadas: ['padre', 'navidad'],
    porque: 'Muy chileno y con valor emocional (el cerro que subiste, tu volcán). Los datos de elevación son públicos.', reel: 'El mapa plano se levanta en 3D → la pieza en la mano con luz rasante.',
    ojo: 'Usa datos de elevación de dominio público (SRTM) y di de dónde salen.', buscar: 'mapa relieve 3d' },
  { id: 'skyline', nombre: 'Mapa de tu barrio o ciudad en relieve', cat: 'decoracion', material: 'PLA', derechos: 'propio', esfuerzo: 2, valor: 3, volumen: 2,
    aprox: '60–150 g PLA', temporadas: ['padre', 'navidad'],
    porque: 'Regalo de mudanza, aniversario o «donde nos conocimos». Se hace a pedido desde un mapa abierto.', reel: '«¿Dónde se conocieron?» → el mapa de ese lugar impreso.',
    ojo: 'OpenStreetMap permite uso comercial si citas la fuente (licencia ODbL).', buscar: 'mapa ciudad 3d personalizado' },
  { id: 'jarron-voz', nombre: 'Jarrón con la forma de una voz', cat: 'regalo', material: 'PLA', derechos: 'propio', esfuerzo: 2, valor: 3, volumen: 2,
    aprox: '80–150 g PLA modo jarrón · 4–8 h', temporadas: ['madre', 'san-valentin'],
    porque: 'Un «te quiero» grabado se convierte en la superficie del jarrón: único y con historia.', reel: 'Audio de la frase → la onda envolviendo el jarrón mientras se imprime.',
    buscar: 'jarron personalizado regalo' },

  // ---- Decoración ----
  { id: 'macetero', nombre: 'Maceteros geométricos (y de autorriego)', cat: 'decoracion', material: 'PLA', derechos: 'propio', esfuerzo: 1, valor: 2, volumen: 3,
    aprox: '40–120 g PLA · 3–8 h', temporadas: ['madre', 'clases'],
    porque: 'Siempre se buscan, se ven bien en fotos y el modo jarrón los hace rápidos. Diseño propio = sin licencias.', reel: 'Planta pasando de macetero feo a uno impreso; timelapse del modo jarrón.',
    buscar: 'macetero geometrico 3d' },
  { id: 'pantalla-lampara', nombre: 'Pantallas de lámpara con patrón', cat: 'decoracion', material: 'PLA', derechos: 'propio', esfuerzo: 2, valor: 3, volumen: 2,
    aprox: '80–200 g PLA', temporadas: ['navidad', 'madre'],
    porque: 'La luz proyecta el patrón en la pared: decoración de alto valor percibido.', reel: 'Se apaga la luz de la pieza y la pared se llena de sombras.',
    buscar: 'lampara impresa 3d diseño' },
  { id: 'adornos-navidad', nombre: 'Adornos de Navidad únicos (copos por semilla)', cat: 'decoracion', material: 'PLA', derechos: 'propio', esfuerzo: 1, valor: 2, volumen: 3,
    aprox: '3–10 g PLA c/u', temporadas: ['navidad'],
    porque: 'Venta por set y por cantidad; cada copo distinto. Fecha que se repite todos los años.', reel: '«No hay dos copos iguales: este es el número…»',
    buscar: 'adornos navidad 3d' },
  { id: 'halloween', nombre: 'Decoración de Halloween articulada', cat: 'decoracion', material: 'PLA', derechos: 'propio', esfuerzo: 1, valor: 1, volumen: 3,
    aprox: '20–60 g PLA', temporadas: ['halloween'],
    porque: 'Calaveras, arañas y murciélagos articulados se venden solos en octubre.', reel: 'La araña articulada moviéndose sobre la mano.',
    ojo: 'Muchos modelos populares son «no comercial»: diseña el tuyo o compra licencia.', buscar: 'decoracion halloween 3d' },
  { id: 'patrias', nombre: 'Fiestas Patrias: trompos, emboques y estrellas', cat: 'decoracion', material: 'PLA', derechos: 'propio', esfuerzo: 1, valor: 1, volumen: 3,
    aprox: '10–40 g PLA', temporadas: ['patrias'],
    porque: 'Juegos típicos y decoración tricolor: venta por volumen a colegios y negocios en septiembre.', reel: 'Trompo impreso bailando; «hecho en Chile, capa por capa».',
    buscar: 'trompo emboque fiestas patrias' },

  // ---- Funcional ----
  { id: 'organizador', nombre: 'Organizadores modulares de escritorio', cat: 'funcional', material: 'PLA', derechos: 'propio', esfuerzo: 1, valor: 2, volumen: 3,
    aprox: '50–150 g PLA', temporadas: ['clases'],
    porque: 'Útil, se repite y se vende a oficinas. Un sistema modular hace que vuelvan por más piezas.', reel: 'Escritorio caótico → ordenado en 15 s.',
    buscar: 'organizador escritorio 3d' },
  { id: 'soportes', nombre: 'Soportes: audífonos, control, celular, Switch', cat: 'funcional', material: 'PLA', derechos: 'propio', esfuerzo: 1, valor: 2, volumen: 3,
    aprox: '40–120 g PLA', temporadas: ['padre', 'navidad', 'nino'],
    porque: 'Regalo fácil para gamers y oficina; se personaliza con nombre.', reel: 'Antes/después del setup gamer.',
    ojo: 'No uses logos de marcas (PlayStation, Nintendo) sin permiso.', buscar: 'soporte audifonos 3d' },
  { id: 'repuestos', nombre: 'Repuestos a pedido (perillas, clips, piezas rotas)', cat: 'servicio', material: 'PLA', derechos: 'encargo', esfuerzo: 2, valor: 2, volumen: 2,
    aprox: 'pocas g · el trabajo es medir y modelar', temporadas: [],
    porque: 'El cliente paga por resolver un problema, no por el plástico: buen margen por hora y clientes que vuelven.', reel: '«Se rompió y no venden el repuesto» → pieza medida, impresa y funcionando.',
    ojo: 'Cobra el modelado aparte; no prometas resistencia de pieza original.', buscar: 'repuesto impresion 3d' },
  { id: 'mascotas', nombre: 'Para mascotas: placas con nombre, comederos', cat: 'funcional', material: 'PLA', derechos: 'propio', esfuerzo: 1, valor: 2, volumen: 3,
    aprox: '10–150 g PLA', temporadas: ['navidad'],
    porque: 'Los dueños de mascotas gastan en personalizado; placa con nombre es rápida y barata.', reel: 'El perro con su placa nueva.',
    ojo: 'No uses PLA para objetos que la mascota muerda o para agua caliente.', buscar: 'placa mascota personalizada' },

  // ---- Juegos y fidgets ----
  { id: 'fidget-engranaje', nombre: 'Fidget de engranajes (de la matemática de ANTESIS)', cat: 'juego', material: 'PLA', derechos: 'generador', esfuerzo: 1, valor: 2, volumen: 3,
    aprox: '15–30 g PLA', temporadas: ['nino', 'navidad', 'clases'],
    porque: 'Juguete de escritorio que gira; diseño tuyo y verificable. Precio de impulso.', reel: 'ASMR de engranajes girando entre los dedos.',
    buscar: 'fidget engranajes', ruta: '/antesis' },
  { id: 'articulados', nombre: 'Animales articulados (dragón, pulpo, axolote)', cat: 'juego', material: 'PLA', derechos: 'licencia', esfuerzo: 1, valor: 2, volumen: 3,
    aprox: '20–80 g PLA · se imprimen ya articulados', temporadas: ['nino', 'navidad', 'halloween'],
    porque: 'Se venden muchísimo en ferias y Mercado Libre; se imprimen sin armar.', reel: 'El dragón «caminando» por el brazo.',
    ojo: 'Los más famosos son «no comercial». Compra la licencia comercial al diseñador o diseña los tuyos.', buscar: 'dragon articulado 3d' },
  { id: 'miniaturas', nombre: 'Miniaturas para rol y juegos de mesa', cat: 'juego', material: 'Resina', derechos: 'licencia', esfuerzo: 2, valor: 2, volumen: 2,
    aprox: '2–10 ml resina c/u', temporadas: ['navidad'],
    porque: 'La resina se luce en el detalle; comunidad fiel que compra seguido.', reel: 'Miniatura saliendo de la tina → pintada.',
    ojo: 'Usa modelos con licencia de venta de impresiones (muchos diseñadores la venden por suscripción). Nada de personajes con marca.', buscar: 'miniatura rol resina' },
  { id: 'dados', nombre: 'Dados de rol en resina', cat: 'juego', material: 'Resina', derechos: 'propio', esfuerzo: 2, valor: 2, volumen: 2,
    aprox: '5–10 ml resina por set', temporadas: ['navidad'],
    porque: 'Sets temáticos (NeoProxy, cyberpunk) para jugadores; se venden como colección.', reel: 'Tirada de dados nuevos sobre la mesa en cámara lenta.',
    ojo: 'Revisa que estén equilibrados si se venden para jugar en serio.', buscar: 'dados rol resina' },

  // ---- Joyería ----
  { id: 'aros', nombre: 'Aros geométricos livianos', cat: 'joyeria', material: 'Resina', derechos: 'propio', esfuerzo: 1, valor: 2, volumen: 3,
    aprox: '1–2 ml resina por par', temporadas: ['san-valentin', 'madre'],
    porque: 'Formas imposibles a mano (Voronoi, superficies mínimas) a costo casi cero.', reel: 'Primer plano del aro girando con luz; «diseñado por una ecuación».',
    ojo: 'Usa ganchos hipoalergénicos; la resina debe estar bien curada.', buscar: 'aros geometricos', ruta: '/geometrias' },

  // ---- Para negocios ----
  { id: 'nfc-tarjeta', nombre: 'Llavero o placa NFC: tarjeta de presentación', cat: 'b2b', material: 'PLA', derechos: 'propio', esfuerzo: 1, valor: 2, volumen: 3,
    aprox: '5–15 g PLA + tag NFC', temporadas: ['clases'],
    porque: 'Acercas el celular y abre el Instagram o el WhatsApp del negocio. Pedidos por cantidad para emprendedores.', reel: 'Celular sobre el llavero → se abre el perfil.',
    buscar: 'tarjeta nfc instagram' },
  { id: 'logos', nombre: 'Logos 3D y señalética para emprendimientos', cat: 'b2b', material: 'PLA', derechos: 'encargo', esfuerzo: 2, valor: 3, volumen: 2,
    aprox: '50–300 g PLA', temporadas: [],
    porque: 'Un negocio paga más que un particular y repite (sucursales, eventos).', reel: 'El logo plano → letrero en la pared del local.',
    buscar: 'logo 3d letrero negocio' },
  { id: 'souvenirs', nombre: 'Recuerdos para eventos (matrimonios, cumpleaños, empresas)', cat: 'b2b', material: 'PLA', derechos: 'encargo', esfuerzo: 2, valor: 2, volumen: 3,
    aprox: '5–20 g PLA c/u · por 50–200 unidades', temporadas: [],
    porque: 'Un pedido = muchas unidades iguales: la impresora trabaja sola y el margen por pedido es grande.', reel: 'Cama llena de 100 recuerdos con el nombre de los novios.',
    buscar: 'recuerdos matrimonio personalizados' },
]

// ---------------------------------------------------------------------------------
// Calendario comercial (Chile)

export type Temporada = { id: TemporadaId; nombre: string; fecha: Date; dias: number; empezar: Date; estado: 'ahora' | 'prepara' | 'despues' }

const nthSunday = (y: number, month: number, n: number) => {
  const d = new Date(Date.UTC(y, month, 1))
  const first = (7 - d.getUTCDay()) % 7 // días hasta el primer domingo
  return new Date(Date.UTC(y, month, 1 + first + 7 * (n - 1)))
}
const blackFriday = (y: number) => {
  const d = new Date(Date.UTC(y, 10, 1))
  const firstThu = (4 - d.getUTCDay() + 7) % 7
  return new Date(Date.UTC(y, 10, 1 + firstThu + 21 + 1)) // cuarto jueves + 1
}
const FECHAS: { id: TemporadaId; nombre: string; f: (y: number) => Date }[] = [
  { id: 'san-valentin', nombre: 'San Valentín', f: (y) => new Date(Date.UTC(y, 1, 14)) },
  { id: 'clases', nombre: 'Vuelta a clases', f: (y) => new Date(Date.UTC(y, 2, 1)) },
  { id: 'madre', nombre: 'Día de la Madre', f: (y) => nthSunday(y, 4, 2) },
  { id: 'padre', nombre: 'Día del Padre', f: (y) => nthSunday(y, 5, 3) },
  { id: 'nino', nombre: 'Día del Niño', f: (y) => nthSunday(y, 7, 2) },
  { id: 'patrias', nombre: 'Fiestas Patrias', f: (y) => new Date(Date.UTC(y, 8, 18)) },
  { id: 'halloween', nombre: 'Halloween', f: (y) => new Date(Date.UTC(y, 9, 31)) },
  { id: 'black-friday', nombre: 'Black Friday', f: blackFriday },
  { id: 'navidad', nombre: 'Navidad', f: (y) => new Date(Date.UTC(y, 11, 25)) },
]
export const TEMPORADA_NOMBRE: Record<TemporadaId, string> = Object.fromEntries(FECHAS.map((f) => [f.id, f.nombre])) as Record<TemporadaId, string>
export const LEAD_DAYS = 28 // producir, fotografiar y publicar con tiempo

export function calendario(hoy = new Date()): Temporada[] {
  const t0 = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  return FECHAS.map((f) => {
    let fecha = f.f(hoy.getFullYear())
    if (fecha.getTime() < t0) fecha = f.f(hoy.getFullYear() + 1)
    const dias = Math.round((fecha.getTime() - t0) / 86400000)
    const empezar = new Date(fecha.getTime() - LEAD_DAYS * 86400000)
    const estado: Temporada['estado'] = dias <= LEAD_DAYS ? 'ahora' : dias <= LEAD_DAYS + 30 ? 'prepara' : 'despues'
    return { id: f.id, nombre: f.nombre, fecha, dias, empezar, estado }
  }).sort((a, b) => a.dias - b.dias)
}

// Puntaje de oportunidad (0–100): valor y volumen suman, el esfuerzo resta, los derechos
// propios suman, y una fecha cercana en la que se vende empuja la idea arriba.
export function puntaje(i: Idea, cal: Temporada[]): { total: number; fecha?: Temporada } {
  const der = { propio: 14, generador: 16, encargo: 10, licencia: 3 }[i.derechos]
  let total = i.valor * 12 + i.volumen * 9 + (4 - i.esfuerzo) * 6 + der
  const prox = cal.filter((t) => i.temporadas.includes(t.id) && t.dias <= 70).sort((a, b) => a.dias - b.dias)[0]
  if (prox) total += prox.dias <= LEAD_DAYS ? 16 : 9
  return { total: Math.min(100, Math.round((total / 104) * 100)), fecha: prox }
}

const slug = (q: string) => q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const enlaces = (q: string) => ({
  mercadoLibre: `https://listado.mercadolibre.cl/${slug(q)}`,
  etsy: `https://www.etsy.com/search?q=${encodeURIComponent(q)}`,
  printables: `https://www.printables.com/search/models?q=${encodeURIComponent(q)}`,
  thingiverse: `https://www.thingiverse.com/search?q=${encodeURIComponent(q)}&type=things`,
  makerworld: `https://makerworld.com/en/search/models?keyword=${encodeURIComponent(q)}`,
  cults: `https://cults3d.com/en/search?q=${encodeURIComponent(q)}`,
})

// Licencias: ¿se puede vender la impresión?
export function vendible(licencia: string | undefined | null): 'si' | 'no' | 'revisar' {
  if (!licencia) return 'revisar'
  const l = licencia.toLowerCase()
  if (/non[- ]?commercial|noncommercial|\bnc\b|all rights reserved|personal use|standard digital file/.test(l)) return 'no'
  if (/public domain|cc0|creative commons|attribution|gnu|gpl|bsd|mit/.test(l)) return 'si'
  return 'revisar'
}
