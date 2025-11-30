import { type NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest, { params }: { params: { transactionId: string } }) {
  const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

  const rateLimitResult = rateLimit("/api/get-transaction-history", clientIP)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }

  try {
    const { transactionId } = params

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 })
    }

    console.log(`[v0] Fetching transaction history for: ${transactionId}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`https://api-erp-i.kverkom.sk/api/v1/getTransactionHistory/${transactionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "NOP-Web-Client/1.0",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log(`[v0] Transaction history response status: ${response.status}`)

    if (!response.ok) {
      console.error(`[v0] Transaction history API error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch transaction history: ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log(`[v0] Transaction history data received for: ${transactionId}`)

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[v0] Error fetching transaction history:", error)

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timeout - the external API took too long to respond" },
          { status: 504 },
        )
      }
      return NextResponse.json({ error: `Failed to fetch transaction history: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
