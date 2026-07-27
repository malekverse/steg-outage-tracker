export interface OutageClusterProperties {
  id?: string
  cluster_id?: string
  report_count?: number
  total_confirmations?: number
  governorates?: string[]
  governorate?: string
  delegation?: string
  source?: string
  created_at?: string
  latest_report?: string
}

export interface OutageFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: OutageClusterProperties
}

export interface OutageGeoJSON {
  type: 'FeatureCollection'
  features: OutageFeature[]
  metadata?: {
    total_clusters?: number
    total_reports?: number
    radius_meters?: number
    time_window_minutes?: number
  }
}

export interface OutageStats {
  total: number
  governorates_affected: number
  clusters: number
}

export interface NearbyCluster {
  governorate: string
  distance: number
  report_count: number
  lat: number
  lng: number
}

export interface OutagesQueryParams {
  radius?: number
  window?: number
  governorate?: string
}

export interface ReportRequest {
  latitude: string | number
  longitude: string | number
  governorate: string
  delegation?: string
  source?: 'USER' | 'BOT' | 'SCRAPER' | 'SIGNAL'
  device_id?: string
  signal_type?: string
}

export interface ReportResponse {
  success: true
  id: string
}

export interface ConfirmRequest {
  report_id: string
}

export interface ConfirmResponse {
  success: true
  data?: unknown
  confirmations?: number
}

export type MapFlyToFn = (lat: number, lng: number, zoom?: number) => void
