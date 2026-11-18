import type { Domain } from '../mapaConocimiento'

export const BIOLOGIA: Domain = {
  id: 'biologia',
  title: 'BIOLOGÍA',
  color: '#ef4444',
  intro: 'El estudio de lo que está vivo -- desde una molécula que se copia a sí misma hasta un ecosistema entero que se autorregula.',
  subfields: [
    {
      title: 'GENÉTICA Y BIOLOGÍA MOLECULAR',
      nodes: [
        { label: 'ADN y el código genético', detail: 'Watson/Crick, 1953', href: '/archivo/adn' },
        { label: 'Transcripción y traducción', href: '/archivo/adn' },
        { label: 'CRISPR-Cas9', detail: 'Doudna/Charpentier, Nobel 2020', href: '/archivo/adn' },
        { label: 'Epigenética', detail: 'metilación, histonas' },
        { label: 'Genómica y Proyecto Genoma Humano', detail: '2003 / T2T 2022', href: '/archivo/adn' },
        { label: 'Herencia mendeliana', detail: 'Mendel, 1865' },
      ],
    },
    {
      title: 'BIOLOGÍA CELULAR',
      nodes: [
        { label: 'Teoría celular', detail: 'Schleiden/Schwann, 1839' },
        { label: 'Organelos y membrana plasmática' },
        { label: 'Mitosis y meiosis' },
        { label: 'Respiración celular', detail: 'mitocondria' },
        { label: 'Fotosíntesis', detail: 'cloroplasto' },
        { label: 'Señalización celular' },
      ],
    },
    {
      title: 'EVOLUCIÓN',
      nodes: [
        { label: 'Selección natural', detail: 'Darwin, 1859' },
        { label: 'Genética de poblaciones' },
        { label: 'Especiación' },
        { label: 'Árbol filogenético de la vida' },
        { label: 'Endosimbiosis', detail: 'Margulis, 1967' },
        { label: 'Síntesis evolutiva moderna' },
      ],
    },
    {
      title: 'ECOLOGÍA',
      nodes: [
        { label: 'Cadenas y redes tróficas' },
        { label: 'Ciclos biogeoquímicos', detail: 'carbono, nitrógeno' },
        { label: 'Dinámica de poblaciones' },
        { label: 'Biodiversidad y nicho ecológico' },
        { label: 'Sucesión ecológica' },
      ],
    },
    {
      title: 'FISIOLOGÍA Y ANATOMÍA',
      nodes: [
        { label: 'Homeostasis' },
        { label: 'Sistema circulatorio y respiratorio' },
        { label: 'Sistema endocrino', detail: 'hormonas' },
        { label: 'Sistema nervioso', detail: 'ver neurociencia' },
        { label: 'Sistema muscular y esquelético' },
      ],
    },
    {
      title: 'MICROBIOLOGÍA',
      nodes: [
        { label: 'Bacterias y arqueas' },
        { label: 'Virus y bacteriófagos' },
        { label: 'Microbioma' },
        { label: 'Fermentación', detail: 'Pasteur' },
        { label: 'Resistencia antibiótica' },
      ],
    },
    {
      title: 'BOTÁNICA',
      nodes: [
        { label: 'Anatomía vegetal', detail: 'raíz, tallo, hoja' },
        { label: 'Fotosíntesis C3/C4/CAM' },
        { label: 'Reproducción vegetal' },
        { label: 'Fitohormonas' },
      ],
    },
    {
      title: 'ZOOLOGÍA',
      nodes: [
        { label: 'Clasificación de vertebrados e invertebrados' },
        { label: 'Etología', detail: 'comportamiento animal' },
        { label: 'Desarrollo embrionario' },
        { label: 'Comunicación animal' },
      ],
    },
    {
      title: 'NEUROCIENCIA',
      nodes: [
        { label: 'Neurona y potencial de acción' },
        { label: 'Sinapsis y neurotransmisores' },
        { label: 'Plasticidad sináptica' },
        { label: 'Corteza cerebral y regiones funcionales' },
      ],
    },
    {
      title: 'BIOTECNOLOGÍA E INMUNOLOGÍA',
      nodes: [
        { label: 'Anticuerpos y respuesta inmune' },
        { label: 'Vacunas', detail: 'Jenner, 1796' },
        { label: 'ADN recombinante', detail: 'ingeniería genética' },
        { label: 'Terapia génica', detail: 'ver CRISPR', href: '/archivo/adn' },
        { label: 'Clonación', detail: 'oveja Dolly, 1996' },
      ],
    },
  ],
}
