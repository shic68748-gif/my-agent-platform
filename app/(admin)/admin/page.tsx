"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Users, Bot, Zap, AlertTriangle, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Metrics {
  userCount: number
  agentCount: number
  totalCalls: number
  failRate: number
  todayCalls: number
}

interface RecentUser {
  id: string
  email: string
  role: string
  created_at: string
}

interface RecentLog {
  id: string
  model: string
  status: string
  latency_ms: number
  prompt_tokens: number
  completion_tokens: number
  created_at: string
  agents: { name: string } | null
}

interface OverviewData {
  metrics: Metrics
  recentUsers: RecentUser[]
  recentLogs: RecentLog[]
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  success: "default",
  partial: "secondary",
  error: "destructive",
  timeout: "destructive",
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="text-sm text-muted-foreground">加载中...</div>
  }

  if (!data) return null

  const { metrics, recentUsers, recentLogs } = data

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">平台概览</h1>

      {/* 指标卡片（6.3）*/}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.userCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">智能体数</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.agentCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今日调用</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.todayCalls}</div>
            <div className="text-xs text-muted-foreground">总计 {metrics.totalCalls}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">失败率</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.failRate > 10 ? "text-destructive" : ""}`}>
              {metrics.failRate}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 最近注册用户 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">最近注册用户</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无用户</p>
              ) : (
                recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{u.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(u.created_at), "MM-dd HH:mm")}
                      </div>
                    </div>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"} className="ml-2 shrink-0">
                      {u.role === "admin" ? "管理员" : "用户"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 最近调用日志 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">最近调用</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无调用记录</p>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <div className="truncate text-xs">
                        {log.agents?.name ?? "—"} · {log.model}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.latency_ms}ms · {(log.prompt_tokens ?? 0) + (log.completion_tokens ?? 0)} tokens
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <Badge variant={STATUS_VARIANT[log.status] ?? "secondary"}>
                        {log.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "HH:mm")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
