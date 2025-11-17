"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft, RefreshCw, Zap } from 'lucide-react'
import { createBrowserClient } from "@supabase/ssr"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface HourlyData {
  hour: string
  transactions: number
  notifications: number
}

export default function NotificationsPage() {
  const [testData, setTestData] = useState<HourlyData[]>([])
  const [prodData, setProdData] = useState<HourlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("test")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const fetchHourlyData = async () => {
    try {
      setLoading(true)

      // Get today's date range
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

      console.log("[v0] Fetching data for today:", startOfDay.toISOString(), "to", endOfDay.toISOString())

      // Fetch transactions and notifications for today
      const [transactionsResult, notificationsResult] = await Promise.all([
        supabase
          .from("transaction_generations")
          .select("created_at, end_point")
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString()),
        supabase
          .from("mqtt_notifications")
          .select("created_at, end_point")
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString()),
      ])

      if (transactionsResult.error) throw transactionsResult.error
      if (notificationsResult.error) throw notificationsResult.error

      const transactions = transactionsResult.data || []
      const notifications = notificationsResult.data || []

      console.log("[v0] Transactions:", transactions.length)
      console.log("[v0] Notifications:", notifications.length)

      // Process data for TEST environment
      const testHourlyData = processHourlyData(
        transactions.filter((t) => t.end_point === "TEST"),
        notifications.filter((n) => n.end_point === "TEST"),
      )

      // Process data for PRODUCTION environment
      const prodHourlyData = processHourlyData(
        transactions.filter((t) => t.end_point === "PRODUCTION"),
        notifications.filter((n) => n.end_point === "PRODUCTION"),
      )

      setTestData(testHourlyData)
      setProdData(prodHourlyData)
    } catch (err) {
      console.error("[v0] Error fetching hourly data:", err)
    } finally {
      setLoading(false)
    }
  }

  const processHourlyData = (
    transactions: Array<{ created_at: string }>,
    notifications: Array<{ created_at: string }>,
  ): HourlyData[] => {
    const hourlyMap = new Map<number, { transactions: number; notifications: number }>()

    // Initialize all 24 hours
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, { transactions: 0, notifications: 0 })
    }

    // Count transactions per hour
    transactions.forEach((t) => {
      const hour = new Date(t.created_at).getHours()
      const current = hourlyMap.get(hour)!
      hourlyMap.set(hour, { ...current, transactions: current.transactions + 1 })
    })

    // Count notifications per hour
    notifications.forEach((n) => {
      const hour = new Date(n.created_at).getHours()
      const current = hourlyMap.get(hour)!
      hourlyMap.set(hour, { ...current, notifications: current.notifications + 1 })
    })

    // Convert to array
    return Array.from(hourlyMap.entries())
      .map(([hour, data]) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        transactions: data.transactions,
        notifications: data.notifications,
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
  }

  useEffect(() => {
    fetchHourlyData()
  }, [])

  const renderChart = (data: HourlyData[], environment: string) => {
    const envColor = environment === "TEST" ? "from-cyan-500 to-blue-600" : "from-purple-500 to-pink-600"
    const chartColor1 = environment === "TEST" ? "#06b6d4" : "#a855f7"
    const chartColor2 = environment === "TEST" ? "#3b82f6" : "#ec4899"

    return (
      <Card className={`border-0 shadow-2xl bg-gradient-to-br ${envColor} text-white overflow-hidden relative`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDEzNGg3djFoLTd6TTI1IDE0M2g3djFoLTd6TTM2IDE0M2g3djFoLTd6TTIxIDEzNGg3djFoLTd6TTI1IDEzNGg3djFoLTd6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">
                  {environment} Environment
                </CardTitle>
                <p className="text-sm opacity-90 mt-1">
                  Dnešná hodinová analýza - {new Date().toLocaleDateString("sk-SK")}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 pt-6">
          {loading ? (
            <div className="h-[500px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-12 h-12 animate-spin" />
                <p className="text-lg font-medium">Načítavam dáta...</p>
              </div>
            </div>
          ) : (
            <div className="h-[500px] bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id={`transactions-${environment}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor1} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={chartColor1} stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id={`notifications-${environment}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor2} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={chartColor2} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="hour"
                    stroke="rgba(255,255,255,0.8)"
                    tick={{ fill: "rgba(255,255,255,0.9)", fontSize: 12 }}
                    tickLine={{ stroke: "rgba(255,255,255,0.3)" }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.8)"
                    tick={{ fill: "rgba(255,255,255,0.9)", fontSize: 12 }}
                    tickLine={{ stroke: "rgba(255,255,255,0.3)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "12px",
                      backdropFilter: "blur(8px)",
                      color: "#fff",
                    }}
                    labelStyle={{ color: "#fff", fontWeight: 600 }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="circle"
                    formatter={(value) => (
                      <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>{value}</span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="transactions"
                    stroke={chartColor1}
                    strokeWidth={3}
                    dot={{ fill: chartColor1, strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8, strokeWidth: 2 }}
                    name="Transakcie"
                    fill={`url(#transactions-${environment})`}
                  />
                  <Line
                    type="monotone"
                    dataKey="notifications"
                    stroke={chartColor2}
                    strokeWidth={3}
                    dot={{ fill: chartColor2, strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8, strokeWidth: 2 }}
                    name="Notifikácie"
                    fill={`url(#notifications-${environment})`}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stats Summary */}
          {!loading && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-sm opacity-80 mb-1">Celkom transakcií</p>
                <p className="text-3xl font-bold">
                  {data.reduce((sum, d) => sum + d.transactions, 0)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-sm opacity-80 mb-1">Celkom notifikácií</p>
                <p className="text-3xl font-bold">
                  {data.reduce((sum, d) => sum + d.notifications, 0)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                <ArrowLeft className="w-4 h-4" />
                Späť
              </Button>
            </Link>
            <div>
              <h1 className="text-5xl font-bold text-white tracking-tight">
                Hodinová analýza
              </h1>
              <p className="text-gray-400 mt-2 text-lg">Real-time monitoring dashboard</p>
            </div>
          </div>
          <Button
            onClick={fetchHourlyData}
            disabled={loading}
            size="lg"
            className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            Obnoviť
          </Button>
        </div>

        {/* Tabs for TEST and PRODUCTION */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-white/10 backdrop-blur-sm border border-white/20 h-14">
            <TabsTrigger
              value="test"
              className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white font-semibold text-lg"
            >
              TEST
            </TabsTrigger>
            <TabsTrigger
              value="production"
              className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white font-semibold text-lg"
            >
              PRODUCTION
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="mt-8">
            {renderChart(testData, "TEST")}
          </TabsContent>

          <TabsContent value="production" className="mt-8">
            {renderChart(prodData, "PRODUCTION")}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
