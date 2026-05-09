import { NextRequest, NextResponse } from "next/server"
import { getUnprocessedEvents, markProcessed } from "@/lib/core-db/index"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Get all unprocessed events
    const events = await getUnprocessedEvents()

    // Parse JSON payloads for client consumption
    const parsedEvents = events.map(event => ({
      ...event,
      payload: JSON.parse(event.payload)
    }))

    return NextResponse.json({
      success: true,
      data: parsedEvents,
      count: parsedEvents.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Events API] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId } = body

    // Validate required field
    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing required field: eventId' },
        { status: 400 }
      )
    }

    // Mark event as processed
    const event = await markProcessed(eventId)

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or already processed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: event,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Events API] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
