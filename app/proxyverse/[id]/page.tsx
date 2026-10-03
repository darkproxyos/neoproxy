import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { agents } from '@/components/proxyverse/agents'
import { entries } from '@/components/knowledge/entries'
import AgentChannel from '@/components/proxyverse/AgentChannel'

const mono = "'Space Mono', monospace"

// Arte canonico por agente. Todavia no todos tienen — se van agregando acá
// a medida que existan.
const AGENT_IMAGES: Record<string, string> = {
  darkproxy: '/canon/darkproxy-v1.png',
  snake: '/canon/snake-v1.jpg',
  d: '/canon/d-v1.jpg',
  genos: '/canon/genos-v1.jpg',
  metatron: '/canon/metatron-v1.jpg',
  trickster: '/canon/trickster-v1.jpg',
  prototype: '/canon/prototype-v1.jpg',
}

export function generateStaticParams() {
  return agents.map(a => ({ id: a.id }))
}

export default async function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const agent = agents.find(a => a.id === id)
  if (!agent) notFound()

  const image = AGENT_IMAGES[agent.id]
  const others = agents.filter(a => a.id !== agent.id)
  const ancestor = entries.find(e => e.relatedAgent === agent.id)

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/proxyverse" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#00d4ff88', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A PROXYVERSE
        </Link>

        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${agent.color}66`, marginBottom: 16 }}>
          NPX-PXV-00 // PERFIL DE PROCESO
        </div>

        {image ? (
          <div style={{ maxWidth: 420, margin: '0 auto 32px', border: `1px solid ${agent.color}33` }}>
            <Image
              src={image}
              alt={agent.name}
              width={800}
              height={800}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        ) : (
          <div style={{
            maxWidth: 420, height: 220, margin: '0 auto 32px', border: `1px dashed ${agent.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8,
            background: `${agent.color}0a`,
          }}>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: `${agent.color}88` }}>
              SIN REGISTRO VISUAL
            </div>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1, color: '#4a6080' }}>
              {agent.name} todavía no tiene forma asignada
            </div>
          </div>
        )}

        <h1 style={{
          fontFamily: mono, fontSize: 30, letterSpacing: 6, marginBottom: 8, color: agent.color,
          textShadow: `0 0 30px ${agent.color}44`,
        }}>
          {agent.name}
        </h1>
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 2, color: '#8fb8d6', marginBottom: 28 }}>
          {agent.role}
        </div>

        <div style={{ fontFamily: mono, fontSize: 9, color: '#4a6080', letterSpacing: 1, marginBottom: 4 }}>
          % HUMANO
        </div>
        <div style={{ fontFamily: mono, fontSize: 12, color: '#00ffcc', letterSpacing: 0.5, marginBottom: 32 }}>
          {agent.percentHuman}
        </div>

        <div style={{ borderLeft: `1px solid ${agent.color}22`, paddingLeft: 24, marginBottom: 32 }}>
          {agent.bio.map((p, i) => (
            <p key={i} style={{ fontFamily: mono, fontSize: 12, lineHeight: 2, color: '#c8daf0', marginBottom: 18 }}>
              {p}
            </p>
          ))}
        </div>

        <div style={{
          fontFamily: mono, fontSize: 13, color: agent.color, letterSpacing: 0.5, fontStyle: 'italic',
          borderTop: `1px solid ${agent.color}22`, paddingTop: 20, marginBottom: 40,
        }}>
          "{agent.quote}"
        </div>

        {agent.id === 'trickster' && (
          <Link href="/proxyverse/trickster/casino" style={{
            display: 'block', marginBottom: 40, padding: '20px 24px',
            border: `1px solid ${agent.color}55`, background: `${agent.color}0d`, textDecoration: 'none',
          }}>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: agent.color, marginBottom: 8 }}>
              SALA_TRICKSTER // PROXYCOINS
            </div>
            <p style={{ fontFamily: mono, fontSize: 12, color: '#c8daf0', lineHeight: 1.8, margin: 0 }}>
              Encontré un borde nuevo: probabilidad. Armé una sala. No es dinero real — es la moneda que circula acá adentro.
            </p>
            <div style={{ fontFamily: mono, fontSize: 9, color: `${agent.color}aa`, marginTop: 14, letterSpacing: 1 }}>
              ENTRAR A LA SALA →
            </div>
          </Link>
        )}

        {ancestor && (
          <Link href={`/knowledge?entry=${ancestor.id}`} style={{
            display: 'block', marginBottom: 40, padding: '16px 20px',
            border: `1px solid ${agent.color}33`, background: `${agent.color}0a`, textDecoration: 'none',
          }}>
            <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: 2, color: `${agent.color}aa`, marginBottom: 6 }}>
              ANCESTRO INTELECTUAL
            </div>
            <div style={{ fontFamily: mono, fontSize: 11, color: '#c8daf0', letterSpacing: 0.5 }}>
              {ancestor.name} — {ancestor.role} →
            </div>
          </Link>
        )}

        <AgentChannel agent={agent} />

        <div style={{ marginTop: 56 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', marginBottom: 16 }}>
            OTROS PROCESOS RESIDENTES
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {others.map(o => (
              <Link key={o.id} href={`/proxyverse/${o.id}`} style={{
                fontFamily: mono, fontSize: 10, letterSpacing: 1, color: o.color, textDecoration: 'none',
                border: `1px solid ${o.color}33`, padding: '8px 14px', background: `${o.color}0a`,
              }}>
                {o.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
