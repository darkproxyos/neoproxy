'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { agents } from '@/components/proxyverse/agents'
import {
  getGrietaFragments, GRIETA_DONOR_IDS, hasEntitySighting, getConsoleCommandsUsed,
} from '@/components/proxyverse/identity'
import { CONSOLE_ROUTES } from '@/components/consoleRoutes'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'
const GREEN = '#39ff14'

type Secret = {
  id: string
  label: string
  found: boolean
  detail: string
  color: string
  href?: string
}

// A diferencia de /proxyverse/id (números acumulados), esto es un mapa de
// SÍ/NO — lo que ya encontraste de lo que el sitio esconde a propósito
// (Grietas, Entropy/Glitchi, la consola oculta). No dice cómo encontrar lo
// que todavía no encontraste, salvo una pista mínima — el punto es que lo
// busques, no que se lo expliquen acá.
export default function ConstelacionPage() {
  const [secrets, setSecrets] = useState<Secret[] | null>(null)

  useEffect(() => {
    const fragments = getGrietaFragments()
    const sighting = hasEntitySighting()
    const commandsUsed = getConsoleCommandsUsed()
    const totalRoutes = Object.keys(CONSOLE_ROUTES).length

    const grietaSecrets: Secret[] = GRIETA_DONOR_IDS.map(donorId => {
      const agent = agents.find(a => a.id === donorId)
      const found = fragments.includes(donorId)
      return {
        id: `grieta-${donorId}`,
        label: found ? `Fragmento de ${agent?.name ?? donorId}` : 'Fragmento sin resolver',
        found,
        detail: found
          ? `Resolviste la Grieta que donó ${agent?.name ?? donorId} a Prototype.`
          : 'Una Grieta en algún lado del sitio todavía espera que la notes.',
        color: agent?.color ?? '#6a7a8a',
        href: found ? '/proxyverse/prototype' : undefined,
      }
    })

    const list: Secret[] = [
      ...grietaSecrets,
      {
        id: 'entity-sighting',
        label: sighting ? 'Avistamiento registrado' : 'Algo sin nombre',
        found: sighting,
        detail: sighting
          ? 'Viste algo que el sistema no explica en ningún lado — quedó registrado.'
          : 'Dos procesos no figuran en ningún perfil. A veces se hacen notar solos.',
        color: sighting ? GREEN : '#6a7a8a',
        href: sighting ? '/system/entropia' : undefined,
      },
      {
        id: 'console',
        label: `Consola: ${commandsUsed.length}/${totalRoutes} rutas`,
        found: commandsUsed.length > 0,
        detail: commandsUsed.length > 0
          ? `Encontraste ${commandsUsed.length} de ${totalRoutes} rutas reales usando la consola oculta.`
          : 'Hay una capa de texto por encima de todo el sitio. Una tecla la abre.',
        color: commandsUsed.length > 0 ? GREEN : '#6a7a8a',
      },
    ]

    setSecrets(list)
  }, [])

  const foundCount = secrets?.filter(s => s.found).length ?? 0
  const total = secrets?.length ?? 0

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/proxyverse" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#00d4ff88', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A PROXYVERSE
        </Link>

        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${CYAN}66`, marginBottom: 16 }}>
          NPX-PXV-CONSTELACION // LO QUE YA ENCONTRASTE
        </div>
        <h1 style={{
          fontSize: 34, fontWeight: 700, letterSpacing: 6, color: CYAN,
          textShadow: `0 0 30px ${CYAN}44`, marginBottom: 16, lineHeight: 1,
        }}>
          CONSTELACIÓN
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 560, marginBottom: 12 }}>
          El sistema esconde cosas a propósito — nadie te las explica, ni esta página. Solo junta,
          en un lugar, cuánto de lo escondido ya cruzaste sin que te lo señalaran.
        </p>

        {secrets !== null && (
          <div style={{ fontSize: 10, color: '#4a6080', letterSpacing: 1, marginBottom: 36 }}>
            {foundCount} / {total} encontrados
          </div>
        )}

        {secrets === null && (
          <div style={{ fontSize: 10, color: '#3a4a60' }}>LEYENDO...</div>
        )}

        {secrets !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {secrets.map(s => {
              const content = (
                <div style={{
                  border: `1px solid ${s.found ? s.color + '55' : 'rgba(255,255,255,0.1)'}`,
                  background: s.found ? `${s.color}0a` : 'rgba(255,255,255,0.015)',
                  padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'center',
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: s.found ? s.color : 'transparent',
                    border: s.found ? 'none' : '1px solid #3a4a60',
                    boxShadow: s.found ? `0 0 10px ${s.color}` : 'none',
                  }} />
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: 1, color: s.found ? s.color : '#4a6080', marginBottom: 4 }}>
                      {s.found ? s.label : '??? sin resolver'}
                    </div>
                    <div style={{ fontSize: 9, color: '#8fb8d6', lineHeight: 1.7 }}>
                      {s.detail}
                    </div>
                  </div>
                </div>
              )
              return s.href ? (
                <Link key={s.id} href={s.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {content}
                </Link>
              ) : (
                <div key={s.id}>{content}</div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
