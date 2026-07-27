import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return null

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) return createClient(url, serviceKey)

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (anonKey) return createClient(url, anonKey)

  return null
}

function verifyAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('x-admin-password')
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword || !auth) return false
  return auth === adminPassword
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() })
  }

  const supabase = getAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured (missing URL or keys)' },
      { status: 500, headers: corsHeaders() },
    )
  }

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') || ''
  const governorate = searchParams.get('governorate') || ''
  const source = searchParams.get('source') || ''
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)

  let query = supabase
    .from('outage_reports')
    .select('id, governorate, delegation, status, source, confirmations, disputes, created_at, expired_at, ip_address, device_id, signal_type')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (governorate) query = query.eq('governorate', governorate)
  if (source) query = query.eq('source', source)

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { error: 'Database query failed', detail: error.message },
      { status: 500, headers: corsHeaders() },
    )
  }

  return NextResponse.json({ reports: data ?? [] }, { headers: corsHeaders() })
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() })
  }

  const supabase = getAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500, headers: corsHeaders() },
    )
  }

  try {
    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing report id' }, { status: 400, headers: corsHeaders() })
    }

    const { error } = await supabase.from('outage_reports').delete().eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Delete failed', detail: error.message },
        { status: 500, headers: corsHeaders() },
      )
    }

    return NextResponse.json({ success: true, deleted: id }, { headers: corsHeaders() })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: corsHeaders() })
  }
}

export async function PATCH(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() })
  }

  const supabase = getAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500, headers: corsHeaders() },
    )
  }

  try {
    const { id, status } = await req.json()
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing id or status' },
        { status: 400, headers: corsHeaders() },
      )
    }

    if (!['OFF', 'RESTORED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400, headers: corsHeaders() },
      )
    }

    const { error } = await supabase.from('outage_reports').update({ status }).eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Update failed', detail: error.message },
        { status: 500, headers: corsHeaders() },
      )
    }

    return NextResponse.json({ success: true, id, status }, { headers: corsHeaders() })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: corsHeaders() })
  }
}
