'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRealtimeSubscription } from './useRealtime'
import { getGovernorateCenter } from './locationUtils'
import { parseFeatureCoordinates } from './geoUtils'
import type { MapFlyToFn, NearbyCluster, OutageGeoJSON, OutageStats } from './types'

function filterGeoJSONByGovernorate(
  data: OutageGeoJSON | null,
  govFilter: string | null,
): OutageGeoJSON | null {
  if (!data || !govFilter) return data
  const filterLower = govFilter.toLowerCase()
  const features = data.features.filter(f => {
    const props = f.properties
    const names: string[] = props.governorates || [props.governorate || '']
    return names.some(g => g.toLowerCase().includes(filterLower))
  })
  return {
    ...data,
    features,
    metadata: {
      ...data.metadata,
      total_reports: features.length,
      total_clusters: features.filter(f => f.properties.report_count != null).length,
    },
  }
}

interface OutagesContextValue {
  geoJSON: OutageGeoJSON | null
  allGeoJSON: OutageGeoJSON | null
  loading: boolean
  error: string | null
  govFilter: string | null
  setGovFilter: (gov: string | null) => void
  stats: OutageStats
  refresh: () => void
  nearbyCluster: NearbyCluster | null
  lastUpdated: Date | null
  registerMapFlyTo: (fn: MapFlyToFn | null) => void
  flyToGovernorate: (gov: string) => void
  flyToLocation: (lat: number, lng: number, zoom?: number) => void
}

const emptyStats: OutageStats = { total: 0, governorates_affected: 0, clusters: 0 }

const emptyGeoJSON: OutageGeoJSON = {
  type: 'FeatureCollection',
  features: [],
  metadata: { total_clusters: 0, total_reports: 0 },
}

const OutagesContext = createContext<OutagesContextValue>({
  geoJSON: null,
  allGeoJSON: null,
  loading: true,
  error: null,
  govFilter: null,
  setGovFilter: () => {},
  stats: emptyStats,
  refresh: () => {},
  nearbyCluster: null,
  lastUpdated: null,
  registerMapFlyTo: () => {},
  flyToGovernorate: () => {},
  flyToLocation: () => {},
})

const FETCH_TIMEOUT_MS = 8000

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function computeStats(data: OutageGeoJSON | null): OutageStats {
  if (!data?.features?.length) return emptyStats
  const clusters = data.features.filter(f => f.properties.report_count != null)
  const individual = data.features.length - clusters.length
  const total =
    data.metadata?.total_reports ??
    clusters.reduce((s, f) => s + (f.properties.report_count ?? 0), 0) + individual
  const govSet = new Set<string>()
  for (const f of data.features) {
    const props = f.properties
    if (props.governorates) props.governorates.forEach(g => govSet.add(g))
    else if (props.governorate) govSet.add(props.governorate)
  }
  return {
    total,
    governorates_affected: govSet.size,
    clusters: clusters.length,
  }
}

function findNearbyCluster(
  data: OutageGeoJSON | null,
  lat: number,
  lng: number,
): NearbyCluster | null {
  if (!data?.features?.length) return null
  let closest: NearbyCluster | null = null
  for (const f of data.features) {
    if (!f.properties.report_count) continue
    const parsed = parseFeatureCoordinates(f)
    if (!parsed) continue
    const [flng, flat] = parsed
    const d = haversineKm(lat, lng, flat, flng)
    if (d < 80 && (!closest || d < closest.distance)) {
      closest = {
        governorate: f.properties.governorates?.[0] || 'Unknown',
        distance: Math.round(d),
        report_count: f.properties.report_count,
        lat: flat,
        lng: flng,
      }
    }
  }
  return closest
}

async function fetchWithTimeout(url: string, externalSignal: AbortSignal): Promise<Response> {
  const controller = new AbortController()
  const onExternalAbort = () => controller.abort()
  externalSignal.addEventListener('abort', onExternalAbort)
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
    externalSignal.removeEventListener('abort', onExternalAbort)
  }
}

