'use client'

// /home-grafico — pedido explícito: al usuario le gustó el gráfico de
// /experimental/cartografia (el sitio entero como árbol real, navegable) y
// quiere una home basada en ese estilo, además de la nube 3D cinemática.
// Esta es esa segunda variante de "home index" — elegible por app/page.tsx
// (el selector real, ver ahí la lógica de cuándo aparece cada una) y
// también reachable directo acá en /home-grafico para linkear o probar
// esta puntual sin depender del horario.
//
// Reutiliza el mismo HierarchyExplorer y el mismo SITE_TREE reales de
// cartografia (components/dataviz/siteTree.ts) -- ni un árbol inventado
// aparte ni un componente de gráfico nuevo. La diferencia real con
// cartografia no es el gráfico, es el marco: ahí es una sub-página de
// exploración ("mirá cuántos datos hay"), acá es el frente del sitio, así
// que el copy es de bienvenida/navegación y no hay segundo árbol (el del
// Codex) debajo -- esto es para entrar al sitio, no para estudiarlo.

import dynamic from 'next/dynamic'
import { SITE_TREE, SITE_BRANCH_COLOR } from '@/components/dataviz/siteTree'
import type { HNode } from '@/components/dataviz/HierarchyExplorer'

const HierarchyExplorer = dynamic(() => import('@/components/dataviz/HierarchyExplorer').then((m) => m.HierarchyExplorer), { ssr: false })

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'

// la raíz real del árbol apunta a '/' (es la home) -- acá, siendo ya la
// home, ese link es un no-op que solo recargaría la misma página, así que
// se desarma nada más que para esta vista.
const HOME_TREE: HNode = { ...SITE_TREE, href: undefined }

export default function HomeGraficoPage() {
  return (
    <div style={{ background: '#01040a', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '140px 24px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 6, color: `${CYAN}77`, marginBottom: 14 }}>
            NEO·PROXY — MAPA EN VIVO
          </div>
          <h1 style={{
            fontSize: 'clamp(26px, 5vw, 38px)', fontWeight: 700, letterSpacing: 5, color: CYAN,
            textShadow: `0 0 36px ${CYAN}44`, marginBottom: 14,
          }}>
            TODO EL SITIO, UN SOLO MAPA
          </h1>
          <p style={{ fontSize: 11.5, lineHeight: 2, color: '#8fb8d6', maxWidth: 640, margin: '0 auto' }}>
            Cada nodo de acá abajo es una ruta real del sitio — tocá cualquiera para entrar directo.
            Arrastrá para moverte, la rueda hace zoom, y arriba podés cambiar la forma: árbol radial,
            círculos anidados, o mosaico.
          </p>
        </div>

        <div style={{ border: `1px solid ${CYAN}22`, background: 'rgba(0,4,10,0.5)', padding: '20px 16px' }}>
          <HierarchyExplorer data={HOME_TREE} branchColor={SITE_BRANCH_COLOR} accent={CYAN} />
        </div>
      </div>
    </div>
  )
}
