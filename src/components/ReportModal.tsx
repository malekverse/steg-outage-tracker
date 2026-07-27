'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Home, Zap, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import {
  tunisianGovernorates,
  reverseGeocodeLocation,
  detectLocationFromCoords,
  searchLocations,
  getDelegations,
  getLocationCoordinates,
} from '@/lib/locationUtils'
import { useOutages } from '@/lib/useOutages'
import { useLang } from '@/lib/LangProvider'
import { t } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'
import { getDeviceId } from '@/lib/deviceId'

interface Props {
  onClose: () => void
  onSubmitted: () => void
}

type Step = 'choice' | 'details' | 'confirm' | 'submitting' | 'done'

const LANG_SELECT_LABEL: Record<Lang, string> = {
  fr: 'Sélectionner',
  ar: 'اختيار',
  en: 'Select',
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
}

export default function ReportModal({ onClose, onSubmitted }: Props) {
  const [step, setStep] = useState<Step>('choice')
  const [direction, setDirection] = useState(1)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [governorate, setGovernorate] = useState('')
  const [delegation, setDelegation] = useState('')
  const [error, setError] = useState('')
  const [locError, setLocError] = useState('')
  const [locating, setLocating] = useState(false)
  const [usedGps, setUsedGps] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')
  const { lang, dir } = useLang()
  const { setGovFilter, refresh, flyToLocation } = useOutages()

  const locationResults = useMemo(() => searchLocations(locationSearch, 8), [locationSearch])
  const filteredDelegations = useMemo(() => {
    if (!governorate) return []
    const all = getDelegations(governorate)
    const q = locationSearch.trim().toLowerCase()
    if (!q || governorate.toLowerCase().includes(q)) return all
    return all.filter(d => d.toLowerCase().includes(q))
  }, [governorate, locationSearch])

  function goTo(next: Step, dir = 1) {
    setDirection(dir)
    setStep(next)
  }

  useEffect(() => {
    if (step === 'done') {
      const timer = setTimeout(onSubmitted, 2200)
      return () => clearTimeout(timer)
    }
  }, [step, onSubmitted])

  function updateCoordsFromSelection(gov: string, deleg?: string) {
    if (usedGps && latitude && longitude) return
    const coords = getLocationCoordinates(gov, deleg)
    if (coords) {
      setLatitude(coords.lat)
      setLongitude(coords.lng)
    }
  }

  function getLocation() {
    setLocError('')
    setLocating(true)
    if (!navigator.geolocation) {
      setLocError(t('report.loc.error', lang))
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setLatitude(lat)
        setLongitude(lng)
        setUsedGps(true)
        setError('')

        // Use accurate reverse geocoding (Nominatim), falls back to offline
        const detected = await reverseGeocodeLocation(lat, lng)
          ?? detectLocationFromCoords(lat, lng)

        setLocating(false)
        if (detected) {
          setGovernorate(detected.governorate)
          if (detected.delegation) setDelegation(detected.delegation)
          goTo('confirm')
        } else {
          goTo('details')
        }
      },
      () => {
        setLocError(t('report.loc.error', lang))
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function submitReport() {
    if (!governorate) {
      setError(t('report.fill', lang))
      return
    }

    // Ensure we have coordinates
    let lat = latitude
    let lng = longitude
    if (!lat || !lng) {
      const coords = getLocationCoordinates(governorate, delegation)
      if (coords) {
        lat = coords.lat
        lng = coords.lng
        setLatitude(lat)
        setLongitude(lng)
      } else {
        setError(t('report.fill', lang))
        return
      }
    }

    goTo('submitting')
    setError('')

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat.toString(),
          longitude: lng.toString(),
          governorate,
          delegation,
          source: 'USER',
          device_id: getDeviceId() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Submission failed')
      }
      navigator.vibrate?.(50)

      // Clear any active filter so the new dot is visible
      setGovFilter(null)
      // Refresh data to include the new report
      refresh()
      // Fly the map to the reported location so user sees their dot
      if (lat && lng) flyToLocation(lat, lng, 12)

      goTo('done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      goTo('details', -1)
    }
  }

  return (
    <div className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center" dir={dir}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={step !== 'submitting' && step !== 'done' ? onClose : undefined}
      />

      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        {step !== 'done' && step !== 'submitting' && (
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <div className="flex items-center gap-2">
              {[1, 2].map(n => (
                <div
                  key={n}
                  className={`h-1 rounded-full transition-all ${(step === 'choice' && n === 1) || (step !== 'choice' && n <= 2) ? 'w-8 bg-primary' : 'w-4 bg-border'}`}
                />
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-hover hover:bg-border text-text-secondary transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          {step === 'choice' && (
            <motion.div
              key="choice"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="px-6 pb-6 space-y-3"
            >
              <h2 className="text-lg font-bold text-text mb-1">{t('report.title', lang)}</h2>
              <p className="text-sm text-text-secondary mb-1">{t('report.step1', lang)}</p>
              <button
                onClick={getLocation}
                disabled={locating}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-primary/5 hover:bg-primary/10 border-2 border-primary/20 hover:border-primary/40 transition-all group disabled:opacity-60"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {locating ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <MapPin className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-text">
                    {locating ? t('report.locating', lang) : t('report.gps', lang)}
                  </div>
                  <div className="text-xs text-text-secondary">{t('report.gps.desc', lang)}</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setUsedGps(false)
                  setLatitude(null)
                  setLongitude(null)
                  setGovernorate('')
                  setDelegation('')
                  goTo('details')
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-text-muted transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Home className="w-6 h-6 text-text-muted" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-text">{t('report.manual', lang)}</div>
                  <div className="text-xs text-text-secondary">{t('report.manual.desc', lang)}</div>
                </div>
              </button>
              {locError && (
                <div className="flex items-center gap-2 text-xs text-danger bg-danger-light/50 px-4 py-2.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {locError}
                </div>
              )}
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div
              key="details"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="px-6 pb-6 space-y-4"
            >
              <h2 className="text-lg font-bold text-text">{t('report.select.gov', lang)}</h2>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  {t('search.placeholder', lang)}
                </label>
                <input
                  type="text"
                  value={locationSearch}
                  onChange={e => setLocationSearch(e.target.value)}
                  placeholder={t('search.placeholder', lang)}
                  className="w-full bg-surface-hover border-2 border-border focus:border-primary rounded-xl px-4 py-3 text-sm text-text outline-none transition-colors"
                />
                {locationSearch && locationResults.length > 0 && (
                  <div className="mt-1 border border-border/50 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
                    {locationResults.map(r => (
                      <button
                        key={`${r.type}-${r.label}`}
                        type="button"
                        onClick={() => {
                          setGovernorate(r.governorate)
                          setDelegation(r.delegation ?? '')
                          setLocationSearch(r.label)
                          updateCoordsFromSelection(r.governorate, r.delegation)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover text-text"
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  {t('report.select.gov', lang)}
                </label>
                <select
                  value={governorate}
                  onChange={e => {
                    const g = e.target.value
                    setGovernorate(g)
                    setDelegation('')
                    updateCoordsFromSelection(g)
                  }}
                  className="w-full bg-surface-hover border-2 border-border focus:border-primary rounded-xl px-4 py-3 text-sm font-medium text-text outline-none transition-colors appearance-none"
                >
                  <option value="">{LANG_SELECT_LABEL[lang]}...</option>
                  {tunisianGovernorates.map(g => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {governorate && filteredDelegations.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    {t('report.select.deleg', lang)}
                  </label>
                  <select
                    value={delegation}
                    onChange={e => {
                      const d = e.target.value
                      setDelegation(d)
                      updateCoordsFromSelection(governorate, d)
                    }}
                    className="w-full bg-surface-hover border-2 border-border focus:border-primary rounded-xl px-4 py-3 text-sm font-medium text-text outline-none transition-colors appearance-none"
                  >
                    <option value="">{LANG_SELECT_LABEL[lang]}...</option>
                    {filteredDelegations.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {latitude && longitude && (
                <div className="flex items-center gap-2 text-xs text-text-secondary bg-surface-hover rounded-xl px-4 py-2.5">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-mono">
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-xs text-danger bg-danger-light/50 px-4 py-2.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={() => {
                  if (!governorate) {
                    setError(t('report.fill', lang))
                    return
                  }
                  if (!latitude || !longitude) {
                    updateCoordsFromSelection(governorate, delegation)
                  }
                  goTo('confirm')
                }}
                disabled={!governorate}
                className="w-full bg-surface-hover hover:bg-border disabled:opacity-40 text-text font-semibold py-3 rounded-xl transition-all"
              >
                {t('report.next', lang)}
              </button>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div
              key="confirm"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="px-6 pb-6 space-y-4"
            >
              <h2 className="text-lg font-bold text-text">{t('report.confirm.title', lang)}</h2>
              {usedGps && (
                <p className="text-xs text-text-secondary flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  {t('report.gps.detected', lang)}
                </p>
              )}
              <div className="glass rounded-2xl p-4 space-y-2 text-sm">
                <p>
                  <span className="text-text-secondary">{t('report.select.gov', lang)}:</span>{' '}
                  <strong className="text-text">{governorate}</strong>
                </p>
                {usedGps && governorate && getDelegations(governorate).length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                      {t('report.deleg.optional', lang)}
                    </label>
                    <select
                      value={delegation}
                      onChange={e => setDelegation(e.target.value)}
                      className="w-full bg-surface-hover border-2 border-border focus:border-primary rounded-xl px-4 py-2.5 text-sm font-medium text-text outline-none transition-colors appearance-none"
                    >
                      <option value="">{LANG_SELECT_LABEL[lang]}...</option>
                      {getDelegations(governorate).map(d => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {!usedGps && delegation && (
                  <p>
                    <span className="text-text-secondary">{t('report.select.deleg', lang)}:</span>{' '}
                    <strong className="text-text">{delegation}</strong>
                  </p>
                )}
                {latitude && longitude && (
                  <p className="font-mono text-xs text-text-muted">
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </p>
                )}
              </div>
              {usedGps && (
                <button
                  type="button"
                  onClick={() => goTo('details', -1)}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  {t('report.change.gov', lang)}
                </button>
              )}
              <button
                onClick={submitReport}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                {t('report.submit', lang)}
              </button>
              <button
                onClick={() => goTo(usedGps ? 'choice' : 'details', -1)}
                className="w-full text-text-secondary text-sm py-2"
              >
                {t('report.back', lang)}
              </button>
            </motion.div>
          )}

          {step === 'submitting' && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-6 py-12 text-center"
            >
              <Loader2 className="w-14 h-14 mx-auto mb-4 text-primary animate-spin" />
              <p className="font-semibold text-text">{t('report.submitting', lang)}</p>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-6 py-12 text-center"
            >
              <CheckCircle2 className="w-20 h-20 mx-auto mb-4 text-success" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-text mb-1">{t('report.success.title', lang)}</h3>
              <p className="text-sm text-text-secondary">{t('report.success.desc', lang)}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
