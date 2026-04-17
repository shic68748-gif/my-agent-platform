import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Server Components / Route Handlers / Server Actions 用的 Supabase 客户端。
 * 每次请求都要新建,不能跨请求复用。
 *
 * 注意:Next 16 中 cookies() 是 async,所以这个函数也是 async。
 */
export async function createSupabaseServer() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // setAll 在 Server Component 渲染期不可用,忽略。
            // token 刷新由 proxy 层处理。
          }
        },
      },
    },
  )
}
