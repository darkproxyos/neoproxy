'use client'

// /home-grafico — el sitio entero como un árbol radial navegable, y nada más: sin texto
// de bienvenida ni botones, el mapa ocupa toda la pantalla. Pedido explícito: grande y
// fácil de navegar. Se navega así (ver el modo `immersive` de HierarchyExplorer):
//   - tocar una rama acerca la vista a ella con una animación y deja las hojas grandes;
//   - tocar una hoja entra a esa página; tocar de nuevo una rama ya encuadrada que tenga
//     página propia entra a ella;
//   - tocar el fondo o el centro vuelve al mapa completo; pellizco y rueda siguen andando.
// Reutiliza el mismo SITE_TREE real de cartografia (components/dataviz/siteTree.ts).
// La vista de círculos anidados vive aparte, en /home-circulos.

import dynamic from 'next/dynamic'
import { SITE_TREE, SITE_BRANCH_COLOR } from '@/components/dataviz/siteTree'
import type { HNode } from '@/components/dataviz/HierarchyExplorer'

const HierarchyExplorer = dynamic(() => import('@/components/dataviz/HierarchyExplorer').then((m) => m.HierarchyExplorer), { ssr: false })

// la raíz real del árbol apunta a '/' (es la home): acá sería un no-op que recarga la misma
// página, así que se desarma solo para esta vista.
const HOME_TREE: HNode = { ...SITE_TREE, href: undefined }

export default function HomeGraficoPage() {
  return (
    <div style={{ background: '#01040a', height: '100dvh', overflow: 'hidden', position: 'relative', boxSizing: 'border-box', paddingTop: 68 }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        <HierarchyExplorer data={HOME_TREE} branchColor={SITE_BRANCH_COLOR} accent="#00d4ff" initialLayout="radial" immersive />
      </div>
    </div>
  )
}
