'use client'

import { useEffect, useRef, useCallback } from 'react'
import { getDeviceId, isPassiveMonitoringEnabled } from '@/lib/deviceId'
import { detectLocationFromCoords, reverseGeocodeLocation } from '@/lib/locationUtils'

const HEARTBEAT_MS = 5 * 60_000
const SIGNAL_COOLDOWN_MS = 30 * 60_000

interface Coords {
  lat: number
  lng: number
  governorate?: string
}

async function resolveCoords(): Promise<Coords | null> {
  if (!navigator.geolocation) return null
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const detected =
          (await reverseGeocodeLocation(lat, lng)) ?? detectLocationFromCoords(lat, lng)
        resolve({ lat, lng, governorate: detected?.governorate })
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120_000 },
    )
  })
}

async function sendHeartbeat(online: boolean, coords?: Coords | null) {
  const deviceId = getDeviceId()
  if (!deviceId) return

  const body: Record<string, unknown> = {
    device_id: deviceId,
    online,
  }
  if (coords) {
    body.lat = coords.lat
    body.lng = coords.lng
    if (coords.governorate) body.governorate = coords.governorate
  }

  try {
    await fetch('/api/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: online === false,
    })
  } catch {
    // ignore network errors during outage
  }
}

async function sendPassiveSignal(
  signalType: string,
  coords: Coords,
  lastSignalRef: React.MutableRefObject<number>,
) {
  const now = Date.now()
  if (now - lastSignalRef.current < SIGNAL_COOLDOWN_MS) return
  lastSignalRef.current = now

  const deviceId = getDeviceId()
  const gov = coords.governorate ?? detectLocationFromCoords(coords.lat, coords.lng)?.governorate
  if (!gov) return

  try {
    await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: coords.lat,
        longitude: coords.lng,
        governorate: gov,
        source: 'SIGNAL',
        device_id: deviceId,
        signal_type: signalType,
      }),
    })
  } catch {
    // ignore
  }
}

/** Foreground passive monitoring: heartbeats, battery/network signals, auto-restore. */
export function usePassiveMonitoring(enabled: boolean) {
  const coordsRef = useRef<Coords | null>(null)
  const wasChargingRef = useRef(false)
  const lastSignalRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshCoords = useCallback(async () => {
    const c = await resolveCoords()
    if (c) coordsRef.current = c
    return c
  }, [])

  const ping = useCallback(
    async (online = true) => {
      if (!isPassiveMonitoringEnabled()) return
      let coords = coordsRef.current
      if (!coords) coords = (await refreshCoords()) ?? null
      await sendHeartbeat(online, coords)
    },
    [refreshCoords],
  )

  useEffect(() => {
    if (!enabled || !isPassiveMonitoringEnabled()) return

    void refreshCoords().then(() => ping(true))

    intervalRef.current = setInterval(() => {
      void refreshCoords().then(() => ping(true))
    }, HEARTBEAT_MS)

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void ping(false)
      } else {
        void refreshCoords().then(() => ping(true))
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    const onOnline = () => {
      void refreshCoords().then(c => ping(true))
    }
    const onOffline = async () => {
      await ping(false)
      const coords = coordsRef.current ?? (await refreshCoords())
      if (coords && wasChargingRef.current) {
        await sendPassiveSignal('power_wifi_loss', coords, lastSignalRef)
      }
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    let battery: BatteryManager | null = null
    const onChargingChange = async () => {
      if (!battery) return
      const wasCharging = wasChargingRef.current
      wasChargingRef.current = battery.charging
      if (wasCharging && !battery.charging && !navigator.onLine) {
        const coords = coordsRef.current ?? (await refreshCoords())
        if (coords) await sendPassiveSignal('power_wifi_loss', coords, lastSignalRef)
      }
    }

    if ('getBattery' in navigator) {
      void (navigator as Navigator & { getBattery(): Promise<BatteryManager> })
        .getBattery()
        .then(b => {
          battery = b
          wasChargingRef.current = b.charging
          b.addEventListener('chargingchange', onChargingChange)
        })
        .catch(() => {})
    }

    let onSwMessage: ((event: MessageEvent) => void) | null = null
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.ready
        .then(reg => {
          reg.active?.postMessage({ type: 'START_HEARTBEAT', intervalMs: HEARTBEAT_MS })
        })
        .catch(() => {})

      onSwMessage = (event: MessageEvent) => {
        if (event.data?.type === 'TRIGGER_HEARTBEAT') void ping(true)
      }
      navigator.serviceWorker.addEventListener('message', onSwMessage)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      battery?.removeEventListener('chargingchange', onChargingChange)
      if (onSwMessage) navigator.serviceWorker.removeEventListener('message', onSwMessage)
    }
  }, [enabled, ping, refreshCoords])
}

interface BatteryManager extends EventTarget {
  charging: boolean
  level: number
}
