import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
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
