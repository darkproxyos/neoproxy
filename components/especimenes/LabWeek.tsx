'use client'
// Las 50 piezas experimentales de la semana, a la vista en /especimenes.
// Misma ventana rotativa que el laboratorio (lib/specimens/select.ts), así que
// ambas páginas muestran exactamente las mismas piezas.
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FAMILY_COLOR, FAMILY_LABEL, PURE_FAMILIES, type Family } from '@/lib/specimens/families'
import { SHOW_COUNT, ROTATE_STEP, weekIndex, nextRotationAt, visibleIndices } from '@/lib/specimens/select'

type Item = { id: string; family: Family; m: { printScore: number; material: string } }
type Pool = { hall: Item[]; stats: { generated: number; printable: number } }

const mono = "'Space Mono', monospace"
const ACCENT = '#00ffcc'
const SHOWN = 48

export default function LabWeek() {
  const [pool, setPool] = useState<Pool | null>(null)
  const [failed, setFailed] = useState(false)
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    fetch('/proxygenesis/pool.json').then((r) => (r.ok ? r.json() : Promise.reject())).then(setPool).catch(() => setFailed(true))
  }, [])

  const items = useMemo(() => {
    if (!pool || now === null) return []
    return visibleIndices(pool.hall.length, weekIndex(now)).map((i) => pool.hall[i])
  }, [pool, now])

  const next = now === null ? '' : new Date(nextRotationAt(now)).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', timeZone: 'UTC' })

  if (failed) return null

  return (
    <section aria-labelledby="lab-week-title" style={{ marginTop: 44, border: `1px solid ${ACCENT}33`, background: 'rgba(0,255,204,0.025)', padding: '22px 22px 24px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ maxWidth: 640 }}>
          <div style={{ fontSize: 9, letterSpacing: 4, color: `${ACCENT}99` }}>// LISTOS PARA IMPRIMIR · PLA O RESINA</div>
          <h2 id="lab-week-title" style={{ fontSize: 22, letterSpacing: 3, color: ACCENT, margin: '8px 0 10px', fontWeight: 700 }}>
            {SHOW_COUNT} FORMAS EXPERIMENTALES DE LA SEMANA
          </h2>
          <p style={{ fontSize: 10.5, lineHeight: 1.9, color: '#8fb8d6', margin: 0 }}>
            {PURE_FAMILIES.length} algoritmos, cada uno atado a un autor del sitio, y sus cruces (simbiosis) generaron{' '}
            {pool ? pool.stats.generated.toLocaleString('es-CL') : '2.030'} formas; se midieron como sólidos imprimibles y se
            eligió un salón de {pool ? pool.hall.length : 200}. Cada semana salen {ROTATE_STEP} y entran {ROTATE_STEP} nuevas
            {next ? ` (próximo cambio: ${next})` : ''}.
          </p>
        </div>
        <Link href="/especimenes/laboratorio" className="press"
          style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '0 18px', border: `1px solid ${ACCENT}`, background: `${ACCENT}18`, color: ACCENT, fontSize: 10, letterSpacing: 2, textDecoration: 'none' }}>
          ABRIR EL LABORATORIO →
        </Link>
      </div>

      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8, minHeight: 120 }}>
        {pool === null
          ? <div style={{ gridColumn: '1 / -1', fontSize: 10, letterSpacing: 3, color: '#4a6080' }}>CARGANDO SALÓN…</div>
          : items.slice(0, SHOWN).map((it) => {
              const c = FAMILY_COLOR[it.family]
              return (
                <Link key={it.id} href={`/especimenes/laboratorio?id=${it.id}`} className="press"
                  aria-label={`Abrir ${FAMILY_LABEL[it.family]} ${it.id}`}
                  style={{ display: 'block', textDecoration: 'none', background: '#080c12', border: `1px solid ${c}33`, borderTop: `2px solid ${c}`, fontFamily: mono }}>
                  <img src={`/proxygenesis/pool-thumbs/${it.id}.webp`} alt={`${FAMILY_LABEL[it.family]}, imprimible ${Math.round(it.m.printScore * 100)}%`}
                    loading="lazy" width={256} height={256}
                    style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '1 / 1', background: '#070a10' }} />
                  <div style={{ padding: '5px 6px 6px', fontSize: 8, letterSpacing: 1, color: c, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {FAMILY_LABEL[it.family]}
                  </div>
                </Link>
              )
            })}
        {pool !== null && items.length > SHOWN && (
          <Link href="/especimenes/laboratorio" className="press"
            style={{ display: 'grid', placeItems: 'center', aspectRatio: '1 / 1', border: `1px dashed ${ACCENT}66`, color: ACCENT, fontSize: 10, letterSpacing: 1.5, textAlign: 'center', textDecoration: 'none', padding: 6 }}>
            +{items.length - SHOWN} MÁS EN EL LABORATORIO
          </Link>
        )}
      </div>
    </section>
  )
}
