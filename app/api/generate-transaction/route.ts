import { type NextRequest, NextResponse } from "next/server"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"
import { exec } from "child_process"
import { promisify } from "util"
import { createClient } from "@supabase/supabase-js"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const execAsync = promisify(exec)

function validateAndNormalizePEM(pemContent: string, type: string): string {
  // Normalize line endings to Unix format
  const normalized = pemContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  // Validate PEM format based on type
  let beginMarker: string
  let endMarker: string

  if (type === "certificate" || type === "ca") {
    beginMarker = "-----BEGIN CERTIFICATE-----"
    endMarker = "-----END CERTIFICATE-----"
  } else if (type === "key") {
    beginMarker = "-----BEGIN"
    endMarker = "-----END"
  } else {
    throw new Error(`Unknown PEM type: ${type}`)
  }

  // Check if PEM markers exist
  if (!normalized.includes(beginMarker)) {
    throw new Error(`Invalid ${type} PEM format: missing BEGIN marker`)
  }

  if (!normalized.includes(endMarker)) {
    throw new Error(`Invalid ${type} PEM format: missing END marker`)
  }

  // Remove any extra whitespace at start/end
  return normalized.trim()
}

async function getCertificateBuffer(cert: FormDataEntryValue): Promise<Buffer> {
  if (cert instanceof File) {
    return Buffer.from(await cert.arrayBuffer())
  } else {
    return Buffer.from(cert as string, "utf8")
  }
}

async function extractCertificateInfo(certBuffer: Buffer): Promise<{ vatsk?: string; pokladnica?: string }> {
  try {
    const certString = certBuffer.toString("utf8")

    // Extract the base64 content between BEGIN and END CERTIFICATE
    const pemMatch = certString.match(/-----BEGIN CERTIFICATE-----\s*([\s\S]*?)\s*-----END CERTIFICATE-----/)
    if (!pemMatch) {
      return {}
    }

    const base64Cert = pemMatch[1].replace(/\s/g, "")
    const derBuffer = Buffer.from(base64Cert, "base64")

    let vatsk: string | undefined
    let pokladnica: string | undefined

    const flexibleVATSKPatterns = [/O=VATSK-(\d{10})/gi, /O\s*=\s*VATSK-(\d{10})/gi, /VATSK-(\d{10})/gi]

    const flexiblePOKLADNICAPatterns = [
      /POKLADNICA (\d{17})/gi,
      /OU=POKLADNICA (\d{17})/gi,
      /OU\s*=\s*POKLADNICA (\d{17})/gi,
      /POKLADNICA-(\d{17})/gi,
    ]

    // Extract VATSK
    for (const pattern of flexibleVATSKPatterns) {
      const match = pattern.exec(certString)
      if (match && match[1] && match[1].length === 10) {
        vatsk = match[1]
        break
      }
    }

    // Extract POKLADNICA
    for (const pattern of flexiblePOKLADNICAPatterns) {
      const match = pattern.exec(certString)
      if (match && match[1] && match[1].length === 17) {
        pokladnica = match[1]
        break
      }
    }

    // If not found in PEM string, try to decode the DER data
    if (!vatsk || !pokladnica) {
      const hexString = derBuffer.toString("hex")
      const asciiMatches =
        hexString
          .match(/.{2}/g)
          ?.map((hex) => String.fromCharCode(Number.parseInt(hex, 16)))
          .join("") || ""

      if (!vatsk) {
        for (const pattern of flexibleVATSKPatterns) {
          const match = pattern.exec(asciiMatches)
          if (match && match[1]) {
            vatsk = match[1]
            break
          }
        }
      }

      if (!pokladnica) {
        for (const pattern of flexiblePOKLADNICAPatterns) {
          const match = pattern.exec(asciiMatches)
          if (match && match[1]) {
            pokladnica = match[1]
            break
          }
        }
      }
    }

    console.log(`[v0] ✅ Certificate parsed - VATSK: ${vatsk}, POKLADNICA: ${pokladnica}`)
    return { vatsk, pokladnica }
  } catch (error) {
    console.log(`[v0] ❌ Certificate parsing error:`, error)
    return {}
  }
}

