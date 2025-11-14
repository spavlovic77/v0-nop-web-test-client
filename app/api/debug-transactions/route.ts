import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, pokladnica, timezoneOffset, end_point } = body

    console.log("[v0] Debug request:", { date, pokladnica, timezoneOffset, end_point })

    if (!date || !pokladnica || !end_point) {
      return NextResponse.json({ error: "Date, pokladnica, and end_point are required" }, { status: 400 })
    }

    const [year, month, day] = date.split("-").map(Number)
    const offsetMs = (timezoneOffset || 0) * 60 * 1000
    const userMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    const startOfDayUTC = new Date(userMidnight.getTime() + offsetMs)
    const endOfDayUTC = new Date(startOfDayUTC.getTime() + 24 * 60 * 60 * 1000 - 1)

    const startDate = startOfDayUTC.toISOString()
    const endDate = endOfDayUTC.toISOString()

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Call debug function
    const { data, error } = await supabase.rpc("debug_get_transactions", {
      p_pokladnica: pokladnica,
      p_start_date: startDate,
      p_end_date: endDate,
      p_end_point: end_point,
    })

    if (error) {
      console.error("[v0] Debug RPC error:", error)
      return NextResponse.json({ error: "Failed to fetch debug data", details: error.message }, { status: 500 })
    }

    console.log("[v0] Debug results:", data)

    return NextResponse.json({ 
      debug: data || [],
      query_params: {
        pokladnica,
        start_date: startDate,
        end_date: endDate,
        end_point
      }
    })
  } catch (error) {
    console.error("[v0] Debug error:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
