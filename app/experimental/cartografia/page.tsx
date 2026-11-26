'use client'

// CARTOGRAFÍA — pedido explícito: gráficos masivos, con mucha información
// real, vistos de varias formas. Dos árboles reales completos (no
// recortados para que se vean lindos):
//
//  I.  EL SITIO ENTERO — cada ruta real del sitio (components/dataviz/
//      siteTree.ts, verificado contra nav-config.ts y el catálogo propio
//      de cada sección), 123 nodos (el conteo real es dinámico --
//      {countNodes(SITE_TREE)} más abajo -- este número es solo
//      documentación, se actualiza solo con el árbol).
//  II. EL CODEX ENTERO — los 88 nombres reales de /knowledge
//      (components/knowledge/entries.ts), agrupados por sus 7 clusters
//      reales -- "las ramas de todos los conceptos" pedidas.
//
// Mismo HierarchyExplorer para los dos (ver components/dataviz/
// HierarchyExplorer.tsx): 3 layouts de d3-hierarchy (árbol radial,
// círculos anidados, mosaico) sobre la misma data, con zoom/pan real --
// a esta densidad de nodos, sin zoom no se puede leer nada.
// Import dinámico sin SSR a propósito: con ~900 elementos SVG por árbol,
// el render de d3-hierarchy disparaba un hydration mismatch real entre
// servidor y cliente (visto en la verificación con Playwright antes de
// este commit) -- mismo patrón ya establecido en el sitio para
// componentes pesados puramente interactivos (ver SpecimenViewer en
// app/especimenes/page.tsx).

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { SITE_TREE, SITE_BRANCH_COLOR } from '@/components/dataviz/siteTree'
import { entries, clusters, type Cluster } from '@/components/knowledge/entries'
import type { HNode } from '@/components/dataviz/HierarchyExplorer'

const HierarchyExplorer = dynamic(() => import('@/components/dataviz/HierarchyExplorer').then((m) => m.HierarchyExplorer), { ssr: false })

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'
const RED = '#cc0000'

const CLUSTER_ORDER: Cluster[] = ['informacion', 'mente', 'autoorganizacion', 'sistemas', 'computacion', 'estetica', 'geometria']

function countNodes(n: HNode): number {
  return 1 + (n.children ?? []).reduce((acc, c) => acc + countNodes(c), 0)
}

function countLeaves(n: HNode): number {
  if (!n.children || n.children.length === 0) return 1
  return n.children.reduce((acc, c) => acc + countLeaves(c), 0)
}

export default function CartografiaPage() {
  const codexTree: HNode = {
    name: 'CODEX COGITO',
    children: CLUSTER_ORDER.map((c) => ({
      name: clusters[c].label,
      children: entries.filter((e) => e.cluster === c).map((e) => ({ name: e.name })),
    })),
  }
  const codexBranchColor: Record<string, string> = Object.fromEntries(CLUSTER_ORDER.map((c) => [clusters[c].label, clusters[c].color]))

  return (
    <div style={{ background: '#01040a', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '104px 24px 100px' }}>
        <Link href="/experimental" className="press" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${RED}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
          ← VOLVER A EXPERIMENTAL
        </Link>

        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${CYAN}66`, marginBottom: 16 }}>
          NPX-XP-CARTOGRAFÍA // TODO EL DATO, DE UNA SOLA VEZ
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700, letterSpacing: 6, color: CYAN, textShadow: `0 0 40px ${CYAN}44`, marginBottom: 16, lineHeight: 1 }}>
          CARTOGRAFÍA
        </h1>
        <p style={{ fontSize: 11.5, lineHeight: 2, color: '#8fb8d6', maxWidth: 680, marginBottom: 56 }}>
          La continuación de <Link href="/experimental/graficos" style={{ color: '#fff', textDecoration: 'underline' }}>/experimental/graficos</Link>, a otra escala:
          acá no hay muestra ni recorte — es el sitio entero y el Codex entero, cada rama real, sin resumir. Tres formas
          de layout (árbol radial, círculos anidados, mosaico) sobre los mismos dos árboles, con zoom y arrastre reales.
        </p>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: `${CYAN}66` }}>TODAS LAS RUTAS REALES DEL SITIO</div>
          <div style={{ fontFamily: mono, fontSize: 15, letterSpacing: 2, color: '#fff' }}>
            <span style={{ color: CYAN }}>I.</span> EL SITIO ENTERO — {countNodes(SITE_TREE)} NODOS
          </div>
        </div>
        <div style={{ border: `1px solid ${CYAN}22`, background: 'rgba(0,4,10,0.5)', padding: '20px 16px', marginBottom: 64 }}>
          <HierarchyExplorer data={SITE_TREE} branchColor={SITE_BRANCH_COLOR} accent={CYAN} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#6644aa99' }}>LOS 88 NOMBRES REALES DE /knowledge, POR CLUSTER</div>
          <div style={{ fontFamily: mono, fontSize: 15, letterSpacing: 2, color: '#fff' }}>
            <span style={{ color: '#6644aa' }}>II.</span> EL CODEX ENTERO — {countLeaves(codexTree)} CONCEPTOS
          </div>
        </div>
        <div style={{ border: '1px solid #6644aa22', background: 'rgba(0,4,10,0.5)', padding: '20px 16px', marginBottom: 32 }}>
          <HierarchyExplorer data={codexTree} branchColor={codexBranchColor} accent="#6644aa" />
        </div>
      </div>
    </div>
  )
}
