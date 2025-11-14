// Rate limiting utility for API routes
// Tracks requests per IP address per route

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// In-memory store for rate limiting (per route)
// Key format: "route:ip" (e.g., "/api/generate-transaction:192.168.1.1")
const rateLimitMap = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(key)
      }
    }
  },
  5 * 60 * 1000,
)

/**
 * Rate limiter function
 * @param route - The API route path (e.g., "/api/generate-transaction")
 * @param ip - Client IP address
 * @param limit - Maximum number of requests allowed per window (default: 10)
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns RateLimitResult with success status and metadata
 */
export function rateLimit(route: string, ip: string, limit = 100, windowMs = 60000): RateLimitResult {
  const now = Date.now()
  const key = `${route}:${ip}`

  // Get existing entry for this route:ip combination
  const entry = rateLimitMap.get(key)

  // If no entry exists or the window has expired, create a new entry
  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs
    rateLimitMap.set(key, { count: 0, resetTime })
  }

  // Get the current entry (either existing or just created)
  const currentEntry = rateLimitMap.get(key)!

  // Check if limit is exceeded
  if (currentEntry.count >= limit) {
    const resetInSeconds = Math.ceil((currentEntry.resetTime - now) / 1000)
    return {
      success: false,
      limit,
      remaining: 0,
      reset: currentEntry.resetTime,
    }
  }

  // Increment the count
  currentEntry.count++
  rateLimitMap.set(key, currentEntry)

  return {
    success: true,
    limit,
    remaining: limit - currentEntry.count,
    reset: currentEntry.resetTime,
  }
}

/**
 * Extract client IP from Next.js request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIp) {
    return realIp.trim()
  }

  return "unknown"
}
