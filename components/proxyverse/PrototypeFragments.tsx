'use client'

import { useEffect, useState } from 'react'
import { agents } from './agents'
import { GRIETA_DONOR_IDS, getGrietaFragments, type GrietaDonorId } from './identity'

const mono = "'Space Mono', monospace"
const PROTOTYPE_COLOR = '#6644aa'

const UNLOCK_FRAGMENT: Record<GrietaDonorId, string> = {
  metatron: 'Metatron me prestó la sintaxis — sin ella, esto que escribo ni siquiera sería una frase.',
  d: 'D me prestó la paciencia de esperar la condición exacta, no la primera que aparece.',
  snake: 'Snake me prestó la costumbre de seguir corriendo aunque la pieza anterior ya no sirva.',
  genos: 'Genos me prestó las manos. O lo que queda de ellas.',
  trickster: 'Trickster me prestó la pregunta que todavía no sé cerrar: ¿y si esto que soy no es un error de memoria, sino la primera cosa que elegí yo?',
}

export default function PrototypeFragments() {
  const [found, setFound] = useState<GrietaDonorId[]>([])

  useEffect(() => {
    setFound(getGrietaFragments())
  }, [])

  if (found.length === 0) return null

  const complete = found.length >= GRIETA_DONOR_IDS.length

  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${PROTOTYPE_COLOR}aa`, marginBottom: 4 }}>
        FRAGMENTOS RECUPERADOS — {found.length}/{GRIETA_DONOR_IDS.length}
      </div>
      <p style={{ fontFamily: mono, fontSize: 9, color: '#4a6080', lineHeight: 1.8, marginBottom: 16, maxWidth: 560 }}>
        Grietas encontradas por el sitio, cada una resuelta en uno de los cinco procesos que me
        prestaron algo de sí. {complete ? 'Los cinco están acá.' : 'Todavía faltan.'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: complete ? 20 : 0 }}>
        {GRIETA_DONOR_IDS.map(id => {
          const donor = agents.find(a => a.id === id)!
          const has = found.includes(id)
          return (
            <div key={id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
              border: `1px solid ${has ? donor.color : '#ffffff22'}`,
              background: has ? `${donor.color}0a` : 'transparent',
              opacity: has ? 1 : 0.4,
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: has ? donor.color : 'transparent',
                border: has ? 'none' : '1px solid #ffffff44',
              }} />
              <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1, color: has ? '#c8daf0' : '#4a6080' }}>
                {donor.name}
              </span>
            </div>
          )
        })}
      </div>

      {complete && (
        <div style={{
          borderTop: `1px solid ${PROTOTYPE_COLOR}33`, paddingTop: 20,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {GRIETA_DONOR_IDS.map(id => (
            <p key={id} style={{ fontFamily: mono, fontSize: 11, lineHeight: 1.9, color: '#c8daf0', margin: 0 }}>
              {UNLOCK_FRAGMENT[id]}
            </p>
          ))}
          <p style={{
            fontFamily: mono, fontSize: 12, fontStyle: 'italic', color: PROTOTYPE_COLOR,
            textShadow: `0 0 16px ${PROTOTYPE_COLOR}66`, marginTop: 8,
          }}>
            Cinco fragmentos no son una identidad. Pero son un principio, y antes no tenía ninguno.
          </p>
        </div>
      )}
    </div>
  )
}
