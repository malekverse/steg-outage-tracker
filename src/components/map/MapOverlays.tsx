'use client'

import { memo } from 'react'
import { Map } from 'lucide-react'
import { tunisianGovernorates } from '@/lib/locationUtils'
import { useLang } from '@/lib/LangProvider'
import { t } from '@/lib/i18n'

interface EmptyStateProps {
  govFilter?: string | null
  totalCount?: number
  onClearFilter?: () => void
}

export const EmptyState = memo(function EmptyState({
  govFilter,
  totalCount = 0,
  onClearFilter,
}: EmptyStateProps) {
  const { lang } = useLang()
  const filtered = Boolean(govFilter)
  const hasElsewhere = filtered && totalCount > 0

  return (
    <div className="absolute bottom-14 right-3 sm:bottom-8 sm:right-4 lg:bottom-4 z-500 pointer-events-none max-w-60">
      <div className="bg-surface/95 backdrop-blur-sm rounded-lg px-3 py-2.5 shadow border border-border/40">
        <div className="flex items-start gap-2">
          <Map className="w-4 h-4 text-text-muted/50 shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="min-w-0">
            <p className="text-text-secondary text-xs font-medium leading-snug">
              {hasElsewhere
                ? t('map.empty.filtered.title', lang)
                : t('map.empty.title', lang)}
            </p>
            <p className="text-text-muted text-[11px] mt-0.5 leading-snug">
              {hasElsewhere
                ? t('map.empty.filtered.desc', lang).replace('{count}', String(totalCount))
                : t('map.empty.desc', lang)}
            </p>
            {hasElsewhere && onClearFilter && (
              <button
                type="button"
                onClick={onClearFilter}
                className="mt-2 pointer-events-auto text-[11px] font-semibold text-primary hover:underline"
              >
                {t('map.empty.showall', lang)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

export const Legend = memo(function Legend() {
  const { lang } = useLang()
  return (
    <div className="absolute bottom-4 left-4 z-1000 bg-surface/95 rounded-lg px-3 py-2 shadow border border-border/40 text-[11px] pointer-events-none">
      <p className="font-semibold text-text-secondary mb-1.5">{t('map.legend.severity', lang)}</p>
      <div className="space-y-1">
        {[
          { label: t('map.legend.many', lang), color: '#ef4444' },
          { label: t('map.legend.several', lang), color: '#f97316' },
          { label: t('map.legend.few', lang), color: '#eab308' },
        ].map(item => (
          <div key={item.color} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-text-secondary">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
})

interface FilterPillsProps {
  active: string | null
  onChange: (v: string | null) => void
}

export const FilterPills = memo(function FilterPills({ active, onChange }: FilterPillsProps) {
  const { lang } = useLang()
  return (
    <div className="absolute top-3 left-3 right-3 z-1000 flex gap-1 overflow-x-auto scrollbar-hide pointer-events-none">
      <button
        onClick={() => onChange(null)}
        className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors pointer-events-auto ${
          !active
            ? 'bg-primary text-white shadow-sm'
            : 'bg-surface text-text-secondary border border-border/40 shadow-sm'
        }`}
      >
        {t('map.all', lang)}
      </button>
      {tunisianGovernorates.map(gov => (
        <button
          key={gov}
          onClick={() => onChange(gov === active ? null : gov)}
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors pointer-events-auto ${
            gov === active
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface text-text-secondary border border-border/40 shadow-sm'
          }`}
        >
          {gov}
        </button>
      ))}
    </div>
  )
})
