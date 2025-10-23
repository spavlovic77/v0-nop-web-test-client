import type { NextRequest } from "next/server"
import { writeFile, unlink } from "fs/promises"
import * as mqtt from "mqtt"
import { readFileSync } from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"

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
        // The API sends amount as integer cents (e.g., 14 for 0.14 EUR)
        const amountInCents = Number.parseFloat(parsedPayload.transactionAmount.amount)
        amount = amountInCents / 100 // Convert cents to EUR
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

    console.log("[v0] Starting MQTT subscription with MQTT.js library...")
    console.log("[v0] Using transaction ID:", transactionId)
    console.log("[v0] MQTT topic:", mqttTopic)
    console.log("[v0] Will listen for 120 seconds...")

    const mqttOptions = {
      host: "mqtt-i.kverkom.sk",
      port: 8883,
      protocol: "mqtts" as const,
      ca: readFileSync(caCertPath),
      cert: readFileSync(clientCertPath),
      key: readFileSync(clientKeyPath),
      rejectUnauthorized: false,
      secureProtocol: "TLSv1_2_method",
      checkServerIdentity: () => undefined,
      connectTimeout: 10000,
    }

    return new Promise((resolve) => {
      const messages: string[] = []
      const communicationLog: string[] = []
      let connectionEstablished = false

      communicationLog.push(`[${new Date().toISOString()}] 🔄 Initiating MQTT connection to mqtt-i.kverkom.sk:8883`)
      communicationLog.push(`[${new Date().toISOString()}] 📡 Using SSL/TLS with client certificates`)
      communicationLog.push(`[${new Date().toISOString()}] 🎯 Subscribing to topic: ${mqttTopic}`)

      const client = mqtt.connect(mqttOptions)

      const cleanup = async () => {
        if (client && !client.disconnected) {
          client.end(true)
        }
        await Promise.all([
          unlink(clientCertPath).catch(() => {}),
          unlink(clientKeyPath).catch(() => {}),
          unlink(caCertPath).catch(() => {}),
        ])
        console.log("[v0] Certificate files cleaned up")
        communicationLog.push(`[${new Date().toISOString()}] 🧹 Certificate files cleaned up`)
      }

      client.on("connect", (connack) => {
        const timestamp = new Date().toISOString()
        connectionEstablished = true
        console.log("[v0] ✅ MQTT connection established successfully!")
        console.log("[v0] CONNACK received:", connack)

        communicationLog.push(`[${timestamp}] ✅ MQTT connection established successfully`)
        communicationLog.push(`[${timestamp}] 🤝 CONNACK received: ${JSON.stringify(connack)}`)

        client.subscribe(mqttTopic, { qos: 1 }, async (err, granted) => {
          if (err) {
            console.log("[v0] ❌ Subscription error:", err)
            communicationLog.push(`[${timestamp}] ❌ Subscription error: ${err.message}`)
          } else {
            console.log("[v0] ✅ Successfully subscribed to topic:", mqttTopic)
            console.log("[v0] Granted subscriptions:", granted)
            communicationLog.push(`[${timestamp}] ✅ Successfully subscribed to topic: ${mqttTopic}`)
            communicationLog.push(`[${timestamp}] 📝 Granted: ${JSON.stringify(granted)}`)

            if (granted && granted.length > 0) {
              for (const subscription of granted) {
                console.log("[v0] 🔄 Saving subscription to database...")
                saveMqttSubscriptionToDatabase(subscription.topic, subscription.qos, timestamp)
                  .then((subResult) => {
                    if (subResult.success) {
                      console.log("[v0] ✅ Subscription saved to database!")
                      communicationLog.push(`[${timestamp}] ✅ Subscription saved to database`)
                    } else {
                      console.log("[v0] ❌ Subscription database save failed:", subResult.error)
                      communicationLog.push(
                        `[${timestamp}] ❌ Subscription database save failed: ${subResult.error?.message || "Unknown error"}`,
                      )
                    }
                  })
                  .catch((error) => {
                    console.error("[v0] Subscription database save failed (non-blocking):", error)
                    communicationLog.push(
                      `[${timestamp}] ❌ Subscription database save failed (non-blocking): ${error.message}`,
                    )
                  })
              }
            }

            communicationLog.push(`[${timestamp}] 👂 Now listening for messages...`)
          }
        })
      })

      client.on("message", async (topic, message, packet) => {
        const timestamp = new Date().toISOString()
        const messageStr = message.toString()

        console.log("[v0] 📨 Message received!")
        console.log("[v0] Topic:", topic)
        console.log("[v0] Message:", messageStr)
        console.log("[v0] Packet:", packet)

        messages.push(messageStr)
        communicationLog.push(`[${timestamp}] 📨 Message received on topic: ${topic}`)
        communicationLog.push(`[${timestamp}] 💬 Message content: ${messageStr}`)
        communicationLog.push(`[${timestamp}] 📊 Total messages collected: ${messages.length}`)

        console.log("[v0] 🔄 Saving MQTT notification to database...")
        try {
          const dbResult = await saveMqttNotificationToDatabase(topic, messageStr)

          if (dbResult.success) {
            console.log("[v0] ✅ MQTT notification successfully saved to database!")
            communicationLog.push(`[${timestamp}] ✅ MQTT notification saved to database`)
          } else {
            console.error("[v0] ❌ Failed to save MQTT notification to database!")
            console.error("[v0] Error:", dbResult.error)
            communicationLog.push(
              `[${timestamp}] ❌ Database save failed: ${dbResult.error?.message || JSON.stringify(dbResult.error)}`,
            )
          }
        } catch (error) {
          console.error("[v0] ❌ Exception while saving MQTT notification to database!")
          console.error("[v0] Exception:", error)
          communicationLog.push(
            `[${timestamp}] ❌ Database save exception: ${error instanceof Error ? error.message : "Unknown error"}`,
          )
        }

        communicationLog.push(`[${timestamp}] 🎉 Message processed - returning response`)

        cleanup().then(() => {
          resolve(
            new Response(
              JSON.stringify({
                success: true,
                hasMessages: true,
                messages: messages,
                messageCount: messages.length,
                communicationLog: communicationLog,
                output: messages.join("\n"),
                mqttCommand: `MQTT.js subscription to mqtts://mqtt-i.kverkom.sk:8883 topic: ${mqttTopic}`,
                clientIP,
                listeningDuration: "Message received immediately",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          )
        })
      })

      client.on("error", (error) => {
        const timestamp = new Date().toISOString()
        console.log("[v0] ❌ MQTT error:", error)
        communicationLog.push(`[${timestamp}] ❌ MQTT error: ${error.message}`)
      })

      client.on("close", () => {
        const timestamp = new Date().toISOString()
        console.log("[v0] 🔚 MQTT connection closed")
        communicationLog.push(`[${timestamp}] 🔚 MQTT connection closed`)
      })

      setTimeout(() => {
        const timestamp = new Date().toISOString()
        console.log("[v0] ⏰ MQTT subscription timeout reached (120 seconds)")
        console.log("[v0] Final message count:", messages.length)

        communicationLog.push(`[${timestamp}] ⏰ Subscription timeout reached (120 seconds)`)
        communicationLog.push(`[${timestamp}] 📊 Final message count: ${messages.length}`)

        if (messages.length > 0) {
          console.log("[v0] All collected messages:")
          messages.forEach((msg, index) => {
            console.log(`[v0] Message ${index + 1}:`, JSON.stringify(msg))
            communicationLog.push(`[${timestamp}] 📋 Message ${index + 1}: ${JSON.stringify(msg)}`)
          })
        } else {
          communicationLog.push(`[${timestamp}] 📭 No messages received during listening period`)
        }

        cleanup().then(() => {
          resolve(
            new Response(
              JSON.stringify({
                success: true,
                hasMessages: messages.length > 0,
                messages: messages,
                messageCount: messages.length,
                communicationLog: communicationLog,
                output:
                  messages.length > 0 ? messages.join("\n") : "No messages received during 120-second listening period",
                mqttCommand: `MQTT.js subscription to mqtts://mqtt-i.kverkom.sk:8883 topic: ${mqttTopic}`,
                clientIP,
                listeningDuration: "120 seconds",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          )
        })
      }, 120000)
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
