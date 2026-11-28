// ARSENAL · ESPADAS — catálogo de modelos y su bitácora. Cada modelo nuevo o cada versión nueva de
// uno existente se agrega acá: la página de la sección se arma sola con esto.

export type Version = { v: string; fecha: string; titulo: string; cambios: string[] }
export type Modelo = {
  codigo: string; nombre: string; href: string; tipo: string
  estado: 'imprimible' | 'en el taller'; version: string; imagen: string | null; acento: string
  resumen: string; ficha: [string, string][]; bitacora: Version[]
}

export const MODELOS: Modelo[] = [
  {
    codigo: 'NPX-02', nombre: 'VÉRTICE', href: '/arsenal/espadas/vertice', tipo: 'Espada mecánica de mano y media',
    estado: 'imprimible', version: '2.0', imagen: '/arsenal/npx-02-vertice.jpg', acento: '#ff4d5e',
    resumen: 'Núcleo de dos láminas con las uniones desfasadas, filo biselado de otro color, blindajes que tapan y atan cada unión, guarda de garras con un dial de reactor que se enciende, y una varilla interior que se ve por las ventanas.',
    ficha: [
      ['Largo', '~1,1 m (hoja de 500 a 1000 mm)'],
      ['Piezas', '28 archivos, todas planas y sin soportes'],
      ['Colores', '6 filamentos, sin pintar'],
      ['Herrajes', 'varilla de 4 mm, clavijas de filamento, fibra óptica de 2 mm, LED y pila, manguera de 6 mm'],
      ['Puntas', 'cincel, tanto, espolón'],
    ],
    bitacora: [{
      v: '2.0', fecha: '2026-11-28', titulo: 'Primera versión: aristas vivas y estructura en capas',
      cambios: [
        'Mallas con dual contouring y normales exactas del campo: caras planas y cantos vivos (la v1 salía redondeada).',
        'Simplificación por métricas de error cuadrático: una cara plana queda en pocos triángulos; STL livianos.',
        'Núcleo en dos láminas con las uniones de A y B desfasadas; cada unión, una cola de milano en el plano.',
        'Filo de otro color, biselado hasta 1,2 mm, encajado con colas de milano chicas.',
        'Blindajes sobre cada par de uniones, atados con clavijas de filamento; placa de matrícula grabada.',
        'Varilla de 4 mm de la punta al pomo, a la vista por las ventanas.',
        'Guarda con compartimento para pila y LED bajo un dial a presión; fibra óptica de brillo lateral por cada cara.',
        'Rótulo de armado grabado en la cara de corte de cada pieza (A1, B2, FA1…).',
        'Cálculo repartido en varios hilos y verificación de encajes en un hilo aparte.',
      ],
    }],
  },
  {
    codigo: 'NPX-01', nombre: 'KATANA CYBORG', href: '/katana', tipo: 'Katana industrial',
    estado: 'imprimible', version: '1.1', imagen: '/arsenal/npx-01-katana.jpg', acento: '#00d4ff',
    resumen: 'Hoja curva con aletas disipadoras en el lomo, ventilas y un canal de luz con trazado de circuito; abrazaderas con tornillos sobre cada unión, tsuba de engranaje y un mango con hueco para electrónica.',
    ficha: [
      ['Largo', 'hoja de 300 a 900 mm'],
      ['Piezas', 'hoja en mitades y segmentos, tsuba, fuchi, mango, remate'],
      ['Malla', 'surface nets (cantos redondeados)'],
      ['Extras', 'hueco para ESP32-C3 y batería'],
    ],
    bitacora: [
      {
        v: '1.1', fecha: '2026-11-28', titulo: 'Mitades A y B en la descarga',
        cambios: ['Cada pieza partida en dos se descarga como dos archivos: la mitad A y su espejo, la B. Antes venía un solo archivo ×2 y había que espejar la segunda copia en el laminador.'],
      },
      {
        v: '1.0', fecha: '2026-11-28', titulo: 'Primera versión',
        cambios: ['Hoja curva paramétrica en segmentos con espiga y perno, abrazaderas, tsuba, fuchi, mango, remate y sensores; verificación de holguras.'],
      },
    ],
  },
]

// Lo que viene: cada punto es una iteración concreta, no una promesa vaga.
export const EN_EL_TALLER: { titulo: string; texto: string }[] = [
  { titulo: 'Impresión de prueba de la v2', texto: 'Imprimir una VÉRTICE completa, medir cada encaje con calibre y ajustar holguras y espesores en la 2.1 con lo que se mida, no con lo que se supone.' },
  { titulo: 'Vaina', texto: 'Una vaina impresa en tramos para cada modelo, con cierre magnético y un enganche para la espalda.' },
  { titulo: 'Dial que enciende', texto: 'Que girar el dial del reactor encienda el LED: un interruptor rotativo dentro del compartimento de la guarda.' },
  { titulo: 'NPX-03', texto: 'El próximo modelo: hoja curva con las uniones en cola de milano curva y el lenguaje de capas de la VÉRTICE.' },
  { titulo: 'Exhibidor', texto: 'Un soporte de pared o de mesa que se imprime aparte y toma la espada por la guarda.' },
]
