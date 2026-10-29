'use client'

import { useEffect, useState } from 'react'
import { getSitePusher, SITE_PRESENCE_CHANNEL } from './pusher/siteConnection'
import { recordEntitySighting } from './proxyverse/identity'

// Entropy no tiene perfil, no está en components/proxyverse/agents.ts, no
// chatea — existe solo en Memory/hub.json (status idle, hidden: true) y en
// su propio cron (app/api/cron/entropy-entity), que puede subir o bajar
// systemState.entropyLevel por su cuenta, sin pasar por el Overseer. Esto
// renderiza la única huella visible de esa intervención: una frase que
// aparece para todo el que esté conectado en ese momento exacto (el server
// reenvía el evento, mismo mecanismo que sync-pulse) y se va sola.
const VISIBLE_MS = 4200

type Signal = { id: number; phrase: string }

let signalId = 0

export default function EntropyEntity() {
  const [signal, setSignal] = useState<Signal | null>(null)

  useEffect(() => {
    const { pusher } = getSitePusher()
    const channel = pusher.subscribe(SITE_PRESENCE_CHANNEL)

    const onSignal = (data: { phrase?: string }) => {
      if (typeof data?.phrase !== 'string') return
      recordEntitySighting()
      const id = ++signalId
      setSignal({ id, phrase: data.phrase })
      window.setTimeout(() => {
        setSignal(prev => (prev?.id === id ? null : prev))
      }, VISIBLE_MS)
    }

    channel.bind('entropy-entity-signal', onSignal)
    return () => channel.unbind('entropy-entity-signal', onSignal)
  }, [])

  if (!signal) return null

  return (
    <div aria-hidden="true" className="entropy-entity-signature">
      {signal.phrase}
    </div>
  )
}
