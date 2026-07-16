'use client'
import Link from 'next/link'
import artifactsData from '../../data/artifacts.json'

export default function GalleryPage() {
  const mono = "'Space Mono', monospace"

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
      </nav>

      {/* Content */}
      <div style={{ 
        maxWidth: 1400, 
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
            // ARTIFACT GALLERY
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
            GALLERY
          </h1>
          <p style={{ 
            fontSize: 11, 
            color: '#4a6080',
            letterSpacing: 2,
            lineHeight: 2,
            maxWidth: 600
          }}>
            Colección completa de artefactos físicos y digitales. 
            Cada pieza representa una extracción única del sistema generativo.
          </p>
        </div>

        {/* Gallery Grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24
        }}>
          {artifactsData.map((artifact) => (
            <div 
              key={artifact.id}
              className="artifact-card"
              style={{ 
                padding: 20,
                borderRadius: 2
              }}
            >
              {/* Image Placeholder */}
              <div style={{ 
                height: 200,
                background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                border: '1px solid rgba(0, 212, 255, 0.1)'
              }}>
                <div style={{ 
                  fontSize: 36, 
                  color: '#00d4ff22',
                  fontWeight: 700
                }}>
                  {artifact.id}
                </div>
              </div>

              {/* Info */}
              <div style={{ 
                fontSize: 8, 
                color: '#6644aa',
                letterSpacing: 3,
                marginBottom: 8
              }}>
                {artifact.category.toUpperCase()}
              </div>
              
              <h3 style={{ 
                fontSize: 14, 
                color: '#00d4ff',
                letterSpacing: 3,
                marginBottom: 12,
                fontWeight: 600
              }}>
                {artifact.name}
              </h3>

              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 16,
                borderTop: '1px solid rgba(0, 212, 255, 0.1)'
              }}>
                <span style={{ 
                  fontSize: 8, 
                  color: artifact.status === 'available' ? '#00ffcc' : 
                        artifact.status === 'limited' ? '#ffb800' : '#ff4444',
                  letterSpacing: 2,
                  textTransform: 'uppercase'
                }}>
                  {artifact.status.replace('_', ' ')}
                </span>
                <Link
                  href="/store"
                  style={{ 
                    fontSize: 9, 
                    color: '#00d4ff',
                    letterSpacing: 2,
                    textDecoration: 'none'
                  }}
                >
                  VIEW →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center',
          fontSize: 8, 
          color: '#00d4ff22',
          letterSpacing: 3,
          marginTop: 80
        }}>
          NEOPROXY GALLERY // ARCHIVE COMPLETE
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          h1 { font-size: 28px !important; }
        }
      `}</style>
    </div>
  )
}
