import "server-only"

import { createClient } from "@supabase/supabase-js"

/**
 * 使用 SERVICE_ROLE_KEY 的 Supabase admin 客户端。
 * 绕过 RLS,仅在服务端使用(写 run_logs、admin 查询等)。
 * 可以复用单例,不依赖 cookie。
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
