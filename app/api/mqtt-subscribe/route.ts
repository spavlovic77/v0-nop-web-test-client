import type { NextRequest } from "next/server"
import { writeFile, unlink } from "fs/promises"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import { createClient } from "@supabase/supabase-js"

const execAsync = promisify(exec)

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
    let transaction_status = null
    let integrity_hash = null
    let end_to_end_id = null
    let payload_received_at = null

    try {
      const parsedPayload = JSON.parse(messageStr)
      console.log("[v0] 📝 Parsed payload:", parsedPayload)

      transaction_status = parsedPayload.transactionStatus
      if (parsedPayload.transactionAmount) {
        console.log("[v0] 💰 Raw amount from payload:", parsedPayload.transactionAmount.amount)
        console.log("[v0] 💰 Amount type:", typeof parsedPayload.transactionAmount.amount)

        amount = Number.parseFloat(parsedPayload.transactionAmount.amount)
        console.log("[v0] 💰 Final amount (in EUR):", amount)

        currency = parsedPayload.transactionAmount.currency
      }
      integrity_hash = parsedPayload.dataIntegrityHash
      end_to_end_id = parsedPayload.endToEndId
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
      transaction_status,
      amount,
      currency,
      integrity_hash,
      end_to_end_id,
      payload_received_at,
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
    let end_to_end_id = null

    if (topicParts.length >= 3) {
      // Extract VATSK (remove "VATSK-" prefix)
      if (topicParts[0].startsWith("VATSK-")) {
        vatsk = topicParts[0].substring(6)
      }
      // Extract POKLADNICA (remove "POKLADNICA-" prefix)
      if (topicParts[1].startsWith("POKLADNICA-")) {
        pokladnica = topicParts[1].substring(11)
      }
      end_to_end_id = topicParts[2] // Keep full "QR-..." format
    }

    console.log("[v0] 📝 Parsed subscription topic parts:", { vatsk, pokladnica, end_to_end_id, qos })

    // Prepare data for database insert
    const insertData = {
      topic,
      vatsk,
      pokladnica,
      end_to_end_id,
      qos,
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
  console.log("[v0] MQTT Subscribe route called")
  const clientIP = getClientIP(request)
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

    console.log("[v0] Converting files to buffers...")
    const sessionId = Date.now().toString()
    const clientCertPath = path.join("/tmp", `${sessionId}-client.pem`)
    const clientKeyPath = path.join("/tmp", `${sessionId}-client.key`)
    const caCertPath = path.join("/tmp", `${sessionId}-ca.pem`)

    console.log("[v0] Writing certificate files to disk...")
    await Promise.all([
      writeFile(clientCertPath, await getCertificateBuffer(clientCert)),
      writeFile(clientKeyPath, await getCertificateBuffer(clientKey)),
      writeFile(caCertPath, await getCertificateBuffer(caCert)),
    ])

    const mqttTopic = `VATSK-${vatsk}/POKLADNICA-${pokladnica}/${transactionId}`

    const mqttBroker = isProductionMode ? "mqtt.kverkom.sk" : "mqtt-i.kverkom.sk"
    console.log("[v0] MQTT Broker:", mqttBroker)
    console.log("[v0] Using", isProductionMode ? "PRODUCTION" : "TEST", "environment")
    console.log("[v0] MQTT topic:", mqttTopic)

    const mosquittoCommand = `timeout 120 mosquitto_sub -h ${mqttBroker} -p 8883 -v -q 1 -t "${mqttTopic}" --cafile "${caCertPath}" --cert "${clientCertPath}" --key "${clientKeyPath}" -d`

    console.log("[v0] Executing mosquitto_sub command...")
    console.log("[v0] Command:", mosquittoCommand)

    const communicationLog: string[] = []
    const startTime = new Date().toISOString()
    communicationLog.push(`[${startTime}] 🔄 Initiating MQTT connection to ${mqttBroker}:8883`)
    communicationLog.push(`[${startTime}] 📡 Using TLS with client certificates`)
    communicationLog.push(`[${startTime}] 🎯 Subscribing to topic: ${mqttTopic}`)
    communicationLog.push(`[${startTime}] ⏱️ Timeout: 120 seconds`)

    try {
      const { stdout, stderr } = await execAsync(mosquittoCommand)
      const endTime = new Date().toISOString()

      console.log("[v0] mosquitto_sub stdout:", stdout)
      console.log("[v0] mosquitto_sub stderr:", stderr)

      communicationLog.push(`[${endTime}] ✅ MQTT subscription completed`)

      const messages: string[] = []
      if (stdout.trim()) {
        const lines = stdout.trim().split("\n")
        for (const line of lines) {
          const parts = line.split(" ", 2)
          if (parts.length === 2) {
            const [topic, message] = parts
            messages.push(message)
            communicationLog.push(`[${endTime}] 📨 Message received: ${message}`)

            try {
              const dbResult = await saveMqttNotificationToDatabase(topic, message)
              if (dbResult.success) {
                console.log("[v0] ✅ Message saved to database")
                communicationLog.push(`[${endTime}] ✅ Message saved to database`)
              } else {
                console.error("[v0] ❌ Database save failed:", dbResult.error)
                communicationLog.push(`[${endTime}] ❌ Database save failed`)
              }
            } catch (dbError) {
              console.error("[v0] ❌ Database save exception:", dbError)
              communicationLog.push(`[${endTime}] ❌ Database save exception`)
            }
          }
        }
      }

      await Promise.all([
        unlink(clientCertPath).catch(() => {}),
        unlink(clientKeyPath).catch(() => {}),
        unlink(caCertPath).catch(() => {}),
      ])
      console.log("[v0] Certificate files cleaned up")
      communicationLog.push(`[${endTime}] 🧹 Certificate files cleaned up`)

      return new Response(
        JSON.stringify({
          success: true,
          hasMessages: messages.length > 0,
          messages: messages,
          messageCount: messages.length,
          communicationLog: communicationLog,
          output: messages.length > 0 ? messages.join("\n") : "No messages received during 120-second listening period",
          mqttCommand: mosquittoCommand,
          clientIP,
          listeningDuration: "120 seconds",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    } catch (error: any) {
      const endTime = new Date().toISOString()
      console.error("[v0] mosquitto_sub error:", error)

      communicationLog.push(`[${endTime}] ❌ MQTT subscription error: ${error.message}`)

      await Promise.all([
        unlink(clientCertPath).catch(() => {}),
        unlink(clientKeyPath).catch(() => {}),
        unlink(caCertPath).catch(() => {}),
      ])

      return new Response(
        JSON.stringify({
          error: "MQTT subscription failed",
          details: error.stderr || error.message,
          communicationLog: communicationLog,
          mqttCommand: mosquittoCommand,
          clientIP,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
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
