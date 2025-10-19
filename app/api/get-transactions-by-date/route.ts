import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { date, pokladnica } = await request.json()

    if (!date || !pokladnica) {
      return NextResponse.json({ error: "Date and pokladnica are required" }, { status: 400 })
    }

    // Create Supabase client with service role key
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Query transaction_generations table
    const startDate = `${date}T00:00:00Z`
    const endDate = `${date}T23:59:59Z`

    const { data, error } = await supabase
      .from("transaction_generations")
      .select("id, transaction_id, response_timestamp, amount, iban, dispute")
      .eq("pokladnica", pokladnica)
      .gte("response_timestamp", startDate)
      .lte("response_timestamp", endDate)
      .order("response_timestamp", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching transactions:", error)
      return NextResponse.json({ error: "Failed to fetch transactions", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ transactions: data || [] })
  } catch (error) {
    console.error("[v0] Error in get-transactions-by-date:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
