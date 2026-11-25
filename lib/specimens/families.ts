// Veintiséis algoritmos generativos puros y una familia de cruces (simbiosis). Cada una convierte una semilla en
// una receta (parámetros JSON) y cada receta en un campo escalar (f<0 adentro).
// Todas pasan por el mismo guard: la forma nunca toca el borde de la grilla y,
// con cierta probabilidad, lleva un corte plano abajo (base de apoyo).

import { mulberry32, range, int, pick, type Rng } from './rng'
import {
  type Field, type EnvelopeKind, ENVELOPES, envelope, smax, smin,
  sdCapsule, sdRoundBox,
} from './sdf'
import {
  sampleColonization, colonizationField, sampleShell, shellField, sampleNetwork, networkField,
  sampleAttractor, attractorField, sampleDLA, dlaField,
} from './fields-grow'
import {
  sampleTuring, turingField, sampleAutomaton, automatonField, sampleKIFS, kifsField,
  sampleAutopoiesis, autopoiesisField,
} from './fields-pattern'
import {
  sampleReaction, reactionField, sampleHilbert, hilbertField, samplePhyllotaxis, phyllotaxisField,
  sampleRuffle, ruffleField, sampleMandelbox, mandelboxField, sampleApollonian, apollonianField,
  sampleFlow, flowField, sampleVessel, vesselField, sampleFiligree, filigreeField,
} from './fields-art'
import { sampleSymbiosis, symbiosisField } from './symbiosis'

export type Family =
  | 'tpms' | 'metaballs' | 'harmonics' | 'superformula'
  | 'twist' | 'mandelbulb' | 'voronoi' | 'knot'
  | 'colonization' | 'shell' | 'turing' | 'automaton' | 'kifs'
  | 'network' | 'attractor' | 'dla' | 'autopoiesis'
  | 'reaction' | 'hilbert' | 'phyllotaxis' | 'ruffle' | 'mandelbox' | 'apollonian' | 'flow' | 'vessel' | 'filigree'
  | 'symbiosis'

// Algoritmos puros: son los únicos que pueden ser padres de un cruce.
export const PURE_FAMILIES: readonly Family[] = [
  'tpms', 'metaballs', 'harmonics', 'superformula', 'twist', 'mandelbulb', 'voronoi', 'knot',
  'colonization', 'shell', 'turing', 'automaton', 'kifs', 'network', 'attractor', 'dla', 'autopoiesis',
  'reaction', 'hilbert', 'phyllotaxis', 'ruffle', 'mandelbox', 'apollonian', 'flow', 'vessel', 'filigree',
]
export const FAMILIES: readonly Family[] = [...PURE_FAMILIES, 'symbiosis']

// Peso de cada familia al repartir cupos del salón (se puede ajustar sin tocar
// las recetas; ver PARENT_WEIGHT para el muestreo). Se fijó mirando hojas de contactos de cada algoritmo: lo que da piezas
// de obra (jarrones, filigrana, fibras, curvas) pesa más; lo que da grumos o
// cubos repetidos, menos. No es un juicio sobre los autores sino sobre lo que
// esta implementación produce.
export const FAMILY_WEIGHT: Record<Family, number> = {
  tpms: 1, metaballs: 0.4, harmonics: 0.25, superformula: 0.5, twist: 0.8, mandelbulb: 1, voronoi: 1, knot: 1,
  colonization: 0.8, shell: 0.9, turing: 1, automaton: 0.8, kifs: 1, network: 1, attractor: 1, dla: 0.9, autopoiesis: 1,
  reaction: 1.4, hilbert: 1.6, phyllotaxis: 0.5, ruffle: 0.35, mandelbox: 0.35, apollonian: 0.25, flow: 1.6, vessel: 2.2, filigree: 2,
  symbiosis: 1.6,
}

