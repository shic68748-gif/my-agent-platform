"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Send, Trash2, Plus, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageBubble } from "@/components/chat/message-bubble"
import type { ChatMessage, ChatSession, Agent } from "@/types"

interface SessionWithAgent extends ChatSession {
  agents: Pick<Agent, "id" | "name" | "status"> | null
}

export default function ChatSessionPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const sessionId = params.id

  const [session, setSession] = useState<SessionWithAgent | null>(null)
  const [sessions, setSessions] = useState<SessionWithAgent[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/chat/sessions")
    if (res.ok) setSessions(await res.json())
  }, [])

  const fetchMessages = useCallback(async () => {
    setLoadingMsgs(true)
    const [sessRes, msgsRes] = await Promise.all([
      fetch("/api/chat/sessions"),
      fetch(`/api/chat/sessions/${sessionId}/messages`),
    ])
    if (sessRes.ok) {
      const all: SessionWithAgent[] = await sessRes.json()
      setSessions(all)
      const found = all.find((s) => s.id === sessionId)
      if (!found) {
        toast.error("会话不存在")
        router.push("/chat")
        return
      }
      setSession(found)
    }
    if (msgsRes.ok) {
      setMessages(await msgsRes.json())
    }
    setLoadingMsgs(false)
  }, [sessionId, router])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return

    setInput("")
    setSending(true)
    setStreamingContent("")

    // 乐观更新：立即显示用户消息
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content: text,
      token_usage: 0,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      })

      if (!res.ok || !res.body) {
        const err = await res.json()
        toast.error(err.error || "发送失败")
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id))
        setSending(false)
        setStreamingContent(null)
        return
      }

      // 读取 SSE 流（3.11 打字机效果）
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let assembled = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6)
          if (data === "[DONE]") break
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) {
              toast.error(parsed.error)
              break
            }
            if (parsed.delta) {
              assembled += parsed.delta
              setStreamingContent(assembled)
            }
          } catch {
            // ignore malformed line
          }
        }
      }

      // 流结束，重新加载完整消息
      await fetchMessages()
      await fetchSessions()
    } catch (err) {
      toast.error("网络错误：" + String(err))
    } finally {
      setSending(false)
      setStreamingContent(null)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleDeleteSession(id: string) {
    const res = await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" })
    if (!res.ok) {
      toast.error("删除失败")
      return
    }
    if (id === sessionId) {
      router.push("/chat")
    } else {
      fetchSessions()
    }
  }

  const displayMessages = [
    ...messages,
    ...(streamingContent !== null && sending
      ? [
          {
            id: "streaming",
            session_id: sessionId,
            role: "assistant" as const,
            content: streamingContent,
            token_usage: 0,
            created_at: new Date().toISOString(),
          },
        ]
      : []),
  ]

  return (
    <div className="flex h-full overflow-hidden">
      {/* 侧边栏：会话列表 */}
      {sidebarOpen && (
        <div className="w-64 border-r flex flex-col shrink-0">
          <div className="flex items-center justify-between px-3 py-3 border-b">
            <span className="text-sm font-medium">对话列表</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => router.push("/chat")}
              title="新建对话"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center justify-between px-3 py-2 mx-1 rounded-md cursor-pointer text-sm ${
                  s.id === sessionId ? "bg-accent" : "hover:bg-accent/50"
                }`}
                onClick={() => router.push(`/chat/${s.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{s.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {s.agents?.name ?? "未知智能体"}
                  </div>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 ml-1 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteSession(s.id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 主区域 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部栏 */}
        <div className="flex items-center gap-2 border-b px-4 py-3 shrink-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform ${sidebarOpen ? "" : "rotate-180"}`}
            />
          </button>
          <span className="font-medium text-sm truncate">
            {session?.title ?? "加载中..."}
          </span>
          {session?.agents?.name && (
            <span className="text-xs text-muted-foreground">
              · {session.agents.name}
            </span>
          )}
        </div>

        {/* 消息区 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loadingMsgs ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              加载中...
            </div>
          ) : displayMessages.filter((m) => m.role !== "system").length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              还没有消息，发送第一条消息开始对话
            </div>
          ) : (
            displayMessages
              .filter((m) => m.role !== "system")
              .map((m) => (
                <MessageBubble
                  key={m.id}
                  role={m.role}
                  content={m.content}
                  streaming={m.id === "streaming"}
                />
              ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* 输入区（3.12：Enter 发送，Shift+Enter 换行）*/}
        <div className="shrink-0 border-t px-4 py-3">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
              rows={1}
              disabled={sending}
              className="resize-none min-h-[40px] max-h-[200px] overflow-y-auto"
            />
            <Button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              size="sm"
              className="h-10 w-10 p-0 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
