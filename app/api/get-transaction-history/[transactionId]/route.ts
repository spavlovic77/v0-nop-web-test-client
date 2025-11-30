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

    const response = await fetch(`https://api-erp-i.kverkom.sk/api/v1/getTransactionHistory/${transactionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch transaction history" }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Error fetching transaction history:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
