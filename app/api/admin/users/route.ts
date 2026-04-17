import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/service"

// GET /api/admin/users — 所有用户 + 调用统计（admin only）
export async function GET() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  // 用户基础信息
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false })

  if (!profiles) return NextResponse.json([])

  // 每用户调用统计
  const { data: logStats } = await supabaseAdmin
    .from("run_logs")
    .select("user_id, prompt_tokens, completion_tokens")

  const statsMap = new Map<string, { call_count: number; total_tokens: number }>()
  for (const log of logStats ?? []) {
    const s = statsMap.get(log.user_id) ?? { call_count: 0, total_tokens: 0 }
    s.call_count++
    s.total_tokens += (log.prompt_tokens ?? 0) + (log.completion_tokens ?? 0)
    statsMap.set(log.user_id, s)
  }

  const result = profiles.map((p) => ({
    ...p,
    call_count: statsMap.get(p.id)?.call_count ?? 0,
    total_tokens: statsMap.get(p.id)?.total_tokens ?? 0,
  }))

  return NextResponse.json(result)
}
