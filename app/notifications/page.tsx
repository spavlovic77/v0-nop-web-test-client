"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowLeft,
  Users,
  Building2,
  Monitor,
  Euro,
  AlertTriangle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface DashboardMetrics {
  uniqueIPs: number
  uniqueCompanies: number
  uniqueCashRegisters: number
  totalGeneratedAmount: number
  totalPaidAmount: number
  totalDisputedAmount: number
  disputedPercentage: number
  invalidPaymentsCount: number
  invalidPaymentsPercentage: number
  totalTransactions: number
  totalPayments: number
}

export default function NotificationsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    uniqueIPs: 0,
    uniqueCompanies: 0,
    uniqueCashRegisters: 0,
    totalGeneratedAmount: 0,
    totalPaidAmount: 0,
    totalDisputedAmount: 0,
    disputedPercentage: 0,
    invalidPaymentsCount: 0,
    invalidPaymentsPercentage: 0,
    totalTransactions: 0,
    totalPayments: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("[v0] Starting to fetch dashboard metrics...")

      // Fetch all data in parallel
      const [transactionsResult, paymentsResult] = await Promise.all([
        supabase.from("transaction_generations").select("*"),
        supabase.from("mqtt_notifications").select("*"),
      ])

      console.log("[v0] Transactions result:", transactionsResult)
      console.log("[v0] Payments result:", paymentsResult)

      if (transactionsResult.error) {
        console.error("[v0] Transactions error:", transactionsResult.error)
        throw transactionsResult.error
      }
      if (paymentsResult.error) {
        console.error("[v0] Payments error:", paymentsResult.error)
        throw paymentsResult.error
      }

      const transactions = transactionsResult.data || []
      const payments = paymentsResult.data || []

      console.log("[v0] Transactions count:", transactions.length)
      console.log("[v0] Payments count:", payments.length)
      console.log("[v0] Sample transaction:", transactions[0])
      console.log("[v0] Sample payment:", payments[0])

      // Calculate unique IPs
      const uniqueIPs = new Set(transactions.map((t) => t.client_ip).filter(Boolean)).size

      // Calculate unique companies (VATSK)
      const uniqueCompanies = new Set(transactions.map((t) => t.vatsk).filter(Boolean)).size

      // Calculate unique cash registers (POKLADNICA)
      const uniqueCashRegisters = new Set(transactions.map((t) => t.pokladnica).filter(Boolean)).size

      // Calculate total generated amount in EUR
      const totalGeneratedAmount = transactions.reduce((sum, t) => {
        const amount = Number.parseFloat(t.amount || "0")
        return sum + amount
      }, 0)

      // Calculate total paid amount in EUR from MQTT notifications
      const totalPaidAmount = payments.reduce((sum, p) => {
        const amount = Number.parseFloat(p.amount || "0")
        return sum + amount
      }, 0)

      // Calculate disputed transactions
      const disputedTransactions = transactions.filter((t) => t.dispute === true)
      const totalDisputedAmount = disputedTransactions.reduce((sum, t) => {
        const amount = Number.parseFloat(t.amount || "0")
        return sum + amount
      }, 0)
      const disputedPercentage = totalGeneratedAmount > 0 ? (totalDisputedAmount / totalGeneratedAmount) * 100 : 0

      // Calculate invalid payments
      const invalidPayments = payments.filter((p) => p.integrity_validation === false)
      const invalidPaymentsCount = invalidPayments.length
      const invalidPaymentsPercentage = payments.length > 0 ? (invalidPaymentsCount / payments.length) * 100 : 0

      const calculatedMetrics = {
        uniqueIPs,
        uniqueCompanies,
        uniqueCashRegisters,
        totalGeneratedAmount,
        totalPaidAmount,
        totalDisputedAmount,
        disputedPercentage,
        invalidPaymentsCount,
        invalidPaymentsPercentage,
        totalTransactions: transactions.length,
        totalPayments: payments.length,
      }

      console.log("[v0] Calculated metrics:", calculatedMetrics)

      setMetrics(calculatedMetrics)
    } catch (err) {
      console.error("[v0] Error fetching dashboard metrics:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardMetrics()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sk-SK", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-700">
                <XCircle className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold">Chyba pri načítaní dát</h3>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <ArrowLeft className="w-4 h-4" />
                Späť
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Analytický Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Prehľad systémových metrík v reálnom čase</p>
            </div>
          </div>
          <Button
            onClick={fetchDashboardMetrics}
            disabled={loading}
            size="lg"
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            Obnoviť
          </Button>
        </div>

        {/* Primary Metrics - Unique Counts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Unique IPs */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative group hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Monitor className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90 mb-1 font-medium">Unikátne IP adresy</p>
                  <p className="text-5xl font-bold tracking-tight">{metrics.uniqueIPs}</p>
                </div>
              </div>
              <div className="h-2 bg-blue-400/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                  style={{ width: loading ? "0%" : "75%" }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Unique Companies */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden relative group hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Building2 className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90 mb-1 font-medium">Spoločnosti (VATSK)</p>
                  <p className="text-5xl font-bold tracking-tight">{metrics.uniqueCompanies}</p>
                </div>
              </div>
              <div className="h-2 bg-emerald-400/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-out delay-100"
                  style={{ width: loading ? "0%" : "60%" }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Unique Cash Registers */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative group hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90 mb-1 font-medium">Pokladnice</p>
                  <p className="text-5xl font-bold tracking-tight">{metrics.uniqueCashRegisters}</p>
                </div>
              </div>
              <div className="h-2 bg-purple-400/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-out delay-200"
                  style={{ width: loading ? "0%" : "85%" }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Generated Amount */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Euro className="w-5 h-5 text-blue-600" />
                </div>
                Celková suma vygenerovaných transakcií
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-gray-900">{formatCurrency(metrics.totalGeneratedAmount)}</p>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 mt-2">Z {metrics.totalTransactions} transakcií</p>
            </CardContent>
          </Card>

          {/* Total Paid Amount */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Euro className="w-5 h-5 text-green-600" />
                </div>
                Celková suma potvrdených platieb
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-gray-900">{formatCurrency(metrics.totalPaidAmount)}</p>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 mt-2">Z {metrics.totalPayments} platieb</p>
            </CardContent>
          </Card>
        </div>

        {/* Disputed Transactions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                Nepotvrdené platby
              </CardTitle>
              <CardDescription>Transakcie označené ako nepotvrdené</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Celková suma</p>
                  <p className="text-3xl font-bold text-orange-600">{formatCurrency(metrics.totalDisputedAmount)}</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Percento z celkovej sumy</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-orange-600">
                      {formatPercentage(metrics.disputedPercentage)}
                    </span>
                    {metrics.disputedPercentage > 5 ? (
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invalid Payments */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                Neplatné platby
              </CardTitle>
              <CardDescription>Platby s neplatnou integritou</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Počet neplatných platieb</p>
                  <p className="text-3xl font-bold text-red-600">{metrics.invalidPaymentsCount}</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Percento z celkových platieb</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-red-600">
                      {formatPercentage(metrics.invalidPaymentsPercentage)}
                    </span>
                    {metrics.invalidPaymentsPercentage > 5 ? (
                      <TrendingUp className="w-5 h-5 text-red-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
          <CardHeader>
            <CardTitle className="text-2xl">Súhrn systému</CardTitle>
            <CardDescription>Celkový prehľad všetkých metrík</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Celkom transakcií</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.totalTransactions}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Celkom platieb</p>
                <p className="text-3xl font-bold text-green-600">{metrics.totalPayments}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Úspešnosť</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {formatPercentage(100 - metrics.invalidPaymentsPercentage)}
                </p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Celkom</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(metrics.totalGeneratedAmount - metrics.totalPaidAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
