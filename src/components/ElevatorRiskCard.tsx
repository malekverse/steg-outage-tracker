'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpDown, Zap } from 'lucide-react'
import { getElevatorRiskLevel, isPeakHour } from '@/lib/locationUtils'
import { useLang } from '@/lib/LangProvider'
import { t } from '@/lib/i18n'

const RISK_CONFIG = {
  low: { color: '#22c55e', pct: 25, labelKey: 'elevator.risk.low' },
  medium: { color: '#eab308', pct: 50, labelKey: 'elevator.risk.medium' },
  high: { color: '#f97316', pct: 75, labelKey: 'elevator.risk.high' },
  critical: { color: '#ef4444', pct: 95, labelKey: 'elevator.risk.critical' },
} as const

function ElevatorRiskCardInner() {
  const { lang } = useLang()
  const level = getElevatorRiskLevel()
  const config = RISK_CONFIG[level]
  const peak = isPeakHour()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-border/50 p-4"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${config.color}20` }}
        >
          {peak ? (
            <Zap className="w-5 h-5" style={{ color: config.color }} />
          ) : (
            <ArrowUpDown className="w-5 h-5" style={{ color: config.color }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {t('elevator.risk.title', lang)}
          </p>
          <p className="text-sm font-bold text-text mt-0.5">{t(config.labelKey, lang)}</p>
          <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
            {t('elevator.risk.desc', lang)}
          </p>
        </div>
      </div>

      <div className="mt-3 h-2 bg-surface-hover rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: config.color }}
          initial={{ width: 0 }}
          animate={{ width: `${config.pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {peak && (
        <p className="text-[10px] text-secondary font-medium mt-2">{t('peak.warning', lang)}</p>
      )}
    </motion.div>
  )
}

export default memo(ElevatorRiskCardInner)
