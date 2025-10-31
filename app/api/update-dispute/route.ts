import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const clientIP = getClientIp(request)
  const rateLimitResult = rateLimit(clientIP, 1, 60000)

  if (!rateLimitResult.success) {
    const resetTime = new Date(rateLimitResult.reset).toISOString()
    console.log(`[v0] ⚠️ Rate limit exceeded for IP: ${clientIP}`)
    return NextResponse.json(
      {
        error: "Too many requests",
        message: "Please try again later",
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        resetTime,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          "Retry-After": Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        },
      },
    )
  }

  try {
    const { transactionId } = await request.json()

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 })
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Update the dispute flag
    const { data, error } = await supabase
      .from("transaction_generations")
      .update({ dispute: true })
      .eq("transaction_id", transactionId)
      .select()

    if (error) {
      console.error("[v0] Error updating dispute flag:", error)
      return NextResponse.json({ error: "Failed to update dispute flag", details: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: data[0] })
  } catch (error: any) {
    console.error("[v0] Error in update-dispute:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