// Pesos de MUESTREO: deciden qué padres elige un cruce al derivar la receta de
// su semilla. Forman parte de la receta: cambiarlos cambia las piezas que ya
// existen, así que están congelados. Para ajustar qué entra al salón se toca
// FAMILY_WEIGHT, nunca esta tabla.
export const PARENT_WEIGHT: Record<Family, number> = {
  tpms: 1, metaballs: 0.6, harmonics: 0.5, superformula: 0.8, twist: 0.8, mandelbulb: 1, voronoi: 1, knot: 1,
  colonization: 0.8, shell: 0.9, turing: 1, automaton: 0.8, kifs: 1, network: 1, attractor: 1, dla: 0.9, autopoiesis: 1,
  reaction: 1.4, hilbert: 1.6, phyllotaxis: 0.6, ruffle: 0.5, mandelbox: 0.5, apollonian: 0.4, flow: 1.6, vessel: 2.2, filigree: 2,
  symbiosis: 1.6,
}

// Autor (id de THINKERS en components/proxygenesis/curated.ts) de cada familia.
export const AUTHOR_ID: Partial<Record<Family, string>> = {
  mandelbulb: 'mandelbrot', kifs: 'mandelbrot', colonization: 'runions-lane-prusinkiewicz',
  shell: 'raup', turing: 'prigogine', automaton: 'kauffman', network: 'barabasi',
  attractor: 'lorenz', dla: 'witten-sander', autopoiesis: 'maturana_varela', symbiosis: 'margulis',
  reaction: 'prigogine', hilbert: 'mandelbrot', mandelbox: 'mandelbrot', apollonian: 'mandelbrot', flow: 'lorenz',
}

export const FAMILY_LABEL: Record<Family, string> = {
  tpms: 'TPMS', metaballs: 'METABOLAS', harmonics: 'ARMÓNICOS', superformula: 'SUPERFÓRMULA',
  twist: 'TORSIÓN', mandelbulb: 'MANDELBULB', voronoi: 'VORONOI', knot: 'NUDO',
  colonization: 'COLONIZACIÓN', shell: 'CONCHA', turing: 'TURING', automaton: 'AUTÓMATA', kifs: 'FRACTAL PLEGADO',
  network: 'RED', attractor: 'ATRACTOR', dla: 'DLA', autopoiesis: 'AUTOPOIESIS', symbiosis: 'SIMBIOSIS',
  reaction: 'REACCIÓN-DIFUSIÓN', hilbert: 'HILBERT', phyllotaxis: 'FILOTAXIS', ruffle: 'VOLANTES', mandelbox: 'MANDELBOX',
  apollonian: 'APOLONIANA', flow: 'FLUJO', vessel: 'JARRÓN', filigree: 'FILIGRANA',
}

export const FAMILY_COLOR: Record<Family, string> = {
  tpms: '#00d4ff', metaballs: '#00ff9d', harmonics: '#ffb800', superformula: '#ff5e9e',
  twist: '#b400ff', mandelbulb: '#ff6b35', voronoi: '#7bff3d', knot: '#5f95c9',
  colonization: '#e0ff4f', shell: '#ffd9a0', turing: '#ff9ecf', automaton: '#9d7bff', kifs: '#ff3b3b',
  network: '#4fffe0', attractor: '#ff7a7a', dla: '#b8e0ff', autopoiesis: '#ffa94d', symbiosis: '#f2f0ff',
  reaction: '#ff8fb1', hilbert: '#59d8ff', phyllotaxis: '#c3ff68', ruffle: '#ff9bdc', mandelbox: '#ff5c5c',
  apollonian: '#ffc15c', flow: '#7cf0ff', vessel: '#e8d5a8', filigree: '#ffe9a8',
}

