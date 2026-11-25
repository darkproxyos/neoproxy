// Árbol real del sitio completo, para /experimental/cartografia -- cada
// rama de acá es una ruta real verificada contra el código (nav-config.ts
// + el catálogo propio de cada sección: app/games/page.tsx,
// app/experimental/page.tsx, components/knowledge/archiveDocs.ts,
// app/realidad-aumentada/page.tsx, app/shop/page.tsx,
// components/proxyverse/agents.ts), no una taxonomía inventada. Las
// páginas huérfanas (sin link desde ningún catálogo: /espada, /network,
// /fibonacci, /npos/research, /system) quedan afuera a propósito -- no
// pertenecen a ninguna rama real, listarlas acá colgadas de cualquier
// lado sería inventar una jerarquía que no existe.
//
// SITE_BRANCH_COLOR vive acá (y no repetida en cada página que usa
// SITE_TREE) para que /experimental/cartografia y /home-grafico pinten
// exactamente las mismas ramas con el mismo color real -- un solo lugar
// de verdad para "de qué color es cada sección".
export type SiteNode = { name: string; href?: string; children?: SiteNode[] }

export const SITE_BRANCH_COLOR: Record<string, string> = {
  'HOME': '#00d4ff',
  'MANIFIESTO': '#ffb800',
  'FABRICACIÓN': '#5f95c9',
  'SUSTRATO': '#c87533',
  'PRIMER CUERPO': '#8aa0c9',
  'ESPECÍMENES': '#ff8c1a',
  'PROXYGAMES': '#00d4ff',
  'REALIDAD AUMENTADA': '#b400ff',
  'EXPERIMENTAL': '#cc0000',
  'PROXYVERSE': '#00ff9d',
  'CODEX COGITO': '#6644aa',
  'TIENDA': '#00ffcc',
}

