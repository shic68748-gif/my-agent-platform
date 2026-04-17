import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase/server"

// GET /api/chat/sessions — 列出当前用户的会话（按最后活跃时间倒序）
export async function GET() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*, agents(id, name, status)")
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/chat/sessions — 创建新会话（需指定已发布的 agent）
export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const body = await request.json()
  const { agent_id } = body

  if (!agent_id) {
    return NextResponse.json({ error: "agent_id 不能为空" }, { status: 400 })
  }

  // 2.12 校验：只有已发布的 agent 才能被选中（用户只能看自己的 agent）
  const { data: agent, error: agentErr } = await supabase
    .from("agents")
    .select("id, status")
    .eq("id", agent_id)
    .single()

  if (agentErr || !agent) {
    return NextResponse.json({ error: "智能体不存在" }, { status: 404 })
  }

  if (agent.status !== "published") {
    return NextResponse.json(
      { error: "该智能体未发布，无法开始对话" },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: user.id,
      agent_id,
      title: "新对话",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
