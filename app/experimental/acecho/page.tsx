'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { entries } from '@/components/knowledge/entries'
import {
  initMotes, stepMotes, initPredator, stepPredator,
  type Mote, type PredatorState, type MoteParams, type PredatorParams,
} from './engine/predator'

// ACECHO — la segunda criatura, después del enjambre de Trickster. No es
// otro modo del Laboratorio numerado (ver app/experimental/page.tsx: esos
// 6 son una taxonomía cerrada, "forma/tiempo/lenguaje/relación/memoria/
// población") — es su propia pieza, mismo criterio que ORÁCULO y SIGILO.
//
// El enjambre es forrajeo activo (todo el tiempo moviéndose, buscando).
// Acecho es la otra estrategia real: D se queda quieto —casi invisible,
// fiel a su lore ("no tiene cuerpo")— y ataca una sola vez cuando un
// proceso entra en rango, con una predicción de intercepción que no se
// corrige en el aire. Los dos engines (predator.ts) son matemática pura,
// sin Babylon, mismo patrón que boids.ts.

const mono = "'Space Mono', monospace"
const D_RED = '#cc0000'
const PROCESS_BLUE = '#5fd4ff'

const ARENA_HALF = 4.2
const MOTE_COUNT = 14

const MOTE_PARAMS: MoteParams = {
  arenaHalf: ARENA_HALF,
  maxSpeed: 1.1,
  maxForce: 0.06,
  wanderRadius: 0.6,
  wanderDist: 1.0,
  wanderJitter: 0.8,
}

