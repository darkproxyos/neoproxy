import { NextRequest, NextResponse } from "next/server"
import { insertEvent } from "../../../../lib/core-db/index"
import { emitWake } from "../../../../lib/event-emitter"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, priority, source, payload } = body

    // Validate required fields
    if (!type || !priority || !source || !payload) {
      return NextResponse.json(
        { error: 'Missing required fields: type, priority, source, payload' },
        { status: 400 }
      )
    }

    // Validate priority values
    const validPriorities = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be: CRITICAL, HIGH, NORMAL, LOW' },
        { status: 400 }
      )
    }

    // Insert event into database
    const event = await insertEvent(type, priority, source, payload)

    // Emit wake signal for real-time processing
    emitWake('event_bus', {
      eventId: event.id,
      type,
      priority,
      source
    })

    return NextResponse.json({
      success: true,
      data: event,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Wake API] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
