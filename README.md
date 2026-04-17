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

## 演示路径

1. 注册账户 → 自动跳转到 `/agents`
2. 点击「新建智能体」→ 填名称 → 进入配置页
3. 填写 System Prompt，选择模型（deepseek-chat），调整温度，将状态改为「已发布」→ 保存
4. 进入「对话」页 → 选择刚发布的智能体 → 开始对话
5. 进入「调用日志」→ 查看每次调用的 prompt 快照、响应、耗时、tokens
6. 管理员账户（`ADMIN_EMAILS` 环境变量配置）可访问 `/admin` 查看平台概览

## 环境变量说明

| 变量 | 说明 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key（服务端写日志用） |
| `DEEPSEEK_API_KEY` | DeepSeek API Key |
| `ADMIN_EMAILS` | 管理员邮箱白名单，逗号分隔 |
| `NEXT_PUBLIC_SITE_URL` | 站点 URL（生产环境改为实际域名） |

## 文档

详见 [`docs/`](docs/) 目录，包含 PRD、数据模型设计、系统架构设计、开发任务清单。
