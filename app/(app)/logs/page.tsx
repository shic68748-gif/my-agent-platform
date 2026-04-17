"use client"

import { useCallback, useEffect, useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { RunLog, Agent } from "@/types"

type RunLogWithAgent = RunLog & { agents: Pick<Agent, "id" | "name"> | null }

interface LogsResponse {
  data: RunLogWithAgent[]
  pagination: { page: number; limit: number; total: number }
}

const STATUS_VARIANT: Record<
  RunLog["status"],
  "default" | "secondary" | "destructive"
> = {
  success: "default",
  partial: "secondary",
  error: "destructive",
  timeout: "destructive",
}

const STATUS_LABEL: Record<RunLog["status"], string> = {
  success: "成功",
  error: "错误",
  timeout: "超时",
  partial: "部分",
}

export default function LogsPage() {
  const [logs, setLogs] = useState<RunLogWithAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [agents, setAgents] = useState<Agent[]>([])
  const [filterAgent, setFilterAgent] = useState<string>("")
  const [selectedLog, setSelectedLog] = useState<RunLog | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  // 加载智能体列表（用于筛选器）
  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then(setAgents)
  }, [])

  const fetchLogs = useCallback(
    async (page = 1) => {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (filterStatus) params.set("status", filterStatus)
      if (filterAgent) params.set("agent_id", filterAgent)

      const res = await fetch(`/api/logs?${params}`)
      if (res.ok) {
        const json: LogsResponse = await res.json()
        setLogs(json.data)
        setPagination(json.pagination)
      }
      setLoading(false)
    },
    [filterStatus, filterAgent],
  )

  useEffect(() => {
    fetchLogs(1)
  }, [fetchLogs])

  async function openDetail(logId: string) {
    setSheetOpen(true)
    setDetailLoading(true)
    const res = await fetch(`/api/logs/${logId}`)
    if (res.ok) setSelectedLog(await res.json())
    setDetailLoading(false)
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">调用日志</h1>
        <span className="text-sm text-muted-foreground">
          共 {pagination.total} 条
        </span>
      </div>

      {/* 筛选器（4.8）*/}
      <div className="flex gap-3 mb-4">
        <Select
          value={filterStatus || "all"}
          onValueChange={(v) => setFilterStatus(!v || v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="success">成功</SelectItem>
            <SelectItem value="error">错误</SelectItem>
            <SelectItem value="timeout">超时</SelectItem>
            <SelectItem value="partial">部分</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterAgent || "all"}
          onValueChange={(v) => setFilterAgent(!v || v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="全部智能体" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部智能体</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(filterStatus || filterAgent) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterStatus("")
              setFilterAgent("")
            }}
          >
            清除筛选
          </Button>
        )}
      </div>

      {/* 日志表格（4.6）*/}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>状态</TableHead>
              <TableHead>智能体</TableHead>
              <TableHead>模型</TableHead>
              <TableHead className="text-right">耗时(ms)</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead>时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  加载中...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  暂无日志
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => openDetail(log.id)}
                >
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[log.status]}>
                      {STATUS_LABEL[log.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate">
                    {log.agents?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {log.model}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {log.latency_ms.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {((log.prompt_tokens ?? 0) + (log.completion_tokens ?? 0)).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), "MM-dd HH:mm:ss", { locale: zhCN })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchLogs(pagination.page - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {pagination.page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= totalPages}
            onClick={() => fetchLogs(pagination.page + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 日志详情抽屉（4.7）*/}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>日志详情</SheetTitle>
          </SheetHeader>

          {detailLoading ? (
            <div className="text-sm text-muted-foreground">加载中...</div>
          ) : selectedLog ? (
            <div className="space-y-6 text-sm">
              {/* 基本信息 */}
              <section className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">状态</div>
                  <Badge variant={STATUS_VARIANT[selectedLog.status]}>
                    {STATUS_LABEL[selectedLog.status]}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">模型</div>
                  <div className="font-mono text-xs">{selectedLog.model}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">耗时</div>
                  <div className="font-mono">{selectedLog.latency_ms} ms</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Tokens</div>
                  <div className="font-mono">
                    {selectedLog.prompt_tokens ?? 0} prompt + {selectedLog.completion_tokens ?? 0} completion
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">时间</div>
                  <div>{format(new Date(selectedLog.created_at), "yyyy-MM-dd HH:mm:ss")}</div>
                </div>
                {selectedLog.error_message && (
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">错误信息</div>
                    <div className="text-destructive text-xs font-mono break-all">
                      {selectedLog.error_message}
                    </div>
                  </div>
                )}
              </section>

              {/* Prompt 快照 */}
              <section>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Prompt 快照
                </div>
                <div className="rounded-md bg-muted p-3 space-y-3 max-h-80 overflow-y-auto">
                  {(selectedLog.prompt_snapshot as Array<{ role: string; content: string }>).map(
                    (msg, i) => (
                      <div key={i}>
                        <div className="text-xs font-semibold text-muted-foreground mb-1 capitalize">
                          {msg.role}
                        </div>
                        <div className="text-xs whitespace-pre-wrap break-words font-mono">
                          {msg.content}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>

              {/* 响应快照 */}
              {selectedLog.response_snapshot && (
                <section>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    响应快照
                  </div>
                  <div className="rounded-md bg-muted p-3 max-h-80 overflow-y-auto">
                    <div className="text-xs whitespace-pre-wrap break-words font-mono">
                      {selectedLog.response_snapshot}
                    </div>
                  </div>
                </section>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
