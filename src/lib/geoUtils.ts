import type { OutageFeature } from './types'

/** Parse GeoJSON Point coordinates from RPC/features (handles string-encoded geometry). */
export function parseFeatureCoordinates(
  feature: Pick<OutageFeature, 'geometry'> | { geometry?: unknown },
): [number, number] | null {
  let geometry = feature.geometry
  if (typeof geometry === 'string') {
    try {
      geometry = JSON.parse(geometry)
    } catch {
      return null
    }
  }
  if (!geometry || typeof geometry !== 'object') return null

  const coords = (geometry as { coordinates?: unknown }).coordinates
  if (!Array.isArray(coords) || coords.length < 2) return null

  const lng = Number(coords[0])
  const lat = Number(coords[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null

  return [lng, lat]
}