const PREDATOR_PARAMS: PredatorParams = {
  arenaHalf: ARENA_HALF,
  detectionRadius: 2.8,
  hitRadius: 0.26,
  strikeSpeed: 7,
  // Nada de "casi congelado": D deriva despacio (comparado con la
  // velocidad máxima de un proceso, ~15x más lento) pero cubre el espacio
  // en el tiempo, en vez de quedar pegado para siempre al origen —
  // patrulla, no está paralizado.
  dormantJitter: 0.08,
  patienceMin: 1.8,
  patienceMax: 3.5,
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

export default function AcechoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const disposedRef = useRef(false)
  const motesRef = useRef<Mote[]>([])
  const predatorRef = useRef<PredatorState>(initPredator(ARENA_HALF))
  const clockRef = useRef(0)

  const [state, setState] = useState<'dormant' | 'strike'>('dormant')
  const [stats, setStats] = useState({ strikes: 0, hits: 0, misses: 0 })
  const [nearestDist, setNearestDist] = useState(0)

  useEffect(() => {
    if (!canvasRef.current) return
    disposedRef.current = false
    motesRef.current = initMotes(MOTE_COUNT, Math.floor(Math.random() * 1e6), ARENA_HALF)
    predatorRef.current = initPredator(ARENA_HALF)
    clockRef.current = 0
    let engine: any

    const init = async () => {
      const B = await import('@babylonjs/core')
      if (disposedRef.current) return
      engine = new B.Engine(canvasRef.current!, true)
      const scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0.004, 0.008, 0.016, 1)

      const camera = new B.ArcRotateCamera('ac-cam', -Math.PI / 2.6, 1.15, 12.5, new B.Vector3(0, 0, 0), scene)
      camera.attachControl(canvasRef.current, true)
      camera.wheelPrecision = 35
      camera.lowerRadiusLimit = 2
      camera.upperRadiusLimit = 22
      camera.minZ = 0.05

      const fill = new B.HemisphericLight('ac-fill', new B.Vector3(0, 1, 0.2), scene)
      fill.intensity = 0.45
      fill.groundColor = new B.Color3(0.03, 0.02, 0.03)
      const key = new B.PointLight('ac-key', new B.Vector3(4, 5, -3), scene)
      key.intensity = 0.5

      const boundsBox = B.MeshBuilder.CreateBox('bounds', { size: ARENA_HALF * 2 }, scene)
      const boundsMat = new B.StandardMaterial('boundsMat', scene)
      boundsMat.wireframe = true
      boundsMat.emissiveColor = B.Color3.FromHexString(D_RED).scale(0.3)
      boundsMat.alpha = 0.18
      boundsBox.material = boundsMat

      // --- D: cuerpo propio, deliberadamente distinto del boid orgánico
      // de Trickster — tres poliedros angulares de tamaños asimétricos,
      // fusionados en una sola masa irregular (no un cristal perfecto).
      // "D no tiene un cuerpo" — esto es lo más cerca de uno que se le da.
      const core = B.MeshBuilder.CreatePolyhedron('dCore', { type: 10, size: 0.22 }, scene)
      const shardA = B.MeshBuilder.CreatePolyhedron('dShardA', { type: 0, size: 0.14 }, scene)
      shardA.position.set(0.08, 0.1, -0.05)
      shardA.rotation.set(0.6, 1.1, 0.3)
      const shardB = B.MeshBuilder.CreatePolyhedron('dShardB', { type: 0, size: 0.09 }, scene)
      shardB.position.set(-0.1, -0.06, 0.09)
      shardB.rotation.set(1.4, 0.2, 2.1)
      const dBase = B.Mesh.MergeMeshes([core, shardA, shardB], true, true, undefined, false, true)!
      dBase.name = 'dBody'
      const dMat = new B.StandardMaterial('dMat', scene)
      dMat.diffuseColor = B.Color3.FromHexString(D_RED)
      dMat.emissiveColor = B.Color3.FromHexString(D_RED).scale(0.04)
      dMat.specularColor = new B.Color3(0.05, 0.05, 0.05)
      dBase.material = dMat

      // --- Procesos (presa): thin instances de una esfera chica — cian
      // pálido, "dato vivo" más que criatura. Muertos (respawneando)
      // quedan con escala 0, invisibles hasta que reaparecen.
      const moteSphere = B.MeshBuilder.CreateSphere('moteBase', { diameter: 0.16, segments: 8 }, scene)
      const moteMat = new B.StandardMaterial('moteMat', scene)
      moteMat.diffuseColor = B.Color3.FromHexString(PROCESS_BLUE)
      moteMat.emissiveColor = B.Color3.FromHexString(PROCESS_BLUE).scale(0.5)
      moteMat.specularColor = new B.Color3(0.1, 0.1, 0.1)
      moteSphere.material = moteMat
      moteSphere.thinInstanceCount = MOTE_COUNT
      moteSphere.alwaysSelectAsActiveMesh = true
      const initialMatrices = new Float32Array(MOTE_COUNT * 16)
      for (let i = 0; i < MOTE_COUNT; i++) B.Matrix.Identity().copyToArray(initialMatrices, i * 16)
      moteSphere.thinInstanceSetBuffer('matrix', initialMatrices, 16, true)

      let flashUntil = 0
      scene.registerBeforeRender(() => {
        const dt = Math.min(engine.getDeltaTime() / 1000, 0.05)
        clockRef.current += dt
        const now = clockRef.current

        stepMotes(motesRef.current, dt, now, MOTE_PARAMS)
        const hitIdx = stepPredator(predatorRef.current, motesRef.current, now, dt, PREDATOR_PARAMS)
        if (hitIdx >= 0) flashUntil = now + 0.18

        const pred = predatorRef.current
        dBase.position.set(pred.pos[0], pred.pos[1], pred.pos[2])
        if (pred.mode === 'strike') {
          const dir = sub3(pred.strikeTo, pred.strikeFrom)
          const l = Math.hypot(dir[0], dir[1], dir[2])
          if (l > 1e-4) {
            const dirN = new B.Vector3(dir[0] / l, dir[1] / l, dir[2] / l)
            const up = new B.Vector3(0, 1, 0)
            const dot = B.Vector3.Dot(up, dirN)
            if (dot > -0.9999 && dot < 0.9999) {
              dBase.rotationQuaternion = B.Quaternion.RotationAxis(B.Vector3.Cross(up, dirN).normalize(), Math.acos(dot))
            }
          }
          const isFlash = now < flashUntil
          dMat.emissiveColor = isFlash
            ? new B.Color3(1, 1, 1)
            : B.Color3.FromHexString(D_RED).scale(0.9)
        } else {
          dBase.rotationQuaternion = null
          dBase.rotation.y += dt * 0.15
          dMat.emissiveColor = B.Color3.FromHexString(D_RED).scale(0.04)
        }

        const matrices = new Float32Array(MOTE_COUNT * 16)
        const motes = motesRef.current
        for (let i = 0; i < MOTE_COUNT; i++) {
          const m = motes[i]
          const s = m.alive ? 1 : 0
          const mat = B.Matrix.Compose(
            new B.Vector3(s, s, s),
            B.Quaternion.Identity(),
            new B.Vector3(m.pos[0], m.pos[1], m.pos[2]),
          )
          mat.copyToArray(matrices, i * 16)
        }
        moteSphere.thinInstanceSetBuffer('matrix', matrices, 16, false)

        let nearest = Infinity
        for (const m of motes) if (m.alive) nearest = Math.min(nearest, dist3(pred.pos, m.pos))

        setState(pred.mode)
        setStats({ ...pred.stats })
        setNearestDist(nearest === Infinity ? 0 : nearest)
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

        <div style={{ fontSize: 9, color: `${D_RED}66`, letterSpacing: 6, marginBottom: 16 }}>
          // NPX-XP-ACECHO — SEGUNDA CRIATURA, SU PROPIO ESPACIO
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 700, letterSpacing: 6, color: D_RED,
          textShadow: `0 0 40px ${D_RED}44`, marginBottom: 16, lineHeight: 1,
        }}>
          ACECHO
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 720, marginBottom: 32 }}>
          D no forrajea. El enjambre de Trickster (/experimental/enjambre) es la otra estrategia real —
          moverse todo el tiempo, buscar activamente. Acá, sit-and-wait predation: D se queda casi
          inmóvil, casi invisible, y ataca una sola vez cuando un proceso entra en rango — con una
          predicción de intercepción (pursuit) que no se corrige en el aire. Decide, y actúa.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(260px, 1fr)', gap: 24 }}>
          <div style={{ aspectRatio: '4 / 3', position: 'relative', border: `1px solid ${D_RED}33` }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>

          <div>
            <div style={{ border: `1px solid ${D_RED}33`, background: `${D_RED}08`, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: `${D_RED}cc`, marginBottom: 10 }}>// ESTADO</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                <span style={{
                  fontSize: 13, letterSpacing: 2, color: state === 'strike' ? '#fff' : D_RED,
                  textShadow: state === 'strike' ? `0 0 12px ${D_RED}` : 'none',
                }}>
                  {state === 'strike' ? 'EMBESTIDA' : 'DORMIDO'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 10 }}>
                <div style={{ color: '#4a6080' }}>EMBESTIDAS</div>
                <div style={{ color: '#c8daf0', textAlign: 'right' }}>{stats.strikes}</div>
                <div style={{ color: '#4a6080' }}>ACIERTOS</div>
                <div style={{ color: '#c8daf0', textAlign: 'right' }}>{stats.hits}</div>
                <div style={{ color: '#4a6080' }}>FALLOS</div>
                <div style={{ color: '#c8daf0', textAlign: 'right' }}>{stats.misses}</div>
                <div style={{ color: '#4a6080' }}>PROCESO MÁS CERCA</div>
                <div style={{ color: PROCESS_BLUE, textAlign: 'right' }}>{nearestDist.toFixed(2)}</div>
              </div>
            </div>

            <p style={{ fontSize: 9, color: '#4a6080', letterSpacing: 0.5, lineHeight: 1.9, marginBottom: 4 }}>
              La predicción se calcula una sola vez, al arrancar — no es un misil que corrige el rumbo.
            </p>
            <AuthorCard entryId="reynolds-pursuit" accent={D_RED} />
          </div>
        </div>
      </div>
    </div>
  )
}

function sub3(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}
function dist3(a: [number, number, number], b: [number, number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}
