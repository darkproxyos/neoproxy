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
  // Enviados por components/pusher/siteConnection.ts — un visitor_id estable
  // por pestaña (no uno nuevo por request, si no cada reconexión cuenta como
  // un miembro distinto) y, si el visitante ya tiene un agente dominante
  // (más chats, o último retrato matcheado), su color para los cursores
  // fantasma (ver components/GhostPresence.tsx). Ninguno es obligatorio:
  // sin ellos el canal de presencia sigue funcionando igual que antes.
  const visitorId = (form.get('visitor_id') as string) || crypto.randomUUID()
  const agentId = form.get('agent_id') as string | null
  const agentColor = form.get('agent_color') as string | null

  if (!socketId || !channel || !channel.startsWith('presence-')) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 })
  }

  const auth = pusher.authorizeChannel(socketId, channel, {
    user_id: visitorId,
    user_info: agentId ? { agentId, color: agentColor } : undefined,
  })
  return NextResponse.json(auth)
}