async function saveTransactionGeneration(data: {
  transaction_id?: string
  vatsk?: string
  pokladnica?: string
  iban?: string
  amount?: string
  end_point: 'PRODUCTION' | 'TEST'
  client_ip: string
  response_timestamp?: string
}) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("[v0] 💾 Attempting to save transaction generation:", {
      transaction_id: data.transaction_id,
      vatsk: data.vatsk,
      pokladnica: data.pokladnica,
      iban: data.iban,
      amount: data.amount,
      end_point: data.end_point,
      client_ip: data.client_ip,
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("[v0] ❌ Missing Supabase environment variables")
      return { success: false, error: "Missing database configuration" }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const numericAmount = data.amount ? Number.parseFloat(data.amount) : null

    const insertData = {
      transaction_id: data.transaction_id,
      vatsk: data.vatsk,
      pokladnica: data.pokladnica,
      iban: data.iban,
      amount: numericAmount,
      end_point: data.end_point,
      client_ip: data.client_ip,
      response_timestamp: data.response_timestamp,
    }
    console.log("[v0] 💾 Insert data:", insertData)

    const { data: result, error } = await supabase.from("transaction_generations").insert([insertData])

    if (error) {
      console.log("[v0] ❌ Database save failed:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] ✅ Transaction generation saved successfully:", result)
    return { success: true, result }
  } catch (error) {
    console.log("[v0] ❌ Database save error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIp(request)
  const rateLimitResult = rateLimit("/api/generate-transaction", clientIP, 2, 60000)

  if (!rateLimitResult.success) {
    const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
    return NextResponse.json(
      {
        error: "Too many requests",
        message: "Please try again later",
        retryAfter,
        resetTime: new Date(rateLimitResult.reset).toISOString(),
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": new Date(rateLimitResult.reset).toISOString(),
        },
      },
    )
  }

  const sessionId = randomUUID()
  let tempFiles: string[] = []

  try {
    console.log(`[v0] 🚀 Transaction generation started - Session: ${sessionId}, IP: ${clientIP}`)

    const formData = await request.formData()
    const clientCert = formData.get("clientCert")
    const clientKey = formData.get("clientKey")
    const caCert = formData.get("caCert")
    const iban = formData.get("iban") as string | null
    const amount = formData.get("amount") as string | null
    const isProductionMode = formData.get("isProductionMode") === "true"

    if (!clientCert || !clientKey || !caCert) {
      console.log(`[v0] ❌ Missing certificate files`)
      return NextResponse.json({ error: "Missing required certificate files" }, { status: 400 })
    }

    const clientCertBuffer = await getCertificateBuffer(clientCert)
    const clientKeyBuffer = await getCertificateBuffer(clientKey)
    const caCertBuffer = await getCertificateBuffer(caCert)

    // Validate and normalize PEM format
    const validatedClientCert = validateAndNormalizePEM(clientCertBuffer.toString("utf8"), "certificate")
    const validatedClientKey = validateAndNormalizePEM(clientKeyBuffer.toString("utf8"), "key")
    const validatedCaCert = validateAndNormalizePEM(caCertBuffer.toString("utf8"), "ca")

    console.log(`[v0] ✅ All certificates validated and normalized`)

    // Create temporary files
    const tempDir = tmpdir()
    const clientCertPath = join(tempDir, `${sessionId}-client.pem`)
    const clientKeyPath = join(tempDir, `${sessionId}-client.key`)
    const caCertPath = join(tempDir, `${sessionId}-ca.pem`)
    tempFiles = [clientCertPath, clientKeyPath, caCertPath]

    await Promise.all([
      writeFile(clientCertPath, validatedClientCert, { mode: 0o600 }),
      writeFile(clientKeyPath, validatedClientKey, { mode: 0o600 }),
      writeFile(caCertPath, validatedCaCert, { mode: 0o600 }),
    ])

    console.log(`[v0] ✅ Certificate files written with proper permissions`)

    // Extract VATSK and POKLADNICA from certificate
    const { vatsk, pokladnica } = await extractCertificateInfo(Buffer.from(validatedClientCert))

    const apiBaseUrl = isProductionMode ? "https://api-erp.kverkom.sk" : "https://api-erp-i.kverkom.sk"
    const endPoint = isProductionMode ? 'PRODUCTION' : 'TEST'

    console.log(
      `[v0] 🌐 Using ${endPoint} API: ${apiBaseUrl}/api/v1/generateNewTransactionId`,
    )

    // Execute API call without request body (as per bank API specification)
    const curlCommand = `curl -s -S -i -X POST ${apiBaseUrl}/api/v1/generateNewTransactionId --cert "${clientCertPath}" --key "${clientKeyPath}" --cacert "${caCertPath}"`

    console.log(`[v0] 🔄 Executing curl command...`)
    const { stdout, stderr } = await execAsync(curlCommand, { timeout: 30000 })

    if (stderr) {
      console.log(`[v0] ⚠️ API call stderr: ${stderr}`)
      throw new Error(`Curl error: ${stderr}`)
    }

    let responseData
    let statusCode = 200
    try {
      // Split headers and body (separated by \r\n\r\n or \n\n)
      const parts = stdout.split(/\r?\n\r?\n/)

      // The first part contains HTTP headers
      const headers = parts[0]

      // Extract status code from first line (e.g., "HTTP/1.1 200 OK")
      const statusMatch = headers.match(/HTTP\/[\d.]+\s+(\d+)/)
      if (statusMatch) {
        statusCode = Number.parseInt(statusMatch[1])
      }

      // The rest is the body (join in case body contains empty lines)
      const body = parts.slice(1).join("\n\n").trim()

      if (body) {
        responseData = JSON.parse(body)
        console.log(`[v0] ✅ Response parsed - Transaction ID: ${responseData.transaction_id}`)
      } else {
        responseData = { error: "Empty response body" }
      }
    } catch (parseError) {
      console.log(`[v0] ⚠️ Failed to parse response:`, parseError)
      responseData = { rawResponse: stdout.trim() }
    }

    const apiCreatedAt = responseData?.created_at || responseData?.createdAt || null

    saveTransactionGeneration({
      transaction_id: responseData?.transaction_id,
      vatsk,
      pokladnica,
      iban: iban || undefined,
      amount: amount || undefined,
      end_point: endPoint,
      client_ip: clientIP,
      response_timestamp: apiCreatedAt,
    }).catch((error) => {
      console.error("[v0] ⚠️ Background database save failed:", error)
    })

    console.log(
      `[v0] ✅ Transaction generation completed - ID: ${responseData?.transaction_id}`,
    )

    return NextResponse.json({
      success: true,
      data: responseData,
      clientIP,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`[v0] ❌ Transaction generation failed:`, error)

    await saveTransactionGeneration({
      end_point: 'TEST',
      client_ip: request.headers.get("x-forwarded-for") || request.ip || "unknown",
    })

    return NextResponse.json(
      {
        error: "API call failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  } finally {
    // Cleanup temporary files
    await Promise.allSettled(tempFiles.map((file) => unlink(file)))
  }
}
