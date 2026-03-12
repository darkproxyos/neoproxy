'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import * as BABYLON from 'babylonjs'
import styles from './page.module.css'

type V4 = [number, number, number, number]

export default function NeoProxyClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // ENGINE
    const engine = new BABYLON.Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    })
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1)

    // CAMERA
    const camera = new BABYLON.ArcRotateCamera(
      'cam',
      Math.PI / 4,
      Math.PI / 3,
      10,
      BABYLON.Vector3.Zero(),
      scene
    )
    camera.attachControl(canvasRef.current, true)
    camera.lowerRadiusLimit = 8
    camera.upperRadiusLimit = 12

    new BABYLON.HemisphericLight(
      'light',
      new BABYLON.Vector3(0, 1, 0),
      scene
    )

    // =============================
    // HEXACOSICORON (600-cell)
    // =============================
    const φ = (1 + Math.sqrt(5)) / 2
    const invφ = 1 / φ
    const signs = [-1, 1]

    const vertices4D: V4[] = []

    // Hypercube
    for (const x of signs)
      for (const y of signs)
        for (const z of signs)
          for (const w of signs)
            vertices4D.push([x, y, z, w])

    // Axes
    const axes: V4[] = [
      [2, 0, 0, 0],
      [0, 2, 0, 0],
      [0, 0, 2, 0],
      [0, 0, 0, 2],
    ]
    axes.forEach(a => {
      vertices4D.push(a)
      vertices4D.push([-a[0], -a[1], -a[2], -a[3]])
    })

    // Golden permutations
    const base = [0, 1, φ, invφ]

    function permute(arr: number[]): number[][] {
      if (arr.length === 1) return [arr]
      const res: number[][] = []
      for (let i = 0; i < arr.length; i++) {
        const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]
        for (const p of permute(rest)) res.push([arr[i], ...p])
      }
      return res
    }

    const perms = permute(base)
    for (const p of perms)
      for (const s1 of signs)
        for (const s2 of signs)
          for (const s3 of signs)
            vertices4D.push([p[0], s1 * p[1], s2 * p[2], s3 * p[3]])

    // Deduplicate
    const uniq = new Map<string, V4>()
    vertices4D.forEach(v =>
      uniq.set(v.map(n => n.toFixed(5)).join(','), v)
    )
    const V = Array.from(uniq.values())

    // Edges
    const edges: [number, number][] = []
    const eps = 0.001

    function dist4(a: V4, b: V4) {
      return Math.hypot(
        a[0] - b[0],
        a[1] - b[1],
        a[2] - b[2],
        a[3] - b[3]
      )
    }

    const d0 = dist4(V[0], V[1])
    for (let i = 0; i < V.length; i++) {
      for (let j = i + 1; j < V.length; j++) {
        if (Math.abs(dist4(V[i], V[j]) - d0) < eps) {
          edges.push([i, j])
        }
      }
    }

    // 4D rotation
    let rotXW = 0
    let rotYW = 0

    function rotate4D(v: V4): V4 {
      let [x, y, z, w] = v
      const cx = Math.cos(rotXW)
      const sx = Math.sin(rotXW)
      const cy = Math.cos(rotYW)
      const sy = Math.sin(rotYW)

      const x1 = x * cx - w * sx
      const w1 = x * sx + w * cx
      const y1 = y * cy - w1 * sy
      const w2 = y * sy + w1 * cy

      return [x1, y1, z, w2]
    }

    function project(v: V4) {
      const d = 4
      const s = d / (d - v[3])
      return new BABYLON.Vector3(v[0] * s, v[1] * s, v[2] * s)
    }

    // Points
    const points: BABYLON.Mesh[] = []
    const mats: BABYLON.StandardMaterial[] = []

    V.forEach(() => {
      const m = BABYLON.MeshBuilder.CreateSphere(
        'p',
        { diameter: 0.06 },
        scene
      )
      const mat = new BABYLON.StandardMaterial('pm', scene)
      mat.emissiveColor = new BABYLON.Color3(0.4, 1, 0.8)
      mat.alpha = 1
      m.material = mat
      points.push(m)
      mats.push(mat)
    })

    // Lines
    const lines: BABYLON.LinesMesh[] = []
    edges.forEach(() => {
      const l = BABYLON.MeshBuilder.CreateLines(
        'e',
        { points: [BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero()] },
        scene
      )
      l.color = new BABYLON.Color3(0.2, 0.8, 0.9)
      lines.push(l)
    })

    // Interaction state
    let targetRotXW = 0
    let targetRotYW = 0
    let smoothRotXW = 0
    let smoothRotYW = 0

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position from -1 to 1
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = (e.clientY / window.innerHeight) * 2 - 1

      // Map to rotation angles (sensitivity factor 2)
      targetRotXW = x * 2
      targetRotYW = y * 2
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Loop
    engine.runRenderLoop(() => {
      // Smooth interpolation (lerp)
      smoothRotXW += (targetRotXW - smoothRotXW) * 0.05
      smoothRotYW += (targetRotYW - smoothRotYW) * 0.05

      // Update global rotation variables used by rotate4D
      rotXW = smoothRotXW
      rotYW = smoothRotYW

      const rotated = V.map(rotate4D)
      const projected = rotated.map(project)

      projected.forEach((p, i) => {
        points[i].position.copyFrom(p)
        mats[i].alpha = 0.2 + 0.8 * (1 - Math.abs(p.z) / 8)
      })

      edges.forEach(([i, j], k) => {
        lines[k].setVerticesData(
          BABYLON.VertexBuffer.PositionKind,
          [
            projected[i].x, projected[i].y, projected[i].z,
            projected[j].x, projected[j].y, projected[j].z,
          ],
          true
        )
      })

      scene.render()
    })

    window.addEventListener('resize', () => engine.resize())
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      engine.dispose()
    }
  }, [])

  return (
    <main className={styles.root}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <section className={styles.ui}>

        {/* Top Right Navigation */}
        <div style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 100, pointerEvents: 'auto' }}>
          <Link href="/manifesto" className={styles.ctaButton} style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', border: '1px solid #06b6d4' }}>
            [ MANIFESTO_PHI ]
          </Link>
        </div>

        <h1 className={styles.title}>NEO·PROXY</h1>
        <p className={styles.subtitle}>creative operating system</p>

        <div className={styles.block}>
          <div>STATUS: <span style={{ color: '#5ef0c0' }}>ONLINE</span></div>
          <div>LAYER: SURFACE_v0.2 // darkproxy</div>
        </div>

        <div className={styles.serviceList}>
          <Link href="/npos" className={styles.serviceBlock}>
            <span className={styles.serviceTitle}>[01] NPos OS</span>
            <span className={styles.serviceDesc}>Creative Operating System · Generative Lab · Memory</span>
          </Link>

          <Link href="/fabrication" className={styles.serviceBlock}>
            <span className={styles.serviceTitle}>[02] FABRICATION</span>
            <span className={styles.serviceDesc}>Resina UV · PLA · Arduino · Objetos Físicos</span>
          </Link>

          <Link href="/npos/lab" className={styles.serviceBlock}>
            <span className={styles.serviceTitle}>[03] GENERATIVE LAB</span>
            <span className={styles.serviceDesc}>Atractores Caóticos · Geometría · STL Export</span>
          </Link>
        </div>

        <div className={styles.warn}>[ SYSTEM ONLINE — NPOS v0.2 DEPLOYED ]</div>

        <nav className={styles.menu}>
          <Link href="/npos" className={styles.ctaButton}>
            [ ENTER_NPos_OS ]
          </Link>
        </nav>
      </section>
    </main>
  )
}
