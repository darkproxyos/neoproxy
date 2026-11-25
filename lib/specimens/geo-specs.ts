// Catálogo de GEOMETRÍAS: textos y controles de cada familia exacta.
// Los controles escriben en `Genome.o` (parámetros fijados a mano).

import type { GeometryFamily, Params } from './families'

export type Opt = { v: string | number; label: string }
type Only = (p: Params) => boolean
export type Control =
  | { kind: 'range'; key: string; label: string; min: number; max: number; step: number; int?: boolean; only?: Only }
  | { kind: 'select'; key: string; label: string; options: Opt[]; only?: Only }
  | { kind: 'text'; key: string; label: string }
  | { kind: 'virtual'; id: string; label: string; min: number; max: number; step: number; int?: boolean; read: (p: Params) => number; write: (p: Params, v: number) => Params; only?: Only }

export type GeoSpec = { title: string; tagline: string; concept: string; credit: string; note: string; controls: Control[] }

const arrAt = (key: string, i: number, label: string): Control => ({
  kind: 'virtual', id: `${key}${i}`, label, min: 0, max: 6.28, step: 0.05,
  read: (p) => (p[key] as number[])[i],
  write: (p, v) => { const a = [...(p[key] as number[])]; a[i] = v; return { [key]: a } },
})
const term = (i: number, field: 0 | 1 | 2 | 3) => ({
  read: (p: Params) => ((p.terms as number[])[i * 4 + field] ?? 0),
  write: (p: Params, v: number) => {
    const t = [...(p.terms as number[])]
    while (t.length < (i + 1) * 4) t.push(3, 1, 0, 0)
    t[i * 4 + field] = v
    // n, l y m deben seguir siendo un estado válido: l < n y |m| <= l
    const n = t[i * 4], l = Math.min(t[i * 4 + 1], n - 1), m = Math.max(-l, Math.min(l, t[i * 4 + 2]))
    t[i * 4 + 1] = l; t[i * 4 + 2] = m
    return { terms: t }
  },
})

