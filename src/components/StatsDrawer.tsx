'use client'

import { useEffect, useState, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  BarChart3,
  MapPin,
  Clock,
  Zap,
  Radio,
  Globe,
  TrendingUp,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useLang } from '@/lib/LangProvider'
import { useOutages } from '@/lib/useOutages'
import { tunisianGovernorates } from '@/lib/locationUtils'
import { t } from '@/lib/i18n'

interface GovStat {
  name: string
  count: number
  pct: number
}
interface RecentReport {
  id: string
  governorate: string
  delegation: string
  source: string
  created_at: string
}
interface HourBucket {
  hour: string
  count: number
  pct: number
}

interface StatsDrawerProps {
  open: boolean
  onClose: () => void
}

const SRC_META: Record<string, { color: string; icon: typeof Zap }> = {
  USER: { color: '#ef4444', icon: Zap },
  BOT: { color: '#f59e0b', icon: Radio },
  SCRAPER: { color: '#3b82f6', icon: Globe },
  SIGNAL: { color: '#8b5cf6', icon: TrendingUp },
}

function barColor(count: number): string {
  if (count >= 5) return '#ef4444'
  if (count >= 2) return '#f97316'
  return '#eab308'
}

function agoLabel(d: string, lang: string): string {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return lang === 'ar' ? 'الآن' : lang === 'fr' ? 'à l\'instant' : 'just now'
  if (m < 60) return `${m}${t('stats.min.ago', lang as 'fr' | 'ar' | 'en')}`
  const h = Math.floor(m / 60)
  return `${h}h`
}