export const FAMILY_BLURB: Record<Family, string> = {
  tpms: 'Superficies mínimas triplemente periódicas (giroide, Schwarz P, diamante, Neovius): láminas con espesor que dividen el espacio en dos laberintos.',
  metaballs: 'Unión suave de cápsulas que ramifican como un coral: la forma es lo que queda cuando los volúmenes se funden.',
  harmonics: 'Una esfera modulada por ondas en latitud y longitud: planetas grumosos, semillas, órganos.',
  superformula: 'La superfórmula de Gielis (2003): una sola ecuación que reproduce estrellas, flores, conchas y cristales.',
  twist: 'Un polígono estrellado extruido y torcido a lo largo del eje: columnas, husos, tornillos.',
  mandelbulb: 'El fractal 3D de potencia n (White & Nylander, 2009), extraído por distancia estimada.',
  voronoi: 'Espuma o red de puntales a partir de celdas de Voronoi con puntos jitterizados.',
  knot: 'Tubos que siguen nudos tóricos (p,q): geometría de una sola línea cerrada sobre sí misma.',
  colonization: 'Colonización de espacio (Runions, Lane & Prusinkiewicz, 2007): la rama crece hacia nubes de atractores que desaparecen al ser alcanzados; el grosor sigue el modelo de tuberías.',
  shell: 'Enrollamiento de conchas de Raup: un círculo generador que se expande, se aleja del eje y se traslada. Tres números (W, D, T) recorren un morfoespacio entero de conchas.',
  turing: 'Patrón tipo Turing: ondas planas de igual longitud con fases al azar (la solución lineal de Swift–Hohenberg). La superficie es la frontera entre las dos fases. No simula reacción-difusión completa.',
  automaton: 'Autómata celular 3D: una semilla simétrica evoluciona con una regla de nacimiento y supervivencia hasta fijarse. Orden que nadie dibujó.',
  kifs: 'IFS caleidoscópico: plegar, rotar y escalar una y otra vez; la estimación de distancia da la superficie. Autosimilitud al estilo Mandelbrot.',
  network: 'Red libre de escala (Barabási–Albert): cada nodo nuevo se une de preferencia a los más conectados. El radio de cada nodo crece con su grado.',
  attractor: 'Atractor extraño (Lorenz, 1963, y sistemas afines: Rössler, Halvorsen, Chen): una trayectoria que nunca se repite, engrosada en un tubo.',
  dla: 'Agregación limitada por difusión (Witten & Sander, 1981): partículas que vagan al azar y se pegan al primer contacto. Crecen dendritas fractales.',
  autopoiesis: 'Célula autopoiética (Maturana & Varela): una membrana que encierra, con poros, y un núcleo sostenido por espigas. Metáfora geométrica, no simulación de autopoiesis.',
  reaction: 'Reacción-difusión 3D (Gray–Scott): simulación real de dos sustancias que se difunden y reaccionan. Según los parámetros aparecen manchas que se dividen, gusanos, laberintos o coral. Es el proceso del que hablaba Prigogine, no una imitación.',
  hilbert: 'Curva de Hilbert en 3D: una sola línea que recorre todo un volumen sin cortarse. Se redondean sus esquinas, se deforma el cubo (esfera, torsión, cono, toro) y el grosor pulsa a lo largo.',
  phyllotaxis: 'Filotaxis (Vogel, 1979): escamas puestas en ángulo áureo, de 137,5°, que crecen con la distancia al centro. Alcachofa, piña, protea o erizo según el perfil.',
  ruffle: 'Lámina hiperbólica: el borde crece más rápido que el centro y se pliega en ondas cada vez más finas, como una lechuga, un coral o una flor. Varias láminas giradas forman una rosa.',
  mandelbox: 'Mandelbox (Tom Lowe, 2010): pliegues de caja y de esfera repetidos con escala. Arquitectura fractal tallada de un bloque.',
  apollonian: 'Espuma apoloniana: inversiones sucesivas en esferas generan un empaquetamiento infinito de burbujas; la pieza es un trozo tallado de esa espuma.',
  flow: 'Haz de líneas de flujo: cientos de fibras nacen de un disco y siguen un campo sin divergencia con una corriente ascendente y un giro. Se trenzan como una llama o una medusa.',
  vessel: 'Jarrón o lámpara paramétrico: perfil de revolución con vientre y cuello, estrías con giro, costillas, borde y pie; la pared puede calarse (rombos, giroide o espuma de Voronoi).',
  filigree: 'Filigrana: una cáscara fina (esfera, huevo, domo o toro) calada por un patrón de ondas con simetría de mandala y bandas de latitud. Encaje de luz y sombra; los polos quedan macizos.',
  symbiosis: 'Simbiogénesis (Margulis): dos algoritmos se fusionan y nace una forma que ninguno daba solo. Siete modos de cruce; a veces el segundo padre ya es un híbrido.',
}

