'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { agents } from '@/components/proxyverse/agents'
import { pieces } from '@/components/gallery/pieces'

const genos = agents.find(a => a.id === 'genos')!

const SHOWCASE_IDS = ['oni-13', 'artefacto-03', 'figura-03', 'oni-09', 'figura-02', 'artefacto-02', 'criatura-04', 'figura-01']
const showcase = SHOWCASE_IDS
  .map(id => pieces.find(p => p.id === id))
  .filter((p): p is NonNullable<typeof p> => !!p)

export default function FabricationPage() {
  const mono = "'Space Mono', monospace"
  const [hasGallery, setHasGallery] = useState(false)

  useEffect(() => {
    fetch('/curated_stl_index.json')
      .then(res => res.ok ? res.json() : [])
      .then(data => setHasGallery(Array.isArray(data) && data.length > 0))
      .catch(() => setHasGallery(false))
  }, [])

  const steps = [
    { num: '01', title: 'DIGITAL DESIGN', desc: 'Parametric & generative modeling // AI-assisted design' },
    { num: '02', title: '3D PRINTING', desc: 'FDM deposition // Resin UV curing' },
    { num: '03', title: 'POST PROCESS', desc: 'Support removal // Surface treatment' },
    { num: '04', title: 'HAND FINISH', desc: 'Sanding // Polishing // Assembly' },
    { num: '05', title: 'ARTIFACT', desc: 'Quality verification // Packaging' },
  ]

  const equipment = [
    { name: 'ENDER NODE 01', type: 'FDM Printer', status: 'active' },
    { name: 'RESIN CORE', type: 'SLA Printer', status: 'active' },
    { name: 'MATERIAL BANK', type: 'Storage System', status: 'standby' },
  ]

  return (
    <div style={{ 
      background: '#000205', 
      minHeight: '100vh', 
      fontFamily: mono,
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background */}
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      {/* Navigation */}
      <nav style={{ 
        padding: '24px 40px',
        borderBottom: '1px solid rgba(0, 212, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link
            href="/"
            style={{
              fontSize: 9,
              color: '#4a6080',
              letterSpacing: 3,
              textDecoration: 'none'
            }}
          >
            ← BACK TO HOME
          </Link>
          {hasGallery && (
            <Link
              href="/fabrication/gallery"
              style={{
                fontSize: 9,
                color: '#00d4ff',
                letterSpacing: 3,
                textDecoration: 'none',
                border: '1px solid #00d4ff44',
                padding: '6px 14px'
              }}
            >
              CURATED GALLERY →
            </Link>
          )}
        </div>
      </nav>

      {/* Content */}
      <div style={{ 
        maxWidth: 900, 
        margin: '0 auto', 
        padding: '60px 24px'
      }}>
        {/* Header */}
        <div style={{ marginBottom: 80 }}>
          <div style={{ 
            fontSize: 9, 
            color: '#00d4ff44',
            letterSpacing: 6,
            marginBottom: 16
          }}>
            // FABRICATION LABORATORY
          </div>
          <h1 style={{ 
            fontSize: 42, 
            fontWeight: 700,
            letterSpacing: 8,
            color: '#00d4ff',
            textShadow: '0 0 40px #00d4ff44',
            marginBottom: 24,
            lineHeight: 1
          }}>
            FABRICATION
          </h1>
          <p style={{
            fontSize: 11,
            color: '#4a6080',
            letterSpacing: 2,
            lineHeight: 2,
            maxWidth: 600
          }}>
            Laboratorio de fabricación digital. Cada pieza se diseña, se imprime
            y se termina a mano — propia o a pedido.
          </p>
        </div>

        {/* SERVICIO — sección comercial, primero que se lee, pensada para generar pedidos */}
        <div style={{
          marginBottom: 80,
          border: '1px solid #00d4ff44',
          background: 'linear-gradient(180deg, rgba(0,212,255,0.06), rgba(180,0,255,0.03))',
          padding: '36px 28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff9d', boxShadow: '0 0 10px #00ff9d' }} />
            <span style={{ fontSize: 9, color: '#00ff9d', letterSpacing: 4 }}>SERVICIO ACTIVO // ACEPTANDO PEDIDOS</span>
          </div>

          <h2 style={{ fontSize: 24, color: '#fff', letterSpacing: 1, lineHeight: 1.5, marginBottom: 18, maxWidth: 620 }}>
            Impresión 3D en <span style={{ color: '#00d4ff' }}>PLA</span> y <span style={{ color: '#b400ff' }}>resina</span>, a pedido.
          </h2>

          <p style={{ fontSize: 12, color: '#c8daf0', letterSpacing: 0.3, lineHeight: 1.9, maxWidth: 620, marginBottom: 28 }}>
            Modelado 3D avanzado — paramétrico, generativo y asistido por IA — desde tu referencia,
            tu boceto o una idea sin forma todavía. Imprimo en FDM (PLA) y en SLA (resina UV),
            con acabado y post-proceso a mano. Pieza única, prototipo o serie corta.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px 20px', marginBottom: 32, maxWidth: 680,
          }}>
            {[
              'Modelado desde cero o tu STL',
              'Diseño asistido por IA',
              'FDM — filamento PLA',
              'SLA — resina UV',
              'Acabado y pintado a mano',
              'Pieza única o serie corta',
            ].map(item => (
              <div key={item} style={{
                fontSize: 10, color: '#c8daf0', letterSpacing: 0.3, lineHeight: 1.6,
                borderLeft: '2px solid #00d4ff55', paddingLeft: 10,
              }}>
                {item}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href="mailto:contact@neoproxy.art?subject=Pedido%20de%20impresi%C3%B3n%203D&body=Hola%2C%20quiero%20cotizar%20una%20pieza.%0A%0ADescripci%C3%B3n%3A%0AMaterial%20(PLA%20%2F%20resina)%3A%0AReferencia%20o%20STL%20(si%20tengo)%3A"
              className="cyber-btn"
              style={{
                display: 'inline-block', fontSize: 11, color: '#00d4ff', letterSpacing: 3,
                textDecoration: 'none', border: '1px solid #00d4ff', padding: '14px 32px',
                background: '#00d4ff0f',
              }}
            >
              [ PEDIR COTIZACIÓN ]
            </a>
            <Link
              href="/artifacts"
              style={{ fontSize: 10, color: '#4a6080', letterSpacing: 1.5, textDecoration: 'none' }}
            >
              VER TRABAJOS REALIZADOS →
            </Link>
          </div>
        </div>

        {/* MUESTRA DE TRABAJO — prueba visual inmediata, piezas reales ya hechas */}
        <div style={{ marginBottom: 80 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
            <div style={{ fontSize: 10, color: '#00ffcc', letterSpacing: 4 }}>TRABAJOS_DESTACADOS</div>
            <Link href="/artifacts" style={{ fontSize: 9, color: '#4a6080', letterSpacing: 1.5, textDecoration: 'none' }}>
              VER GALERÍA COMPLETA →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {showcase.map(piece => (
              <Link
                key={piece.id}
                href="/artifacts"
                className="showcase-thumb"
                style={{
                  position: 'relative', display: 'block', aspectRatio: '1 / 1',
                  overflow: 'hidden', border: '1px solid #00d4ff22',
                }}
              >
                {piece.media.type === 'image' ? (
                  <Image
                    src={piece.media.src}
                    alt={piece.title}
                    fill
                    sizes="(max-width: 768px) 33vw, 150px"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <video
                    src={piece.media.src}
                    poster={piece.media.poster}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                <div className="showcase-scanlines" />
              </Link>
            ))}
          </div>
        </div>

        {/* Genos — el proceso que ejecuta esto en Proxyverse */}
        <Link href={`/proxyverse/${genos.id}`} style={{
          display: 'block', marginBottom: 80, padding: '20px 24px',
          border: `1px solid ${genos.color}33`, background: `${genos.color}0a`, textDecoration: 'none',
        }}>
          <div style={{ fontSize: 9, color: genos.color, letterSpacing: 2, marginBottom: 8 }}>
            {genos.name} // {genos.role}
          </div>
          <p style={{ fontSize: 11, color: '#c8daf0', letterSpacing: 0.5, lineHeight: 1.8, fontStyle: 'italic' }}>
            "{genos.quote}"
          </p>
          <div style={{ fontSize: 9, color: `${genos.color}aa`, letterSpacing: 1, marginTop: 10 }}>
            VER SU PERFIL EN PROXYVERSE →
          </div>
        </Link>

        {/* Process Steps */}
        <div style={{ marginBottom: 100 }}>
          <div style={{ 
            fontSize: 10, 
            color: '#00ffcc',
            letterSpacing: 4,
            marginBottom: 40
          }}>
            PROCESS FLOW
          </div>
          
          {steps.map((step, index) => (
            <div 
              key={step.num}
              style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: 32,
                paddingBottom: 32,
                borderBottom: index < steps.length - 1 ? '1px solid rgba(0, 212, 255, 0.1)' : 'none'
              }}
            >
              <div style={{ 
                fontSize: 24, 
                fontWeight: 700,
                color: '#6644aa',
                minWidth: 60,
                letterSpacing: 4
              }}>
                {step.num}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: 14, 
                  color: '#00d4ff',
                  letterSpacing: 3,
                  marginBottom: 8
                }}>
                  {step.title}
                </div>
                <div style={{ 
                  fontSize: 10, 
                  color: '#4a6080',
                  letterSpacing: 2
                }}>
                  {step.desc}
                </div>
              </div>
              <div style={{ 
                fontSize: 20, 
                color: '#00d4ff44'
              }}>
                ↓
              </div>
            </div>
          ))}
        </div>

        {/* Equipment Section */}
        <div style={{ marginBottom: 100 }}>
          <div style={{ 
            fontSize: 10, 
            color: '#00ffcc',
            letterSpacing: 4,
            marginBottom: 40
          }}>
            CURRENT EQUIPMENT
          </div>

          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 24
          }}>
            {equipment.map((eq) => (
              <div 
                key={eq.name}
                className="artifact-card"
                style={{ 
                  padding: 24,
                  borderRadius: 2
                }}
              >
                <div style={{ 
                  fontSize: 11, 
                  color: '#00d4ff',
                  letterSpacing: 3,
                  marginBottom: 8
                }}>
                  {eq.name}
                </div>
                <div style={{ 
                  fontSize: 9, 
                  color: '#4a6080',
                  letterSpacing: 2,
                  marginBottom: 16
                }}>
                  {eq.type}
                </div>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span 
                    className="status-dot"
                    style={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%',
                      background: eq.status === 'active' ? '#00ffcc' : '#ffb800',
                      boxShadow: eq.status === 'active' ? '0 0 10px #00ffcc' : '0 0 10px #ffb800'
                    }}
                  />
                  <span style={{ 
                    fontSize: 8, 
                    color: eq.status === 'active' ? '#00ffcc' : '#ffb800',
                    letterSpacing: 2
                  }}>
                    {eq.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ 
          textAlign: 'center',
          padding: '60px 24px',
          borderTop: '1px solid rgba(0, 212, 255, 0.1)'
        }}>
          <div style={{
            fontSize: 10,
            color: '#4a6080',
            letterSpacing: 3,
            marginBottom: 32
          }}>
            ¿TENÉS UNA PIEZA EN MENTE?
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <a
              href="mailto:contact@neoproxy.art?subject=Pedido%20de%20impresi%C3%B3n%203D"
              className="cyber-btn"
              style={{
                display: 'inline-block',
                fontSize: 10,
                color: '#00d4ff',
                letterSpacing: 4,
                textDecoration: 'none',
                border: '1px solid #00d4ff44',
                padding: '14px 42px'
              }}
            >
              [ PEDIR COTIZACIÓN ]
            </a>
            <Link
              href="/shop/drop01"
              style={{
                display: 'inline-block',
                fontSize: 10,
                color: '#4a6080',
                letterSpacing: 4,
                textDecoration: 'none',
                border: '1px solid #0f1f35',
                padding: '14px 42px'
              }}
            >
              VER DROP ACTUAL
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center',
          fontSize: 8, 
          color: '#00d4ff22',
          letterSpacing: 3,
          marginTop: 80
        }}>
          NEOPROXY FABRICATION LAB // SANTIAGO, CHILE
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          h1 { font-size: 28px !important; }
        }
        .showcase-thumb img {
          filter: saturate(1.1) contrast(1.05) brightness(0.95);
          transition: filter 0.35s ease, transform 0.5s ease;
        }
        .showcase-thumb:hover img {
          filter: saturate(1.3) contrast(1.15) brightness(1.05);
          transform: scale(1.08);
        }
        .showcase-scanlines {
          position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            rgba(0,0,0,0) 0px, rgba(0,0,0,0) 1px,
            rgba(0,255,157,0.07) 2px, rgba(0,0,0,0) 3px
          );
          mix-blend-mode: overlay;
        }
      `}</style>
    </div>
  )
}
