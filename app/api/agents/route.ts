import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase/server"

// GET /api/agents — 列出当前用户的所有 agents（未删除）
export async function GET() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/agents — 创建 agent
export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const body = await request.json()
  const { name, description } = body

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "名称不能为空" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("agents")
    .insert({
      user_id: user.id,
      name: name.trim(),
      description: description?.trim() || null,
      model: "deepseek-chat",
      system_prompt: "",
      temperature: 0.7,
      status: "draft",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
