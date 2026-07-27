import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rateLimit'

const DISPUTE_THRESHOLD = 3

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

export async function POST(req: NextRequest) {
  const ip = getIP(req)
  const { allowed } = rateLimit(ip, 5, 60000)

  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const reportId = body?.report_id
    if (!reportId || typeof reportId !== 'string') {
      return NextResponse.json({ error: 'Missing report_id' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('dispute_report', {
      p_report_id: reportId,
      p_threshold: DISPUTE_THRESHOLD,
    })

    if (error) {
      const { data: current } = await supabase
        .from('outage_reports')
        .select('disputes, status')
        .eq('id', reportId)
        .single()

      if (!current || current.status !== 'OFF') {
        return NextResponse.json({ error: 'Report not found or already resolved' }, { status: 404 })
      }

      const newDisputes = (current.disputes ?? 0) + 1
      const removed = newDisputes >= DISPUTE_THRESHOLD

      const updatePayload: Record<string, unknown> = { disputes: newDisputes }
      if (removed) {
        updatePayload.status = 'RESTORED'
        updatePayload.expired_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('outage_reports')
        .update(updatePayload)
        .eq('id', reportId)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to dispute report' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        disputes: newDisputes,
        removed,
      })
    }

    const result = data as { disputes?: number; removed?: boolean; error?: string } | null
    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      disputes: result?.disputes ?? 0,
      removed: result?.removed ?? false,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
