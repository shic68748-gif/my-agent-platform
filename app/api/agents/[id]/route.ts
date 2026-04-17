import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

// PATCH /api/agents/:id — 更新 agent 配置或状态
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const body = await request.json()

  // 允许更新的字段白名单
  const allowed = [
    "name",
    "description",
    "system_prompt",
    "model",
    "temperature",
    "status",
  ] as const
  type AllowedKey = (typeof allowed)[number]

  const updates: Partial<Record<AllowedKey, unknown>> = {}
  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "没有可更新的字段" }, { status: 400 })
  }

  // 校验 status 取值
  if (
    updates.status !== undefined &&
    !["draft", "published", "disabled"].includes(updates.status as string)
  ) {
    return NextResponse.json({ error: "status 取值无效" }, { status: 400 })
  }

  // 校验 temperature 范围
  if (updates.temperature !== undefined) {
    const temp = Number(updates.temperature)
    if (isNaN(temp) || temp < 0 || temp > 2) {
      return NextResponse.json(
        { error: "temperature 必须在 0-2 之间" },
        { status: 400 },
      )
    }
    updates.temperature = temp
  }

  const { data, error } = await supabase
    .from("agents")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE /api/agents/:id — 软删除 agent（检查活跃会话）
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  // 检查是否有活跃会话（chat_sessions 模块 3 建表后生效，先做软删除逻辑）
  // 2.6: 前置检查活跃会话 — 查 chat_sessions 是否存在该 agent_id
  const { count } = await supabase
    .from("chat_sessions")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", id)

  if (count && count > 0) {
    return NextResponse.json(
      { error: `该智能体有 ${count} 个关联会话，无法删除` },
      { status: 409 },
    )
  }

  const { error } = await supabase
    .from("agents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
