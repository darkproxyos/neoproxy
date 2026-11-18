'use client'

import { useEffect, useRef } from 'react'
import { findWordSpan, revertSpan } from './biodiversity/glitchWord'
import { getSitePusher, SITE_PRESENCE_CHANNEL } from './pusher/siteConnection'
import { recordEntitySighting } from './proxyverse/identity'

// Möbius -- tercera entidad oculta, junto a Entropy (EntropyEntity.tsx) y
// Glitchi (Glitchi.tsx). Ninguna de las tres tiene perfil en agents.ts ni
// chatea -- a diferencia de los 6 procesos, no son personajes con voz.
// Entropy es la entropía misma con agencia (sube/baja un número real).
// Glitchi es el error visual momentáneo, anónimo. Möbius es la tercera: el
// bucle que no resuelve -- una cinta de Möbius real (August Möbius, 1858)
// tiene una sola cara, así que recorrerla entera para "volver" al mismo
// lugar en realidad te deja del otro lado. La firma es literal: la palabra
// gira sobre su eje y se espeja (bio-glitch-mobius en globals.css), sin
// romperse como Glitchi, hasta que el efecto se revierte solo.
//
// A diferencia de Glitchi (probabilidad fija), Möbius crece con el tiempo
// real que la pestaña lleva abierta en esta sesión del navegador -- cada
// chequeo que pasa sin que actúe suma a su propia probabilidad, hasta un
// techo. No es una métrica inventada para la ocasión: es el reloj real de
// cuánto lleva alguien ahí, la misma lógica de fondo que el quietFactor de
// Entropy (ver app/api/cron/entropy-entity/route.ts), con otra fuente de
// "cuánto hace que nada pasó".
const MOBIUS_COLOR = '#a855f7'
const CHECK_INTERVAL_MS = 20_000
const BASE_CHANCE = 0.015
const MAX_CHANCE = 0.09
const CHANCE_GROWTH_PER_TICK = 0.004
const HOLD_MS = 1400

export default function Mobius() {
  const busyRef = useRef(false)
  const ticksRef = useRef(0)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    const turnWord = () => {
      if (busyRef.current) return
      const found = findWordSpan(document.body)
      if (!found) return
      busyRef.current = true
      recordEntitySighting()
      found.span.style.setProperty('--glitch-color', MOBIUS_COLOR)
      found.span.style.setProperty('--glitch-glow', `${MOBIUS_COLOR}99`)
      found.span.classList.add('bio-glitch-mobius')
      window.setTimeout(() => {
        revertSpan(found.span)
        busyRef.current = false
      }, HOLD_MS)
    }

    // Crece con cada chequeo que pasa sin actuar -- cuanto más tiempo real
    // de sesión, más fuerte, hasta MAX_CHANCE. Se resetea solo al recargar
    // la página: no persiste entre sesiones, como Glitchi tampoco lo hace.
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      ticksRef.current += 1
      const chance = Math.min(MAX_CHANCE, BASE_CHANCE + ticksRef.current * CHANCE_GROWTH_PER_TICK)
      if (Math.random() < chance) turnWord()
    }, CHECK_INTERVAL_MS)

    // Misma coincidencia sin acople que ya usa Glitchi: cuando Entropy se
    // mueve por su cuenta, a veces Möbius también se nota, sin depender
    // una de la otra.
    const { pusher } = getSitePusher()
    const channel = pusher.subscribe(SITE_PRESENCE_CHANNEL)
    const onEntropySignal = () => turnWord()
    channel.bind('entropy-entity-signal', onEntropySignal)

    return () => {
      window.clearInterval(interval)
      channel.unbind('entropy-entity-signal', onEntropySignal)
    }
  }, [])

  return null
}
