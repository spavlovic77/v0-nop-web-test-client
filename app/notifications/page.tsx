"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Users, Building2, Monitor, CheckCircle2, XCircle, Clock, Activity, RefreshCw } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import dynamic from "next/dynamic"

const ChartContainer = dynamic(() => import("@/components/ui/chart").then((mod) => mod.ChartContainer), { ssr: false })
const ChartTooltip = dynamic(() => import("@/components/ui/chart").then((mod) => mod.ChartTooltip), { ssr: false })
const ChartTooltipContent = dynamic(() => import("@/components/ui/chart").then((mod) => mod.ChartTooltipContent), {
  ssr: false,
})

const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false })
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false })
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false })
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false })
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false })
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false })
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false })
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false })
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false })

interface MqttNotification {
  id: string
  topic: string
  raw_payload: string
  vatsk?: string
  pokladnica?: string
  transaction_id?: string
  transaction_status?: string
  amount?: number
  currency?: string
  integrity_hash?: string
  end_to_end_id?: string
  payload_received_at?: string
  created_at: string
  integrity_validation: boolean
}

interface MqttSubscription {
  id: string
  topic: string
  vatsk?: string
  pokladnica?: string
  end_to_end_id?: string
  qos: number
  created_at: string
}

interface TransactionGeneration {
  id: string
  transaction_id?: string
  vatsk?: string
  pokladnica?: string
  endpoint: string
  method: string
  status_code: number
  duration_ms: number
  client_ip: string
  created_at: string
  response_timestamp: string
  dispute: boolean
}

interface TimelineEvent {
  id: string
  type: "generation" | "subscription" | "payment"
  timestamp: string
  status: "success" | "pending" | "error"
  data: any
}

