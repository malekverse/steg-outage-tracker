'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import type { Theme } from '@/lib/ThemeProvider'

const TUNIS_CENTER: [number, number] = [34.0, 9.5]
const DEFAULT_ZOOM = 6

const TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
} as const

function waitForSize(el: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    const check = () => {
      if (el.offsetWidth >= 50 && el.offsetHeight >= 50) {
        resolve()
      } else {
        requestAnimationFrame(check)
      }
    }
    check()
  })
}

export function useLeafletMap(containerEl: HTMLDivElement | null, theme: Theme) {
  const mapRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!containerEl || mapRef.current) return

    let map: L.Map | null = null
    let resizeObserver: ResizeObserver | null = null
    let cancelled = false

    ;(async () => {
      await waitForSize(containerEl)
      if (cancelled || mapRef.current) return

      map = L.map(containerEl, {
        center: TUNIS_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
      })

      const tiles = L.tileLayer(TILE_URLS[theme === 'dark' ? 'dark' : 'light'], {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      tileLayerRef.current = tiles

      const syncSize = () => {
        if (map && !cancelled) map.invalidateSize({ animate: false })
      }

      syncSize()
      requestAnimationFrame(syncSize)
      setTimeout(syncSize, 100)
      setTimeout(syncSize, 400)

      resizeObserver = new ResizeObserver(syncSize)
      resizeObserver.observe(containerEl)

      if (!cancelled) setMapReady(true)
    })()

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      if (map) {
        map.remove()
        mapRef.current = null
        tileLayerRef.current = null
      }
      setMapReady(false)
    }
  }, [containerEl])

  useEffect(() => {
    if (!tileLayerRef.current || !mapRef.current) return
    tileLayerRef.current.setUrl(TILE_URLS[theme === 'dark' ? 'dark' : 'light'])
    mapRef.current.invalidateSize({ animate: false })
  }, [theme])

  const flyTo = useCallback((lat: number, lng: number, zoom = 10) => {
    mapRef.current?.flyTo([lat, lng], zoom, { duration: 1.2 })
  }, [])

  return { map: mapRef, mapReady, flyTo }
}
