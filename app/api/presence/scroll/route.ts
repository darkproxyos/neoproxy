import { NextRequest, NextResponse } from 'next/server'
import Pusher from 'pusher'
import { SITE_PRESENCE_CHANNEL } from '@/components/pusher/constants'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

// Mismo patrón que presence/cursor: reenviamos por el server en vez de un
// client event de Pusher, para no depender de que esa opción esté
// habilitada en el dashboard de la app.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { visitorId, pathname, depth } = body ?? {}
    if (typeof visitorId !== 'string' || typeof pathname !== 'string' || typeof depth !== 'number') {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
    }
    const clampedDepth = Math.max(0, Math.min(1, depth))
    await pusher.trigger(SITE_PRESENCE_CHANNEL, 'scroll-depth', {
      visitorId,
      pathname,
      depth: clampedDepth,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error reenviando scroll depth:', error)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
