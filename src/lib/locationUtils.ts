export {
  tunisianGovernorates,
  delegationByGovernorate,
  delegationToGovernorate,
  governorateCenters,
  governorateKeywords,
  type TunisianGovernorate,
} from './tunisia-admin-data'

import {
  governorateCenters,
  governorateKeywords,
  tunisianGovernorates,
  delegationByGovernorate,
  delegationToGovernorate,
  type TunisianGovernorate,
} from './tunisia-admin-data'

// --- Delegation coordinate generation ---
// Spreads delegations in a deterministic spiral around governorate center
// so each delegation has a unique, stable position on the map.

const SPREAD_DEG = 0.04 // ~4.4km between delegation positions

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

interface DelegationCoord {
  lat: number
  lng: number
  governorate: TunisianGovernorate
}

const delegationCoordsCache = new Map<string, DelegationCoord>()

function buildDelegationCoords() {
  if (delegationCoordsCache.size > 0) return
  for (const [gov, delegations] of Object.entries(delegationByGovernorate)) {
    const center = governorateCenters[gov as TunisianGovernorate]
    if (!center) continue
    const count = delegations.length
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / Math.max(count, 1)
      const ring = Math.floor(i / 6) + 1
      const spread = SPREAD_DEG * ring * 0.7
      const lat = center.lat + Math.cos(angle) * spread
      const lng = center.lng + Math.sin(angle) * spread * 1.2
      delegationCoordsCache.set(delegations[i], {
        lat,
        lng,
        governorate: gov as TunisianGovernorate,
      })
    }
  }
}

/** Get approximate coordinates for a delegation. */
export function getDelegationCenter(delegation: string): { lat: number; lng: number } | null {
  buildDelegationCoords()
  const entry = delegationCoordsCache.get(delegation)
  if (entry) return { lat: entry.lat, lng: entry.lng }
  // Fallback: check if it exists in mapping
  const gov = delegationToGovernorate[delegation as keyof typeof delegationToGovernorate]
  if (gov) {
    const center = governorateCenters[gov as TunisianGovernorate]
    if (center) {
      const h = hashStr(delegation)
      return {
        lat: center.lat + ((h % 100) - 50) * 0.0006,
        lng: center.lng + (((h >> 8) % 100) - 50) * 0.0007,
      }
    }
  }
  return null
}

/** Get the best coordinates for a location (delegation > governorate). */
export function getLocationCoordinates(
  governorate: string,
  delegation?: string,
): { lat: number; lng: number } | null {
  if (delegation) {
    const dc = getDelegationCenter(delegation)
    if (dc) return dc
  }
  const gc = governorateCenters[governorate as TunisianGovernorate]
  if (gc) return { lat: gc.lat, lng: gc.lng }
  return null
}

// --- Search ---

export function parseGovernorate(text: string): string | null {
  const lower = text.toLowerCase()
  for (const [gov, keywords] of Object.entries(governorateKeywords)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) return gov
    }
  }
  return null
}

export interface LocationSearchResult {
  type: 'governorate' | 'delegation'
  governorate: TunisianGovernorate
  delegation?: string
  label: string
}

/** Search governorates and all 264 delegations by name. */
export function searchLocations(query: string, limit = 12): LocationSearchResult[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return tunisianGovernorates.slice(0, limit).map(gov => ({
      type: 'governorate' as const,
      governorate: gov,
      label: gov,
    }))
  }

  const results: LocationSearchResult[] = []
  const seen = new Set<string>()

  for (const gov of tunisianGovernorates) {
    if (gov.toLowerCase().includes(q)) {
      const key = `g:${gov}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push({ type: 'governorate', governorate: gov, label: gov })
      }
    }
  }

  for (const [delegation, gov] of Object.entries(delegationToGovernorate)) {
    if (delegation.toLowerCase().includes(q)) {
      const key = `d:${delegation}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push({
          type: 'delegation',
          governorate: gov as TunisianGovernorate,
          delegation,
          label: `${delegation}, ${gov}`,
        })
      }
    }
  }

  return results.slice(0, limit)
}

// --- Map utilities ---

export function getClusterColor(count: number): string {
  if (count >= 10) return '#ef4444'
  if (count >= 5) return '#f97316'
  return '#eab308'
}

export function getClusterRadius(count: number): number {
  return Math.min(20 + count * 3, 60)
}

export const popularGovernorates = [
  'Tunis',
  'Ariana',
  'Ben Arous',
  'Sousse',
  'Sfax',
  'Nabeul',
  'Bizerte',
  'Monastir',
  'Mahdia',
  'Gabès',
] as const

export function isPeakHour(): boolean {
  const h = new Date().getHours()
  return h >= 12 && h < 17
}

export function getElevatorRiskLevel(): 'low' | 'medium' | 'high' | 'critical' {
  const h = new Date().getHours()
  if (h >= 12 && h < 14) return 'critical'
  if (h >= 14 && h < 17) return 'high'
  if (h >= 17 && h < 20) return 'medium'
  return 'low'
}

