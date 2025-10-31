// Rate limiting utility using in-memory storage
// Tracks requests per IP address with 1 minute window

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

console.log("[v0] 🔄 Rate limit module loaded - clearing any stale entries")
rateLimitMap.clear()

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    let cleanedCount = 0
    for (const [ip, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(ip)
        cleanedCount++
      }
    }
    if (cleanedCount > 0) {
      console.log(`[v0] 🧹 Cleaned up ${cleanedCount} expired rate limit entries`)
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

export function clearRateLimit(ip?: string) {
  if (ip) {
    const deleted = rateLimitMap.delete(ip)
    console.log(`[v0] 🧹 Manually cleared rate limit for IP: ${ip} - ${deleted ? "success" : "not found"}`)
    return deleted
  } else {
    const size = rateLimitMap.size
    rateLimitMap.clear()
    console.log(`[v0] 🧹 Manually cleared all rate limits - ${size} entries removed`)
    return true
  }
}

export function rateLimit(ip: string, limit = 1, windowMs = 60000): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  console.log(`[v0] 🔍 Rate limit check for IP: ${ip}`)
  console.log(`[v0] 🔍 Limit: ${limit}, Window: ${windowMs}ms (${windowMs / 1000}s)`)
  console.log(`[v0] 🔍 Total entries in map: ${rateLimitMap.size}`)

  if (entry) {
    const timeUntilReset = entry.resetTime - now
    const isExpired = now > entry.resetTime
    console.log(`[v0] 🔍 Existing entry: count=${entry.count}, resetTime=${new Date(entry.resetTime).toISOString()}`)
    console.log(`[v0] 🔍 Time until reset: ${Math.ceil(timeUntilReset / 1000)}s, Expired: ${isExpired}`)
  } else {
    console.log(`[v0] 🔍 No existing entry found`)
  }

  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs
    rateLimitMap.set(ip, { count: 0, resetTime })
    console.log(`[v0] ✅ ${entry ? "Expired entry reset" : "New entry created"} - count=0`)
    console.log(`[v0] ✅ Reset time: ${new Date(resetTime).toISOString()}`)
  }

  // Get the current entry (either existing or just created)
  const currentEntry = rateLimitMap.get(ip)!

  if (currentEntry.count >= limit) {
    const retryAfter = Math.ceil((currentEntry.resetTime - now) / 1000)
    console.log(`[v0] ❌ Rate limit exceeded! Count: ${currentEntry.count}, Limit: ${limit}`)
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
  console.log(`[v0] ✅ Request allowed - Count after increment: ${currentEntry.count}/${limit}`)
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
  console.log(`[v0] 🌐 Extracted IP from headers:`)
  console.log(`[v0] 🌐   x-forwarded-for: ${forwarded || "not set"}`)
  console.log(`[v0] 🌐   x-real-ip: ${realIp || "not set"}`)
  console.log(`[v0] 🌐   cf-connecting-ip: ${cfConnectingIp || "not set"}`)
  console.log(`[v0] 🌐   Final IP: ${ip}`)

  return ip
}
