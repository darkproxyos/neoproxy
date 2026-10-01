export type GalleryCategory = {
  id: string
  label: string
  color: string
  blurb: string
}

export type GalleryMedia =
  | { type: 'image'; src: string }
  | { type: 'video'; src: string; poster: string }

export type GalleryPiece = {
  id: string
  category: string
  title: string
  media: GalleryMedia
  material: string
  note: string
}

export const categories: GalleryCategory[] = [
  {
    id: 'oni',
    label: 'ONI_&_HANNYA',
    color: '#cc0000',
    blurb: 'Máscaras. La serie más repetida del taller — cada resina es la misma pregunta hecha de nuevo.',
  },
  {
    id: 'criaturas',
    label: 'CRIATURAS',
    color: '#00ff9d',
    blurb: 'Lo que no es humano ni quiere serlo. Esqueletos, dragones, bucles — geometría orgánica sin disculpa.',
  },
  {
    id: 'figuras',
    label: 'FIGURAS_&_BUSTOS',
    color: '#5f95c9',
    blurb: 'El cuerpo como referencia: clásico y cibernético compartiendo el mismo soporte.',
  },
  {
    id: 'artefactos',
    label: 'ARTEFACTOS',
    color: '#b400ff',
    blurb: 'Piezas sueltas que no encajan en ninguna categoría y por eso importan.',
  },
]