// --- GPS / Geolocation ---

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface DetectedLocation {
  governorate: TunisianGovernorate
  delegation: string | null
}

function normalizeAdminName(name: string): string {
  return name
    .toLowerCase()
    .replace(/gouvernorat\s*(de|d'|du|des)?\s*/gi, '')
    .replace(/délégation\s*(de|d'|du|des)?\s*/gi, '')
    .replace(/[\u0600-\u06FF]+/g, '')
    .replace(/[''`]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function matchGovernorate(nominatimState: string): TunisianGovernorate | null {
  const normalized = normalizeAdminName(nominatimState)
  if (!normalized) return null

  for (const gov of tunisianGovernorates) {
    const govNorm = normalizeAdminName(gov)
    if (normalized === govNorm || normalized.includes(govNorm) || govNorm.includes(normalized)) {
      return gov
    }
  }

  for (const [gov, keywords] of Object.entries(governorateKeywords)) {
    for (const kw of keywords) {
      const kwNorm = normalizeAdminName(kw)
      if (normalized.includes(kwNorm) || kwNorm.includes(normalized)) {
        return gov as TunisianGovernorate
      }
    }
  }

  return null
}

function matchDelegation(candidates: string[], governorate: TunisianGovernorate): string | null {
  const delegations = delegationByGovernorate[governorate] || []
  if (!delegations.length) return null

  for (const candidate of candidates) {
    if (!candidate) continue
    const candNorm = normalizeAdminName(candidate)
    if (!candNorm) continue

    for (const d of delegations) {
      const dNorm = normalizeAdminName(d)
      if (candNorm === dNorm) return d
      if (candNorm.includes(dNorm) || dNorm.includes(candNorm)) return d
    }
  }

  return null
}

/**
 * Reverse-geocode GPS coordinates using Nominatim (OpenStreetMap).
 * Returns the actual administrative governorate and delegation,
 * falling back to center-based detection on network failure.
 */
export async function reverseGeocodeLocation(lat: number, lng: number): Promise<DetectedLocation | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=fr&zoom=14`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'STEGOutageTracker/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error('Nominatim error')
    const data = await res.json()
    const addr = data.address
    if (!addr) throw new Error('No address')

    const stateName = addr.state || addr.province || ''
    const county = addr.county || ''
    const municipality = addr.municipality || ''
    const town = addr.town || ''
    const city = addr.city || ''
    const suburb = addr.suburb || ''
    const village = addr.village || ''
    const cityDistrict = addr.city_district || ''

    let matchedGov = matchGovernorate(stateName)

    if (!matchedGov && county) {
      matchedGov = matchGovernorate(county)
    }

    if (!matchedGov) {
      return detectLocationFromCoordsOffline(lat, lng)
    }

    const delegationCandidates = [
      county,
      municipality,
      town,
      cityDistrict,
      suburb,
      village,
      city,
    ]
    const matchedDeleg = matchDelegation(delegationCandidates, matchedGov)

    return { governorate: matchedGov, delegation: matchedDeleg }
  } catch {
    return detectLocationFromCoordsOffline(lat, lng)
  }
}

/** Offline fallback: detect location from nearest centers. */
export function detectLocationFromCoordsOffline(lat: number, lng: number): DetectedLocation | null {
  let closestGov: TunisianGovernorate | null = null
  let minGovDist = Infinity
  for (const [gov, center] of Object.entries(governorateCenters)) {
    const d = haversineKm(lat, lng, center.lat, center.lng)
    if (d < minGovDist) {
      minGovDist = d
      closestGov = gov as TunisianGovernorate
    }
  }
  if (!closestGov) return null

  buildDelegationCoords()
  const delegations = delegationByGovernorate[closestGov]
  if (!delegations?.length) return { governorate: closestGov, delegation: null }

  let closestDeleg: string | null = null
  let minDelegDist = Infinity
  for (const deleg of delegations) {
    const dc = delegationCoordsCache.get(deleg)
    if (!dc) continue
    const d = haversineKm(lat, lng, dc.lat, dc.lng)
    if (d < minDelegDist) {
      minDelegDist = d
      closestDeleg = deleg
    }
  }

  return { governorate: closestGov, delegation: closestDeleg }
}

/** Detect both governorate and delegation from GPS coordinates (offline only). */
export function detectLocationFromCoords(lat: number, lng: number): DetectedLocation | null {
  return detectLocationFromCoordsOffline(lat, lng)
}

/** Pick the nearest Tunisian governorate from GPS coordinates. */
export function detectGovernorateFromCoords(lat: number, lng: number): TunisianGovernorate | null {
  const result = detectLocationFromCoordsOffline(lat, lng)
  return result?.governorate ?? null
}

/** All delegations for a governorate (264 total nationwide). */
export function getDelegations(governorate: string): readonly string[] {
  return delegationByGovernorate[governorate as TunisianGovernorate] ?? []
}

export function getGovernorateCenter(governorate: string) {
  return governorateCenters[governorate as TunisianGovernorate]
}
