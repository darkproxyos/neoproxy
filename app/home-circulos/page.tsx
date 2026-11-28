'use client'

// /home-circulos — el mismo mapa del sitio, en círculos anidados, y nada más: sin texto ni
// botones, a pantalla completa. Pedido explícito: una home aparte para la vista de círculos
// (la del árbol radial es /home-grafico). Cada círculo grande es una sección; tocarlo acerca
// la vista a ese círculo y deja ver los círculos de sus páginas, que se vuelven más grandes
// y con su nombre a medida que te acercas; tocar uno de esos entra a la página. Tocar el
// fondo vuelve al mapa completo. Mismo componente y mismo SITE_TREE que /home-grafico.

import dynamic from 'next/dynamic'
import { SITE_TREE, SITE_BRANCH_COLOR } from '@/components/dataviz/siteTree'
import type { HNode } from '@/components/dataviz/HierarchyExplorer'

const HierarchyExplorer = dynamic(() => import('@/components/dataviz/HierarchyExplorer').then((m) => m.HierarchyExplorer), { ssr: false })

const HOME_TREE: HNode = { ...SITE_TREE, href: undefined }

export default function HomeCirculosPage() {
  return (
    <div style={{ background: '#01040a', height: '100dvh', overflow: 'hidden', position: 'relative', boxSizing: 'border-box', paddingTop: 68 }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        <HierarchyExplorer data={HOME_TREE} branchColor={SITE_BRANCH_COLOR} accent="#00d4ff" initialLayout="pack" immersive />
      </div>
    </div>
  )
}
