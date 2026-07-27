'use client'

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { useOutages } from '@/lib/useOutages'
import { useLang } from '@/lib/LangProvider'
import { t } from '@/lib/i18n'

function NearbyAlertInner() {
  const { nearbyCluster, loading } = useOutages()
  const [dismissed, setDismissed] = useState(false)
  const { lang } = useLang()

  const show = !loading && nearbyCluster && !dismissed

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-16 lg:top-4 left-4 right-4 z-1002 max-w-md mx-auto lg:mx-0 lg:left-auto lg:right-4"
        >
          <div className="glass-strong rounded-2xl p-4 shadow-xl border border-warning/30 bg-warning-light/10">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-warning/20 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text text-sm">
                  {t('nearby.title', lang)} — {nearbyCluster.governorate}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {nearbyCluster.distance} {t('nearby.away', lang)} · {nearbyCluster.report_count}{' '}
                  {t('map.reports', lang)}
                </p>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="w-7 h-7 rounded-full bg-surface-hover flex items-center justify-center text-text-muted hover:text-text shrink-0 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default memo(NearbyAlertInner)
