'use client'

import { useEffect, useState } from 'react'
import type { GalleryPiece } from '@/components/gallery/pieces'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export function HeroVideo({ src, poster, alt }: { src: string; poster: string; alt: string }) {
  const reduced = usePrefersReducedMotion()
  if (reduced) return <img src={poster} alt={alt} className="imp-hero-media" />
  return (
    <video
      className="imp-hero-media"
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      aria-label={alt}
    />
  )
}

// Las fotos se muestran directo; los videos arrancan como póster y se
// reproducen al tocarlos -- 20 videos en autoplay en un celular son
// demasiados datos y batería para una grilla.
export function PieceTile({ piece }: { piece: GalleryPiece }) {
  const [playing, setPlaying] = useState(false)
  const { media } = piece
  const label = piece.title.split('//')[1]?.trim().replace(/_/g, ' ') ?? piece.title

  return (
    <figure className="imp-tile">
      {media.type === 'image' ? (
        <img src={media.src} alt={label} loading="lazy" />
      ) : playing ? (
        <video src={media.src} poster={media.poster} autoPlay muted loop playsInline aria-label={label} />
      ) : (
        <button type="button" className="imp-tile-play press" onClick={() => setPlaying(true)} aria-label={`Reproducir video: ${label}`}>
          <img src={media.poster} alt="" loading="lazy" />
          <span className="imp-play-badge" aria-hidden>▶</span>
        </button>
      )}
      <figcaption>
        <span className="imp-tile-title">{label}</span>
        <span className="imp-tile-material">{piece.material}</span>
      </figcaption>
    </figure>
  )
}
