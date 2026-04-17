import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/service"

// GET /api/admin/agents — 所有智能体 + 调用统计（admin only）
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

  // 所有 agent + 创建者邮箱
  const { data: agents } = await supabaseAdmin
    .from("agents")
    .select("id, name, status, user_id, profiles(email)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (!agents) return NextResponse.json([])

  // 每 agent 调用次数
  const { data: logStats } = await supabaseAdmin
    .from("run_logs")
    .select("agent_id")

  const callMap = new Map<string, number>()
  for (const log of logStats ?? []) {
    callMap.set(log.agent_id, (callMap.get(log.agent_id) ?? 0) + 1)
  }

  const result = agents.map((a) => ({
    id: a.id,
    name: a.name,
    status: a.status,
    user_email: (a.profiles as unknown as { email: string } | null)?.email ?? null,
    call_count: callMap.get(a.id) ?? 0,
  }))

  return NextResponse.json(result)
}
