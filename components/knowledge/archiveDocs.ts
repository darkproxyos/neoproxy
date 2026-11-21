// Metadata de los documentos largos del Codex (/archivo/*, /knowledge/*,
// ENSAYO/REFERENCIA TÉCNICA/ANÁLISIS CULTURAL/TEORÍA DISPUTADA) -- vivía
// como const local de app/knowledge/page.tsx; se extrajo acá para que
// app/knowledge/atlas/page.tsx (el mapa con estadísticas reales de todo
// el Codex) pueda reusar los mismos datos sin duplicarlos ni importar un
// archivo de página desde otro.

export type ArchiveDoc = {
  id: string; code: string; title: string; href: string; color: string
  format: 'ENSAYO' | 'REFERENCIA TÉCNICA' | 'ANÁLISIS CULTURAL' | 'TEORÍA DISPUTADA'; blurb: string
}

// Los documentos largos que conviven bajo CODEX COGITO -- ver el
// historial de cada uno en los comentarios de su propia página real.
export const ARCHIVE_DOCS: ArchiveDoc[] = [
  {
    id: 'filosofia', code: 'NPX-KNW-00a', title: 'FILOSOFÍA', href: '/knowledge/filosofia',
    color: '#b06bff', format: 'ENSAYO',
    blurb: 'Un solo recorrido, seis nodos, un argumento — de la información a la pregunta por el yo.',
  },
  {
    id: 'particulas', code: 'NPX-ARC-01', title: 'PARTÍCULAS', href: '/archivo/particulas',
    color: '#5fd4ff', format: 'REFERENCIA TÉCNICA',
    blurb: 'El modelo estándar completo — quarks, leptones, bosones, diagramas de Feynman — con el detalle de un archivo de laboratorio.',
  },
  {
    id: 'mente', code: 'NPX-ARC-02', title: 'MENTE', href: '/archivo/mente',
    color: '#ff4fa3', format: 'REFERENCIA TÉCNICA',
    blurb: 'Neurociencia y ciencia cognitiva — de la neurona individual al problema difícil de la consciencia.',
  },
  {
    id: 'lenguaje', code: 'NPX-ARC-03', title: 'LENGUAJE', href: '/archivo/lenguaje',
    color: '#2ee6b8', format: 'REFERENCIA TÉCNICA',
    blurb: 'Lingüística completa — fonética, sintaxis, la jerarquía de Chomsky, familias de lenguas.',
  },
  {
    id: 'alimentacion', code: 'NPX-ARC-04', title: 'ALIMENTACIÓN', href: '/archivo/alimentacion',
    color: '#b4e61d', format: 'REFERENCIA TÉCNICA',
    blurb: 'Nutrición y biohacking — lo que comés como información para el cuerpo y la mente, con cifras reales.',
  },
  {
    id: 'holografia', code: 'NPX-ARC-05', title: 'PRINCIPIO HOLOGRÁFICO', href: '/archivo/holografia',
    color: '#6c5ce7', format: 'REFERENCIA TÉCNICA',
    blurb: 'De la entropía de un agujero negro a AdS/CFT — con la distinción honesta entre lo matemáticamente probado y la especulación sobre nuestro universo real.',
  },
  {
    id: 'cognitiva', code: 'NPX-ARC-06', title: 'CIENCIA COGNITIVA', href: '/archivo/cognitiva',
    color: '#22e06b', format: 'REFERENCIA TÉCNICA',
    blurb: 'El campo interdisciplinario completo — de la revolución contra el conductismo al problema difícil de la consciencia, distinto del recorte neurocientífico de MENTE.',
  },
  {
    id: 'ergoproxy', code: 'NPX-REF-00', title: 'ERGO PROXY', href: '/archivo/ergoproxy',
    color: '#c9703a', format: 'ANÁLISIS CULTURAL',
    blurb: 'Romdo, los Proxy y el título leído como eco directo de Descartes — premisa, filosofía y la recepción real de la serie, sección por sección.',
  },
  {
    id: 'lain', code: 'NPX-REF-01', title: 'SERIAL EXPERIMENTS LAIN', href: '/archivo/lain',
    color: '#4f6bff', format: 'ANÁLISIS CULTURAL',
    blurb: 'La Wired como extensión del yo — identidad, el final real de la serie y por qué sigue citada 25 años después.',
  },
  {
    id: 'gits', code: 'NPX-REF-02', title: 'GHOST IN THE SHELL', href: '/archivo/gits',
    color: '#d946ef', format: 'ANÁLISIS CULTURAL',
    blurb: 'El ghost en la máquina — filosofía, versiones y el legado real sobre Matrix y el cyberpunk que vino después.',
  },
  {
    id: 'grinberg', code: 'NPX-REF-03', title: 'JACOBO GRINBERG', href: '/archivo/grinberg',
    color: '#39d953', format: 'TEORÍA DISPUTADA',
    blurb: 'La teoría sintérgica y los potenciales transferidos — biografía, experimentos, recepción científica real y una desaparición sin resolver.',
  },
  {
    id: 'garniermalet', code: 'NPX-REF-04', title: 'GARNIER MALET', href: '/archivo/garniermalet',
    color: '#b31ba3', format: 'TEORÍA DISPUTADA',
    blurb: 'La teoría del desdoblamiento del tiempo — qué afirma la tesis, qué no pudo confirmarse, separado con el mismo cuidado que el resto del archivo.',
  },
  {
    id: 'giger', code: 'NPX-REF-05', title: 'GIGER', href: '/archivo/giger',
    color: '#8a8176', format: 'ANÁLISIS CULTURAL',
    blurb: 'La estética biomecánica — el cuarto pilar visual que nombra CLAUDE.md (junto a Ergo Proxy, Lain y Ghost in the Shell), sin documento propio hasta ahora.',
  },
  {
    id: 'dinero', code: 'NPX-ARC-07', title: 'DINERO', href: '/archivo/dinero',
    color: '#b8860b', format: 'REFERENCIA TÉCNICA',
    blurb: 'Economía, psicología conductual y neuroventas — Kahneman y Thaler con Nobel real, Kiyosaki y Eker como desarrollo personal, Klarić apoyado en un modelo ya superado. Nada tratado igual.',
  },
  {
    id: 'metacognicion', code: 'NPX-ARC-08', title: 'METACOGNICIÓN', href: '/archivo/metacognicion',
    color: '#ff7a3d', format: 'REFERENCIA TÉCNICA',
    blurb: 'Diálogo interno, voz mental y cómo identificar tus propios errores de pensamiento — Beck/Burns y Kross con décadas de evidencia controlada, IFS honesto sobre tener mucha menos.',
  },
  {
    id: 'semiotica', code: 'NPX-ARC-09', title: 'SEMIÓTICA', href: '/archivo/semiotica',
    color: '#ffd60a', format: 'REFERENCIA TÉCNICA',
    blurb: 'El signo, el sentido y el límite entre lo que representa y lo que es — Saussure, Peirce, Barthes y el simulacro de Baudrillard, ya una entrada real de este Codex.',
  },
  {
    id: 'hermeneutica', code: 'NPX-ARC-10', title: 'HERMENÉUTICA', href: '/archivo/hermeneutica',
    color: '#4a7c82', format: 'REFERENCIA TÉCNICA',
    blurb: 'La teoría de la interpretación — Schleiermacher, Dilthey, Heidegger y el círculo hermenéutico de Gadamer, honesto sobre no ser un método con pasos verificables.',
  },
  {
    id: 'autoorganizacion', code: 'NPX-ARC-11', title: 'AUTOORGANIZACIÓN', href: '/archivo/autoorganizacion',
    color: '#e63946', format: 'REFERENCIA TÉCNICA',
    blurb: 'Orden sin diseñador — Prigogine, Per Bak, Lorenz y Barabási, siete nombres que ya estaban en el Codex sin documento propio, con tres de sus ideas corriendo hoy en código real del sitio.',
  },
  {
    id: 'cibernetica', code: 'NPX-ARC-12', title: 'CIBERNÉTICA', href: '/archivo/cibernetica',
    color: '#3a4ba0', format: 'REFERENCIA TÉCNICA',
    blurb: 'Cómo un sistema se regula a sí mismo — Wiener, Ashby, von Neumann y Bertalanffy: el vocabulario real detrás de "organismo vivo", la frase que ya usa CLAUDE.md para describir NeoProxy.',
  },
  {
    id: 'computacion-cuantica', code: 'NPX-ARC-13', title: 'COMPUTACIÓN CUÁNTICA', href: '/archivo/computacion-cuantica',
    color: '#1b3a6b', format: 'REFERENCIA TÉCNICA',
    blurb: 'Qubits, entrelazamiento y por qué todavía no existe una máquina útil a gran escala — supremacía cuántica y qubits topológicos tratados como la controversia real que son, no como hito cerrado.',
  },
  {
    id: 'redes-neuronales', code: 'NPX-ARC-14', title: 'REDES NEURONALES ARTIFICIALES', href: '/archivo/redes-neuronales',
    color: '#8fa3b0', format: 'REFERENCIA TÉCNICA',
    blurb: 'Funcionamiento, tipos, orígenes, hasta ahora y futuro — McCulloch, Perceptrón, Transformer y Hopfield (Nobel 2024), ya sembrados en el Codex sin documento que los uniera.',
  },
  {
    id: 'adn', code: 'NPX-ARC-15', title: 'ADN', href: '/archivo/adn',
    color: '#ff8577', format: 'REFERENCIA TÉCNICA',
    blurb: 'La molécula, el código, y el crédito que tardó décadas en repartirse bien — de Rosalind Franklin a CRISPR, con el debate real sobre el ADN no codificante todavía abierto.',
  },
  {
    id: 'wetware', code: 'NPX-ARC-16', title: 'WETWARE', href: '/archivo/wetware',
    color: '#c90076', format: 'REFERENCIA TÉCNICA',
    blurb: 'El cuerpo humano reescrito como arquitectura de sistema — anatomía real primero, analogía computacional después, con el límite de esa traducción marcado a propósito. Fase 1/3: solo texto.',
  },
  {
    id: 'linux', code: 'NPX-ARC-17', title: 'LINUX', href: '/archivo/linux',
    color: '#00ff41', format: 'REFERENCIA TÉCNICA',
    blurb: 'Unix, GNU y el mensaje real de Torvalds en 1991, el kernel por dentro (scheduler, memoria virtual, syscalls), namespaces/cgroups detrás de los contenedores, y un camino concreto a compilar el tuyo — cerrado con la distancia honesta entre NeoProxy y un OS real.',
  },
  {
    id: 'sintesis', code: 'NPX-KNW-SIN', title: 'SÍNTESIS', href: '/knowledge/sintesis',
    color: '#00d4ff', format: 'ENSAYO',
    blurb: 'Los otros doce documentos, leídos juntos — de la entropía de un agujero negro a una teoría que nadie pudo confirmar, todos preguntando lo mismo.',
  },
]
