import { NextRequest, NextResponse } from 'next/server'
import Pusher from 'pusher'
import { SITE_PRESENCE_CHANNEL } from '@/components/pusher/siteConnection'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

// Reenviamos la posición por el server en vez de un client event de Pusher
// (`client-*`) a propósito: los client events necesitan estar habilitados
// en el dashboard de la app, cosa que no podemos confirmar ni cambiar desde
// acá — este endpoint funciona siempre, sin depender de esa configuración.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { visitorId, x, y, color } = body ?? {}
    if (typeof visitorId !== 'string' || typeof x !== 'number' || typeof y !== 'number') {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
    }
    const clampedX = Math.max(0, Math.min(1, x))
    const clampedY = Math.max(0, Math.min(1, y))
    await pusher.trigger(SITE_PRESENCE_CHANNEL, 'cursor-move', {
      visitorId,
      x: clampedX,
      y: clampedY,
      color: typeof color === 'string' ? color : null,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error reenviando posición de cursor:', error)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
