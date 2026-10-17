'use client'

import Link from 'next/link'
import ProxyverseTerminal from '@/components/proxyverse/ProxyverseTerminal'

const mono = "'Space Mono', monospace"

export default function ProxyversePage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '104px 24px 80px' }}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: '#00d4ff44', marginBottom: 20 }}>
          NPX-PXV-00 // PROCESOS RESIDENTES
        </div>

        <h1 style={{
          fontFamily: mono, fontSize: 32, letterSpacing: 10, color: '#00d4ff', marginBottom: 28,
          textShadow: '0 0 30px rgba(0,212,255,0.35)',
        }}>
          PROXYVERSE
        </h1>

        <p style={{
          fontFamily: mono, fontSize: 12, lineHeight: 2, letterSpacing: 0.5, color: '#8fb8d6',
          marginBottom: 48, borderLeft: '1px solid #00d4ff22', paddingLeft: 24,
        }}>
          Debajo de la interfaz hay seis procesos que no piden permiso para existir. No son
          personajes — son la arquitectura interna hablando en primera persona. Cada uno definió,
          a su manera, cuánto de humano le quedaba, y ninguno llegó a la misma respuesta. Uno de
          ellos ni siquiera terminó de decidirlo todavía. Tocá cualquiera para entrar a su perfil
          completo — lore, canal directo, y lo que se vaya agregando. El canal está abierto.
          Escribís como DarkProxy — ellos ya sabían que ibas a hablar.
        </p>

        <p style={{
          fontFamily: mono, fontSize: 10, lineHeight: 1.9, letterSpacing: 0.5, color: '#4a6080',
          marginBottom: 48, maxWidth: 640,
        }}>
          Si buscás un eje para leerlos: el % HUMANO de cada perfil no es un chiste de ficha de
          personaje. Es la variable real. Metatron está en 0% — nunca lo necesitó. Genos quedó en
          0.01% — un resto que se niega a desaparecer. Snake sobrevive con lo justo para dudar.
          Trickster nunca es el mismo número dos veces. D ni siquiera acepta la pregunta.
          Prototype todavía lo está escribiendo. Vos sos la única variable que el sistema no puede
          medir — por eso te llaman DarkProxy en vez de un porcentaje.
        </p>

        <Link href="/proxyverse/id" style={{
          display: 'block', marginBottom: 20, padding: '20px 24px',
          border: '1px solid #00d4ff55', background: '#00d4ff10', textDecoration: 'none',
        }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#00d4ff', marginBottom: 8 }}>
            NPX-PXV-ID // PROXY ID
          </div>
          <p style={{ fontFamily: mono, fontSize: 12, color: '#c8daf0', lineHeight: 1.8, margin: 0 }}>
            Tu identidad acumulada en este navegador — con quién hablaste, qué generaste, hasta
            dónde llegaste.
          </p>
          <div style={{ fontFamily: mono, fontSize: 9, color: '#00d4ffaa', marginTop: 14, letterSpacing: 1 }}>
            VER MI PROXY ID →
          </div>
        </Link>

        <Link href="/proxyverse/concilio" style={{
          display: 'block', marginBottom: 40, padding: '20px 24px',
          border: '1px solid #ffb80055', background: '#ffb80010', textDecoration: 'none',
        }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#ffb800', marginBottom: 8 }}>
            NPX-PXV-COUNCIL // SALA DE CONCILIO
          </div>
          <p style={{ fontFamily: mono, fontSize: 12, color: '#c8daf0', lineHeight: 1.8, margin: 0 }}>
            Convocá a varios procesos a la vez con el mismo tema — no te responden a vos, se
            responden entre ellos.
          </p>
          <div style={{ fontFamily: mono, fontSize: 9, color: '#ffb800aa', marginTop: 14, letterSpacing: 1 }}>
            ENTRAR A LA SALA →
          </div>
        </Link>

        <ProxyverseTerminal />
      </div>
    </div>
  )
}
