'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback, useEffect } from 'react'
import { BarChart3, Zap } from 'lucide-react'
import ReportModal from '@/components/ReportModal'
import StatsDrawer from '@/components/StatsDrawer'
import ShareButton from '@/components/ShareButton'
import NearbyAlert from '@/components/NearbyAlert'
import GovernorateSearch from '@/components/GovernorateSearch'
import SidebarPanel from '@/components/SidebarPanel'
import LiveStatsHeader from '@/components/LiveStatsHeader'
import PassiveMonitoringOptIn from '@/components/PassiveMonitoringOptIn'
import { OutagesProvider } from '@/lib/useOutages'
import { useToast } from '@/components/Toast'
import { useLang } from '@/lib/LangProvider'
import { t } from '@/lib/i18n'
import { isPassiveMonitoringEnabled } from '@/lib/deviceId'
import { usePassiveMonitoring } from '@/lib/usePassiveMonitoring'

const OutageMap = dynamic(() => import('@/components/OutageMap'), {
  ssr: false,
})

function MainContent() {
  const [showModal, setShowModal] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [passiveEnabled, setPassiveEnabled] = useState(false)
  const { toast } = useToast()
  const { lang } = useLang()

  useEffect(() => {
    setPassiveEnabled(isPassiveMonitoringEnabled())
  }, [])

  usePassiveMonitoring(passiveEnabled)

  const handleSubmitted = useCallback(() => {
    setShowModal(false)
    toast(t('toast.submitted', lang), 'success')
    navigator.vibrate?.(30)
  }, [toast, lang])

  return (
    <>
      <main className="h-dvh w-full overflow-hidden flex flex-col lg:flex-row bg-bg">
        <aside className="hidden lg:flex flex-col gap-3 w-82.5 shrink-0 p-4 border-r border-border/50 bg-surface min-h-0">
          <LiveStatsHeader variant="sidebar" />
          <GovernorateSearch />
          <SidebarPanel />
          <div className="flex gap-2 shrink-0 pt-1">
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 px-3 rounded-xl"
            >
              <Zap className="w-4 h-4" />
              {t('report.button', lang)}
            </button>
            <button
              onClick={() => setShowStats(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-border/50 bg-surface-hover"
              aria-label="Statistics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <ShareButton compact />
          </div>
        </aside>

        <div className="flex flex-col flex-1 min-w-0 min-h-0 h-full">
          <LiveStatsHeader variant="mobile" className="lg:hidden shrink-0" />
          <div className="flex-1 min-h-0 w-full relative">
            <NearbyAlert />
            <OutageMap />
            <PassiveMonitoringOptIn onEnabledChange={setPassiveEnabled} />
          </div>
          <div className="lg:hidden shrink-0 border-t border-border/50 bg-surface p-3 pb-safe">
            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl"
              >
                <Zap className="w-4 h-4" />
                {t('report.button', lang)}
              </button>
              <button
                onClick={() => setShowStats(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-border/50 bg-surface-hover"
                aria-label="Statistics"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <ShareButton compact />
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <ReportModal onClose={() => setShowModal(false)} onSubmitted={handleSubmitted} />
      )}

      <StatsDrawer open={showStats} onClose={() => setShowStats(false)} />
    </>
  )
}

export default function Home() {
  return (
    <OutagesProvider>
      <MainContent />
    </OutagesProvider>
  )
}
