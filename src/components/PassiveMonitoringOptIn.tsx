'use client'

import { memo, useEffect, useState } from 'react'
import { Radio, X } from 'lucide-react'
import {
  isPassiveMonitoringEnabled,
  setPassiveMonitoringEnabled,
} from '@/lib/deviceId'
import { useLang } from '@/lib/LangProvider'
import { t } from '@/lib/i18n'

interface Props {
  onEnabledChange?: (enabled: boolean) => void
}

function PassiveMonitoringOptInInner({ onEnabledChange }: Props) {
  const { lang } = useLang()
  const [visible, setVisible] = useState(false)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const optIn = isPassiveMonitoringEnabled()
    setEnabled(optIn)
    if (!optIn) {
      const dismissed = sessionStorage.getItem('steg_passive_dismissed')
      if (!dismissed) setVisible(true)
    }
  }, [])

  function accept() {
    setPassiveMonitoringEnabled(true)
    setEnabled(true)
    setVisible(false)
    onEnabledChange?.(true)
  }

  function dismiss() {
    sessionStorage.setItem('steg_passive_dismissed', '1')
    setVisible(false)
  }

  if (!visible || enabled) return null

  return (
    <div className="absolute bottom-20 left-3 right-3 lg:left-auto lg:right-4 lg:bottom-4 lg:max-w-xs z-1001 pointer-events-auto">
      <div className="bg-surface border border-border/50 rounded-2xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text">{t('passive.title', lang)}</p>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              {t('passive.desc', lang)}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={accept}
                className="flex-1 text-xs font-semibold bg-primary text-white py-2 px-3 rounded-lg"
              >
                {t('passive.enable', lang)}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="text-xs text-text-muted py-2 px-2"
              >
                {t('passive.later', lang)}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-text-muted hover:text-text shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(PassiveMonitoringOptInInner)
