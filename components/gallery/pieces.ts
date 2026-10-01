export type GalleryCategory = {
  id: string
  label: string
  color: string
  blurb: string
}

export type GalleryPiece = {
  id: string
  category: string
  title: string
  src: string
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
    src: '/gallery/oni-01.jpg',
    material: 'Resina UV',
    note: 'Tres variantes del mismo molde, antes del color. El estado en que más se parecen entre sí.',
  },
  {
    id: 'oni-02',
    category: 'oni',
    title: 'NP-ONI-02 // Carmesí',
    src: '/gallery/oni-02.jpg',
    material: 'Resina UV, acabado glossy',
    note: 'Cuernos negros, gema frontal, colmillos blancos. La versión que sí se terminó de pintar.',
  },
  {
    id: 'oni-03',
    category: 'oni',
    title: 'NP-ONI-03 // Colección',
    src: '/gallery/oni-03.jpg',
    material: 'Resina UV',
    note: 'Nueve variantes de tamaño y estilo sobre la mesa. Al borde del cuadro, algo más — todavía sin nombre.',
  },
  {
    id: 'oni-04',
    category: 'oni',
    title: 'NP-ONI-04 // Ojos_de_reptil',
    src: '/gallery/oni-04.jpg',
    material: 'Resina UV, acabado glossy',
    note: 'Pupila rasgada, verde sobre rojo. La máscara que dejó de ser solo oni.',
  },
  {
    id: 'oni-05',
    category: 'oni',
    title: 'NP-ONI-05 // Enmarcada',
    src: '/gallery/oni-05.jpg',
    material: 'Resina UV + madera + soga',
    note: 'La única pieza que salió del taller como objeto de pared, con kanji pintado a mano.',
  },
  {
    id: 'oni-06',
    category: 'oni',
    title: 'NP-ONI-06 // Detalle',
    src: '/gallery/oni-06.jpg',
    material: 'Resina UV, acabado glossy',
    note: 'Primer plano. La misma cara roja, otra vez, porque todavía no está resuelta.',
  },
  {
    id: 'criatura-01',
    category: 'criaturas',
    title: 'NP-CRT-01 // Esqueleto',
    src: '/gallery/criatura-01.jpg',
    material: 'Resina UV translúcida',
    note: 'Brazos abiertos, costillar visible. Sostenida en mano para que se note la escala.',
  },
  {
    id: 'criatura-02',
    category: 'criaturas',
    title: 'NP-CRT-02 // Tallado',
    src: '/gallery/criatura-02.jpg',
    material: 'Resina UV',
    note: 'Cabeza demoníaca con patrones de circuito tallados en los cuernos. En blanco y negro porque el color distraía.',
  },
  {
    id: 'criatura-03',
    category: 'criaturas',
    title: 'NP-CRT-03 // Verde',
    src: '/gallery/criatura-03.jpg',
    material: 'Resina UV translúcida',
    note: 'Misma familia de talla que NP-CRT-02, en resina verde que deja pasar la luz.',
  },
  {
    id: 'criatura-04',
    category: 'criaturas',
    title: 'NP-CRT-04 // Ouroboros',
    src: '/gallery/criatura-04.jpg',
    material: 'Resina UV translúcida',
    note: 'Dragón enroscado atravesando un cubo alámbrico. Lo más cerca que el taller llegó a una metáfora explícita.',
  },
  {
    id: 'figura-01',
    category: 'figuras',
    title: 'NP-FIG-01 // David',
    src: '/gallery/figura-01.jpg',
    material: 'Resina, acabado mate',
    note: 'Réplica directa. El canon más viejo del taller, sin ironía.',
  },
  {
    id: 'figura-02',
    category: 'figuras',
    title: 'NP-FIG-02 // Busto_cibernético',
    src: '/gallery/figura-02.jpg',
    material: 'Resina UV, acabado glossy',
    note: 'Cable enroscado en el brazo, retroiluminación violeta. El cuerpo clásico pasado por el mismo filtro que todo lo demás acá.',
  },
  {
    id: 'artefacto-01',
    category: 'artefactos',
    title: 'NP-ART-01 // Meditación',
    src: '/gallery/artefacto-01.jpg',
    material: 'Filamento FDM',
    note: 'Fotografiada de noche sobre un riel de tranvía. Las líneas de capa quedan a la vista — no se ocultan.',
  },
  {
    id: 'artefacto-02',
    category: 'artefactos',
    title: 'NP-ART-02 // Hogwarts',
    src: '/gallery/artefacto-02.jpg',
    material: 'Resina acrílica translúcida',
    note: 'Encargo de franquicia. Queda en el catálogo como prueba de que el taller también hace eso.',
  },
]
