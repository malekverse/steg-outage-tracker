import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const origin = req.nextUrl.origin

    const response = await fetch(`${origin}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, source: body.source || 'SCRAPER' }),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json(
      { error: 'Failed to relay scraper data to report endpoint' },
      { status: 500 },
    )
  }
}
