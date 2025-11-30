import { type NextRequest, NextResponse } from "next/server"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"
import { exec } from "child_process"
import { promisify } from "util"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const execAsync = promisify(exec)

function validateAndNormalizePEM(pemContent: string, type: string): string {
  const normalized = pemContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

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

  if (!normalized.includes(beginMarker)) {
    throw new Error(`Invalid ${type} PEM format: missing BEGIN marker`)
  }

  if (!normalized.includes(endMarker)) {
    throw new Error(`Invalid ${type} PEM format: missing END marker`)
  }

  return normalized.trim()
}

async function getCertificateBuffer(cert: FormDataEntryValue): Promise<Buffer> {
  if (cert instanceof File) {
    return Buffer.from(await cert.arrayBuffer())
  } else {
    return Buffer.from(cert as string, "utf8")
  }
}

export async function POST(request: NextRequest, { params }: { params: { transactionId: string } }) {
  const clientIP = getClientIp(request)
  const rateLimitResult = rateLimit("/api/get-transaction-history", clientIP)

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
    const { transactionId } = params

    if (!transactionId) {
      console.log(`[v0] ❌ Missing transaction ID`)
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 })
    }

    console.log(
      `[v0] 🚀 Transaction history fetch started - Session: ${sessionId}, Transaction: ${transactionId}, IP: ${clientIP}`,
    )

    const formData = await request.formData()
    const clientCert = formData.get("clientCert")
    const clientKey = formData.get("clientKey")
    const caCert = formData.get("caCert")
    const isProductionMode = formData.get("isProductionMode") === "true"

    if (!clientCert || !clientKey || !caCert) {
      console.log(`[v0] ❌ Missing certificate files`)
      return NextResponse.json({ error: "Missing required certificate files" }, { status: 400 })
    }

    const clientCertBuffer = await getCertificateBuffer(clientCert)
    const clientKeyBuffer = await getCertificateBuffer(clientKey)
    const caCertBuffer = await getCertificateBuffer(caCert)

    const validatedClientCert = validateAndNormalizePEM(clientCertBuffer.toString("utf8"), "certificate")
    const validatedClientKey = validateAndNormalizePEM(clientKeyBuffer.toString("utf8"), "key")
    const validatedCaCert = validateAndNormalizePEM(caCertBuffer.toString("utf8"), "ca")

    console.log(`[v0] ✅ All certificates validated and normalized`)

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

    const apiBaseUrl = isProductionMode ? "https://api-erp.kverkom.sk" : "https://api-erp-i.kverkom.sk"
    const endPoint = isProductionMode ? "PRODUCTION" : "TEST"

    console.log(`[v0] 🌐 Using ${endPoint} API: ${apiBaseUrl}/api/v1/getTransactionHistory/${transactionId}`)

    const curlCommand = `curl -s -S -i -X GET ${apiBaseUrl}/api/v1/getTransactionHistory/${transactionId} --cert "${clientCertPath}" --key "${clientKeyPath}" --cacert "${caCertPath}"`

    console.log(`[v0] 🔄 Executing curl command...`)
    const { stdout, stderr } = await execAsync(curlCommand, { timeout: 30000 })

    if (stderr) {
      console.log(`[v0] ⚠️ API call stderr: ${stderr}`)
      throw new Error(`Curl error: ${stderr}`)
    }

    let responseData
    let statusCode = 200
    try {
      const parts = stdout.split(/\r?\n\r?\n/)
      const headers = parts[0]

      // Extract status code
      const statusMatch = headers.match(/HTTP\/[\d.]+\s+(\d+)/)
      if (statusMatch) {
        statusCode = Number.parseInt(statusMatch[1])
      }

      const body = parts.slice(1).join("\n\n").trim()

      if (body) {
        responseData = JSON.parse(body)
        console.log(`[v0] ✅ Transaction history retrieved - Status: ${responseData.status}`)
      } else {
        responseData = { error: "Empty response body" }
      }
    } catch (parseError) {
      console.log(`[v0] ⚠️ Failed to parse response:`, parseError)
      responseData = { rawResponse: stdout.trim() }
    }

    console.log(`[v0] ✅ Transaction history fetch completed - Transaction: ${transactionId}`)

    return NextResponse.json({
      success: true,
      data: responseData,
      clientIP,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`[v0] ❌ Transaction history fetch failed:`, error)

    return NextResponse.json(
      {
        error: "API call failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  } finally {
    await Promise.allSettled(tempFiles.map((file) => unlink(file)))
  }
}
