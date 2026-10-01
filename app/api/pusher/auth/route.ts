import { NextRequest, NextResponse } from 'next/server'
import Pusher from 'pusher'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const socketId = form.get('socket_id') as string
  const channel = form.get('channel_name') as string

  if (!socketId || !channel || !channel.startsWith('presence-')) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 })
  }

  const auth = pusher.authorizeChannel(socketId, channel, {
    user_id: crypto.randomUUID(),
  })
  return NextResponse.json(auth)
}
