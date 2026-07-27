'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { getClusterColor, getClusterRadius } from '@/lib/locationUtils'
import { parseFeatureCoordinates } from '@/lib/geoUtils'
import type { OutageGeoJSON } from '@/lib/types'
import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'

interface LayerBundle {
  circle: L.Circle
  marker?: L.CircleMarker
}

function ageAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function buildClusterPopup(
  count: number,
  confirmations: number,
  govs: string[],
  clusterId: string | undefined,
  color: string,
  lang: Lang,
): string {
  const govsHtml = govs
    .map(
      g =>
        `<span style="background:var(--surface-hover,#f1f5f9);padding:2px 6px;border-radius:4px;font-size:11px;font-weight:500">${g}</span>`,
    )
    .join(' ')
  return `
    <div style="min-width:160px;font-family:system-ui,sans-serif">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
        <div style="width:8px;height:8px;border-radius:50%;background:${color}"></div>
        <span style="font-weight:600;font-size:13px">${count} ${t('map.reports', lang)}</span>
      </div>
      ${govs.length ? `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:4px">${govsHtml}</div>` : ''}
      <div style="font-size:11px;color:var(--text-secondary,#64748b);margin-bottom:6px">${confirmations} ${t('confirm.count', lang)}</div>
      <div style="display:flex;gap:4px">
        <button id="confirm-btn-${clusterId}" style="flex:1;padding:5px 10px;border-radius:8px;border:1.5px solid ${color};background:transparent;color:${color};font-size:12px;font-weight:600;cursor:pointer">${t('confirm.button', lang)}</button>
        <button id="dispute-btn-${clusterId}" style="padding:5px 10px;border-radius:8px;border:1.5px solid #ef4444;background:transparent;color:#ef4444;font-size:11px;font-weight:500;cursor:pointer">${t('dispute.button', lang)}</button>
      </div>
    </div>
  `
}

function buildSinglePopup(
  reportId: string | undefined,
  governorate: string,
  delegation: string,
  source: string,
  createdAt: string,
  lang: Lang,
): string {
  return `
    <div style="min-width:140px;font-family:system-ui,sans-serif">
      <p style="font-weight:600;font-size:13px;margin:0 0 2px">${governorate}</p>
      ${delegation ? `<p style="font-size:11px;color:var(--text-secondary,#64748b);margin:0 0 4px">${delegation}</p>` : ''}
      <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--text-muted,#94a3b8);margin-bottom:6px">
        <span style="background:var(--surface-hover,#f1f5f9);padding:1px 5px;border-radius:3px">${t('map.via', lang)} ${source}</span>
        <span>· ${ageAgo(createdAt)}</span>
      </div>
      ${reportId ? `<button id="dispute-single-${reportId}" style="width:100%;padding:4px 8px;border-radius:6px;border:1.5px solid #ef4444;background:transparent;color:#ef4444;font-size:11px;font-weight:500;cursor:pointer">${t('dispute.button', lang)}</button>` : ''}
    </div>
  `
}

export function useOutageLayers(
  mapRef: React.RefObject<L.Map | null>,
  geoJSON: OutageGeoJSON | null,
  mapReady: boolean,
  govFilter: string | null,
  lang: Lang,
) {
  const layersRef = useRef<LayerBundle[]>([])
  const initialFitDoneRef = useRef(false)
  const lastFitFilterRef = useRef<string | null>(null)

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    for (const layer of layersRef.current) {
      layer.circle.remove()
      layer.marker?.remove()
    }
    layersRef.current = []

    if (!geoJSON?.features?.length) return

    for (const feature of geoJSON.features) {
      const parsed = parseFeatureCoordinates(feature)
      if (!parsed) continue
      const [lng, lat] = parsed

      const props = feature.properties

      if (props.report_count != null) {
        const count = props.report_count
        const confirmations = props.total_confirmations || 0
        const govs = props.governorates || []
        const color = getClusterColor(count)

        const circle = L.circle([lat, lng], {
          radius: getClusterRadius(count) * 40,
          color,
          fillColor: color,
          fillOpacity: 0.12,
          weight: 2.5,
        }).addTo(map)

        const marker = L.circleMarker([lat, lng], {
          radius: Math.min(8 + count * 2, 18),
          color,
          fillColor: color,
          fillOpacity: 0.85,
          weight: 2,
          className: 'outage-cluster-marker',
        }).addTo(map)

        circle.bindPopup(
          buildClusterPopup(count, confirmations, govs, props.cluster_id, color, lang),
        )

        circle.on('popupopen', () => {
          const confirmBtn = document.getElementById(`confirm-btn-${props.cluster_id}`)
          const disputeBtn = document.getElementById(`dispute-btn-${props.cluster_id}`)

          if (confirmBtn) {
            const confirmHandler = async () => {
              confirmBtn.textContent = '...'
              try {
                await fetch('/api/confirm', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ report_id: props.cluster_id }),
                })
                confirmBtn.textContent = t('confirm.confirmed', lang)
                ;(confirmBtn as HTMLButtonElement).style.background = '#22c55e'
                ;(confirmBtn as HTMLButtonElement).style.borderColor = '#22c55e'
                ;(confirmBtn as HTMLButtonElement).style.color = 'white'
                navigator.vibrate?.(30)
              } catch {
                confirmBtn.textContent = 'Failed'
              }
            }
            confirmBtn.onclick = confirmHandler
          }

          if (disputeBtn) {
            const disputeHandler = async () => {
              disputeBtn.textContent = '...'
              try {
                const res = await fetch('/api/dispute', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ report_id: props.cluster_id }),
                })
                const data = await res.json()
                if (data.removed) {
                  disputeBtn.textContent = t('dispute.removed', lang)
                  ;(disputeBtn as HTMLButtonElement).style.background = '#ef4444'
                  ;(disputeBtn as HTMLButtonElement).style.color = 'white'
                  circle.closePopup()
                  setTimeout(() => { circle.remove(); marker?.remove() }, 800)
                } else {
                  disputeBtn.textContent = t('dispute.done', lang)
                  ;(disputeBtn as HTMLButtonElement).style.background = '#ef4444'
                  ;(disputeBtn as HTMLButtonElement).style.color = 'white'
                }
                navigator.vibrate?.(30)
              } catch {
                disputeBtn.textContent = 'Failed'
              }
            }
            disputeBtn.onclick = disputeHandler
          }

          circle.once('popupclose', () => {
            if (confirmBtn) confirmBtn.onclick = null
            if (disputeBtn) disputeBtn.onclick = null
          })
        })

        layersRef.current.push({ circle, marker })
      } else {
        const circle = L.circle([lat, lng], {
          radius: 120,
          color: '#eab308',
          fillColor: '#eab308',
          fillOpacity: 0.45,
          weight: 1.5,
        }).addTo(map)

        const reportId = props.id || ''
        const delegation = props.delegation || ''
        const source = props.source || 'unknown'
        const createdAt = props.created_at || ''

        circle.bindPopup(
          buildSinglePopup(reportId, props.governorate || '', delegation, source, createdAt, lang),
        )

        if (reportId) {
          circle.on('popupopen', () => {
            const disputeBtn = document.getElementById(`dispute-single-${reportId}`)
            if (!disputeBtn) return
            const handler = async () => {
              disputeBtn.textContent = '...'
              try {
                const res = await fetch('/api/dispute', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ report_id: reportId }),
                })
                const data = await res.json()
                if (data.removed) {
                  disputeBtn.textContent = t('dispute.removed', lang)
                  ;(disputeBtn as HTMLButtonElement).style.background = '#ef4444'
                  ;(disputeBtn as HTMLButtonElement).style.color = 'white'
                  circle.closePopup()
                  setTimeout(() => circle.remove(), 800)
                } else {
                  disputeBtn.textContent = t('dispute.done', lang)
                  ;(disputeBtn as HTMLButtonElement).style.background = '#ef4444'
                  ;(disputeBtn as HTMLButtonElement).style.color = 'white'
                }
                navigator.vibrate?.(30)
              } catch {
                disputeBtn.textContent = 'Failed'
              }
            }
            disputeBtn.onclick = handler
            circle.once('popupclose', () => {
              disputeBtn.onclick = null
            })
          })
        }

        layersRef.current.push({ circle })
      }
    }

    const shouldFit =
      layersRef.current.length > 0 &&
      (!initialFitDoneRef.current || lastFitFilterRef.current !== govFilter)

    if (shouldFit) {
      const group = L.featureGroup(layersRef.current.map(l => l.circle))
      map.fitBounds(group.getBounds().pad(0.1))
      initialFitDoneRef.current = true
      lastFitFilterRef.current = govFilter
    }
  }, [geoJSON, mapReady, govFilter, lang, mapRef])

  useEffect(() => {
    return () => {
      for (const layer of layersRef.current) {
        layer.circle.remove()
        layer.marker?.remove()
      }
      layersRef.current = []
    }
  }, [])
}