export type ParamValue = number | string | number[]
export type Params = Record<string, ParamValue>
export type Recipe = { family: Family; seed: number; params: Params; parents?: Recipe[] }

const num = (p: Params, k: string) => p[k] as number
const arr = (p: Params, k: string) => p[k] as number[]

// ---- muestreo de parámetros -------------------------------------------------

function commonParams(r: Rng): Params {
  return {
    env: pick(r, ENVELOPES),
    zCut: r() < 0.6 ? range(r, -0.78, -0.5) : -2,
    // acabado (se aplica a cualquier familia): simetría en caleidoscopio y micro-relieve
    fold: r() < 0.3 ? int(r, 3, 10) : 1,
    skin: pick(r, ['none', 'none', 'ridges', 'bands', 'pores'] as const),
    skinAmp: range(r, 0.008, 0.02), skinF: range(r, 16, 42),
  }
}

export function sampleRecipe(family: Family, seed: number, depth = 0): Recipe {
  const r = mulberry32(seed)
  const base = commonParams(r)
  let params: Params
  switch (family) {
    case 'colonization': params = sampleColonization(r, base); break
    case 'shell': params = sampleShell(r, base); break
    case 'turing': params = sampleTuring(r, base); break
    case 'automaton': params = sampleAutomaton(r, base); break
    case 'kifs': params = sampleKIFS(r, base); break
    case 'network': params = sampleNetwork(r, base); break
    case 'attractor': params = sampleAttractor(r, base); break
    case 'dla': params = sampleDLA(r, base); break
    case 'autopoiesis': params = sampleAutopoiesis(r, base); break
    case 'reaction': params = sampleReaction(r, base); break
    case 'hilbert': params = sampleHilbert(r, base); break
    case 'phyllotaxis': params = samplePhyllotaxis(r, base); break
    case 'ruffle': params = sampleRuffle(r, base); break
    case 'mandelbox': params = sampleMandelbox(r, base); break
    case 'apollonian': params = sampleApollonian(r, base); break
    case 'flow': params = sampleFlow(r, base); break
    case 'vessel': params = sampleVessel(r, base); break
    case 'filigree': params = sampleFiligree(r, base); break
    case 'symbiosis': {
      const sym = sampleSymbiosis(r, base, depth, PURE_FAMILIES, sampleRecipe, (f) => PARENT_WEIGHT[f] ** 2)
      return { family, seed, params: sym.params, parents: sym.parents }
    }
    case 'tpms':
      params = {
        ...base,
        kind: pick(r, ['gyroid', 'schwarzP', 'diamond', 'neovius'] as const),
        cells: range(r, 2.2, 5),
        thick: range(r, 0.16, 0.46),
        warp: r() < 0.5 ? range(r, 0.05, 0.3) : 0,
        warpFreq: range(r, 1.5, 4),
      }
      break
    case 'metaballs': {
      const n = int(r, 7, 16)
      const pts: number[][] = [[0, 0, -0.35, range(r, 0.2, 0.3)]]
      const segs: number[] = []
      for (let i = 0; i < n; i++) {
        const parent = pts[Math.floor(r() * pts.length)]
        const dx = range(r, -1, 1), dy = range(r, -1, 1), dz = range(r, -0.4, 1)
        const m = Math.hypot(dx, dy, dz) || 1
        const len = range(r, 0.18, 0.38)
        const clamp = (v: number) => Math.max(-0.72, Math.min(0.72, v))
        const nx = clamp(parent[0] + (dx / m) * len)
        const ny = clamp(parent[1] + (dy / m) * len)
        const nz = clamp(parent[2] + (dz / m) * len)
        const nr = Math.max(0.06, parent[3] * range(r, 0.82, 0.98))
        segs.push(parent[0], parent[1], parent[2], nx, ny, nz, nr)
        pts.push([nx, ny, nz, nr])
      }
      params = { ...base, segs, k: range(r, 0.07, 0.24) }
      break
    }
    case 'harmonics': {
      const n = int(r, 4, 7)
      const terms: number[] = []
      for (let i = 0; i < n; i++) {
        terms.push(range(r, 0.04, 0.2), int(r, 1, 5), int(r, 1, 4), range(r, 0, 6.28), range(r, 0, 6.28))
      }
      params = { ...base, baseR: range(r, 0.46, 0.62), terms }
      break
    }
    case 'superformula':
      params = {
        ...base,
        m1: int(r, 2, 9), m2: int(r, 2, 9),
        n1a: range(r, 0.4, 3), n2a: range(r, 0.6, 2.5), n3a: range(r, 0.6, 2.5),
        n1b: range(r, 0.4, 3), n2b: range(r, 0.6, 2.5), n3b: range(r, 0.6, 2.5),
      }
      break
    case 'twist':
      params = {
        ...base,
        sides: int(r, 3, 7), inner: range(r, 0.2, 0.62),
        turns: (r() < 0.5 ? -1 : 1) * range(r, 0.5, 2.2),
        taper: range(r, -0.35, 0.55), ripple: r() < 0.6 ? range(r, 0.03, 0.1) : 0,
        rippleFreq: int(r, 1, 5), R: range(r, 0.45, 0.7), h: range(r, 0.65, 0.85),
      }
      break
    case 'mandelbulb':
      params = {
        ...base,
        power: range(r, 4, 10), ax: range(r, 0, 6.28), ay: range(r, 0, 6.28),
        scale: range(r, 1.1, 1.35), thr: range(r, 0.012, 0.04),
      }
      break
    case 'voronoi':
      params = {
        ...base,
        density: range(r, 1.4, 3.2), jitter: range(r, 0.6, 1), t: range(r, 0.025, 0.07),
        mode: pick(r, ['walls', 'struts'] as const), hashSeed: int(r, 1, 1e6),
      }
      break
    case 'knot': {
      const pq = pick(r, [[2, 3], [2, 5], [3, 4], [3, 5], [2, 7], [4, 5]] as const)
      params = {
        ...base,
        p: pq[0], q: pq[1], R: range(r, 0.45, 0.55), minor: range(r, 0.18, 0.26),
        tube: range(r, 0.07, 0.15), copies: int(r, 1, 3), phase: range(r, 0.2, 1),
      }
      break
    }
  }
  return { family, seed, params }
}

