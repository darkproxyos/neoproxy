// Contenido real de app/archivo/wetware/page.tsx, condensado para HUD --
// cada dato acá es el mismo que ya está escrito y verificado en el
// documento de texto (secciones II, V, VII y XI), solo acortado para caber
// en un panel flotante. No se inventó ningún dato nuevo para esta capa
// visual -- es la misma fuente, resumida, con link de vuelta al original.
export type BodySystem = {
  id: string
  roman: string
  title: string
  sub: string
  color: string
  // posición local sobre la figura holográfica (ver scene.ts para las
  // proporciones del cuerpo que usa estos puntos de anclaje)
  anchor: { x: number; y: number; z: number }
  facts: string[]
  sourceAnchor: string
}

export const BODY_SYSTEMS: BodySystem[] = [
  {
    id: 'cerebro',
    roman: 'II',
    title: 'EL PROCESADOR CENTRAL',
    sub: 'el cerebro',
    color: '#00d4ff',
    anchor: { x: 0, y: 2.74, z: 0.18 },
    facts: [
      '~86 mil millones de neuronas (Herculano-Houzel, 2009) — reemplazó el "100 mil millones" repetido sin verificar durante décadas.',
      'No es un procesador único: es un clúster de núcleos especializados (frontal, occipital, temporal) que se reparten tareas y se comunican constantemente.',
      'Una neurona transmite a ~120 m/s en sus axones más rápidos — millones de veces más lento que un cable de cobre. Gana por paralelismo masivo y plasticidad, no por velocidad de señal.',
    ],
    sourceAnchor: 'sec-02',
  },
  {
    id: 'circulatorio',
    roman: 'V',
    title: 'LA FUENTE DE ALIMENTACIÓN',
    sub: 'sistema circulatorio',
    color: '#ff3b3b',
    anchor: { x: -0.12, y: 2.05, z: 0.34 },
    facts: [
      '~5 litros de sangre por minuto en reposo (gasto cardíaco estándar) — cuatro cámaras, redundancia parcial de circuito.',
      'La sangre es el bus real: oxígeno/glucosa como combustible y datos, glóbulos blancos patrullando como seguridad activa.',
      'La presión arterial es el voltaje de la red: muy baja y los componentes lejanos no reciben suficiente; muy alta y el cableado (las arterias) se daña con el tiempo.',
    ],
    sourceAnchor: 'sec-05',
  },
  {
    id: 'digestivo',
    roman: 'VII',
    title: 'EL PIPELINE ETL',
    sub: 'sistema digestivo',
    color: '#ffb800',
    anchor: { x: 0.05, y: 1.5, z: 0.36 },
    facts: [
      'Extract: boca y estómago (digestión mecánica y química). Transform: intestino delgado (enzimas rompen macromoléculas en unidades absorbibles). Load: carga a la sangre por la pared intestinal.',
      'El hígado es la etapa de post-procesamiento: filtra toxinas, regula la glucosa liberada según demanda real, y almacena excedentes.',
    ],
    sourceAnchor: 'sec-07',
  },
  {
    id: 'musculoesqueletico',
    roman: 'XI',
    title: 'CHASIS Y ACTUADORES',
    sub: 'sistema musculoesquelético',
    color: '#7bff3d',
    anchor: { x: 0.56, y: 2.32, z: 0.1 },
    facts: [
      'Los huesos son el chasis estructural — rígido donde hace falta soporte, articulado donde hace falta movimiento (bisagra en el codo, rótula de movimiento amplio en el hombro).',
      'El sarcómero (filamentos de actina y miosina deslizándose uno sobre otro) es un motor lineal microscópico real: convierte ATP en fuerza mecánica — el mismo principio físico que un actuador lineal, a otra escala.',
    ],
    sourceAnchor: 'sec-11',
  },
]
