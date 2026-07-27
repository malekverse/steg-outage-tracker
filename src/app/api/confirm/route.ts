import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rateLimit'
import type { ConfirmRequest } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

function parseConfirmBody(body: unknown): ConfirmRequest | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  if (!b.report_id || typeof b.report_id !== 'string') return null
  return { report_id: b.report_id }
}

export async function POST(req: NextRequest) {
  const ip = getIP(req)
  const { allowed } = rateLimit(ip, 5, 60000)

  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const parsed = parseConfirmBody(await req.json())
    if (!parsed) {
      return NextResponse.json({ error: 'Missing report_id' }, { status: 400 })
    }

    const { report_id } = parsed

    const { data, error } = await supabase.rpc('confirm_report', {
      p_report_id: report_id,
    })

    if (error) {
      const { data: current } = await supabase
        .from('outage_reports')
        .select('confirmations')
        .eq('id', report_id)
        .single()

      const { data: updateData, error: updateError } = await supabase
        .from('outage_reports')
        .update({ confirmations: (current?.confirmations ?? 0) + 1 })
        .eq('id', report_id)
        .select('id, confirmations')
        .single()

      if (updateError) {
        return NextResponse.json({ error: 'Failed to confirm report' }, { status: 500 })
      }

      return NextResponse.json({ success: true, confirmations: updateData.confirmations })
    }

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
