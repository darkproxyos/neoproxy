'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { entries } from '@/components/knowledge/entries'
import { initFormation, stepFormation, type FormationState, type FormationParams } from './engine/leader'

// FORMACIÓN — quinta criatura, y la primera donde el cuerpo central no se
// renderiza como criatura: Metatron es el punto que decide, no el que
// actúa. Enjambre fue reglas locales emergiendo solas; esto es lo
// opuesto — coordinación central real, un líder que nadie del grupo
// controla pero que todos obedecen (hasta que calla).

const mono = "'Space Mono', monospace"
const METATRON_AMBER = '#ffb800'
// D, Snake, Genos, Trickster, Prototype — los otros cinco agentes reales,
// no Metatron (que es el líder, no un seguidor).
const FOLLOWER_COLORS = ['#cc0000', '#00ff9d', '#5f95c9', '#b400ff', '#6644aa']
const FOLLOWER_NAMES = ['D', 'SNAKE', 'GENOS', 'TRICKSTER', 'PROTOTYPE']

const ARENA_HALF = 4.0
const PARAMS: FormationParams = {
  arenaHalf: ARENA_HALF,
  leaderMaxSpeed: 1.0,
  leaderMaxForce: 0.05,
  wanderRadius: 0.6,
  wanderDist: 1.0,
  wanderJitter: 0.6,
  followerMaxSpeed: 1.6,
  followerMaxForce: 0.14,
  attractGain: 1,
  repelGain: 0.9,
  repelRadius: 1.1,
  broadcastMin: 6,
  broadcastMax: 11,
  silenceMin: 3,
  silenceMax: 5,
}

