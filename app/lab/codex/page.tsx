'use client'

// /lab/codex — el Codex Cogito como espacio, no como lista. Pedido
// explícito: "un espacio 3D, como una mente, sueño, visión, con nubes de
// texto, geometría, entrelazamientos, interacciones, flotar, aprender,
// descubrir algo interactivo, lúdico". Hubo un visor 3D de /knowledge
// antes (KnowledgeScene.tsx) que se borró a pedido explícito en su
// momento -- esto no es un intento de revivir aquello, es una idea
// distinta: no dibuja las 88 entradas como una forma geométrica fija, las
// deja flotar en una simulación de fuerzas real (repulsión entre todas +
// atracción a lo largo de cada conexión real de entries.ts/edges +
// atracción suave al centro de su propio cluster), así que las mismas 109
// conexiones que en /knowledge son filas de texto acá son hilos de luz
// entre puntos que se mueven solos, para siempre, sin asentarse del todo
// -- la "respiración" es justamente eso: nunca llega a un equilibrio
// estático.
//
// Las etiquetas de texto NO son GUI de Babylon (el proyecto no tiene
// @babylonjs/gui instalado, y agregarlo solo para texto es una dependencia
// de más): son divs de HTML comunes, proyectados cuadro a cuadro desde la
// posición 3D de cada nodo con Vector3.Project -- la técnica estándar para
// overlays 2D sobre una escena 3D, y da control total de tipografía con
// el mismo Space Mono del resto del sitio.
//
// Mismo patrón imperativo de Babylon.js que el resto de /lab (import
// dinámico, sin SSR, engine/scene en el scope del efecto).

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { entries, edges, clusters, type KnowledgeEntry, type Cluster } from '@/components/knowledge/entries'
import { agents } from '@/components/proxyverse/agents'

const mono = "'Space Mono', monospace"

// Hash determinístico de un id -> fase en [0, 2π) -- mismo espíritu que el
// hashNoise de /lab/primercuerpo: nada de Math.random, la misma entrada
// siempre da la misma fase (reproducible, no decorativo al azar).
function hashPhase(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return ((h % 1000) / 1000) * Math.PI * 2
}

// Distribuye N puntos ~uniformemente sobre una esfera (espiral de
// Fibonacci) -- siete clusters, siete centros bien separados en el
// espacio, sin agruparlos todos de un lado.
function fibonacciSpherePoint(i: number, n: number, radius: number): [number, number, number] {
  const phi = Math.acos(1 - (2 * (i + 0.5)) / n)
  const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5)
  return [radius * Math.sin(phi) * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi)]
}

const FORMULA_LABELS = { equation: 'ECUACIÓN', quote: 'CITA TEXTUAL', concept: 'NOTACIÓN CONCEPTUAL' }
const FORMULA_DIM = { equation: '#00ffcc', quote: '#b06bff', concept: '#4a6080' }

function DetailPanel({ entry, onClose }: { entry: KnowledgeEntry; onClose: () => void }) {
  const color = clusters[entry.cluster].color
  const agent = entry.relatedAgent ? agents.find(a => a.id === entry.relatedAgent) : undefined
  return (
    <div style={{
      position: 'fixed', zIndex: 30, fontFamily: mono,
      left: 0, right: 0, bottom: 0, maxHeight: '60vh', overflowY: 'auto',
      background: '#000810ee', borderTop: `1px solid ${color}55`,
      padding: '22px 24px 32px', backdropFilter: 'blur(6px)',
    }}>
      <button
        onClick={onClose}
        aria-label="cerrar"
        style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#6f86a3', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
      >
        ×
      </button>
      <div style={{ maxWidth: 640 }}>
        <div style={{ fontSize: 16, color, letterSpacing: 0.5, marginBottom: 4 }}>{entry.name}</div>
        <div style={{ fontSize: 10.5, color: '#6f86a3', letterSpacing: 1, marginBottom: 14 }}>{entry.years} — {entry.role}</div>
        <span style={{
          fontSize: 10, letterSpacing: 2, color: FORMULA_DIM[entry.formulaKind],
          border: `1px solid ${FORMULA_DIM[entry.formulaKind]}55`, padding: '2px 6px',
        }}>
          {FORMULA_LABELS[entry.formulaKind]}
        </span>
        <div style={{ fontSize: 13, color: '#00ffcc', margin: '10px 0 4px', lineHeight: 1.6, wordBreak: 'break-word' }}>{entry.formula}</div>
        <div style={{ fontSize: 10.5, color: '#6f86a3', letterSpacing: 1, marginBottom: 14 }}>{entry.formulaLabel}</div>
        <p style={{ fontSize: 12, lineHeight: 1.9, color: '#c8daf0', marginBottom: 16 }}>{entry.summary}</p>
        <div style={{ borderLeft: `2px solid ${color}33`, paddingLeft: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color, marginBottom: 8 }}>EJEMPLO</div>
          <p style={{ fontSize: 12, lineHeight: 1.8, color: '#9fc4e0' }}>{entry.example}</p>
        </div>
        {agent && (
          <Link href={`/proxyverse/${agent.id}`} className="press" style={{ display: 'block', marginTop: 18, paddingTop: 14, borderTop: `1px solid ${agent.color}33`, textDecoration: 'none' }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: agent.color, marginBottom: 6 }}>ESTO YA VIVE EN PROXYVERSE</div>
            <div style={{ fontSize: 12, color: '#c8daf0' }}>{agent.name} — {agent.role} →</div>
          </Link>
        )}
      </div>
    </div>
  )
}

