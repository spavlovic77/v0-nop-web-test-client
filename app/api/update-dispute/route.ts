import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const clientIP = getClientIp(request)
  const rateLimitResult = rateLimit("/api/update-dispute", clientIP, 2, 60000)

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
    const { transactionId } = await request.json()

    console.log("[v0] Update dispute request received for transaction:", transactionId)

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
      console.log("[v0] Transaction not found:", transactionId)
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    console.log("[v0] Dispute flag updated successfully for:", transactionId)
    return NextResponse.json({ success: true, data: data[0] })
  } catch (error: any) {
    console.error("[v0] Error in update-dispute:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
