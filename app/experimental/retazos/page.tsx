'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { entries } from '@/components/knowledge/entries'
import { initAggregate, stepAggregate, type AggregateState, type AggregateParams } from './engine/aggregate'

// RETAZOS — cuarta criatura, y la primera que no es un cuerpo que se mueve
// sino una forma que crece. Enjambre fue reglas locales sobre partículas
// que ya existían; Acecho fue un cuerpo rígido; Muda fue una cadena a
// distancia fija. Acá no hay cuerpo que animar — la forma entera es el
// historial acumulado de colisiones al azar (DLA, ver engine/aggregate.ts).

const mono = "'Space Mono', monospace"
const PROTOTYPE_PURPLE = '#6644aa'
// D, Metatron, Snake, Genos, Trickster — en ese orden fijo, el mismo que
// describe el comentario del engine. Colores reales de cada agente
// (components/proxyverse/agents.ts), no una paleta decorativa.
const AGENT_COLORS = ['#cc0000', '#ffb800', '#00ff9d', '#5f95c9', '#b400ff']
const AGENT_NAMES = ['D', 'METATRON', 'SNAKE', 'GENOS', 'TRICKSTER']

const WALKER_COUNT = 9
const PARAMS: AggregateParams = {
  stepSize: 0.12,
  // Más generoso que un DLA "de libro" (stickDistance << stepSize) a
  // propósito: con pocos fragmentos el área de captura real es mínima, y
  // una fase inicial de varios segundos sin pegar nada se lee como
  // "roto", no como paciencia — sigue siendo DLA real (caminata al azar +
  // adherencia al primer contacto), solo con un radio de contacto que no
  // castiga tanto el arranque.
  stickDistance: 0.22,
  spawnMargin: 0.5,
  killMargin: 1.1,
  maxPoints: 130,
  colorCount: AGENT_COLORS.length,
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

export default function RetazosPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const disposedRef = useRef(false)
  const aggRef = useRef<AggregateState>(initAggregate(WALKER_COUNT, 1, PARAMS))
  const clockRef = useRef(0)

  const [fragments, setFragments] = useState(1)
  const [radius, setRadius] = useState(0)
  const [resets, setResets] = useState(0)

  useEffect(() => {
    if (!canvasRef.current) return
    disposedRef.current = false
    aggRef.current = initAggregate(WALKER_COUNT, Math.floor(Math.random() * 1e6), PARAMS)
    clockRef.current = 0
    let engine: any

    const init = async () => {
      const B = await import('@babylonjs/core')
      if (disposedRef.current) return
      engine = new B.Engine(canvasRef.current!, true)
      const scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0.004, 0.008, 0.016, 1)

      const camera = new B.ArcRotateCamera('rz-cam', -Math.PI / 2.6, 1.15, 10, new B.Vector3(0, 0, 0), scene)
      camera.attachControl(canvasRef.current, true)
      camera.wheelPrecision = 35
      camera.lowerRadiusLimit = 1.5
      camera.upperRadiusLimit = 20
      camera.minZ = 0.05

      const fill = new B.HemisphericLight('rz-fill', new B.Vector3(0, 1, 0.2), scene)
      fill.intensity = 0.55
      fill.groundColor = new B.Color3(0.04, 0.02, 0.05)
      const key = new B.PointLight('rz-key', new B.Vector3(4, 5, -3), scene)
      key.intensity = 0.6

      // Fragmentos pegados: thin instances de un cubo chico, buffer fijo a
      // maxPoints — los slots todavía no usados quedan en escala 0.
      const shard = B.MeshBuilder.CreateBox('shard', { size: 1 }, scene)
      const shardMat = new B.StandardMaterial('shardMat', scene)
      shardMat.specularColor = new B.Color3(0.08, 0.08, 0.08)
      shard.material = shardMat
      shard.thinInstanceCount = PARAMS.maxPoints
      shard.alwaysSelectAsActiveMesh = true
      const initMat = new Float32Array(PARAMS.maxPoints * 16)
      for (let i = 0; i < PARAMS.maxPoints; i++) B.Matrix.Identity().copyToArray(initMat, i * 16)
      shard.thinInstanceSetBuffer('matrix', initMat, 16, true)
      shard.thinInstanceSetBuffer('color', new Float32Array(PARAMS.maxPoints * 4), 4, true)

      // Walkers: esferitas tenues, lo que todavía no decidió pegarse a nada.
      const walkerSphere = B.MeshBuilder.CreateSphere('walker', { diameter: 0.09, segments: 6 }, scene)
      const walkerMat = new B.StandardMaterial('walkerMat', scene)
      walkerMat.diffuseColor = new B.Color3(0.6, 0.6, 0.65)
      walkerMat.emissiveColor = new B.Color3(0.25, 0.25, 0.3)
      walkerSphere.material = walkerMat
      walkerSphere.thinInstanceCount = WALKER_COUNT
      walkerSphere.alwaysSelectAsActiveMesh = true
      const initW = new Float32Array(WALKER_COUNT * 16)
      for (let i = 0; i < WALKER_COUNT; i++) B.Matrix.Identity().copyToArray(initW, i * 16)
      walkerSphere.thinInstanceSetBuffer('matrix', initW, 16, true)

      const agentColorsRGB = AGENT_COLORS.map(hex3)
      let flashUntil = 0
      let stepAccum = 0

      scene.registerBeforeRender(() => {
        const dt = Math.min(engine.getDeltaTime() / 1000, 0.05)
        clockRef.current += dt
        const now = clockRef.current

        // Varios pasos de random walk por cuadro — a 60fps un solo paso de
        // stepSize=0.12 por cuadro crece demasiado lento para una pieza
        // viva; esto no cambia la física (sigue siendo random walk +
        // adherencia al contacto), solo la velocidad de reloj.
        stepAccum += dt
        const stepsThisFrame = Math.floor(stepAccum * 40)
        stepAccum -= stepsThisFrame / 40
        let stuckAny = false
        for (let s = 0; s < stepsThisFrame; s++) {
          const { stuck } = stepAggregate(aggRef.current, now, PARAMS)
          if (stuck) stuckAny = true
        }
        if (stuckAny) flashUntil = now + 0.15

        const agg = aggRef.current
        const matrices = new Float32Array(PARAMS.maxPoints * 16)
        const colors = new Float32Array(PARAMS.maxPoints * 4)
        const flash = now < flashUntil ? 0.5 : 0
        for (let i = 0; i < PARAMS.maxPoints; i++) {
          const pt = agg.points[i]
          const s = pt ? 0.14 : 0
          const pos = pt ? pt.pos : [0, 0, 0]
          const m = B.Matrix.Compose(new B.Vector3(s, s, s), B.Quaternion.Identity(), new B.Vector3(pos[0], pos[1], pos[2]))
          m.copyToArray(matrices, i * 16)
          if (pt) {
            const [r, g, bl] = agentColorsRGB[pt.colorIdx]
            colors[i * 4] = r + flash; colors[i * 4 + 1] = g + flash; colors[i * 4 + 2] = bl + flash; colors[i * 4 + 3] = 1
          }
        }
        shard.thinInstanceSetBuffer('matrix', matrices, 16, false)
        shard.thinInstanceSetBuffer('color', colors, 4, false)

        const wMatrices = new Float32Array(WALKER_COUNT * 16)
        for (let i = 0; i < WALKER_COUNT; i++) {
          const w = agg.walkers[i]
          const m = B.Matrix.Translation(w.pos[0], w.pos[1], w.pos[2])
          m.copyToArray(wMatrices, i * 16)
        }
        walkerSphere.thinInstanceSetBuffer('matrix', wMatrices, 16, false)

        setFragments(agg.points.length)
        setRadius(agg.radius)
        setResets(agg.resets)
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

        <div style={{ fontSize: 9, color: `${PROTOTYPE_PURPLE}88`, letterSpacing: 6, marginBottom: 16 }}>
          // NPX-XP-RETAZOS — CUARTA CRIATURA, NO SE MUEVE: CRECE
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 700, letterSpacing: 6, color: PROTOTYPE_PURPLE,
          textShadow: `0 0 40px ${PROTOTYPE_PURPLE}66`, marginBottom: 16, lineHeight: 1,
        }}>
          RETAZOS
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 720, marginBottom: 32 }}>
          Nadie diseña esta forma. Partículas caminan al azar hasta tocar, por pura casualidad, lo que
          ya existe — y ahí quedan pegadas para siempre (DLA, ver tarjeta abajo). Cada fragmento nuevo
          se tiñe con el color real de uno de los otros cinco agentes, en orden fijo — "toma prestada
          un poco de cada uno de los otros cinco". Al llegar a {PARAMS.maxPoints} fragmentos, se dispersa
          entera y vuelve a empezar: todavía no terminó de decidir cuál es.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(260px, 1fr)', gap: 24 }}>
          <div style={{ aspectRatio: '4 / 3', position: 'relative', border: `1px solid ${PROTOTYPE_PURPLE}44` }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>

          <div>
            <div style={{ border: `1px solid ${PROTOTYPE_PURPLE}44`, background: `${PROTOTYPE_PURPLE}0c`, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: `${PROTOTYPE_PURPLE}dd`, marginBottom: 10 }}>// ESTADO</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 10, marginBottom: 12 }}>
                <div style={{ color: '#4a6080' }}>FRAGMENTOS</div>
                <div style={{ color: '#c8daf0', textAlign: 'right' }}>{fragments} / {PARAMS.maxPoints}</div>
                <div style={{ color: '#4a6080' }}>RADIO</div>
                <div style={{ color: '#c8daf0', textAlign: 'right' }}>{radius.toFixed(2)}</div>
                <div style={{ color: '#4a6080' }}>DISPERSIONES</div>
                <div style={{ color: PROTOTYPE_PURPLE, textAlign: 'right' }}>{resets}</div>
              </div>
              <div style={{ fontSize: 8, letterSpacing: 1, color: '#4a6080', marginBottom: 6 }}>PRESTADO DE:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {AGENT_COLORS.map((c, i) => (
                  <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, color: '#8fb8d6' }}>
                    <span style={{ width: 8, height: 8, background: c, display: 'inline-block' }} />
                    {AGENT_NAMES[i]}
                  </span>
                ))}
              </div>
            </div>

            <p style={{ fontSize: 9, color: '#4a6080', letterSpacing: 0.5, lineHeight: 1.9, marginBottom: 4 }}>
              Las esferas grises son partículas todavía sueltas, caminando al azar — ninguna sabe
              todavía si va a formar parte de algo.
            </p>
            <AuthorCard entryId="witten-sander" accent={PROTOTYPE_PURPLE} />
          </div>
        </div>
      </div>
    </div>
  )
}