export const pieces: GalleryPiece[] = [
  {
    id: 'oni-01',
    category: 'oni',
    title: 'NP-ONI-01 // Trío_sin_pintar',
    media: { type: 'image', src: '/gallery/oni-01.jpg' },
    material: 'Resina UV',
    note: 'Tres variantes del mismo molde, antes del color. El estado en que más se parecen entre sí.',
  },
  {
    id: 'oni-02',
    category: 'oni',
    title: 'NP-ONI-02 // Carmesí',
    media: { type: 'image', src: '/gallery/oni-02.jpg' },
    material: 'Resina UV, acabado glossy',
    note: 'Cuernos negros, gema frontal, colmillos blancos. La versión que sí se terminó de pintar.',
  },
  {
    id: 'oni-03',
    category: 'oni',
    title: 'NP-ONI-03 // Colección',
    media: { type: 'image', src: '/gallery/oni-03.jpg' },
    material: 'Resina UV',
    note: 'Nueve variantes de tamaño y estilo sobre la mesa. Al borde del cuadro, algo más — todavía sin nombre.',
  },
  {
    id: 'oni-04',
    category: 'oni',
    title: 'NP-ONI-04 // Ojos_de_reptil',
    media: { type: 'image', src: '/gallery/oni-04.jpg' },
    material: 'Resina UV, acabado glossy',
    note: 'Pupila rasgada, verde sobre rojo. La máscara que dejó de ser solo oni.',
  },
  {
    id: 'oni-05',
    category: 'oni',
    title: 'NP-ONI-05 // Enmarcada',
    media: { type: 'image', src: '/gallery/oni-05.jpg' },
    material: 'Resina UV + madera + soga',
    note: 'La única pieza que salió del taller como objeto de pared, con kanji pintado a mano.',
  },
  {
    id: 'oni-06',
    category: 'oni',
    title: 'NP-ONI-06 // Detalle',
    media: { type: 'image', src: '/gallery/oni-06.jpg' },
    material: 'Resina UV, acabado glossy',
    note: 'Primer plano. La misma cara roja, otra vez, porque todavía no está resuelta.',
  },
  {
    id: 'oni-07',
    category: 'oni',
    title: 'NP-ONI-07 // Cuernos_en_la_sombra',
    media: { type: 'video', src: '/gallery/oni-07.mp4', poster: '/gallery/oni-07-poster.jpg' },
    material: 'Resina UV, acabado glossy',
    note: 'Giro de cámara sobre la misma cara roja, esta vez con fondo de estrella verde. El detalle que la foto fija no alcanza a mostrar.',
  },
  {
    id: 'oni-08',
    category: 'oni',
    title: 'NP-ONI-08 // Luz_roja',
    media: { type: 'video', src: '/gallery/oni-08.mp4', poster: '/gallery/oni-08-poster.jpg' },
    material: 'Resina UV sin pintar',
    note: 'Bajo luz roja el blanco sin pintar deja de ser neutro. La iluminación también es parte de la pieza.',
  },
  {
    id: 'oni-09',
    category: 'oni',
    title: 'NP-ONI-09 // Azul',
    media: { type: 'video', src: '/gallery/oni-09.mp4', poster: '/gallery/oni-09-poster.jpg' },
    material: 'Resina UV',
    note: 'Mismo tallado, otra sesión de luz. Se lee distinto bajo azul que bajo rojo.',
  },
  {
    id: 'oni-10',
    category: 'oni',
    title: 'NP-ONI-10 // Primer_clip',
    media: { type: 'video', src: '/gallery/oni-10.mp4', poster: '/gallery/oni-10-poster.jpg' },
    material: 'Resina UV, acabado oscuro',
    note: 'El primer video con marca propia en pantalla. _neoproxy_ dejó de ser solo un nombre de usuario.',
  },
  {
    id: 'oni-11',
    category: 'oni',
    title: 'NP-ONI-11 // Dos_tonos',
    media: { type: 'video', src: '/gallery/oni-11.mp4', poster: '/gallery/oni-11-poster.jpg' },
    material: 'Resina, bicolor blanco/negro',
    note: 'Blanco arriba, negro abajo, todavía sin unificar. El pintado detenido a la mitad.',
  },
  {
    id: 'oni-12',
    category: 'oni',
    title: 'NP-ONI-12 // Miniatura',
    media: { type: 'video', src: '/gallery/oni-12.mp4', poster: '/gallery/oni-12-poster.jpg' },
    material: 'Resina UV, policromada',
    note: 'Versión de bolsillo, a color. La misma cara, resuelta en otra escala.',
  },
  {
    id: 'oni-13',
    category: 'oni',
    title: 'NP-ONI-13 // Puesta',
    media: { type: 'video', src: '/gallery/oni-13.mp4', poster: '/gallery/oni-13-poster.jpg' },
    material: 'Resina UV + textil',
    note: 'La única pieza del taller que se vio puesta, no solo exhibida. Entre las hojas, deja de ser objeto.',
  },
  {
    id: 'criatura-01',
    category: 'criaturas',
    title: 'NP-CRT-01 // Esqueleto',
    media: { type: 'image', src: '/gallery/criatura-01.jpg' },
    material: 'Resina UV translúcida',
    note: 'Brazos abiertos, costillar visible. Sostenida en mano para que se note la escala.',
  },
  {
    id: 'criatura-02',
    category: 'criaturas',
    title: 'NP-CRT-02 // Tallado',
    media: { type: 'image', src: '/gallery/criatura-02.jpg' },
    material: 'Resina UV',
    note: 'Cabeza demoníaca con patrones de circuito tallados en los cuernos. En blanco y negro porque el color distraía.',
  },
  {
    id: 'criatura-03',
    category: 'criaturas',
    title: 'NP-CRT-03 // Verde',
    media: { type: 'image', src: '/gallery/criatura-03.jpg' },
    material: 'Resina UV translúcida',
    note: 'Misma familia de talla que NP-CRT-02, en resina verde que deja pasar la luz.',
  },
  {
    id: 'criatura-04',
    category: 'criaturas',
    title: 'NP-CRT-04 // Ouroboros',
    media: { type: 'image', src: '/gallery/criatura-04.jpg' },
    material: 'Resina UV translúcida',
    note: 'Dragón enroscado atravesando un cubo alámbrico. Lo más cerca que el taller llegó a una metáfora explícita.',
  },
  {
    id: 'criatura-05',
    category: 'criaturas',
    title: 'NP-CRT-05 // Busto_verde',
    media: { type: 'video', src: '/gallery/criatura-05.mp4', poster: '/gallery/criatura-05-poster.jpg' },
    material: 'Resina UV, acabado glossy',
    note: 'Pequeño, glossy, sin nombre todavía. No es humano ni oni — está en el medio.',
  },
  {
    id: 'criatura-06',
    category: 'criaturas',
    title: 'NP-CRT-06 // Textura',
    media: { type: 'video', src: '/gallery/criatura-06.mp4', poster: '/gallery/criatura-06-poster.jpg' },
    material: 'Resina UV translúcida, sin pulir',
    note: 'Las púas quedan como salieron del molde, a propósito. No todo se lija.',
  },
  {
    id: 'criatura-07',
    category: 'criaturas',
    title: 'NP-CRT-07 // Enjambre',
    media: { type: 'video', src: '/gallery/criatura-07.mp4', poster: '/gallery/criatura-07-poster.jpg' },
    material: 'Resina UV translúcida',
    note: 'Cinco cabezas de la misma talla, dispersas sobre una nebulosa de pantalla. El taller visto como constelación.',
  },
  {
    id: 'criatura-08',
    category: 'criaturas',
    title: 'NP-CRT-08 // Cúmulo',
    media: { type: 'video', src: '/gallery/criatura-08.mp4', poster: '/gallery/criatura-08-poster.jpg' },
    material: 'Resina UV translúcida',
    note: 'Cristal violeta y verde bajo luz UV. Más mineral que criatura, pero viene de la misma familia de molde.',
  },
  {
    id: 'figura-01',
    category: 'figuras',
    title: 'NP-FIG-01 // David',
    media: { type: 'image', src: '/gallery/figura-01.jpg' },
    material: 'Resina, acabado mate',
    note: 'Réplica directa. El canon más viejo del taller, sin ironía.',
  },
  {
    id: 'figura-02',
    category: 'figuras',
    title: 'NP-FIG-02 // Busto_cibernético',
    media: { type: 'image', src: '/gallery/figura-02.jpg' },
    material: 'Resina UV, acabado glossy',
    note: 'Cable enroscado en el brazo, retroiluminación violeta. El cuerpo clásico pasado por el mismo filtro que todo lo demás acá.',
  },
  {
    id: 'figura-03',
    category: 'figuras',
    title: 'NP-FIG-03 // Bajo_UV',
    media: { type: 'video', src: '/gallery/figura-03.mp4', poster: '/gallery/figura-03-poster.jpg' },
    material: 'Resina UV, acabado metálico',
    note: 'El mismo busto cibernético de NP-FIG-02, ahora bajo luz violeta. Cambia el material percibido, no la pose.',
  },
  {
    id: 'figura-04',
    category: 'figuras',
    title: 'NP-FIG-04 // Máscara_mecánica',
    media: { type: 'video', src: '/gallery/figura-04.mp4', poster: '/gallery/figura-04-poster.jpg' },
    material: 'Resina, acabado mate',
    note: 'Mitad rostro, mitad circuito. Sostenida en mano contra una pared que no tiene nada que ver con el taller.',
  },
  {
    id: 'artefacto-01',
    category: 'artefactos',
    title: 'NP-ART-01 // Meditación',
    media: { type: 'image', src: '/gallery/artefacto-01.jpg' },
    material: 'Filamento FDM',
    note: 'Fotografiada de noche sobre un riel de tranvía. Las líneas de capa quedan a la vista — no se ocultan.',
  },
  {
    id: 'artefacto-02',
    category: 'artefactos',
    title: 'NP-ART-02 // Hogwarts',
    media: { type: 'image', src: '/gallery/artefacto-02.jpg' },
    material: 'Resina acrílica translúcida',
    note: 'Encargo de franquicia. Queda en el catálogo como prueba de que el taller también hace eso.',
  },
  {
    id: 'artefacto-03',
    category: 'artefactos',
    title: 'NP-ART-03 // Hoja',
    media: { type: 'video', src: '/gallery/artefacto-03.mp4', poster: '/gallery/artefacto-03-poster.jpg' },
    material: 'Resina UV, acabado oscuro',
    note: 'Lo único filoso del catálogo. Una hoja negra, en blanco y negro, sin más contexto que la mano que la sostiene.',
  },
  {
    id: 'artefacto-04',
    category: 'artefactos',
    title: 'NP-ART-04 // Cadena',
    media: { type: 'video', src: '/gallery/artefacto-04.mp4', poster: '/gallery/artefacto-04-poster.jpg' },
    material: 'Metal + resina',
    note: 'Metal y resina juntos, sin ensamblar todavía. Una pieza que todavía no decide si es joya o herramienta.',
  },
  {
    id: 'artefacto-05',
    category: 'artefactos',
    title: 'NP-ART-05 // Nocturna',
    media: { type: 'video', src: '/gallery/artefacto-05.mp4', poster: '/gallery/artefacto-05-poster.jpg' },
    material: 'Resina UV',
    note: 'Misma sesión de calle que NP-ART-01. Esta vez el objeto casi no se distingue del fondo — y eso también es parte del registro.',
  },
]
