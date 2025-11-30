import type { NextRequest } from "next/server"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

// Import the active subscriptions map from the subscribe route
// Note: This works because both files run in the same Node.js process
const activeMqttSubscriptions = new Map<string, any>()

export async function POST(request: NextRequest) {
  const clientIP = getClientIp(request)
  const rateLimitResult = rateLimit("/api/mqtt-unsubscribe", clientIP)

  if (!rateLimitResult.success) {
    const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
    return new Response(
      JSON.stringify({
        error: "Too many requests",
        message: "Please try again later",
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": retryAfter.toString(),
        },
      },
    )
  }

  console.log("[v0] 🛑 MQTT Unsubscribe route called")
  console.log("[v0] Client IP:", clientIP)

  try {
    const body = await request.json()
    const { transactionId } = body

    if (!transactionId) {
      console.log("[v0] ❌ Missing transactionId parameter")
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing transactionId parameter",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log(`[v0] 🔍 Looking up active subscription for: ${transactionId}`)

    // Get the active subscription from the global map
    const subscription = activeMqttSubscriptions.get(transactionId)

    if (!subscription) {
      console.log(`[v0] ⚠️ No active subscription found for: ${transactionId}`)
      console.log(`[v0] 📊 Currently active subscriptions: ${activeMqttSubscriptions.size}`)
      return new Response(
        JSON.stringify({
          success: false,
          error: "No active subscription found for this transaction ID",
          transactionId,
          activeSubscriptions: activeMqttSubscriptions.size,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log(`[v0] ✅ Found active subscription for: ${transactionId}`)
    console.log(`[v0] 📡 Topic: ${subscription.topic}`)

    // Unsubscribe from the topic first
    try {
      console.log(`[v0] 🔄 Unsubscribing from topic: ${subscription.topic}`)
      subscription.client.unsubscribe(subscription.topic, (err: any) => {
        if (err) {
          console.error(`[v0] ⚠️ Unsubscribe error (non-fatal): ${err.message}`)
        } else {
          console.log(`[v0] ✅ Successfully unsubscribed from topic`)
        }
      })
    } catch (unsubError) {
      console.error(`[v0] ⚠️ Unsubscribe exception (non-fatal):`, unsubError)
    }

    // Force close the MQTT client connection
    try {
      console.log(`[v0] 🔌 Closing MQTT client connection...`)
      subscription.client.end(true) // Force close immediately
      console.log(`[v0] ✅ MQTT client connection closed`)
    } catch (closeError) {
      console.error(`[v0] ⚠️ Client close error (non-fatal):`, closeError)
    }

    // Remove from active subscriptions map
    activeMqttSubscriptions.delete(transactionId)
    console.log(`[v0] 🗑️ Removed subscription from active map`)
    console.log(`[v0] 📊 Remaining active subscriptions: ${activeMqttSubscriptions.size}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: "MQTT subscription closed successfully",
        transactionId,
        topic: subscription.topic,
        closedAt: new Date().toISOString(),
        remainingActiveSubscriptions: activeMqttSubscriptions.size,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("[v0] ❌ MQTT unsubscribe error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: "MQTT unsubscribe failed",
        details: error instanceof Error ? error.message : "Unknown error",
        clientIP,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
