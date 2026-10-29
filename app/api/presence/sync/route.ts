import { NextResponse } from 'next/server'
import Pusher from 'pusher'
import { SITE_PRESENCE_CHANNEL } from '@/components/pusher/constants'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

// Sin payload — el cliente que dispara esto no necesita decirle nada al
// resto, solo "ahora". Varios visitantes pueden cruzar el umbral casi
// simultáneamente y cada uno dispara su propio POST acá — eso significa
// más de un pulso visible seguido en vez de exactamente uno, un
// comportamiento menor y aceptado, no una elección de arbitrar quién
// "gana" el disparo.
export async function POST() {
  try {
    await pusher.trigger(SITE_PRESENCE_CHANNEL, 'sync-pulse', {})
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error en presence/sync:', error)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
