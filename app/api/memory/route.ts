import { NextRequest, NextResponse } from "next/server"
import { createMemory, getMemories } from "../../../../lib/core-db/index"

export async function GET() {
  try {
    const memories = await getMemories()
    return NextResponse.json(memories)
  } catch (error) {
    console.error('[Memory API] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, content } = await req.json()
    
    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title and content' },
        { status: 400 }
      )
    }
    
    const memory = await createMemory(title, content)
    return NextResponse.json(memory, { status: 201 })
  } catch (error) {
    console.error('[Memory API] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
