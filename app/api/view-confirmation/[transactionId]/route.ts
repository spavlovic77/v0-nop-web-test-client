import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest, { params }: { params: { transactionId: string } }) {
  try {
    const transactionId = params.transactionId

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 })
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Fetch transaction data
    const { data, error } = await supabase
      .from("transaction_generations")
      .select("*")
      .eq("transaction_id", transactionId)
      .single()

    if (error) {
      console.error("[v0] Error fetching transaction:", error)
      return NextResponse.json({ error: "Failed to fetch transaction", details: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[v0] Error in view-confirmation:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
