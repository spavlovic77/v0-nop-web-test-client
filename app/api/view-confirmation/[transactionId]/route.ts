import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export async function GET(request: NextRequest, { params }: { params: { transactionId: string } }) {
  try {
    const clientIP = getClientIp(request)
    const rateLimitResult = rateLimit("/api/view-confirmation", clientIP)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: "Please try again later",
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
          resetTime: new Date(rateLimitResult.reset).toISOString(),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
          },
        },
      )
    }

    const transactionId = params.transactionId

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 })
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data, error } = await supabase.rpc("get_transaction_by_id", {
      p_transaction_id: transactionId,
    })

    if (error) {
      console.error("[v0] Error fetching transaction:", error)
      return NextResponse.json({ error: "Failed to fetch transaction", details: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: data[0] })
  } catch (error: any) {
    console.error("[v0] Error in view-confirmation:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
