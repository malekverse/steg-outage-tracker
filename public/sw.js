/* Production service worker — relays heartbeat pings when page posts messages. */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

let heartbeatTimer = null

self.addEventListener('message', event => {
  const data = event.data
  if (!data || typeof data !== 'object') return

  if (data.type === 'START_HEARTBEAT') {
    const intervalMs = Math.max(data.intervalMs || 300000, 240000)
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    heartbeatTimer = setInterval(() => {
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        for (const client of clients) {
          client.postMessage({ type: 'TRIGGER_HEARTBEAT' })
        }
      })
    }, intervalMs)
  }

  if (data.type === 'STOP_HEARTBEAT' && heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }

  if (data.type === 'HEARTBEAT_PAYLOAD' && data.payload) {
    fetch('/api/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.payload),
    }).catch(() => {})
  }
})
