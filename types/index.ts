// ========== 用户 ==========
export interface Profile {
  id: string
  email: string
  role: "user" | "admin"
  created_at: string
  updated_at: string
}

// ========== 智能体 ==========
export type AgentStatus = "draft" | "published" | "disabled"

export interface Agent {
  id: string
  user_id: string
  name: string
  description: string | null
  system_prompt: string
  model: string
  temperature: number
  status: AgentStatus
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ========== 对话 ==========
export interface ChatSession {
  id: string
  user_id: string
  agent_id: string
  title: string
  created_at: string
  updated_at: string
}

export type MessageRole = "user" | "assistant" | "system"

export interface ChatMessage {
  id: string
  session_id: string
  role: MessageRole
  content: string
  token_usage: number
  created_at: string
}

// ========== 调用日志 ==========
export type RunLogStatus = "success" | "error" | "timeout" | "partial"

export interface RunLog {
  id: string
  user_id: string
  agent_id: string
  session_id: string | null
  message_id: string | null
  model: string
  prompt_snapshot: Record<string, unknown>[]
  response_snapshot: string | null
  latency_ms: number
  prompt_tokens: number
  completion_tokens: number
  status: RunLogStatus
  error_message: string | null
  created_at: string
}
