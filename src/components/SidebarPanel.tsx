'use client'

import { memo, useMemo } from 'react'
import { MapPin, Clock } from 'lucide-react'
import ElevatorRiskCard from '@/components/ElevatorRiskCard'
import { useOutages } from '@/lib/useOutages'
import { useLang } from '@/lib/LangProvider'
import { popularGovernorates } from '@/lib/locationUtils'
import { t } from '@/lib/i18n'

function agoShort(iso: string, lang: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return lang === 'ar' ? 'الآن' : lang === 'fr' ? 'maintenant' : 'now'
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h`
}

function QuickAreaChips() {
  const { govFilter, setGovFilter, flyToGovernorate } = useOutages()
  const { lang } = useLang()

  return (
    <div>
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
        {t('sidebar.quick', lang)}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {popularGovernorates.map(gov => (
          <button
            key={gov}
            type="button"
            onClick={() => {
              setGovFilter(gov === govFilter ? null : gov)
              flyToGovernorate(gov)
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              govFilter === gov
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-hover text-text-secondary hover:bg-border/60 border border-border/40'
            }`}
          >
            {gov}
          </button>
        ))}
      </div>
    </div>
  )
}

function LiveOutageFeed() {
  const { geoJSON, govFilter } = useOutages()
  const { lang } = useLang()

  const items = useMemo(() => {
    const features = geoJSON?.features ?? []
    return [...features]
      .filter(f => f.properties.created_at)
      .sort(
        (a, b) =>
          new Date(b.properties.created_at!).getTime() -
          new Date(a.properties.created_at!).getTime(),
      )
      .slice(0, 6)
      .map(f => ({
        id:
          f.properties.cluster_id ??
          `${f.properties.governorate}-${f.properties.created_at}`,
        governorate:
          f.properties.governorates?.[0] ?? f.properties.governorate ?? '—',
        delegation: f.properties.delegation,
        source: f.properties.source ?? 'USER',
        count: f.properties.report_count,
        created_at: f.properties.created_at!,
      }))
  }, [geoJSON])

  if (!items.length) {
    return (
      <div className="rounded-xl border border-border/40 bg-surface-hover/40 p-4 text-center">
        <MapPin className="w-5 h-5 text-text-muted/40 mx-auto mb-2" />
        <p className="text-xs text-text-muted">{t('sidebar.noFeed', lang)}</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
        {t('sidebar.feed', lang)}
        {govFilter ? (
          <span className="normal-case font-normal text-primary ml-1">· {govFilter}</span>
        ) : null}
      </p>
      <div className="space-y-1.5">
        {items.map(item => (
          <div
            key={item.id}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-surface-hover/50 border border-border/30"
          >
            <span className="w-2 h-2 rounded-full bg-danger shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text truncate">
                {item.governorate}
                {item.delegation ? (
                  <span className="font-normal text-text-secondary"> · {item.delegation}</span>
                ) : null}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">
                {item.source}
                {item.count != null ? ` · ${item.count} ${t('map.reports', lang)}` : ''}
              </p>
            </div>
            <span className="text-[10px] text-text-muted tabular-nums shrink-0 flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {agoShort(item.created_at, lang)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SidebarPanelInner() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 py-1 scrollbar-hide">
      <ElevatorRiskCard />
      <QuickAreaChips />
      <LiveOutageFeed />
    </div>
  )
}

export default memo(SidebarPanelInner)
