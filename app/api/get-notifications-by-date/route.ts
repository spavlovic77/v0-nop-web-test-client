import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const clientIP = getClientIp(request)
  const rateLimitResult = rateLimit("/api/get-notifications-by-date", clientIP, 2, 60000)

  if (!rateLimitResult.success) {
    const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
    return NextResponse.json(
      {
        error: "Too many requests",
        message: "Please try again later",
        retryAfter,
        resetTime: new Date(rateLimitResult.reset).toISOString(),
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": new Date(rateLimitResult.reset).toISOString(),
        },
      },
    )
  }

  try {
    const body = await request.json()
    const { date, pokladnica, timezoneOffset, end_point } = body

    console.log("[v0] Request received:", { date, pokladnica, timezoneOffset, end_point })

    if (!date || !pokladnica || !end_point) {
      return NextResponse.json({ error: "Date, pokladnica, and end_point are required" }, { status: 400 })
    }

    if (end_point !== 'PRODUCTION' && end_point !== 'TEST') {
      return NextResponse.json({ error: "end_point must be either 'PRODUCTION' or 'TEST'" }, { status: 400 })
    }

    const [year, month, day] = date.split("-").map(Number)

    const offsetMs = (timezoneOffset || 0) * 60 * 1000
    const userMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))

    const startOfDayUTC = new Date(userMidnight.getTime() + offsetMs)
    const endOfDayUTC = new Date(startOfDayUTC.getTime() + 24 * 60 * 60 * 1000 - 1)

    const startDate = startOfDayUTC.toISOString()
    const endDate = endOfDayUTC.toISOString()

    console.log("[v0] Querying range:", { startDate, endDate, pokladnica, end_point })

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data, error } = await supabase.rpc("get_notifications_by_date", {
      p_pokladnica: pokladnica,
      p_start_date: startDate,
      p_end_date: endDate,
      p_end_point: end_point,
    })

    if (error) {
      console.error("[v0] RPC error:", error)
      return NextResponse.json({ error: "Failed to fetch notifications", details: error.message }, { status: 500 })
    }

    console.log("[v0] Found notifications:", data?.length || 0)

    return NextResponse.json({ notifications: data || [] })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
