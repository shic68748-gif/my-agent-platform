"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import type { Agent } from "@/types"

// MVP 只列 DeepSeek 模型（2.10）
const MODELS = [
  { value: "deepseek-chat", label: "DeepSeek Chat" },
  { value: "deepseek-reasoner", label: "DeepSeek Reasoner" },
]

const STATUS_OPTIONS: { value: Agent["status"]; label: string }[] = [
  { value: "draft", label: "草稿" },
  { value: "published", label: "已发布" },
  { value: "disabled", label: "已停用" },
]

export default function AgentConfigPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 表单 state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [model, setModel] = useState("deepseek-chat")
  const [temperature, setTemperature] = useState(0.7)
  const [status, setStatus] = useState<Agent["status"]>("draft")

  const loadAgent = useCallback(async () => {
    const res = await fetch(`/api/agents`)
    if (!res.ok) {
      toast.error("加载失败")
      setLoading(false)
      return
    }
    const agents: Agent[] = await res.json()
    const found = agents.find((a) => a.id === id)
    if (!found) {
      toast.error("智能体不存在")
      router.push("/agents")
      return
    }
    setAgent(found)
    setName(found.name)
    setDescription(found.description ?? "")
    setSystemPrompt(found.system_prompt)
    setModel(found.model)
    setTemperature(Number(found.temperature))
    setStatus(found.status)
    setLoading(false)
  }, [id, router])

  useEffect(() => {
    loadAgent()
  }, [loadAgent])

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || null,
        system_prompt: systemPrompt,
        model,
        temperature,
        status,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || "保存失败")
      return
    }
    const updated: Agent = await res.json()
    setAgent(updated)
    toast.success("已保存")
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/agents/${id}`, { method: "DELETE" })
    setDeleting(false)
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || "删除失败")
      return
    }
    toast.success("已删除")
    router.push("/agents")
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">加载中...</div>
    )
  }

  if (!agent) return null

  return (
    <div className="p-6 max-w-2xl">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/agents")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </button>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              status === "published"
                ? "default"
                : status === "disabled"
                  ? "destructive"
                  : "secondary"
            }
          >
            {STATUS_OPTIONS.find((o) => o.value === status)?.label}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-6">{agent.name}</h1>

      <div className="space-y-6">
        {/* 基本信息 */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            基本信息
          </h2>
          <div className="space-y-2">
            <Label htmlFor="name">名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">描述（可选）</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              placeholder="简单描述该智能体的用途"
            />
          </div>
        </section>

        {/* 提示词 */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            系统提示词
          </h2>
          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={8}
              placeholder="你是一个专业的AI助手..."
              className="resize-y font-mono text-sm"
            />
          </div>
        </section>

        {/* 模型参数 */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            模型参数
          </h2>
          <div className="space-y-2">
            <Label>模型</Label>
            <Select value={model} onValueChange={(v) => { if (v) setModel(v) }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>温度（Temperature）</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={(v) => {
                const arr = Array.isArray(v) ? v : [v]
                setTemperature(Number(arr[0]))
              }}
              min={0}
              max={2}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">
              较低的值使输出更精确，较高的值使输出更有创意
            </p>
          </div>
        </section>

        {/* 状态（2.11）*/}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            状态
          </h2>
          <div className="space-y-2">
            <Label>发布状态</Label>
            <Select
              value={status}
              onValueChange={(v) => { if (v) setStatus(v as Agent["status"]) }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              只有「已发布」的智能体才能在对话页被选中使用
            </p>
          </div>
        </section>

        {/* 保存 */}
        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "保存中..." : "保存配置"}
          </Button>
        </div>
      </div>

      {/* 删除确认 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除智能体？</DialogTitle>
            <DialogDescription>
              删除后该智能体将不可用。如果存在关联会话，需先删除会话才能删除智能体。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