// ---- campos por familia -----------------------------------------------------

const TAU = Math.PI * 2

function tpmsField(p: Params): Field {
  const w = Math.PI * num(p, 'cells')
  const t = num(p, 'thick'), kind = p.kind as string
  const warp = num(p, 'warp'), wf = num(p, 'warpFreq')
  const env = p.env as EnvelopeKind
  return (x, y, z) => {
    if (warp) {
      const ox = warp * Math.sin(wf * y + 1.3), oy = warp * Math.sin(wf * z + 2.1), oz = warp * Math.sin(wf * x + 0.7)
      x += ox; y += oy; z += oz
    }
    const X = x * w, Y = y * w, Z = z * w
    let g: number, scale: number
    switch (kind) {
      case 'gyroid': g = Math.sin(X) * Math.cos(Y) + Math.sin(Y) * Math.cos(Z) + Math.sin(Z) * Math.cos(X); scale = 1.5; break
      case 'schwarzP': g = Math.cos(X) + Math.cos(Y) + Math.cos(Z); scale = 3; break
      case 'diamond':
        g = Math.sin(X) * Math.sin(Y) * Math.sin(Z) + Math.sin(X) * Math.cos(Y) * Math.cos(Z)
          + Math.cos(X) * Math.sin(Y) * Math.cos(Z) + Math.cos(X) * Math.cos(Y) * Math.sin(Z)
        scale = 1.5; break
      default: g = 3 * (Math.cos(X) + Math.cos(Y) + Math.cos(Z)) + 4 * Math.cos(X) * Math.cos(Y) * Math.cos(Z); scale = 13
    }
    const sheet = (Math.abs(g) / scale - t) * 0.5
    return smax(sheet, envelope(env, x, y, z), 0.05)
  }
}

