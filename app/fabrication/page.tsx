'use client'
import Link from 'next/link'

export default function FabricationPage() {
  const mono = "'Space Mono', monospace"
  
  const steps = [
    { num: '01', title: 'DIGITAL DESIGN', desc: 'Algorithmic generation // Parametric modeling' },
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
            Laboratorio experimental de fabricación digital. 
            Cada artefacto es extraído del sistema generativo y materializado 
            mediante procesos de impresión 3D y acabado manual.
          </p>
        </div>

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
            INTERESADO EN UN ARTEFACTO?
          </div>
          <Link
            href="/store"
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
            [ VIEW DROPS ]
          </Link>
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
      `}</style>
    </div>
  )
}
