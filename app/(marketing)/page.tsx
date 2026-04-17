import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <span className="text-lg font-bold">智能体平台</span>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">登录</Button>
            </Link>
            <Link href="/login">
              <Button>立即开始</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          5 分钟搭建你的专属智能体
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          基于 DeepSeek 的最小可用智能体编排平台。创建智能体、配置 Prompt、发起对话、查看日志。
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/login">
            <Button size="lg">免费注册</Button>
          </Link>
        </div>
      </main>
    </>
  )
}
