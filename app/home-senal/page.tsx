'use client'

// /home-senal — "RUIDO → SEÑAL". Tercera home index, pedida explícita:
// "algo puramente visual, auditivo... pensemos como cineastas, un
// concepto de entrada". De tres conceptos ofrecidos (cold open tipo Lain,
// endoscopio biomecánico Giger, ruido autoorganizándose en señal), el
// usuario eligió este -- el más atado al canon propio: dramatiza en
// tiempo real lo que el sitio ya dice de sí mismo (autoorganización,
// Prigogine, y la línea "SIGNAL ⇄ NOISE: NO BORDER FOUND" que ya está en
// el boot de /home-3d) pero sin una sola palabra en pantalla -- puramente
// sensorial, como se pidió.
//
// GUION (4 planos, cámara dirigida -- no hay órbita libre de usuario acá,
// a propósito: es la variante "se mira", no "se opera", a diferencia de
// la nube):
//   0. REPOSO (pre-click)   -- negro, overlay CRT/grid del sitio, un
//      prompt mínimo pulsando. Silencio real -- nada de audio ni Babylon
//      se monta todavía (autoplay de audio necesita gesto del usuario de
//      cualquier forma, así que no hay nada que perder haciéndolo así).
//   1. ACTIVACIÓN (click)   -- arranca junto el audio (ruido blanco) y
//      ~1200 puntos de un point cloud, dispersos al azar en un volumen
//      grande alrededor de cámara -- "estática", visual y sonora.
//   2. CONVERGENCIA (~7s)   -- cada punto viaja (easing, no lineal) hacia
//      uno de los 16 vértices reales de un teseracto (components/geometry/
//      polytopes4d.ts, el mismo módulo ya compartido con home-classic) --
//      agrupados en racimos de ~75 puntos por vértice para que cada nodo
//      final se vea como un racimo brillante, no un pixel solo. Cámara:
//      dolly-in continuo (radio 14 -> 9, lo justo para que la forma
//      entera entre en cuadro al resolver), SIN control del usuario. Audio:
//      el ruido se cierra en ganancia mientras un drone de 3 osciladores
//      (fundamental + quinta + octava) sube desde cero, con el filtro del
//      ruido "sintonizando" (resonancia subiendo) como una radio buscando
//      estación.
//   3. ESTRUCTURA (~1.5s)  -- las 32 aristas reales del teseracto
//      aparecen (fade-in de visibility) conectando los racimos ya
//      asentados -- la "señal" encontrada. Un ping corto marca el
//      instante exacto.
//   4. REPOSO FINAL (loop)  -- cámara sigue girando despacio sola
//      (alpha += delta constante), drone + piso de ruido muy bajo
//      sostenidos indefinidamente -- mismo criterio "organismo vivo
//      siempre encendido" que el resto del sitio (SteganoNoise, etc.),
//      nunca silencio absoluto.
//
// Audio 100% generativo con Web Audio API directo (osciladores + ruido
// sintetizado en código, sin assets ni licencias) -- coherente con "el
// software se comporta como un organismo vivo".

import { useEffect, useRef, useState } from 'react'
import { tesseract, rotate4D, foldWTo3D, type Vec4 } from '@/components/geometry/polytopes4d'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'

const CLUSTER_SIZE = 75 // puntos por vértice -- 16 vértices * 75 = 1200 puntos reales
const CONVERGE_MS = 7000
const REVEAL_MS = 1500

type Phase = 'idle' | 'converging' | 'revealing' | 'rest'

