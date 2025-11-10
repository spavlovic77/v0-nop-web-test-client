import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export const runtime = "nodejs"
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
    const { date, pokladnica } = await request.json()

    if (!date || !pokladnica) {
      return NextResponse.json({ error: "Date and pokladnica are required" }, { status: 400 })
    }

    console.log("[v0] === TRANSACTION FETCH DEBUG ===")
    console.log("[v0] Input date:", date)
    console.log("[v0] Pokladnica:", pokladnica)

    const userDate = new Date(date)
    console.log("[v0] User date object:", userDate.toString())
    console.log("[v0] User timezone offset (minutes):", userDate.getTimezoneOffset())

    const startOfDay = new Date(userDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(userDate.setHours(23, 59, 59, 999))

    const startDate = startOfDay.toISOString()
    const endDate = endOfDay.toISOString()

    console.log("[v0] Query range (ISO):")
    console.log("[v0]   Start:", startDate)
    console.log("[v0]   End:", endDate)

    // Create Supabase client with service role key
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: allRecords, error: countError } = await supabase
      .from("mqtt_notifications")
      .select("transaction_id, payload_received_at, pokladnica")
      .eq("pokladnica", pokladnica)
      .order("payload_received_at", { ascending: false })
      .limit(10)

    console.log("[v0] Recent records in mqtt_notifications for this pokladnica:")
    if (countError) {
      console.error("[v0] Error checking records:", countError)
    } else {
      console.log("[v0] Found", allRecords?.length || 0, "recent records")
      allRecords?.forEach((record, i) => {
        console.log(`[v0]   ${i + 1}. ${record.transaction_id} - ${record.payload_received_at}`)
      })
    }

    const { data, error } = await supabase.rpc("get_transactions_by_date", {
      p_pokladnica: pokladnica,
      p_start_date: startDate,
      p_end_date: endDate,
    })

    if (error) {
      console.error("[v0] Error fetching transactions:", error)
      return NextResponse.json({ error: "Failed to fetch transactions", details: error.message }, { status: 500 })
    }

    console.log("[v0] RPC function returned:", data?.length || 0, "transactions")
    if (data && data.length > 0) {
      console.log("[v0] First transaction:", {
        id: data[0].transaction_id,
        timestamp: data[0].payload_received_at,
        amount: data[0].amount,
      })
    }
    console.log("[v0] === END DEBUG ===")

    return NextResponse.json({ transactions: data || [] })
  } catch (error) {
    console.error("[v0] Error in get-transactions-by-date:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
