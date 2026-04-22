import { NextRequest, NextResponse } from 'next/server'
import { kernelClient, withFallback, MOCK_LOGS } from '../../../../lib/kernel-client'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const module = searchParams.get('module')
    const limit = searchParams.get('limit')

    // Build query string for Python backend
    const queryParams = new URLSearchParams()
    if (level) queryParams.append('level', level)
    if (module) queryParams.append('module', module)
    if (limit) queryParams.append('limit', limit)

    // Make request to Python kernel
    const data = await withFallback(
      async () => {
        const response = await kernelClient.get(`/logs?${queryParams.toString()}`)
        return response.data
      },
      MOCK_LOGS
    )

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Kernel logs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch kernel logs' },
      { status: 500 }
    )
  }
}
