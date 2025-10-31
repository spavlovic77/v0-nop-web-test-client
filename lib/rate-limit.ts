// Rate limiting utility for API routes
// Tracks requests per IP address per route

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Map structure: route -> IP -> RateLimitEntry
const rateLimitMap = new Map<string, Map<string, RateLimitEntry>>()

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [route, ipMap] of rateLimitMap.entries()) {
      for (const [ip, entry] of ipMap.entries()) {
        if (now > entry.resetTime) {
          ipMap.delete(ip)
        }
      }
      // Remove empty route maps
      if (ipMap.size === 0) {
        rateLimitMap.delete(route)
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

export function rateLimit(route: string, ip: string, limit = 1, windowMs = 60000): RateLimitResult {
  const now = Date.now()

  // Get or create route map
  if (!rateLimitMap.has(route)) {
    rateLimitMap.set(route, new Map())
  }

  const ipMap = rateLimitMap.get(route)!
  const entry = ipMap.get(ip)

  // If no entry or expired, create new entry
  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs
    ipMap.set(ip, { count: 1, resetTime })

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
  ipMap.set(ip, entry)

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetTime,
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return "unknown"
}
