'use client'
import Link from 'next/link'
import artifactsData from '../../data/artifacts.json'

export default function StorePage() {
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
        borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
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
        <div style={{ 
          fontSize: 11, 
          color: '#00d4ff',
          letterSpacing: 4
        }}>
          NEOPROXY DROP SYSTEM
        </div>
      </nav>

      {/* Content */}
      <div style={{ 
        maxWidth: 1200, 
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
            // ARTIFACT DROPS
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
            STORE
          </h1>
          <p style={{ 
            fontSize: 11, 
            color: '#4a6080',
            letterSpacing: 2,
            lineHeight: 2,
            maxWidth: 600
          }}>
            Artefactos limitados extraídos del sistema generativo. 
            Cada pieza es única, certificada y fabricada bajo demanda.
          </p>
        </div>

        {/* Drops Grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 32
        }}>
          {artifactsData.map((artifact) => (
            <div 
              key={artifact.id}
              className="artifact-card"
              style={{ 
                padding: 0,
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              {/* Image Placeholder */}
              <div style={{ 
                height: 280,
                background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid rgba(0, 212, 255, 0.1)'
              }}>
                <div style={{ 
                  fontSize: 48, 
                  color: '#00d4ff22',
                  fontWeight: 700
                }}>
                  {artifact.id}
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: 24 }}>
                <div style={{ 
                  fontSize: 8, 
                  color: '#6644aa',
                  letterSpacing: 3,
                  marginBottom: 8
                }}>
                  {artifact.category.toUpperCase()}
                </div>
                
                <h3 style={{ 
                  fontSize: 16, 
                  color: '#00d4ff',
                  letterSpacing: 3,
                  marginBottom: 12,
                  fontWeight: 600
                }}>
                  {artifact.name}
                </h3>

                <p style={{ 
                  fontSize: 10, 
                  color: '#4a6080',
                  letterSpacing: 1,
                  lineHeight: 1.8,
                  marginBottom: 20
                }}>
                  {artifact.description}
                </p>

                {/* Specs */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 20,
                  paddingBottom: 20,
                  borderBottom: '1px solid rgba(0, 212, 255, 0.1)'
                }}>
                  <div>
                    <div style={{ fontSize: 7, color: '#00d4ff44', letterSpacing: 2 }}>MATERIAL</div>
                    <div style={{ fontSize: 9, color: '#c8daf0', letterSpacing: 2 }}>{artifact.material}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 7, color: '#00d4ff44', letterSpacing: 2 }}>PROCESS TIME</div>
                    <div style={{ fontSize: 9, color: '#c8daf0', letterSpacing: 2 }}>{artifact.process_time}</div>
                  </div>
                </div>

                {/* Status & Price */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20
                }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span 
                      style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%',
                        background: artifact.status === 'available' ? '#00ffcc' : 
                                   artifact.status === 'limited' ? '#ffb800' : '#ff4444',
                        boxShadow: artifact.status === 'available' ? '0 0 10px #00ffcc' : 
                                  artifact.status === 'limited' ? '0 0 10px #ffb800' : 'none'
                      }}
                    />
                    <span style={{ 
                      fontSize: 8, 
                      color: artifact.status === 'available' ? '#00ffcc' : 
                            artifact.status === 'limited' ? '#ffb800' : '#ff4444',
                      letterSpacing: 2,
                      textTransform: 'uppercase'
                    }}>
                      {artifact.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: 12, 
                    color: '#00d4ff',
                    letterSpacing: 3
                  }}>
                    {artifact.price}
                  </div>
                </div>

                {/* CTA Button */}
                {artifact.status !== 'sold_out' ? (
                  <button
                    className="cyber-btn"
                    style={{ 
                      width: '100%',
                      fontSize: 10, 
                      color: '#00d4ff',
                      letterSpacing: 4,
                      background: 'transparent',
                      border: '1px solid #00d4ff44',
                      padding: '14px 24px',
                      cursor: 'pointer',
                      fontFamily: mono
                    }}
                  >
                    [ ENTER REQUEST ]
                  </button>
                ) : (
                  <div style={{ 
                    width: '100%',
                    fontSize: 10, 
                    color: '#ff4444',
                    letterSpacing: 4,
                    textAlign: 'center',
                    padding: '14px 24px',
                    border: '1px solid #ff444444'
                  }}>
                    [ SOLD OUT ]
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div style={{ 
          textAlign: 'center',
          marginTop: 80,
          padding: '60px 24px',
          borderTop: '1px solid rgba(0, 212, 255, 0.1)'
        }}>
          <div style={{ 
            fontSize: 10, 
            color: '#4a6080',
            letterSpacing: 3,
            marginBottom: 16
          }}>
            COMMISSION CUSTOM ARTIFACT
          </div>
          <div style={{ 
            fontSize: 9, 
            color: '#00d4ff22',
            letterSpacing: 2,
            marginBottom: 32
          }}>
            Contacto directo para piezas personalizadas y colaboraciones.
          </div>
          <a
            href="mailto:contact@neoproxy.art"
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
            [ CONTACT ]
          </a>
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center',
          fontSize: 8, 
          color: '#00d4ff22',
          letterSpacing: 3,
          marginTop: 80
        }}>
          NEOPROXY DROP SYSTEM // SANTIAGO, CHILE
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
