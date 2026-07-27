import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'
import { getSupabase } from '@/lib/supabaseServer'

const HEARTBEAT_INTERVAL_MS = 4 * 60_000
const SILENCE_THRESHOLD_MS = 10 * 60_000
const SILENCE_WINDOW_MS = 30 * 60_000
const MIN_SILENT_DEVICES = 3
const CLUSTER_BUCKET_DEG = 0.015 // ~1.5km

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface HeartbeatBody {
  device_id?: string
  lat?: number
  lng?: number
  governorate?: string
  online?: boolean
}

function parseBody(body: unknown): HeartbeatBody | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  if (!b.device_id || typeof b.device_id !== 'string') return null
  return {
    device_id: b.device_id,
    lat: b.lat != null ? Number(b.lat) : undefined,
    lng: b.lng != null ? Number(b.lng) : undefined,
    governorate: b.governorate != null ? String(b.governorate) : undefined,
    online: b.online !== false,
  }
}

async function detectMassSilence(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
): Promise<void> {
  const now = Date.now()
  const silentAfter = new Date(now - SILENCE_THRESHOLD_MS).toISOString()
  const silentBefore = new Date(now - SILENCE_WINDOW_MS).toISOString()

  const { data: silent } = await supabase
    .from('device_heartbeats')
    .select('device_id, lat, lng, governorate, last_seen')
    .lt('last_seen', silentAfter)
    .gte('last_seen', silentBefore)
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  if (!silent?.length || silent.length < MIN_SILENT_DEVICES) return

  const buckets = new Map<string, typeof silent>()
  for (const d of silent) {
    if (d.lat == null || d.lng == null) continue
    const key = `${Math.round(d.lat / CLUSTER_BUCKET_DEG)}:${Math.round(d.lng / CLUSTER_BUCKET_DEG)}`
    const list = buckets.get(key) ?? []
    list.push(d)
    buckets.set(key, list)
  }

  for (const devices of buckets.values()) {
    if (devices.length < MIN_SILENT_DEVICES) continue

    const lat = devices.reduce((s, d) => s + (d.lat ?? 0), 0) / devices.length
    const lng = devices.reduce((s, d) => s + (d.lng ?? 0), 0) / devices.length
    const gov = devices.find(d => d.governorate)?.governorate ?? 'Unknown'

    const hourAgo = new Date(now - 60 * 60_000).toISOString()
    const { data: existing } = await supabase
      .from('outage_reports')
      .select('id, location')
      .eq('status', 'OFF')
      .eq('source', 'SIGNAL')
      .gte('created_at', hourAgo)
      .limit(50)

    const duplicate = (existing ?? []).some(row => {
      const loc = row.location as { coordinates?: number[] } | string | null
      let coords: number[] | null = null
      if (typeof loc === 'string') {
        const m = loc.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/)
        if (m) coords = [parseFloat(m[1]), parseFloat(m[2])]
      } else if (loc && typeof loc === 'object' && Array.isArray(loc.coordinates)) {
        coords = loc.coordinates
      }
      if (!coords) return false
      return haversineKm(lat, lng, coords[1], coords[0]) < 1.5
    })

    if (duplicate) continue

    await supabase.rpc('insert_outage_report', {
      p_latitude: lat,
      p_longitude: lng,
      p_governorate: gov,
      p_delegation: '',
      p_source: 'SIGNAL',
      p_device_id: null,
      p_signal_type: 'mass_silence',
    })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

export async function POST(req: NextRequest) {
  try {
    const parsed = parseBody(await req.json())
    if (!parsed?.device_id) {
      return NextResponse.json(
        { error: 'device_id required' },
        { status: 400, headers: corsHeaders() },
      )
    }

    const { allowed } = rateLimit(`hb:${parsed.device_id}`, 20, HEARTBEAT_INTERVAL_MS)
    if (!allowed) {
      return NextResponse.json({ ok: true, throttled: true }, { headers: corsHeaders() })
    }

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ ok: true, offline: true }, { headers: corsHeaders() })
    }

    const now = new Date().toISOString()
    const online = parsed.online !== false

    const { data: prev } = await supabase
      .from('device_heartbeats')
      .select('last_seen, last_offline_at, online')
      .eq('device_id', parsed.device_id)
      .maybeSingle()

    let restored = 0
    if (online && prev?.last_offline_at) {
      const offlineAt = new Date(prev.last_offline_at).getTime()
      const gapMs = Date.now() - offlineAt
      if (gapMs > 5 * 60_000 && gapMs < 2 * 60 * 60_000) {
        const { data: count } = await supabase.rpc('restore_device_outages', {
          p_device_id: parsed.device_id,
        })
        restored = typeof count === 'number' ? count : 0
      }
    }

    const upsertPayload: Record<string, unknown> = {
      device_id: parsed.device_id,
      last_seen: now,
      online,
    }
    if (parsed.lat != null && parsed.lng != null) {
      upsertPayload.lat = parsed.lat
      upsertPayload.lng = parsed.lng
    }
    if (parsed.governorate) upsertPayload.governorate = parsed.governorate
    if (!online) {
      upsertPayload.last_offline_at = now
    } else if (prev?.last_offline_at && restored > 0) {
      upsertPayload.last_offline_at = null
    }

    await supabase.from('device_heartbeats').upsert(upsertPayload, { onConflict: 'device_id' })

    if (online) {
      await detectMassSilence(supabase)
      await supabase.rpc('expire_stale_outages')
    }

    return NextResponse.json(
      { ok: true, restored },
      { headers: corsHeaders() },
    )
  } catch (err) {
    console.error('Heartbeat error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() },
    )
  }
}