export const SITE_TREE: SiteNode = {
  name: 'NEOPROXY',
  href: '/',
  children: [
    {
      name: 'HOME', href: '/',
      children: [
        { name: 'NUBE', href: '/home-3d' },
        { name: 'MAPA', href: '/home-grafico' },
        { name: 'SEÑAL', href: '/home-senal' },
        { name: 'GALERÍA', href: '/home-galeria' },
      ],
    },
    { name: 'MANIFIESTO', href: '/manifesto' },
    {
      name: 'FABRICACIÓN', href: '/fabrication',
      children: [
        { name: 'IMPRESIÓN 3D', href: '/fabrication' },
        { name: 'PEDIR IMPRESIÓN', href: '/imprimir' },
        { name: 'ARTEFACTOS', href: '/artifacts' },
      ],
    },
    {
      name: 'SUSTRATO', href: '/sustrato',
      children: [
        { name: 'FUNDAMENTOS', href: '/sustrato/fundamentos' },
        { name: 'ARDUINO', href: '/sustrato/arduino' },
        { name: 'SENSORES', href: '/sustrato/sensores' },
        { name: 'RASPBERRY PI', href: '/sustrato/raspberry-pi' },
        { name: 'JETSON', href: '/sustrato/jetson' },
        { name: 'STM32', href: '/sustrato/stm32' },
        { name: 'FPGA', href: '/sustrato/fpga' },
        { name: 'COMPARATIVA', href: '/sustrato/comparativa' },
      ],
    },
    { name: 'PRIMER CUERPO', href: '/lab/primercuerpo' },
    {
      name: 'ESPECÍMENES', href: '/especimenes',
      children: [
        { name: 'LABORATORIO', href: '/especimenes/laboratorio' },
        { name: 'LINAJE', href: '/especimenes/linaje' },
      ],
    },
    {
      name: 'PROXYGAMES', href: '/games',
      children: [
        { name: 'SHOOTER', href: '/games/shooter' },
        { name: 'TR1CK5T3R', href: '/games/trickster' },
        { name: 'ESPECTRO', href: '/games/spaceship' },
        { name: 'FREESTYLE // APRENDIZAJE', href: '/games/rap-aprendizaje' },
        { name: 'TR1CK5T3R // ESPEJO', href: '/games/trickster-mirror' },
        { name: 'FREESTYLE', href: '/games/rap' },
        { name: 'DIGIZ', href: '/games/digiz' },
        { name: 'MÖBIUS', href: '/games/mobius' },
        { name: 'FREESTYLE // VOZ', href: '/realidad-aumentada/freestyle' },
        { name: 'MIMOS VS PAYASOS', href: '/games/mimos-vs-payasos' },
      ],
    },
    {
      name: 'REALIDAD AUMENTADA', href: '/realidad-aumentada',
      children: [
        { name: 'NEOCAM', href: '/realidad-aumentada/neocam' },
        { name: 'MARCADOR', href: '/realidad-aumentada/marcador' },
      ],
    },
    {
      name: 'EXPERIMENTAL', href: '/experimental',
      children: [
        {
          name: 'LABORATORIO (6 MODOS)',
          children: [
            { name: 'WORKBENCH', href: '/experimental/workbench' },
            { name: 'ENJAMBRE', href: '/experimental/enjambre' },
            { name: 'DIALÉCTICA', href: '/experimental/dialectica' },
            { name: 'RED', href: '/experimental/red' },
            { name: 'MEMORIA', href: '/experimental/memoria' },
            { name: 'EVOLUCIÓN', href: '/experimental/evolucion' },
          ],
        },
        {
          name: 'CRUZA LOS 6',
          children: [
            { name: 'ORÁCULO', href: '/experimental/oraculo' },
            { name: 'SIGILO', href: '/experimental/sigilo' },
            { name: 'YI JING 易經', href: '/experimental/yijing' },
            { name: 'ACECHO', href: '/experimental/acecho' },
          ],
        },
        {
          name: 'CRIATURAS',
          children: [
            { name: 'MUDA', href: '/experimental/muda' },
            { name: 'RETAZOS', href: '/experimental/retazos' },
            { name: 'FORMACIÓN', href: '/experimental/formacion' },
          ],
        },
        {
          name: 'OTROS EXPERIMENTOS',
          children: [
            { name: 'PROXYGENESIS', href: '/lab/proxygenesis' },
            { name: 'LABORATORIO', href: '/lab' },
            { name: 'ATRACTORES DEL CAOS', href: '/lab/atractores' },
            { name: 'HEMIBRAIN', href: '/lab/hemibrain' },
            { name: 'WETWARE // HOLOGRAMA', href: '/lab/wetware' },
            { name: 'THE WIRED', href: '/games/wired' },
            { name: 'STARDUST', href: '/npos/stardust' },
            { name: 'ETÉREO', href: '/etereo' },
            { name: 'SYNTH', href: '/draw/synth' },
            { name: 'SCAN', href: '/experimental/scan' },
            { name: 'GRÁFICOS', href: '/experimental/graficos' },
          ],
        },
      ],
    },
    {
      name: 'PROXYVERSE', href: '/proxyverse',
      children: [
        { name: 'DARKPROXY', href: '/proxyverse/darkproxy' },
        { name: 'METATRON', href: '/proxyverse/metatron' },
        { name: 'D', href: '/proxyverse/d' },
        { name: 'SNAKE', href: '/proxyverse/snake' },
        { name: 'GENOS', href: '/proxyverse/genos' },
        { name: 'TRICKSTER', href: '/proxyverse/trickster' },
        { name: 'PROTOTYPE', href: '/proxyverse/prototype' },
      ],
    },
    {
      name: 'CODEX COGITO', href: '/knowledge',
      children: [
        {
          name: 'ENSAYO',
          children: [
            { name: 'FILOSOFÍA', href: '/knowledge/filosofia' },
            { name: 'SÍNTESIS', href: '/knowledge/sintesis' },
          ],
        },
        {
          name: 'REFERENCIA TÉCNICA',
          children: [
            { name: 'PARTÍCULAS', href: '/archivo/particulas' },
            { name: 'MENTE', href: '/archivo/mente' },
            { name: 'LENGUAJE', href: '/archivo/lenguaje' },
            { name: 'ALIMENTACIÓN', href: '/archivo/alimentacion' },
            { name: 'PRINCIPIO HOLOGRÁFICO', href: '/archivo/holografia' },
            { name: 'CIENCIA COGNITIVA', href: '/archivo/cognitiva' },
            { name: 'DINERO', href: '/archivo/dinero' },
            { name: 'METACOGNICIÓN', href: '/archivo/metacognicion' },
            { name: 'SEMIÓTICA', href: '/archivo/semiotica' },
            { name: 'HERMENÉUTICA', href: '/archivo/hermeneutica' },
            { name: 'AUTOORGANIZACIÓN', href: '/archivo/autoorganizacion' },
            { name: 'CIBERNÉTICA', href: '/archivo/cibernetica' },
            { name: 'COMPUTACIÓN CUÁNTICA', href: '/archivo/computacion-cuantica' },
            { name: 'REDES NEURONALES', href: '/archivo/redes-neuronales' },
            { name: 'ADN', href: '/archivo/adn' },
            { name: 'WETWARE', href: '/archivo/wetware' },
          ],
        },
        {
          name: 'ANÁLISIS CULTURAL',
          children: [
            { name: 'ERGO PROXY', href: '/archivo/ergoproxy' },
            { name: 'SERIAL EXPERIMENTS LAIN', href: '/archivo/lain' },
            { name: 'GHOST IN THE SHELL', href: '/archivo/gits' },
            { name: 'GIGER', href: '/archivo/giger' },
          ],
        },
        {
          name: 'TEORÍA DISPUTADA',
          children: [
            { name: 'JACOBO GRINBERG', href: '/archivo/grinberg' },
            { name: 'GARNIER MALET', href: '/archivo/garniermalet' },
          ],
        },
        {
          name: 'HERRAMIENTAS',
          children: [
            { name: 'ATLAS', href: '/knowledge/atlas' },
            { name: 'GRAN MAPA DEL CONOCIMIENTO', href: '/knowledge/mapa' },
          ],
        },
      ],
    },
    {
      name: 'TIENDA', href: '/shop',
      children: [
        { name: 'INSUMOS ELECTRÓNICOS', href: '/shop' },
        { name: 'IMPRESIÓN 3D', href: '/shop' },
        { name: 'MODELOS 3D', href: '/shop' },
        { name: 'ARTE GENERATIVO', href: '/shop/drop01' },
      ],
    },
  ],
}