export default function CodexSpacePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labelRefs = useRef<(HTMLDivElement | null)[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedEntry = selectedId ? entries.find((e) => e.id === selectedId) ?? null : null

  useEffect(() => {
    if (!canvasRef.current) return
    let engine: any
    let scene: any
    let disposed = false
    let removeResize: (() => void) | undefined

    const init = async () => {
      const B = await import('@babylonjs/core')
      if (disposed) return
      const canvas = canvasRef.current!
      engine = new B.Engine(canvas, true)
      scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0.008, 0.008, 0.018, 1)
      scene.fogMode = B.Scene.FOGMODE_EXP2
      scene.fogDensity = 0.011
      scene.fogColor = new B.Color3(0.01, 0.01, 0.03)

      const camera = new B.ArcRotateCamera('cam', Math.PI / 3, Math.PI / 2.5, 19, B.Vector3.Zero(), scene)
      camera.attachControl(canvas, true)
      camera.lowerRadiusLimit = 6
      camera.upperRadiusLimit = 34
      camera.wheelPrecision = 28
      camera.pinchPrecision = 90
      camera.panningSensibility = 0 // sin paneo -- solo orbitar y acercar, para no perder el centro

      const hemi = new B.HemisphericLight('h', new B.Vector3(0, 1, 0), scene)
      hemi.intensity = 0.4

      const glow = new B.GlowLayer('glow', scene)
      glow.intensity = 0.55

      // polvo de fondo, profundidad sin forma
      for (let i = 0; i < 260; i++) {
        const star = B.MeshBuilder.CreateSphere(`star${i}`, { diameter: 0.02 + Math.random() * 0.03 }, scene)
        star.position = new B.Vector3((Math.random() - 0.5) * 70, (Math.random() - 0.5) * 70, (Math.random() - 0.5) * 70)
        const sm = new B.StandardMaterial(`starMat${i}`, scene)
        sm.emissiveColor = new B.Color3(0.55, 0.55, 0.75)
        sm.disableLighting = true
        star.material = sm
      }

      const clusterIds = Object.keys(clusters) as Cluster[]
      const clusterCenters = new Map<Cluster, any>()
      clusterIds.forEach((c, i) => {
        const [x, y, z] = fibonacciSpherePoint(i, clusterIds.length, 7.5)
        clusterCenters.set(c, new B.Vector3(x, y, z))
      })

      const clusterMats = new Map<Cluster, any>()
      clusterIds.forEach((c) => {
        const mat = new B.StandardMaterial(`mat_${c}`, scene)
        mat.diffuseColor = B.Color3.FromHexString(clusters[c].color).scale(0.4)
        mat.emissiveColor = B.Color3.FromHexString(clusters[c].color).scale(0.85)
        mat.specularColor = B.Color3.Black()
        clusterMats.set(c, mat)
      })

      type NodeState = { entry: KnowledgeEntry; mesh: any; pos: any; vel: any; center: any; phase: number }
      const nodes: NodeState[] = entries.map((entry) => {
        const center = clusterCenters.get(entry.cluster)!
        const phase = hashPhase(entry.id)
        const offset = new B.Vector3(Math.cos(phase) * 1.6, Math.sin(phase * 1.7) * 1.6, Math.sin(phase) * 1.6)
        const pos = center.add(offset)
        const mesh = B.MeshBuilder.CreateSphere(`n_${entry.id}`, { diameter: 0.22, segments: 8 }, scene)
        mesh.position = pos.clone()
        mesh.material = clusterMats.get(entry.cluster)
        return { entry, mesh, pos: pos.clone(), vel: B.Vector3.Zero(), center, phase }
      })
      const nodeById = new Map(nodes.map((n) => [n.entry.id, n]))
      const validEdges = edges.filter(([a, b]) => nodeById.has(a) && nodeById.has(b))

      let linesMesh: any = null

      let last = performance.now()
      engine.runRenderLoop(() => {
        const now = performance.now()
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        const t = now / 1000

        camera.alpha += 0.0006 // deriva ambiente -- no pelea con el arrastre, solo nunca queda del todo quieto

        // repulsión entre todos los nodos
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i]
            const b = nodes[j]
            const diff = a.pos.subtract(b.pos)
            const distSq = Math.max(0.6, diff.lengthSquared())
            const dir = diff.normalize().scale((1.9 / distSq) * dt)
            a.vel.addInPlace(dir)
            b.vel.subtractInPlace(dir)
          }
        }
        // atracción a lo largo de cada conexión real
        for (const [a, b] of validEdges) {
          const na = nodeById.get(a)!
          const nb = nodeById.get(b)!
          const diff = nb.pos.subtract(na.pos)
          const dist = diff.length()
          if (dist < 1e-4) continue
          const dir = diff.normalize().scale((dist - 2.3) * 0.1 * dt)
          na.vel.addInPlace(dir)
          nb.vel.subtractInPlace(dir)
        }
        // atracción suave al centro del propio cluster -- evita que todo se disperse para siempre
        for (const n of nodes) {
          n.vel.addInPlace(n.center.subtract(n.pos).scale(0.045 * dt))
        }
        // integrar, amortiguar, respirar
        for (const n of nodes) {
          n.vel.scaleInPlace(0.9)
          const speed = n.vel.length()
          if (speed > 2.6) n.vel.scaleInPlace(2.6 / speed)
          n.pos.addInPlace(n.vel)
          const jitter = new B.Vector3(
            Math.sin(t * 0.4 + n.phase) * 0.1,
            Math.cos(t * 0.33 + n.phase * 1.3) * 0.1,
            Math.sin(t * 0.27 + n.phase * 0.7) * 0.1,
          )
          n.mesh.position = n.pos.add(jitter)
        }

        const lines = validEdges.map(([a, b]) => [nodeById.get(a)!.mesh.position, nodeById.get(b)!.mesh.position])
        linesMesh = B.MeshBuilder.CreateLineSystem('edgeLines', { lines, instance: linesMesh, updatable: true }, scene)
        linesMesh.color = new B.Color3(0.35, 0.5, 0.7)
        linesMesh.alpha = 0.3

        // proyectar cada nodo a espacio de pantalla para las etiquetas HTML
        const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
        nodes.forEach((n, i) => {
          const el = labelRefs.current[i]
          if (!el) return
          const proj = B.Vector3.Project(n.mesh.position, B.Matrix.Identity(), scene.getTransformMatrix(), viewport)
          if (proj.z < 0 || proj.z > 1) {
            el.style.opacity = '0'
            el.style.pointerEvents = 'none'
            return
          }
          const scale = Math.max(0.55, 1.3 - proj.z * 0.95)
          // offset vertical: si el texto queda centrado sobre la esfera, el
          // brillo (glow layer) tapa las letras del medio -- lo bajamos para
          // que quede debajo del nodo, no encima.
          el.style.transform = `translate(-50%, 0%) translate(${proj.x}px, ${proj.y + 10 * scale}px) scale(${scale})`
          el.style.opacity = String(Math.max(0.3, 1 - proj.z * 0.8))
          el.style.pointerEvents = 'auto'
        })

        scene.render()
      })

      const onResize = () => engine.resize()
      window.addEventListener('resize', onResize)
      removeResize = () => window.removeEventListener('resize', onResize)
    }

    init()

    return () => {
      disposed = true
      removeResize?.()
      scene?.dispose()
      engine?.dispose()
    }
  }, [])

  return (
    <div style={{ background: '#000', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100vh', display: 'block', touchAction: 'none' }} />

      {/* overflow hidden: las etiquetas que quedan fuera de cuadro no deben ensanchar la página (en el teléfono sobraban 435 px) */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10, overflow: 'hidden' }}>
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            ref={(el) => { labelRefs.current[i] = el }}
            onClick={() => setSelectedId(entry.id)}
            style={{
              position: 'absolute', left: 0, top: 0, opacity: 0,
              fontFamily: mono, fontSize: 12, letterSpacing: 0.5, whiteSpace: 'nowrap',
              color: clusters[entry.cluster].color, textShadow: `0 0 8px ${clusters[entry.cluster].color}aa`,
              cursor: 'pointer', padding: '4px 8px', userSelect: 'none',
            }}
          >
            {entry.name}
          </div>
        ))}
      </div>

      <Link href="/knowledge" className="press tap-ext" style={{
        position: 'fixed', top: 16, left: 16, zIndex: 25,
        fontFamily: mono, fontSize: 10.5, letterSpacing: 2, color: '#00d4ffaa', textDecoration: 'none',
        border: '1px solid #00d4ff44', padding: '6px 12px', background: '#00050aaa',
      }}>
        ← CODEX COGITO
      </Link>

      <div style={{
        position: 'fixed', top: 16, right: 16, zIndex: 25, textAlign: 'right',
        fontFamily: mono, fontSize: 10, letterSpacing: 1, color: '#6f86a3', lineHeight: 1.8,
      }}>
        ARRASTRÁ PARA MIRAR · PELLIZCÁ/SCROLL PARA ACERCAR<br />TOCÁ UN NOMBRE PARA ABRIRLO
      </div>

      {selectedEntry && <DetailPanel entry={selectedEntry} onClose={() => setSelectedId(null)} />}
    </div>
  )
}
