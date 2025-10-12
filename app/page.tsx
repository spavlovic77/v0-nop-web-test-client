"use client"

import React from "react"
import type { FunctionComponent } from "react"
import { Copy, XCircle } from "lucide-react" // Import Copy icon
import { Euro, LogOut, Printer, Calendar } from "lucide-react" // Import Euro, Printer, Calendar icons

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle, X, Terminal, WifiOff, User, Clock, Info, QrCode, MoveLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload } from "lucide-react"
import QRCode from "qrcode"
import { createClient } from "@supabase/supabase-js"

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("[v0] Error boundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 text-center">
            <h2 className="text-lg font-semibold text-red-600">Niečo sa pokazilo</h2>
            <p className="text-sm text-muted-foreground mt-2">Obnovte stránku a skúste znova</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Obnoviť stránku
            </Button>
          </div>
        )
      )
    }
    return this.props.children
  }
}

const EMBEDDED_CA_BUNDLE = `-----BEGIN CERTIFICATE-----
MIIGtjCCBZ6gAwIBAgIQD5vKo3PlurovWKWm0kLBHzANBgkqhkiG9w0BAQsFADBg
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMR8wHQYDVQQDExZHZW9UcnVzdCBUTFMgUlNBIENBIEcx
MB4XDTI1MDgwNTAwMDAwMFoXDTI2MDgwNDIzNTk1OVowgYExCzAJBgNVBAYTAlNL
MRkwFwYDVQQHDBBCYW5za8OhIEJ5c3RyaWNhMTYwNAYDVQQKDC1GaW5hbsSNbsOp
IHJpYWRpdGXEvHN0dm8gU2xvdmVuc2tlaiByZXB1Ymxpa3kxHzAdBgNVBAMTFmFw
aS1iYW5rYS1pLmt2ZXJrb20uc2swggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEK
AoIBAQCyZEsLS5QBSoporFEs/Ai95eRX+5+Fw+Gknd77BKRiJCu7GIset9e4lZTc
vragFlRV0xEXj9MX8QXsgChuAD5qWxqhrrkCsRNH2u3QTQMNjGtE2tSKpl9l3XdK
cVcJ+pqvalo+1JVAzRFFjJJno02WgBfGvp9CXd/8fd4D7/mgW8f9Uy8BhxRjBuMB
E4c2WzJVW5ycwaafBYeR6hwoyNxfUCQ23IVNuF6+fn2nB90FBFhU78QFhTj6BT8Y
dQ3Q6zm7sI0yXwdAp5/ZGKV590Q073wOxdh4PuQSPo8E/F3jn37761MnJrIcF3z+
L8icdP5Tj/AVKfNmOx3rswbxriCJAgMBAAGjggNIMIIDRDAfBgNVHSMEGDAWgBSU
T9Rdi+Sk4qaA/v3Y+QDvo74CVzAdBgNVHQ4EFgQUQnBHRuo8MCE0vmA9poBNOES2
G74wSgYDVR0RBEMwQYIWYXBpLWJhbmthLWkua3ZlcmtvbS5za4IUYXBpLWVycC1p
Lmt2ZXJrb20uc2uCEW1xdHQtaS5rdmVya29tLnNrMD4GA1UdIAQ3MDUwMwYGZ4EM
AQICMCkwJwYIKwYBBQUHAgEWG2h0dHA6Ly93d3cuZGlnaWNlcnQuY29tL0NQUzAO
BgNVHQ8BAf8EBAMCBaAwHQYDVR0lBBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMCMD8G
A1UdHwQ4MDYwNKAyoDCGLmh0dHA6Ly9jZHAuZ2VvdHJ1c3QuY29tL0dlb1RydXN0
VExTUlNBQ0FHMS5jcmwwdgYIKwYBBQUHAQEEajBoMCYGCCsGAQUFBzABhhpodHRw
Oi8vc3RhdHVzLmdlb3RydXN0LmNvbTA+BggrBgEFBQcwAoYyaHR0cDovL2NhY2Vy
dHMuZ2VvdHJ1c3QuY29tL0dlb1RydXN0VExTUlNBQ0FHMS5jcnQwDAYDVR0TAQH/
BAIwADCCAX4GCisGAQQB1nkCBAIEggFuBIIBagFoAHUA1219ENGn9XfCx+lf1wC/
+YLJM1pl4dCzAXMXwMjFaXcAAAGYeRNtNAAABAMARjBEAiAiuXz6EYiA1JmlwRyD
pik9U0hTP/2x5IlOMJtGsHw0aQIgauYi79hye7ZZCLQdFw5x7lX2v9UQNpp/Yc6+
3h4/lLsAdgDCMX5XRRmjRe5/ON6ykEHrx8IhWiK/f9W1rXaa2Q5SzQAAAZh5E21z
AAAEAwBHMEUCIBPYgzw54o8ME4imD0OvNGQqk2MZVuWsQVaM7kEUqQfNAiEAju//
4YMOmYFgZyf1mXpQtjTbtwqIt6XDdX99VmmUtwgAdwCUTkOH+uzB74HzGSQmqBhl
AcfTXzgCAT9yZ31VNy4Z2AAAAZh5E22FAAAEAwBIMEYCIQDwAYPZkrGQn8jOJbVt
VQXeUoBAWKwk5BeBeFQv2c17mQIhANQmIJKkkJ+o1mRnJ6V/9OMqyE45bAahUJiW
IMAqmw+8MA0GCSqGSIb3DQEBCwUAA4IBAQAOhZc04PXtMw0px7samnDkdBLBgtSK
tf4YqaAgCXa1Mrl/Wz6qFlgujIz4rXqy6b1zTlqlmpmT/9wXUM6wJ/UerRosFvyw
+KJzi8wFKRdktIe6YckdR5OqScNOpb3WJe6sySCMh9CcdEB/RgvJdfr2iHttPllM
txckPbRer3T1YsGusZVO3PljQwJdSB+mblUXwBlYVIFtPeEwlSdPSMxfBaRRGaW4
Jm2Nt5ymR8y6DfkqPAhbNw0EIVa+MMphsV5vWCRwZd1KyHoBWN8fQkkZixj3Onpl
CeQY+5U8ixbAl71NxbGEWhXudbAf+Alu3ic251/AX/u2ridRKKdX67/8
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIDjjCCAnagAwIBAgIQAzrx5qcRqaC7KGSxHQn65TANBgkqhkiG9w0BAQsFADBh
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBH
MjAeFw0xMzA4MDExMjAwMDBaFw0zODAxMTUxMjAwMDBaMGExCzAJBgNVBAYTAlVT
MRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxGTAXBgNVBAsTEHd3dy5kaWdpY2VydC5j
b20xIDAeBgNVBAMTF0RpZ2lDZXJ0IEdsb2JhbCBSb290IEcyMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuzfNNNx7a8myaJCtSnX/RrohCgiN9RlUyfuI
2/Ou8jqJkTx65qsGGmvPrC3oXgkkRLpimn7Wo6h+4FR1IAWsULecYxpsMNzaHxmx
1x7e/dfgy5SDN67sH0NO3Xss0r0upS/kqbitOtSZpLYl6ZtrAGCSYP9PIUkY92eQ
q2EGnI/yuum06ZIya7XzV+hdG82MHauVBJVJ8zUtluNJbd134/tJS7SsVQepj5Wz
tCO7TG1F8PapspUwtP1MVYwnSlcUfIKdzXOS0xZKBgyMUNGPHgm+F6HmIcr9g+UQ
vIOlCsRnKPZzFBQ9RnbDhxSJITRNrw9FDKZJobq7nMWxM4MphQIDAQABo0IwQDAP
BgNVHRMBAf8EBTADAQH/MA4GA1UdDwEB/wQEAwIBhjAdBgNVHQ4EFgQUTiJUIBiV
5uNu5g/6+rkS7QYXjzkwDQYJKoZIhvcNAQELBQADggEBAGBnKJRvDkhj6zHd6mcY
1Yl9PMWLSn/pvtsrF9+wX3N3KjITOYFnQoQj8kVnNeyIv/iPsGEMNKSuIEyExtv4
NeF22d+mQrvHRAiGfzZ0JFrabA0UWTW98kndth/Jsw1HKj2ZL7tcu7XUIOGZX1NG
Fdtom/DzMNU+MeKNhJ7jitralj41E6Vf8PlwUHBHQRFXGU7Aj64GxJUTFy8bJZ91
8rGOmaFvE7FBcf6IKshPECBV1/MUReXgRPTqh5Uykw7+U0b6LJ3/iyK5S9kJRaTe
pLiaWN0bfVKfjllDiIGknibVb63dDcY3fe0Dkhvld1927jyNxF1WW6LZZm6zNTfl
MrY=
-----END CERTIFICATE-----`

