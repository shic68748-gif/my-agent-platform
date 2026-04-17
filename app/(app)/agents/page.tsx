"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Bot, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { Agent } from "@/types"

const STATUS_LABEL: Record<Agent["status"], string> = {
  draft: "草稿",
  published: "已发布",
  disabled: "已停用",
}

const STATUS_VARIANT: Record<
  Agent["status"],
  "secondary" | "default" | "destructive"
> = {
  draft: "secondary",
  published: "default",
  disabled: "destructive",
}

export default function AgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  async function fetchAgents() {
    const res = await fetch("/api/agents")
    if (res.ok) {
      setAgents(await res.json())
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    })
    setCreating(false)
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || "创建失败")
      return
    }
    const agent: Agent = await res.json()
    toast.success("创建成功")
    setDialogOpen(false)
    setName("")
    setDescription("")
    router.push(`/agents/${agent.id}`)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">智能体</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新建智能体
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">加载中...</div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">还没有智能体</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            创建你的第一个智能体，配置 Prompt 和模型参数
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新建智能体
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => router.push(`/agents/${agent.id}`)}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-left hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Bot className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{agent.name}</div>
                  {agent.description && (
                    <div className="text-sm text-muted-foreground truncate">
                      {agent.description}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <Badge variant={STATUS_VARIANT[agent.status]}>
                  {STATUS_LABEL[agent.status]}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 创建对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建智能体</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="agent-name">名称 *</Label>
                <Input
                  id="agent-name"
                  placeholder="例如：翻译助手"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent-desc">描述（可选）</Label>
                <Textarea
                  id="agent-desc"
                  placeholder="简单描述该智能体的用途..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "创建中..." : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
