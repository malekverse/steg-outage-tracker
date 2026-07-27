'use client'

import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '@/lib/ThemeProvider'
import { useLang } from '@/lib/LangProvider'
import { useOutages } from '@/lib/useOutages'
import { getGovernorateCenter } from '@/lib/locationUtils'
import { t } from '@/lib/i18n'
import { useOutageLayers } from './map/useOutageLayers'
import { EmptyState, FilterPills, Legend } from './map/MapOverlays'

const TUNIS_CENTER: [number, number] = [34.0, 9.5]
const DEFAULT_ZOOM = 6

const TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
} as const

function OutageMapInner() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileRef = useRef<L.TileLayer | null>(null)
  const flyToRef = useRef<(lat: number, lng: number, zoom?: number) => void>(() => {})
  const [mapReady, setMapReady] = useState(false)

  const { theme } = useTheme()
  const { lang } = useLang()
  const { geoJSON, allGeoJSON, loading, govFilter, setGovFilter, registerMapFlyTo } = useOutages()

  // Init map once after DOM is ready
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    const map = L.map(el, {
      center: TUNIS_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      scrollWheelZoom: true,
    })

    const tiles = L.tileLayer(TILE_URLS.light, {
      attribution:
        '&copy; OSM &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map
    tileRef.current = tiles
    setMapReady(true)

    flyToRef.current = (lat, lng, zoom = 10) => {
      map.flyTo([lat, lng], zoom, { duration: 1.2 })
    }

    const fix = () => map.invalidateSize({ animate: false })
    fix()
    const t1 = setTimeout(fix, 100)
    const t2 = setTimeout(fix, 500)

    const ro = new ResizeObserver(fix)
    ro.observe(el)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      ro.disconnect()
      map.remove()
      mapRef.current = null
      tileRef.current = null
      setMapReady(false)
    }
  }, [])

  // Theme tile swap
  useEffect(() => {
    if (!tileRef.current || !mapRef.current) return
    tileRef.current.setUrl(TILE_URLS[theme === 'dark' ? 'dark' : 'light'])
    mapRef.current.invalidateSize({ animate: false })
  }, [theme])

  useOutageLayers(mapRef, geoJSON, mapReady, govFilter, lang)

  useEffect(() => {
    registerMapFlyTo((lat, lng, zoom) => flyToRef.current(lat, lng, zoom))
    return () => registerMapFlyTo(null)
  }, [registerMapFlyTo])

  useEffect(() => {
    if (govFilter && mapRef.current) {
      const center = getGovernorateCenter(govFilter)
      if (center) flyToRef.current(center.lat, center.lng, center.zoom)
    }
  }, [govFilter])

  const featureCount = geoJSON?.features?.length ?? 0
  const totalCount = allGeoJSON?.features?.length ?? 0
  const showDataLoading = loading && allGeoJSON === null

  return (
    <div className="h-full w-full relative">
      <div ref={containerRef} className="h-full w-full" />
      {showDataLoading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-1000 bg-surface px-3 py-1 rounded-full text-xs text-text-secondary shadow border border-border/40 pointer-events-none">
          {t('map.fetching', lang)}
        </div>
      )}
      {featureCount === 0 && !loading && (
        <EmptyState
          govFilter={govFilter}
          totalCount={totalCount}
          onClearFilter={() => setGovFilter(null)}
        />
      )}
      <div className="lg:hidden">
        <FilterPills active={govFilter} onChange={setGovFilter} />
      </div>
      <Legend />
    </div>
  )
}

export default memo(OutageMapInner)
