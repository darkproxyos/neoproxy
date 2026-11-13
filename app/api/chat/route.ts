import { NextRequest, NextResponse } from 'next/server'
import Pusher from 'pusher'
import { auth } from '@/auth'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

export async function POST(req: NextRequest) {
  const { message } = await req.json()
  if (typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ ok: false, error: 'EMPTY_MESSAGE' }, { status: 400 })
  }

  // El operador lo decide el servidor a partir de la sesión real, nunca lo
  // que mande el cliente -- antes `operator` llegaba como string libre del
  // body y components/Chat.tsx lo hardcodeaba a 'DARKPROXY' para
  // cualquiera que escribiera, sin importar quién fuera. Ahora: solo la
  // cuenta root real aparece como DARKPROXY, cualquier otra sesión (o
  // ninguna) aparece como ANÓNIMO, sin excepción.
  const session = await auth()
  const isRoot = (session?.user as any)?.role === 'root'
  const operator = isRoot ? 'DARKPROXY' : 'ANÓNIMO'

  await pusher.trigger('neoproxy-chat', 'message', {
    message,
    operator,
    timestamp: new Date().toISOString(),
  })
  return NextResponse.json({ ok: true })
}
