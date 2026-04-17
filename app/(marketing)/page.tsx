import Link from "next/link"
import { Bot, MessageSquare, BarChart3, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Bot,
    title: "创建智能体",
    desc: "配置系统提示词、选择模型、调整温度参数，几分钟完成一个专属 AI 助手。",
  },
  {
    icon: MessageSquare,
    title: "流式对话",
    desc: "基于 SSE 的实时流式输出，打字机效果，支持 Markdown 渲染和多轮上下文。",
  },
  {
    icon: BarChart3,
    title: "调用日志",
    desc: "每次调用全量记录：prompt 快照、响应内容、耗时、token 消耗、错误信息。",
  },
  {
    icon: Zap,
    title: "DeepSeek 驱动",
    desc: "接入 DeepSeek API，高性价比、高性能，支持 deepseek-chat 和 deepseek-reasoner。",
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 导航 */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <span className="text-lg font-bold">智能体平台</span>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                登录
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">免费注册</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground mb-6">
            <Zap className="h-3 w-3" />
            基于 DeepSeek API · MVP 版本
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            5 分钟搭建你的<br />
            <span className="text-primary">专属智能体</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            类 Dify 的最小可用智能体编排平台。创建智能体、配置 Prompt、发起流式对话、查看完整调用日志。
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/login">
              <Button size="lg">免费开始使用</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                查看演示
              </Button>
            </Link>
          </div>
        </section>

        {/* 特性 */}
        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <h2 className="text-center text-2xl font-bold mb-10">核心功能</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border bg-background p-5"
                >
                  <f.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">准备好了吗？</h2>
          <p className="text-muted-foreground mb-6">注册账户，立即创建你的第一个智能体。</p>
          <Link href="/login">
            <Button size="lg">立即开始 →</Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © 2026 智能体平台 · MVP · Powered by DeepSeek
      </footer>
    </div>
  )
}
