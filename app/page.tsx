"use client"

import React from "react"
import type { FunctionComponent } from "react"
import {
  Copy,
  XCircle,
  FilePlus,
  Github,
  CheckCircle,
  Printer,
  Terminal,
  LogOut,
  User,
  Calendar,
  FileText,
  FileCheck,
} from "lucide-react" // Import Copy icon, AlertTriangle icon, FileText, Github, CheckCircle, Printer, Terminal, LogOut, User, Clock, Calendar, Check, AlertCircle
import { Euro } from "lucide-react" // Import Euro, Printer, Calendar icons

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog" // Import DialogHeader and DialogTitle
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { X, WifiOff, Info, QrCode, MoveLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload } from "lucide-react"
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

const EMBEDDED_CA_BUNDLE = `-----BEGIN CERTIFICATE-----
MIIEjTCCA3WgAwIBAgIQDQd4KhM/xvmlcpbhMf/ReTANBgkqhkiG9w0BAQsFADBh
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBH
MjAeFw0xNzExMDIxMjIzMzdaFw0yNzExMDIxMjIzMzdaMGAxCzAJBgNVBAYTAlVT
MRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxGTAXBgNVBAsTEHd3dy5kaWdpY2VydC5j
b20xHzAdBgNVBAMTFkdlb1RydXN0IFRMUyBSU0EgQ0EgRzEwggEiMA0GCSqGSIb3
DQEBAQUAA4IBDwAwggEKAoIBAQC+F+jsvikKy/65LWEx/TMkCDIuWegh1Ngwvm4Q
yISgP7oU5d79eoySG3vOhC3w/3jEMuipoH1fBtp7m0tTpsYbAhch4XA7rfuD6whU
gajeErLVxoiWMPkC/DnUvbgi74BJmdBiuGHQSd7LwsuXpTEGG9fYXcbTVN5SATYq
DfbexbYxTMwVJWoVb6lrBEgM3gBBqiiAiy800xu1Nq07JdCIQkBsNpFtZbIZhsDS
fzlGWP4wEmBQ3O67c+ZXkFr2DcrXBEtHam80Gp2SNhou2U5U7UesDL/xgLK6/0d7
6TnEVMSUVJkZ8VeZr+IUIlvoLrtjLbqugb0T3OYXW+CQU0kBAgMBAAGjggFAMIIB
PDAdBgNVHQ4EFgQUlE/UXYvkpOKmgP792PkA76O+AlcwHwYDVR0jBBgwFoAUTiJU
IBiV5uNu5g/6+rkS7QYXjzkwDgYDVR0PAQH/BAQDAgGGMB0GA1UdJQQWMBQGCCsG
AQUFBwMBBggrBgEFBQcDAjASBgNVHRMBAf8ECDAGAQH/AgEAMDQGCCsGAQUFBwEB
BCgwJjAkBggrBgEFBQcwAYYYaHR0cDovL29jc3AuZGlnaWNlcnQuY29tMEIGA1Ud
HwQ7MDkwN6A1oDOGMWh0dHA6Ly9jcmwzLmRpZ2ljZXJ0LmNvbS9EaWdpQ2VydEds
b2JhbFJvb3RHMi5jcmwwPQYDVR0gBDYwNDAyBgRVHSAAMCowKAYIKwYBBQUHAgEW
HGh0dHBzOi8vd3d3LmRpZ2ljZXJ0LmNvbS9DUFMwDQYJKoZIhvcNAQELBQADggEB
AIIcBDqC6cWpyGUSXAjjAcYwsK4iiGF7KweG97i1RJz1kwZhRoo6orU1JtBYnjzB
c4+/sXmnHJk3mlPyL1xuIAt9sMeC7+vreRIF5wFBC0MCN5sbHwhNN1JzKbifNeP5
ozpZdQFmkCo+neBiKR6HqIA+LMTMCMMuv2khGGuPHmtDze4GmEGZtYLyF8EQpa5Y
jPuV6k2Cr/N3XxFpT3hRpt/3usU/Zb9wfKPtWpoznZ4/44c1p9rzFcZYrWkj3A+7
TNBJE0GmP2fhXhP1D/XVfIW/h0yCJGEiV9Glm/uGOa3DXHlmbAcxSyCRraG+ZBkA
7h4SeM6Y8l/7MBRpPCz6l8Y=
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
q2EGnI/RRO06ZIya7XzV+hdG82MHauVBJVJ8zUtluNJbd134/tJS7SsVQepj5Wz
tCO7TG1F8PapspUwtP1MVYwnSlcUfIKdzXOS0xZKBgyMUNGPHgm+F6HmIcr9g+UQ
vIOlCsRnKPZzFBQ9RnbDhxSJITRNrw9FDKZJobq7nMWxM4MphQIDAQABo0IwQDAP
BgNVHRMBAf8EBTADAQH/MA4GA1UdDwEB/wQEAwIBhjAdBgNVHQ4EFgQUTiJUIBiV
5uNu5g/6+rkS7QYXjzkwDQYJKoZIhvcNAQELBQADggEBAGBnKJRvDkhj6zHd6mcY
1Yl9PMWLSn/pvtsrF9+wX3N3KjITOYFnQoQj8kVnNeyIv/iPsGEMNKSuIEyExtv4
NeF22d+mQrvHRAiGfzZ0JFrabA0UWTW98kndth/Jsw1HKj2ZL7tcu7XUIOGZX1NG
Fdtom/DzMNU+MeKNhJ7jitralj41E6Vf8PlwUHBHQRFUGU7Aj64GxJUTFy8bJZ91
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

  const [showDisputeDateModal, setShowDisputeDateModal] = useState(false)
  const [selectedDisputeDate, setSelectedDisputeDate] = useState<string>("")
  const [showDisputeListModal, setShowDisputeListModal] = useState(false)
  const [disputeTransactions, setDisputeTransactions] = useState<any[]>([])
  const [disputeListLoading, setDisputeListLoading] = useState(false)
  const [selectedDisputeTransaction, setSelectedDisputeTransaction] = useState<string | null>(null)
  const [showDisputeActionModal, setShowDisputeActionModal] = useState(false)

  const [showDisputeConfirmModal, setShowDisputeConfirmModal] = useState(false)
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null)
  const [disputeSortField, setDisputeSortField] = useState<"time" | "amount">("time")
  const [disputeSortDirection, setDisputeSortDirection] = useState<"asc" | "desc">("desc")

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
      CN: merchantAccountName || "Kverkom s.r.o.", // Creditor name
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
        formData.append("iban", userIban)
        formData.append("amount", numericAmount)

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

        console.log("[v0] Logging generate-transaction API call to console...")
        logApiCall(logEntry)
        console.log("[v0] Generate-transaction API call logged successfully")

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
      cleanupRef.current.push(() => clearInterval(timerInterval)) // Add cleanup for the interval

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
      formData.append("vatsk", certificateInfo.vatsk)
      formData.append("pokladnica", certificateInfo.pokladnica)

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

            try {
              const updateResponse = await fetch("/api/update-integrity-validation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  transactionId: transactionId,
                  isValid: hashesMatch,
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

  const handleDisputeConfirmation = async () => {
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

      if (!response.ok) {
        throw new Error("Failed to update dispute flag")
      }

      // Close modals
      setShowDisputeConfirmModal(false)
      setShowQrModal(false)

      // Open confirmation in new window for printing
      window.open(`/confirmation/${currentTransactionId}`, "_blank")

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
    // Store current transaction ID
    setCurrentTransactionId(qrTransactionId)
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
    setShowDisputeDateModal(true)
  }

  const handleDisputeDateSelect = async () => {
    if (!selectedDisputeDate || !certificateInfo?.pokladnica) return

    setShowDisputeDateModal(false)
    setShowDisputeListModal(true)
    setDisputeListLoading(true)

    try {
      const response = await fetch("/api/get-transactions-by-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDisputeDate,
          pokladnica: certificateInfo.pokladnica,
        }),
      })

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

  const handleTransactionDisputeClick = (transactionId: string) => {
    console.log("[v0] handleTransactionDisputeClick called with:", transactionId)
    setSelectedDisputeTransaction(transactionId)
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
        body: JSON.stringify({ transactionId: selectedDisputeTransaction }),
      })

      if (!response.ok) {
        throw new Error("Failed to update dispute flag")
      }

      // Open confirmation in new window for printing
      window.open(`/confirmation/${selectedDisputeTransaction}`, "_blank")

      // Close modals and refresh the list
      setShowDisputeActionModal(false)
      setSelectedDisputeTransaction(null)

      // Refresh the transaction list
      handleDisputeDateSelect()
    } catch (error) {
      console.error("[v0] Error updating dispute:", error)
      alert("Chyba pri aktualizácii sporu")
    }
  }

  const handleCancelDisputeAction = () => {
    setShowDisputeActionModal(false)
    setSelectedDisputeTransaction(null)
  }

  const formatAmount = (amount: string | number | null) => {
    if (!amount) return "0.00"
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return (numAmount / 100).toFixed(2)
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

  const sortedDisputeTransactions = [...disputeTransactions].sort((a, b) => {
    let comparison = 0

    if (disputeSortField === "time") {
      const timeA = new Date(a.response_timestamp).getTime()
      const timeB = new Date(b.response_timestamp).getTime()
      comparison = timeA - timeB
    } else if (disputeSortField === "amount") {
      const amountA = typeof a.amount === "string" ? Number.parseFloat(a.amount) : a.amount || 0
      const amountB = typeof b.amount === "string" ? Number.parseFloat(b.amount) : b.amount || 0
      comparison = amountA - amountB
    }

    return disputeSortDirection === "asc" ? comparison : -comparison
  })

  const handlePrintDisputedTransactions = () => {
    const disputedTransactions = sortedDisputeTransactions.filter((t) => t.dispute === true)

    if (disputedTransactions.length === 0) {
      return
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Doklady o neoznámenej úhrade</title>
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
          <h1>Doklady o neoznámenej úhrade</h1>
          <p><strong>Dátum:</strong> ${selectedDisputeDate ? new Date(selectedDisputeDate).toLocaleDateString("sk-SK") : ""}</p>
          <p><strong>Pokladnica:</strong> ${certificateInfo?.pokladnica?.slice(3) || ""}</p>
          <table>
            <thead>
              <tr>
                <th style="width: 25%;">Čas</th>
                <th style="width: 50%;">Transaction ID</th>
                <th class="amount" style="width: 25%;">Suma (EUR)</th>
              </tr>
            </thead>
            <tbody>
              ${disputedTransactions
                .map((transaction) => {
                  const amount = transaction.amount ? (Number.parseInt(transaction.amount) / 100).toFixed(2) : "0.00"
                  return `
                    <tr>
                      <td>${new Date(transaction.response_timestamp).toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td style="font-family: monospace; font-size: 10px; word-break: break-all;">${transaction.transaction_id}</td>
                      <td class="amount">${amount}</td>
                    </tr>
                  `
                })
                .join("")}
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
  // </CHANGE>

  const handleQrModalClose = (open: boolean) => {
    // Do nothing - modal can only be closed via the "Zrušiť platbu" button
  }

  const handleTransactionListClick = () => {
    // Set default date to today
    const today = new Date().toISOString().split("T")[0]
    setSelectedTransactionDate(today)
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
        .select("payload_received_at, end_to_end_id, amount, integrity_validation")
        .eq("pokladnica", certificateInfo.pokladnica)
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

  const printAllTransactions = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Všetky transakcie - ${selectedTransactionDate}</title>
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
          <h1>Všetky transakcie</h1>
          <p><strong>Dátum:</strong> ${new Date(selectedTransactionDate).toLocaleDateString("sk-SK")}</p>
          
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Čas</th>
                <th style="width: 40%;">Transaction ID</th>
                <th class="amount" style="width: 20%;">Suma (EUR)</th>
                <th style="width: 25%;">Overenie</th>
              </tr>
            </thead>
            <tbody>
              ${transactionListData
                .map((transaction) => {
                  const verificationStatus =
                    transaction.integrity_validation === true
                      ? '<span class="verified">✓ OK</span>'
                      : transaction.integrity_validation === false
                        ? '<span class="failed">⚠ Chyba</span>'
                        : '<span class="pending">-</span>'

                  return `
                      <tr>
                        <td>${new Date(transaction.payload_received_at).toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" })}</td>
                        <td style="font-family: monospace; font-size: 10px; word-break: break-all;">${transaction.end_to_end_id || "N/A"}</td>
                        <td class="amount">${Number.parseFloat(transaction.amount || 0).toFixed(2)}</td>
                        <td>${verificationStatus}</td>
                      </tr>
                    `
                })
                .join("")}
              <tr class="total">
                <td colspan="2"><strong>Celková suma:</strong></td>
                <td class="amount"><strong>${calculateTransactionTotal().toFixed(2)} EUR</strong></td>
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
  // </CHANGE>

  // Define printTransactionSummary here
  const printTransactionSummary = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Súhrn transakcií - ${selectedTransactionDate}</title>
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
          <h1>Súhrn transakcií</h1>
          <p><strong>Dátum:</strong> ${new Date(selectedTransactionDate).toLocaleDateString("sk-SK")}</p>
          
          <table>
            <thead>
              <tr>
                <th style="width: 20%;">Čas</th>
                <th style="width: 40%;">Transaction ID</th>
                <th class="amount" style="width: 40%;">Suma (EUR)</th>
              </tr>
            </thead>
            <tbody>
              ${transactionListData
                .map((transaction) => {
                  return `
                      <tr>
                        <td>${new Date(transaction.payload_received_at).toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" })}</td>
                        <td style="font-family: monospace; font-size: 10px; word-break: break-all;">${transaction.end_to_end_id || "N/A"}</td>
                        <td class="amount">${Number.parseFloat(transaction.amount || 0).toFixed(2)}</td>
                      </tr>
                    `
                })
                .join("")}
              <tr class="total">
                <td colspan="2"><strong>Celková suma:</strong></td>
                <td class="amount"><strong>${calculateTransactionTotal().toFixed(2)} EUR</strong></td>
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

                      <div className="space-y-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Label
                                htmlFor="merchantAccountName"
                                className="text-sm font-medium text-gray-700 flex items-center gap-1 cursor-help"
                              >
                                Názov bankového účtu obchodníka
                                <Info className="h-3 w-3 text-gray-400" />
                              </Label>
                            </TooltipTrigger>
                            <TooltipContent>
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
                            className="w-full h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          {merchantAccountName && (
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

                      <div className="text-center pt-4 mt-4 border-t border-gray-200">
                        <a
                          href="https://github.com/spavlovic77/v0-nop-web-test-client"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <Github className="h-3 w-3" />
                          <span>Zdrojové kódy EUPL licencia</span>
                        </a>
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
              <DialogContent
                className="sm:max-w-md w-[95vw] max-h-[90vh] flex flex-col"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
              >
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-4 min-h-[400px]">
                  {qrLoading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : qrCode ? (
                    <div className="space-y-4 flex flex-col items-center w-full">
                      <div className="bg-white p-4 rounded-lg">
                        <img src={qrCode || "/placeholder.svg"} alt="Payment QR Code" className="w-64 h-64" />
                      </div>

                      <div className="w-full max-w-sm space-y-3 px-4">
                        {/* Timer progress button */}
                        <div className="space-y-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${(mqttTimeRemaining / 120) * 100}%` }}
                            />
                          </div>
                          <Button
                            variant="outline"
                            className="w-full bg-transparent"
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

                        {/* Cancel payment button */}
                        <Button variant="destructive" className="w-full" onClick={handleCancelPayment}>
                          Zrušiť platbu
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <XCircle className="h-8 w-8 text-red-500" />
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  {qrCode && (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground text-right max-w-[200px]">
                          Simulátor úhrady. Naskenuj link kamerou.
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
              </DialogContent>
            </Dialog>

            <Dialog open={showPaymentReceivedModal} onOpenChange={setShowPaymentReceivedModal}>
              <DialogContent className="max-w-[95vw] max-h-[90vh]">
                <div className="space-y-4 text-center py-8">
                  <div className="text-xl font-semibold text-gray-800 mb-4">Prichádzajúca platba</div>

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
                                <div className="space-y-3">
                                  <span className="text-lg font-medium text-yellow-600">
                                    Pozor! Preverte platbu vo Vašej banke
                                  </span>
                                  <div className="bg-red-50 p-4 rounded-lg space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600">Očakávaná suma:</span>
                                      <span className="text-lg font-bold text-gray-900">
                                        {formatAmount(expectedAmount)} EUR
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600">Oznámená suma:</span>
                                      <span className="text-lg font-bold text-gray-900">
                                        {formatAmount(receivedAmount)} EUR
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            } else {
                              // Amounts match but integrity error - invalid payment
                              return (
                                <span className="text-lg font-medium text-red-600">
                                  Toto je neplatná platba. Môže ísť o podvod.
                                </span>
                              )
                            }
                          })()}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-12 w-12 text-green-600" />
                          <span className="text-lg font-medium text-green-600">
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
                    Zoznam platieb -{" "}
                    {selectedTransactionDate ? new Date(selectedTransactionDate).toLocaleDateString("sk-SK") : ""}
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {transactionListLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <span className="ml-2">Načítavam platby...</span>
                    </div>
                  ) : transactionListData.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{transactionListData.length}</div>
                          <div className="text-sm text-gray-600">Platieb</div>
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
                      <p>Žiadne platby pre vybraný dátum</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between gap-2 mt-4">
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
                  <p className="text-center text-lg">Vyhotoviť doklad o nepotvrdení zrealizovanej platby?</p>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={handleDisputeNo}>
                      Nie
                    </Button>
                    <Button className="flex-1" onClick={handleDisputeConfirmation}>
                      Áno
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showDisputeActionModal} onOpenChange={setShowDisputeActionModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Doklad o neoznámenej úhrade</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-center text-lg">Vyhotoviť doklad o neoznámenej úhrade?</p>
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
                    <Input
                      id="disputeDate"
                      type="date"
                      value={selectedDisputeDate}
                      onChange={(e) => setSelectedDisputeDate(e.target.value)}
                      className="w-full"
                    />
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
                    Vyber transakciu -{" "}
                    {selectedDisputeDate ? new Date(selectedDisputeDate).toLocaleDateString("sk-SK") : ""}
                  </h3>
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
                              <td className="border p-2 text-sm">
                                {new Date(transaction.response_timestamp).toLocaleTimeString("sk-SK")}
                              </td>
                              <td className="border p-2 text-sm font-mono" title={transaction.transaction_id}>
                                {truncateTransactionId(transaction.transaction_id)}
                              </td>
                              <td className="border p-2 text-sm text-right">{formatAmount(transaction.amount)}</td>
                              <td className="border p-2 text-center">
                                {!transaction.dispute ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleTransactionDisputeClick(transaction.transaction_id)}
                                    className="p-1"
                                    title="Vyhotoviť doklad o nepotvrdenej platbe"
                                  >
                                    <FilePlus className="h-4 w-4 text-orange-500" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(`/confirmation/${transaction.transaction_id}`, "_blank")}
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
                    onClick={handlePrintDisputedTransactions}
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
