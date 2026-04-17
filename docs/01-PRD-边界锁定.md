# PRD 边界锁定文档

> 本文档记录 MVP 阶段所有关键边界决策的最终结果,是 PRD.md 的决策补充。
> 开发过程中如需调整,请在此文档更新并标注日期。

## 版本

- v1.0 — 初版锁定
- 最后更新:2026-04-16

---

## 锁定决策总表

| 维度 | 最终决策 | 实现要点 |
|---|---|---|
| 租户模型 | 单用户,按 `user_id` 隔离 | 用 Supabase RLS 实现行级隔离 |
| 智能体复杂度 | Prompt + 模型 + 参数 | 不做工作流编排、不做工具调用、不做多 Agent 协作 |
| 知识库 | MVP 不做,V2 实现 | 数据模型预留,前端导航占位"即将上线" |
| 模型接入 | DeepSeek | 适配层按 OpenAI 兼容协议设计,为多模型预留 |
| 鉴权 | Supabase Auth | 邮箱密码登录,开启注册 Trigger |
| 管理员识别 | 白名单邮箱 | 环境变量 `ADMIN_EMAILS`,注册时判定 |
| 流式输出 | MVP 必做 | Server-Sent Events,前端打字机效果 |
| 日志快照 | 保留完整 prompt + response | `run_logs` 表加 `prompt_snapshot jsonb` + `response_snapshot text` |
| 文档-Agent 关系 | 多对多 | V2 阶段实现,用中间表 `agent_knowledge_bindings` |

---

## 详细说明

### 1. 租户模型:单用户

**决策**:第一版是单用户系统,不做团队/组织概念。

**实现**:
- 每张业务表都带 `user_id` 字段
- 用 Supabase Row Level Security(RLS)策略自动过滤,确保用户只能读写自己的数据
- 管理员通过 `profiles.role = 'admin'` 识别,RLS 策略里对 admin 放开限制

**依据**:PRD §3、§4、§9

---

### 2. 智能体复杂度:最简版本

**决策**:智能体 = 名称 + 描述 + 系统 Prompt + 模型 + 温度 + 状态。

**不做**:
- 工作流编排(Dify 的 workflow 节点画布)
- 工具调用(function calling / 插件)
- 多 Agent 协作

**依据**:PRD §3、§5.1 配置页定义

---

### 3. 知识库:MVP 不做,V2 实现

**决策**:MVP 阶段不实现知识库功能,但必须做以下预留工作:

1. **数据模型预留**(在架构设计文档中明确定义,MVP 阶段不建表):
 - `knowledge_bases` 表
 - `documents` 表
 - `agent_knowledge_bindings` 中间表(agent 和 document 多对多)

2. **前端预留**:
 - 侧边栏保留"知识库"导航项
 - 标注"即将上线"
 - `/knowledge` 路由做成空页面,显示占位提示

3. **agents 表字段预留**:MVP 阶段不加 `knowledge_base_ids` 字段,后续通过中间表关联,不动原表结构。

**V2 实现时的工作量预期**:约占整个项目 30-40% 的工作量,包括向量化、文件处理流水线、RAG 检索、上传 UI 等。

**依据**:PRD §3、§12;用户明确表示"后续会做知识库项目接入"

---

### 4. 模型接入:DeepSeek + OpenAI 兼容协议适配层

**决策**:
- MVP 阶段只接 DeepSeek
- 适配层按 OpenAI 兼容协议设计
- 不在业务代码里写死供应商

**适配层架构**(伪代码):

```typescript
// 统一接口
interface LLMProvider {
  chat(params: {
    model: string
    messages: Message[]
    temperature: number
    stream: boolean
  }): Promise<ChatResponse> | AsyncIterable<ChatChunk>
}

// 具体实现
class DeepSeekProvider implements LLMProvider {
  async chat(params) { /* 调 DeepSeek API */ }
}

// 工厂路由
function getProvider(model: string): LLMProvider {
  if (model.startsWith('deepseek-')) return new DeepSeekProvider()
  // 未来加其他供应商只在这里加
}

// 业务代码只依赖接口
const provider = getProvider(agent.model)
const result = await provider.chat({ ... })
```

**未来扩展**:添加 OpenAI / 智谱 / Moonshot 等,只需新增 Provider 类,业务代码不动。

**DeepSeek 选型理由**:
- OpenAI 兼容协议,接口熟悉
- 国内访问稳定,免 VPN
- 价格便宜,注册送额度
- 适合学习项目

**依据**:PRD §1.0、§6、§12;用户偏好

---

### 5. 鉴权:Supabase Auth

**决策**:
- 使用 Supabase 内置 Auth
- 第一版只做邮箱密码登录
- 不做第三方登录(PRD 原文提到但非 MVP)

**实现**:
- 用户注册后通过 Database Trigger 自动在 `profiles` 表创建记录
- Next.js Middleware 拦截未登录访问

**依据**:PRD §1.0、§11

---

### 6. 管理员识别:白名单邮箱

**决策**:通过环境变量 `ADMIN_EMAILS` 配置管理员邮箱白名单。

**实现路径**:
1. 环境变量:`ADMIN_EMAILS=admin1@example.com,admin2@example.com`
2. 用户注册时(Trigger 或 API)检查邮箱是否在白名单
3. 在白名单 → `profiles.role = 'admin'`
4. 不在白名单 → `profiles.role = 'user'`
5. Middleware 对 `admin.*` 路径做 `role === 'admin'` 校验

**优势**:简单、安全、不用改数据库、适合小团队

**局限**:管理员固定时适用,需要大规模管理员时再改方案

---

### 7. 流式输出:MVP 必做

**决策**:对话页必须支持流式输出(打字机效果)。

**技术方案**:
- 后端:Next.js API Route 用 `ReadableStream` 返回 `text/event-stream`
- 前端:`fetch` 的 `ReadableStream` 读取,或用 Vercel 的 `ai` SDK
- 适配层:`chat()` 方法支持 `stream: true`,返回 AsyncIterable

**推荐**:使用 Vercel AI SDK,能大幅减少代码量。

---

### 8. 日志快照:保留完整 Prompt 和 Response

**决策**:`run_logs` 表保留完整的 prompt 和 response 快照,用于后续调试和溯源。

**表结构调整**:在 PRD 原始 `run_logs` 基础上增加:

```sql
prompt_snapshot jsonb,     -- 完整的 messages 数组快照
response_snapshot text,    -- 完整的模型回复文本
```

**用 jsonb 存 messages 的理由**:
- 方便后续按内容查询和筛选
- 支持部分字段索引
- Postgres 原生支持

**成本和隐私问题**:MVP 阶段不处理,后续再评估(可能的方案:超过 N 天的快照归档/脱敏/删除)。

---

### 9. 文档-Agent 关系:多对多

**决策**:一个 agent 可以关联多个文档,一个文档可以被多个 agent 共用。

**实现**(V2 阶段):
- 不在 `documents` 表里放 `agent_id`(PRD 原设计有这个字段,需调整)
- 新增中间表 `agent_knowledge_bindings`(或 `agent_document_bindings`)
- MVP 阶段先软上限每个 agent 最多关联 20 个文档

**理由**:
- 符合真实使用场景(文档复用)
- 节省存储和向量化成本
- 数据结构更规范

**MVP 阶段的动作**:在数据模型文档里定义好这个结构,但不建表。

---

## 后续调整记录

| 日期 | 调整内容 | 原因 |
|---|---|---|
| - | - | - |