function metaballsField(p: Params): Field {
  const segs = arr(p, 'segs'), k = num(p, 'k')
  return (x, y, z) => {
    let d = 1e9
    for (let i = 0; i < segs.length; i += 7) {
      const c = sdCapsule(x, y, z, segs[i], segs[i + 1], segs[i + 2], segs[i + 3], segs[i + 4], segs[i + 5], segs[i + 6])
      d = i === 0 ? c : smin(d, c, k)
    }
    return d
  }
}

function harmonicsField(p: Params): Field {
  const terms = arr(p, 'terms'), baseR = num(p, 'baseR')
  return (x, y, z) => {
    const rho = Math.hypot(x, y, z) || 1e-9
    const th = Math.atan2(y, x), ph = Math.acos(Math.max(-1, Math.min(1, z / rho)))
    let rad = baseR
    for (let i = 0; i < terms.length; i += 5) {
      rad += terms[i] * Math.sin(terms[i + 1] * th + terms[i + 3]) * Math.sin(terms[i + 2] * ph + terms[i + 4])
    }
    return rho - Math.max(0.16, Math.min(0.9, rad))
  }
}

function superformulaField(p: Params): Field {
  const m1 = num(p, 'm1'), m2 = num(p, 'm2')
  const sf = (ang: number, m: number, n1: number, n2: number, n3: number) =>
    Math.pow(Math.pow(Math.abs(Math.cos((m * ang) / 4)), n2) + Math.pow(Math.abs(Math.sin((m * ang) / 4)), n3), -1 / n1)
  const radius = (th: number, ph: number) =>
    sf(th, m1, num(p, 'n1a'), num(p, 'n2a'), num(p, 'n3a')) * sf(ph, m2, num(p, 'n1b'), num(p, 'n2b'), num(p, 'n3b'))
  // se normaliza por el radio máximo real de esta receta: así el rango
  // completo de la forma (puntas, pétalos) usa todo el espacio, en vez de
  // comprimirse hacia una esfera.
  let maxR = 1e-6
  for (let i = 0; i < 48; i++) for (let j = 0; j <= 24; j++) {
    const R = radius((i / 48) * TAU - Math.PI, (j / 24) * Math.PI - Math.PI / 2)
    if (isFinite(R) && R > maxR) maxR = R
  }
  const k = 0.9 / maxR
  return (x, y, z) => {
    const rho = Math.hypot(x, y, z) || 1e-9
    const th = Math.atan2(y, x), ph = Math.asin(Math.max(-1, Math.min(1, z / rho)))
    const R = radius(th, ph)
    return rho - Math.max(0.1, Math.min(0.92, (isFinite(R) ? R : 0) * k))
  }
}

function twistField(p: Params): Field {
  const sides = num(p, 'sides'), inner = num(p, 'inner'), turns = num(p, 'turns')
  const taper = num(p, 'taper'), ripple = num(p, 'ripple'), rf = num(p, 'rippleFreq')
  const R = num(p, 'R'), h = num(p, 'h')
  return (x, y, z) => {
    const a = turns * Math.PI * z
    const c = Math.cos(a), s = Math.sin(a)
    const u = x * c - y * s, v = x * s + y * c
    const th = Math.atan2(v, u), r = Math.hypot(u, v)
    const star = R * (1 - inner * (0.5 + 0.5 * Math.cos(sides * th)))
    const prof = star * (1 - taper * (z + 1) * 0.5) + ripple * Math.sin(rf * z * Math.PI)
    return smax(r - prof, Math.abs(z) - h, 0.05)
  }
}