interface DashboardStats {
  uniqueIPs: number
  uniqueOrganizations: number
  uniqueCashiers: number
  totalTransactions: number
  totalPayments: number
  successfulPayments: number
  failedPayments: number
  disputedTransactions: number
  avgResponseTime: number
  successRate: number
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<MqttNotification[]>([])
  const [subscriptions, setSubscriptions] = useState<MqttSubscription[]>([])
  const [transactions, setTransactions] = useState<TransactionGeneration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"timeline" | "generations" | "subscriptions" | "payments">("timeline")
  const [searchEndToEndId, setSearchEndToEndId] = useState("")
  const [searchVatsk, setSearchVatsk] = useState("")
  const [searchPokladnica, setSearchPokladnica] = useState("")
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Dashboard stats state
  const [stats, setStats] = useState<DashboardStats>({
    uniqueIPs: 0,
    uniqueOrganizations: 0,
    uniqueCashiers: 0,
    totalTransactions: 0,
    totalPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
    disputedTransactions: 0,
    avgResponseTime: 0,
    successRate: 0,
  })
  const [topOrganizations, setTopOrganizations] = useState<{ name: string; count: number }[]>([])
  const [topCashiers, setTopCashiers] = useState<{ name: string; count: number }[]>([])
  const [hourlyActivity, setHourlyActivity] = useState<{ hour: string; transactions: number; payments: number }[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const fetchNotifications = async () => {
    try {
      console.log("[v0] Fetching notifications...")
      setLoading(true)
      setError(null)

      const [paymentsResult, subscriptionsResult, transactionsResult] = await Promise.all([
        supabase.from("mqtt_notifications").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("mqtt_subscriptions").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("transaction_generations").select("*").order("created_at", { ascending: false }).limit(100),
      ])

      console.log("[v0] Payments result:", paymentsResult)
      console.log("[v0] Subscriptions result:", subscriptionsResult)
      console.log("[v0] Transactions result:", transactionsResult)

      if (paymentsResult.error || subscriptionsResult.error || transactionsResult.error) {
        const errors = [paymentsResult.error, subscriptionsResult.error, transactionsResult.error]
          .filter(Boolean)
          .map((e) => e!.message)
          .join(", ")
        setError(errors)
      } else {
        setNotifications(paymentsResult.data || [])
        setSubscriptions(subscriptionsResult.data || [])
        setTransactions(transactionsResult.data || [])

        console.log("[v0] Loaded notifications:", paymentsResult.data?.length || 0)
        console.log("[v0] Loaded subscriptions:", subscriptionsResult.data?.length || 0)
        console.log("[v0] Loaded transactions:", transactionsResult.data?.length || 0)

        if (transactionsResult.data && transactionsResult.data.length > 0) {
          console.log("[v0] Sample transaction data:", transactionsResult.data[0])
        }
      }
    } catch (err) {
      console.error("[v0] Unexpected error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [transactionsResult, notificationsResult] = await Promise.all([
        supabase.from("transaction_generations").select("*").order("created_at", { ascending: false }),
        supabase.from("mqtt_notifications").select("*").order("created_at", { ascending: false }),
      ])

      if (transactionsResult.error || notificationsResult.error) {
        console.error("Error fetching data:", transactionsResult.error || notificationsResult.error)
        return
      }

      const txData = transactionsResult.data || []
      const notifData = notificationsResult.data || []

      // Keep existing notifications and transactions if fetchNotifications was called previously.
      // Otherwise, set them here as well to ensure dashboard data is available.
      if (notifications.length === 0) setNotifications(notifData)
      if (transactions.length === 0) setTransactions(txData)

      const uniqueIPs = new Set(txData.map((t) => t.client_ip).filter(Boolean)).size

      const allVatsks = [...txData.map((t) => t.vatsk), ...notifData.map((n) => n.vatsk)].filter(Boolean)
      const uniqueOrgs = new Set(allVatsks).size

      const allPokladnicas = [...txData.map((t) => t.pokladnica), ...notifData.map((n) => n.pokladnica)].filter(Boolean)
      const uniqueCashiers = new Set(allPokladnicas).size

      const successfulPayments = notifData.filter((n) => n.integrity_validation === true).length
      const failedPayments = notifData.filter((n) => n.integrity_validation === false).length
      const disputedTransactions = txData.filter((t) => t.dispute === true).length

      const avgResponseTime =
        txData.length > 0 ? txData.reduce((sum, t) => sum + (t.duration_ms || 0), 0) / txData.length : 0

      const successRate = notifData.length > 0 ? (successfulPayments / notifData.length) * 100 : 0

      setStats({
        uniqueIPs,
        uniqueOrganizations: uniqueOrgs,
        uniqueCashiers,
        totalTransactions: txData.length,
        totalPayments: notifData.length,
        successfulPayments,
        failedPayments,
        disputedTransactions,
        avgResponseTime: Math.round(avgResponseTime),
        successRate: Math.round(successRate),
      })

      const orgCounts = allVatsks.reduce(
        (acc, vatsk) => {
          acc[vatsk] = (acc[vatsk] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )
      const topOrgs = Object.entries(orgCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))
      setTopOrganizations(topOrgs)

      const cashierCounts = allPokladnicas.reduce(
        (acc, pokladnica) => {
          acc[pokladnica] = (acc[pokladnica] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )
      const topCash = Object.entries(cashierCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name: name.slice(3), count }))
      setTopCashiers(topCash)

      const hourlyData: Record<string, { transactions: number; payments: number }> = {}
      for (let i = 0; i < 24; i++) {
        hourlyData[i] = { transactions: 0, payments: 0 }
      }

      txData.forEach((t) => {
        const hour = new Date(t.created_at).getHours()
        hourlyData[hour].transactions++
      })

      notifData.forEach((n) => {
        const hour = new Date(n.created_at).getHours()
        hourlyData[hour].payments++
      })

      const hourlyArray = Object.entries(hourlyData).map(([hour, data]) => ({
        hour: `${hour}:00`,
        transactions: data.transactions,
        payments: data.payments,
      }))
      setHourlyActivity(hourlyArray)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateTimeline = (endToEndId: string) => {
    const events: TimelineEvent[] = []

    const generation = transactions.find((t) => t.transaction_id === endToEndId)
    if (generation) {
      events.push({
        id: `gen-${generation.id}`,
        type: "generation",
        timestamp: generation.created_at,
        status: generation.status_code === 200 ? "success" : "error",
        data: generation,
      })
    }

    const subscription = subscriptions.find((s) => s.end_to_end_id === endToEndId)
    if (subscription) {
      events.push({
        id: `sub-${subscription.id}`,
        type: "subscription",
        timestamp: subscription.created_at,
        status: "success",
        data: subscription,
      })
    }

    const payment = notifications.find((n) => n.end_to_end_id === endToEndId || n.transaction_id === endToEndId)
    if (payment) {
      events.push({
        id: `pay-${payment.id}`,
        type: "payment",
        timestamp: payment.created_at,
        status:
          payment.transaction_status === "ACCC"
            ? "success"
            : payment.transaction_status === "RJCT"
              ? "error"
              : "pending",
        data: payment,
      })
    }

    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    setTimeline(events)
  }

  const handleSearch = () => {
    if (searchEndToEndId.trim()) {
      generateTimeline(searchEndToEndId.trim())
      setActiveTab("timeline")
    }
  }

  const getFilteredData = (data: any[], type: string) => {
    return data.filter((item) => {
      const matchesVatsk = !searchVatsk || (item.vatsk && item.vatsk.toLowerCase().includes(searchVatsk.toLowerCase()))
      const matchesPokladnica =
        !searchPokladnica || (item.pokladnica && item.pokladnica.toLowerCase().includes(searchPokladnica.toLowerCase()))
      return matchesVatsk && matchesPokladnica
    })
  }

  const getPaginatedData = (data: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return data.slice(startIndex, startIndex + itemsPerPage)
  }

  const getTotalPages = (data: any[]) => Math.ceil(data.length / itemsPerPage)

  useEffect(() => {
    // Fetch data based on the active tab
    if (activeTab === "timeline") {
      fetchNotifications() // Or a more specific timeline fetch if needed
    } else {
      fetchDashboardData() // Fetch dashboard data for other tabs
    }
  }, [activeTab]) // Re-run effect when activeTab changes

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("sk-SK", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const calculateTimeDifference = (timestamp1: string, timestamp2: string) => {
    const time1 = new Date(timestamp1).getTime()
    const time2 = new Date(timestamp2).getTime()
    const diffMs = Math.abs(time2 - time1)

    if (diffMs < 1000) {
      return `${diffMs}ms`
    } else if (diffMs < 60000) {
      return `${(diffMs / 1000).toFixed(2)}s`
    } else {
      return `${(diffMs / 60000).toFixed(2)}min`
    }
  }

  const TimelineView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Vyhľadávanie časovej osi
          </CardTitle>
          <CardDescription>Zadajte EndToEnd ID pre zobrazenie kompletnej časovej osi transakcie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="endToEndId">EndToEnd ID</label>
              <input
                id="endToEndId"
                placeholder="QR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={searchEndToEndId}
                onChange={(e) => setSearchEndToEndId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={!searchEndToEndId.trim()}>
                <Activity className="w-4 h-4 mr-2" />
                Vyhľadať
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Časová os pre: {searchEndToEndId}</CardTitle>
            <CardDescription>Kompletný prehľad všetkých udalostí pre danú transakciu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              <div className="space-y-8">
                {timeline.map((event, index) => (
                  <div key={event.id} className="relative flex items-start gap-4">
                    <div
                      className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 ${
                        event.status === "success"
                          ? "bg-green-100 border-green-500"
                          : event.status === "error"
                            ? "bg-red-100 border-red-500"
                            : "bg-yellow-100 border-yellow-500"
                      }`}
                    >
                      {event.type === "generation" && <Monitor className="w-6 h-6 text-purple-600" />}
                      {event.type === "subscription" && <Users className="w-6 h-6 text-blue-600" />}
                      {event.type === "payment" && <CheckCircle2 className="w-6 h-6 text-green-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">
                            {event.type === "generation" && "Generovanie transakcie"}
                            {event.type === "subscription" && "MQTT pripojenie"}
                            {event.type === "payment" && "Platobná notifikácia"}
                          </h3>
                          <div className="flex items-center gap-2">
                            {event.status === "success" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            {event.status === "error" && <XCircle className="w-5 h-5 text-red-500" />}
                            {event.status === "pending" && <Clock className="w-5 h-5 text-yellow-500" />}
                            <span className="text-sm text-gray-500">{formatDate(event.timestamp)}</span>
                          </div>
                        </div>

                        {index > 0 && (
                          <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-blue-700">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">
                                {calculateTimeDifference(timeline[index - 1].timestamp, event.timestamp)} po
                                predchádzajúcej udalosti
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {event.data.vatsk && (
                            <div>
                              <span className="font-medium text-gray-600">VATSK:</span>
                              <span className="ml-2">{event.data.vatsk}</span>
                            </div>
                          )}
                          {event.data.pokladnica && (
                            <div>
                              <span className="font-medium text-gray-600">Pokladnica:</span>
                              <span className="ml-2">{event.data.pokladnica}</span>
                            </div>
                          )}
                          {event.type === "payment" && event.data.amount && (
                            <div>
                              <span className="font-medium text-gray-600">Suma:</span>
                              <span className="ml-2">
                                {event.data.amount.toFixed(2)} {event.data.currency}
                              </span>
                            </div>
                          )}
                          {event.type === "generation" && event.data.duration_ms && (
                            <div>
                              <span className="font-medium text-gray-600">Trvanie:</span>
                              <span className="ml-2">{event.data.duration_ms}ms</span>
                            </div>
                          )}
                          {event.type === "subscription" && event.data.qos && (
                            <div>
                              <span className="font-medium text-gray-600">QoS:</span>
                              <span className="ml-2">{event.data.qos}</span>
                            </div>
                          )}
                        </div>

                        {index === timeline.length - 1 && timeline.length > 1 && (
                          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 text-sm text-green-700">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="font-medium">
                                Celkový čas od generovania po posledný krok:{" "}
                                {calculateTimeDifference(timeline[0].timestamp, event.timestamp)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Added test notification function
  const testNotification = async () => {
    try {
      console.log("[v0] Testing notification...")
      const response = await fetch("/api/test-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const result = await response.json()
      console.log("[v0] Test result:", result)
      if (result.success) {
        fetchNotifications()
      }
    } catch (error) {
      console.error("[v0] Test failed:", error)
    }
  }

  const testTransactionGeneration = async () => {
    try {
      console.log("[v0] Testing transaction generation...")

      const response = await fetch("/api/test-transaction-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()
      console.log("[v0] Transaction generation result:", result)
      if (result.success) {
        fetchNotifications()
      }
    } catch (error) {
      console.log("[v0] Transaction generation failed:", error)
    }
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Späť
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytický Dashboard</h1>
                <p className="text-gray-600">Prehľad systémových metrík a štatistík v reálnom čase</p>
              </div>
            </div>
            <Button onClick={fetchDashboardData} disabled={loading} size="lg">
              <RefreshCw className={`w-5 h-5 mr-2 ${loading ? "animate-spin" : ""}`} />
              Obnoviť
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Monitor className="w-10 h-10 opacity-80" />
                <div className="text-right">
                  <p className="text-sm opacity-90 mb-1">Unikátne IP adresy</p>
                  <p className="text-4xl font-bold">{stats.uniqueIPs}</p>
                </div>
              </div>
              <div className="h-2 bg-blue-400 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: "75%" }} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Building2 className="w-10 h-10 opacity-80" />
                <div className="text-right">
                  <p className="text-sm opacity-90 mb-1">Organizácie (VATSK)</p>
                  <p className="text-4xl font-bold">{stats.uniqueOrganizations}</p>
                </div>
              </div>
              <div className="h-2 bg-green-400 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: "60%" }} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-10 h-10 opacity-80" />
                <div className="text-right">
                  <p className="text-sm opacity-90 mb-1">Pokladnice</p>
                  <p className="text-4xl font-bold">{stats.uniqueCashiers}</p>
                </div>
              </div>
              <div className="h-2 bg-purple-400 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: "85%" }} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-10 h-10 opacity-80" />
                <div className="text-right">
                  <p className="text-sm opacity-90 mb-1">Úspešnosť platieb</p>
                  <p className="text-4xl font-bold">{stats.successRate}%</p>
                </div>
              </div>
              <div className="h-2 bg-orange-400 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${stats.successRate}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Celkom transakcií</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Úspešné platby</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.successfulPayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Neúspešné platby</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.failedPayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priem. čas odpovede</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Aktivita podľa hodín</CardTitle>
              <CardDescription>Transakcie a platby počas dňa</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  transactions: { label: "Transakcie", color: "hsl(var(--chart-1))" },
                  payments: { label: "Platby", color: "hsl(var(--chart-2))" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="transactions" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="payments" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stav platieb</CardTitle>
              <CardDescription>Rozdelenie úspešných a neúspešných platieb</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  successful: { label: "Úspešné", color: "hsl(var(--chart-2))" },
                  failed: { label: "Neúspešné", color: "hsl(var(--chart-1))" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Úspešné", value: stats.successfulPayments },
                        { name: "Neúspešné", value: stats.failedPayments },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Organizácií (VATSK)</CardTitle>
              <CardDescription>Najaktívnejšie organizácie v systéme</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: { label: "Počet", color: "hsl(var(--chart-1))" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topOrganizations} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 5 Pokladníc</CardTitle>
              <CardDescription>Najvyužívanejšie pokladnice</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: { label: "Počet", color: "hsl(var(--chart-2))" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCashiers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
