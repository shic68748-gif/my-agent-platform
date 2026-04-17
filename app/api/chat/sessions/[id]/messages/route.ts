import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/service"
import { getProvider, LLMError } from "@/lib/llm"
import type { Message } from "@/lib/llm"

type Params = { params: Promise<{ id: string }> }

// GET /api/chat/sessions/:id/messages — 历史消息
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/chat/sessions/:id/messages — 发送消息（SSE 流式）
export async function POST(request: Request, { params }: Params) {
  const { id: sessionId } = await params
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { content } = await request.json()
  if (!content || typeof content !== "string" || content.trim() === "") {
    return NextResponse.json({ error: "消息内容不能为空" }, { status: 400 })
  }
  const userContent = content.trim()

  // 验证 session 归属
  const { data: session, error: sessionErr } = await supabase
    .from("chat_sessions")
    .select("id, agent_id, title")
    .eq("id", sessionId)
    .single()

  if (sessionErr || !session) {
    return NextResponse.json({ error: "会话不存在" }, { status: 404 })
  }

  // 读取 agent 配置
  const { data: agent, error: agentErr } = await supabase
    .from("agents")
    .select("id, name, system_prompt, model, temperature")
    .eq("id", session.agent_id)
    .single()

  if (agentErr || !agent) {
    return NextResponse.json({ error: "智能体不存在" }, { status: 404 })
  }

  // 读取历史消息（3.15 多轮上下文，最近 20 条，去 system）
  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(20)

  const historyMessages: Message[] = (history ?? [])
    .reverse()
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))

  // 用户消息提前入库
  const { data: userMsg } = await supabaseAdmin
    .from("chat_messages")
    .insert({ session_id: sessionId, role: "user", content: userContent })
    .select()
    .single()

  // 3.16 自动命名：第一条用户消息时更新会话标题
  if (session.title === "新对话" && historyMessages.length === 0) {
    const autoTitle = userContent.slice(0, 20)
    await supabaseAdmin
      .from("chat_sessions")
      .update({ title: autoTitle })
      .eq("id", sessionId)
  }

  // 组装 messages
  const messages: Message[] = [
    { role: "system", content: agent.system_prompt || "你是一个有帮助的AI助手。" },
    ...historyMessages,
    { role: "user", content: userContent },
  ]

  const startTime = Date.now()
  const provider = getProvider(agent.model)

  // SSE 流式响应
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      let fullContent = ""
      let promptTokens = 0
      let completionTokens = 0
      let runStatus: "success" | "error" | "timeout" | "partial" = "success"
      let errorMessage: string | null = null

      try {
        const chunks = provider.chat({
          model: agent.model,
          messages,
          temperature: Number(agent.temperature),
          stream: true,
        })

        for await (const chunk of chunks) {
          if (chunk.delta) {
            fullContent += chunk.delta
            send(JSON.stringify({ delta: chunk.delta }))
          }
          if (chunk.done) {
            if (chunk.usage) {
              promptTokens = chunk.usage.promptTokens
              completionTokens = chunk.usage.completionTokens
            }
            break
          }
        }
      } catch (err) {
        if (err instanceof LLMError) {
          runStatus = err.code === "TIMEOUT" ? "timeout" : "error"
          errorMessage = err.message
        } else {
          runStatus = "error"
          errorMessage = String(err)
        }

        if (fullContent.length > 0) {
          runStatus = "partial"
        }

        send(JSON.stringify({ error: errorMessage }))
      }

      const latencyMs = Date.now() - startTime

      // 写入 assistant 消息
      let assistantMsgId: string | null = null
      if (fullContent) {
        const { data: assistantMsg } = await supabaseAdmin
          .from("chat_messages")
          .insert({
            session_id: sessionId,
            role: "assistant",
            content: fullContent,
            token_usage: completionTokens,
          })
          .select("id")
          .single()
        assistantMsgId = assistantMsg?.id ?? null
      }

      // 更新 session updated_at
      await supabaseAdmin
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId)

      // 写入 run_log（使用 service role 绕过 RLS）
      await supabaseAdmin.from("run_logs").insert({
        user_id: user.id,
        agent_id: agent.id,
        session_id: sessionId,
        message_id: assistantMsgId,
        model: agent.model,
        prompt_snapshot: messages,
        response_snapshot: fullContent || null,
        latency_ms: latencyMs,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        status: runStatus,
        error_message: errorMessage,
      })

      send("[DONE]")
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
