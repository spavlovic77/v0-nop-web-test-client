// Rate limiting utility using in-memory storage
// Tracks requests per IP address with 1 minute window

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [ip, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(ip)
        console.log(`[v0] 🧹 Cleaned up expired entry for IP: ${ip}`)
      }
    }
  },
  5 * 60 * 1000,
)

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export function rateLimit(ip: string, limit = 1, windowMs = 60000): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  console.log(`[v0] 🔍 Rate limit check for IP: ${ip}`)
  console.log(`[v0] 🔍 Limit: ${limit}, Window: ${windowMs}ms`)
  console.log(
    `[v0] 🔍 Current entry:`,
    entry ? `count=${entry.count}, resetTime=${new Date(entry.resetTime).toISOString()}` : "none",
  )

  // If no entry or expired, create new entry
  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs
    rateLimitMap.set(ip, { count: 0, resetTime })
    console.log(`[v0] ✅ First request or expired - Creating new entry`)
    console.log(`[v0] ✅ Reset time: ${new Date(resetTime).toISOString()}`)
  }

  // Get the current entry (either existing or just created)
  const currentEntry = rateLimitMap.get(ip)!

  if (currentEntry.count >= limit) {
    console.log(`[v0] ❌ Rate limit exceeded! Count: ${currentEntry.count}, Limit: ${limit}`)
    const retryAfter = Math.ceil((currentEntry.resetTime - now) / 1000)
    console.log(`[v0] ❌ Retry after: ${retryAfter} seconds`)
    return {
      success: false,
      limit,
      remaining: 0,
      reset: currentEntry.resetTime,
    }
  }

  currentEntry.count++
  rateLimitMap.set(ip, currentEntry)

  const remaining = limit - currentEntry.count
  console.log(`[v0] ✅ Request allowed - Count: ${currentEntry.count}/${limit}`)
  console.log(`[v0] ✅ Remaining requests: ${remaining}`)

  return {
    success: true,
    limit,
    remaining,
    reset: currentEntry.resetTime,
  }
}

export function getClientIp(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnectingIp = request.headers.get("cf-connecting-ip")

  const ip = forwarded?.split(",")[0].trim() || realIp || cfConnectingIp || "unknown"
  console.log(`[v0] 🌐 Extracted IP: ${ip}`)

  return ip
}
