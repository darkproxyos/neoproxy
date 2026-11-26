'use client'

// WETWARE // HOLOGRAMA -- primera versión de una capa visual inmersiva
// encima del Codex (/archivo/wetware): en vez de leer el documento de
// arriba a abajo, acá hay una figura humana holográfica (wireframe, no
// anatomía realista -- ver nota de diseño más abajo) que orbitás con el
// mouse/dedo, con 4 de los 14 sistemas del documento marcados como nodos
// que pulsan sobre el cuerpo. Tocar un nodo abre un panel con el
// contenido real de esa sección (mismo texto que el documento, condensado
// -- ver engine/systemsData.ts) y un link de vuelta a la sección completa.
//
// Prueba de concepto deliberada: 4 sistemas (cerebro, circulatorio,
// digestivo, musculoesquelético), no los 14 -- si el lenguaje visual
// convence, se escala al resto.
//
// Mismo patrón imperativo de Babylon.js que /games/mobius (import
// dinámico, sin SSR, wireframe clonado encima del relleno sólido para que
// la figura no se lea como una forma lisa sin volumen). La figura es
// geometría procedural (cápsulas + esfera) con un shader de holograma
// simple -- no un modelo anatómico importado: ver la respuesta sobre
// recursos externos que dio pie a esto, un cuerpo estilizado encaja mejor
// con el lenguaje visual NeoProxy que una anatomía realista, y evita
// cualquier lío de licencia de assets de terceros.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BODY_SYSTEMS } from './engine/systemsData'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'

type ScreenPos = { x: number; y: number; visible: boolean }

