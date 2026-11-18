import type { Domain } from '../mapaConocimiento'

// FÍSICA -- taxonomía estándar, agrupada en bloques reconocibles de
// cualquier currícula de grado: lo clásico primero, después las dos
// rupturas del siglo XX (relatividad y cuántica) por separado, y recién
// ahí lo que combina ambas o queda sin resolver (teoría cuántica de
// campos, cosmología, agujeros negros). Agujeros negros y física
// cuántica entran como subcampos acá, no como dominios propios -- son
// parte de la física, no campos aparte.
export const FISICA: Domain = {
  id: 'fisica',
  title: 'FÍSICA',
  color: '#3b82f6',
  intro: 'Lo que le pasa a la materia y la energía, desde una bola que cae hasta un agujero negro. Lo viejo todavía funciona; lo nuevo todavía no se lleva bien entre sí.',
  subfields: [
    {
      title: 'MECÁNICA CLÁSICA',
      nodes: [
        { label: 'Leyes de Newton', detail: 'Principia, 1687' },
        { label: 'Gravitación universal', detail: 'F = Gm₁m₂/r²' },
        { label: 'Energía y momento, conservación' },
        { label: 'Mecánica lagrangiana', detail: 'Lagrange, 1788' },
        { label: 'Mecánica hamiltoniana', detail: 'Hamilton, 1833' },
        { label: 'Oscilador armónico' },
      ],
    },
    {
      title: 'TERMODINÁMICA Y ESTADÍSTICA',
      nodes: [
        { label: 'Leyes de la termodinámica' },
        { label: 'Entropía', detail: 'Clausius, 1865' },
        { label: 'Mecánica estadística', detail: 'Boltzmann, Gibbs' },
        { label: 'Teoría cinética de los gases' },
        { label: 'Transiciones de fase' },
      ],
    },
    {
      title: 'ELECTROMAGNETISMO',
      nodes: [
        { label: 'Ecuaciones de Maxwell', detail: '1865' },
        { label: 'Campo eléctrico y magnético' },
        { label: 'Ondas electromagnéticas' },
        { label: 'Ley de Faraday, inducción' },
        { label: 'Óptica física', detail: 'difracción, interferencia' },
      ],
    },
    {
      title: 'RELATIVIDAD',
      nodes: [
        { label: 'Relatividad especial', detail: 'Einstein, 1905' },
        { label: 'E = mc²' },
        { label: 'Dilatación temporal' },
        { label: 'Relatividad general', detail: 'Einstein, 1915' },
        { label: 'Curvatura del espacio-tiempo' },
        { label: 'Ondas gravitacionales', detail: 'detectadas en 2015, LIGO' },
      ],
    },
    {
      title: 'MECÁNICA CUÁNTICA',
      nodes: [
        { label: 'Dualidad onda-partícula' },
        { label: 'Principio de incertidumbre', detail: 'Heisenberg, 1927' },
        { label: 'Ecuación de Schrödinger', detail: '1926' },
        { label: 'Superposición y colapso' },
        { label: 'Entrelazamiento cuántico' },
        { label: 'Interpretación de Copenhague' },
      ],
    },
    {
      title: 'CÓMPUTO CUÁNTICO',
      nodes: [
        {
          label: 'Qubits, puertas y algoritmos cuánticos',
          detail: 'aplicación de la mecánica cuántica al cómputo -- no es "física cuántica en general"',
          href: '/archivo/computacion-cuantica',
        },
      ],
    },
    {
      title: 'TEORÍA CUÁNTICA DE CAMPOS',
      nodes: [
        { label: 'Electrodinámica cuántica (QED)' },
        { label: 'Cromodinámica cuántica (QCD)' },
        { label: 'Diagramas de Feynman' },
        { label: 'Modelo Estándar', href: '/archivo/particulas' },
        { label: 'Bosón de Higgs', detail: 'confirmado 2012, CERN' },
      ],
    },
    {
      title: 'FÍSICA DE PARTÍCULAS',
      nodes: [
        { label: 'Quarks y leptones', href: '/archivo/particulas' },
        { label: 'Fuerzas fundamentales', href: '/archivo/particulas' },
        { label: 'Aceleradores de partículas', detail: 'LHC' },
      ],
    },
    {
      title: 'COSMOLOGÍA Y ASTROFÍSICA',
      nodes: [
        { label: 'Big Bang', detail: '~13.800 millones de años' },
        { label: 'Expansión del universo', detail: 'Hubble, 1929' },
        { label: 'Materia y energía oscura' },
        { label: 'Fondo cósmico de microondas' },
      ],
    },
    {
      title: 'AGUJEROS NEGROS',
      nodes: [
        { label: 'Horizonte de eventos' },
        { label: 'Singularidad' },
        { label: 'Radiación de Hawking', detail: 'Hawking, 1974' },
        { label: 'Entropía y principio holográfico', href: '/archivo/holografia' },
        { label: 'Primera imagen real', detail: 'Event Horizon Telescope, 2019' },
      ],
    },
    {
      title: 'CAOS Y SISTEMAS DINÁMICOS',
      nodes: [
        { label: 'Sensibilidad a condiciones iniciales', detail: '"efecto mariposa"' },
        { label: 'Atractor de Lorenz', href: '/archivo/autoorganizacion' },
        { label: 'Criticalidad autoorganizada', href: '/archivo/autoorganizacion' },
      ],
    },
  ],
}
