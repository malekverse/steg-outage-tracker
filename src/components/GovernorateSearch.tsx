'use client'

import { memo, useMemo, useState } from 'react'
import { Search, X, MapPin, Filter } from 'lucide-react'
import { searchLocations, getDelegationCenter } from '@/lib/locationUtils'
import { useOutages } from '@/lib/useOutages'
import { useLang } from '@/lib/LangProvider'
import { t } from '@/lib/i18n'

function GovernorateSearchInner() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const { setGovFilter, flyToGovernorate, flyToLocation, govFilter } = useOutages()
  const { lang } = useLang()

  const results = useMemo(() => searchLocations(query, 12), [query])

  function selectResult(result: (typeof results)[0]) {
    setGovFilter(result.governorate)
    if (result.type === 'delegation' && result.delegation) {
      const dc = getDelegationCenter(result.delegation)
      if (dc) flyToLocation(dc.lat, dc.lng, 12)
      else flyToGovernorate(result.governorate)
    } else {
      flyToGovernorate(result.governorate)
    }
    setQuery(result.type === 'delegation' && result.delegation ? result.label : result.governorate)
    setOpen(false)
  }

  function clearFilter() {
    setGovFilter(null)
    setQuery('')
  }

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
          govFilter
            ? 'bg-primary/5 border-primary/30'
            : 'bg-surface-hover border-border/50'
        }`}
      >
        {govFilter ? (
          <Filter className="w-4 h-4 text-primary shrink-0" />
        ) : (
          <Search className="w-4 h-4 text-text-muted shrink-0" />
        )}
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={t('search.placeholder', lang)}
          className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted outline-none min-w-0"
        />
        {(query || govFilter) && (
          <button
            onClick={clearFilter}
            className="text-text-muted hover:text-text transition-colors"
            aria-label="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {govFilter && !open && (
        <p className="text-[10px] text-primary/70 mt-1 px-1">
          {t('search.filtering', lang)}
        </p>
      )}

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface rounded-xl border border-border/50 shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {results.map(result => (
            <button
              key={`${result.type}-${result.label}`}
              onClick={() => selectResult(result)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-surface-hover flex items-center gap-2 ${
                govFilter === result.governorate && result.type === 'governorate'
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-text'
              }`}
            >
              {result.type === 'delegation' ? (
                <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
              ) : null}
              <span className="truncate">{result.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(GovernorateSearchInner)
