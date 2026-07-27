import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rateLimit'
import type { ReportRequest } from '@/lib/types'

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

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function parseReportBody(body: unknown): ReportRequest | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  if (b.latitude == null || b.longitude == null || !b.governorate) return null
  return {
    latitude: b.latitude as string | number,
    longitude: b.longitude as string | number,
    governorate: String(b.governorate),
    delegation: b.delegation != null ? String(b.delegation) : undefined,
    source: b.source as ReportRequest['source'],
    device_id: b.device_id != null ? String(b.device_id) : undefined,
    signal_type: b.signal_type != null ? String(b.signal_type) : undefined,
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

export async function POST(req: NextRequest) {
  const ip = getIP(req)
  const { allowed, remaining, reset } = rateLimit(ip, 10, 60000)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before submitting again.' },
      {
        status: 429,
        headers: {
          ...corsHeaders(),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  try {
    const parsed = parseReportBody(await req.json())
    if (!parsed) {
      return NextResponse.json(
        { error: 'Missing required fields', fields: ['latitude', 'longitude', 'governorate'] },
        { status: 400, headers: corsHeaders() },
      )
    }

    const { latitude, longitude, governorate, delegation, source, device_id, signal_type } = parsed
    const lat = parseFloat(String(latitude))
    const lng = parseFloat(String(longitude))

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates: latitude and longitude must be numeric' },
        { status: 400, headers: corsHeaders() },
      )
    }

    if (lat < 30 || lat > 38 || lng < 7 || lng > 12) {
      return NextResponse.json(
        {
          error: 'Coordinates out of bounds',
          detail: 'Position must be within Tunisia (lat: 30–38, lng: 7–12)',
        },
        { status: 400, headers: corsHeaders() },
      )
    }

    const sourceValue = (source || 'USER').toUpperCase()
    if (!['USER', 'BOT', 'SCRAPER', 'SIGNAL'].includes(sourceValue)) {
      return NextResponse.json(
        { error: 'Invalid source. Must be USER, BOT, SCRAPER, or SIGNAL' },
        { status: 400, headers: corsHeaders() },
      )
    }

    const rateKey =
      sourceValue === 'SIGNAL' && device_id ? `signal:${device_id}` : ip
    const rateMax = sourceValue === 'SIGNAL' ? 5 : 10
    if (sourceValue === 'SIGNAL') {
      const { allowed: signalAllowed } = rateLimit(rateKey, rateMax, 60000)
      if (!signalAllowed) {
        return NextResponse.json(
          { error: 'Too many signal reports' },
          { status: 429, headers: corsHeaders() },
        )
      }
    }

    const gov = governorate.trim()
    const reportIp = ip

    const { data, error } = await supabase.rpc('insert_outage_report', {
      p_latitude: lat,
      p_longitude: lng,
      p_governorate: gov,
      p_delegation: (delegation || '').trim(),
      p_source: sourceValue,
      p_device_id: device_id || null,
      p_signal_type: signal_type || null,
      p_ip_address: reportIp,
    })

    if (error) {
      const { data: insertData, error: insertError } = await supabase
        .from('outage_reports')
        .insert({
          location: `SRID=4326;POINT(${lng} ${lat})`,
          governorate: gov,
          delegation: (delegation || '').trim(),
          status: 'OFF',
          source: sourceValue,
          device_id: device_id || null,
          signal_type: signal_type || null,
          ip_address: reportIp,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Supabase insert error:', insertError)
        return NextResponse.json(
          { error: 'Database insert failed' },
          { status: 500, headers: corsHeaders() },
        )
      }

      return NextResponse.json(
        { success: true, id: insertData.id },
        { status: 201, headers: { ...corsHeaders(), 'X-RateLimit-Remaining': String(remaining) } },
      )
    }

    const result = data as { id?: string } | null
    return NextResponse.json(
      { success: true, id: result?.id },
      { status: 201, headers: { ...corsHeaders(), 'X-RateLimit-Remaining': String(remaining) } },
    )
  } catch (err) {
    console.error('Report endpoint error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() },
    )
  }
}
