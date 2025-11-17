"use client"

import React from "react"
import type { FunctionComponent } from "react"
import { Copy, XCircle, FilePlus, Github, CheckCircle, Printer, Terminal, LogOut, User, Calendar, FileText, FileCheck, Upload, QrCode, Loader2, Info, ExternalLink, WifiOff, MoveLeft, X, Clock } from 'lucide-react' // Import Copy icon, AlertTriangle icon, FileText, Github, CheckCircle, Printer, Terminal, LogOut, User, Clock, Calendar, Check, AlertCircle
import { Euro } from 'lucide-react' // Import Euro, Printer, Calendar icons
import { QRCodeSVG } from 'qrcode.react' // Import QRCodeSVG

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog" // Import DialogHeader and DialogTitle
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText("kverkom.kasoveIS@financnasprava.sk")
    toast({
      title: "E-mail skopírovaný",
      description: "E-mailová adresa bola skopírovaná do schránky",
    })
  }

  const generatePaymentLink = (amount: string, transactionId: string) => {
    // Format: YYYYMMDD (ISO 8601)
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    const dueDate = `${year}${month}${day}`

    const params = new URLSearchParams({
      V: "1", // Version
      IBAN: userIban.replace(/\s/g, ""), // Remove spaces from IBAN for payment link
      AM: amount, // Amount from user
      CC: "EUR", // Currency
      DT: dueDate, // Due date in YYYYMMDD format
      CN: merchantAccountName || "Kverkom s.r.o.", // Creditor name
      PI: transactionId, // Payment identification (EndToEnd as Transaction ID)
      MSG: "Payment+via+mobile+app", // Fabricated message
    })

    const paymentLink = `https://payme.sk/?${params.toString()}`
    console.log("[v0] ===== PAYMENT LINK GENERATION =====")
    console.log("[v0] Transaction ID:", transactionId)
    console.log("[v0] Amount:", amount)
    console.log("[v0] IBAN:", userIban.replace(/\s/g, ""))
    console.log("[v0] Due Date:", dueDate)
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

        console.log("[v0] Logging generate-transaction API call to console...")
        logApiCall(logEntry)
        console.log("[v0] Generate-transaction API call logged successfully")

        let transactionId = null
        let createdAt = null
        if (data.data && data.data.transactionId) {
          transactionId = data.data.transactionId
          createdAt = data.data.created_at || data.data.createdAt
          console.log("[v0] Found transaction ID in data.transactionId:", transactionId)
          console.log("[v0] Found created_at:", createdAt)
        } else if (data.data && typeof data.data === "object") {
          transactionId = data.data.transactionId || data.data.id || data.data.transaction_id
          createdAt = data.data.created_at || data.data.createdAt
          console.log("[v0] Found transaction ID in nested object:", transactionId)
          console.log("[v0] Found created_at:", createdAt)
        } else if (data.transactionId) {
          transactionId = data.transactionId
          createdAt = data.created_at || data.createdAt
          console.log("[v0] Found transaction ID at root level:", transactionId)
          console.log("[v0] Found created_at:", createdAt)
        } else {
          console.log("[v0] Full response structure:", JSON.stringify(data, null, 2))
          throw new Error("No transaction ID found in response")
        }

        if (transactionId) {
          console.log("[v0] Using transaction ID:", transactionId)
          setQrTransactionId(transactionId)
          setQrTransactionCreatedAt(createdAt)

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
        logApiCall(logEntry)
        setError(err instanceof Error ? err.message : "Failed to generate QR code")
        setQrLoading(false)
        setShowQrModal(false)
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
    if (!certificateInfo.vatsk || !certificateInfo.pokladnica) {
      setError("VATSK alebo POKLADNICA nie sú k dispozícii. Prosím, nahrajte platné certifikáty.")
      setSubscriptionActive(false)
      return
    }
    if (!files.convertedCertPem || !files.convertedKeyPem) {
      setError("Certificate files not properly converted")
      setSubscriptionActive(false)
      return
    }

    if (!transactionId) {
      setError("Transaction ID nie je k dispozícii.")
      setSubscriptionActive(false)
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
      setSubscriptionActive(true)
      setMqttTimerActive(true)
      setMqttTimeRemaining(120)

      const timerInterval = setInterval(() => {
        setMqttTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval)
            setMqttTimerActive(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      cleanupRef.current.push(() => clearInterval(timerInterval))

      const caBundleContent = isProductionMode ? EMBEDDED_CA_BUNDLE_PROD : EMBEDDED_CA_BUNDLE
      const caBundleBlob = new Blob([caBundleContent], { type: "application/x-pem-file" })
      const caBundleFile = new File([caBundleBlob], "ca-bundle.pem", { type: "application/x-pem-file" })
      console.log("[v0] Using CA certificate for MQTT mode:", isProductionMode ? "PRODUCTION" : "TEST")

      const formData = new FormData()
      if (files.convertedCertPem && files.convertedKeyPem) {
        formData.append("clientCert", files.convertedCertPem)
        formData.append("clientKey", files.convertedKeyPem)
      } else {
        throw new Error("Certificate files not properly converted")
      }
      formData.append("caCert", caBundleFile)
      formData.append("certificateSecret", files.xmlPassword!)
      formData.append("transactionId", transactionId)
      formData.append("vatsk", certificateInfo.vatsk)
      formData.append("pokladnica", certificateInfo.pokladnica)
      formData.append("isProductionMode", isProductionMode.toString())

      console.log("[v0] Starting MQTT subscription...")
      console.log("[v0] Production mode:", isProductionMode)

      const res = await fetch("/api/mqtt-subscribe", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] MQTT subscribe API response status:", res.status)

      if (res.status === 429) {
        const data = await res.json()
        console.log("[v0] Rate limit exceeded:", data)
        setRateLimitRetryAfter(data.retryAfter || 60)
        setShowRateLimitModal(true)
        setMqttTimerActive(false)
        setSubscriptionActive(false)
        return
      }

      logEntry.status = res.status
      logEntry.duration = Date.now() - startTime

      const data = await res.json()
      console.log("[v0] MQTT subscribe API response data:", data)

      logEntry.response = data

      if (data.hasMessages && data.messages && data.messages.length > 0) {
        console.log("[v0] Payment notification received via MQTT! Messages:", data.messages)

        let notificationAmount = eurAmount // Fallback to entered amount

        // Try to parse the notification message to extract the actual amount
        for (const message of data.messages) {
          try {
            const parsedMessage = JSON.parse(message)
            if (parsedMessage.transactionAmount && parsedMessage.transactionAmount.amount) {
              // Convert the amount to the same format as eurAmount (digits only)
              const amountValue = Number.parseFloat(parsedMessage.transactionAmount.amount)
              const amountInCents = Math.round(amountValue * 100)
              notificationAmount = amountInCents.toString()
              console.log(
                "[v0] Extracted amount from notification:",
                amountValue,
                "EUR (",
                notificationAmount,
                "cents)",
              )
              break
            }
          } catch (error) {
            console.log("[v0] Could not parse message as JSON:", message)
          }
        }

        setConfirmedPaymentAmount(notificationAmount)
        setShowQrModal(false)
        setShowPaymentReceivedModal(true)
        setVerifyingIntegrity(true)
        setIntegrityVerified(false)
        setIntegrityError(false)

        // Start 1-second verification process
        setTimeout(async () => {
          try {
            let notificationHash: string | null = null
            let integrityValidationStatus: boolean | null = null // To store the validation result

            for (const message of data.messages) {
              try {
                const parsedMessage = JSON.parse(message)
                if (parsedMessage.dataIntegrityHash) {
                  notificationHash = parsedMessage.dataIntegrityHash
                }
                if (parsedMessage.hasOwnProperty("integrity_validation")) {
                  integrityValidationStatus = parsedMessage.integrity_validation
                }
              } catch {
                // Message is not JSON, continue
              }
            }

            if (!notificationHash) {
              console.error("[v0] CRITICAL: No dataIntegrityHash found in notification messages")
              setIntegrityVerified(false)
              setIntegrityError(true)
              setVerifyingIntegrity(false)
              return
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

            // Determine the final status to save to the database
            const finalValidationStatus = hashesMatch ? true : false

            try {
              const updateResponse = await fetch("/api/update-integrity-validation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  transactionId: transactionId,
                  isValid: finalValidationStatus, // Save the verified status
                  integrityValidationStatusFromMessage: integrityValidationStatus, // Also save status from message if available
                }),
              })

              if (!updateResponse.ok) {
                console.error("[v0] Failed to update integrity validation in database")
              } else {
                console.log("[v0] Integrity validation result saved to database")
              }
            } catch (error) {
              console.error("[v0] Error updating integrity validation:", error)
            }
            // </CHANGE>

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
        }, 500)
      } else {
        console.log("[v0] MQTT subscription completed but no messages received")
        setSubscriptionActive(false)
      }
    } catch (err) {
      console.error("[v0] Native MQTT subscription error:", err)
      logEntry.response = { error: err instanceof Error ? err.message : "Native MQTT subscription error" }
      setSubscriptionActive(false)
      setMqttConnected(false)
      setError(err instanceof Error ? err.message : "Native MQTT subscription error")
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
        // Check if merchantAccountName is also present and valid
        const validMerchantAccount = merchantAccountName && merchantAccountName.length > 0

        if (allFilesPresent && validIban && validMerchantAccount) {
          setCertificateSectionCollapsed(true)
        } else {
          setCertificateSectionCollapsed(false)
        }
      }
    },
    [files.xmlAuthData, files.caCert, sanitizeInput, validateIbanSecure, merchantAccountName],
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

      const caBundleContent = isProductionMode ? EMBEDDED_CA_BUNDLE_PROD : EMBEDDED_CA_BUNDLE
      const caBundleBlob = new Blob([caBundleContent], { type: "application/x-pem-file" })
      const caBundleFile = new File([caBundleBlob], "ca-bundle.pem", { type: "application/x-pem-file" })
      console.log("[v0] Using CA certificate for config save mode:", isProductionMode ? "PRODUCTION" : "TEST")

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
  }, [files.xmlAuthData, files.xmlPassword, handleApiCallWithRetry, convertXmlToPem, isProductionMode])

  const canSaveConfiguration =
    files.xmlAuthData &&
    files.xmlPassword &&
    userIban &&
    merchantAccountName &&
    isValidIbanFormat(userIban) &&
    !configurationSaved

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
    setMerchantAccountName("") // Reset merchant account name
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

  const handleConfirmDispute = async () => {
    if (!currentTransactionId) {
      toast({
        title: "Chyba",
        description: "ID transakcie nebolo nájdené",
        variant: "destructive",
      })
      return
    }

    try {
      // Update dispute flag in database
      const response = await fetch("/api/update-dispute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactionId: currentTransactionId }),
      })

      if (response.status === 429) {
        const data = await response.json()
        console.log("[v0] Rate limit exceeded:", data)
        setRateLimitRetryAfter(data.retryAfter || 60)
        setShowRateLimitModal(true)
        return
      }

      if (!response.ok) {
        throw new Error("Failed to update dispute flag")
      }

      // Close modals
      setShowDisputeConfirmModal(false)
      setShowQrModal(false)

      const url = `${window.location.origin}/confirmation/${currentTransactionId}`
      setConfirmationUrl(url)
      setShowConfirmationQrModal(true)

      // Reset form
      setEurAmount("")
      setMqttTimerActive(false)
      setMqttTimeRemaining(120)
      setCurrentTransactionId(null)
    } catch (error) {
      console.error("[v0] Error confirming dispute:", error)
      toast({
        title: "Chyba",
        description: "Nepodarilo sa potvrdiť spor",
        variant: "destructive",
      })
    }
  }

  const handleCancelPayment = () => {
    console.log("[v0] Cancel payment clicked")
    // Stop MQTT timer
    setMqttTimerActive(false)
    setMqttTimeRemaining(120)
    setCurrentTransactionId(qrTransactionId)
    if (qrTransactionId && qrTransactionCreatedAt) {
      setSelectedDisputeTransaction({
        transaction_id: qrTransactionId,
        created_at: qrTransactionCreatedAt,
      } as any)
    }
    // Show dispute confirmation modal
    setShowDisputeConfirmModal(true)
  }

  const handleDisputeNo = () => {
    // Close all modals
    setShowDisputeConfirmModal(false)
    setShowQrModal(false)
    // Reset form
    setEurAmount("")
    setMqttTimerActive(false)
    setMqttTimeRemaining(120)
    setCurrentTransactionId(null)
  }

  const handleDisputeClick = () => {
    const today = new Date().toISOString().split("T")[0]
    setSelectedDisputeDate(today)
    setShowDisputeDateModal(true)
  }

  const handleDisputeDateSelect = async () => {
    if (!selectedDisputeDate || !certificateInfo?.pokladnica) return

    setShowDisputeDateModal(false)
    setShowDisputeListModal(true)
    setDisputeListLoading(true)

    try {
      const timezoneOffset = new Date().getTimezoneOffset()

      const response = await fetch("/api/get-transactions-by-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDisputeDate,
          pokladnica: certificateInfo.pokladnica,
          timezoneOffset: timezoneOffset,
          end_point: isProductionMode ? "PRODUCTION" : "TEST",
        }),
      })

      if (response.status === 429) {
        const data = await response.json()
        console.log("[v0] Rate limit exceeded:", data)
        setRateLimitRetryAfter(data.retryAfter || 60)
        setShowRateLimitModal(true)
        setDisputeListLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch transactions")
      }

      const data = await response.json()
      setDisputeTransactions(data.transactions || [])
    } catch (error) {
      console.error("[v0] Error fetching dispute transactions:", error)
      setDisputeTransactions([])
    } finally {
      setDisputeListLoading(false)
    }
  }

  const handleTransactionDisputeClick = (transaction: any) => {
    console.log("[v0] handleTransactionDisputeClick called with:", transaction)
    setSelectedDisputeTransaction(transaction)
    setShowDisputeActionModal(true)
    console.log("[v0] showDisputeActionModal set to true")
  }

  const handleConfirmDisputeAction = async () => {
    if (!selectedDisputeTransaction) return

    try {
      // Update dispute flag
      const response = await fetch("/api/update-dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: selectedDisputeTransaction.transaction_id }),
      })

      if (!response.ok) {
        throw new Error("Failed to update dispute flag")
      }

      const url = `${window.location.origin}/confirmation/${selectedDisputeTransaction.transaction_id}`
      setConfirmationUrl(url)
      setShowConfirmationQrModal(true)

      // Close dispute action modal
      setShowDisputeActionModal(false)

      // Refresh the transaction list
      handleDisputeDateSelect()
    } catch (error) {
      console.error("[v0] Error updating dispute:", error)
      toast({
        title: "Chyba",
        description: "Nepodarilo sa aktualizovať spor",
        variant: "destructive",
      })
    }
  }

  const handleCancelDisputeAction = () => {
    setShowDisputeActionModal(false)
    setSelectedDisputeTransaction(null)
  }

  const formatAmount = (amount: string | number | null) => {
    if (!amount) return "0.00"
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return numAmount.toFixed(2)
  }

  const truncateTransactionId = (id: string) => {
    if (id.length <= 10) return id
    return `${id.slice(0, 6)}...${id.slice(-4)}`
  }

  const handleDisputeSort = (field: "time" | "amount") => {
    if (disputeSortField === field) {
      // Toggle direction if same field
      setDisputeSortDirection(disputeSortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field with default desc direction
      setDisputeSortField(field)
      setDisputeSortDirection("desc")
    }
  }

  const sortedDisputeTransactions = [...disputeTransactions]
    .filter((transaction) => {
      if (showOnlyDisputed) {
        return transaction.dispute === true
      }
      return true
    })
    .sort((a, b) => {
      let comparison = 0

      if (disputeSortField === "time") {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
        comparison = timeA - timeB
      } else if (disputeSortField === "amount") {
        const amountA = typeof a.amount === "string" ? Number.parseFloat(a.amount) : a.amount || 0
        const amountB = typeof b.amount === "string" ? Number.parseFloat(b.amount) : b.amount || 0
        comparison = amountA - amountB
      }

      return disputeSortDirection === "asc" ? comparison : -comparison
    })

  // Define calculateNotificationTotal here
  const calculateNotificationTotal = () => {
    return notificationListData.reduce((total, transaction) => {
      const amount = Number.parseFloat(transaction.amount || 0)
      return total + amount
    }, 0)
  }

  const printNotificationSummary = () => {
    if (isMobileDevice()) {
      setShowMobilePrintWarningModal(true)
      return
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Súhrn platieb - ${selectedTransactionDate}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 15px;
              font-size: 12px;
              line-height: 1.4;
            }
            h1 { 
              font-size: 18px;
              color: #333; 
              border-bottom: 2px solid #333; 
              padding-bottom: 8px;
              margin-bottom: 15px;
            }
            p { margin-bottom: 8px; }
            .summary-box {
              background-color: #f5f5f5;
              border: 2px solid #333;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .summary-item {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #ddd;
            }
            .summary-item:last-child {
              border-bottom: none;
              font-weight: bold;
              font-size: 14px;
            }
            .summary-label {
              font-weight: bold;
            }
            .summary-value {
              text-align: right;
            }
            
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <h1>Súhrn platieb</h1>
          <p><strong>Dátum:</strong> ${new Date(selectedTransactionDate).toLocaleDateString("sk-SK")}</p>
          
          <div class="summary-box">
            <div class="summary-item">
              <span class="summary-label">Počet platieb:</span>
              <span class="summary-value">${notificationListData.length}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Celková suma:</span>
              <span class="summary-value">${calculateNotificationTotal().toFixed(2)} EUR</span>
            </div>
          </div>
          
          <p style="margin-top: 15px;"><strong>Vygenerované:</strong> ${new Date().toLocaleString("sk-SK")}</p>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
    }
  }

  const printAllNotifications = () => {
    if (isMobileDevice()) {
      setShowMobilePrintWarningModal(true)
      return
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Zoznam platieb - ${selectedTransactionDate}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 15px;
              font-size: 12px;
              line-height: 1.4;
            }
            h1 { 
              font-size: 18px;
              color: #333; 
              border-bottom: 2px solid #333; 
              padding-bottom: 8px;
              margin-bottom: 15px;
            }
            p { margin-bottom: 8px; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 15px 0;
              font-size: 11px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px 4px;
              text-align: left;
              word-wrap: break-word;
            }
            th { 
              background-color: #f5f5f5; 
              font-weight: bold;
              font-size: 11px;
            }
            .total { 
              font-weight: bold; 
              background-color: #e8f4fd;
            }
            .verified { color: #16a34a; font-weight: bold; }
            .failed { color: #dc2626; font-weight: bold; }
            .pending { color: #9ca3af; }
            .amount { text-align: right; }
            
            @media print {
              body { padding: 10px; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
            
            @media screen and (max-width: 600px) {
              body { font-size: 11px; }
              h1 { font-size: 16px; }
              th, td { padding: 4px 2px; font-size: 10px; }
            }
          </style>
        </head>
        <body>
          <h1>Zoznam platieb</h1>
          <p><strong>Dátum:</strong> ${new Date(selectedTransactionDate).toLocaleDateString("sk-SK")}</p>
          
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Čas</th>
                <th style="width: 30%;">Transaction ID</th>
                <th class="amount" style="width: 15%;">Suma (EUR)</th>
                <th style="width: 40%;">Stav overenia</th>
              </tr>
            </thead>
            <tbody>
              ${notificationListData
                .map((notification) => {
                  const dateStr = notification.created_at
                    ? new Date(notification.created_at).toLocaleTimeString("sk-SK", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"
                  const integrityStatus = notification.integrity_validation === true
                    ? '<span class="verified">Platba v poriadku</span>'
                    : notification.integrity_validation === false
                    ? '<span class="failed">Skontrolujte platbu v banke</span>'
                    : '<span class="pending">Neoverené</span>'
                  
                  return `
                      <tr>
                        <td>${dateStr}</td>
                        <td style="font-family: monospace; font-size: 10px; word-break: break-all;">${notification.transaction_id || "N/A"}</td>
                        <td class="amount">${Number.parseFloat(notification.amount || 0).toFixed(2)}</td>
                        <td>${integrityStatus}</td>
                      </tr>
                    `
                })
                .join("")}
              <tr class="total">
                <td colspan="2"><strong>Celková suma:</strong></td>
                <td class="amount"><strong>${calculateNotificationTotal().toFixed(2)} EUR</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>
          
          <p style="margin-top: 15px;"><strong>Vygenerované:</strong> ${new Date().toLocaleString("sk-SK")}</p>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
    }
  }

  const handleP12Upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setFiles((prev) => ({ ...prev, xmlAuthData: file }))

    // Immediately clear previous certificate info if a new file is uploaded
    setCertificateInfo({ vatsk: null, pokladnica: null })

    // Attempt to read password from input if it exists, otherwise clear
    const passwordInput = document.getElementById("xmlPassword") as HTMLInputElement
    const password = passwordInput?.value || ""

    if (password) {
      // Call convertXmlToPem directly for immediate feedback
      const conversionResult = await convertXmlToPem(file, password)
      if (conversionResult) {
        setFiles((prev) => ({
          ...prev,
          convertedCertPem: conversionResult.certPem,
          convertedKeyPem: conversionResult.keyPem,
        }))
      } else {
        // Error message is handled within convertXmlToPem, but clear PEM if it failed
        setFiles((prev) => ({
          ...prev,
          convertedCertPem: undefined,
          convertedKeyPem: undefined,
        }))
      }
    }
  }

  // Define handleQrModalClose here
  const handleQrModalClose = () => {
    setShowQrModal(false)
    // Reset any state related to the QR modal if necessary
    // For example, if there's a timer or loading state specific to the modal
    setQrLoading(false)
    setQrCode(null)
    setQrTransactionId(null)
    setQrTransactionCreatedAt(null)
    setSubscriptionActive(false)
    setMqttTimerActive(false)
    setMqttTimeRemaining(120)
  }

  // Define handleNotificationDateSelect here
  const handleNotificationDateSelect = (date: string) => {
    setSelectedTransactionDate(date)
    setShowTransactionDateModal(false)
    setShowTransactionListModal(true)
    setNotificationListLoading(true)

    console.log("[v0] handleNotificationDateSelect called with date:", date)
    console.log("[v0] Pokladnica:", certificateInfo.pokladnica)

    // Get user's timezone offset in minutes
    const timezoneOffset = new Date().getTimezoneOffset()

    fetch("/api/get-notifications-by-date", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: date,
        pokladnica: certificateInfo.pokladnica,
        timezoneOffset: timezoneOffset,
        end_point: isProductionMode ? "PRODUCTION" : "TEST",
      }),
    })
      .then((res) => {
        console.log("[v0] Response status:", res.status)
        if (res.status === 429) {
          res.json().then((data) => {
            console.log("[v0] Rate limit exceeded:", data)
            setRateLimitRetryAfter(data.retryAfter || 60)
            setShowRateLimitModal(true)
            setNotificationListLoading(false)
          })
          throw new Error("Rate limit exceeded")
        }
        if (!res.ok) {
          throw new Error("Failed to fetch notifications")
        }
        return res.json()
      })
      .then((data) => {
        console.log("[v0] Received data:", data)
        console.log("[v0] Notifications count:", data.notifications?.length || 0)
        setNotificationListData(data.notifications || [])
      })
      .catch((error) => {
        console.error("[v0] Error fetching notifications:", error)
        setNotificationListData([])
      })
      .finally(() => {
        setNotificationListLoading(false)
      })
  }

  // Define handleTransactionListClick here
  const handleTransactionListClick = () => {
    const today = new Date().toISOString().split("T")[0]
    setSelectedTransactionDate(today)
    setShowTransactionDateModal(true)
  }

  // Define handlePrintTransactions here
  const handlePrintTransactions = () => {
    setShowTransactionDateModal(false)
    setShowTransactionListModal(true)
    setNotificationListLoading(true)

    console.log("[v0] === FRONTEND TRANSACTION FETCH ===")
    console.log("[v0] Selected date:", selectedTransactionDate)
    console.log("[v0] Pokladnica:", certificateInfo.pokladnica)
    console.log("[v0] Is Production:", isProductionMode)

    const userDate = new Date(selectedTransactionDate)
    const startOfDay = new Date(userDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(userDate.setHours(23, 59, 59, 999))

    console.log("[v0] Date range being sent:")
    console.log("[v0]   Start:", startOfDay.toISOString())
    console.log("[v0]   End:", endOfDay.toISOString())

    fetch("/api/get-notifications-by-date", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedTransactionDate,
        pokladnica: certificateInfo.pokladnica,
        end_point: isProductionMode ? "PRODUCTION" : "TEST",
      }),
    })
      .then(async (res) => {
        if (res.status === 429) {
          const data = await res.json()
          console.log("[v0] Rate limit exceeded:", data)
          setRateLimitRetryAfter(data.retryAfter || 60)
          setShowRateLimitModal(true)
          setNotificationListLoading(false)
          return null
        }

        if (!res.ok) {
          throw new Error("Failed to fetch notifications")
        }
        return res.json()
      })
      .then((data) => {
        if (data) {
          console.log("[v0] Fetched notification list data:", data.notifications)
          console.log("[v0] Number of notifications:", data.notifications?.length || 0)
          setNotificationListData(data.notifications || [])
        }
      })
      .catch((error) => {
        console.error("[v0] Error fetching notifications:", error)
        setNotificationListData([])
      })
      .finally(() => {
        setNotificationListLoading(false)
      })
  }

  const formatDateTime = (timestamp: string | null | undefined): string => {
    if (!timestamp) return "N/A"
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return "N/A"
      return date.toLocaleTimeString("sk-SK", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      })
    } catch {
      return "N/A"
    }
  }

  const printDisputedTransactions = () => {
    if (isMobileDevice()) {
      setShowMobilePrintWarningModal(true)
      return
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Zoznam nepotvrdených platieb - Tlač</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .amount { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Zoznam nepotvrdených platieb - ${selectedDisputeDate}</h1>
          <table>
            <thead>
              <tr>
                <th>Čas</th>
                <th>ID transakcie</th>
                <th class="amount">Suma (EUR)</th>
                <th>Stav</th>
              </tr>
            </thead>
            <tbody>
              ${sortedDisputeTransactions.map((transaction) => {
                return `
                      <tr>
                        <td>${formatDateTime(transaction.created_at)}</td>
                        <td style="font-family: monospace; font-size: 10px; word-break: break-all;">${transaction.transaction_id}</td>
                        <td class="amount">${formatAmount(transaction.amount)}</td>
                        <td>${transaction.dispute ? "Údajne uhradená" : "Iba pokus"}</td>
                      </tr>
                    `
              }).join("")}
            </tbody>
          </table>
          
          <p style="margin-top: 15px;"><strong>Vygenerované:</strong> ${new Date().toLocaleString("sk-SK")}</p>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
    }
  }

  const isMobileDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    // Check for iOS
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      return true
    }
    // Check for Android
    if (/android/i.test(userAgent)) {
      return true
    }
    return false
  }

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="min-h-screen bg-background p-4">
          {!isOnline && (
            <div className="bg-destructive text-destructive-foreground p-2 text-center text-sm flex items-center justify-center gap-2">
              <WifiOff className="h-4 w-4" />
              Momentálne ste offline. Niektoré funkcie nemusia fungovať.
            </div>
          )}

          <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
            {!allRequiredFieldsComplete && (
              <div className="login-container">
                <div className="w-full px-4 max-w-lg mx-auto">
                  <div className="login-card p-6 md:p-10">
                    {/* Header Section */}
                    <div className="text-center mb-8">
                      <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Prihlásenie</h1>
                      <p className="text-gray-600 text-sm md:text-base">e-kasa prihlasovacie údaje</p>
                    </div>

                    {/* Environment Badge */}
                    <div className={`env-badge rounded-xl px-6 py-4 mb-8 ${isProductionMode ? "production" : "test"}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/30 rounded-lg backdrop-blur-sm">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-sm md:text-base">
                              {isProductionMode ? "Produkčné prostredie" : "Testovacie prostredie"}
                            </p>
                            <p className="text-xs opacity-90">
                              {isProductionMode ? "Skutočné bankové oznámenia" : "Iba testovanie oznámenia"}
                            </p>
                          </div>
                        </div>
                        <Switch
                          id="production-toggle"
                          checked={isProductionMode}
                          onCheckedChange={handleProductionToggle}
                          className="data-[state=checked]:bg-white/30"
                        />
                      </div>
                    </div>

                    {/* Production Confirmation Modal */}
                    <Dialog open={showProductionConfirmModal} onOpenChange={setShowProductionConfirmModal}>
                      <DialogContent className="rounded-2xl max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Prepnúť na produkčné prostredie?
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Prepnutím na produkčné prostredie budete prijímať skutočné bankové oznámenia.
                          </p>

                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-20"></div>
                            <div className="relative bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl">
                              <p className="text-sm font-medium flex items-center gap-2">
                                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Pred pokračovaním skontrolujte tieto požiadavky
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4 bg-gray-50/50 rounded-xl p-4 border border-gray-200">
                            {/* Checkbox 1 */}
                            <div className="flex items-start gap-3 group">
                              <div className="relative flex items-center justify-center mt-0.5">
                                <input
                                  type="checkbox"
                                  id="prod-check-1"
                                  checked={productionCheck1}
                                  onChange={(e) => setProductionCheck1(e.target.checked)}
                                  className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer"
                                />
                              </div>
                              <label
                                htmlFor="prod-check-1"
                                className="text-sm font-medium text-gray-700 cursor-pointer group-hover:text-gray-900 transition-colors leading-relaxed"
                              >
                                Máme aktivovanú službu oznamovania okamžitých úhrad v banke.
                              </label>
                            </div>

                            {/* Checkbox 2 with copy email feature */}
                            <div className="flex items-start gap-3 group">
                              <div className="relative flex items-center justify-center mt-0.5">
                                <input
                                  type="checkbox"
                                  id="prod-check-2"
                                  checked={productionCheck2}
                                  onChange={(e) => setProductionCheck2(e.target.checked)}
                                  className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer"
                                />
                              </div>
                              <label
                                htmlFor="prod-check-2"
                                className="text-sm font-medium text-gray-700 cursor-pointer group-hover:text-gray-900 transition-colors leading-relaxed flex-1"
                              >
                                Máme podpísanú Dohodu o spolupráci s FS SR
                                <button
                                  type="button"
                                  onClick={copyEmailToClipboard}
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-mono text-xs bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 transition-all"
                                >
                                  kverkom.kasoveIS@financnasprava.sk
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                </button>
                                .
                              </label>
                            </div>
                          </div>

                          <div className="flex gap-3 justify-end pt-2">
                            <Button
                              variant="outline"
                              onClick={cancelProductionSwitch}
                              className="rounded-xl bg-transparent hover:bg-gray-100 transition-colors"
                            >
                              Zrušiť
                            </Button>
                            <Button
                              onClick={confirmProductionSwitch}
                              disabled={!productionCheck1 || !productionCheck2}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                            >
                              {productionCheck1 && productionCheck2 ? (
                                <span className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Áno, pokračovať
                                </span>
                              ) : (
                                "Áno, pokračovať"
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Form Fields */}
                    <div className="space-y-6">
                      {/* XML Auth Data Upload */}
                      <div className="space-y-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Label
                                htmlFor="xmlAuthData"
                                className="text-sm font-semibold text-gray-800 flex items-center gap-2 cursor-help"
                              >
                                Autentifikačné údaje (XML súbor z e-kasa zóny)
                                <Info className="h-4 w-4 text-blue-500" />
                              </Label>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>
                                Autentifikačné údajte vo forme XML súboru nájdete v e-kasa zóne na portály finančnej
                                správy.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className={`file-upload-zone ${files.xmlAuthData ? "has-file" : ""}`}>
                          <Input
                            id="xmlAuthData"
                            type="file"
                            accept=".xml"
                            onChange={handleP12Upload}
                            className="border-0 bg-transparent focus:ring-0 focus:outline-none cursor-pointer"
                          />
                          {files.xmlAuthData && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-500 rounded-full p-1">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Password Field */}
                      <div className="space-y-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Label
                                htmlFor="xmlPassword"
                                className="text-sm font-semibold text-gray-800 flex items-center gap-2 cursor-help"
                              >
                                Heslo
                                <Info className="h-4 w-4 text-blue-500" />
                              </Label>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
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
                            className="input-modern"
                          />
                          {files.xmlPassword && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-500 rounded-full p-1">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* IBAN Field */}
                      <div className="space-y-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Label
                                htmlFor="userIban"
                                className="text-sm font-semibold text-gray-800 flex items-center gap-2 cursor-help"
                              >
                                IBAN
                                <Info className="h-4 w-4 text-blue-500" />
                              </Label>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>
                                Zadajte Váš podnikateľský bankový účet, ktorý ste si označili v banke ako notifikačný
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="relative">
                          <Input
                            id="userIban"
                            type="text"
                            placeholder="SK00 0000 0000 0000 0000 0000"
                            value={userIban}
                            onChange={handleIbanChange}
                            className="input-modern tracking-widest"
                          />
                          {userIban && isValidIbanFormat(userIban) && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-500 rounded-full p-1">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Merchant Account Name Field */}
                      <div className="space-y-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Label
                                htmlFor="merchantAccountName"
                                className="text-sm font-semibold text-gray-800 flex items-center gap-2 cursor-help"
                              >
                                Názov bankového účtu obchodníka
                                <Info className="h-4 w-4 text-blue-500" />
                              </Label>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Zadajte názov Vášho bankového účtu, ktorý sa zobrazí na platobnom príkaze</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="relative">
                          <Input
                            id="merchantAccountName"
                            type="text"
                            placeholder="Názov obchodníka"
                            value={merchantAccountName}
                            onChange={(e) => setMerchantAccountName(e.target.value)}
                            className="input-modern"
                          />
                          {merchantAccountName && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-500 rounded-full p-1">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button
                        onClick={handleSaveConfiguration}
                        disabled={!canSaveConfiguration || savingConfiguration}
                        className={`button-modern w-full font-bold h-14 rounded-xl transition-all duration-300 ${
                          !canSaveConfiguration || savingConfiguration
                            ? "bg-gray-400 text-gray-800 cursor-not-allowed"
                            : "bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-lg shadow-blue-500/50"
                        }`}
                      >
                        {savingConfiguration ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Prihlasovanie...
                          </div>
                        ) : (
                          "Prihlásiť sa"
                        )}
                      </Button>

                      {/* Error Alert */}
                      {error && (
                        <Alert variant="destructive" className="mt-4 rounded-xl shadow-md">
                          <XCircle className="h-5 w-5" />
                          <AlertDescription className="text-sm">{error}</AlertDescription>
                        </Alert>
                      )}

                      {/* Success Message */}
                      {configurationSaved && (
                        <div className="text-center mt-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-xl shadow-sm">
                          <p className="flex items-center justify-center gap-2">
                            <CheckCircle className="h-5 w-5 flex-shrink-0" />
                            <span className="font-medium">Úspešne prihlásený</span>
                          </p>
                        </div>
                      )}

                      {/* Download Link */}
                      {!isProductionMode && (
                        <div className="text-center pt-6 border-t border-gray-700/20">
                          <p className="text-xs text-gray-500 mb-3">Potrebujete XML autentifikačné údaje a heslo?</p>
                          <a
                            href="/download"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                          >
                            <span>Získať autentifikačné údaje</span>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      )}

                      {/* GitHub Link */}
                      <div className="text-center pt-4 mt-4 border-t border-gray-700/20">
                        <a
                          href="https://github.com/spavlovic77/v0-nop-web-test-client"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
                        >
                          <Github className="h-3 w-3" />
                          <span>Zdrojové kódy</span>
                        </a>
                      </div>
                    </div>
                  </div>
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
                        onChange={handleP12Upload}
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
                      <QrCode className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24" />
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
              <DialogContent
                className="sm:max-w-md w-[95vw] max-h-[90vh] flex flex-col rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border-0"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
              >
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-center">
                    Prichádzajúca platba
                  </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-6 min-h-[400px]">
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
                      {/* QR Code with enhanced styling */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-xl opacity-20"></div>
                        <div className="relative bg-white p-6 rounded-2xl shadow-xl border-2 border-gray-100">
                          <img src={qrCode || "/placeholder.svg"} alt="Payment QR Code" className="w-64 h-64" />
                        </div>
                      </div>

                      <div className="w-full max-w-sm space-y-4 px-4">
                        {/* Timer progress with modern styling */}
                        <div className="space-y-3 bg-gray-50/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200">
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-1000 shadow-lg"
                              style={{ width: `${(mqttTimeRemaining / 120) * 100}%` }}
                            />
                          </div>
                          <Button
                            variant="outline"
                            className="w-full bg-white/80 backdrop-blur-sm rounded-xl border-gray-300 hover:bg-white hover:border-blue-400 hover:text-blue-600 transition-all duration-300 font-medium h-11"
                            disabled={mqttTimerActive || mqttTimeRemaining > 0}
                            onClick={() => {
                              console.log("[v0] Repeat subscription clicked")
                              if (qrTransactionId) {
                                subscribeToQrBankNotifications(qrTransactionId)
                              }
                            }}
                          >
                            {mqttTimerActive
                              ? `Čakám oznámenie z banky ${mqttTimeRemaining}s`
                              : "Klikni pre opätovné pripojenie k banke"}
                          </Button>
                        </div>

                        {/* Cancel payment button with gradient styling */}
                        <Button
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl h-11 font-medium shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300"
                          onClick={handleCancelPayment}
                        >
                          Zrušiť platbu
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-30"></div>
                        <XCircle className="relative h-12 w-12 text-red-600" />
                      </div>
                      <span className="text-base font-medium text-red-600">Chyba pri generovaní QR kódu</span>
                    </div>
                  )}
                </div>

                {/* Test mode simulator section with enhanced styling */}
                {qrCode && !isProductionMode && (
                  <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50 rounded-b-2xl -mx-6 -mb-6 px-6 pb-6">
                    <div className="flex items-center gap-3 justify-end">
                      <span className="text-xs font-medium text-amber-800 text-right max-w-[200px]">
                        Simulátor úhrady. Naskenuj link kamerou.
                      </span>
                      <div className="bg-white p-2 rounded-xl border-2 border-amber-200 shadow-md flex-shrink-0">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent("https://scantopay.vercel.app")}`}
                          alt="Scan to open scantopay.vercel.app"
                          className={`w-20 h-20 object-contain transition-all duration-300 ${
                            scanToggleActive ? "blur-none" : "blur-sm"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                      <span className="text-xs font-medium text-amber-800">
                        {scanToggleActive ? `Zostávajúci čas ${scanTimeRemaining}s` : "Zaostri QR kód"}
                      </span>
                      <button
                        onClick={handleScanToggle}
                        disabled={scanToggleActive}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md ${
                          scanToggleActive ? "bg-gradient-to-r from-blue-500 to-indigo-600" : "bg-gray-300 hover:bg-gray-400"
                        } ${scanToggleActive ? "cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                            scanToggleActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={showPaymentReceivedModal} onOpenChange={setShowPaymentReceivedModal}>
              <DialogContent className="max-w-[95vw] max-h-[90vh] rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border-0">
                <div className="space-y-6 text-center py-8 px-4">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-center">
                    Prichádzajúca platba
                  </div>

                  {verifyingIntegrity ? (
                    <div className="flex flex-col items-center justify-center gap-6 py-4">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                      <span className="text-lg font-medium text-gray-700">Kontrolujem integritu platby</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-6 py-4">
                      {integrityError ? (
                        <>
                          <XCircle className="h-16 w-16 text-red-500" />
                          {(() => {
                            // Compare expected amount with received amount
                            const expectedAmount = eurAmount
                            const receivedAmount = confirmedPaymentAmount
                            const amountsMatch = expectedAmount === receivedAmount

                            if (!amountsMatch) {
                              // Amounts don't match - show comparison
                              const formatAmount = (cents: string) => {
                                if (!cents || cents === "0") return "0,00"
                                const cleanDigits = cents.replace(/^0+/, "") || "0"
                                const paddedDigits = cleanDigits.padStart(2, "0")
                                const centsValue = paddedDigits.slice(-2)
                                const euros = paddedDigits.slice(0, -2) || "0"
                                return `${euros},${centsValue}`
                              }

                              return (
                                <div className="space-y-4 w-full">
                                  <span className="text-lg font-semibold text-yellow-600">
                                    Pozor! Preverte platbu vo Vašej banke
                                  </span>
                                  <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl space-y-3 border border-red-200 shadow-lg">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-gray-600">Očakávaná suma:</span>
                                      <span className="text-xl font-bold text-gray-900">
                                        {formatAmount(expectedAmount)} EUR
                                      </span>
                                    </div>
                                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-gray-600">Oznámená suma:</span>
                                      <span className="text-xl font-bold text-gray-900">
                                        {formatAmount(receivedAmount)} EUR
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            } else {
                              // Amounts match but integrity error - invalid payment
                              return (
                                <span className="text-lg font-semibold text-red-600">
                                  Toto je neplatná platba. Môže ísť o podvod.
                                </span>
                              )
                            }
                          })()}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-16 w-16 text-green-500" />
                          <span className="text-lg font-semibold text-green-600">
                            Platba vo výške {(() => {
                              const formatAmount = (cents: string) => {
                                if (!cents || cents === "0") return "0,00"
                                const cleanDigits = cents.replace(/^0+/, "") || "0"
                                const paddedDigits = cleanDigits.padStart(2, "0")
                                const centsValue = paddedDigits.slice(-2)
                                const euros = paddedDigits.slice(0, -2) || "0"
                                return `${euros},${centsValue}`
                              }
                              return formatAmount(confirmedPaymentAmount)
                            })()} EUR overená
                          </span>
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
                      className="w-full touch-manipulation min-h-[48px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
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

            <Dialog open={showRateLimitModal} onOpenChange={setShowRateLimitModal}>
              <DialogContent className="sm:max-w-md">
                <div className="space-y-6 py-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      <Clock className="h-16 w-16 text-amber-500 animate-pulse" />
                      <div className="absolute inset-0 h-16 w-16 rounded-full bg-amber-500/20 animate-ping" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-base text-foreground font-medium">Dosiahli ste limit požiadaviek</p>
                    <p className="text-sm text-muted-foreground">
                      Prosím, skúste to znova o {rateLimitRetryAfter} sekúnd
                    </p>
                  </div>
                  <Button onClick={() => setShowRateLimitModal(false)} className="w-full" variant="default">
                    Rozumiem
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
                      Dátum
                    </Label>
                    <div
                      className="cursor-pointer"
                      onClick={() => document.getElementById("transactionDate")?.showPicker?.()}
                    >
                      <Input
                        id="transactionDate"
                        type="date"
                        value={selectedTransactionDate}
                        onChange={(e) => setSelectedTransactionDate(e.target.value)}
                        className="w-full cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowTransactionDateModal(false)} className="flex-1">
                      Zrušiť
                    </Button>
                    <Button onClick={() => handleNotificationDateSelect(selectedTransactionDate)} disabled={!selectedTransactionDate} className="flex-1">
                      Vyhľadať
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showTransactionListModal} onOpenChange={setShowTransactionListModal}>
              <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Zoznam platieb -{" "}
                    {selectedTransactionDate ? new Date(selectedTransactionDate).toLocaleDateString("sk-SK") : ""}
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {notificationListLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <span className="ml-2">Načítavam platby...</span>
                    </div>
                  ) : notificationListData.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{notificationListData.length}</div>
                          <div className="text-sm text-gray-600">Platieb</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {calculateNotificationTotal().toFixed(2)} €
                          </div>
                          <div className="text-sm text-gray-600">Celková suma</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Žiadne platby pre vybraný dátum</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between gap-2 mt-4">
                  <div className="flex gap-2">
                    <Button onClick={printNotificationSummary} variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-2" />
                      Tlačiť súhrn
                    </Button>
                    <Button onClick={printAllNotifications} variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-2" />
                      Tlačiť všetky
                    </Button>
                  </div>
                  <Button onClick={() => setShowTransactionListModal(false)}>Zavrieť</Button>
                </div>
              </DialogContent>
            </Dialog>
            {/* Dispute confirmation modal (from cancel payment) */}
            <Dialog open={showDisputeConfirmModal} onOpenChange={setShowDisputeConfirmModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Doklad</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-center text-lg">Vyhotoviť doklad o nepotvrdení údajne zrealizovanej platby?</p>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={handleDisputeNo}>
                      Nie
                    </Button>
                    <Button className="flex-1" onClick={handleConfirmDispute}>
                      Áno
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showDisputeActionModal} onOpenChange={setShowDisputeActionModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Doklad</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-center text-lg">Vyhotoviť doklad o nepotvrdení zrealizovanej platby ?</p>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={handleCancelDisputeAction}>
                      Nie
                    </Button>
                    <Button className="flex-1" onClick={handleConfirmDisputeAction}>
                      Áno
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Dispute date picker modal */}
            <Dialog open={showDisputeDateModal} onOpenChange={setShowDisputeDateModal}>
              <DialogContent className="max-w-md">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center">Vyberte dátum</h3>

                  <div className="space-y-2">
                    <Label htmlFor="disputeDate" className="text-sm font-medium">
                      Dátum
                    </Label>
                    <div
                      className="cursor-pointer"
                      onClick={() => document.getElementById("disputeDate")?.showPicker?.()}
                    >
                      <Input
                        id="disputeDate"
                        type="date"
                        value={selectedDisputeDate}
                        onChange={(e) => setSelectedDisputeDate(e.target.value)}
                        className="w-full cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowDisputeDateModal(false)} className="flex-1">
                      Zrušiť
                    </Button>
                    <Button onClick={handleDisputeDateSelect} disabled={!selectedDisputeDate} className="flex-1">
                      Zobraziť transakcie
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showDisputeListModal} onOpenChange={setShowDisputeListModal}>
              <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Nepotvrdené platby -{" "}
                    {selectedDisputeDate ? new Date(selectedDisputeDate).toLocaleDateString("sk-SK") : ""}
                  </h3>
                  <div className="flex items-center gap-2">
                    <label htmlFor="dispute-filter" className="text-sm font-medium">
                      Iba sporné
                    </label>
                    <Switch id="dispute-filter" checked={showOnlyDisputed} onCheckedChange={setShowOnlyDisputed} />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {disputeListLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <span className="ml-2">Načítavam transakcie...</span>
                    </div>
                  ) : disputeTransactions.length > 0 ? (
                    <div className="space-y-2">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th
                              className="border p-2 text-left text-sm font-medium cursor-pointer hover:bg-gray-100"
                              onClick={() => handleDisputeSort("time")}
                            >
                              <div className="flex items-center gap-1">
                                Čas
                                {disputeSortField === "time" && (
                                  <span className="text-xs">{disputeSortDirection === "asc" ? "↑" : "↓"}</span>
                                )}
                              </div>
                            </th>
                            <th className="border p-2 text-left text-sm font-medium">ID transakcie</th>
                            <th
                              className="border p-2 text-right text-sm font-medium cursor-pointer hover:bg-gray-100"
                              onClick={() => handleDisputeSort("amount")}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Suma (EUR)
                                {disputeSortField === "amount" && (
                                  <span className="text-xs">{disputeSortDirection === "asc" ? "↑" : "↓"}</span>
                                )}
                              </div>
                            </th>
                            <th className="border p-2 text-center text-sm font-medium">Akcia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedDisputeTransactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-gray-50">
                              <td className="border p-2 text-sm">{formatDateTime(transaction.created_at)}</td>
                              <td className="border p-2 text-sm font-mono" title={transaction.transaction_id}>
                                {truncateTransactionId(transaction.transaction_id)}
                              </td>
                              <td className="border p-2 text-sm text-right">{formatAmount(transaction.amount)}</td>
                              <td className="border p-2 text-center">
                                {!transaction.dispute ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleTransactionDisputeClick(transaction)}
                                    className="p-1"
                                    title="Vyhotoviť doklad o nepotvrdennej platbe"
                                  >
                                    <FilePlus className="h-4 w-4 text-orange-500" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedDisputeTransaction(transaction)
                                      setShowConfirmationQrModal(true)
                                    }}
                                    className="p-1"
                                    title="Zobraziť potvrdenie"
                                  >
                                    <FileCheck className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Žiadne transakcie pre vybraný dátum</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-4">
                  <Button
                    onClick={printDisputedTransactions}
                    variant="outline"
                    disabled={sortedDisputeTransactions.filter((t) => t.dispute === true).length === 0}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Vytlačiť
                  </Button>
                  <Button onClick={() => setShowDisputeListModal(false)}>Zavrieť</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showConfirmationQrModal} onOpenChange={setShowConfirmationQrModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Doklad o nepotvrdení údajne zrealizovanej platby</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedDisputeTransaction && (
                    <div className="space-y-2 bg-muted p-3 rounded-lg">
                      <div className="text-sm">
                        <span className="font-semibold">ID transakcie:</span>
                        <p className="font-mono text-xs break-all mt-1">{selectedDisputeTransaction.transaction_id}</p>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold">Čas vytvorenia:</span>
                        <p className="mt-1">{formatDateTime(selectedDisputeTransaction.created_at)}</p>
                      </div>
                    </div>
                  )}
                  <p className="text-center text-sm text-muted-foreground">
                    Naskenujte QR kód mobilným zariadením pre zobrazenie dokladu
                  </p>
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <QRCodeSVG value={confirmationUrl} size={256} level="H" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        if (isMobileDevice()) {
                          setShowMobilePrintWarningModal(true)
                          return
                        }
                        // </CHANGE>
                        if (selectedDisputeTransaction) {
                          window.open(`/confirmation/${selectedDisputeTransaction.transaction_id}`, "_blank")
                        }
                      }}
                    >
                      Tlačiť
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setShowConfirmationQrModal(false)
                        setSelectedDisputeTransaction(null)
                      }}
                    >
                      Zavrieť
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Logout Confirmation Modal */}
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
                      <span className="text-sm font-medium">{certificateInfo.pokladnica.slice(3)}</span>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleTransactionListClick}
                    className="p-3 mx-1"
                    title="Zoznam platieb"
                  >
                    <Printer className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisputeClick}
                    className="p-3 mx-1"
                    title="Doklady o nepotvrdených platbách"
                  >
                    <FileText className="h-5 w-5" />
                  </Button>

                  {/* Console log button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConsoleModal(true)}
                    className="p-3 mx-1"
                    title="Denník logov"
                  >
                    <Terminal className="h-5 w-5" />
                  </Button>

                  <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Odhlásenie</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <p className="text-center">Naozaj sa chcete odhlásiť?</p>
                      </div>
                      <DialogFooter className="sm:justify-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowLogoutModal(false)}
                        >
                          Zrušiť
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => {
                            setShowLogoutModal(false)
                            window.location.reload()
                          }}
                        >
                          Odhlásiť
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Refresh button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLogoutModal(true)}
                    className="p-3 mx-1"
                    title="Log out"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </footer>
          )}

          {/* Mobile Print Warning Modal */}
          <Dialog open={showMobilePrintWarningModal} onOpenChange={setShowMobilePrintWarningModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tlač nie je podporovaná na mobilných zariadeniach</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-center">
                  Pre tlač dokumentov odporúčame použiť stolný počítač alebo notebook. Na mobilných
                  zariadeniach funkcia tlače nemusí správne fungovať.
                </p>
              </div>
              <DialogFooter className="sm:justify-center">
                <Button onClick={() => setShowMobilePrintWarningModal(false)}>Rozumiem</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  )
}

export default Home
