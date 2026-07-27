'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/ThemeProvider'
import { useLang } from '@/lib/LangProvider'
import { useOutages } from '@/lib/useOutages'
import { isPeakHour } from '@/lib/locationUtils'
import { t } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'

const LANG_LABELS: Record<Lang, string> = { fr: 'FR', ar: 'AR', en: 'EN' }

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    if (prev.current === value) return
    prev.current = value
    setDisplay(value)
  }, [value])

  return (
    <div className="text-center">
      <div className="text-2xl font-bold tabular-nums leading-none" style={{ color }}>
        {display}
      </div>
      <div className="text-[10px] font-medium text-text-muted uppercase tracking-wide mt-1">
        {label}
      </div>
    </div>
  )
}

interface LiveStatsHeaderProps {
  variant?: 'mobile' | 'sidebar'
  className?: string
}

function LiveStatsHeaderInner({ variant = 'mobile', className = '' }: LiveStatsHeaderProps) {
  const { stats, govFilter, lastUpdated } = useOutages()
  const { theme, toggle: toggleTheme } = useTheme()
  const { lang, setLang } = useLang()
  const peak = isPeakHour()

  const controls = (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={toggleTheme}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover text-text-muted transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </button>
      <div className="flex rounded-lg border border-border overflow-hidden">
        {(['fr', 'ar', 'en'] as Lang[]).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-2 py-1 text-[10px] font-semibold transition-colors ${lang === l ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface-hover'}`}
          >
            {LANG_LABELS[l]}
          </button>
        ))}
      </div>
    </div>
  )

  if (variant === 'sidebar') {
    return (
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <motion.span
                className="w-2 h-2 rounded-full bg-danger shrink-0"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <h1 className="text-base font-bold text-text truncate">{t('app.title', lang)}</h1>
            </div>
            <p className="text-xs text-text-muted mt-0.5 pl-4">
              {t('app.subtitle', lang)} · {t('stats.live', lang)}
            </p>
          </div>
          {controls}
        </div>

        <div className="flex items-center justify-around py-3 rounded-xl bg-surface-hover/60 border border-border/40">
          <Stat value={stats.total} label={t('stats.active', lang)} color="var(--danger)" />
          <div className="w-px h-8 bg-border" />
          <Stat value={stats.governorates_affected} label={t('stats.zones', lang)} color="var(--secondary)" />
        </div>

        {(peak || govFilter) && (
          <div className="flex flex-wrap gap-1.5">
            {peak && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-warning/15 text-secondary border border-warning/25">
                {t('peak.badge', lang)}
              </span>
            )}
            {govFilter && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                {govFilter}
              </span>
            )}
          </div>
        )}

        {lastUpdated && (
          <p className="text-[10px] text-text-muted">
            {Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 60000))}
            {t('stats.min.ago', lang)}
          </p>
        )}
      </header>
    )
  }

  return (
    <header className={`shrink-0 flex items-center gap-3 px-3 py-2 border-b border-border/50 bg-surface z-10 ${className}`}>
      <motion.span
        className="w-2 h-2 rounded-full bg-danger shrink-0"
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-bold text-text truncate">{t('app.title', lang)}</h1>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold tabular-nums">
          <span className="text-danger">{stats.total}</span>
          <span className="text-text-muted">·</span>
          <span className="text-secondary">{stats.governorates_affected}</span>
        </div>
        {controls}
      </div>
    </header>
  )
}

export default memo(LiveStatsHeaderInner)
