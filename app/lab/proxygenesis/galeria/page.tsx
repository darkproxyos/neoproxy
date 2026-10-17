'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadGallery, deleteSpecimenFromGallery, setPendingLoad, type GallerySpecimen, type GalleryMode } from '../engine/gallery'

const mono = "'Space Mono', monospace"
const MODE_COLOR: Record<GalleryMode, string> = { coral: '#ff5e9e', arbol: '#00ff9d', concha: '#ffb800' }
const MODE_LABEL: Record<GalleryMode, string> = { coral: 'CORAL', arbol: 'ÁRBOL', concha: 'CONCHA' }

export default function ProxygenesisGaleriaPage() {
  const router = useRouter()
  const [specimens, setSpecimens] = useState<GallerySpecimen[] | null>(null)

  useEffect(() => {
    setSpecimens(loadGallery())
  }, [])

  const handleLoad = (s: GallerySpecimen) => {
    setPendingLoad(s.mode, s.params)
    router.push('/lab/proxygenesis')
  }

  const handleDelete = (id: string) => {
    setSpecimens(deleteSpecimenFromGallery(id))
  }

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      {/* /lab/proxygenesis (y sus sub-rutas) están en navHiddenPrefixes —
          el generador es una herramienta fullscreen con su propia barra, así
          que esta página reusa el mismo patrón en vez de depender del
          SiteNav global, que acá no se monta. */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 40, background: 'rgba(5,10,20,0.85)',
        borderBottom: '1px solid #00ff9d44', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', zIndex: 100, backdropFilter: 'blur(5px)',
      }}>
        <span style={{ fontSize: 11, letterSpacing: 2, color: '#00ff9d' }}>NEOPROXY // R&D // PROXYGENESIS.v1</span>
        <Link href="/lab/proxygenesis" style={{ color: '#00ff9d', textDecoration: 'none', fontSize: 10, border: '1px solid #00ff9d44', padding: '2px 8px' }}>
          ← VOLVER AL GENERADOR
        </Link>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '72px 24px 80px' }}>
        <div style={{ fontSize: 9, color: '#00ff9d66', letterSpacing: 6, marginBottom: 16 }}>
          // PROXYGENESIS — NPX-GEN-GALLERY
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 700, letterSpacing: 6, color: '#00ff9d',
          textShadow: '0 0 40px #00ff9d44', marginBottom: 16, lineHeight: 1,
        }}>
          GALERÍA LOCAL
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 560, marginBottom: 48 }}>
          Los últimos {specimens?.length ?? '…'} especímenes que guardaste en este navegador — vive en
          localStorage, nadie más la ve, no hay backend ni cuenta detrás. Guarda semilla y parámetros,
          no la malla: "CARGAR" vuelve a generar la pieza al instante con esos mismos valores.
        </p>

        {specimens === null && (
          <div style={{ fontSize: 10, color: '#3a4a60', letterSpacing: 1 }}>CARGANDO...</div>
        )}

        {specimens !== null && specimens.length === 0 && (
          <div style={{ fontSize: 10, color: '#3a4a60', letterSpacing: 1 }}>
            SIN ESPECÍMENES GUARDADOS TODAVÍA. Generá algo en Proxygenesis y tocá "GUARDAR EN GALERÍA".
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
          {specimens?.map(s => {
            const color = MODE_COLOR[s.mode]
            return (
              <div key={s.id} className="artifact-card" style={{ overflow: 'hidden' }}>
                <img src={s.thumbnail} alt={`Espécimen ${s.mode}`} style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block', borderBottom: `1px solid ${color}33` }} />
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, letterSpacing: 2, color }}>{MODE_LABEL[s.mode]}</span>
                    <span style={{ fontSize: 8, color: '#4a6080' }}>{new Date(s.createdAt).toLocaleDateString('es-AR')}</span>
                  </div>
                  <div style={{ fontSize: 9, color: '#4a6080', marginBottom: 14 }}>
                    NODOS: {s.nodes.toLocaleString()} // CARAS: {Math.round(s.faces).toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleLoad(s)} style={{
                      flex: 1, fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '8px 0', cursor: 'pointer',
                      background: `${color}15`, border: `1px solid ${color}66`, color,
                    }}>
                      CARGAR
                    </button>
                    <button onClick={() => handleDelete(s.id)} style={{
                      fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '8px 12px', cursor: 'pointer',
                      background: 'transparent', border: '1px solid #ff2d5555', color: '#ff2d55',
                    }}>
                      BORRAR
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