function SummaryCard({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string
  value: number
  accent: string
  icon: typeof BarChart3
}) {
  return (
    <div className="flex-1 min-w-0 rounded-xl bg-surface-hover/70 border border-border/40 p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}18` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </div>
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide truncate">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: accent }}>
        {value}
      </p>
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof BarChart3
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border/40 bg-surface-hover/30 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
        <Icon className="w-4 h-4 text-text-muted shrink-0" />
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {title}
        </h4>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function StatsDrawerInner({ open, onClose }: StatsDrawerProps) {
  const [govStats, setGovStats] = useState<GovStat[]>([])
  const [recent, setRecent] = useState<RecentReport[]>([])
  const [timeline, setTimeline] = useState<HourBucket[]>([])
  const [sources, setSources] = useState<
    { name: string; count: number; pct: number; color: string }[]
  >([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const { lang } = useLang()
  const { stats } = useOutages()

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mq.matches)
    const fn = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const since = new Date(Date.now() - 86400000).toISOString()

      const { data: reports } = await supabase
        .from('outage_reports')
        .select('id, governorate, delegation, source, created_at')
        .eq('status', 'OFF')
        .gte('created_at', since)
        .order('created_at', { ascending: false })

      if (!reports) return

      setTotal(reports.length)

      const govMap = new Map<string, number>()
      for (const r of reports) govMap.set(r.governorate, (govMap.get(r.governorate) || 0) + 1)
      const max = Math.max(...govMap.values(), 1)
      const govList: GovStat[] = tunisianGovernorates
        .map(name => ({
          name,
          count: govMap.get(name) || 0,
          pct: ((govMap.get(name) || 0) / max) * 100,
        }))
        .filter(s => s.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
      setGovStats(govList)

      const buckets = new Map<string, number>()
      const now = Date.now()
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now - i * 3600000)
        buckets.set(`${d.getHours()}`, 0)
      }
      for (const r of reports) {
        const key = `${new Date(r.created_at).getHours()}`
        if (buckets.has(key)) buckets.set(key, buckets.get(key)! + 1)
      }
      const maxTimeline = Math.max(...buckets.values(), 1)
      setTimeline(
        Array.from(buckets.entries()).map(([hour, count]) => ({
          hour: `${hour}h`,
          count,
          pct: (count / maxTimeline) * 100,
        })),
      )

      const srcMap = new Map<string, number>()
      for (const r of reports) srcMap.set(r.source, (srcMap.get(r.source) || 0) + 1)
      const srcMax = Math.max(...srcMap.values(), 1)
      setSources(
        Array.from(srcMap.entries())
          .map(([name, count]) => ({
            name,
            count,
            pct: (count / srcMax) * 100,
            color: SRC_META[name]?.color ?? '#94a3b8',
          }))
          .sort((a, b) => b.count - a.count),
      )

      setRecent(reports.slice(0, 8))
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) fetchStats()
  }, [open, fetchStats])

  const hasData = govStats.length > 0 || recent.length > 0
  const peakHour = timeline.reduce(
    (best, b) => (b.count > best.count ? b : best),
    { hour: '—', count: 0, pct: 0 },
  )

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9998 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Mobile: bottom sheet · Desktop: right panel */}
      <motion.div
        initial={false}
        animate={{
          y: isDesktop ? 0 : open ? 0 : '100%',
          x: isDesktop ? (open ? 0 : '100%') : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{ type: 'spring', damping: 32, stiffness: 340 }}
        className="fixed z-9999 bg-surface shadow-2xl overflow-hidden pointer-events-none
          bottom-0 left-0 right-0 max-h-[88vh] rounded-t-3xl
          lg:bottom-0 lg:top-0 lg:left-auto lg:right-0 lg:w-105 lg:max-h-none lg:rounded-none lg:rounded-l-3xl lg:border-l lg:border-border/50"
        style={{ pointerEvents: open ? 'auto' : 'none' }}
      >
        {/* Drag handle (mobile) */}
        <div className="lg:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-surface/95 backdrop-blur-md z-10 px-5 pt-3 lg:pt-5 pb-4 border-b border-border/40">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary shrink-0" />
                <h3 className="text-lg font-bold text-text">{t('stats.title', lang)}</h3>
              </div>
              <p className="text-xs text-text-muted mt-1">{t('stats.period', lang)}</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center text-text-muted hover:text-text hover:bg-border/60 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Summary cards */}
          <div className="flex gap-2 mt-4">
            <SummaryCard
              label={t('stats.total', lang)}
              value={total || stats.total}
              accent="var(--danger)"
              icon={Zap}
            />
            <SummaryCard
              label={t('stats.zones', lang)}
              value={govStats.length || stats.governorates_affected}
              accent="var(--secondary)"
              icon={MapPin}
            />
            <SummaryCard
              label={t('stats.peak', lang)}
              value={peakHour.count}
              accent="#8b5cf6"
              icon={Clock}
            />
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 pb-safe lg:pb-8 max-h-[calc(88vh-200px)] lg:max-h-[calc(100vh-200px)] space-y-4">
          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-28 rounded-2xl bg-surface-hover" />
              <div className="h-24 rounded-2xl bg-surface-hover" />
              <div className="h-40 rounded-2xl bg-surface-hover" />
            </div>
          )}

          {!loading && timeline.some(b => b.count > 0) && (
            <SectionCard title={t('stats.timeline', lang)} icon={BarChart3}>
              <div className="flex items-end gap-0.75 h-24 mb-1">
                {timeline.map((b, i) => (
                  <div
                    key={`${b.hour}-${i}`}
                    className="flex-1 flex flex-col items-center justify-end h-full group"
                    title={`${b.hour}: ${b.count}`}
                  >
                    <div
                      className="w-full rounded-sm transition-all duration-500 min-h-0.5 group-hover:opacity-80"
                      style={{
                        height: `${Math.max(b.pct, b.count > 0 ? 12 : 4)}%`,
                        backgroundColor: barColor(b.count),
                        opacity: b.count > 0 ? 1 : 0.15,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-text-muted mt-2 px-0.5">
                <span>{timeline[0]?.hour}</span>
                <span>{timeline[Math.floor(timeline.length / 2)]?.hour}</span>
                <span>{timeline[timeline.length - 1]?.hour}</span>
              </div>
            </SectionCard>
          )}

          {!loading && sources.length > 0 && (
            <SectionCard title={t('stats.sources', lang)} icon={Radio}>
              <div className="space-y-2.5">
                {sources.map(s => {
                  const meta = SRC_META[s.name]
                  const Icon = meta?.icon ?? Zap
                  return (
                    <div key={s.name} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${s.color}18` }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text">{s.name}</span>
                          <span className="text-sm font-bold tabular-nums text-text">{s.count}</span>
                        </div>
                        <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          )}

          {!loading && govStats.length > 0 && (
            <SectionCard title={t('stats.ranking', lang)} icon={MapPin}>
              <div className="space-y-2">
                {govStats.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2.5">
                    <span
                      className={`w-5 text-[11px] font-bold tabular-nums shrink-0 ${
                        i < 3 ? 'text-primary' : 'text-text-muted'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm text-text w-22 sm:w-24 truncate shrink-0">
                      {s.name}
                    </span>
                    <div className="flex-1 h-2 bg-surface-hover rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${s.pct}%`, backgroundColor: barColor(s.count) }}
                      />
                    </div>
                    <span className="text-sm font-semibold tabular-nums w-7 text-right shrink-0">
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {!loading && recent.length > 0 && (
            <SectionCard title={t('stats.recent', lang)} icon={Clock}>
              <div className="space-y-2">
                {recent.map(r => {
                  const meta = SRC_META[r.source]
                  const Icon = meta?.icon ?? Zap
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-hover/60 border border-border/30"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${meta?.color ?? '#94a3b8'}18` }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: meta?.color ?? '#94a3b8' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text truncate">
                          {r.governorate}
                          {r.delegation ? (
                            <span className="font-normal text-text-secondary">
                              {' · '}
                              {r.delegation}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          {r.source} · {agoLabel(r.created_at, lang)}
                        </p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-danger shrink-0 animate-pulse" />
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          )}

          {!loading && !hasData && open && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
                <BarChart3 className="w-7 h-7 text-text-muted/50" />
              </div>
              <p className="text-sm font-medium text-text-secondary">{t('stats.empty', lang)}</p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

export default memo(StatsDrawerInner)