function hex3(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function AuthorCard({ entryId, accent }: { entryId: string; accent: string }) {
  const entry = entries.find((e) => e.id === entryId)
  if (!entry) return null
  return (
    <Link href={`/knowledge?entry=${entry.id}`} style={{
      display: 'block', marginTop: 10, padding: '10px 12px', border: `1px solid ${accent}33`,
      background: `${accent}0a`, textDecoration: 'none',
    }}>
      <div style={{ fontSize: 9, color: accent, letterSpacing: 1, marginBottom: 4 }}>
        {entry.name.toUpperCase()} · {entry.years}
      </div>
      <div style={{ fontSize: 9, color: '#8fb8d6', letterSpacing: 0.5, marginBottom: 6 }}>{entry.role}</div>
      <div style={{ fontSize: 9, color: '#4a6080', fontStyle: 'italic', lineHeight: 1.6 }}>{entry.formulaLabel}</div>
    </Link>
  )
}

export default function FormacionPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const disposedRef = useRef(false)
  const stateRef = useRef<FormationState>(initFormation(FOLLOWER_COLORS.length, 1, ARENA_HALF))
  const clockRef = useRef(0)

  const [broadcasting, setBroadcasting] = useState(true)
  const [switches, setSwitches] = useState(0)
  const [spread, setSpread] = useState(0)

  useEffect(() => {
    if (!canvasRef.current) return
    disposedRef.current = false
    stateRef.current = initFormation(FOLLOWER_COLORS.length, Math.floor(Math.random() * 1e6), ARENA_HALF)
    clockRef.current = 0
    let engine: any
    let switchCount = 0

    const init = async () => {
      const B = await import('@babylonjs/core')
      if (disposedRef.current) return
      engine = new B.Engine(canvasRef.current!, true)
      const scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0.004, 0.008, 0.016, 1)

      const camera = new B.ArcRotateCamera('fo-cam', -Math.PI / 2.6, 1.15, 11, new B.Vector3(0, 0, 0), scene)
      camera.attachControl(canvasRef.current, true)
      camera.wheelPrecision = 35
      camera.lowerRadiusLimit = 2
      camera.upperRadiusLimit = 20
      camera.minZ = 0.05

      const fill = new B.HemisphericLight('fo-fill', new B.Vector3(0, 1, 0.2), scene)
      fill.intensity = 0.55
      fill.groundColor = new B.Color3(0.05, 0.04, 0.02)
      const key = new B.PointLight('fo-key', new B.Vector3(4, 5, -3), scene)
      key.intensity = 0.6

      const boundsBox = B.MeshBuilder.CreateBox('bounds', { size: ARENA_HALF * 2 }, scene)
      const boundsMat = new B.StandardMaterial('boundsMat', scene)
      boundsMat.wireframe = true
      boundsMat.emissiveColor = B.Color3.FromHexString(METATRON_AMBER).scale(0.25)
      boundsMat.alpha = 0.15
      boundsBox.material = boundsMat

      // Metatron: un octaedro de wireframe, no un cuerpo sólido — "no
      // ejecuta", es la decisión, no el actor.
      const leaderMesh = B.MeshBuilder.CreatePolyhedron('leader', { type: 1, size: 0.22 }, scene)
      const leaderMat = new B.StandardMaterial('leaderMat', scene)
      leaderMat.wireframe = true
      leaderMat.emissiveColor = B.Color3.FromHexString(METATRON_AMBER)
      leaderMesh.material = leaderMat

      const followerSphere = B.MeshBuilder.CreateSphere('follower', { diameter: 0.17, segments: 10 }, scene)
      const followerMat = new B.StandardMaterial('followerMat', scene)
      followerMat.specularColor = new B.Color3(0.1, 0.1, 0.1)
      followerSphere.material = followerMat
      followerSphere.thinInstanceCount = FOLLOWER_COLORS.length
      followerSphere.alwaysSelectAsActiveMesh = true
      const initM = new Float32Array(FOLLOWER_COLORS.length * 16)
      for (let i = 0; i < FOLLOWER_COLORS.length; i++) B.Matrix.Identity().copyToArray(initM, i * 16)
      followerSphere.thinInstanceSetBuffer('matrix', initM, 16, true)
      const colorsRGB = FOLLOWER_COLORS.map(hex3)
      const initC = new Float32Array(FOLLOWER_COLORS.length * 4)
      for (let i = 0; i < FOLLOWER_COLORS.length; i++) {
        const [r, g, b] = colorsRGB[i]
        initC[i * 4] = r; initC[i * 4 + 1] = g; initC[i * 4 + 2] = b; initC[i * 4 + 3] = 1
      }
      followerSphere.thinInstanceSetBuffer('color', initC, 4, true)

      scene.registerBeforeRender(() => {
        const dt = Math.min(engine.getDeltaTime() / 1000, 0.05)
        clockRef.current += dt
        const now = clockRef.current

        const switched = stepFormation(stateRef.current, dt, now, PARAMS)
        if (switched) switchCount++

        const st = stateRef.current
        leaderMesh.position.set(st.leaderPos[0], st.leaderPos[1], st.leaderPos[2])
        leaderMat.alpha = st.broadcasting ? 1 : 0.25
        leaderMesh.rotation.y += dt * (st.broadcasting ? 0.6 : 0.15)

        const matrices = new Float32Array(FOLLOWER_COLORS.length * 16)
        let sumDist = 0
        for (let i = 0; i < st.followers.length; i++) {
          const f = st.followers[i]
          const m = B.Matrix.Translation(f.pos[0], f.pos[1], f.pos[2])
          m.copyToArray(matrices, i * 16)
          sumDist += Math.hypot(f.pos[0] - st.leaderPos[0], f.pos[1] - st.leaderPos[1], f.pos[2] - st.leaderPos[2])
        }
        followerSphere.thinInstanceSetBuffer('matrix', matrices, 16, false)

        setBroadcasting(st.broadcasting)
        setSwitches(switchCount)
        setSpread(sumDist / st.followers.length)
      })

      engine.runRenderLoop(() => scene.render())
    }

    init()
    const onResize = () => engine?.resize()
    window.addEventListener('resize', onResize)
    return () => {
      disposedRef.current = true
      window.removeEventListener('resize', onResize)
      engine?.dispose()
    }
  }, [])

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/experimental" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A EXPERIMENTAL
        </Link>

        <div style={{ fontSize: 9, color: `${METATRON_AMBER}66`, letterSpacing: 6, marginBottom: 16 }}>
          // NPX-XP-FORMACIÓN — QUINTA CRIATURA, COORDINACIÓN CENTRAL
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 700, letterSpacing: 6, color: METATRON_AMBER,
          textShadow: `0 0 40px ${METATRON_AMBER}44`, marginBottom: 16, lineHeight: 1,
        }}>
          FORMACIÓN
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 720, marginBottom: 32 }}>
          El octaedro de wireframe es Metatron — no actúa, decide. Los otros cinco (cada uno con su
          color real) lo siguen por atracción, sin amontonarse por repulsión mutua (líder virtual +
          potenciales artificiales, ver tarjeta abajo — no son los boids de Enjambre, acá hay una
          decisión central, no reglas de vecindario). Pero cada tanto, Metatron calla: la atracción se
          apaga, y cada uno sigue corriendo solo — "no hay caos, hay silencio".
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(260px, 1fr)', gap: 24 }}>
          <div style={{ aspectRatio: '4 / 3', position: 'relative', border: `1px solid ${METATRON_AMBER}33` }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>

          <div>
            <div style={{ border: `1px solid ${METATRON_AMBER}33`, background: `${METATRON_AMBER}08`, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: `${METATRON_AMBER}cc`, marginBottom: 10 }}>// ESTADO</div>
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  fontSize: 13, letterSpacing: 2, color: broadcasting ? METATRON_AMBER : '#4a6080',
                  textShadow: broadcasting ? `0 0 12px ${METATRON_AMBER}` : 'none',
                }}>
                  {broadcasting ? 'EMITIENDO' : 'SILENCIO'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 10, marginBottom: 12 }}>
                <div style={{ color: '#4a6080' }}>CAMBIOS DE ESTADO</div>
                <div style={{ color: '#c8daf0', textAlign: 'right' }}>{switches}</div>
                <div style={{ color: '#4a6080' }}>DISTANCIA MEDIA AL LÍDER</div>
                <div style={{ color: METATRON_AMBER, textAlign: 'right' }}>{spread.toFixed(2)}</div>
              </div>
              <div style={{ fontSize: 8, letterSpacing: 1, color: '#4a6080', marginBottom: 6 }}>SIGUEN A METATRON:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {FOLLOWER_COLORS.map((c, i) => (
                  <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, color: '#8fb8d6' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
                    {FOLLOWER_NAMES[i]}
                  </span>
                ))}
              </div>
            </div>

            <p style={{ fontSize: 9, color: '#4a6080', letterSpacing: 0.5, lineHeight: 1.9, marginBottom: 4 }}>
              La repulsión entre seguidores nunca se apaga, con o sin líder — nadie choca contra nadie,
              haya o no coordinación.
            </p>
            <AuthorCard entryId="leonard-fiorelli" accent={METATRON_AMBER} />
          </div>
        </div>
      </div>
    </div>
  )
}
