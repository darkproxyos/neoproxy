import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // For now, return empty events array
    // This should be connected to the actual Event Bus when available
    const events = []

    return NextResponse.json({ events }, { status: 200 })
  } catch (error) {
    console.error('Live events error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live events' },
      { status: 500 }
    )
  }
}
