import Link from "next/link"
import { BarChart3, TrendingUp } from "lucide-react"

const adminNavItems = [
  { href: "/admin", label: "概览", icon: BarChart3 },
  { href: "/admin/usage", label: "使用情况", icon: TrendingUp },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <aside className="flex w-60 flex-col border-r bg-muted/30">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="text-lg font-bold">
            <span className="text-muted-foreground">[Admin]</span> 管理后台
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <span className="text-sm text-muted-foreground">管理后台</span>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
