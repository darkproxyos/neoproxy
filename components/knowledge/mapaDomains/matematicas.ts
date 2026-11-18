import type { Domain } from '../mapaConocimiento'

// Territorio MATEMÁTICAS del Gran Mapa del Conocimiento -- taxonomía
// académica estándar, redactada de cero. No es una traducción de ningún
// poster existente: la agrupación y el texto son propios.
export const MATEMATICAS: Domain = {
  id: 'matematicas',
  title: 'MATEMÁTICAS',
  color: '#8b5cf6',
  intro: 'El territorio de las estructuras que son verdaderas por su propia definición, no por experimento -- todo lo demás en este mapa le pide prestado el lenguaje.',
  subfields: [
    {
      title: 'Fundamentos y lógica',
      nodes: [
        { label: 'Lógica proposicional y de predicados' },
        { label: 'Teoría de conjuntos', detail: 'Cantor, infinitos de distinto tamaño' },
        { label: 'Teoremas de incompletitud', detail: 'Gödel, 1931' },
        { label: 'Teoría de la demostración' },
        { label: 'Axioma de elección' },
      ],
    },
    {
      title: 'Teoría de números',
      nodes: [
        { label: 'Números primos' },
        { label: 'Aritmética modular' },
        { label: 'Conjetura de Goldbach', detail: 'sin demostrar' },
        { label: 'Último teorema de Fermat', detail: 'Wiles, 1994' },
        { label: 'Criptografía de clave pública', detail: 'depende de factorizar primos grandes' },
      ],
    },
    {
      title: 'Álgebra',
      nodes: [
        { label: 'Teoría de grupos' },
        { label: 'Anillos y cuerpos' },
        { label: 'Álgebra lineal', detail: 'vectores, matrices, transformaciones' },
        { label: 'Álgebra abstracta' },
        { label: 'Teoría de Galois', detail: 'por qué no hay fórmula general para grado 5+' },
      ],
    },
    {
      title: 'Geometría y topología',
      nodes: [
        { label: 'Geometría euclidiana' },
        { label: 'Geometrías no euclidianas', detail: 'Lobachevski, Riemann' },
        { label: 'Topología', detail: 'propiedades que sobreviven a deformar sin cortar' },
        { label: 'Geometría diferencial' },
        { label: 'Geometría fractal', detail: 'Mandelbrot' },
      ],
    },
    {
      title: 'Análisis',
      nodes: [
        { label: 'Cálculo diferencial e integral', detail: 'Newton/Leibniz, s. XVII' },
        { label: 'Límites y continuidad' },
        { label: 'Ecuaciones diferenciales' },
        { label: 'Análisis complejo' },
        { label: 'Análisis funcional' },
      ],
    },
    {
      title: 'Probabilidad y estadística',
      nodes: [
        { label: 'Teoría de la probabilidad' },
        { label: 'Inferencia estadística' },
        { label: 'Distribuciones', detail: 'normal, binomial, Poisson' },
        { label: 'Teorema de Bayes' },
        { label: 'Procesos estocásticos' },
      ],
    },
    {
      title: 'Combinatoria y teoría de grafos',
      nodes: [
        { label: 'Combinatoria enumerativa' },
        { label: 'Teoría de grafos', detail: 'Euler, puentes de Königsberg, 1736' },
        { label: 'Árboles y redes' },
        { label: 'Topología de redes reales', href: '/proxyverse/topologia' },
      ],
    },
    {
      title: 'Sistemas dinámicos y caos',
      nodes: [
        { label: 'Sistemas dinámicos' },
        { label: 'Atractores extraños', detail: 'Lorenz, 1963', href: '/archivo/autoorganizacion' },
        { label: 'Sensibilidad a condiciones iniciales', detail: '"efecto mariposa"' },
        { label: 'Criticalidad autoorganizada', href: '/archivo/autoorganizacion' },
      ],
    },
    {
      title: 'Matemática aplicada y computación',
      nodes: [
        { label: 'Análisis numérico' },
        { label: 'Optimización' },
        { label: 'Teoría de la computabilidad', detail: 'Turing, 1936' },
        { label: 'Redes neuronales como aproximadores de funciones', href: '/archivo/redes-neuronales' },
        { label: 'Teoría de la complejidad', detail: '¿P = NP?, sin resolver' },
      ],
    },
  ],
}
