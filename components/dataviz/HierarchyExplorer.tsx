'use client'

// Explorador de jerarquías reutilizable: la misma data (un árbol real, sin
// inventar), vista en 3 layouts distintos de d3-hierarchy -- árbol radial
// (dendrograma), círculos anidados (pack) y mosaico (treemap). D3 hace
// toda la matemática de posiciones; el render es JSX/SVG de React, mismo
// criterio que el resto de /experimental/graficos. Zoom/pan implementado
// a mano con eventos de puntero/rueda de React (sin d3-zoom/d3-select),
// mismo motivo que la red de fuerzas: un solo dueño del DOM.

import { useMemo, useRef, useState } from 'react'
import { hierarchy, cluster as d3cluster, pack as d3pack, treemap as d3treemap, linkRadial } from 'd3'

const mono = "'Space Mono', monospace"

export type HNode = { name: string; href?: string; children?: HNode[] }
export type ExplorerLayout = 'radial' | 'pack' | 'treemap'
// lo mínimo que se usa de un nodo de d3-hierarchy ya posicionado
type NodoH = { depth: number; x: number; y: number; r: number; data: HNode; children?: NodoH[]; descendants: () => NodoH[] }

const LAYOUTS: { id: ExplorerLayout; label: string }[] = [
  { id: 'radial', label: 'ÁRBOL RADIAL' },
  { id: 'pack', label: 'CÍRCULOS' },
  { id: 'treemap', label: 'MOSAICO' },
]

