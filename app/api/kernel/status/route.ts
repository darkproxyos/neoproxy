import { NextRequest, NextResponse } from 'next/server'
import { kernelClient, withFallback, MOCK_STATUS } from '../../../../lib/kernel-client'

export async function GET(request: NextRequest) {
  try {
    // Make request to Python kernel
    const data = await withFallback(
      async () => {
        const response = await kernelClient.get('/status')
        return response.data
      },
      MOCK_STATUS
    )

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Kernel status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch kernel status' },
      { status: 500 }
    )
  }
}
