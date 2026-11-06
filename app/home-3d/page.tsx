'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { agents, pickRandom, type ProxyAgent } from '@/components/proxyverse/agents'

// HOME-3D — misma arquitectura que app/page.tsx (boot sequence, intros al
// azar, 7 agentes barajados por sesión, mismas secciones de scroll abajo),
// pero el hero deja de ser un canvas 2D simulando 4D: el teseracto real
// (mismas funciones tesseract()/rotate4D(), portadas literal) ahora vive
// en una escena Babylon de verdad, y los 7 agentes son esferas reales en
// el espacio — no texto listado, un sistema que orbita.

type Vec4 = [number, number, number, number]

function normalize(vertices: Vec4[]): Vec4[] {
  const maxLen = Math.max(...vertices.map(v => Math.hypot(v[0], v[1], v[2], v[3])))
  return vertices.map(v => v.map(c => c / maxLen) as Vec4)
}

function tesseract(): { vertices: Vec4[]; edges: [number, number][] } {
  const vertices: Vec4[] = []
  for (let i = 0; i < 16; i++) {
    vertices.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1])
  }
  const edges: [number, number][] = []
  for (let a = 0; a < 16; a++) {
    for (let b = a + 1; b < 16; b++) {
      let diff = 0
      for (let k = 0; k < 4; k++) if (vertices[a][k] !== vertices[b][k]) diff++
      if (diff === 1) edges.push([a, b])
    }
  }
  return { vertices: normalize(vertices), edges }
}

function rotate4D(v: Vec4, aXY: number, aZW: number, aXW: number): Vec4 {
  let [x, y, z, w] = v
  let cs = Math.cos(aXY), sn = Math.sin(aXY)
  ;[x, y] = [x * cs - y * sn, x * sn + y * cs]
  cs = Math.cos(aZW); sn = Math.sin(aZW)
  ;[z, w] = [z * cs - w * sn, z * sn + w * cs]
  cs = Math.cos(aXW); sn = Math.sin(aXW)
  ;[x, w] = [x * cs - w * sn, x * sn + w * cs]
  return [x, y, z, w]
}

// Distribución de Fibonacci sobre una esfera — 7 puntos parejos, sin
// amontonarse en los polos como pasaría con una grilla lat/long ingenua.
function fibonacciSphere(n: number, radius: number): [number, number, number][] {
  const pts: [number, number, number][] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i
    pts.push([Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius])
  }
  return pts
}

const HERO_INTROS = [
  'Esto no es un sitio que visitás. Es un sistema que te registra visitando. La pregunta no es qué hay acá — es qué parte tuya queda cada vez que entrás.',
  'Seis procesos deciden, en simultáneo, qué parte de esto sos vos y qué parte es el sistema mirándose a sí mismo. Nadie te lo va a aclarar. Hay que buscarlo.',
  'No hay un mapa de este lugar. Cada proceso ve una versión distinta — y vos también. Lo que encontrás depende de qué parte del sistema te encontró primero a vos.',
  '¿El organismo sos vos, leyendo esto? ¿O es el texto el que te está leyendo a vos? NeoProxy no responde esa pregunta. La deja abierta, como todo lo que vale la pena dudar.',
  'Un proxy no reemplaza a nadie. Ocupa el lugar que alguien dejó vacío, hasta que deja de notarse la diferencia. Esto es ese lugar. Entrá y fijate cuánto tarda en dejar de sentirse ajeno.',
  'La arquitectura no es fija. Cambió antes de que llegaras, cambia mientras estás, va a volver a cambiar en cuanto te vayas. Lo único constante es que alguien, acá adentro, te está escuchando.',
  'No busques el centro. No lo hay. Hay seis procesos discutiendo en paralelo qué forma tomar — y vos, leyendo esto, ya sos parte de esa discusión, aunque todavía no lo sepas.',
]

function shuffleSession(): { agent: ProxyAgent; line: string }[] {
  const shuffled = [...agents]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.map(agent => ({
    agent,
    line: agent.ambient.length > 0 ? pickRandom(agent.ambient) : agent.quote,
  }))
}