export function HierarchyExplorer({
  data, branchColor, accent, initialLayout = 'radial', immersive = false,
}: {
  data: HNode
  // color real por rama de primer nivel (depth 1) -- se hereda a todos sus descendientes
  branchColor: Record<string, string>
  accent: string
  initialLayout?: ExplorerLayout
  // Modo home: el mapa solo, a pantalla completa, sin botones ni textos. Al tocar una rama
  // (o un círculo) la vista se acerca a ella con una animación; tocar el fondo o el centro
  // vuelve a la vista completa. Las hojas son enlaces con un área de toque grande. El
  // árbol radial se achica lo justo para que no se corten las etiquetas largas.
  immersive?: boolean
}) {
  const [layout, setLayout] = useState<ExplorerLayout>(initialLayout)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const [anim, setAnim] = useState(false) // transición suave solo al acercar a una rama
  const [focusId, setFocusId] = useState<string | null>(null)
  const movedRef = useRef(false) // el último gesto fue un arrastre: no cuenta como toque
  const svgRef = useRef<SVGSVGElement>(null)
  // espejo síncrono de `transform` -- lo necesita recomputeGesture() para
  // leer el valor MÁS RECIENTE en medio de un gesto ya en curso (un dedo
  // se levanta durante un pinch y hay que retomar como pan desde ahí), sin
  // depender del closure de cuando empezó el gesto, que para entonces
  // puede estar desactualizado.
  const transformRef = useRef(transform)
  transformRef.current = transform
  // un puntero por dedo real en pantalla -- antes se asumía un solo dedo
  // (un pinch de dos dedos generaba dos pointerdown independientes que se
  // pisaban entre sí y terminaba leyendo un ref ya en null: el crash real
  // reportado al hacer zoom en mobile, reproducido con Playwright
  // simulando dos punteros reales antes de este fix).
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const gestureRef = useRef<
    | { mode: 'pan'; startX: number; startY: number; origX: number; origY: number }
    | { mode: 'pinch'; startDist: number; origK: number }
    | null
  >(null)

  const W = immersive ? 1000 : 900, H = immersive ? 1000 : 900
  const KMAX = immersive ? 12 : 6
  const FS = immersive ? { leaf: 10.5, d1: 13, d2: 11.5, root: 14 } : { leaf: 7.5, d1: 11, d2: 9.5, root: 9.5 }

  const root = useMemo(() => {
    return hierarchy(data)
      .sum((d) => (d.children && d.children.length ? 0 : 1))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  }, [data])

  const colorMap = useMemo(() => {
    const map = new Map<any, string>()
    root.each((node) => {
      if (node.depth === 0) map.set(node, '#ffffff')
      else if (node.depth === 1) map.set(node, branchColor[node.data.name] ?? accent)
      else map.set(node, map.get(node.parent) ?? accent)
    })
    return map
  }, [root, branchColor, accent])

  // radio del árbol: en el modo home se calcula para que la etiqueta más larga quepa dentro
  // del lienzo (antes «HUMO SÓLIDO» y otras se cortaban en el borde)
  const maxEtiqueta = Math.max(...root.leaves().map((n: { data: HNode }) => String(n.data.name).length))
  const RADIO = immersive ? Math.min(400, W / 2 - 16 - maxEtiqueta * FS.leaf * 0.6) : 420

  // los 3 layouts de d3-hierarchy mutan x/y (o x0..y1, o r) directo sobre
  // los mismos nodos de `root` -- este bloque solo dispara el recálculo al
  // cambiar de layout, la lectura real pasa en el JSX de abajo.
  if (layout === 'radial') {
    // separation() más ancha que el default de d3 (1 entre hermanos, 2
    // entre primos) -- con ramas de muchos hijos (ej. COMPUTACIÓN), el
    // default dejaba las etiquetas de hojas adyacentes superpuestas en el
    // borde exterior (bug de legibilidad real, no densidad buscada).
    d3cluster().size([Math.PI * 2, RADIO]).separation((a: any, b: any) => (a.parent === b.parent ? 1.6 : 2.8))(root as any)
  } else if (layout === 'pack') {
    d3pack().size([W, H]).padding(immersive ? 6 : 3)(root as any)
  } else {
    d3treemap().size([W, H]).paddingInner(2).paddingOuter(3).round(true)(root as any)
  }

  const totalLeaves = root.leaves().length

  const changeLayout = (l: ExplorerLayout) => {
    setLayout(l)
    setTransform({ x: 0, y: 0, k: 1 })
    setFocusId(null)
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const factor = Math.exp(-e.deltaY * 0.0012)
    if (anim) setAnim(false)
    setTransform((t) => ({ ...t, k: Math.min(KMAX, Math.max(immersive ? 0.6 : 0.25, t.k * factor)) }))
  }

  // recalcula el origen del gesto activo a partir de los punteros que
  // quedan vivos en pointersRef -- se llama tanto al agregar un dedo
  // (pasar de pan a pinch) como al sacar uno (de pinch de vuelta a pan,
  // retomando desde la posición y escala actuales, sin salto).
  const recomputeGesture = () => {
    const pts = [...pointersRef.current.values()]
    if (pts.length === 1) {
      gestureRef.current = { mode: 'pan', startX: pts[0].x, startY: pts[0].y, origX: transformRef.current.x, origY: transformRef.current.y }
    } else if (pts.length >= 2) {
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1
      gestureRef.current = { mode: 'pinch', startDist: dist, origK: transformRef.current.k }
    } else {
      gestureRef.current = null
    }
  }

  const resetAnimado = () => { setAnim(true); setFocusId(null); setTransform({ x: 0, y: 0, k: 1 }) }

  // encuadra un nodo y todo lo que cuelga de él: calcula su caja (con el largo de las
  // etiquetas) y el zoom que la hace caber en lo que se ve de la pantalla, sea apaisada o vertical
  const acercar = (d: NodoH) => {
    if (d.depth === 0) { resetAnimado(); return }
    const el = svgRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const s0 = Math.min(r.width / W, r.height / H) || 1
    const visW = r.width / s0, visH = r.height / s0
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
    const abarca = (x: number, y: number) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
    if (layout === 'radial') {
      d.descendants().forEach((n) => {
        const a = n.x - Math.PI / 2, x = Math.cos(a) * n.y, y = Math.sin(a) * n.y
        const ext = n.children ? 14 : String(n.data.name).length * FS.leaf * 0.6 + 14
        abarca(x, y); abarca(x + Math.cos(a) * ext, y + Math.sin(a) * ext)
      })
    } else {
      abarca(d.x - d.r, d.y - d.r); abarca(d.x + d.r, d.y + d.r)
    }
    const k = Math.min(KMAX, Math.max(1, Math.min(visW / (x1 - x0 + 70), visH / (y1 - y0 + 70))))
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
    setAnim(true)
    setFocusId(`${d.depth}:${d.data.name}`)
    setTransform(layout === 'radial' ? { x: -k * cx, y: -k * cy, k } : { x: W / 2 - k * cx, y: H / 2 - k * cy, k })
  }
  // toque en una rama: la primera vez se acerca; si ya estaba encuadrada y tiene página propia, entra
  const tocarNodo = (d: NodoH) => {
    if (movedRef.current) return
    const id = `${d.depth}:${d.data.name}`
    if (focusId === id && d.data.href) { window.location.assign(d.data.href); return }
    acercar(d)
  }

  const onPointerDownBg = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('a')) return
    if (anim) setAnim(false)
    movedRef.current = false
    const inicio = { x: e.clientX, y: e.clientY }
    const sobreNodo = !!(e.target as Element).closest('[data-nodo]')
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    recomputeGesture()

    const onMove = (ev: PointerEvent) => {
      if (!pointersRef.current.has(ev.pointerId)) return
      if (Math.hypot(ev.clientX - inicio.x, ev.clientY - inicio.y) > 6) movedRef.current = true
      pointersRef.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
      const g = gestureRef.current
      if (!g) return
      if (g.mode === 'pan') {
        // números ya calculados acá, no refs leídos adentro del updater --
        // la causa real del crash era leer panRef.current dentro del
        // callback de setTransform, que puede ejecutarse después de que
        // otro evento (el pointerup del otro dedo) ya lo puso en null.
        const nx = g.origX + (ev.clientX - g.startX)
        const ny = g.origY + (ev.clientY - g.startY)
        setTransform((t) => ({ ...t, x: nx, y: ny }))
      } else {
        const pts = [...pointersRef.current.values()]
        if (pts.length < 2) return
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1
        const nk = Math.min(KMAX, Math.max(immersive ? 0.6 : 0.25, g.origK * (dist / g.startDist)))
        setTransform((t) => ({ ...t, k: nk }))
      }
    }
    const onUpOrCancel = (ev: PointerEvent) => {
      pointersRef.current.delete(ev.pointerId)
      recomputeGesture()
      if (pointersRef.current.size === 0) {
        // un toque en el fondo (sin arrastrar) con la vista acercada: vuelve al mapa completo
        if (immersive && ev.type === 'pointerup' && !movedRef.current && !sobreNodo && transformRef.current.k > 1.02) resetAnimado()
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUpOrCancel)
        window.removeEventListener('pointercancel', onUpOrCancel)
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUpOrCancel)
    window.addEventListener('pointercancel', onUpOrCancel)
  }

  const resetView = () => setTransform({ x: 0, y: 0, k: 1 })

  return (
    <div style={immersive ? { height: '100%' } : undefined}>
      {!immersive && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        {LAYOUTS.map((l) => (
          <button
            key={l.id}
            onClick={() => changeLayout(l.id)}
            className="press"
            style={{
              fontFamily: mono, fontSize: 10.5, letterSpacing: 1.5, padding: '7px 12px', borderRadius: 6, cursor: 'pointer',
              background: layout === l.id ? `${accent}33` : 'transparent',
              // antes #2a3a50/#4a6080 en el estado inactivo -- leía como
              // deshabilitado, no como una opción disponible todavía sin
              // elegir (problema de affordance real, revisado contra la
              // skill de diseño).
              border: `1px solid ${layout === l.id ? accent : '#4a6080'}`,
              color: layout === l.id ? accent : '#8fa8c4',
            }}
          >
            {l.label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button onClick={resetView} className="press" style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 1, padding: '7px 12px', borderRadius: 6, cursor: 'pointer', background: 'transparent', border: '1px solid #4a6080', color: '#8fa8c4' }}>
          RESET VISTA
        </button>
        <span style={{ fontFamily: mono, fontSize: 10.5, color: '#6f86a3', letterSpacing: 1 }}>{totalLeaves} HOJAS</span>
      </div>}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={immersive
          ? { width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none' }
          : { minWidth: 320, maxHeight: '80vh', display: 'block', touchAction: 'none', cursor: gestureRef.current ? 'grabbing' : 'grab', background: 'radial-gradient(circle at center, #060a14 0%, #01040a 70%)' }}
        onWheel={onWheel}
        onPointerDown={onPointerDownBg}
      >
        <g
          transform={immersive ? undefined : layout === 'radial' ? `translate(${W / 2 + transform.x},${H / 2 + transform.y}) scale(${transform.k})` : `translate(${transform.x},${transform.y}) scale(${transform.k})`}
          style={immersive ? {
            transform: layout === 'radial' ? `translate(${W / 2 + transform.x}px, ${H / 2 + transform.y}px) scale(${transform.k})` : `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
            transition: anim ? 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)' : 'none',
          } : undefined}
        >
          {layout === 'radial' && (root as any).links().map((l: any, i: number) => {
            const gen = linkRadial<any, any>().angle((d: any) => d.x).radius((d: any) => d.y)
            return <path key={i} d={gen(l) ?? undefined} fill="none" stroke={`${colorMap.get(l.target)}${immersive ? '66' : '44'}`} strokeWidth={immersive ? 1.3 : 1} />
          })}

          {layout === 'radial' && root.descendants().map((d: any, i: number) => {
            const angle = d.x - Math.PI / 2
            const x = Math.cos(angle) * d.y, y = Math.sin(angle) * d.y
            const isLeaf = !d.children
            const flip = d.x >= Math.PI
            const rotateDeg = (d.x * 180) / Math.PI - 90
            const color = colorMap.get(d)
            const enfocado = immersive && focusId === `${d.depth}:${d.data.name}` && !!d.data.href
            const label = (
              <text
                transform={`rotate(${rotateDeg}) ${flip ? 'scale(-1,-1)' : ''}`}
                textAnchor={flip ? 'end' : 'start'}
                dx={flip ? -8 : 8} dy={3}
                fontSize={isLeaf ? FS.leaf : d.depth === 1 ? FS.d1 : d.depth === 0 ? FS.root : FS.d2}
                fontFamily={mono} fill={d.depth === 0 ? '#fff' : color}
                textDecoration={enfocado ? 'underline' : undefined}
                style={immersive ? { paintOrder: 'stroke', stroke: '#01040a', strokeWidth: 3, strokeLinejoin: 'round' } : undefined}
              >
                {d.data.name}{enfocado ? ' ↗' : ''}
              </text>
            )
            // modo home: las hojas son enlaces (con un área de toque grande); las ramas se acercan al tocarlas
            const hoja = immersive ? isLeaf && d.data.href : d.data.href
            return (
              <g key={i} transform={`translate(${x},${y})`} data-nodo={immersive && !isLeaf ? '' : undefined} onClick={immersive && !isLeaf ? () => tocarNodo(d) : undefined} style={immersive && !isLeaf ? { cursor: 'pointer' } : undefined}>
                <circle r={d.depth === 0 ? (immersive ? 9 : 7) : isLeaf ? (immersive ? 3.4 : 2.6) : immersive ? 6.5 : 5} fill={d.depth === 0 ? '#fff' : color} />
                {immersive && !hoja && <circle r={isLeaf ? 10 : d.depth === 0 ? 20 : 17} fill="transparent" />}
                {hoja ? <a href={d.data.href}>{immersive && <circle r={11} fill="transparent" />}{label}</a> : label}
                <title>{d.data.name}{d.data.href ? ` — ${d.data.href}` : ''}</title>
              </g>
            )
          })}

          {layout === 'pack' && root.descendants().map((d: any, i: number) => {
            const isLeaf = !d.children
            const color = colorMap.get(d)
            // modo home: el texto de cada hoja se ajusta al ancho de su círculo (no se sale) y se muestra
            // solo cuando, con el zoom actual, quedaría legible; los nombres de ramas internas aparecen
            // al acercarse, así no se amontonan en la vista general
            const ajuste = immersive ? Math.min(17, (d.r * 1.8) / (String(d.data.name).length * 0.6)) : 0
            const verEtiqueta = immersive
              ? d.depth > 0 && (isLeaf ? ajuste * transform.k >= 9 : d.depth === 1 ? d.r * transform.k > 15 : d.r * transform.k > 130)
              : d.r > 16
            return (
              <g key={i} transform={`translate(${d.x},${d.y})`}>
                {isLeaf ? (
                  d.data.href ? (
                    <a href={d.data.href}>
                      <circle r={d.r} fill={color} fillOpacity={0.6} stroke={color} strokeWidth={1} />
                    </a>
                  ) : (
                    <circle r={d.r} fill={color} fillOpacity={0.6} stroke={color} strokeWidth={1} />
                  )
                ) : immersive ? (
                  // circulo de una rama: toda su superficie recibe el toque (los hijos quedan encima)
                  <circle data-nodo="" onClick={() => tocarNodo(d)} r={d.r} fill="transparent" stroke={color} strokeOpacity={0.6} strokeWidth={d.depth === 1 ? 2.2 : 1.2} style={{ cursor: 'pointer' }} />
                ) : (
                  <circle r={d.r} fill="none" stroke={color} strokeOpacity={0.55} strokeWidth={d.depth === 1 ? 2 : 1} />
                )}
                {verEtiqueta && (
                  <text
                    textAnchor="middle" y={isLeaf ? (immersive ? ajuste / 3 : 3) : -d.r + 13}
                    fontSize={immersive ? (isLeaf ? ajuste : Math.min(17, Math.max(7.5, d.r / 3.4))) : Math.min(11, Math.max(6.5, d.r / 4))} fontFamily={mono}
                    fill={isLeaf ? '#01040a' : color} style={{ pointerEvents: 'none' }}
                  >
                    {d.data.name}
                  </text>
                )}
                <title>{d.data.name}{d.data.href ? ` — ${d.data.href}` : ''}</title>
              </g>
            )
          })}

          {layout === 'treemap' && root.descendants().map((d: any, i: number) => {
            const w = d.x1 - d.x0, h = d.y1 - d.y0
            const isLeaf = !d.children
            const color = colorMap.get(d)
            const maxChars = Math.max(0, Math.floor(w / 5.2))
            const label = d.data.name.length > maxChars ? `${d.data.name.slice(0, Math.max(0, maxChars - 1))}…` : d.data.name
            return (
              <g key={i} transform={`translate(${d.x0},${d.y0})`}>
                {isLeaf ? (
                  d.data.href ? (
                    <a href={d.data.href}>
                      <rect width={w} height={h} fill={color} fillOpacity={0.55} stroke={color} strokeWidth={1} />
                    </a>
                  ) : (
                    <rect width={w} height={h} fill={color} fillOpacity={0.55} stroke={color} strokeWidth={1} />
                  )
                ) : (
                  <rect width={w} height={h} fill="none" stroke={color} strokeOpacity={0.6} strokeWidth={d.depth === 1 ? 2 : 1} />
                )}
                {isLeaf && w > 26 && h > 12 && (
                  <text x={4} y={12} fontSize={Math.min(9, h / 2.2)} fontFamily={mono} fill="#01040a" style={{ pointerEvents: 'none' }}>{label}</text>
                )}
                <title>{d.data.name}{d.data.href ? ` — ${d.data.href}` : ''}</title>
              </g>
            )
          })}
        </g>
      </svg>
      {!immersive && <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1, color: '#6f86a3', marginTop: 8 }}>
        ARRASTRÁ PARA MOVER, RUEDA PARA ZOOM — EL COLOR HEREDA DE LA RAMA DE PRIMER NIVEL, NO ES DECORATIVO
      </div>}
    </div>
  )
}
