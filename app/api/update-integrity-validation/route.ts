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
    const { transactionId, isValid } = await request.json()

    if (!transactionId || typeof isValid !== "boolean") {
      return NextResponse.json({ error: "Missing required parameters: transactionId and isValid" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from("mqtt_notifications")
      .update({ integrity_validation: isValid })
      .eq("transaction_id", transactionId)
      .select()

    if (error) {
      console.error("[v0] Failed to update integrity validation:", error)
      return NextResponse.json(
        { error: "Failed to update integrity validation", details: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Update integrity validation error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
