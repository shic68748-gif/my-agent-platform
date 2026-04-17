"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-end border-b px-6">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {/* 模块 1 实现后显示当前用户邮箱 */}
          未登录
        </span>
        <Button variant="ghost" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          退出
        </Button>
      </div>
    </header>
  )
}
