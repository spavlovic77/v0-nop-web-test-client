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

  // If no entry or expired, create new entry
  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs
    rateLimitMap.set(ip, { count: 1, resetTime })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: resetTime,
    }
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.resetTime,
    }
  }

  // Increment count
  entry.count++
  rateLimitMap.set(ip, entry)

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetTime,
  }
}

export function getClientIp(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnectingIp = request.headers.get("cf-connecting-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  if (realIp) {
    return realIp
  }
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return "unknown"
}
