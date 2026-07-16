import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // For now, return mock metrics since we don't have a real metrics endpoint
    // This should be connected to the actual system metrics when available
    const metrics = {
      cpu: Math.random() * 30 + 40, // 40-70% random for demo
      mem: Math.random() * 20 + 70, // 70-90% random for demo
      integrity: 95 + Math.random() * 5, // 95-100%
      lastBackup: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    }

    return NextResponse.json(metrics, { status: 200 })
  } catch (error) {
    console.error('Kernel metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch kernel metrics' },
      { status: 500 }
    )
  }
}
