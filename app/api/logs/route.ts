import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase/server"

// GET /api/logs?page=1&limit=20&status=error&agent_id=xxx&model=deepseek-chat
export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")))
  const offset = (page - 1) * limit

  const status = searchParams.get("status")
  const agentId = searchParams.get("agent_id")
  const model = searchParams.get("model")

  let query = supabase
    .from("run_logs")
    .select(
      `id, model, latency_ms, prompt_tokens, completion_tokens, status, error_message, created_at,
       agents(id, name)`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq("status", status)
  if (agentId) query = query.eq("agent_id", agentId)
  if (model) query = query.eq("model", model)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    pagination: { page, limit, total: count ?? 0 },
  })
}