export default function HomeSenalPage() {
  const [activated, setActivated] = useState(false)

  return (
    <div style={{ background: '#000', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />
      {activated ? (
        <SenalScene />
      ) : (
        <button
          onClick={() => setActivated(true)}
          style={{
            position: 'fixed', inset: 0, width: '100%', height: '100%', border: 'none', cursor: 'pointer',
            background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            fontFamily: mono, fontSize: 12, letterSpacing: 5, color: `${CYAN}bb`,
            textShadow: `0 0 20px ${CYAN}66`, animation: 'senal-pulse 2.4s ease-in-out infinite',
          }}>
            TOCÁ PARA SINTONIZAR
          </div>
        </button>
      )}
      <style>{`
        @keyframes senal-pulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
      `}</style>
    </div>
  )
}

function SenalScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const disposedRef = useRef(false)

  useEffect(() => {
    disposedRef.current = false
    let engine: any
    let audio: ReturnType<typeof initAudio> | null = null

    const init = async () => {
      const B = await import('@babylonjs/core')
      if (disposedRef.current || !canvasRef.current) return

      audio = initAudio()

      engine = new B.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true })
      const scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0, 0, 0, 1)
      scene.fogMode = B.Scene.FOGMODE_EXP2
      scene.fogColor = new B.Color3(0.01, 0.01, 0.02)
      scene.fogDensity = 0.018

      const camera = new B.ArcRotateCamera('cam', Math.PI / 2.6, Math.PI / 2.3, 14, B.Vector3.Zero(), scene)
      camera.minZ = 0.1
      // sin attachControl a propósito -- cámara dirigida, no operable

      new B.HemisphericLight('h', new B.Vector3(0, 1, 0), scene).intensity = 0.25

      const glow = new B.GlowLayer('glow', scene)
      glow.intensity = 0.6

      // --- el teseracto real: 16 vértices, 32 aristas (components/geometry/polytopes4d.ts) ---
      const poly = tesseract()
      const aXY = 0.4, aZW = 0.7, aXW = 0.3
      const rawTargets = poly.vertices.map((v) => {
        const r = rotate4D(v as Vec4, aXY, aZW, aXW)
        const p = foldWTo3D(r, 2.6)
        return new B.Vector3(p.x * 3.2, p.y * 3.2, p.z * 3.2)
      })
      // el pliegue 4D->3D no deja los vértices centrados en el origen del
      // mundo (la cámara sí apunta fijo ahí) -- sin esto la forma queda
      // descuadrada en cuadro según el ángulo de rotación, un defecto de
      // composición real, no "el ruido la movió" (revisión de diseño).
      const centroid = rawTargets.reduce((acc, v) => acc.addInPlace(v), B.Vector3.Zero()).scale(1 / rawTargets.length)
      const targets = rawTargets.map((v) => v.subtract(centroid))

      // --- point cloud: 1200 puntos, 75 por vértice, dispersos al azar al arrancar ---
      const pcs = new B.PointsCloudSystem('noise', 6, scene)
      const starts: B.Vector3[] = []
      const assigned: number[] = []
      pcs.addPoints(targets.length * CLUSTER_SIZE, (particle: any, i: number) => {
        const vertexIdx = Math.floor(i / CLUSTER_SIZE)
        assigned.push(vertexIdx)
        const start = new B.Vector3(
          (Math.random() - 0.5) * 22,
          (Math.random() - 0.5) * 22,
          (Math.random() - 0.5) * 22,
        )
        starts.push(start)
        particle.position = start.clone()
        particle.color = new B.Color4(0.4, 0.85, 1, 0.9)
      })
      await pcs.buildMeshAsync()
      if (disposedRef.current) { engine.dispose(); return }
      const mat = pcs.mesh!.material as any
      mat.disableLighting = true
      mat.emissiveColor = new B.Color3(0.5, 0.9, 1)

      // --- las 32 aristas reales, ocultas hasta el plano III ---
      const lineSystem = B.MeshBuilder.CreateLineSystem('edges', {
        lines: poly.edges.map(([a, b]) => [targets[a], targets[b]]),
      }, scene)
      lineSystem.color = new B.Color3(0.4, 0.85, 1)
      lineSystem.visibility = 0

      const t0 = performance.now()
      let phase: Phase = 'converging'
      let pinged = false

      const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

      scene.onBeforeRenderObservable.add(() => {
        const elapsed = performance.now() - t0

        if (phase === 'converging' || phase === 'revealing') {
          const t = Math.min(1, elapsed / CONVERGE_MS)
          const e = easeInOutCubic(t)
          for (let i = 0; i < pcs.particles.length; i++) {
            const p = pcs.particles[i]
            const target = targets[assigned[i]]
            p.position.x = starts[i].x + (target.x - starts[i].x) * e
            p.position.y = starts[i].y + (target.y - starts[i].y) * e
            p.position.z = starts[i].z + (target.z - starts[i].z) * e
          }
          pcs.setParticles()

          // dolly-in dirigido: radio 14 -> 9 durante la convergencia --
          // 9 y no más cerca para que la estructura entera entre en
          // cuadro en el plano III (el "aha" necesita ver la forma
          // completa, no un fragmento recortado por los bordes)
          camera.radius = 14 - 5 * e
          camera.alpha += 0.0008

          audio?.updateConvergence(t)

          if (elapsed >= CONVERGE_MS && phase === 'converging') {
            phase = 'revealing'
            audio?.ping()
          }
        }

        if (phase === 'revealing') {
          const tr = Math.min(1, (elapsed - CONVERGE_MS) / REVEAL_MS)
          lineSystem.visibility = tr
          if (tr >= 1) phase = 'rest'
        }

        if (phase === 'rest') {
          // mismo ritmo de giro que antes (sin salto al cambiar de fase) +
          // un dolly-in que sigue cerrando apenas, para siempre, nunca un
          // plano del todo estático -- tope en 7 para no atravesar la
          // geometría.
          camera.alpha += 0.0008
          camera.radius = Math.max(7, camera.radius - 0.0015)
        }
      })

      engine.runRenderLoop(() => scene.render())
      const onResize = () => engine.resize()
      window.addEventListener('resize', onResize)
      disposedRef.current = false
      ;(scene as any).__cleanupResize = () => window.removeEventListener('resize', onResize)
    }

    init()

    return () => {
      disposedRef.current = true
      audio?.stop()
      if (engine) engine.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', outline: 'none' }} />
}

// --- audio 100% generativo, sin assets: ruido blanco sintetizado +
// 3 osciladores detuned para el drone, todo con automation real del
// propio Web Audio API (no un loop de rAF moviendo valores a mano). ---
function initAudio() {
  const Ctx = (window.AudioContext || (window as any).webkitAudioContext)
  const ctx: AudioContext = new Ctx()

  const master = ctx.createGain()
  master.gain.value = 0.5
  master.connect(ctx.destination)

  // ruido blanco real -- buffer de 2s con samples al azar, en loop
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const noiseSource = ctx.createBufferSource()
  noiseSource.buffer = noiseBuffer
  noiseSource.loop = true

  const noiseFilter = ctx.createBiquadFilter()
  noiseFilter.type = 'lowpass'
  noiseFilter.frequency.value = 9000
  noiseFilter.Q.value = 0.4

  const noiseGain = ctx.createGain()
  noiseGain.gain.value = 0.5

  noiseSource.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(master)
  noiseSource.start()

  // drone: fundamental + quinta + octava, detuned levemente para cuerpo
  const toneGain = ctx.createGain()
  toneGain.gain.value = 0
  toneGain.connect(master)
  const freqs = [55, 82.4, 110]
  const oscs = freqs.map((f, i) => {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    o.detune.value = (i - 1) * 4
    o.connect(toneGain)
    o.start()
    return o
  })

  const now = () => ctx.currentTime

  return {
    updateConvergence(t: number) {
      // t: 0..1 a lo largo de CONVERGE_MS -- un solo setTargetAtTime por
      // llamada es barato y real automation de WebAudio, no un valor
      // puesto a mano cada frame sin suavizado.
      const n = now()
      noiseGain.gain.setTargetAtTime(0.5 - 0.42 * t, n, 0.08)
      toneGain.gain.setTargetAtTime(0.28 * t, n, 0.08)
      noiseFilter.frequency.setTargetAtTime(9000 - 7800 * t, n, 0.08)
      noiseFilter.Q.setTargetAtTime(0.4 + 7 * Math.sin(Math.PI * Math.min(1, t)), n, 0.08)
    },
    ping() {
      const n = now()
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = 880
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, n)
      g.gain.linearRampToValueAtTime(0.18, n + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, n + 0.7)
      o.connect(g)
      g.connect(master)
      o.start(n)
      o.stop(n + 0.75)
      // asentar el piso de reposo: resonancia baja, ruido de fondo mínimo
      noiseFilter.Q.setTargetAtTime(2.2, n, 0.4)
      noiseGain.gain.setTargetAtTime(0.06, n, 0.6)
      toneGain.gain.setTargetAtTime(0.22, n, 0.6)
    },
    stop() {
      try {
        noiseSource.stop()
        oscs.forEach((o) => o.stop())
        ctx.close()
      } catch {
        // ya detenido/cerrado -- nada que hacer
      }
    },
  }
}
