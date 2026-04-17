import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/service"

// GET /api/admin/overview — 平台总览指标（admin only）
export async function GET() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  // 校验 admin 角色
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  // 并发查询所有指标
  const [
    { count: userCount },
    { count: agentCount },
    { count: totalCalls },
    { count: failedCalls },
    { count: todayCalls },
    recentUsers,
    recentLogs,
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("agents")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
    supabaseAdmin.from("run_logs").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("run_logs")
      .select("*", { count: "exact", head: true })
      .neq("status", "success"),
    supabaseAdmin
      .from("run_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabaseAdmin
      .from("profiles")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("run_logs")
      .select("id, model, status, latency_ms, prompt_tokens, completion_tokens, created_at, agents(name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  const total = totalCalls ?? 0
  const failed = failedCalls ?? 0
  const failRate = total > 0 ? ((failed / total) * 100).toFixed(1) : "0.0"

  return NextResponse.json({
    metrics: {
      userCount: userCount ?? 0,
      agentCount: agentCount ?? 0,
      totalCalls: total,
      failRate: Number(failRate),
      todayCalls: todayCalls ?? 0,
    },
    recentUsers: recentUsers.data ?? [],
    recentLogs: recentLogs.data ?? [],
  })
}
