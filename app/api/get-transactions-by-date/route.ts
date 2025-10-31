import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

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
    const { date, pokladnica } = await request.json()

    if (!date || !pokladnica) {
      return NextResponse.json({ error: "Date and pokladnica are required" }, { status: 400 })
    }

    // Create Supabase client with service role key
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // User selects "2025-10-31" in Bratislava (UTC+1/+2)
    // We need to query for transactions that occurred on that calendar day in their timezone
    const userDate = new Date(date)
    const startOfDay = new Date(userDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(userDate.setHours(23, 59, 59, 999))

    const startDate = startOfDay.toISOString()
    const endDate = endOfDay.toISOString()

    console.log("[v0] Querying transactions for date:", date)
    console.log("[v0] UTC range:", startDate, "to", endDate)

    const { data, error } = await supabase.rpc("get_transactions_by_date", {
      p_pokladnica: pokladnica,
      p_start_date: startDate,
      p_end_date: endDate,
    })

    if (error) {
      console.error("[v0] Error fetching transactions:", error)
      return NextResponse.json({ error: "Failed to fetch transactions", details: error.message }, { status: 500 })
    }

    console.log("[v0] Found transactions:", data?.length || 0)

    return NextResponse.json({ transactions: data || [] })
  } catch (error) {
    console.error("[v0] Error in get-transactions-by-date:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
