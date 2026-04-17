"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, MessageSquare, BookOpen, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const navItems = [
  { href: "/agents", label: "智能体", icon: Bot },
  { href: "/chat", label: "对话", icon: MessageSquare },
  { href: "/knowledge", label: "知识库", icon: BookOpen, badge: "Soon" },
  { href: "/logs", label: "日志", icon: FileText },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-60 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/agents" className="text-lg font-bold">
          智能体平台
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
