'use client'

import { useEffect } from 'react'

/** Dev: remove legacy SWs. Prod: register heartbeat service worker. */
export default function SwCleanup() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations().then(regs => {
        for (const reg of regs) void reg.unregister()
      })
      if ('caches' in window) {
        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      }
      return
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])

  return null
}
