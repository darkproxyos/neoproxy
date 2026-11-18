import type { Domain } from '../mapaConocimiento'

// Taxonomía estándar de Ciencias de la Computación, redactada de cero --
// ver la nota de honestidad en ../mapaConocimiento.ts sobre por qué esto
// no copia ningún poster existente.
export const COMPUTACION: Domain = {
  id: 'computacion',
  title: 'COMPUTACIÓN',
  color: '#06b6d4',
  intro: 'Qué se puede calcular, cómo se calcula rápido, y en qué máquina real corre todo eso.',
  subfields: [
    {
      title: 'TEORÍA DE LA COMPUTACIÓN',
      nodes: [
        { label: 'Máquina de Turing', detail: 'Turing, 1936' },
        { label: 'Problema de la detención' },
        { label: 'Tesis de Church-Turing' },
        { label: 'Autómatas finitos' },
        { label: 'Gramáticas formales', detail: 'jerarquía de Chomsky' },
        { label: 'Clases P y NP' },
        { label: 'NP-completitud' },
      ],
    },
    {
      title: 'ALGORITMOS Y ESTRUCTURAS DE DATOS',
      nodes: [
        { label: 'Notación O grande' },
        { label: 'Listas, pilas, colas' },
        { label: 'Árboles y grafos' },
        { label: 'Tablas hash' },
        { label: 'Ordenamiento', detail: 'quicksort, mergesort' },
        { label: 'Búsqueda binaria' },
        { label: 'Programación dinámica' },
        { label: 'Algoritmos voraces' },
      ],
    },
    {
      title: 'ARQUITECTURA Y HARDWARE',
      nodes: [
        { label: 'CPU y ciclo de instrucción' },
        { label: 'Arquitectura von Neumann' },
        { label: 'Jerarquía de memoria', detail: 'caché, RAM, disco' },
        { label: 'Lógica booleana y puertas' },
        { label: 'Pipelining' },
        { label: 'GPU y cómputo paralelo' },
      ],
    },
    {
      title: 'LENGUAJES Y COMPILADORES',
      nodes: [
        { label: 'Paradigmas', detail: 'imperativo, funcional, OOP' },
        { label: 'Análisis léxico y sintáctico' },
        { label: 'Compilación vs. interpretación' },
        { label: 'Máquinas virtuales' },
        { label: 'Gestión de memoria', detail: 'stack, heap, garbage collection' },
      ],
    },
    {
      title: 'SISTEMAS OPERATIVOS',
      nodes: [
        { label: 'Procesos e hilos' },
        { label: 'Planificación de CPU' },
        { label: 'Memoria virtual' },
        { label: 'Sistemas de archivos' },
        { label: 'Concurrencia y condiciones de carrera' },
      ],
    },
    {
      title: 'REDES',
      nodes: [
        { label: 'Modelo OSI / TCP-IP' },
        { label: 'DNS' },
        { label: 'HTTP y la web' },
        { label: 'Conmutación de paquetes' },
        { label: 'Protocolos de enrutamiento' },
      ],
    },
    {
      title: 'BASES DE DATOS',
      nodes: [
        { label: 'Modelo relacional' },
        { label: 'SQL' },
        { label: 'Normalización' },
        { label: 'Transacciones ACID' },
        { label: 'Bases NoSQL' },
        { label: 'Índices' },
      ],
    },
    {
      title: 'CRIPTOGRAFÍA Y SEGURIDAD',
      nodes: [
        { label: 'Criptografía simétrica' },
        { label: 'Clave pública', detail: 'RSA, 1977' },
        { label: 'Funciones hash criptográficas' },
        { label: 'Firmas digitales' },
        { label: 'Ataques comunes', detail: 'inyección, phishing' },
      ],
    },
    {
      title: 'INTELIGENCIA ARTIFICIAL Y MACHINE LEARNING',
      nodes: [
        { label: 'Aprendizaje supervisado / no supervisado' },
        { label: 'Redes neuronales artificiales', href: '/archivo/redes-neuronales' },
        { label: 'Transformers y atención', href: '/archivo/redes-neuronales' },
        { label: 'Aprendizaje por refuerzo' },
        { label: 'Visión por computadora' },
        { label: 'Procesamiento de lenguaje natural' },
      ],
    },
    {
      title: 'COMPUTACIÓN CUÁNTICA',
      nodes: [
        { label: 'Qubit y superposición', href: '/archivo/computacion-cuantica' },
        { label: 'Entrelazamiento', href: '/archivo/computacion-cuantica' },
        { label: 'Algoritmo de Shor', href: '/archivo/computacion-cuantica' },
        { label: 'Corrección de errores cuánticos', href: '/archivo/computacion-cuantica' },
      ],
    },
    {
      title: 'INGENIERÍA DE SOFTWARE',
      nodes: [
        { label: 'Control de versiones' },
        { label: 'Testing y TDD' },
        { label: 'Patrones de diseño' },
        { label: 'Arquitectura cliente-servidor' },
        { label: 'Metodologías ágiles' },
      ],
    },
  ],
}
