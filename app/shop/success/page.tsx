'use client'

import Link from 'next/link'

export default function CheckoutSuccessPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#020408',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Space Mono", monospace',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{
        border: '1px solid #00d4ff',
        padding: '40px',
        boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{
          color: '#00ff9d',
          fontSize: '24px',
          marginBottom: '20px',
          letterSpacing: '4px',
          textTransform: 'uppercase'
        }}>
          TRANSACCIÓN COMPLETADA
        </h1>
        <p style={{
          color: '#00d4ff',
          fontSize: '14px',
          marginBottom: '40px',
          letterSpacing: '2px'
        }}>
          // ARTEFACTO ADQUIRIDO // ENVÍO DE DATOS INICIADO
        </p>
        <Link 
          href="/shop/drop01" 
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: 'transparent',
            border: '1px solid #00d4ff',
            color: '#00d4ff',
            textDecoration: 'none',
            fontSize: '12px',
            letterSpacing: '3px',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#00d4ff55'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          [VOLVER A LA TIENDA]
        </Link>
      </div>
    </div>
  )
}
