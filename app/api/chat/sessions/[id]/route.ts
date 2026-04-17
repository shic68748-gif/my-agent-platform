import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

// PATCH /api/chat/sessions/:id — 更新会话标题
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { title } = await request.json()
  if (!title || typeof title !== "string" || title.trim() === "") {
    return NextResponse.json({ error: "标题不能为空" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .update({ title: title.trim() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE /api/chat/sessions/:id — 删除会话（级联删消息）
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
