import { NextRequest, NextResponse } from 'next/server'
import { kernelClient, withFallback, MOCK_REGISTER } from '../../../../lib/kernel-client'

// Registration request interface
interface RegisterRequest {
  seed: string
  type: string
}

// Registration response interface
interface RegisterResponse {
  id: string
  hash: string
  status: "registered" | "error"
  timestamp?: string
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()
    
    // Validate input
    if (!body.seed || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: seed and type' },
        { status: 400 }
      )
    }

    // Validate seed format (numeric string)
    if (!/^\d+$/.test(body.seed)) {
      return NextResponse.json(
        { error: 'Seed must be a numeric string' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['ring', 'artifact', 'object', 'component']
    if (!validTypes.includes(body.type.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Make request to Python kernel
    const data = await withFallback(
      async () => {
        const response = await kernelClient.post('/register', body)
        return response.data
      },
      MOCK_REGISTER
    )

    console.log(`Registered: ${body.seed} (${body.type}) -> ${data.id || 'fallback'}`)

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Kernel registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register object' },
      { status: 500 }
    )
  }
}
