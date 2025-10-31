import { type NextRequest, NextResponse } from "next/server"
import * as forge from "node-forge"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const clientIP = getClientIp(request)
  const rateLimitResult = rateLimit("/api/convert-p12-to-pem", clientIP, 2, 60000)

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

  try {
    const formData = await request.formData()
    const p12File = formData.get("p12File") as File
    const password = (formData.get("password") as string) || ""

    console.log("[v0] P12 conversion - File size:", p12File?.size, "Password provided:", !!password)

    if (!p12File) {
      return NextResponse.json({ error: "No P12 file provided" }, { status: 400 })
    }

    const p12Buffer = Buffer.from(await p12File.arrayBuffer())
    console.log("[v0] P12 conversion - Buffer size:", p12Buffer.length)

    try {
      console.log("[v0] P12 conversion - Starting PKCS12 parsing...")

      // Parse PKCS12 using node-forge
      const p12Der = forge.util.decode64(p12Buffer.toString("base64"))
      console.log("[v0] P12 conversion - Base64 decoded, DER size:", p12Der.length)

      const p12Asn1 = forge.asn1.fromDer(p12Der)
      console.log("[v0] P12 conversion - ASN.1 parsed successfully")

      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)
      console.log("[v0] P12 conversion - PKCS12 parsed successfully")

      // Extract certificate and private key
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })

      console.log("[v0] P12 conversion - Cert bags found:", Object.keys(certBags).length)
      console.log("[v0] P12 conversion - Key bags found:", Object.keys(keyBags).length)

      if (!certBags[forge.pki.oids.certBag] || certBags[forge.pki.oids.certBag].length === 0) {
        console.log("[v0] P12 conversion - No certificate found in P12 file")
        return NextResponse.json({ error: "No certificate found in P12 file" }, { status: 400 })
      }

      if (!keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || keyBags[forge.pki.oids.pkcs8ShroudedKeyBag].length === 0) {
        console.log("[v0] P12 conversion - No private key found in P12 file")
        return NextResponse.json({ error: "No private key found in P12 file" }, { status: 400 })
      }

      // Convert to PEM format
      const cert = certBags[forge.pki.oids.certBag][0]
      const key = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0]

      console.log("[v0] P12 conversion - Converting to PEM format...")
      const certificate = forge.pki.certificateToPem(cert.cert!)
      const privateKey = forge.pki.privateKeyToPem(key.key!)

      let vatsk = null
      try {
        const certObj = cert.cert!
        const subject = certObj.subject
        console.log("[v0] P12 conversion - Certificate subject attributes:", subject.attributes.length)

        for (const attr of subject.attributes) {
          if (attr.value && typeof attr.value === "string") {
            const vatskMatch = attr.value.match(/VATSK-(\d{10})/)
            if (vatskMatch) {
              console.log(
                "[v0] P12 conversion - Found VATSK pattern in",
                attr.shortName || attr.name,
                ":",
                vatskMatch[1],
              )
              vatsk = vatskMatch[1]
              break
            }
          }
        }

        // Fallback: if no VATSK- pattern found, look for any 10-digit number
        if (!vatsk) {
          for (const attr of subject.attributes) {
            if (attr.value && typeof attr.value === "string") {
              const match = attr.value.match(/\b\d{10}\b/)
              if (match) {
                console.log(
                  "[v0] P12 conversion - Found 10-digit number in",
                  attr.shortName || attr.name,
                  ":",
                  match[0],
                )
                vatsk = match[0]
                break
              }
            }
          }
        }

        console.log("[v0] P12 conversion - Extracted VATSK:", vatsk)
      } catch (subjectError) {
        console.error("[v0] P12 conversion - Error extracting VATSK:", subjectError)
      }

      console.log(
        "[v0] P12 conversion - Conversion successful, cert length:",
        certificate.length,
        "key length:",
        privateKey.length,
      )

      return NextResponse.json({
        certificate,
        privateKey,
        vatsk, // Include extracted VATSK value
      })
    } catch (conversionError) {
      console.error("[v0] P12 conversion error:", conversionError)
      return NextResponse.json(
        {
          error: "Failed to convert P12 to PEM",
          details: `PKCS12 parsing failed: ${conversionError instanceof Error ? conversionError.message : conversionError}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] P12 conversion server error:", error)
    return NextResponse.json(
      {
        error: "Server error during P12 conversion",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
