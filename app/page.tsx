"use client"

import React from "react"
import type { FunctionComponent } from "react"
import { Loader2 } from "lucide-react" // Import Copy icon, AlertTriangle icon, FileText, Github, CheckCircle, Printer, Terminal, LogOut, User, Clock, Calendar, Check, AlertCircle
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import QRCode from "qrcode"
import { createClient } from "@supabase/supabase-js"
import { toast } from "@/hooks/use-toast" // Assuming you have a toast component

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

const EMBEDDED_CA_BUNDLE = process.env.NEXT_PUBLIC_EMBEDDED_CA_BUNDLE || ""
const EMBEDDED_CA_BUNDLE_PROD = process.env.NEXT_PUBLIC_EMBEDDED_CA_BUNDLE_PROD || ""

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
  const [merchantAccountName, setMerchantAccountName] = useState<string>("")
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
  const [qrTransactionCreatedAt, setQrTransactionCreatedAt] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [subscriptionActive, setSubscriptionActive] = useState(false)
  const [scanTimeRemaining, setScanTimeRemaining] = useState(0)
  const [verifyingIntegrity, setVerifyingIntegrity] = useState(false)
  const [integrityVerified, setIntegrityVerified] = useState(false)
  const [integrityError, setIntegrityError] = useState(false)

  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyData, setHistoryData] = useState<any>(null)
  const [selectedHistoryTransaction, setSelectedHistoryTransaction] = useState<string | null>(null)

  const [showTransactionListModal, setShowTransactionListModal] = useState(false)
  const [showTransactionDateModal, setShowTransactionDateModal] = useState(false)
  const [selectedTransactionDate, setSelectedTransactionDate] = useState<string>("")
  const [notificationListData, setNotificationListData] = useState<any[]>([])
  const [notificationListLoading, setNotificationListLoading] = useState(false)

  const [showDisputeDateModal, setShowDisputeDateModal] = useState(false)
  const [selectedDisputeDate, setSelectedDisputeDate] = useState<string>("")
  const [showDisputeListModal, setShowDisputeListModal] = useState(false)
  const [disputeTransactions, setDisputeTransactions] = useState<any[]>([])
  const [disputeListLoading, setDisputeListLoading] = useState(false)
  const [selectedDisputeTransaction, setSelectedDisputeTransaction] = useState<any | null>(null)
  const [showDisputeActionModal, setShowDisputeActionModal] = useState(false)

  const [showDisputeConfirmModal, setShowDisputeConfirmModal] = useState(false)
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null)
  const [disputeSortField, setDisputeSortField] = useState<"time" | "amount">("time")
  const [disputeSortDirection, setDisputeSortDirection] = useState<"asc" | "desc">("desc")
  const [showOnlyDisputed, setShowOnlyDisputed] = useState(false)

  const [certificateInfo, setCertificateInfo] = useState<{
    vatsk: string | null
    pokladnica: string | null
  }>({
    vatsk: null,
    pokladnica: null,
  })

  const [configurationSaved, setConfigurationSaved] = useState(false)
  const [savingConfiguration, setSavingConfiguration] = useState(false)

  // Add new state for MQTT timer
  const [mqttTimeRemaining, setMqttTimeRemaining] = useState(120)
  const [mqttTimerActive, setMqttTimerActive] = useState(false)

  const [isProductionMode, setIsProductionMode] = useState(false)
  const [showProductionConfirmModal, setShowProductionConfirmModal] = useState(false)

  const [productionCheck1, setProductionCheck1] = useState(false)
  const [productionCheck2, setProductionCheck2] = useState(false)

  const [showRateLimitModal, setShowRateLimitModal] = useState(false)
  const [rateLimitRetryAfter, setRateLimitRetryAfter] = useState(0)

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showMobilePrintWarningModal, setShowMobilePrintWarningModal] = useState(false)
  const [showConfirmationQrModal, setShowConfirmationQrModal] = useState(false)
  const [confirmationUrl, setConfirmationUrl] = useState("")

  const [paymentLinkVersion, setPaymentLinkVersion] = useState<"1.3" | "2.0">("2.0")

  const [apiCallLogs, setApiCallLogs] = useState<ApiCallLog[]>([]) // Declare setApiCallLogs variable

  useEffect(() => {
    const savedMode = localStorage.getItem("productionMode")
    if (savedMode === "true") {
      setIsProductionMode(true)
    }
  }, [])

  const handleProductionToggle = (checked: boolean) => {
    if (checked) {
      // Switching to production - show confirmation
      setShowProductionConfirmModal(true)
    } else {
      // Switching to test - no confirmation needed
      setIsProductionMode(false)
      localStorage.setItem("productionMode", "false")
      toast({
        title: "Prepnuté na testovacie prostredie",
        description: "Používate testovacie URL adresy",
      })
    }
  }

  const confirmProductionSwitch = () => {
    setIsProductionMode(true)
    localStorage.setItem("productionMode", "true")
    setShowProductionConfirmModal(false)
    setProductionCheck1(false)
    setProductionCheck2(false)
    toast({
      title: "Prepnuté na produkčné prostredie",
      description: "Používate produkčné URL adresy pripojené k bankám",
      variant: "default",
    })
  }

  const cancelProductionSwitch = () => {
    setShowProductionConfirmModal(false)
    setProductionCheck1(false)
    setProductionCheck2(false)
  }

  const logApiCall = (log: ApiCallLog) => {
    setApiCallLogs((prev) => [...prev, log].slice(-20)) // Keep only last 20 logs
  }

  const clearApiLogs = () => {
    setApiCallLogs([])
  }

  const copyEmailToClipboard = (email: string, bankName?: string) => {
    navigator.clipboard.writeText(email)
    toast({
      title: "E-mail skopírovaný",
      description: bankName
        ? `E-mailová adresa ${bankName} bola skopírovaná do schránky`
        : "E-mailová adresa bola skopírovaná do schránky",
    })
  }

  const generatePaymentLink = (amount: string, transactionId: string) => {
    // Format: YYYYMMDD (ISO 8601)
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    const dueDate = `${year}${month}${day}`

    const cleanIban = userIban.replace(/\s/g, "")
    const encodedCreditorName = merchantAccountName.replace(/ /g, "+")

    let paymentLink: string

    if (paymentLinkVersion === "2.0") {
      // Payment Link Standard 2.0
      // Format: https://payme.sk/2/m/PME?IBAN=...&AM=...&CC=EUR&PI=...&CN=...
      // Type /m/ is for mobile payment at the point of interaction (QR code)
      const params = new URLSearchParams({
        IBAN: cleanIban,
        AM: amount,
        CC: "EUR",
        PI: transactionId,
        CN: encodedCreditorName,
      })

      paymentLink = `https://payme.sk/2/m/PME?${params.toString()}`
    } else {
      // Payment Link Standard 1.3 (legacy)
      // Format: https://payme.sk/?V=1&IBAN=...&AM=...&CC=EUR&DT=...&PI=...&CN=...
      const params = new URLSearchParams({
        V: "1",
        IBAN: cleanIban,
        AM: amount,
        CC: "EUR",
        DT: dueDate,
        PI: transactionId,
        CN: merchantAccountName,
      })

      paymentLink = `https://payme.sk/?${params.toString()}`
    }

    console.log("[v0] ===== PAYMENT LINK GENERATION =====")
    console.log("[v0] Version:", paymentLinkVersion)
    console.log("[v0] Transaction ID:", transactionId)
    console.log("[v0] Amount:", amount)
    console.log("[v0] IBAN:", cleanIban)
    if (paymentLinkVersion === "1.3") {
      console.log("[v0] Due Date:", dueDate)
    }
    console.log("[v0] Creditor Name:", merchantAccountName)
    console.log("[v0] Full Payment Link:", paymentLink)
    console.log("[v0] ===================================")

    return paymentLink
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

  const useEffectOnlineStatus = () => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }

  useEffect(useEffectOnlineStatus, [])

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

        if (response.status === 429) {
          const data = await response.json()
          console.log("[v0] Rate limit exceeded:", data)
          setRateLimitRetryAfter(data.retryAfter || 60)
          setShowRateLimitModal(true)
          return null // Indicate failure
        }

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

    if (!certificateInfo.vatsk || !certificateInfo.pokladnica) {
      setError("VATSK alebo POKLADNICA nie sú k dispozícii. Prosím, nahrajte platné certifikáty.")
      setMqttLoading(false)
      return
    }

    if (!transactionId) {
      setError("Transaction ID nie je k dispozícii.")
      setMqttLoading(false)
      return
    }

    const topic = `VATSK-${certificateInfo.vatsk}/POKLADNICA-${certificateInfo.pokladnica}/${transactionId}`
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
      formData.append("vatsk", certificateInfo.vatsk)
      formData.append("pokladnica", certificateInfo.pokladnica)

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

  const allRequiredFieldsComplete =
    files.xmlAuthData && files.xmlPassword && userIban && merchantAccountName && configurationSaved

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

    const formattedEuros = euros.replace(/\B(?=(\d{3})+(?!\d))/g, " ")

    return formattedEuros + "," + cents
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

        const caBundleContent = isProductionMode ? EMBEDDED_CA_BUNDLE_PROD : EMBEDDED_CA_BUNDLE
        console.log("[v0] Production mode:", isProductionMode)
        console.log("[v0] Using CA certificate for mode:", isProductionMode ? "PRODUCTION" : "TEST")
        console.log("[v0] CA certificate length:", caBundleContent.length)
        console.log("[v0] CA certificate preview (first 100 chars):", caBundleContent.substring(0, 100))
        console.log("[v0] Expected API URL:", isProductionMode ? "api-erp.kverkom.sk" : "api-erp-i.kverkom.sk")
        console.log("[v0] Expected MQTT URL:", isProductionMode ? "mqtt.kverkom.sk" : "mqtt-i.kverkom.sk")

        const caBundleBlob = new Blob([caBundleContent], { type: "application/x-pem-file" })
        const caBundleFile = new File([caBundleBlob], "ca-bundle.pem", { type: "application/x-pem-file" })

        const formData = new FormData()
        formData.append("clientCert", files.convertedCertPem)
        formData.append("clientKey", files.convertedKeyPem)
        formData.append("caCert", caBundleFile)
        formData.append("certificateSecret", files.xmlPassword!)
        formData.append("iban", userIban)
        formData.append("amount", numericAmount)
        formData.append("isProductionMode", isProductionMode.toString())

        console.log("[v0] FormData prepared, making API call to generate transaction...")
        console.log("[v0] Production mode:", isProductionMode)
        const res = await fetch("/api/generate-transaction", {
          method: "POST",
          body: formData,
        })

        console.log("[v0] API response received, status:", res.status)

        if (res.status === 429) {
          const data = await res.json()
          console.log("[v0] Rate limit exceeded:", data)
          setRateLimitRetryAfter(data.retryAfter || 60)
          setShowRateLimitModal(true)
          // </CHANGE> Close QR modal and reset loading state when rate limit is hit
          setShowQrModal(false)
          setQrLoading(false)
          logEntry.error = "Rate limit exceeded"
          logEntry.response = data
          setApiCallLogs((prev) => [...prev, logEntry])
          return
        }

        if (!res.ok) {
          throw new Error("Failed to generate transaction")
        }

        const data = await res.json()
        console.log("[v0] Transaction generated successfully:", data)

        setQrTransactionId(data.transactionId)
        setQrTransactionCreatedAt(data.createdAt)
        setQrCode(await generateQRCode(data.transactionId))

        logEntry.status = res.status
        logEntry.duration = Date.now() - startTime
        logEntry.response = data
        logApiCall(logEntry)
      } catch (err) {
        console.log("[v0] QR generation error:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
        logEntry.error = err instanceof Error ? err.message : "An error occurred"
        logApiCall(logEntry)
      } finally {
        setQrLoading(false)
      }
    }
  }

  useEffect(() => {
    const regenerateQrCode = async () => {
      if (showQrModal && qrTransactionId && eurAmount) {
        console.log("[v0] Regenerating QR code for version:", paymentLinkVersion)
        const amountValue = getEurAmountValue()
        const paymentLink = generatePaymentLink(amountValue, qrTransactionId)
        const qrCodeDataUrl = await generateQRCode(paymentLink)
        setQrCode(qrCodeDataUrl)
      }
    }

    regenerateQrCode()
  }, [paymentLinkVersion])

  return (
    <div>
      {/* Home component content here */}
      {qrLoading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <Loader2 className="relative h-12 w-12 animate-spin text-blue-600" />
          </div>
          <span className="text-base font-medium text-gray-600">Generujem QR kód...</span>
        </div>
      ) : qrCode ? (
        <div className="space-y-6 flex flex-col items-center w-full">
          <div className="flex items-center gap-2 bg-gray-100/80 backdrop-blur-sm rounded-full p-1 shadow-inner">
            <button
              onClick={() => setPaymentLinkVersion("1.3")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                paymentLinkVersion === "1.3" ? "bg-white text-blue-600 shadow-md" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              v1.3
            </button>
            <button
              onClick={() => setPaymentLinkVersion("2.0")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                paymentLinkVersion === "2.0" ? "bg-white text-blue-600 shadow-md" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              v2.0
            </button>
          </div>

          {/* QR Code with enhanced styling */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-xl opacity-20"></div>
            <div className="relative bg-white p-6 rounded-2xl shadow-xl border-2 border-gray-100">
              <img src={qrCode || "/placeholder.svg"} alt="Payment QR Code" className="w-64 h-64" />
            </div>
          </div>
        </div>
      ) : (
        <div>{/* Placeholder for QR Code section */}</div>
      )}
    </div>
  )
}

export default Home
