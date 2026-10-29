'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js'
import { IMAGE_ARTIFACTS, recordArtifactRecognition } from '@/components/artifacts/registry'
import RevealPanel from '@/components/artifacts/RevealPanel'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'

type Status = 'idle' | 'starting' | 'scanning' | 'found' | 'error'

export default function MarcadorPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mindarRef = useRef<MindARThree | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const artifact = IMAGE_ARTIFACTS[0]

  const activar = async () => {
    if (status === 'starting' || status === 'scanning' || status === 'found') return
    setStatus('starting')
    setErrorMsg('')
    try {
      // Import dinámico: el módulo toca `window` apenas se carga (registra
      // window.MINDAR), así que no puede evaluarse en el server — recién
      // acá, dentro de un handler que solo corre en el navegador.
      const { MindARThree } = await import('mind-ar/dist/mindar-image-three.prod.js')
      const container = containerRef.current
      if (!container) throw new Error('sin contenedor')

      const mindarThree = new MindARThree({
        container,
        imageTargetSrc: artifact.targetSrc,
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no',
      })
      mindarRef.current = mindarThree

      const anchor = mindarThree.addAnchor(0)
      anchor.onTargetFound = () => {
        setStatus('found')
        recordArtifactRecognition(artifact.id, 'image')
      }
      anchor.onTargetLost = () => setStatus('scanning')

      await mindarThree.start()
      setStatus('scanning')

      const { renderer, scene, camera } = mindarThree
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera)
      })
    } catch (err) {
      console.error('Error iniciando el marcador AR:', err)
      setErrorMsg('No se pudo iniciar la cámara o el tracking. ¿Diste permiso de cámara?')
      setStatus('error')
    }
  }

  useEffect(() => {
    return () => {
      try { mindarRef.current?.stop() } catch { /* ya puede estar detenido */ }
    }
  }, [])

  const busy = status === 'starting' || status === 'scanning' || status === 'found'

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/realidad-aumentada" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A REALIDAD AUMENTADA
        </Link>

        <div style={{ fontSize: 9, color: `${CYAN}66`, letterSpacing: 6, marginBottom: 16 }}>
          NPX-AR-MARCADOR // TRACKING DE IMAGEN, NO QR
        </div>
        <h1 style={{
          fontSize: 34, fontWeight: 700, letterSpacing: 6, color: CYAN,
          textShadow: `0 0 30px ${CYAN}44`, marginBottom: 16, lineHeight: 1,
        }}>
          MARCADOR
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 600, marginBottom: 28 }}>
          Enfocá un marcador entrenado con la cámara y manteneloen cuadro — nada de apretar un
          botón para "sacar foto": el reconocimiento es continuo, en vivo, mientras la imagen
          esté enfocada. Tracking de imagen real (MindAR), no un lector de QR.
        </p>

        <div style={{
          border: `1px solid ${CYAN}33`, background: `${CYAN}0a`, padding: '14px 18px', marginBottom: 28,
          display: 'flex', gap: 14, alignItems: 'center',
        }}>
          <Image src={artifact.preview} alt={artifact.reveal.label} width={56} height={56} style={{ width: 56, height: 56, objectFit: 'cover', border: `1px solid ${CYAN}44` }} />
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: `${CYAN}aa`, marginBottom: 4 }}>MARCADOR ACTIVO</div>
            <div style={{ fontSize: 11, color: '#c8daf0' }}>{artifact.reveal.label}</div>
          </div>
        </div>

        <div
          ref={containerRef}
          style={{
            position: 'relative', width: '100%', height: '62vh', minHeight: 360,
            background: '#000', border: `1px solid ${CYAN}33`, overflow: 'hidden', marginBottom: 20,
          }}
        >
          {status === 'idle' && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 16,
            }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a6080', textAlign: 'center', maxWidth: 260 }}>
                REQUIERE CÁMARA — el marcador necesita el sticker físico real, no sirve apuntar a esta misma pantalla
              </div>
            </div>
          )}

          {status === 'scanning' && (
            <div style={{
              position: 'absolute', top: 14, left: 14, fontSize: 9, letterSpacing: 2, color: `${CYAN}cc`,
              background: 'rgba(0,4,10,0.6)', padding: '6px 10px', pointerEvents: 'none',
            }}>
              ESCANEANDO... ENFOCÁ EL MARCADOR
            </div>
          )}

          {status === 'found' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <RevealPanel reveal={artifact.reveal} />
            </div>
          )}
        </div>

        {errorMsg && (
          <div style={{ fontSize: 10, color: '#ff2d55', marginBottom: 20 }}>{errorMsg}</div>
        )}

        <button onClick={activar} disabled={busy} style={{
          fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '12px 28px', cursor: busy ? 'default' : 'pointer',
          background: `${CYAN}18`, border: `1px solid ${CYAN}66`, color: CYAN, opacity: busy ? 0.5 : 1,
        }}>
          {status === 'starting' ? 'INICIANDO CÁMARA...'
            : status === 'scanning' ? 'ESCANEANDO...'
            : status === 'found' ? 'MARCADOR RECONOCIDO'
            : '▶ ACTIVAR CÁMARA'}
        </button>
      </div>
    </div>
  )
}