interface CertificateFiles {
  xmlAuthData: File | null
  convertedCertPem?: string
  convertedKeyPem?: string
  xmlPassword: string
  vatsk?: string
  pokladnica?: string
  caCert: File | null
}

interface CertificateInfo {
  pokladnica: string
  ico: string
  dic: string
  icDph: string
  obchodnyNazov: string
  ulica: string
  cislo: string
  psc: string
  obec: string
  krajina: string
}

interface ApiCallLog {
  timestamp: Date
  endpoint: string
  method: string
  status: number
  request?: any
  response?: any
  error?: string
  duration?: number
}

const isValidIbanFormat = (iban: string) => {
  const cleanIban = iban.replace(/\s/g, "")
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/
  return ibanRegex.test(cleanIban) && cleanIban.length === 24
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Only create Supabase client if we have valid credentials
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const Home: FunctionComponent = () => {
  const cleanupRef = useRef<(() => void)[]>([])
  const qrDataUrlRef = useRef<string | null>(null)
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set())

  const [files, setFiles] = useState<CertificateFiles>({
    xmlAuthData: null,
    xmlPassword: "",
    caCert: null,
  })
  const [userIban, setUserIban] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [mqttLoading, setMqttLoading] = useState(false)
  const [bankLoading, setBankLoading] = useState(false)
  const [transactionSuccess, setTransactionSuccess] = useState(false)
  const [certificateSectionCollapsed, setCertificateSectionCollapsed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMqttModal, setShowMqttModal] = useState(false)
  const [mqttPayload, setMqttPayload] = useState<any>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [mqttConnected, setMqttConnected] = useState(false)
  const [mqttMessages, setMqttMessages] = useState<string[]>([])
  const [response, setResponse] = useState<any | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [eurAmount, setEurAmount] = useState<string>("")
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrTransactionId, setQrTransactionId] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [subscriptionActive, setSubscriptionActive] = useState(false)
  const [showPaymentReceivedModal, setShowPaymentReceivedModal] = useState(false)
  const [confirmedPaymentAmount, setConfirmedPaymentAmount] = useState<string>("")
  const [showConsoleModal, setShowConsoleModal] = useState(false)
  const [apiCallLogs, setApiCallLogs] = useState<ApiCallLog[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanToggleActive, setScanToggleActive] = useState(false)
  const [scanTimeRemaining, setScanTimeRemaining] = useState(0)
  const [verifyingIntegrity, setVerifyingIntegrity] = useState(false)
  const [integrityVerified, setIntegrityVerified] = useState(false)
  const [integrityError, setIntegrityError] = useState(false)

  const [showTransactionListModal, setShowTransactionListModal] = useState(false)
  const [showTransactionDateModal, setShowTransactionDateModal] = useState(false)
  const [selectedTransactionDate, setSelectedTransactionDate] = useState<string>("")
  const [transactionListData, setTransactionListData] = useState<any[]>([])
  const [transactionListLoading, setTransactionListLoading] = useState(false)

  const [certificateInfo, setCertificateInfo] = useState<{
    vatsk: string | null
    pokladnica: string | null
  }>({
    vatsk: null,
    pokladnica: null,
  })

  const [configurationSaved, setConfigurationSaved] = useState(false)
  const [savingConfiguration, setSavingConfiguration] = useState(false)

  const logApiCall = (log: ApiCallLog) => {
    setApiCallLogs((prev) => [...prev, log].slice(-20)) // Keep only last 20 logs
  }

  const clearApiLogs = () => {
    setApiCallLogs([])
  }

  const generatePaymentLink = (amount: string, transactionId: string) => {
    const params = new URLSearchParams({
      V: "1", // Version
      IBAN: userIban.replace(/\s/g, ""), // Remove spaces from IBAN for payment link
      AM: amount, // Amount from user
      CC: "EUR", // Currency
      CN: "Kverkom s.r.o.", // Creditor name (fabricated)
      PI: transactionId, // Payment identification (EndToEnd as Transaction ID)
      MSG: "Payment+via+mobile+app", // Fabricated message
    })

    return `https://payme.sk/?${params.toString()}`
  }

  const sanitizeInput = useCallback((input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
  }, [])

  const validateIbanSecure = useCallback(
    (iban: string): boolean => {
      const sanitized = sanitizeInput(iban).replace(/\s/g, "").toUpperCase()
      if (sanitized.length < 15 || sanitized.length > 34) return false

      // Enhanced IBAN validation with checksum
      const rearranged = sanitized.slice(4) + sanitized.slice(0, 4)
      const numericString = rearranged.replace(/[A-Z]/g, (char) => (char.charCodeAt(0) - 55).toString())

      let remainder = 0
      for (let i = 0; i < numericString.length; i++) {
        remainder = (remainder * 10 + Number.parseInt(numericString[i])) % 97
      }

      return remainder === 1
    },
    [sanitizeInput],
  )

  const handleApiCallWithRetry = useCallback(async (apiCall: () => Promise<any>, maxRetries = 3, delay = 1000) => {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall()
      } catch (error) {
        lastError = error as Error
        console.error(`[v0] API call attempt ${attempt} failed:`, error)

        if (attempt < maxRetries) {
          const backoffDelay = delay * Math.pow(2, attempt - 1)
          await new Promise((resolve) => {
            const timer = setTimeout(resolve, backoffDelay)
            timersRef.current.add(timer)
          })
        }
      }
    }

    throw lastError
  }, [])

  const generateQrCodeSecure = useCallback(async (data: string): Promise<string> => {
    try {
      // Clean up previous QR code data URL
      if (qrDataUrlRef.current) {
        URL.revokeObjectURL(qrDataUrlRef.current)
        qrDataUrlRef.current = null
      }

      const qrDataUrl = await QRCode.toDataURL(data, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
      })

      qrDataUrlRef.current = qrDataUrl
      return qrDataUrl
    } catch (error) {
      console.error("[v0] QR code generation failed:", error)
      throw new Error("QR kód sa nepodarilo vygenerovať")
    }
  }, [])

  const generateQRCode = async (text: string): Promise<string> => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(text, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
      return qrCodeDataUrl
    } catch (error) {
      console.error("[v0] QR code generation failed:", error)
      throw new Error("Failed to generate QR code")
    }
  }

  const formatIban = (value: string) => {
    // Remove all spaces and convert to uppercase
    const cleanValue = value.replace(/\s/g, "").toUpperCase()
    // Add space every 4 characters
    return cleanValue.replace(/(.{4})/g, "$1 ").trim()
  }

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      console.error("[v0] Supabase client not initialized - missing environment variables")
    }
  }, [])

  useEffect(() => {
    return () => {
      // Run custom cleanup functions
      cleanupRef.current.forEach((cleanup) => cleanup())
      cleanupRef.current.length = 0
    }
  }, [])

  const handleFileChange = async (type: keyof CertificateFiles, file: File | null) => {
    setFiles((prev) => ({ ...prev, [type]: file }))
  }

  const convertXmlToPem = useCallback(
    async (xmlFile: File, password: string): Promise<{ certPem: string; keyPem: string } | null> => {
      try {
        const xmlContent = await xmlFile.text()

        const aliasMatch = xmlContent.match(/<eu:CertificateAlias>(.*?)<\/eu:CertificateAlias>/s)
        const pokladnica = aliasMatch ? aliasMatch[1].trim() : null

        // Extract base64 data from <eu:Data> element
        const dataMatch = xmlContent.match(/<eu:Data>(.*?)<\/eu:Data>/s)
        if (!dataMatch) {
          throw new Error("Could not find <eu:Data> element in XML file")
        }

        const base64Data = dataMatch[1].trim()

        // Convert base64 to binary
        const binaryData = atob(base64Data)
        const uint8Array = new Uint8Array(binaryData.length)
        for (let i = 0; i < binaryData.length; i++) {
          uint8Array[i] = binaryData.charCodeAt(i)
        }

        // Call server endpoint to convert P12 to PEM with password
        const formData = new FormData()
        const p12Blob = new Blob([uint8Array], { type: "application/x-pkcs12" })
        formData.append("p12File", p12Blob, "cert.p12")
        formData.append("password", password)

        const response = await fetch("/api/convert-p12-to-pem", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Failed to convert P12 to PEM")
        }

        const result = await response.json()

        const vatsk = result.vatsk || null
        setCertificateInfo({
          vatsk,
          pokladnica,
        })

        return {
          certPem: result.certificate,
          keyPem: result.privateKey,
        }
      } catch (error) {
        console.error("XML to PEM conversion error:", error)
        return null
      }
    },
    [],
  )

  const downloadPemFile = (pemContent: string, filename: string) => {
    const blob = new Blob([pemContent], { type: "application/x-pem-file" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const validateFiles = () => {
    if (!files.xmlAuthData || !files.caCert) {
      setError("Please upload all required files including XML authentication data")
      return false
    }
    return true
  }

  const subscribeToBankNotifications = async () => {
    if (!validateFiles()) return

    setMqttLoading(true)
    setError(null)
    setMqttMessages([])
    setMqttConnected(false)

    const vatskValue = certificateInfo.vatsk || "1234567890"
    const pokladnicaValue = certificateInfo.pokladnica || "88812345678900001"
    const topic = `VATSK-${vatskValue}/POKLADNICA-${pokladnicaValue}/${transactionId || "QR-01c40ef8bb2541659c2bd4abfb6a9964"}`
    console.log("[v0] Subscribing to MQTT topic:", topic)

    const startTime = Date.now()
    const logEntry: ApiCallLog = {
      timestamp: new Date(),
      endpoint: "/api/mqtt-subscribe",
      method: "POST",
      status: 0,
    }

    try {
      setMqttConnected(true)
      setMqttMessages([`🔄 Starting MQTT subscription to topic: ${topic}`])
      setMqttLoading(false)

      const formData = new FormData()
      if (files.convertedCertPem && files.convertedKeyPem) {
        formData.append("clientCert", files.convertedCertPem)
        formData.append("clientKey", files.convertedKeyPem)
      } else {
        throw new Error("Certificate files not properly converted")
      }
      formData.append("caCert", files.caCert!)
      formData.append("certificateSecret", files.xmlPassword!)
      if (transactionId) {
        formData.append("transactionId", transactionId)
      }
      formData.append("vatsk", vatskValue)
      formData.append("pokladnica", pokladnicaValue)

      const res = await fetch("/api/mqtt-subscribe", {
        method: "POST",
        body: formData,
      })

      logEntry.status = res.status
      logEntry.duration = Date.now() - startTime

      const data = await res.json()
      console.log("[v0] MQTT subscribe API response data:", data)

      if (data.databaseOperation) {
        console.log("[v0] Database operation status:", data.databaseOperation.status)
        console.log("[v0] Database operation attempted:", data.databaseOperation.attempted)
        if (data.databaseOperation.error) {
          console.log("[v0] Database operation error:", data.databaseOperation.error)
        }
        if (data.databaseOperation.result) {
          console.log("[v0] Database operation result:", data.databaseOperation.result)
        }
      } else {
        console.log("[v0] No database operation field in response")
      }

      logEntry.response = data

      if (data.communicationLog && Array.isArray(data.communicationLog)) {
        setMqttMessages(data.communicationLog)
      } else {
        setMqttMessages((prev) => [...prev, `📡 MQTT subscription completed`])
      }

      if (data.hasMessages && data.messages && data.messages.length > 0) {
        console.log("[v0] MQTT messages found:", data.messages)
        setMqttPayload(data.messages)
        setShowMqttModal(true)
        setMqttMessages((prev) => [...prev, `🎉 ${data.messages.length} message(s) received - showing modal`])
      } else {
        setMqttMessages((prev) => [...prev, `📭 No messages received during listening period`])
      }

      setMqttConnected(false)
    } catch (err) {
      console.log("[v0] MQTT subscription error:", err)
      logEntry.response = { error: err instanceof Error ? err.message : "An error occurred" }
      setError(err instanceof Error ? err.message : "An error occurred")
      setMqttLoading(false)
      setMqttConnected(false)
      setMqttMessages((prev) => [...prev, `❌ Error: ${err instanceof Error ? err.message : "Unknown error"}`])
    } finally {
      logApiCall(logEntry)
    }
  }

  const stopMqttSubscription = () => {
    setMqttConnected(false)
    setMqttMessages([])
  }

  const allRequiredFieldsComplete = files.xmlAuthData && files.xmlPassword && userIban && configurationSaved

  const roundToFiftyCents = (value: string) => {
    const num = Number.parseFloat(value)
    if (isNaN(num)) return ""
    const rounded = Math.round(num * 2) / 2
    return rounded.toFixed(2)
  }

  const handleEurAmountChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/[^0-9]/g, "")

    // Limit to reasonable amount (max 7 digits = 99999.99 EUR)
    if (digitsOnly.length <= 7) {
      setEurAmount(digitsOnly)
    }
  }

  const formatEurAmountDisplay = (digits: string) => {
    if (!digits || digits === "0") return "0,00"

    const cleanDigits = digits.replace(/^0+/, "") || "0"

    // Pad with leading zeros to ensure at least 2 digits for cents
    const paddedDigits = cleanDigits.padStart(2, "0")

    // Split into euros and cents (last 2 digits are always cents)
    const cents = paddedDigits.slice(-2)
    const euros = paddedDigits.slice(0, -2) || "0"

    // Format euros with thousands separator if needed
    const formattedEuros = euros.replace(/\B(?=(\d{3})+(?!\d))/g, " ")

    return `${formattedEuros},${cents}`
  }

  const getEurAmountValue = () => {
    if (!eurAmount) return "0.00"

    const cleanDigits = eurAmount.replace(/^0+/, "") || "0"
    const paddedDigits = cleanDigits.padStart(2, "0")
    const cents = paddedDigits.slice(-2)
    const euros = paddedDigits.slice(0, -2) || "0"

    return `${euros}.${cents}`
  }

  const handleQrGeneration = async () => {
    const validationLogEntry: ApiCallLog = {
      timestamp: new Date(),
      endpoint: "/api/generate-transaction",
      method: "POST",
      status: 0,
      error: "",
    }

    if (!configurationSaved) {
      console.log("[v0] EARLY RETURN: Configuration not saved yet")
      validationLogEntry.error = "Configuration not saved yet"
      logApiCall(validationLogEntry)
      setError("Please save configuration first")
      return
    }

    if (!files.convertedCertPem || !files.convertedKeyPem) {
      console.log("[v0] EARLY RETURN: PEM files not available")
      console.log("[v0] convertedCertPem length:", files.convertedCertPem?.length || 0)
      console.log("[v0] convertedKeyPem length:", files.convertedKeyPem?.length || 0)
      validationLogEntry.error = "Certificate files not properly converted"
      logApiCall(validationLogEntry)
      setError("Certificate files not properly converted")
      return
    }

    const numericAmount = getEurAmountValue()
    console.log("[v0] numericAmount:", numericAmount)
    console.log("[v0] parsed amount:", Number.parseFloat(numericAmount))
    console.log("[v0] amount > 0:", Number.parseFloat(numericAmount) > 0)

    if (numericAmount && Number.parseFloat(numericAmount) > 0) {
      console.log("[v0] VALIDATION PASSED - Starting QR generation process...")
      setShowQrModal(true)
      setQrLoading(true)
      setQrTransactionId(null)
      setQrCode(null)
      setSubscriptionActive(false)

      const startTime = Date.now()
      const logEntry: ApiCallLog = {
        timestamp: new Date(),
        endpoint: "/api/generate-transaction",
        method: "POST",
        status: 0,
      }

      try {
        console.log("[v0] Starting QR generation process...")

        const formData = new FormData()
        formData.append("clientCert", files.convertedCertPem)
        formData.append("clientKey", files.convertedKeyPem)
        formData.append("caCert", files.caCert!)
        formData.append("certificateSecret", files.xmlPassword!)

        console.log("[v0] FormData prepared, making API call to generate transaction...")
        const res = await fetch("/api/generate-transaction", {
          method: "POST",
          body: formData,
        })

        console.log("[v0] API response received, status:", res.status)

        logEntry.status = res.status
        logEntry.duration = Date.now() - startTime

        const contentType = res.headers.get("content-type")
        let data

        if (contentType && contentType.includes("application/json")) {
          data = await res.json()
          console.log("[v0] Parsed JSON response:", data)
        } else {
          const text = await res.text()
          console.log("[v0] Non-JSON response:", text)
          throw new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 200)}`)
        }

        logEntry.response = data

        if (!res.ok) {
          console.log("[v0] API call failed with error:", data.error)
          throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`)
        }

        let transactionId = null
        if (data.data && data.data.transactionId) {
          transactionId = data.data.transactionId
          console.log("[v0] Found transaction ID in data.transactionId:", transactionId)
        } else if (data.data && typeof data.data === "object") {
          transactionId = data.data.transactionId || data.data.id || data.data.transaction_id
          console.log("[v0] Found transaction ID in nested object:", transactionId)
        } else if (data.transactionId) {
          transactionId = data.transactionId
          console.log("[v0] Found transaction ID at root level:", transactionId)
        } else {
          console.log("[v0] Full response structure:", JSON.stringify(data, null, 2))
          throw new Error("No transaction ID found in response")
        }

        if (transactionId) {
          console.log("[v0] Using transaction ID:", transactionId)
          setQrTransactionId(transactionId)

          console.log("[v0] Generating payment link...")
          const paymentLink = generatePaymentLink(numericAmount, transactionId)
          console.log("[v0] Payment link generated:", paymentLink)

          console.log("[v0] Generating QR code...")
          const qrCodeDataUrl = await generateQRCode(paymentLink)
          console.log("[v0] QR code generated successfully")
          setQrCode(qrCodeDataUrl)

          setQrLoading(false)

          console.log("[v0] Starting native MQTT subscription...")
          await subscribeToQrBankNotifications(transactionId)
        } else {
          throw new Error("Transaction ID is null or undefined")
        }
      } catch (err) {
        console.error("[v0] QR generation error:", err)
        logEntry.error = err instanceof Error ? err.message : "Failed to generate QR code"
        setError(err instanceof Error ? err.message : "Failed to generate QR code")
        setQrLoading(false)
        setShowQrModal(false)
      } finally {
        console.log("[v0] Logging API call to console...")
        logApiCall(logEntry)
        console.log("[v0] API call logged successfully")
      }
    } else {
      console.log("[v0] EARLY RETURN: handleQrGeneration validation failed - invalid amount")
      console.log("[v0] numericAmount:", numericAmount)
      console.log("[v0] parsed amount:", Number.parseFloat(numericAmount))
      validationLogEntry.error = `Invalid amount: ${numericAmount} (parsed: ${Number.parseFloat(numericAmount)})`
      logApiCall(validationLogEntry)
    }
    console.log("[v0] ========== handleQrGeneration END ==========")
  }

  const generateDataIntegrityHash = useCallback(
    async (iban: string, amount: string, currency: string, endToEndId: string): Promise<string> => {
      const inputString = `${iban}|${amount}|${currency}|${endToEndId}`
      const encoder = new TextEncoder()
      const data = encoder.encode(inputString)
      const hashBuffer = await crypto.subtle.digest("SHA-256", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
      return hashHex
    },
    [],
  )

  const subscribeToQrBankNotifications = async (transactionId: string) => {
    const vatskValue = certificateInfo.vatsk || "1234567890"
    const pokladnicaValue = certificateInfo.pokladnica || "88812345678900001"
    const topic = `VATSK-${vatskValue}/POKLADNICA-${pokladnicaValue}/${transactionId || "QR-01c40ef8bb2541659c2bd4abfb6a9964"}`
    console.log("[v0] Subscribing to MQTT topic:", topic)

    const startTime = Date.now()
    const logEntry: ApiCallLog = {
      timestamp: new Date(),
      endpoint: "/api/mqtt-subscribe",
      method: "POST",
      status: 0,
    }

    try {
      setSubscriptionActive(true)

      const formData = new FormData()
      if (files.convertedCertPem && files.convertedKeyPem) {
        formData.append("clientCert", files.convertedCertPem)
        formData.append("clientKey", files.convertedKeyPem)
      } else {
        throw new Error("Certificate files not properly converted")
      }
      formData.append("caCert", files.caCert!)
      formData.append("certificateSecret", files.xmlPassword!)
      formData.append("transactionId", transactionId)
      formData.append("vatsk", vatskValue)
      formData.append("pokladnica", pokladnicaValue)

      console.log("[v0] Starting MQTT subscription...")

      const res = await fetch("/api/mqtt-subscribe", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] MQTT subscribe API response status:", res.status)

      logEntry.status = res.status
      logEntry.duration = Date.now() - startTime

      const data = await res.json()
      console.log("[v0] MQTT subscribe API response data:", data)

      logEntry.response = data

      if (data.hasMessages && data.messages && data.messages.length > 0) {
        console.log("[v0] Payment notification received via MQTT! Messages:", data.messages)

        setConfirmedPaymentAmount(eurAmount)
        setShowQrModal(false)
        setShowPaymentReceivedModal(true)
        setVerifyingIntegrity(true)
        setIntegrityVerified(false)
        setIntegrityError(false)

        // Start 1-second verification process
        setTimeout(async () => {
          try {
            // Parse the notification message to extract dataIntegrityHash
            let notificationHash = "ABCDEF" // Default fallback

            for (const message of data.messages) {
              try {
                const parsedMessage = JSON.parse(message)
                if (parsedMessage.dataIntegrityHash) {
                  notificationHash = parsedMessage.dataIntegrityHash
                  break
                }
              } catch {
                // Message is not JSON, continue
              }
            }

            const numericAmount = formatEurAmountForApi(eurAmount)
            const iban = userIban || ""
            const expectedHash = await generateDataIntegrityHash(
              iban.replace(/\s/g, ""),
              numericAmount.toFixed(2),
              "EUR",
              transactionId,
            )

            console.log("[v0] Notification hash:", notificationHash)
            console.log("[v0] Expected hash:", expectedHash)

            // Verify integrity
            const hashesMatch = notificationHash.toLowerCase() === expectedHash.toLowerCase()
            setIntegrityVerified(hashesMatch)
            setIntegrityError(!hashesMatch)

            if (hashesMatch) {
              console.log("[v0] Data integrity verification successful!")
            } else {
              console.log("[v0] Data integrity verification failed!")
            }

            setVerifyingIntegrity(false)
            setSubscriptionActive(false)
          } catch (error) {
            console.error("[v0] Data integrity verification error:", error)
            setVerifyingIntegrity(false)
            setIntegrityVerified(false)
            setIntegrityError(true)
            setSubscriptionActive(false)
          }
        }, 2000) // Fixed syntax error by combining split timeout value
      } else {
        console.log("[v0] MQTT subscription completed but no messages received")
        setSubscriptionActive(false)
      }
    } catch (err) {
      console.error("[v0] Native MQTT subscription error:", err)
      logEntry.response = { error: err instanceof Error ? err.message : "Native MQTT subscription error" }
      setSubscriptionActive(false)
    } finally {
      logApiCall(logEntry)
    }
  }

  const formatEurAmountForApi = (amount: string): number => {
    if (!amount || amount === "0") return 0

    const cleanDigits = amount.replace(/^0+/, "") || "0"
    const paddedDigits = cleanDigits.padStart(2, "0")

    // Split into euros and cents (last 2 digits are always cents)
    const cents = paddedDigits.slice(-2)
    const euros = paddedDigits.slice(0, -2) || "0"

    // Convert to decimal number
    return Number.parseFloat(`${euros}.${cents}`)
  }

  const handleIbanChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitizedValue = sanitizeInput(e.target.value)
      const rawValue = sanitizedValue.replace(/\s/g, "").toUpperCase()

      if (rawValue.length <= 34) {
        const formattedValue = formatIban(rawValue)
        setUserIban(formattedValue)

        const allFilesPresent = files.xmlAuthData && files.caCert
        const validIban = formattedValue && validateIbanSecure(formattedValue)

        if (allFilesPresent && validIban) {
          setCertificateSectionCollapsed(true)
        } else {
          setCertificateSectionCollapsed(false)
        }
      }
    },
    [files.xmlAuthData, files.caCert, sanitizeInput, validateIbanSecure],
  )

  const handleSaveConfiguration = useCallback(async () => {
    if (!files.xmlAuthData || !files.xmlPassword) {
      setError("Prosím nahrajte XML autentifikačné údaje a zadajte heslo")
      return
    }

    setSavingConfiguration(true)
    setIsProcessing(true)
    setError(null)

    try {
      const conversionResult = await handleApiCallWithRetry(async () => {
        return await convertXmlToPem(files.xmlAuthData!, files.xmlPassword!)
      })

      if (!conversionResult) {
        throw new Error("Konverzia XML na PEM zlyhala")
      }

      const caBundleBlob = new Blob([EMBEDDED_CA_BUNDLE], { type: "application/x-pem-file" })
      const caBundleFile = new File([caBundleBlob], "ca-bundle.pem", { type: "application/x-pem-file" })

      setFiles((prev) => ({
        ...prev,
        convertedCertPem: conversionResult.certPem,
        convertedKeyPem: conversionResult.keyPem,
        caCert: caBundleFile,
      }))

      setConfigurationSaved(true)
      setCertificateSectionCollapsed(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Neznáma chyba"
      setError(`Chyba pri ukladaní konfigurácie: ${errorMessage}`)
      console.error("[v0] Configuration save error:", error)
    } finally {
      setSavingConfiguration(false)
      setIsProcessing(false)
    }
  }, [files.xmlAuthData, files.xmlPassword, handleApiCallWithRetry, convertXmlToPem])

  const canSaveConfiguration =
    files.xmlAuthData && files.xmlPassword && userIban && isValidIbanFormat(userIban) && !configurationSaved

  const copyAllLogs = () => {
    const logsText = apiCallLogs.map((log) => JSON.stringify(log, null, 2)).join("\n")
    navigator.clipboard.writeText(logsText).then(
      () => {
        console.log("Logs copied to clipboard")
      },
      (err) => {
        console.error("Failed to copy logs to clipboard:", err)
      },
    )
  }

  const resetConfiguration = () => {
    setFiles({
      xmlAuthData: null,
      caCert: null,
      xmlPassword: "",
    })
    setUserIban("")
    setConfigurationSaved(false)
    setCertificateInfo({
      vatsk: null,
      pokladnica: null,
    })
    setCertificateSectionCollapsed(false)
    setError(null)
    setTransactionSuccess(false)
    setLoading(false)
    setMqttLoading(false)
    setBankLoading(false)
  }

  const handleScanToggle = () => {
    if (!scanToggleActive) {
      setScanToggleActive(true)
      setScanTimeRemaining(7) // Changed from 20 to 7 seconds

      const timer = setInterval(() => {
        setScanTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setScanToggleActive(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  const handleQrModalClose = (open: boolean) => {
    // Only allow closing if explicitly set to false (close button clicked)
    // Prevent closing on outside clicks by ignoring when open is true
    if (!open) {
      setShowQrModal(false)
    }
  }

  const handleTransactionListClick = () => {
    setShowTransactionDateModal(true)
  }

  const handleTransactionDateSelect = async () => {
    if (!selectedTransactionDate) return

    setShowTransactionDateModal(false)
    setShowTransactionListModal(true)
    setTransactionListLoading(true)

    try {
      // Use date range filtering instead of ::date cast for better timezone handling
      const startDate = `${selectedTransactionDate}T00:00:00Z`
      const endDate = `${selectedTransactionDate}T23:59:59Z`

      console.log("[v0] Date range:", startDate, "to", endDate)

      const { data, error } = await supabase
        .from("mqtt_notifications")
        .select("payload_received_at, end_to_end_id, amount")
        .gte("payload_received_at", startDate)
        .lte("payload_received_at", endDate)
        .order("payload_received_at", { ascending: false })

      if (error) {
        console.error("[v0] Supabase query error:", error)
        setTransactionListData([])
      } else {
        console.log("[v0] Query successful, found", data?.length || 0, "transactions")
        console.log("[v0] Transaction data:", data)
        setTransactionListData(data || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching transaction data:", error)
      setTransactionListData([])
    } finally {
      setTransactionListLoading(false)
    }
  }

  const calculateTransactionTotal = () => {
    return transactionListData.reduce((total, transaction) => {
      const amount = Number.parseFloat(transaction.amount || 0)
      return total + amount
    }, 0)
  }

  const printTransactionSummary = () => {
    const printContent = `
      <html>
        <head>
          <title>Súhrn transakcií - ${selectedTransactionDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .summary { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
            .summary-item { margin: 10px 0; font-size: 16px; }
          </style>
        </head>
        <body>
          <h1>Súhrn transakcií</h1>
          <div class="summary">
            <div class="summary-item"><strong>Dátum:</strong> ${new Date(selectedTransactionDate).toLocaleDateString("sk-SK")}</div>
            <div class="summary-item"><strong>Počet transakcií:</strong> ${transactionListData.length}</div>
            <div class="summary-item"><strong>Celková suma:</strong> ${calculateTransactionTotal().toFixed(2)} EUR</div>
            <div class="summary-item"><strong>Vygenerované:</strong> ${new Date().toLocaleString("sk-SK")}</div>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const printAllTransactions = () => {
    const printContent = `
      <html>
        <head>
          <title>Všetky transakcie - ${selectedTransactionDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total { font-weight: bold; background-color: #e8f4fd; }
          </style>
        </head>
        <body>
          <h1>Všetky transakcie</h1>
          <p><strong>Dátum:</strong> ${new Date(selectedTransactionDate).toLocaleDateString("sk-SK")}</p>
          
          <table>
            <thead>
              <tr>
                <th>Čas</th>
                <th>Transaction ID</th>
                <th>Suma (EUR)</th>
              </tr>
            </thead>
            <tbody>
              ${transactionListData
                .map(
                  (transaction) => `
                <tr>
                  <td>${new Date(transaction.payload_received_at).toLocaleTimeString("sk-SK")}</td>
                  <td>${transaction.end_to_end_id || "N/A"}</td>
                  <td>${Number.parseFloat(transaction.amount || 0).toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
              <tr class="total">
                <td colspan="2"><strong>Celková suma:</strong></td>
                <td><strong>${calculateTransactionTotal().toFixed(2)} EUR</strong></td>
              </tr>
            </tbody>
          </table>
          
          <p><strong>Vygenerované:</strong> ${new Date().toLocaleString("sk-SK")}</p>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          {!isOnline && (
            <div className="bg-destructive text-destructive-foreground p-2 text-center text-sm flex items-center justify-center gap-2">
              <WifiOff className="h-4 w-4" />
              Momentálne ste offline. Niektoré funkcie nemusia fungovať.
            </div>
          )}

          <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
            {!allRequiredFieldsComplete && (
              <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                  <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                    <CardHeader className="text-center pb-6">
                      <CardTitle className="text-2xl font-bold text-gray-900">Prihlásenie</CardTitle>
                      <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-md mt-2 flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm font-medium">Testovacie prostredie neprepojené s bankami</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Label
                                htmlFor="xmlAuthData"
                                className="text-sm font-medium text-gray-700 flex items-center gap-1 cursor-help"
                              >
                                Autentifikačné údaje (XML súbor)
                                <Info className="h-3 w-3 text-gray-400" />
                              </Label>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Autentifikačné údajte vo forme XML súboru nájdete v e-kasa zóne na portály finančnej
                                správy.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="relative">
                          <Input
                            id="xmlAuthData"
                            type="file"
                            accept=".xml"
                            onChange={(e) => handleFileChange("xmlAuthData", e.target.files?.[0] || null)}
                            className="w-full h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          {files.xmlAuthData && (
                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Label
                                htmlFor="xmlPassword"
                                className="text-sm font-medium text-gray-700 flex items-center gap-1 cursor-help"
                              >
                                Heslo
                                <Info className="h-3 w-3 text-gray-400" />
                              </Label>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Toto heslo ste zadávali pri prvotnom vytváraní autentifikačných údajov do e-kasy.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="relative">
                          <Input
                            id="xmlPassword"
                            type="password"
                            value={files.xmlPassword}
                            onChange={(e) => setFiles((prev) => ({ ...prev, xmlPassword: e.target.value }))}
                            placeholder="Zadajte heslo"
                            className="w-full h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          {files.xmlPassword && (
                            <CheckCircle className="absolute right-10 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Label
                                htmlFor="userIban"
                                className="text-sm font-medium text-gray-700 flex items-center gap-1 cursor-help"
                              >
                                IBAN
                                <Info className="h-3 w-3 text-gray-400" />
                              </Label>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Zadajte Váš podnikateľský bankový účet, ktorý ste si označili v banke ako notifikačný
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="relative">
                          <Input
                            id="iban"
                            type="text"
                            placeholder="SK00 0000 0000 0000 0000 0000"
                            value={userIban}
                            onChange={handleIbanChange}
                            className="w-full h-12 font-mono tracking-wider border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          {userIban && isValidIbanFormat(userIban) && (
                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={handleSaveConfiguration}
                        disabled={!canSaveConfiguration || savingConfiguration}
                        className={`w-full h-12 font-medium text-base transition-colors ${
                          !canSaveConfiguration || savingConfiguration
                            ? "bg-gray-400 text-gray-800 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {savingConfiguration ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Prihlasuje sa...
                          </div>
                        ) : (
                          "Prihlásiť sa"
                        )}
                      </Button>

                      {error && (
                        <Alert variant="destructive" className="mt-4">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">{error}</AlertDescription>
                        </Alert>
                      )}

                      {configurationSaved && (
                        <div className="text-center">
                          <p className="text-sm text-green-600 flex items-center justify-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Úspešne prihlásený
                          </p>
                        </div>
                      )}

                      <div className="text-center pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Potrebujete XML autentifikačné údaje a heslo?</p>
                        <Button
                          variant="default"
                          onClick={() => window.open("/download", "_blank")}
                          className="w-full h-12 font-medium text-base transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Získaj autentifikačné údaje
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {allRequiredFieldsComplete && !certificateSectionCollapsed && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Upload className="h-4 w-4" />
                    Certificate Files and IBAN
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCertificateSectionCollapsed(true)}
                      className="ml-auto p-1"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="xmlAuthData" className="text-sm">
                      XML Authentication Data
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="xmlAuthData"
                        type="file"
                        accept=".xml"
                        onChange={(e) => handleFileChange("xmlAuthData", e.target.files?.[0] || null)}
                        className="flex-1 text-sm"
                      />
                      {files.xmlAuthData && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="xmlPassword" className="text-sm">
                      XML Password
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="xmlPassword"
                        type="password"
                        value={files.xmlPassword}
                        onChange={(e) => setFiles((prev) => ({ ...prev, xmlPassword: e.target.value }))}
                        placeholder="Enter XML authentication password"
                        className="flex-1 text-sm"
                      />
                      {files.convertedCertPem && files.convertedKeyPem && (
                        <Button
                          onClick={handleSaveConfiguration}
                          size="sm"
                          className="px-3"
                          disabled={savingConfiguration}
                        >
                          {savingConfiguration ? "Ukladá sa..." : "Uložiť konfiguráciu"}
                        </Button>
                      )}
                    </div>
                  </div>
                  {files.convertedCertPem && files.convertedKeyPem && (
                    <p className="text-xs text-green-600">✓ Certificate and key generated from XML</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Input Section */}
            {allRequiredFieldsComplete && certificateSectionCollapsed && (
              <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-4 z-10">
                <div className="w-full max-w-md space-y-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="0,00"
                        value={formatEurAmountDisplay(eurAmount)}
                        onChange={(e) => {
                          // Extract only the digits from the formatted display
                          const digitsOnly = e.target.value.replace(/[^0-9]/g, "")
                          handleEurAmountChange(digitsOnly)
                        }}
                        onFocus={(e) => {
                          // Position cursor at the end of the input
                          const input = e.target
                          setTimeout(() => {
                            input.setSelectionRange(input.value.length, input.value.length)
                          }, 0)
                        }}
                        className="text-6xl font-bold text-center h-24 border-2 text-primary px-4 font-sans"
                        style={{ fontSize: "3rem", lineHeight: "1.2" }}
                        readOnly
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2">
                        <Euro className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 shadow-inner">
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <Button
                            key={num}
                            variant="outline"
                            className="h-16 text-2xl font-bold bg-white hover:bg-gray-100 border-2 border-gray-300 shadow-sm active:shadow-inner"
                            onClick={() => {
                              const newAmount = eurAmount + num.toString()
                              handleEurAmountChange(newAmount)
                            }}
                          >
                            {num}
                          </Button>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          variant="outline"
                          className="h-16 text-xl font-bold bg-red-50 hover:bg-red-100 border-2 border-red-300 text-red-700 shadow-sm active:shadow-inner"
                          onClick={() => handleEurAmountChange("")}
                        >
                          C
                        </Button>
                        <Button
                          variant="outline"
                          className="h-16 text-2xl font-bold bg-white hover:bg-gray-100 border-2 border-gray-300 shadow-sm active:shadow-inner"
                          onClick={() => {
                            const newAmount = eurAmount + "0"
                            handleEurAmountChange(newAmount)
                          }}
                        >
                          0
                        </Button>
                        <Button
                          variant="outline"
                          className="h-16 text-xl font-bold bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-300 text-yellow-700 shadow-sm active:shadow-inner"
                          onClick={() => {
                            const newAmount = eurAmount.slice(0, -1)
                            handleEurAmountChange(newAmount)
                          }}
                        >
                          <MoveLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      className="w-full h-24 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-2xl font-bold"
                      disabled={!eurAmount || Number.parseFloat(getEurAmountValue()) <= 0}
                      onClick={() => {
                        console.log("[v0] Button clicked!")
                        console.log(
                          "[v0] Button disabled state:",
                          !eurAmount || Number.parseFloat(getEurAmountValue()) <= 0,
                        )
                        handleQrGeneration()
                      }}
                    >
                      <QrCode className="w-14 h-14 sm:w-20 sm:h-20" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="break-words">{error}</AlertDescription>
              </Alert>
            )}

            <Dialog open={showQrModal} onOpenChange={handleQrModalClose}>
              <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-4 min-h-[400px]">
                  {qrLoading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : qrCode ? (
                    <div className="space-y-4 flex flex-col items-center">
                      <div className="bg-white p-4 rounded-lg">
                        <img src={qrCode || "/placeholder.svg"} alt="Payment QR Code" className="w-64 h-64" />
                      </div>
                    </div>
                  ) : (
                    <XCircle className="h-8 w-8 text-red-500" />
                  )}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3 p-3 mx-3">
                    {subscriptionActive && (
                      <>
                        <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                        <span className="text-sm text-muted-foreground">Čakám na oznámenie z banky</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {qrCode && (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground text-right max-w-[200px]">
                            Simulátor úhrady. Naskenuj link QR kamerou.
                          </span>
                          <div className="bg-white p-1 rounded border flex-shrink-0">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent("https://scantopay.vercel.app")}`}
                              alt="Scan to open scantopay.vercel.app"
                              className={`w-20 h-20 object-contain transition-all duration-300 ${
                                scanToggleActive ? "blur-none" : "blur-sm"
                              }`}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {scanToggleActive ? `Zostávajúci čas ${scanTimeRemaining}s` : "Zaostri QR kód"}
                          </span>
                          <button
                            onClick={handleScanToggle}
                            disabled={scanToggleActive}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              scanToggleActive ? "bg-blue-600" : "bg-gray-200 hover:bg-gray-300"
                            } ${scanToggleActive ? "cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                scanToggleActive ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showPaymentReceivedModal} onOpenChange={setShowPaymentReceivedModal}>
              <DialogContent className="max-w-[95vw] max-h-[90vh]">
                <div className="space-y-4 text-center py-8">
                  <div className="text-xl font-semibold text-gray-800 mb-4">
                    Prichádzajúca platba {formatEurAmountDisplay(confirmedPaymentAmount)} EUR
                  </div>

                  {verifyingIntegrity ? (
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <span className="text-lg font-medium text-gray-600">Kontrolujem integritu platby</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4">
                      {integrityError ? (
                        <>
                          <XCircle className="h-12 w-12 text-red-600" />
                          <span className="text-lg font-medium text-red-600">Nesprávna platba</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-12 w-12 text-green-600" />
                          <span className="text-lg font-medium text-green-600">Platba overená</span>
                        </>
                      )}
                    </div>
                  )}

                  {!verifyingIntegrity && (
                    <Button
                      onClick={() => {
                        setShowPaymentReceivedModal(false)
                        setEurAmount("")
                        setConfirmedPaymentAmount("")
                        setIntegrityVerified(false)
                        setIntegrityError(false)
                      }}
                      className="w-full touch-manipulation min-h-[48px]"
                    >
                      Zavrieť
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showConsoleModal} onOpenChange={setShowConsoleModal}>
              <DialogContent className="max-w-[95vw] max-h-[95vh] w-full flex flex-col">
                <div className="flex flex-col h-full space-y-4">
                  <div className="flex items-center justify-between flex-shrink-0">
                    <h3 className="text-lg font-semibold">API Call Console</h3>
                    <div className="flex gap-2">
                      <Button onClick={copyAllLogs} variant="outline" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button onClick={clearApiLogs} variant="outline" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div
                    className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs overflow-y-auto"
                    style={{ height: "calc(95vh - 200px)" }}
                  >
                    {apiCallLogs.length === 0 ? (
                      <div className="text-gray-500">No API calls logged yet...</div>
                    ) : (
                      apiCallLogs.map((log, index) => (
                        <div key={index} className="mb-4 border-b border-gray-700 pb-2 last:border-b-0">
                          <div className="text-yellow-400 break-all">
                            [{log.timestamp.toLocaleTimeString()}] {log.method} {log.endpoint}
                          </div>
                          <div
                            className={`${log.status >= 200 && log.status < 300 ? "text-green-400" : "text-red-400"}`}
                          >
                            Status: {log.status} {log.duration && `(${log.duration}ms)`}
                          </div>
                          {log.error && <div className="text-red-400 break-all">Error: {log.error}</div>}
                          {log.response && (
                            <div className="text-blue-400 mt-1 break-all whitespace-pre-wrap">
                              Response: {JSON.stringify(log.response, null, 2)}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <Button onClick={() => setShowConsoleModal(false)} className="w-full flex-shrink-0">
                    Close Console
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showTransactionDateModal} onOpenChange={setShowTransactionDateModal}>
              <DialogContent className="max-w-md">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center">Vyberte dátum</h3>

                  <div className="space-y-2">
                    <Label htmlFor="transactionDate" className="text-sm font-medium">
                      Dátum transakcií
                    </Label>
                    <Input
                      id="transactionDate"
                      type="date"
                      value={selectedTransactionDate}
                      onChange={(e) => setSelectedTransactionDate(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowTransactionDateModal(false)} className="flex-1">
                      Zrušiť
                    </Button>
                    <Button
                      onClick={handleTransactionDateSelect}
                      disabled={!selectedTransactionDate}
                      className="flex-1"
                    >
                      Vygeneruj zoznam
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showTransactionListModal} onOpenChange={setShowTransactionListModal}>
              <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Zoznam transakcií -{" "}
                    {selectedTransactionDate ? new Date(selectedTransactionDate).toLocaleDateString("sk-SK") : ""}
                  </h3>
                  <div className="flex gap-2">
                    <Button onClick={printTransactionSummary} variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-2" />
                      Tlačiť súhrn
                    </Button>
                    <Button onClick={printAllTransactions} variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-2" />
                      Tlačiť všetky
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {transactionListLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <span className="ml-2">Načítavam transakcie...</span>
                    </div>
                  ) : transactionListData.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{transactionListData.length}</div>
                          <div className="text-sm text-gray-600">Transakcií</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {calculateTransactionTotal().toFixed(2)} €
                          </div>
                          <div className="text-sm text-gray-600">Celková suma</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Žiadne transakcie pre vybraný dátum</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-4">
                  <Button onClick={() => setShowTransactionListModal(false)}>Zavrieť</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {allRequiredFieldsComplete && (
            <footer className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50">
              <div className="w-full max-w-md bg-background/95 backdrop-blur-sm border-t px-6 py-4">
                <div className="flex items-center justify-between">
                  {/* Status indicator */}

                  {/* POKLADNICA info */}
                  {certificateInfo?.pokladnica && (
                    <div className="flex items-center gap-3 px-2">
                      <User className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium">{certificateInfo.pokladnica}</span>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleTransactionListClick}
                    className="p-3 mx-1"
                    title="Zoznam transakcií"
                  >
                    <Printer className="h-5 w-5" />
                  </Button>

                  {/* Console log button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConsoleModal(true)}
                    className="p-3 mx-1"
                    title="Console Logs"
                  >
                    <Terminal className="h-5 w-5" />
                  </Button>

                  {/* Refresh button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="p-3 mx-1"
                    title="Log out"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </footer>
          )}
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  )
}

export default Home