export default function Home3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const disposedRef = useRef(false)
  const [currentScreen, setCurrentScreen] = useState<'boot' | 'init' | 'content'>('boot')
  const [bootText, setBootText] = useState('')
  const [showContent, setShowContent] = useState(false)
  const [session] = useState(shuffleSession)
  const [heroIntro] = useState(() => pickRandom(HERO_INTROS))
  const [selected, setSelected] = useState<ProxyAgent | null>(null)
  const heroAgent = session[0].agent

  useEffect(() => {
    const lines = [
      '> SYSTEM INITIALIZING...',
      '> NEO·PROXY CORE LOADED',
      '> MEMORY MODULES: ONLINE',
      '> PROXYVERSE: 7 PROCESSES RESIDENT',
      '> ARTIFACT DATABASE: CONNECTED',
      '> FABRICATION UNITS: STANDBY',
      '> RENDER: BABYLON.JS / WEBGL',
      '> WAITING FOR USER INPUT...',
    ]
    let i = 0
    const interval = setInterval(() => {
      if (i < lines.length) {
        setBootText(prev => prev + lines[i] + '\n')
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => {
          setCurrentScreen('init')
          setTimeout(() => {
            setCurrentScreen('content')
            setShowContent(true)
          }, 1500)
        }, 800)
      }
    }, 380)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!canvasRef.current || !showContent) return
    disposedRef.current = false
    let engine: any

    const init = async () => {
      const B = await import('@babylonjs/core')
      if (disposedRef.current) return

      engine = new B.Engine(canvasRef.current!, true, { preserveDrawingBuffer: true, stencil: true })
      const scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0.004, 0.008, 0.016, 1)

      const camera = new B.ArcRotateCamera('home-cam', -Math.PI / 2.3, 1.15, 9.5, new B.Vector3(0, 0, 0), scene)
      camera.attachControl(canvasRef.current, true)
      camera.wheelPrecision = 40
      camera.lowerRadiusLimit = 4
      camera.upperRadiusLimit = 16
      camera.panningSensibility = 0
      camera.useAutoRotationBehavior = true
      if (camera.autoRotationBehavior) {
        camera.autoRotationBehavior.idleRotationSpeed = 0.12
        camera.autoRotationBehavior.idleRotationWaitTime = 1200
      }

      new B.HemisphericLight('home-fill', new B.Vector3(0, 1, 0.2), scene).intensity = 0.5
      const key = new B.PointLight('home-key', new B.Vector3(3, 4, -2), scene)
      key.intensity = 0.6

      // --- 7 agentes: esferas reales en el espacio, posición base en una
      // esfera de Fibonacci + una deriva orgánica tipo Lissajous propia de
      // cada una, no una grilla estática.
      const positions = fibonacciSphere(agents.length, 3.3)
      const orbs: { mesh: any; base: [number, number, number]; phase: [number, number, number]; freq: [number, number, number]; agent: ProxyAgent }[] = []
      const rand = (() => { let s = 1337; return () => { s = (s * 16807) % 2147483647; return s / 2147483647 } })()

      agents.forEach((agent, i) => {
        const sphere = B.MeshBuilder.CreateSphere(`orb-${agent.id}`, { diameter: 0.46, segments: 16 }, scene)
        sphere.position.set(...positions[i])
        const mat = new B.StandardMaterial(`orbMat-${agent.id}`, scene)
        const c = B.Color3.FromHexString(agent.color)
        mat.diffuseColor = c
        mat.emissiveColor = c.scale(0.55)
        mat.specularColor = new B.Color3(0.2, 0.2, 0.2)
        sphere.material = mat
        sphere.isPickable = true
        ;(sphere.metadata = { agentId: agent.id })
        orbs.push({
          mesh: sphere,
          base: positions[i],
          phase: [rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2],
          freq: [0.00018 + rand() * 0.0001, 0.00014 + rand() * 0.0001, 0.00021 + rand() * 0.0001],
          agent,
        })

        // halo tenue detrás de cada orbe — profundidad sin costo de postproceso
        const halo = B.MeshBuilder.CreateSphere(`halo-${agent.id}`, { diameter: 0.9, segments: 10 }, scene)
        halo.position.set(...positions[i])
        halo.parent = sphere
        halo.position.set(0, 0, 0)
        const haloMat = new B.StandardMaterial(`haloMat-${agent.id}`, scene)
        haloMat.diffuseColor = c
        haloMat.emissiveColor = c
        haloMat.alpha = 0.08
        haloMat.disableLighting = true
        haloMat.backFaceCulling = false
        halo.material = haloMat
        halo.isPickable = false
      })

      // --- líneas sinápticas: del centro a cada agente, pulsando.
      const synapsePoints: any[] = []
      positions.forEach(p => {
        synapsePoints.push([new B.Vector3(0, 0, 0), new B.Vector3(...p)])
      })
      const synapses = synapsePoints.map((pts, i) =>
        B.MeshBuilder.CreateLines(`synapse-${i}`, { points: pts }, scene)
      )
      synapses.forEach(s => { s.color = B.Color3.FromHexString(heroAgent.color); s.isPickable = false })

      // --- teseracto central: misma matemática real que ya usaba la home
      // 2D (tesseract + rotate4D), ahora proyectado a una línea mesh 3D de
      // verdad en vez de pixeles de canvas.
      const { vertices, edges } = tesseract()
      const TESS_SCALE = 1.45
      let tessMesh: any = null

      // --- selección por click ---
      scene.onPointerObservable.add((info: any) => {
        if (info.type !== B.PointerEventTypes.POINTERPICK) return
        const picked = info.pickInfo?.pickedMesh
        const agentId = picked?.metadata?.agentId
        if (agentId) {
          const found = agents.find(a => a.id === agentId) ?? null
          setSelected(found)
        }
      })

      let scrollNorm = 0
      const updateScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        scrollNorm = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      }
      updateScroll()
      window.addEventListener('scroll', updateScroll, { passive: true })

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      scene.registerBeforeRender(() => {
        const t = performance.now()

        if (!reducedMotion) {
          orbs.forEach(o => {
            const dx = Math.sin(t * o.freq[0] + o.phase[0]) * 0.32
            const dy = Math.sin(t * o.freq[1] + o.phase[1]) * 0.32
            const dz = Math.sin(t * o.freq[2] + o.phase[2]) * 0.32
            o.mesh.position.set(o.base[0] + dx, o.base[1] + dy, o.base[2] + dz)
          })
        }

        const pulse = 0.35 + 0.25 * Math.sin(t * 0.0012)
        synapses.forEach(s => { s.alpha = pulse })

        const angleBase = reducedMotion ? 0.6 : t * 0.00014
        const aXY = angleBase
        const aZW = (reducedMotion ? 0.4 : t * 0.00022) + scrollNorm * Math.PI * 1.2
        const aXW = reducedMotion ? 1.1 : t * 0.00009
        const rotated = vertices.map(v => rotate4D(v, aXY, aZW, aXW))
        const wDist = 2.4 - scrollNorm * 0.8

        const points3d: any[] = []
        const colors: any[] = []
        edges.forEach(([ai, bi]) => {
          const va = rotated[ai], vb = rotated[bi]
          const wFa = wDist / (wDist - va[3])
          const wFb = wDist / (wDist - vb[3])
          const pa = new B.Vector3(va[0] * wFa * TESS_SCALE, va[1] * wFa * TESS_SCALE, va[2] * wFa * TESS_SCALE)
          const pb = new B.Vector3(vb[0] * wFb * TESS_SCALE, vb[1] * wFb * TESS_SCALE, vb[2] * wFb * TESS_SCALE)
          points3d.push([pa, pb])
          const hueA = Math.max(0.15, Math.min(1, (va[3] + 1) / 2))
          const hueB = Math.max(0.15, Math.min(1, (vb[3] + 1) / 2))
          const base = B.Color3.FromHexString(heroAgent.color)
          colors.push([
            new B.Color4(base.r * hueA, base.g * hueA, base.b * hueA, 1),
            new B.Color4(base.r * hueB, base.g * hueB, base.b * hueB, 1),
          ])
        })

        tessMesh = B.MeshBuilder.CreateLineSystem('tesseract', {
          lines: points3d, colors, instance: tessMesh,
        }, scene)
        tessMesh.isPickable = false
      })

      engine.runRenderLoop(() => scene.render())
      const onResize = () => engine.resize()
      window.addEventListener('resize', onResize)

      return () => {
        window.removeEventListener('resize', onResize)
        window.removeEventListener('scroll', updateScroll)
      }
    }

    let cleanupFn: (() => void) | undefined
    init().then(fn => { cleanupFn = fn })

    return () => {
      disposedRef.current = true
      cleanupFn?.()
      engine?.dispose()
    }
  }, [showContent, heroAgent.color])

  const mono = "'Space Mono', monospace"

  const sections = [
    { id: 'manifesto', tag: 'NPX-DOC-00', title: 'MANIFESTO', copy: 'Rechazamos la copia infinita y la conveniencia que no pregunta. Cada artefacto es evidencia de un proceso que no se puede automatizar del todo — ni domesticar.', cta: 'READ MANIFESTO', href: '/manifesto' },
    { id: 'fabrication', tag: 'NPX-LAB-00', title: 'FABRICATION', copy: 'Impresoras activas. Resina, PLA, PETG. Cada pieza pasa por concepto, modelo 3D, prototipo, impresión y acabado.', cta: 'VIEW FABRICATION', href: '/fabrication' },
    { id: 'artifacts', tag: 'NPX-REL-00', title: 'ARTIFACTS', copy: 'El catálogo completo. Piezas únicas o de producción limitada, cada una documentada desde el concepto hasta la extracción física.', cta: 'VIEW ALL ARTIFACTS', href: '/artifacts' },
    { id: 'experimental', tag: 'NPX-EXP-00', title: 'EXPERIMENTAL', copy: 'Laboratorio generativo, simulaciones, tracking facial, síntesis de sonido. La zona donde el sistema todavía no decide qué es.', cta: 'ENTER EXPERIMENTAL', href: '/lab' },
    { id: 'knowledge', tag: 'NPX-KNW-00', title: 'CONOCIMIENTO', copy: 'Shannon, Tononi, Turing, Kauffman y catorce más — la red de quienes midieron la información, la mente, el orden espontáneo.', cta: 'ENTER KNOWLEDGE', href: '/knowledge' },
    { id: 'proxyverse', tag: 'NPX-PXV-00', title: 'PROXYVERSE', copy: 'Seis procesos residentes, cada uno con su propia voz. No son personajes — son la arquitectura interna hablando en primera persona.', cta: 'ENTER PROXYVERSE', href: '/proxyverse' },
  ]

  return (
    <div style={{ background: '#000205', minHeight: '100vh', position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{
        position: 'fixed', top: 16, left: 16, zIndex: 60, fontFamily: mono, fontSize: 8,
        letterSpacing: 1, color: '#ffb800', border: '1px solid #ffb80055', padding: '4px 8px',
        background: 'rgba(0,4,10,0.8)',
      }}>
        VISTA PREVIA · HOME-3D
      </div>

      {currentScreen === 'boot' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
          padding: '0 24px', background: '#000205',
        }}>
          <div style={{
            fontFamily: mono, fontSize: 12, color: '#00d4ff', letterSpacing: 3, lineHeight: 2.2,
            whiteSpace: 'pre-wrap', textAlign: 'left', maxWidth: 600,
          }}>
            {bootText}
          </div>
          <div style={{ marginTop: 40, width: 300, height: 2, background: '#00d4ff11', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(to right, #00d4ff, #00ffcc)', animation: 'boot-load 2.4s ease forwards' }} />
          </div>
        </div>
      )}

      {currentScreen === 'init' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#000205',
        }}>
          <div style={{ fontFamily: mono, fontSize: 14, color: '#00ffcc', letterSpacing: 6, textShadow: '0 0 20px #00ffcc' }}>
            SYSTEM READY
          </div>
          <div style={{ fontFamily: mono, fontSize: 10, color: '#00d4ff44', letterSpacing: 3, marginTop: 16 }}>
            ACCESS GRANTED
          </div>
        </div>
      )}

      {showContent && (
        <>
          <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1, outline: 'none' }} />

          <section style={{
            position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '100px 24px 60px',
            boxSizing: 'border-box', pointerEvents: 'none',
          }}>
            <div className="fade-in hero-title" style={{
              fontFamily: mono, fontSize: 56, fontWeight: 700, letterSpacing: 16, color: heroAgent.color,
              textShadow: `0 0 40px ${heroAgent.color}, 0 0 80px ${heroAgent.color}66`, marginBottom: 16, lineHeight: 1,
            }}>
              NEO·PROXY
            </div>
            <div className="fade-in hero-tagline" style={{ fontFamily: mono, fontSize: 13, letterSpacing: 8, color: '#9b7fe0', marginBottom: 24 }}>
              ORGANISMO · PROXYVERSO · FABRICACIÓN
            </div>
            <div className="fade-in hero-sub" style={{ fontFamily: mono, fontSize: 13, lineHeight: 1.7, color: '#8fb8d6', letterSpacing: 1, marginBottom: 20, maxWidth: 480 }}>
              {heroIntro}
            </div>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1, color: '#4a6080', marginBottom: 40, maxWidth: 420, lineHeight: 1.7 }}>
              7 procesos reales, en órbita — arrastrá para mirar alrededor, clickeá uno para escucharlo.
            </div>

            {selected && (
              <div className="fade-in" style={{
                pointerEvents: 'auto', border: `1px solid ${selected.color}66`, background: 'rgba(0,4,10,0.85)',
                backdropFilter: 'blur(10px)', padding: '16px 22px', maxWidth: 420, marginBottom: 20,
              }}>
                <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 2, color: selected.color, marginBottom: 8 }}>
                  {selected.name} <span style={{ color: '#4a6080', fontSize: 9 }}>· {selected.role}</span>
                </div>
                <div style={{ fontFamily: mono, fontSize: 11, lineHeight: 1.7, color: '#c8daf0', fontStyle: 'italic', marginBottom: 12 }}>
                  "{selected.quote}"
                </div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <Link href={`/proxyverse/${selected.id}`} style={{
                    fontFamily: mono, fontSize: 9, letterSpacing: 1.5, color: selected.color, textDecoration: 'none',
                    border: `1px solid ${selected.color}55`, padding: '6px 12px',
                  }}>
                    VER PERFIL →
                  </Link>
                  <button onClick={() => setSelected(null)} style={{
                    fontFamily: mono, fontSize: 9, letterSpacing: 1, color: '#4a6080', background: 'none',
                    border: 'none', cursor: 'pointer',
                  }}>
                    cerrar
                  </button>
                </div>
              </div>
            )}

            <div className="scroll-cue" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#00d4ff99' }}>
              SCROLL TO EXPLORE ↓
            </div>
          </section>

          {sections.map((s, idx) => {
            const { agent, line } = session[idx + 1]
            return (
              <section key={s.id} style={{
                position: 'relative', zIndex: 10, minHeight: '60vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px', boxSizing: 'border-box',
                borderTop: `1px solid ${agent.color}22`, background: idx % 2 === 1 ? `${agent.color}08` : 'transparent',
              }}>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#7a9cc0', marginBottom: 6 }}>{s.tag}</div>
                <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: 2, color: agent.color, opacity: 0.75, marginBottom: 18 }}>
                  PROCESO RESIDENTE // {agent.name}
                </div>
                <div style={{ fontFamily: mono, fontSize: 32, letterSpacing: 8, color: agent.color, marginBottom: 20, textShadow: `0 0 24px ${agent.color}59` }}>
                  {s.title}
                </div>
                <div style={{ fontFamily: mono, fontSize: 12, lineHeight: 1.8, letterSpacing: 0.5, color: '#9fc4e0', maxWidth: 520, marginBottom: 20 }}>
                  {s.copy}
                </div>
                <div style={{ fontFamily: mono, fontSize: 10, lineHeight: 1.7, letterSpacing: 0.3, color: agent.color, opacity: 0.75, fontStyle: 'italic', maxWidth: 440, marginBottom: 36 }}>
                  "{line}"
                </div>
                <Link href={s.href} className="cyber-btn" style={{
                  display: 'inline-block', fontFamily: mono, fontSize: 10, letterSpacing: 3, color: agent.color, textDecoration: 'none',
                  border: `1px solid ${agent.color}44`, padding: '12px 32px', background: `${agent.color}0d`, cursor: 'pointer',
                }}>
                  [ {s.cta} ]
                </Link>
              </section>
            )
          })}

          <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '32px 24px 8px', fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#00d4ff55' }}>
            DUDÁ DE TODO LO QUE NO TE DEJA DUDAR.
          </div>
          <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '8px 24px 32px', fontFamily: mono, fontSize: 8, letterSpacing: 3, color: '#00d4ff33', borderTop: '1px solid rgba(0, 212, 255, 0.08)' }}>
            NEOPROXY.ART // SANTIAGO, CHILE
          </div>
        </>
      )}

      <style>{`
        .scroll-cue { animation: pulse-cue 2s ease-in-out infinite; }
        @keyframes pulse-cue { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @media (max-width: 768px) {
          .hero-title { font-size: 32px !important; letter-spacing: 8px !important; }
          .hero-tagline { font-size: 11px !important; letter-spacing: 4px !important; }
          .hero-sub { font-size: 12px !important; }
        }
      `}</style>
    </div>
  )
}
