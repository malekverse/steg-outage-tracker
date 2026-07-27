import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rateLimit'
import type { OutageFeature, OutageGeoJSON } from '@/lib/types'

const DEFAULT_WINDOW_MINUTES = 1440
const DEFAULT_RADIUS_METERS = 1500
const RPC_TIMEOUT_MS = 8000

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function emptyGeoJSON(windowMinutes: number, radiusMeters: number): OutageGeoJSON {
  return {
    type: 'FeatureCollection',
    features: [],
    metadata: {
      total_clusters: 0,
      total_reports: 0,
      radius_meters: radiusMeters,
      time_window_minutes: windowMinutes,
    },
  }
}

function jsonResponse(data: OutageGeoJSON) {
  return NextResponse.json(data, {
    headers: {
      ...corsHeaders(),
      'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=10',
    },
  })
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

async function fetchClusters(supabase: SupabaseClient, radius: number, window: number) {
  const rpc = supabase.rpc('get_active_clusters', {
    radius_meters: radius,
    time_window_minutes: window,
  })

  return Promise.race([
    rpc,
    new Promise<{ data: null; error: { message: string } }>(resolve =>
      setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), RPC_TIMEOUT_MS),
    ),
  ])
}

function parseLocation(raw: unknown): { type: 'Point'; coordinates: [number, number] } | null {
  if (!raw) return null
  let loc = raw
  if (typeof loc === 'string') {
    try {
      loc = JSON.parse(loc)
    } catch {
      return null
    }
  }
  if (typeof loc !== 'object' || loc === null) return null
  const coords = (loc as { coordinates?: unknown }).coordinates
  if (!Array.isArray(coords) || coords.length < 2) return null
  const lng = Number(coords[0])
  const lat = Number(coords[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { type: 'Point', coordinates: [lng, lat] }
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

interface ReportRow {
  id: string
  governorate: string
  delegation: string | null
  source: string | null
  confirmations: number | null
  created_at: string
  location: unknown
}

const RECENT_THRESHOLD_MS = 30 * 60_000

function filterReportsForMap(rows: ReportRow[], radiusKm = 1.5): OutageFeature[] {
  const now = Date.now()
  const parsed = rows
    .map(row => ({ row, geometry: parseLocation(row.location) }))
    .filter((x): x is { row: ReportRow; geometry: { type: 'Point'; coordinates: [number, number] } } =>
      x.geometry != null,
    )

  const features: OutageFeature[] = []

  for (const { row, geometry } of parsed) {
    const source = row.source ?? 'USER'
    const age = now - new Date(row.created_at).getTime()
    const isRecent = age < RECENT_THRESHOLD_MS

    if (source === 'SCRAPER' || source === 'BOT' || isRecent) {
      features.push({
        type: 'Feature',
        geometry,
        properties: {
          id: row.id,
          governorate: row.governorate,
          delegation: row.delegation ?? undefined,
          source,
          created_at: row.created_at,
        },
      })
      continue
    }

    const [lng, lat] = geometry.coordinates
    let neighbors = 0
    for (const other of parsed) {
      if (other.row.id === row.id) continue
      const [olng, olat] = other.geometry.coordinates
      if (haversineKm(lat, lng, olat, olng) <= radiusKm) neighbors++
    }
    if (neighbors >= 1) {
      features.push({
        type: 'Feature',
        geometry,
        properties: {
          id: row.id,
          governorate: row.governorate,
          delegation: row.delegation ?? undefined,
          source,
          created_at: row.created_at,
        },
      })
    }
  }

  return features
}

/** Fallback when RPC is missing or fails — returns clustered OFF reports. */
async function fetchReportsFallback(
  supabase: SupabaseClient,
  windowMinutes: number,
): Promise<OutageGeoJSON> {
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString()
  const { data, error } = await supabase
    .from('outage_reports')
    .select('id, governorate, delegation, source, confirmations, created_at, location')
    .eq('status', 'OFF')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(300)

  if (error || !data?.length) {
    return emptyGeoJSON(windowMinutes, DEFAULT_RADIUS_METERS)
  }

  const features = filterReportsForMap(data as ReportRow[])

  return {
    type: 'FeatureCollection',
    features,
    metadata: {
      total_clusters: 0,
      total_reports: features.length,
      radius_meters: DEFAULT_RADIUS_METERS,
      time_window_minutes: windowMinutes,
    },
  }
}

function applyGovernorateFilter(geoJSON: OutageGeoJSON, govFilter: string): OutageGeoJSON {
  const filterLower = govFilter.toLowerCase()
  const features = geoJSON.features.filter(f => {
    const props = f.properties
    const names: string[] = props.governorates || [props.governorate || '']
    return names.some(g => g.toLowerCase().includes(filterLower))
  })
  return {
    ...geoJSON,
    features,
    metadata: {
      ...geoJSON.metadata,
      total_reports: features.length,
      total_clusters: features.filter(f => f.properties.report_count != null).length,
    },
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

export async function GET(req: NextRequest) {
  const ip = getIP(req)
  const { allowed } = rateLimit(ip, 30, 60000)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: corsHeaders() },
    )
  }

  try {
    const radiusParam = req.nextUrl.searchParams.get('radius')
    const windowParam = req.nextUrl.searchParams.get('window')
    const govFilter = req.nextUrl.searchParams.get('governorate')

    const radius = radiusParam ? parseInt(radiusParam) : DEFAULT_RADIUS_METERS
    const window = windowParam ? parseInt(windowParam) : DEFAULT_WINDOW_MINUTES

    if (isNaN(radius) || radius < 100 || radius > 50000) {
      return NextResponse.json(
        { error: 'radius must be a number between 100 and 50000 meters' },
        { status: 400, headers: corsHeaders() },
      )
    }

    if (isNaN(window) || window < 1 || window > 2880) {
      return NextResponse.json(
        { error: 'window must be a number between 1 and 2880 minutes' },
        { status: 400, headers: corsHeaders() },
      )
    }

    const supabase = getSupabase()
    if (!supabase) {
      return jsonResponse(emptyGeoJSON(window, radius))
    }

    const { data, error } = await fetchClusters(supabase, radius, window)

    let geoJSON: OutageGeoJSON

    if (error || !data) {
      console.error('Supabase RPC error, using fallback:', error)
      geoJSON = await fetchReportsFallback(supabase, window)
    } else {
      geoJSON = (data as OutageGeoJSON) ?? emptyGeoJSON(window, radius)
      if (!geoJSON.features?.length) {
        geoJSON = await fetchReportsFallback(supabase, window)
      }
    }

    if (govFilter && geoJSON.features?.length) {
      geoJSON = applyGovernorateFilter(geoJSON, govFilter)
    }

    return jsonResponse(geoJSON)
  } catch (err) {
    console.error('Outages endpoint error:', err)
    return jsonResponse(emptyGeoJSON(DEFAULT_WINDOW_MINUTES, DEFAULT_RADIUS_METERS))
  }
}
