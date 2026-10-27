'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { recordNfcScan } from '@/components/proxyverse/identity'
import { matchNfcArtifact, type NfcArtifact } from '@/components/artifacts/registry'
import RevealPanel from '@/components/artifacts/RevealPanel'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'
const RED = '#ff2d55'

// Web NFC (NDEFReader) todavía no está en los tipos DOM estándar de
// TypeScript — se declara acá el subconjunto mínimo que usamos, en vez de
// tipar todo como `any` y perder el chequeo del resto del archivo.
interface NDEFRecordLike {
  recordType: string
  mediaType?: string
  id?: string
  lang?: string
  encoding?: string
  data?: ArrayBuffer | DataView
}
interface NDEFMessageLike {
  records: NDEFRecordLike[]
}
interface NDEFReadingEventLike {
  serialNumber: string
  message: NDEFMessageLike
}
interface NDEFReaderLike extends EventTarget {
  scan(): Promise<void>
  addEventListener(type: 'reading', listener: (ev: NDEFReadingEventLike) => void): void
  addEventListener(type: 'readingerror', listener: (ev: Event) => void): void
}

type DecodedRecord = { recordType: string; mediaType?: string; lang?: string; text: string; hex: string }
type ScanEntry = { id: number; time: string; serialNumber: string; records: DecodedRecord[]; artifact: NfcArtifact | null }

function bufferToHex(buf: ArrayBuffer | DataView): string {
  const bytes = buf instanceof DataView ? new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) : new Uint8Array(buf)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ')
}

function decodeRecord(r: NDEFRecordLike): DecodedRecord {
  let text = '(sin datos)'
  const hex = r.data ? bufferToHex(r.data) : ''
  if (r.data) {
    try {
      const bytes = r.data instanceof DataView ? r.data : new DataView(r.data as ArrayBuffer)
      if (r.recordType === 'text') {
        // NDEF text record: 1er byte = status (bit7 = encoding, bits0-5 = largo del codigo de idioma)
        const status = bytes.getUint8(0)
        const langLen = status & 0x3f
        const utf16 = (status & 0x80) !== 0
        const bodyOffset = 1 + langLen
        const bodyBytes = new Uint8Array(bytes.buffer, bytes.byteOffset + bodyOffset, bytes.byteLength - bodyOffset)
        text = new TextDecoder(utf16 ? 'utf-16' : 'utf-8').decode(bodyBytes)
      } else if (r.recordType === 'url' || r.recordType === 'absolute-url') {
        text = new TextDecoder().decode(bytes)
      } else {
        text = new TextDecoder().decode(bytes)
      }
    } catch {
      text = '(no se pudo decodificar como texto — ver hex)'
    }
  }
  return { recordType: r.recordType, mediaType: r.mediaType, lang: r.lang, text, hex }
}

type Status = 'idle' | 'unsupported' | 'requesting' | 'scanning' | 'error'