export const GEO: Record<GeometryFamily, GeoSpec> = {
  crystal: {
    title: 'CRISTALES', tagline: 'Hábito y racimo',
    concept: 'Un cristal es lo que queda cuando algunas caras crecen más rápido que otras. Aquí cada forma es un juego de planos cuyas normales salen de la simetría del sistema cristalino; las distancias fijan el hábito (columnar, tabular, equidimensional). Los racimos nacen de una base, como en un geoda.',
    credit: 'Cristalografía clásica: sistemas cristalinos y hábitos (Haüy, siglo XVIII).',
    note: 'Es un modelo geométrico de hábitos, no una simulación de crecimiento. En resina transparente se ve como una piedra.',
    controls: [
      { kind: 'select', key: 'system', label: 'Sistema', options: [{ v: 'cubic', label: 'Cúbico' }, { v: 'hexagonal', label: 'Hexagonal' }, { v: 'tetragonal', label: 'Tetragonal' }, { v: 'trigonal', label: 'Trigonal' }] },
      { kind: 'range', key: 'elong', label: 'Elongación', min: 0.6, max: 3, step: 0.05 },
      { kind: 'select', key: 'count', label: 'Cristales', options: [1, 3, 5, 7, 9].map((v) => ({ v, label: String(v) })) },
      { kind: 'range', key: 'spread', label: 'Apertura del racimo', min: 0.1, max: 0.8, step: 0.02 },
      { kind: 'range', key: 'tiltMax', label: 'Inclinación', min: 0, max: 0.95, step: 0.02 },
      { kind: 'range', key: 'sizeVar', label: 'Variación de tamaño', min: 0, max: 0.7, step: 0.02 },
      { kind: 'select', key: 'plate', label: 'Base', options: [{ v: 1, label: 'Con placa' }, { v: 0, label: 'Sin placa' }] },
    ],
  },
  radiolarian: {
    title: 'RADIOLARIOS', tagline: 'Cáscaras de red con espinas',
    concept: 'Ernst Haeckel dibujó cientos de radiolarios en «Kunstformen der Natur» (1904): esqueletos de sílice, cáscaras caladas una dentro de otra. Aquí la malla sale de puntos en espiral de Fibonacci sobre la esfera unidos a sus vecinos más cercanos.',
    credit: 'Inspirado en las láminas de Ernst Haeckel (1862, 1904).',
    note: 'Es una aproximación a esas formas, no un modelo biológico. Los puntales finos (bajo 1,2 mm) son frágiles: sube el grosor para PLA.',
    controls: [
      { kind: 'range', key: 'shells', label: 'Cáscaras', min: 1, max: 3, step: 1, int: true },
      { kind: 'range', key: 'points', label: 'Puntos', min: 60, max: 220, step: 5, int: true },
      { kind: 'range', key: 'strut', label: 'Grosor del puntal', min: 0.014, max: 0.036, step: 0.001 },
      { kind: 'range', key: 'knn', label: 'Vecinos', min: 4, max: 8, step: 1, int: true },
      { kind: 'range', key: 'spines', label: 'Espinas', min: 0, max: 1, step: 0.02 },
      { kind: 'range', key: 'spineLen', label: 'Largo de espinas', min: 0.05, max: 0.3, step: 0.01 },
      { kind: 'range', key: 'links', label: 'Puntales entre cáscaras', min: 0, max: 0.5, step: 0.02 },
      { kind: 'range', key: 'jitter', label: 'Irregularidad', min: 0, max: 0.6, step: 0.02 },
    ],
  },
  conway: {
    title: 'POLIEDROS DE CONWAY', tagline: 'Un texto que es una forma',
    concept: 'John Conway describió operaciones que convierten un poliedro en otro, y George Hart las llevó a la escultura. El genoma es un texto: un sólido base (elígelo abajo) y una cadena de letras que se aplican de derecha a izquierda. En la notación completa, "tkD" es truncar(kis(dodecaedro)); aquí la D es el sólido base y escribes solo "tk".',
    credit: 'Notación de poliedros de John H. Conway; popularizada por George W. Hart.',
    note: 'Letras: d dual · a ambo · k kis · t truncar · e expandir · b bisel · j join · o ortho · m meta. Si la cadena crece demasiado el cálculo se detiene en el último paso válido.',
    controls: [
      { kind: 'select', key: 'solid', label: 'Sólido base', options: ['T', 'C', 'O', 'D', 'I', 'P3', 'P5', 'P6', 'A4', 'A5', 'A6'].map((v) => ({ v, label: ({ T: 'Tetraedro', C: 'Cubo', O: 'Octaedro', D: 'Dodecaedro', I: 'Icosaedro' } as Record<string, string>)[v] ?? (v[0] === 'P' ? `Prisma ${v.slice(1)}` : `Antiprisma ${v.slice(1)}`) })) },
      { kind: 'text', key: 'ops', label: 'Operaciones' },
      { kind: 'range', key: 'kisH', label: 'Altura (kis, truncar)', min: 0.05, max: 0.7, step: 0.01 },
      { kind: 'range', key: 'tube', label: 'Grosor de arista', min: 0.1, max: 0.4, step: 0.01 },
      { kind: 'range', key: 'node', label: 'Tamaño de vértice', min: 1, max: 2.6, step: 0.05 },
    ],
  },
  polytope: {
    title: 'POLITOPOS 4D', tagline: 'La sombra de un cuerpo de cuatro dimensiones',
    concept: 'Un politopo 4D no cabe en nuestro espacio: lo que ves es su sombra. Se gira en cuatro dimensiones (seis planos de rotación, un deslizador cada uno) y se proyecta en perspectiva a 3D como un marco de tubos.',
    credit: 'Politopos regulares descritos por Ludwig Schläfli (1852).',
    note: 'El 600-celdas tiene 720 aristas: su STL pesa unos 30 MB y puede tardar varios segundos. Una proyección distinta es literalmente un punto de vista distinto del mismo objeto.',
    controls: [
      { kind: 'select', key: 'shape', label: 'Politopo', options: [{ v: 'pentachoron', label: '5-celdas' }, { v: 'tesseract', label: 'Teseracto (8-celdas)' }, { v: 'hexadecachoron', label: '16-celdas' }, { v: 'icositetrachoron', label: '24-celdas' }, { v: 'hexacosichoron', label: '600-celdas' }] },
      { kind: 'range', key: 'dist', label: 'Distancia de la cámara', min: 2.1, max: 4, step: 0.05 },
      { kind: 'range', key: 'tube', label: 'Grosor', min: 0.02, max: 0.05, step: 0.001 },
      { kind: 'range', key: 'node', label: 'Tamaño de vértice', min: 1, max: 2.6, step: 0.05 },
      { kind: 'range', key: 'depthTube', label: 'Grosor por profundidad', min: 0, max: 1, step: 0.05 },
      arrAt('angles', 0, 'Giro XY'), arrAt('angles', 1, 'Giro XZ'), arrAt('angles', 2, 'Giro XW'),
      arrAt('angles', 3, 'Giro YZ'), arrAt('angles', 4, 'Giro YW'), arrAt('angles', 5, 'Giro ZW'),
    ],
  },
  surface: {
    title: 'SUPERFICIES', tagline: 'Klein, Boy, Möbius y compañía',
    concept: 'Superficies clásicas engrosadas hasta convertirlas en sólidos: la botella de Klein (1882), la superficie de Boy (1901), la banda de Möbius (1858), Dini, Enneper y la familia catenoide-helicoide, que se deforma de una a otra sin estirarse.',
    credit: 'Klein, Boy, Möbius, Dini, Enneper; isometría catenoide-helicoide.',
    note: 'El grosor es una aproximación (unión de esferas sobre la superficie muestreada). Las superficies de una sola cara no tienen un «lado de afuera»: el grosor las vuelve sólidos.',
    controls: [
      { kind: 'select', key: 'kind', label: 'Superficie', options: [{ v: 'klein', label: 'Botella de Klein' }, { v: 'boy', label: 'Superficie de Boy' }, { v: 'mobius', label: 'Banda de Möbius' }, { v: 'dini', label: 'Superficie de Dini' }, { v: 'enneper', label: 'Superficie de Enneper' }, { v: 'catenoid', label: 'Catenoide ↔ helicoide' }] },
      { kind: 'range', key: 'thick', label: 'Grosor', min: 0.015, max: 0.06, step: 0.001 },
      { kind: 'range', key: 'morph', label: 'Catenoide → helicoide', min: 0, max: 1.57, step: 0.02, only: (p) => p.kind === 'catenoid' },
      { kind: 'range', key: 'twistN', label: 'Torsión de Dini', min: 0.1, max: 1.2, step: 0.02, only: (p) => p.kind === 'dini' },
    ],
  },
  hopf: {
    title: 'FIBRACIÓN DE HOPF', tagline: 'Círculos enlazados dentro de una esfera de cuatro dimensiones',
    concept: 'Heinz Hopf mostró en 1931 que la esfera S³ se puede dividir en círculos enlazados de a pares. La proyección estereográfica a nuestro espacio los muestra como toros anidados de círculos.',
    credit: 'Fibración de Hopf (1931), proyección estereográfica.',
    note: 'Las fibras cercanas al polo de la proyección se van al infinito; por eso se recorta el rango. Los giros 4D cambian el punto de vista.',
    controls: [
      { kind: 'range', key: 'rings', label: 'Toros', min: 2, max: 8, step: 1, int: true },
      { kind: 'range', key: 'fibers', label: 'Fibras por toro', min: 6, max: 26, step: 1, int: true },
      { kind: 'range', key: 'tube', label: 'Grosor', min: 0.014, max: 0.04, step: 0.001 },
      { kind: 'range', key: 'etaMin', label: 'Toro interior', min: 0.1, max: 0.5, step: 0.01 },
      { kind: 'range', key: 'etaMax', label: 'Toro exterior', min: 0.7, max: 0.97, step: 0.01 },
      { kind: 'range', key: 'rotA', label: 'Giro A (4D)', min: 0, max: 1.6, step: 0.02 },
      { kind: 'range', key: 'rotB', label: 'Giro B (4D)', min: 0, max: 1.6, step: 0.02 },
    ],
  },
  orbital: {
    title: 'ORBITALES', tagline: 'La forma de un electrón en el hidrógeno',
    concept: 'Las formas de los orbitales del átomo de hidrógeno salen de resolver la ecuación de Schrödinger: ψ = R(r)·Y(θ,φ). Aquí se superponen hasta tres estados y la pieza es el nivel |ψ| = c. Elige n, l y m del primer estado y mezcla un segundo.',
    credit: 'Ecuación de Schrödinger (1926) para el átomo de hidrógeno; armónicos esféricos reales.',
    note: 'Es la amplitud |ψ| y no la densidad de probabilidad completa, y no incluye el espín. Un núcleo pequeño une los lóbulos para que la pieza sea un solo cuerpo.',
    controls: [
      { kind: 'virtual', id: 'n1', label: 'n (energía)', min: 2, max: 5, step: 1, int: true, ...term(0, 0) },
      { kind: 'virtual', id: 'l1', label: 'l (forma)', min: 0, max: 4, step: 1, int: true, ...term(0, 1) },
      { kind: 'virtual', id: 'm1', label: 'm (orientación)', min: -4, max: 4, step: 1, int: true, ...term(0, 2) },
      { kind: 'virtual', id: 'mix', label: 'Mezcla con 2.º estado', min: -1, max: 1, step: 0.05, ...term(1, 3) },
      { kind: 'range', key: 'level', label: 'Nivel |ψ| = c', min: 0.05, max: 0.5, step: 0.01 },
      { kind: 'range', key: 'scale', label: 'Escala', min: 0.9, max: 1.6, step: 0.02 },
      { kind: 'range', key: 'core', label: 'Núcleo que une', min: 0.04, max: 0.25, step: 0.01 },
    ],
  },
  interference: {
    title: 'INTERFERENCIA', tagline: 'Ondas que se cruzan',
    concept: 'Varias fuentes emiten ondas esféricas; donde las crestas coinciden se refuerzan y donde chocan con un valle se anulan. La pieza es un nivel de esa suma: capas concéntricas que se cruzan, como un holograma o un patrón de Moiré hecho sólido.',
    credit: 'Principio de superposición de ondas; interferencia de Young (1801).',
    note: 'Las fuentes salen de la semilla (anillo o esfera); cambia de semilla para moverlas. Es una analogía, no un holograma real.',
    controls: [
      { kind: 'range', key: 'wave', label: 'Frecuencia', min: 8, max: 40, step: 0.5 },
      { kind: 'range', key: 'level', label: 'Nivel', min: -0.4, max: 0.5, step: 0.01 },
      { kind: 'range', key: 'thick', label: 'Grosor de capa', min: 0.04, max: 0.35, step: 0.01 },
      { kind: 'range', key: 'decay', label: 'Atenuación', min: 0.1, max: 1.5, step: 0.05 },
      { kind: 'range', key: 'radius', label: 'Radio de la esfera', min: 0.6, max: 0.95, step: 0.01 },
    ],
  },
}

export const GEO_ORDER: GeometryFamily[] = ['conway', 'polytope', 'hopf', 'surface', 'orbital', 'crystal', 'radiolarian', 'interference']
