import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import mqtt from "mqtt"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  if (realIP) {
    return realIP
  }
  return "unknown"
}

async function getCertificateBuffer(data: File | string): Promise<Buffer> {
  if (typeof data === "string") {
    return Buffer.from(data, "utf-8")
  } else {
    return Buffer.from(await data.arrayBuffer())
  }
}

async function saveMqttNotificationToDatabase(
  topic: string,
  messageStr: string,
  endpoint: "PRODUCTION" | "TEST",
): Promise<{
  success: boolean
  error?: any
  data?: any
}> {
  try {
    console.log("[v0] 💾 Starting database save operation...")
    console.log("[v0] 📝 Topic:", topic)
    console.log("[v0] 📝 Message:", messageStr)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("[v0] ❌ Missing Supabase environment variables!")
      console.error("[v0] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "present" : "MISSING")
      console.error("[v0] SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "present" : "MISSING")
      return { success: false, error: "Missing Supabase configuration" }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log("[v0] ✅ Supabase client created with service role key")

    // Parse topic
    const topicParts = topic.split("/")
    let vatsk = null
    let pokladnica = null
    let transaction_id = null

    if (topicParts.length >= 3) {
      // Extract VATSK (remove "VATSK-" prefix)
      if (topicParts[0].startsWith("VATSK-")) {
        vatsk = topicParts[0].substring(6)
      }
      // Extract POKLADNICA (remove "POKLADNICA-" prefix)
      if (topicParts[1].startsWith("POKLADNICA-")) {
        pokladnica = topicParts[1].substring(11)
      }
      transaction_id = topicParts[2] // Keep full "QR-..." format
    }

    console.log("[v0] 📝 Parsed topic parts:", { vatsk, pokladnica, transaction_id })

    // Parse JSON payload
    let amount = null
    let currency = null
    let integrity_hash = null
    let payload_received_at = null

    try {
      const parsedPayload = JSON.parse(messageStr)
      console.log("[v0] 📝 Parsed payload:", parsedPayload)

      if (parsedPayload.transactionAmount) {
        console.log("[v0] 💰 Raw amount from payload:", parsedPayload.transactionAmount.amount)
        console.log("[v0] 💰 Amount type:", typeof parsedPayload.transactionAmount.amount)

        amount = Number.parseFloat(parsedPayload.transactionAmount.amount)
        console.log("[v0] 💰 Final amount (in EUR):", amount)

        currency = parsedPayload.transactionAmount.currency
      }
      integrity_hash = parsedPayload.dataIntegrityHash
      payload_received_at = parsedPayload.receivedAt
    } catch (parseError) {
      console.warn("[v0] ⚠️ Could not parse JSON payload, saving as raw text:", parseError)
    }

    // Prepare data for database insert
    const insertData = {
      topic,
      raw_payload: messageStr,
      vatsk,
      pokladnica,
      transaction_id,
      amount,
      currency,
      integrity_hash,
      payload_received_at,
      end_point: endpoint,
    }

    console.log("[v0] 💾 Attempting to insert data into mqtt_notifications table...")
    console.log("[v0] 📋 Insert data:", JSON.stringify(insertData, null, 2))

    const { data, error } = await supabase.from("mqtt_notifications").insert(insertData).select()

    if (error) {
      console.error("[v0] ❌ Database insert failed!")
      console.error("[v0] Error code:", error.code)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error details:", JSON.stringify(error, null, 2))
      return { success: false, error }
    }

    console.log("[v0] ✅ Database insert successful!")
    console.log("[v0] 📊 Inserted data:", JSON.stringify(data, null, 2))
    return { success: true, data }
  } catch (error) {
    console.error("[v0] ❌ Database save exception!")
    console.error("[v0] Exception:", error)
    console.error("[v0] Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    return { success: false, error }
  }
}

async function saveMqttSubscriptionToDatabase(
  topic: string,
  qos: number,
  grantedAt: string,
  endpoint: "PRODUCTION" | "TEST",
): Promise<{
  success: boolean
  error?: any
  data?: any
}> {
  try {
    console.log("[v0] 💾 Starting subscription database save operation...")
    console.log("[v0] 📝 Topic:", topic)
    console.log("[v0] 📝 QoS:", qos)
    console.log("[v0] 📝 Granted At:", grantedAt)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log("[v0] ❌ Missing Supabase environment variables")
      return { success: false, error: "Missing Supabase configuration" }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log("[v0] ✅ Supabase client created for subscription save")

    // Parse topic
    const topicParts = topic.split("/")
    let vatsk = null
    let pokladnica = null
    let transaction_id = null

    if (topicParts.length >= 3) {
      // Extract VATSK (remove "VATSK-" prefix)
      if (topicParts[0].startsWith("VATSK-")) {
        vatsk = topicParts[0].substring(6)
      }
      // Extract POKLADNICA (remove "POKLADNICA-" prefix)
      if (topicParts[1].startsWith("POKLADNICA-")) {
        pokladnica = topicParts[1].substring(11)
      }
      transaction_id = topicParts[2] // Keep full "QR-..." format
    }

    console.log("[v0] 📝 Parsed subscription topic parts:", { vatsk, pokladnica, transaction_id, qos })

    // Prepare data for database insert
    const insertData = {
      topic,
      vatsk,
      pokladnica,
      transaction_id,
      qos,
      end_point: endpoint,
    }

    console.log("[v0] 💾 Attempting to insert subscription data into mqtt_subscriptions table...")
    console.log("[v0] 📋 Insert data:", JSON.stringify(insertData, null, 2))

    // Insert into database
    const { data, error } = await supabase.from("mqtt_subscriptions").insert(insertData).select()

    if (error) {
      console.log("[v0] ❌ Subscription database insert failed:", error)
      return { success: false, error }
    }

    console.log("[v0] ✅ Subscription database insert successful:", data)
    return { success: true, data }
  } catch (error) {
    console.log("[v0] ❌ Subscription database save exception:", error)
    return { success: false, error }
  }
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIp(request)
  const rateLimitResult = rateLimit("/api/mqtt-subscribe", clientIP)

  if (!rateLimitResult.success) {
    const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
    return new Response(
      JSON.stringify({
        error: "Too many requests",
        message: "Please try again later",
        retryAfter,
        resetTime: new Date(rateLimitResult.reset).toISOString(),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": new Date(rateLimitResult.reset).toISOString(),
        },
      },
    )
  }

  console.log("[v0] MQTT Subscribe route called")
  console.log("[v0] Client IP:", clientIP)

  try {
    console.log("[v0] Parsing form data...")
    const formData = await request.formData()

    const clientCert = formData.get("clientCert") as File | string
    const clientKey = formData.get("clientKey") as File | string
    const caCert = formData.get("caCert") as File | string
    const transactionId = formData.get("transactionId") as string
    const vatsk = formData.get("vatsk") as string
    const pokladnica = formData.get("pokladnica") as string
    const isProductionMode = formData.get("isProductionMode") === "true"

    console.log("[v0] Production mode:", isProductionMode)
    console.log("[v0] isProductionMode raw value:", formData.get("isProductionMode"))

    const endpoint: "PRODUCTION" | "TEST" = isProductionMode ? "PRODUCTION" : "TEST"

    if (!clientCert || !clientKey || !caCert) {
      console.log("[v0] Missing certificate files")
      return new Response(JSON.stringify({ error: "Missing certificate files" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!vatsk || !pokladnica) {
      console.log("[v0] Missing required parameters: vatsk or pokladnica")
      return new Response(
        JSON.stringify({
          error: "Missing required parameters",
          details: "Both vatsk and pokladnica are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (!transactionId) {
      console.log("[v0] Missing required parameter: transactionId")
      return new Response(
        JSON.stringify({
          error: "Missing required parameter",
          details: "transactionId is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("[v0] Converting certificates to buffers...")
    const clientCertBuffer = await getCertificateBuffer(clientCert)
    const clientKeyBuffer = await getCertificateBuffer(clientKey)
    const caCertBuffer = await getCertificateBuffer(caCert)

    const mqttTopic = `VATSK-${vatsk}/POKLADNICA-${pokladnica}/${transactionId}`

    const mqttBroker = isProductionMode ? "mqtt.kverkom.sk" : "mqtt-i.kverkom.sk"
    const mqttPort = 8883

    console.log("[v0] MQTT Broker:", mqttBroker)
    console.log("[v0] MQTT Port:", mqttPort)
    console.log("[v0] Using", isProductionMode ? "PRODUCTION" : "TEST", "environment")
    console.log("[v0] MQTT topic:", mqttTopic)

    const communicationLog: string[] = []
    const startTime = new Date().toISOString()
    communicationLog.push(`[${startTime}] 🔄 Initiating MQTT connection to ${mqttBroker}:${mqttPort}`)
    communicationLog.push(`[${startTime}] 📡 Using MQTT over TLS (mqtts://) with client certificates`)
    communicationLog.push(`[${startTime}] 🎯 Subscribing to topic: ${mqttTopic}`)
    communicationLog.push(`[${startTime}] ⏱️ Timeout: 120 seconds`)

    return new Promise((resolve) => {
      const messages: string[] = []
      let timeoutHandle: NodeJS.Timeout
      let isResolved = false
      let isCancelled = false

      const mqttUrl = `mqtts://${mqttBroker}:${mqttPort}`
      console.log("[v0] Connecting to MQTT broker:", mqttUrl)

      const client = mqtt.connect(mqttUrl, {
        cert: clientCertBuffer,
        key: clientKeyBuffer,
        ca: caCertBuffer,
        rejectUnauthorized: true,
        protocol: "mqtts",
        port: mqttPort,
        keepalive: 60,
        connectTimeout: 30000,
        reconnectPeriod: 0, // Disable auto-reconnect
      })

      let abortListenerRegistered = false

      request.signal.addEventListener("abort", () => {
        const abortTime = new Date().toISOString()
        console.log("[v0] ========== ABORT EVENT FIRED ==========")
        console.log("[v0] ⚠️ Request aborted by client - unsubscribing from MQTT")
        console.log("[v0] Client connected:", client?.connected)
        console.log("[v0] Topic:", mqttTopic)
        isCancelled = true
        communicationLog.push(`[${abortTime}] ⚠️ Request aborted by client`)
        communicationLog.push(`[${abortTime}] 📊 Messages received before abort: ${messages.length}`)

        if (client) {
          if (client.connected && mqttTopic) {
            console.log("[v0] 📤 Unsubscribing from topic...")
            client.unsubscribe(mqttTopic, (err) => {
              if (err) {
                console.error("[v0] ❌ Unsubscribe error:", err)
              } else {
                console.log("[v0] ✅ Successfully unsubscribed from topic after abort")
                communicationLog.push(`[${abortTime}] ✅ Unsubscribed from topic`)
              }
              console.log("[v0] 🔌 Forcing MQTT connection close...")
              client.end(true)
              console.log("[v0] ✅ MQTT connection closed after abort")
            })
          } else {
            console.log("[v0] 🔌 Client not connected or topic missing, forcing close...")
            client.end(true)
            console.log("[v0] ✅ MQTT connection closed after abort")
          }
        } else {
          console.log("[v0] ⚠️ No MQTT client found to close")
        }

        resolveOnce(
          new Response(
            JSON.stringify({
              success: true,
              aborted: true,
              hasMessages: messages.length > 0,
              messages: messages,
              messageCount: messages.length,
              communicationLog: communicationLog,
              output: "Subscription cancelled by user",
              clientIP,
              listeningDuration: "Cancelled",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        )
      })

      abortListenerRegistered = true
      console.log("[v0] ✅ Abort listener registered")

      const cleanup = () => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle)
        }
        if (client) {
          console.log("[v0] 🔌 Cleaning up MQTT connection")
          if (mqttTopic) {
            client.unsubscribe(mqttTopic, (err) => {
              if (err) {
                console.error("[v0] ❌ Unsubscribe error:", err)
              } else {
                console.log("[v0] ✅ Unsubscribed from topic:", mqttTopic)
              }
              client.end(true)
            })
          } else {
            client.end(true)
          }
        }
      }

      const resolveOnce = (response: Response) => {
        if (!isResolved) {
          isResolved = true
          cleanup()
          resolve(response)
        }
      }

      timeoutHandle = setTimeout(() => {
        const endTime = new Date().toISOString()
        console.log("[v0] MQTT subscription timeout reached (120 seconds)")
        communicationLog.push(`[${endTime}] ⏱️ Timeout reached after 120 seconds`)
        communicationLog.push(`[${endTime}] 📊 Total messages received: ${messages.length}`)

        resolveOnce(
          new Response(
            JSON.stringify({
              success: true,
              hasMessages: messages.length > 0,
              messages: messages,
              messageCount: messages.length,
              communicationLog: communicationLog,
              output:
                messages.length > 0 ? messages.join("\n") : "No messages received during 120-second listening period",
              clientIP,
              listeningDuration: "120 seconds",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        )
      }, 120000) // 120 seconds

      client.on("connect", () => {
        const connectTime = new Date().toISOString()
        console.log("[v0] ✅ Connected to MQTT broker")
        communicationLog.push(`[${connectTime}] ✅ Connected to MQTT broker`)

        client.subscribe(mqttTopic, { qos: 1 }, (err, granted) => {
          if (err) {
            const errorTime = new Date().toISOString()
            console.error("[v0] ❌ Subscription error:", err)
            communicationLog.push(`[${errorTime}] ❌ Subscription error: ${err.message}`)

            resolveOnce(
              new Response(
                JSON.stringify({
                  error: "MQTT subscription failed",
                  details: err.message,
                  communicationLog: communicationLog,
                  clientIP,
                }),
                {
                  status: 500,
                  headers: { "Content-Type": "application/json" },
                },
              ),
            )
          } else {
            const subTime = new Date().toISOString()
            console.log("[v0] ✅ Subscribed to topic:", granted)
            communicationLog.push(`[${subTime}] ✅ Subscribed to topic with QoS ${granted[0].qos}`)

            // Save subscription to database
            saveMqttSubscriptionToDatabase(mqttTopic, granted[0].qos, subTime, endpoint)
              .then((dbResult) => {
                if (dbResult.success) {
                  console.log("[v0] ✅ Subscription saved to database")
                  communicationLog.push(`[${subTime}] ✅ Subscription saved to database`)
                } else {
                  console.error("[v0] ❌ Subscription database save failed:", dbResult.error)
                  communicationLog.push(`[${subTime}] ❌ Subscription database save failed`)
                }
              })
              .catch((dbError) => {
                console.error("[v0] ❌ Subscription database save exception:", dbError)
              })
          }
        })
      })

      client.on("message", async (topic, message) => {
        if (isCancelled) {
          console.log("[v0] ⛔ Message received but subscription was cancelled, ignoring message")
          return
        }

        if (request.signal.aborted) {
          console.log("[v0] ⛔ Message received but request is aborted, ignoring message")
          return
        }

        const messageTime = new Date().toISOString()
        const messageStr = message.toString()
        console.log("[v0] 📨 Message received on topic:", topic)
        console.log("[v0] 📨 Message content:", messageStr)

        messages.push(messageStr)
        communicationLog.push(`[${messageTime}] 📨 Message received: ${messageStr}`)

        if (isCancelled || request.signal.aborted) {
          console.log("[v0] ⛔ Cancellation detected before database save, skipping")
          return
        }

        // Save message to database
        try {
          const dbResult = await saveMqttNotificationToDatabase(topic, messageStr, endpoint)
          if (dbResult.success) {
            console.log("[v0] ✅ Message saved to database")
            communicationLog.push(`[${messageTime}] ✅ Message saved to database`)
          } else {
            console.error("[v0] ❌ Database save failed:", dbResult.error)
            communicationLog.push(`[${messageTime}] ❌ Database save failed`)
          }
        } catch (dbError) {
          console.error("[v0] ❌ Database save exception:", dbError)
          communicationLog.push(`[${messageTime}] ❌ Database save exception`)
        }

        const elapsedTime = Date.now() - new Date(startTime).getTime()
        const elapsedSeconds = Math.round(elapsedTime / 1000)

        console.log("[v0] ✅ Message received and saved, returning immediately")
        communicationLog.push(`[${messageTime}] ✅ Returning response immediately after ${elapsedSeconds} seconds`)

        resolveOnce(
          new Response(
            JSON.stringify({
              success: true,
              hasMessages: true,
              messages: messages,
              messageCount: messages.length,
              communicationLog: communicationLog,
              output: messageStr,
              clientIP,
              listeningDuration: `${elapsedSeconds} seconds`,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        )
      })

      client.on("error", (err) => {
        const errorTime = new Date().toISOString()
        console.error("[v0] ❌ MQTT client error:", err)
        communicationLog.push(`[${errorTime}] ❌ MQTT error: ${err.message}`)

        resolveOnce(
          new Response(
            JSON.stringify({
              error: "MQTT connection failed",
              details: err instanceof Error ? err.message : "Unknown error",
              communicationLog: communicationLog,
              clientIP,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          ),
        )
      })

      client.on("close", () => {
        const closeTime = new Date().toISOString()
        console.log("[v0] 🔌 MQTT connection closed")
        communicationLog.push(`[${closeTime}] 🔌 Connection closed`)
      })
    })
  } catch (error) {
    console.error("[v0] MQTT subscription error:", error)
    return new Response(
      JSON.stringify({
        error: "MQTT subscription failed",
        details: error instanceof Error ? error.message : "Unknown error",
        clientIP: getClientIP(request),
        communicationLog: [
          `[${new Date().toISOString()}] ❌ Subscription failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
