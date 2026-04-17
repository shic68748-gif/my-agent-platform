# 智能体平台 (My Agent Platform)

基于 DeepSeek 的类 Dify 最小可用智能体编排平台。

## 核心功能

- 创建和配置智能体(Prompt + 模型 + 温度)
- 与智能体对话(SSE 流式输出)
- 调用日志查看与追踪
- 管理后台(用户、调用概览)

## 技术栈

- **框架**: Next.js 16 (App Router + Turbopack)
- **语言**: TypeScript
- **样式**: Tailwind CSS v4 + shadcn/ui
- **数据库/鉴权**: Supabase (Postgres + Auth + RLS)
- **模型**: DeepSeek (OpenAI 兼容协议适配层)
- **部署**: Vercel

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量(复制并填入 Supabase/DeepSeek key)
cp .env.local.example .env.local

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
app/
  (marketing)/    # 官网首页
  (auth)/         # 登录/注册
  (app)/          # 用户控制台 (agents/chat/knowledge/logs)
  (admin)/        # 管理后台
  api/            # API Routes
components/
  ui/             # shadcn/ui 组件
  layout/         # 布局组件
lib/
  supabase/       # Supabase 客户端封装
  llm/            # LLM 适配层
types/            # TypeScript 类型定义
docs/             # 项目文档
```

## 文档

详见 [docs/README.md](docs/README.md)