function mandelbulbField(p: Params): Field {
  const power = num(p, 'power'), sc = num(p, 'scale'), thr = num(p, 'thr')
  const cx = Math.cos(num(p, 'ax')), sx = Math.sin(num(p, 'ax'))
  const cy = Math.cos(num(p, 'ay')), sy = Math.sin(num(p, 'ay'))
  return (px, py, pz) => {
    // rotación fija de la receta, para que cada bulbo apunte distinto
    let x = px * cy + pz * sy, z = -px * sy + pz * cy, y = py
    const y2 = y * cx - z * sx; z = y * sx + z * cx; y = y2
    const cxp = x * sc, cyp = y * sc, czp = z * sc
    let wx = cxp, wy = cyp, wz = czp, dr = 1, r = 0
    for (let i = 0; i < 7; i++) {
      r = Math.hypot(wx, wy, wz)
      if (r > 2) {
        const de = 0.5 * Math.log(r) * r / dr
        return de / sc - thr
      }
      const theta = Math.acos(wz / r) * power, phi = Math.atan2(wy, wx) * power
      dr = Math.pow(r, power - 1) * power * dr + 1
      const rp = Math.pow(r, power)
      wx = rp * Math.sin(theta) * Math.cos(phi) + cxp
      wy = rp * Math.sin(theta) * Math.sin(phi) + cyp
      wz = rp * Math.cos(theta) + czp
    }
    return -thr
  }
}

function hash3(ix: number, iy: number, iz: number, seed: number) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 1274126177) ^ Math.imul(seed, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

function voronoiField(p: Params): Field {
  const s = num(p, 'density'), jit = num(p, 'jitter'), t = num(p, 't'), seed = num(p, 'hashSeed')
  const walls = p.mode === 'walls', env = p.env as EnvelopeKind
  return (x, y, z) => {
    const fx = x * s, fy = y * s, fz = z * s
    const ix = Math.floor(fx), iy = Math.floor(fy), iz = Math.floor(fz)
    let f1 = 1e9, f2 = 1e9, f3 = 1e9
    for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const cx = ix + dx, cy = iy + dy, cz = iz + dz
      const px = cx + 0.5 + (hash3(cx, cy, cz, seed) - 0.5) * jit
      const py = cy + 0.5 + (hash3(cx, cy, cz, seed + 17) - 0.5) * jit
      const pz = cz + 0.5 + (hash3(cx, cy, cz, seed + 31) - 0.5) * jit
      const d = Math.hypot(px - fx, py - fy, pz - fz) / s
      if (d < f1) { f3 = f2; f2 = f1; f1 = d } else if (d < f2) { f3 = f2; f2 = d } else if (d < f3) f3 = d
    }
    const lattice = ((walls ? f2 : f3) - f1) * 0.5 - t
    return smax(lattice, envelope(env, x, y, z), 0.04)
  }
}

