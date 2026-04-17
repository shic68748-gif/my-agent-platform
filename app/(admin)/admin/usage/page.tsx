"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UserUsage {
  id: string
  email: string
  role: string
  created_at: string
  call_count?: number
  total_tokens?: number
}

interface AgentUsage {
  id: string
  name: string
  status: string
  call_count?: number
  user_email?: string
}

export default function UsagePage() {
  const [users, setUsers] = useState<UserUsage[]>([])
  const [agents, setAgents] = useState<AgentUsage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/agents").then((r) => r.json()),
    ]).then(([u, a]) => {
      setUsers(Array.isArray(u) ? u : [])
      setAgents(Array.isArray(a) ? a : [])
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="text-sm text-muted-foreground">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">使用情况</h1>

      <div className="grid gap-6">
        {/* 用户列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">用户列表</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead className="text-right">调用次数</TableHead>
                  <TableHead className="text-right">总 Tokens</TableHead>
                  <TableHead>注册时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      暂无用户
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                          {u.role === "admin" ? "管理员" : "用户"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {(u.call_count ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {(u.total_tokens ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(u.created_at), "yyyy-MM-dd")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 智能体列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">智能体列表</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建者</TableHead>
                  <TableHead className="text-right">调用次数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      暂无智能体
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.status === "published"
                              ? "default"
                              : a.status === "disabled"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {a.status === "published"
                            ? "已发布"
                            : a.status === "disabled"
                              ? "已停用"
                              : "草稿"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.user_email ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {(a.call_count ?? 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
