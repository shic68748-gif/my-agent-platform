"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Bot, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Agent } from "@/types"

export default function ChatPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data: Agent[]) => {
        // 2.12 只展示已发布的 agent
        setAgents(data.filter((a) => a.status === "published"))
        setLoading(false)
      })
  }, [])

  async function handleSelectAgent(agentId: string) {
    setCreating(true)
    const res = await fetch("/api/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    })
    setCreating(false)
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || "创建会话失败")
      return
    }
    const session = await res.json()
    router.push(`/chat/${session.id}`)
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center max-w-md">
        <MessageSquarePlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-1">开始新对话</h2>
        <p className="text-sm text-muted-foreground mb-6">
          选择一个已发布的智能体，开始对话
        </p>
        <Button onClick={() => setDialogOpen(true)} disabled={creating}>
          选择智能体
        </Button>
      </div>

      {/* 智能体选择器（3.9）*/}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>选择智能体</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                加载中...
              </p>
            ) : agents.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  没有已发布的智能体
                </p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => router.push("/agents")}
                >
                  前往创建并发布智能体
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent.id)}
                    disabled={creating}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent text-left transition-colors"
                  >
                    <Bot className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{agent.name}</div>
                      {agent.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {agent.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
