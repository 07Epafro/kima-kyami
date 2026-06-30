// NOTE: On Vercel serverless each instance runs its own Map — this is per-instance
// rate limiting only. For distributed limiting across instances, use Upstash Redis.

const store = new Map<string, { count: number; reset: number }>()

export function rateLimit(ip: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.reset) {
    store.set(ip, { count: 1, reset: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}
