"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, AlertCircle } from "lucide-react"
import QRCode from "qrcode"

interface TransactionData {
  id: number
  transaction_id: string
  vatsk: string
  pokladnica: string
  endpoint: string
  method: string
  status_code: number
  duration_ms: number
  client_ip: string
  created_at: string
  response_timestamp: string
  dispute: boolean
  iban: string | null
  amount: string | null
}

export default function ConfirmationPage() {
  const params = useParams()
  const transactionId = params.transactionId as string
  const [transaction, setTransaction] = useState<TransactionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await fetch(`/api/view-confirmation/${transactionId}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch transaction")
        }

        setTransaction(result.data)

        // Generate QR code for this URL
        const url = `${window.location.origin}/confirmation/${transactionId}`
        const qr = await QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
        })
        setQrCode(qr)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTransaction()
  }, [transactionId])

  const handlePrint = () => {
    window.print()
  }

  const formatAmount = (amountInCents: string | null): string => {
    if (!amountInCents) return "N/A"
    const euros = Number.parseInt(amountInCents) / 100
    return `${euros.toFixed(2)} €`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Načítavam potvrdenie...</p>
        </div>
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Chyba
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || "Potvrdenie sa nenašlo"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <style jsx global>{`
        @media print {
          body {
            padding: 10px !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: auto;
            margin: 10mm;
          }
        }
        
        @media print and (max-width: 600px) {
          body {
            font-size: 12px !important;
          }
          h1, h2, h3 {
            font-size: 16px !important;
          }
          .grid {
            display: block !important;
          }
          .grid > div {
            margin-bottom: 8px !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <div className="print:hidden mb-4">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Vytlačiť potvrdenie
          </Button>
        </div>

        <Card className="print:shadow-none">
          <CardHeader className="text-center border-b">
            <CardTitle className="text-2xl font-bold">Potvrdenie o neoznámenej úhrade</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Transakcia ID: {transaction.transaction_id}</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Transaction Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transaction.iban && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">IBAN</p>
                  <p className="text-base font-mono">{transaction.iban}</p>
                </div>
              )}
              {transaction.amount && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Suma</p>
                  <p className="text-lg font-semibold">{formatAmount(transaction.amount)}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">VATSK</p>
                <p className="text-base font-mono">{transaction.vatsk}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pokladnica</p>
                <p className="text-base font-mono">{transaction.pokladnica}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dátum vytvorenia</p>
                <p className="text-base">{new Date(transaction.created_at).toLocaleString("sk-SK")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stav</p>
                <p className="text-base">
                  {transaction.dispute ? (
                    <span className="text-orange-600 font-medium">Sporná platba</span>
                  ) : (
                    <span className="text-green-600 font-medium">Aktívna</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Endpoint</p>
                <p className="text-base font-mono text-sm">{transaction.endpoint}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">HTTP Status</p>
                <p className="text-base">{transaction.status_code}</p>
              </div>
              {transaction.duration_ms && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Trvanie</p>
                  <p className="text-base">{transaction.duration_ms} ms</p>
                </div>
              )}
              {transaction.client_ip && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IP adresa</p>
                  <p className="text-base font-mono">{transaction.client_ip}</p>
                </div>
              )}
            </div>

            {/* QR Code */}
            {qrCode && (
              <div className="flex flex-col items-center justify-center border-t pt-6">
                <p className="text-sm font-medium text-muted-foreground mb-4">
                  Naskenujte QR kód pre zobrazenie potvrdenia
                </p>
                <img
                  src={qrCode || "/placeholder.svg"}
                  alt="QR Code"
                  className="w-48 h-48 border-2 border-border rounded-lg"
                />
                <p className="text-xs text-muted-foreground mt-2 text-center break-all max-w-md">
                  {window.location.origin}/confirmation/{transaction.transaction_id}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t pt-4 text-center text-sm text-muted-foreground">
              <p>Toto potvrdenie bolo vygenerované automaticky dňa {new Date().toLocaleString("sk-SK")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
