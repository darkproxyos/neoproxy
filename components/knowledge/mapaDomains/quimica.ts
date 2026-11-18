import type { Domain } from '../mapaConocimiento'

// Taxonomía real y estándar de la química -- agrupada como la reconocería
// cualquier currícula universitaria, redactada de cero, sin copiar
// dibujo, texto ni selección de ningún poster existente.
export const QUIMICA: Domain = {
  id: 'quimica',
  title: 'QUÍMICA',
  color: '#eab308',
  intro: 'La materia, lo que la compone y cómo se reordena cuando reacciona -- del átomo individual a la molécula que replica información.',
  subfields: [
    {
      title: 'Materia y tabla periódica',
      nodes: [
        { label: 'Átomo', detail: 'protón, neutrón, electrón' },
        { label: 'Tabla periódica', detail: 'Mendeléyev, 1869' },
        { label: 'Isótopos' },
        { label: 'Configuración electrónica' },
        { label: 'Estados de la materia', detail: 'sólido, líquido, gas, plasma' },
        { label: 'Mezclas y sustancias puras' },
      ],
    },
    {
      title: 'Enlace químico',
      nodes: [
        { label: 'Enlace iónico' },
        { label: 'Enlace covalente' },
        { label: 'Enlace metálico' },
        { label: 'Fuerzas de Van der Waals' },
        { label: 'Puente de hidrógeno' },
        { label: 'Geometría molecular', detail: 'teoría VSEPR' },
      ],
    },
    {
      title: 'Reacciones',
      nodes: [
        { label: 'Síntesis y descomposición' },
        { label: 'Reacción redox' },
        { label: 'Ácidos y bases', detail: 'escala pH' },
        { label: 'Equilibrio químico' },
        { label: 'Cinética química', detail: 'velocidad de reacción' },
        { label: 'Catálisis' },
      ],
    },
    {
      title: 'Fisicoquímica',
      nodes: [
        { label: 'Termodinámica química', detail: 'entalpía, entropía' },
        { label: 'Energía libre de Gibbs' },
        { label: 'Electroquímica', detail: 'pilas, electrólisis' },
        { label: 'Química cuántica' },
        { label: 'Espectroscopía' },
      ],
    },
    {
      title: 'Química orgánica',
      nodes: [
        { label: 'Hidrocarburos' },
        { label: 'Grupos funcionales' },
        { label: 'Isomería' },
        { label: 'Polímeros' },
        { label: 'Mecanismos de reacción orgánica' },
        { label: 'Química del carbono' },
      ],
    },
    {
      title: 'Química inorgánica',
      nodes: [
        { label: 'Compuestos de coordinación' },
        { label: 'Química organometálica' },
        { label: 'Química del estado sólido' },
        { label: 'Minerales y cerámicos' },
      ],
    },
    {
      title: 'Bioquímica',
      nodes: [
        { label: 'Aminoácidos y proteínas' },
        { label: 'Ácidos nucleicos', detail: 'ADN y ARN', href: '/archivo/adn' },
        { label: 'Enzimas', detail: 'catálisis biológica' },
        { label: 'Metabolismo', detail: 'anabolismo y catabolismo' },
        { label: 'Lípidos y membranas' },
      ],
    },
    {
      title: 'Química analítica',
      nodes: [
        { label: 'Cromatografía' },
        { label: 'Espectrometría de masas' },
        { label: 'Titulación' },
        { label: 'Análisis instrumental' },
      ],
    },
    {
      title: 'Química de materiales y computacional',
      nodes: [
        { label: 'Materiales nuevos', detail: 'nanomateriales, semiconductores' },
        { label: 'Química computacional', detail: 'simulación molecular' },
        { label: 'Química verde', detail: 'procesos de bajo impacto' },
      ],
    },
  ],
}
