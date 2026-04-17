import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseProxy } from "@/lib/supabase/proxy"

// 不需要登录即可访问的路径(官网首页)
const publicPaths = ["/"]

// 登录页:未登录可访问,已登录重定向
const authPaths = ["/login"]

// 需要 admin 角色的路径前缀
const adminPrefix = "/admin"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 静态资源直接放行
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // 所有页面都要刷新 session(即使公开页面,也要维护 cookie 有效性)
  const { supabase, response } = createSupabaseProxy(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 公开页面:任何人都能访问
  if (publicPaths.includes(pathname)) {
    return response
  }

  // 登录页:已登录 → 跳到控制台
  if (authPaths.includes(pathname)) {
    if (user) {
      return NextResponse.redirect(new URL("/agents", request.url))
    }
    return response
  }

  // 以下都是受保护页面,未登录 → 重定向到登录页
  if (!user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // admin 路径:需要 admin 角色
  if (pathname.startsWith(adminPrefix)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/agents", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
