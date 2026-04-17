import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

// GET /api/logs/:id — 日志详情（含 prompt_snapshot + response_snapshot）
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
    .from("run_logs")
    .select(`*, agents(id, name)`)
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