export default function ScanPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [entries, setEntries] = useState<ScanEntry[]>([])
  const idRef = useRef(0)
  const readerRef = useRef<NDEFReaderLike | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      setStatus('unsupported')
    }
  }, [])

  const startScan = async () => {
    setErrorMsg('')
    try {
      setStatus('requesting')
      const Ctor = (window as unknown as { NDEFReader: new () => NDEFReaderLike }).NDEFReader
      const reader = new Ctor()
      readerRef.current = reader
      await reader.scan()
      setStatus('scanning')
      reader.addEventListener('reading', (ev: NDEFReadingEventLike) => {
        idRef.current += 1
        const records = ev.message.records.map(decodeRecord)
        const artifact = matchNfcArtifact(records.map(r => r.text))
        setEntries(prev => [{
          id: idRef.current, time: new Date().toLocaleTimeString('es-AR'),
          serialNumber: ev.serialNumber || '(sin número de serie)', records, artifact,
        }, ...prev].slice(0, 20))
        recordNfcScan()
      })
      reader.addEventListener('readingerror', () => {
        setErrorMsg('Error leyendo el tag — acercalo de nuevo, sin moverlo.')
      })
    } catch (err: any) {
      console.error('Error iniciando NFC scan:', err)
      setErrorMsg(err?.message || 'No se pudo iniciar el escaneo NFC.')
      setStatus('error')
    }
  }

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/experimental" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A EXPERIMENTAL
        </Link>

        <div style={{ fontSize: 9, color: `${CYAN}66`, letterSpacing: 6, marginBottom: 16 }}>
          // NFC — NPX-XP-SCAN
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 700, letterSpacing: 6, color: CYAN,
          textShadow: `0 0 40px ${CYAN}44`, marginBottom: 16, lineHeight: 1,
        }}>
          SCAN
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 560, marginBottom: 8 }}>
          Lector genérico de tags NFC vía Web NFC — muestra el payload crudo de cualquier tag que acerques.
          Si el texto coincide con un artefacto registrado (mismo esquema que usa el marcador por cámara de{' '}
          <Link href="/realidad-aumentada/marcador" style={{ color: CYAN }}>/realidad-aumentada/marcador</Link>),
          aparece su revelación acá también — un tag físico todavía no fue fabricado, pero el pipeline ya
          está listo para recibirlo.
        </p>
        <p style={{ fontSize: 9, color: '#4a6080', letterSpacing: 1, lineHeight: 1.8, maxWidth: 560, marginBottom: 48 }}>
          Web NFC solo existe en Chrome para Android, sobre HTTPS. En cualquier otro navegador o dispositivo
          esta página no va a poder escanear nada — es una limitación de la plataforma, no de este código.
        </p>

        {status === 'unsupported' && (
          <div style={{ border: `1px solid ${RED}44`, background: `${RED}0a`, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: RED, letterSpacing: 1, lineHeight: 1.8 }}>
              ESTE NAVEGADOR NO SOPORTA WEB NFC. Abrí esta página en Chrome para Android con NFC activado.
            </div>
          </div>
        )}

        {status !== 'unsupported' && status !== 'scanning' && (
          <button
            onClick={startScan}
            disabled={status === 'requesting'}
            className="cyber-btn"
            style={{
              fontFamily: mono, fontSize: 12, letterSpacing: 3, color: CYAN, background: `${CYAN}0d`,
              border: `1px solid ${CYAN}66`, padding: '14px 32px', cursor: status === 'requesting' ? 'default' : 'pointer',
              minHeight: 44, marginBottom: 24,
            }}
          >
            {status === 'requesting' ? 'SOLICITANDO PERMISO...' : '▶ ACTIVAR LECTOR NFC'}
          </button>
        )}

        {status === 'scanning' && (
          <div style={{ border: `1px solid ${CYAN}33`, background: `${CYAN}0a`, padding: '14px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: CYAN, letterSpacing: 1 }}>
              ● ESCANEANDO — acercá un tag NFC al dorso del celular.
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{ fontSize: 10, color: RED, letterSpacing: 0.5, marginBottom: 24, lineHeight: 1.6 }}>
            {errorMsg}
          </div>
        )}

        <div style={{ fontSize: 10, color: CYAN, letterSpacing: 4, marginBottom: 16 }}>
          LECTURAS ({entries.length})
        </div>

        {entries.length === 0 && (
          <div style={{ fontSize: 10, color: '#3a4a60', letterSpacing: 1 }}>
            SIN LECTURAS TODAVÍA.
          </div>
        )}

        {entries.map(e => (
          <div key={e.id} className="artifact-card" style={{ padding: 18, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: '#8fb8d6', letterSpacing: 1 }}>SERIAL: {e.serialNumber}</span>
              <span style={{ fontSize: 9, color: '#4a6080' }}>{e.time}</span>
            </div>
            {e.artifact && (
              <div style={{ padding: '18px 0', marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <RevealPanel reveal={e.artifact.reveal} />
              </div>
            )}
            {e.records.length === 0 && (
              <div style={{ fontSize: 10, color: '#4a6080' }}>Tag sin registros NDEF (o vacío).</div>
            )}
            {e.records.map((r, i) => (
              <div key={i} style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none', paddingTop: i > 0 ? 10 : 0, marginTop: i > 0 ? 10 : 0 }}>
                <div style={{ fontSize: 9, color: CYAN, letterSpacing: 1, marginBottom: 4 }}>
                  TIPO: {r.recordType}{r.mediaType ? ` (${r.mediaType})` : ''}{r.lang ? ` — lang=${r.lang}` : ''}
                </div>
                <div style={{ fontSize: 12, color: '#fff', marginBottom: 6, wordBreak: 'break-word' }}>{r.text}</div>
                <div style={{ fontSize: 8, color: '#3a4a60', wordBreak: 'break-all', lineHeight: 1.6 }}>hex: {r.hex || '(vacío)'}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
