import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * proxy.ts(原 middleware.ts)里用的 Supabase 客户端。
 * 负责 session 刷新 + token refresh 写回 cookie。
 * 必须同时实现 getAll 和 setAll。
 */
export function createSupabaseProxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 1. 写到 request 上(让后续 Server Component 也能读到新 token)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          // 2. 重新创建 response,带上更新后的 request headers
          supabaseResponse = NextResponse.next({ request })
          // 3. 写到 response 上(返回给浏览器)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  return { supabase, response: supabaseResponse }
}