function knotField(p: Params): Field {
  const P = num(p, 'p'), Q = num(p, 'q'), R = num(p, 'R'), minor = num(p, 'minor')
  const tube = num(p, 'tube'), copies = num(p, 'copies'), phase = num(p, 'phase')
  const SEG = 90
  const curves: number[][] = []
  let maxExt = 0
  for (let c = 0; c < copies; c++) {
    const pts: number[] = []
    for (let i = 0; i <= SEG; i++) {
      const t = (i / SEG) * TAU
      const rr = R + minor * Math.cos(Q * t + c * phase)
      const x = rr * Math.cos(P * t), y = rr * Math.sin(P * t), z = minor * Math.sin(Q * t + c * phase)
      pts.push(x, y, z)
      maxExt = Math.max(maxExt, Math.hypot(x, y, z))
    }
    curves.push(pts)
  }
  const fit = Math.min(1, 0.86 / (maxExt + tube))
  const rad = tube * fit
  // segmentos con su punto medio y semilongitud: la cota inferior
  // |p - medio| - semilongitud - radio descarta casi todos sin evaluarlos.
  const segs: number[] = []
  for (const pts of curves) {
    for (let i = 0; i < SEG; i++) {
      const j = i * 3
      const ax = pts[j] * fit, ay = pts[j + 1] * fit, az = pts[j + 2] * fit
      const bx = pts[j + 3] * fit, by = pts[j + 4] * fit, bz = pts[j + 5] * fit
      segs.push(ax, ay, az, bx, by, bz, (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, Math.hypot(bx - ax, by - ay, bz - az) / 2)
    }
  }
  return (x, y, z) => {
    let d = 1e9
    for (let s = 0; s < segs.length; s += 10) {
      const lb = Math.hypot(x - segs[s + 6], y - segs[s + 7], z - segs[s + 8]) - segs[s + 9] - rad
      if (lb >= d) continue
      const c = sdCapsule(x, y, z, segs[s], segs[s + 1], segs[s + 2], segs[s + 3], segs[s + 4], segs[s + 5], rad)
      if (c < d) d = c
    }
    return d
  }
}

const BUILDERS: Record<Exclude<Family, 'symbiosis'>, (p: Params) => Field> = {
  tpms: tpmsField, metaballs: metaballsField, harmonics: harmonicsField,
  superformula: superformulaField, twist: twistField, mandelbulb: mandelbulbField,
  voronoi: voronoiField, knot: knotField,
  colonization: colonizationField, shell: shellField, turing: turingField, automaton: automatonField,
  kifs: kifsField, network: networkField, attractor: attractorField, dla: dlaField,
  autopoiesis: autopoiesisField,
  reaction: reactionField, hilbert: hilbertField, phyllotaxis: phyllotaxisField, ruffle: ruffleField,
  mandelbox: mandelboxField, apollonian: apollonianField, flow: flowField, vessel: vesselField, filigree: filigreeField,
}

// Campo de una receta sin el guard final: así lo usan los padres de un cruce.
export function rawField(recipe: Recipe): Field {
  if (recipe.family === 'symbiosis') {
    const [a, b] = recipe.parents!
    return symbiosisField(recipe.params, rawField(a), rawField(b))
  }
  return BUILDERS[recipe.family](recipe.params)
}

export function buildField(recipe: Recipe): Field {
  const raw = rawField(recipe)
  const P = recipe.params
  const zCut = num(P, 'zCut')
  const foldN = (P.fold as number) ?? 1
  const sector = TAU / foldN
  const skin = (P.skin as string) ?? 'none'
  const skinAmp = (P.skinAmp as number) ?? 0, skinF = (P.skinF as number) ?? 0
  return (x, y, z) => {
    let px = x, py = y
    if (foldN > 1) {
      // simetría dihedral de orden foldN: se pliega el ángulo a medio sector
      const rho = Math.hypot(x, y)
      let th = Math.atan2(y, x)
      th -= sector * Math.floor(th / sector)
      if (th > sector / 2) th = sector - th
      px = rho * Math.cos(th); py = rho * Math.sin(th)
    }
    let f = raw(px, py, z)
    if (skin !== 'none') {
      const sx = skinF
      f += skinAmp * (skin === 'ridges' ? Math.sin(sx * Math.hypot(px, py, z))
        : skin === 'bands' ? Math.sin(sx * z + 3 * Math.atan2(py, px))
        : (Math.sin(sx * px) * Math.cos(sx * py) + Math.sin(sx * py) * Math.cos(sx * z) + Math.sin(sx * z) * Math.cos(sx * px)) / 1.5)
    }
    f = smax(f, sdRoundBox(x, y, z, 0.93, 0.93, 0.93, 0.05), 0.02)
    if (zCut > -1) f = smax(f, zCut - z, 0.03)
    return f
  }
}
