const STORAGE_KEY = 'steg_device_id'

/** Anonymous persistent device identifier for passive monitoring. */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

export const PASSIVE_OPT_IN_KEY = 'steg_passive_monitoring_opt_in'

export function isPassiveMonitoringEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(PASSIVE_OPT_IN_KEY) === 'true'
}

export function setPassiveMonitoringEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PASSIVE_OPT_IN_KEY, enabled ? 'true' : 'false')
}
