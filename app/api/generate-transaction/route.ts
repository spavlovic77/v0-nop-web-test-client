import { type NextRequest, NextResponse } from "next/server"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"
import { exec } from "child_process"
import { promisify } from "util"
import { createClient } from "@supabase/supabase-js"

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
  status_code: number
  duration_ms: number
  client_ip: string
  response_timestamp?: string
}) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("[v0] ❌ Missing Supabase environment variables")
      return { success: false, error: "Missing database configuration" }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const numericAmount = data.amount ? Number.parseFloat(data.amount) : null

    const { data: result, error } = await supabase.from("transaction_generations").insert([
      {
        transaction_id: data.transaction_id,
        vatsk: data.vatsk,
        pokladnica: data.pokladnica,
        iban: data.iban,
        amount: numericAmount,
        status_code: data.status_code,
        duration_ms: data.duration_ms,
        client_ip: data.client_ip,
        response_timestamp: data.response_timestamp,
      },
    ])

    if (error) {
      console.log("[v0] ❌ Database save failed:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] ✅ Transaction generation saved successfully")
    return { success: true, result }
  } catch (error) {
    console.log("[v0] ❌ Database save error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function POST(request: NextRequest) {
  const sessionId = randomUUID()
  let tempFiles: string[] = []
  const startTime = Date.now()

  try {
    const clientIP = request.headers.get("x-forwarded-for") || request.ip || "unknown"
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

    // Prepare request body with transaction details
    const requestBody = {
      iban: iban || "",
      amount: amount || "0.00",
      vatsk: vatsk || "",
      pokladnica: pokladnica || "",
    }

    const requestBodyJson = JSON.stringify(requestBody)
    console.log(`[v0] 📦 Request body:`, requestBody)

    // Execute API call with request body
    const curlCommand = `curl -s -S -X POST ${apiBaseUrl}/api/v1/transactions --cert "${clientCertPath}" --key "${clientKeyPath}" --cacert "${caCertPath}" -H "Content-Type: application/json" -d '${requestBodyJson}'`

    console.log(`[v0] 🔄 Executing curl command...`)
    const { stdout, stderr } = await execAsync(curlCommand, { timeout: 30000 })

    if (stderr) {
      console.log(`[v0] ⚠️ API call stderr: ${stderr}`)
      throw new Error(`Curl error: ${stderr}`)
    }

    // Parse response
    let responseData
    try {
      responseData = stdout ? JSON.parse(stdout.trim()) : { message: "Empty response" }
    } catch {
      responseData = { rawResponse: stdout.trim() }
    }

    const duration = Date.now() - startTime

    const apiCreatedAt = responseData?.created_at || responseData?.createdAt || null

    saveTransactionGeneration({
      transaction_id: responseData?.transaction_id,
      vatsk,
      pokladnica,
      iban: iban || undefined,
      amount: amount || undefined,
      status_code: 200,
      duration_ms: duration,
      client_ip: clientIP,
      response_timestamp: apiCreatedAt,
    }).catch((error) => {
      console.error("[v0] ⚠️ Database save failed:", error)
    })

    console.log(
      `[v0] ✅ Transaction generation completed - ID: ${responseData?.transaction_id}, Duration: ${duration}ms`,
    )

    return NextResponse.json({
      success: true,
      data: responseData,
      clientIP,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`[v0] ❌ Transaction generation failed:`, error)

    const duration = Date.now() - startTime

    saveTransactionGeneration({
      status_code: 500,
      duration_ms: duration,
      client_ip: request.headers.get("x-forwarded-for") || request.ip || "unknown",
    }).catch((error) => {
      console.error("[v0] ⚠️ Error database save failed:", error)
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