// Offset en píxeles del chip respecto del punto proyectado del cuerpo --
// fijo por sistema para que los 4 labels no se amontonen entre sí al
// orbitar (ver clamp() en el render para que tampoco se salgan de pantalla).
const LABEL_OFFSET: Record<string, { dx: number; dy: number }> = {
  cerebro: { dx: -46, dy: -108 },
  musculoesqueletico: { dx: 108, dy: -40 },
  circulatorio: { dx: -156, dy: 6 },
  digestivo: { dx: 132, dy: 72 },
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

// El panel expandido es mucho más alto/ancho que el chip chico -- con el
// mismo margen de clamp para los dos, crecía por arriba de la pantalla
// (ver captura de verificación). Márgenes más generosos cuando isSel.
function chipPos(x: number, y: number, dx: number, dy: number, isSel: boolean, w: number, h: number) {
  const marginX = isSel ? 170 : 90
  const marginY = isSel ? 220 : 50
  return { cx: clamp(x + dx, marginX, w - marginX), cy: clamp(y + dy, marginY, h - marginY) }
}

export default function WetwareHologramPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const screenPosRef = useRef<Record<string, ScreenPos>>({})
  const selectedRef = useRef<string | null>(null)

  const [ready, setReady] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [screenPos, setScreenPos] = useState<Record<string, ScreenPos>>({})
  const [viewport, setViewport] = useState({ w: 0, h: 0 })

  useEffect(() => { selectedRef.current = selected }, [selected])

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setScreenPos({ ...screenPosRef.current }), 80)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return
    let engine: any, scene: any
    let disposed = false
    const cleanupFns: Array<() => void> = []

    const init = async () => {
      const B = await import('@babylonjs/core')
      if (disposed) return
      const canvas = canvasRef.current!
      engine = new B.Engine(canvas, true)
      scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0.004, 0.008, 0.016, 1)

      const camera = new B.ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 2.35, 7.2, new B.Vector3(0, 1.7, 0), scene)
      camera.lowerRadiusLimit = 4.2
      camera.upperRadiusLimit = 11
      camera.lowerBetaLimit = 0.25
      camera.upperBetaLimit = Math.PI / 1.9
      camera.wheelPrecision = 35
      camera.pinchPrecision = 80
      camera.panningSensibility = 0
      camera.attachControl(canvas, true)
      camera.useAutoRotationBehavior = true
      if (camera.autoRotationBehavior) {
        camera.autoRotationBehavior.idleRotationSpeed = 0.12
        camera.autoRotationBehavior.idleRotationWaitTime = 2200
        camera.autoRotationBehavior.idleRotationSpinupTime = 1000
      }

      const hemi = new B.HemisphericLight('h', new B.Vector3(0, 1, 0.2), scene)
      hemi.intensity = 0.55
      hemi.diffuse = new B.Color3(0.6, 0.75, 0.95)
      hemi.groundColor = new B.Color3(0.02, 0.03, 0.06)

      const glow = new B.GlowLayer('glow', scene)
      glow.intensity = 0.8

      // -- anillo del piso, mismo lenguaje que el resto del sitio --
      const ring = B.MeshBuilder.CreateDisc('ring', { radius: 2.5, tessellation: 64 }, scene)
      ring.rotation.x = Math.PI / 2
      ring.position.y = 0.01
      const ringMat = new B.StandardMaterial('ringMat', scene)
      ringMat.diffuseColor = B.Color3.Black()
      ringMat.emissiveColor = B.Color3.FromHexString(CYAN).scale(0.16)
      ringMat.alpha = 0.22
      ringMat.wireframe = true
      ring.material = ringMat

      // -- figura humana estilizada: relleno sólido muy tenue + malla
      // wireframe encima (mismo truco que /games/mobius) para que se lea
      // con volumen real, no como una silueta plana --
      const fillMat = new B.StandardMaterial('bodyFill', scene)
      fillMat.diffuseColor = B.Color3.Black()
      fillMat.emissiveColor = B.Color3.FromHexString(CYAN).scale(0.5)
      fillMat.alpha = 0.07
      fillMat.backFaceCulling = false
      const wireMat = new B.StandardMaterial('bodyWire', scene)
      wireMat.diffuseColor = B.Color3.Black()
      wireMat.emissiveColor = B.Color3.FromHexString(CYAN).scale(0.85)
      wireMat.wireframe = true
      wireMat.alpha = 0.55

      const addPart = (mesh: any) => {
        mesh.material = fillMat
        const wire = mesh.clone(`${mesh.name}_wire`)
        wire.material = wireMat
      }

      const head = B.MeshBuilder.CreateSphere('head', { diameter: 0.64, segments: 14 }, scene)
      head.position.set(0, 2.68, 0)
      addPart(head)

      const torso = B.MeshBuilder.CreateCapsule('torso', { height: 1.15, radius: 0.4, tessellation: 16 }, scene)
      torso.position.set(0, 1.85, 0)
      addPart(torso)

      const pelvis = B.MeshBuilder.CreateCapsule('pelvis', { height: 0.4, radius: 0.36, tessellation: 16 }, scene)
      pelvis.position.set(0, 1.28, 0)
      addPart(pelvis)

      for (const side of [-1, 1]) {
        const leg = B.MeshBuilder.CreateCapsule(`leg_${side}`, { height: 1.35, radius: 0.17, tessellation: 12 }, scene)
        leg.position.set(0.22 * side, 0.62, 0)
        addPart(leg)
        const arm = B.MeshBuilder.CreateCapsule(`arm_${side}`, { height: 1.05, radius: 0.12, tessellation: 12 }, scene)
        arm.position.set(0.56 * side, 1.85, 0)
        addPart(arm)
      }

      // -- hotspots: solo decorativos en 3D (pulsan, brillan) -- el click
      // real pasa por el chip HTML, no por picking de Babylon, para que
      // funcione igual de bien en mobile sin agrandar la esfera visual. --
      const hotspotMeshes: Record<string, any> = {}
      for (const sys of BODY_SYSTEMS) {
        const dot = B.MeshBuilder.CreateSphere(`dot_${sys.id}`, { diameter: 0.1, segments: 10 }, scene)
        dot.position.set(sys.anchor.x, sys.anchor.y, sys.anchor.z)
        const dotMat = new B.StandardMaterial(`dotMat_${sys.id}`, scene)
        dotMat.diffuseColor = B.Color3.Black()
        dotMat.emissiveColor = B.Color3.FromHexString(sys.color)
        dot.material = dotMat
        hotspotMeshes[sys.id] = dot
      }

      const onResize = () => engine.resize()
      window.addEventListener('resize', onResize)
      cleanupFns.push(() => window.removeEventListener('resize', onResize))

      setReady(true)

      engine.runRenderLoop(() => {
        const t = performance.now() / 1000
        const viewportGlobal = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
        const positions: Record<string, ScreenPos> = {}

        for (const sys of BODY_SYSTEMS) {
          const dot = hotspotMeshes[sys.id]
          const isSel = selectedRef.current === sys.id
          const pulse = 1 + Math.sin(t * 3 + sys.anchor.y * 4) * 0.22
          const scale = pulse * (isSel ? 1.7 : 1)
          dot.scaling.setAll(scale)

          const projected = B.Vector3.Project(
            dot.getAbsolutePosition(), B.Matrix.Identity(), scene.getTransformMatrix(), viewportGlobal,
          )
          positions[sys.id] = { x: projected.x, y: projected.y, visible: projected.z > -0.02 && projected.z < 1 }
        }
        screenPosRef.current = positions

        scene.render()
      })
    }

    init()

    return () => {
      disposed = true
      cleanupFns.forEach((fn) => fn())
      scene?.dispose()
      engine?.dispose()
    }
  }, [])

  const active = BODY_SYSTEMS.find((s) => s.id === selected) ?? null

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', position: 'relative', overflow: 'hidden' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, height: 46,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px',
        background: 'rgba(5,10,20,0.85)', borderBottom: `1px solid ${CYAN}44`, backdropFilter: 'blur(5px)',
      }}>
        <span style={{ fontFamily: mono, fontSize: 12, letterSpacing: 2, color: CYAN }}>
          NEOPROXY // WETWARE — HOLOGRAMA
        </span>
        <Link href="/archivo/wetware" className="press" style={{ color: CYAN, textDecoration: 'none', fontFamily: mono, fontSize: 10.5, border: `1px solid ${CYAN}66`, padding: '6px 10px', borderRadius: 4 }}>
          EXIT
        </Link>
      </div>

      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none' }} />

      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: mono, fontSize: 12, color: CYAN, letterSpacing: 2,
        }}>
          CARGANDO HOLOGRAMA...
        </div>
      )}

      {ready && viewport.w > 0 && (
        <>
          <svg style={{ position: 'fixed', inset: 0, zIndex: 22, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {BODY_SYSTEMS.map((sys) => {
              const p = screenPos[sys.id]
              if (!p || !p.visible) return null
              const off = LABEL_OFFSET[sys.id]
              const isSel = selected === sys.id
              const { cx, cy } = chipPos(p.x, p.y, off.dx, off.dy, isSel, viewport.w, viewport.h)
              return (
                <line key={sys.id} x1={p.x} y1={p.y} x2={cx} y2={cy} stroke={`${sys.color}99`} strokeWidth={1} />
              )
            })}
          </svg>

          {BODY_SYSTEMS.map((sys) => {
            const p = screenPos[sys.id]
            if (!p || !p.visible) return null
            const off = LABEL_OFFSET[sys.id]
            const isSel = selected === sys.id
            const { cx, cy } = chipPos(p.x, p.y, off.dx, off.dy, isSel, viewport.w, viewport.h)
            return (
              <button
                key={sys.id}
                onClick={() => setSelected((prev) => (prev === sys.id ? null : sys.id))}
                style={{
                  position: 'fixed', left: cx, top: cy, transform: 'translate(-50%, -50%)', zIndex: 23,
                  fontFamily: mono, textAlign: 'left', cursor: 'pointer',
                  width: isSel ? 'min(320px, 86vw)' : 'auto',
                  maxHeight: isSel ? 'min(340px, 65vh)' : 'none',
                  overflowY: isSel ? 'auto' : 'visible',
                  padding: isSel ? '14px 16px' : '6px 10px',
                  borderRadius: 6, background: isSel ? 'rgba(8,12,20,0.92)' : 'rgba(8,12,20,0.7)',
                  border: `1px solid ${sys.color}${isSel ? 'bb' : '66'}`,
                  boxShadow: isSel ? `0 0 24px ${sys.color}33` : 'none',
                  opacity: active && !isSel ? 0.35 : 1,
                  transition: 'padding 0.15s ease, width 0.15s ease, opacity 0.15s ease',
                }}
              >
                <div style={{ fontSize: 10.5, letterSpacing: 2, color: sys.color, whiteSpace: 'nowrap' }}>
                  {sys.roman} — {sys.title}
                </div>
                {!isSel && (
                  <div style={{ fontSize: 10, letterSpacing: 1, color: '#8fb8d6', marginTop: 2, whiteSpace: 'nowrap' }}>
                    {sys.sub}
                  </div>
                )}
                {isSel && (
                  <>
                    <div style={{ fontSize: 10.5, letterSpacing: 1, color: '#8fb8d6', marginTop: 2, marginBottom: 10 }}>
                      {sys.sub}
                    </div>
                    {sys.facts.map((fact, i) => (
                      <p key={i} style={{ fontSize: 11, lineHeight: 1.7, color: '#c8daf0', margin: 0, marginBottom: 8 }}>
                        {fact}
                      </p>
                    ))}
                    <Link
                      href={`/archivo/wetware#${sys.sourceAnchor}`}
                      style={{ fontSize: 10.5, letterSpacing: 1, color: sys.color, textDecoration: 'underline' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      → VER SECCIÓN COMPLETA EN EL DOCUMENTO
                    </Link>
                  </>
                )}
              </button>
            )
          })}

          {!active && (
            <div style={{
              position: 'fixed', bottom: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 21,
              fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: `${CYAN}66`, whiteSpace: 'nowrap',
            }}>
              ARRASTRAR: ORBITAR // SCROLL: ZOOM // TOCÁ UN NODO PARA ABRIR EL PANEL
            </div>
          )}
        </>
      )}
    </div>
  )
}
