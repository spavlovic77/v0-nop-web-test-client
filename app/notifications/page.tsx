"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import {
  ArrowLeft,
  Bell,
  MessageSquare,
  RefreshCw,
  Euro,
  Hash,
  Wifi,
  Database,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

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
}

interface TimelineEvent {
  id: string
  type: "generation" | "subscription" | "payment"
  timestamp: string
  status: "success" | "pending" | "error"
  data: any
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
    fetchNotifications()
  }, [])

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
            <Search className="w-5 h-5" />
            Vyhľadávanie časovej osi
          </CardTitle>
          <CardDescription>Zadajte EndToEnd ID pre zobrazenie kompletnej časovej osi transakcie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="endToEndId">EndToEnd ID</Label>
              <Input
                id="endToEndId"
                placeholder="QR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={searchEndToEndId}
                onChange={(e) => setSearchEndToEndId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={!searchEndToEndId.trim()}>
                <Search className="w-4 h-4 mr-2" />
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
                      {event.type === "generation" && <Database className="w-6 h-6 text-purple-600" />}
                      {event.type === "subscription" && <Wifi className="w-6 h-6 text-blue-600" />}
                      {event.type === "payment" && <Euro className="w-6 h-6 text-green-600" />}
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
                            {event.status === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
                            {event.status === "error" && <XCircle className="w-5 h-5 text-red-500" />}
                            {event.status === "pending" && <AlertCircle className="w-5 h-5 text-yellow-500" />}
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
                              <CheckCircle className="w-4 h-4" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Späť
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Systémové notifikácie</h1>
            </div>
          </div>
          <p className="text-gray-600">Kompletný prehľad všetkých systémových udalostí a časových osí transakcií</p>
        </div>

        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">Chyba: {error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Generované transakcie</p>
                  <p className="text-2xl font-bold">{transactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">MQTT pripojenia</p>
                  <p className="text-2xl font-bold">{subscriptions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Oznámení o platbe</p>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Vyhľadávacie filtre a testovanie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="vatskFilter">VATSK ID</Label>
                <Input
                  id="vatskFilter"
                  placeholder="Filtrovať podľa VATSK..."
                  value={searchVatsk}
                  onChange={(e) => setSearchVatsk(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pokladnicaFilter">Pokladnica ID</Label>
                <Input
                  id="pokladnicaFilter"
                  placeholder="Filtrovať podľa Pokladnica..."
                  value={searchPokladnica}
                  onChange={(e) => setSearchPokladnica(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={testNotification} variant="outline" size="sm">
                Test notifikáciu
              </Button>
              <Button onClick={testTransactionGeneration} variant="outline" size="sm">
                Test generovanie transakcie
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={activeTab === "timeline" ? "default" : "outline"}
              onClick={() => setActiveTab("timeline")}
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Časová os
            </Button>
            <Button
              variant={activeTab === "generations" ? "default" : "outline"}
              onClick={() => setActiveTab("generations")}
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Generované transakcie ({getFilteredData(transactions, "generations").length})
            </Button>
            <Button
              variant={activeTab === "subscriptions" ? "default" : "outline"}
              onClick={() => setActiveTab("subscriptions")}
              className="flex items-center gap-2"
            >
              <Wifi className="w-4 h-4" />
              MQTT pripojenia ({getFilteredData(subscriptions, "subscriptions").length})
            </Button>
            <Button
              variant={activeTab === "payments" ? "default" : "outline"}
              onClick={() => setActiveTab("payments")}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              MQTT platobné notifikácie ({getFilteredData(notifications, "payments").length})
            </Button>
          </div>
        </div>

        {activeTab === "timeline" && <TimelineView />}

        {activeTab !== "timeline" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {activeTab === "generations" && "Generované transakcie"}
                    {activeTab === "subscriptions" && "MQTT pripojenia"}
                    {activeTab === "payments" && "Oznámenia o platbe"}
                  </CardTitle>
                  <CardDescription>
                    Posledných {itemsPerPage} záznamov (strana {currentPage} z{" "}
                    {getTotalPages(
                      activeTab === "generations"
                        ? getFilteredData(transactions, "generations")
                        : activeTab === "subscriptions"
                          ? getFilteredData(subscriptions, "subscriptions")
                          : getFilteredData(notifications, "payments"),
                    )}
                    )
                  </CardDescription>
                </div>
                <Button onClick={fetchNotifications} variant="outline" size="sm" disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Obnoviť
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-500">Načítavam notifikácie...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {activeTab === "generations" &&
                      getPaginatedData(getFilteredData(transactions, "generations")).map(
                        (transaction: TransactionGeneration) => (
                          <div
                            key={transaction.id}
                            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {transaction.transaction_id}
                                </Badge>
                                <Badge
                                  variant={transaction.status_code === 200 ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {transaction.status_code}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {transaction.duration_ms}ms
                                </Badge>
                              </div>
                              <span className="text-xs text-gray-500">{formatDate(transaction.created_at)}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-purple-50 rounded-lg">
                              {transaction.vatsk && (
                                <div className="flex items-center gap-2">
                                  <Hash className="w-4 h-4 text-blue-600" />
                                  <div>
                                    <p className="text-xs text-gray-600">VATSK</p>
                                    <p className="text-sm font-medium">{transaction.vatsk}</p>
                                  </div>
                                </div>
                              )}
                              {transaction.pokladnica && (
                                <div className="flex items-center gap-2">
                                  <Hash className="w-4 h-4 text-green-600" />
                                  <div>
                                    <p className="text-xs text-gray-600">Pokladnica</p>
                                    <p className="text-sm font-medium">{transaction.pokladnica}</p>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-gray-600" />
                                <div>
                                  <p className="text-xs text-gray-600">Client IP</p>
                                  <p className="text-sm font-medium">{transaction.client_ip}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ),
                      )}

                    {activeTab === "subscriptions" &&
                      getPaginatedData(getFilteredData(subscriptions, "subscriptions")).map(
                        (subscription: MqttSubscription) => (
                          <div
                            key={subscription.id}
                            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {subscription.topic}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  QoS: {subscription.qos}
                                </Badge>
                              </div>
                              <span className="text-xs text-gray-500">{formatDate(subscription.created_at)}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-green-50 rounded-lg">
                              {subscription.vatsk && (
                                <div className="flex items-center gap-2">
                                  <Hash className="w-4 h-4 text-blue-600" />
                                  <div>
                                    <p className="text-xs text-gray-600">VATSK</p>
                                    <p className="text-sm font-medium">{subscription.vatsk}</p>
                                  </div>
                                </div>
                              )}
                              {subscription.pokladnica && (
                                <div className="flex items-center gap-2">
                                  <Hash className="w-4 h-4 text-green-600" />
                                  <div>
                                    <p className="text-xs text-gray-600">Pokladnica</p>
                                    <p className="text-sm font-medium">{subscription.pokladnica}</p>
                                  </div>
                                </div>
                              )}
                              {subscription.end_to_end_id && (
                                <div className="flex items-center gap-2">
                                  <Hash className="w-4 h-4 text-purple-600" />
                                  <div>
                                    <p className="text-xs text-gray-600">End-to-End ID</p>
                                    <p className="text-sm font-medium">{subscription.end_to_end_id}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                      )}

                    {activeTab === "payments" &&
                      getPaginatedData(getFilteredData(notifications, "payments")).map(
                        (notification: MqttNotification) => (
                          <div
                            key={notification.id}
                            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {notification.topic}
                                </Badge>
                                {notification.transaction_status && (
                                  <Badge
                                    variant={notification.transaction_status === "ACCC" ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {notification.transaction_status === "ACCC"
                                      ? "Úspešná"
                                      : notification.transaction_status}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">{formatDate(notification.created_at)}</span>
                            </div>

                            {(notification.vatsk ||
                              notification.pokladnica ||
                              notification.transaction_id ||
                              notification.amount) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3 p-3 bg-blue-50 rounded-lg">
                                {notification.vatsk && (
                                  <div className="flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-blue-600" />
                                    <div>
                                      <p className="text-xs text-gray-600">VATSK</p>
                                      <p className="text-sm font-medium">{notification.vatsk}</p>
                                    </div>
                                  </div>
                                )}
                                {notification.pokladnica && (
                                  <div className="flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-green-600" />
                                    <div>
                                      <p className="text-xs text-gray-600">Pokladnica</p>
                                      <p className="text-sm font-medium">{notification.pokladnica}</p>
                                    </div>
                                  </div>
                                )}
                                {notification.transaction_id && (
                                  <div className="flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-purple-600" />
                                    <div>
                                      <p className="text-xs text-gray-600">Transakcia ID</p>
                                      <p className="text-sm font-medium">{notification.transaction_id}</p>
                                    </div>
                                  </div>
                                )}
                                {notification.amount && notification.currency && (
                                  <div className="flex items-center gap-2">
                                    <Euro className="w-4 h-4 text-orange-600" />
                                    <div>
                                      <p className="text-xs text-gray-600">Suma</p>
                                      <p className="text-sm font-medium">
                                        {notification.amount.toFixed(2)} {notification.currency}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="bg-gray-100 rounded p-3 mb-2">
                              <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                {notification.raw_payload}
                              </pre>
                            </div>
                          </div>
                        ),
                      )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Zobrazuje sa {(currentPage - 1) * itemsPerPage + 1} -{" "}
                      {Math.min(
                        currentPage * itemsPerPage,
                        activeTab === "generations"
                          ? getFilteredData(transactions, "generations").length
                          : activeTab === "subscriptions"
                            ? getFilteredData(subscriptions, "subscriptions").length
                            : getFilteredData(notifications, "payments").length,
                      )}{" "}
                      z{" "}
                      {activeTab === "generations"
                        ? getFilteredData(transactions, "generations").length
                        : activeTab === "subscriptions"
                          ? getFilteredData(subscriptions, "subscriptions").length
                          : getFilteredData(notifications, "payments").length}{" "}
                      záznamov
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Predchádzajúca
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={
                          currentPage >=
                          getTotalPages(
                            activeTab === "generations"
                              ? getFilteredData(transactions, "generations")
                              : activeTab === "subscriptions"
                                ? getFilteredData(subscriptions, "subscriptions")
                                : getFilteredData(notifications, "payments"),
                          )
                        }
                      >
                        Ďalšia
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
