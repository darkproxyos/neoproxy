'use client'

import { useEffect, useState } from 'react'
import { categories, pieces, type GalleryPiece } from '@/components/gallery/pieces'

export default function GalleryGrid() {
  const [lightbox, setLightbox] = useState<GalleryPiece | null>(null)

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  const lightboxColor = lightbox ? categories.find(c => c.id === lightbox.category)?.color ?? '#00d4ff' : '#00d4ff'

  return (
    <>
      <style>{`
        .wired-thumb { position: relative; overflow: hidden; background: #000; }
        .wired-thumb .wired-media-wrap { position: absolute; inset: 0; }
        .wired-thumb img, .wired-thumb video {
          filter: saturate(1.15) contrast(1.08) brightness(0.94);
          transition: filter 0.35s ease, transform 0.5s ease;
        }
        .wired-thumb:hover img, .wired-thumb:hover video {
          filter: saturate(1.35) contrast(1.18) brightness(1.04) hue-rotate(-3deg);
          transform: scale(1.045);
        }
        .wired-scanlines {
          position: absolute; inset: 0; z-index: 2; pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            rgba(0,0,0,0) 0px,
            rgba(0,0,0,0) 1px,
            rgba(0,255,157,0.07) 2px,
            rgba(0,0,0,0) 3px
          );
          mix-blend-mode: overlay;
          animation: wired-flicker 7s infinite;
        }
        .wired-vignette {
          position: absolute; inset: 0; z-index: 2; pointer-events: none;
          background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%);
          mix-blend-mode: multiply;
        }
        .wired-glow {
          position: absolute; inset: 0; z-index: 2; pointer-events: none;
          background: linear-gradient(180deg, rgba(0,212,255,0.05), transparent 30%, transparent 70%, rgba(0,255,157,0.05));
        }
        @keyframes wired-flicker {
          0%, 100% { opacity: 0.85; }
          8% { opacity: 0.7; }
          9% { opacity: 0.9; }
          40% { opacity: 0.85; }
          41% { opacity: 0.6; }
          42% { opacity: 0.85; }
          78% { opacity: 0.85; }
          79% { opacity: 1; }
          80% { opacity: 0.85; }
        }
        .wired-zoom-tag {
          position: absolute; bottom: 8px; right: 10px; z-index: 3;
          font-size: 8px; letter-spacing: 1px; color: #00ff9d;
          opacity: 0; transition: opacity 0.25s ease; pointer-events: none;
          text-shadow: 0 0 4px rgba(0,0,0,0.9);
        }
        .wired-thumb:hover .wired-zoom-tag { opacity: 1; }
        @media (hover: none) {
          .wired-zoom-tag { opacity: 0.8; }
        }
      `}</style>

      {categories.map(cat => {
        const catPieces = pieces.filter(p => p.category === cat.id)
        return (
          <section key={cat.id} style={{ marginTop: '3.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 12, letterSpacing: 2, color: cat.color, margin: 0 }}>{cat.label}</h3>
              <span style={{ fontSize: 10, color: '#4a6080' }}>{catPieces.length} piezas</span>
            </div>
            <p style={{ color: '#4a6080', fontSize: '10px', lineHeight: 1.7, maxWidth: 600, marginTop: '8px', fontStyle: 'italic' }}>
              {cat.blurb}
            </p>

            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px' }}>
              {catPieces.map(piece => {
                const isImage = piece.media.type === 'image'
                return (
                  <div key={piece.id} style={{ border: `1px solid ${cat.color}22`, background: `${cat.color}08` }}>
                    <div
                      className="wired-thumb"
                      style={{
                        width: '100%', aspectRatio: '4 / 3', borderBottom: `1px solid ${cat.color}22`,
                        cursor: isImage ? 'zoom-in' : 'default',
                      }}
                      onClick={isImage ? () => setLightbox(piece) : undefined}
                      role={isImage ? 'button' : undefined}
                      tabIndex={isImage ? 0 : undefined}
                      onKeyDown={isImage ? (e) => { if (e.key === 'Enter' || e.key === ' ') setLightbox(piece) } : undefined}
                    >
                      <div className="wired-media-wrap">
                        {piece.media.type === 'image' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={piece.media.src}
                            alt={piece.title}
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <video
                            src={piece.media.src}
                            poster={piece.media.poster}
                            controls
                            muted
                            loop
                            playsInline
                            preload="none"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                      </div>
                      <div className="wired-scanlines" />
                      <div className="wired-glow" />
                      <div className="wired-vignette" />
                      {isImage && <span className="wired-zoom-tag">[+] AMPLIAR</span>}
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <h4 style={{ fontSize: 10, letterSpacing: 1, color: cat.color, margin: 0 }}>{piece.title}</h4>
                      <p style={{ fontSize: 9, color: '#4a6080', letterSpacing: 0.5, marginTop: 6 }}>{piece.material}</p>
                      <p style={{ fontSize: 10, color: '#c8daf0', lineHeight: 1.7, marginTop: 10 }}>{piece.note}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {lightbox && lightbox.media.type === 'image' && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(2,4,8,0.94)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', cursor: 'zoom-out',
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '94vw', maxHeight: '92vh', position: 'relative' }}>
            <button
              onClick={() => setLightbox(null)}
              style={{
                position: 'absolute', top: -34, right: 0, background: 'transparent', border: 'none',
                color: '#c8daf0', fontSize: 11, letterSpacing: 1, cursor: 'pointer', fontFamily: 'Space Mono, monospace',
              }}
            >
              ✕ CERRAR
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.media.src}
              alt={lightbox.title}
              style={{
                maxWidth: '94vw', maxHeight: '80vh', width: 'auto', height: 'auto', display: 'block',
                border: `1px solid ${lightboxColor}55`, objectFit: 'contain',
              }}
            />
            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: lightboxColor, letterSpacing: 1 }}>{lightbox.title}</div>
              <div style={{ fontSize: 9, color: '#4a6080', marginTop: 4, letterSpacing: 0.5 }}>{lightbox.material}</div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
