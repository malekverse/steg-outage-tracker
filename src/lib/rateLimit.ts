const rateMap = new Map<string, number[]>()

const CLEANUP_INTERVAL = 60000
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of rateMap.entries()) {
    const recent = timestamps.filter(t => now - t < 60000)
    if (recent.length === 0) rateMap.delete(key)
    else rateMap.set(key, recent)
  }
}, CLEANUP_INTERVAL)

export function rateLimit(
  ip: string,
  maxRequests = 20,
  windowMs = 60000,
): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now()
  const timestamps = rateMap.get(ip) || []
  const recent = timestamps.filter(t => now - t < windowMs)
  const remaining = Math.max(0, maxRequests - recent.length)
  const reset = recent.length > 0 ? recent[0] + windowMs : now

  if (recent.length >= maxRequests) {
    return { allowed: false, remaining: 0, reset }
  }

  recent.push(now)
  rateMap.set(ip, recent)

  return { allowed: true, remaining: remaining - 1, reset }
}
