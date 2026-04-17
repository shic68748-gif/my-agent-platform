import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/service"

/**
 * POST /api/auth/callback
 * 登录/注册成功后调用,检查 ADMIN_EMAILS 白名单并更新 role。
 * 方式 B: Next.js API 读环境变量,不依赖数据库配置。
 */
export async function POST() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  // 读取白名单
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  const isAdmin = adminEmails.includes(user.email?.toLowerCase() || "")

  // 查当前 role
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "profile 未找到" }, { status: 404 })
  }

  // 需要更新 role 时才写库
  const targetRole = isAdmin ? "admin" : "user"
  if (profile.role !== targetRole) {
    await supabaseAdmin
      .from("profiles")
      .update({ role: targetRole })
      .eq("id", user.id)
  }

  return NextResponse.json({ role: targetRole })
}
