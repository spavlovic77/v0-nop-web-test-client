import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const clientIP = getClientIp(request)
  const rateLimitResult = rateLimit("/api/get-transactions-by-date", clientIP, 2, 60000)

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
    const { date, pokladnica, timezoneOffset } = body

    console.log("[v0] Request received:", { date, pokladnica, timezoneOffset })

    if (!date || !pokladnica) {
      return NextResponse.json({ error: "Date and pokladnica are required" }, { status: 400 })
    }

    // timezoneOffset is in minutes (e.g., -60 for CET which is UTC+1)
    // We need to convert the date string to UTC timestamps that represent
    // the start and end of the day in the user's local timezone

    const [year, month, day] = date.split("-").map(Number)

    // Create date in UTC representing the user's local midnight
    // If user is in CET (UTC+1, offset=-60), and selects 2025-11-11,
    // we want 2025-11-10T23:00:00.000Z (which is 2025-11-11 00:00 CET)
    const offsetMs = (timezoneOffset || 0) * 60 * 1000
    const userMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))

    // Adjust for timezone: subtract offset to get UTC time of user's midnight
    const startOfDayUTC = new Date(userMidnight.getTime() - offsetMs)
    const endOfDayUTC = new Date(startOfDayUTC.getTime() + 24 * 60 * 60 * 1000 - 1)

    const startDate = startOfDayUTC.toISOString()
    const endDate = endOfDayUTC.toISOString()

    console.log("[v0] Querying range:", { startDate, endDate, pokladnica })

    // Create Supabase client
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Query using RPC function
    const { data, error } = await supabase.rpc("get_transactions_by_date", {
      p_pokladnica: pokladnica,
      p_start_date: startDate,
      p_end_date: endDate,
    })

    if (error) {
      console.error("[v0] RPC error:", error)
      return NextResponse.json({ error: "Failed to fetch transactions", details: error.message }, { status: 500 })
    }

    console.log("[v0] Found transactions:", data?.length || 0)

    return NextResponse.json({ transactions: data || [] })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