export function OutagesProvider({ children }: { children: ReactNode }) {
  const [geoJSON, setGeoJSON] = useState<OutageGeoJSON | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [govFilter, setGovFilterState] = useState<string | null>(null)
  const [nearbyCluster, setNearbyCluster] = useState<NearbyCluster | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const fetchKeyRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const geoJSONRef = useRef<OutageGeoJSON | null>(null)
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  const mountedRef = useRef(true)
  const govFilterRef = useRef<string | null>(null)
  const mapFlyToRef = useRef<MapFlyToFn | null>(null)
  const initialLoadDoneRef = useRef(false)

  geoJSONRef.current = geoJSON

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  const finishInitialLoad = useCallback((data?: OutageGeoJSON, err?: string) => {
    if (initialLoadDoneRef.current) return
    initialLoadDoneRef.current = true
    setGeoJSON(data ?? emptyGeoJSON)
    if (err) setError(err)
    setLoading(false)
  }, [])

  const fetchOutages = useCallback(
    async (silent = false) => {
      if (!silent) {
        abortRef.current?.abort()
      }

      const controller = new AbortController()
      if (!silent) {
        abortRef.current = controller
      }

      const key = ++fetchKeyRef.current
      const isInitialLoad = !initialLoadDoneRef.current

      if (!silent && isInitialLoad) {
        setLoading(true)
      }
      if (!silent) setError(null)

      try {
        const url = '/api/outages?window=1440'
        const res = await fetchWithTimeout(url, controller.signal)

        let data: OutageGeoJSON = emptyGeoJSON
        if (res.ok) {
          data = await res.json()
        } else if (isInitialLoad) {
          finishInitialLoad(emptyGeoJSON, 'Unable to load outage data')
          return
        }

        if (key !== fetchKeyRef.current || !mountedRef.current) return

        setGeoJSON(data)
        setLastUpdated(new Date())
        if (isInitialLoad) {
          initialLoadDoneRef.current = true
          setLoading(false)
        }
        if (userLocationRef.current) {
          setNearbyCluster(
            findNearbyCluster(data, userLocationRef.current.lat, userLocationRef.current.lng),
          )
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        if (key !== fetchKeyRef.current || !mountedRef.current) return

        if (isInitialLoad) {
          finishInitialLoad(emptyGeoJSON, err instanceof Error ? err.message : 'Unknown error')
        }
      }
    },
    [finishInitialLoad],
  )

  const setGovFilter = useCallback((gov: string | null) => {
    govFilterRef.current = gov
    setGovFilterState(gov)
  }, [])

  const refresh = useCallback(() => {
    fetchOutages(false)
  }, [fetchOutages])

  const registerMapFlyTo = useCallback((fn: MapFlyToFn | null) => {
    mapFlyToRef.current = fn
  }, [])

  const flyToGovernorate = useCallback((gov: string) => {
    const center = getGovernorateCenter(gov)
    if (center && mapFlyToRef.current) {
      mapFlyToRef.current(center.lat, center.lng, center.zoom)
    }
  }, [])

  const flyToLocation = useCallback((lat: number, lng: number, zoom = 13) => {
    if (mapFlyToRef.current) {
      mapFlyToRef.current(lat, lng, zoom)
    }
  }, [])

  useEffect(() => {
    fetchOutages(false)
  }, [fetchOutages])

  useEffect(() => {
    const safety = setTimeout(() => {
      if (!initialLoadDoneRef.current && mountedRef.current) {
        finishInitialLoad(emptyGeoJSON, 'Request timed out')
      }
    }, FETCH_TIMEOUT_MS + 2000)
    return () => clearTimeout(safety)
  }, [finishInitialLoad])

  useRealtimeSubscription('outage_reports', '*', () => {
    if (initialLoadDoneRef.current) {
      fetchOutages(true)
    }
  })

  useEffect(() => {
    if (!initialLoadDoneRef.current) return
    const interval = setInterval(() => fetchOutages(true), 30_000)
    return () => clearInterval(interval)
  }, [fetchOutages])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        userLocationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }, [])

  useEffect(() => {
    const loc = userLocationRef.current
    if (loc && geoJSON) {
      setNearbyCluster(findNearbyCluster(geoJSON, loc.lat, loc.lng))
    }
  }, [geoJSON])

  const visibleGeoJSON = useMemo(
    () => filterGeoJSONByGovernorate(geoJSON, govFilter),
    [geoJSON, govFilter],
  )

  const stats = useMemo(() => computeStats(visibleGeoJSON), [visibleGeoJSON])

  const value = useMemo(
    () => ({
      geoJSON: visibleGeoJSON,
      allGeoJSON: geoJSON,
      loading,
      error,
      govFilter,
      setGovFilter,
      stats,
      refresh,
      nearbyCluster,
      lastUpdated,
      registerMapFlyTo,
      flyToGovernorate,
      flyToLocation,
    }),
    [
      visibleGeoJSON,
      geoJSON,
      loading,
      error,
      govFilter,
      setGovFilter,
      stats,
      refresh,
      nearbyCluster,
      lastUpdated,
      registerMapFlyTo,
      flyToGovernorate,
      flyToLocation,
    ],
  )

  return <OutagesContext.Provider value={value}>{children}</OutagesContext.Provider>
}

export function useOutages() {
  return useContext(OutagesContext)
}
