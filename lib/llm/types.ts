export type Role = "system" | "user" | "assistant"

export interface Message {
  role: Role
  content: string
}

export interface ChatParams {
  model: string
  messages: Message[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ChatResponse {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: "stop" | "length" | "error"
}

export interface ChatChunk {
  delta: string
  done: boolean
  usage?: ChatResponse["usage"]
}

export interface LLMProvider {
  chat(params: ChatParams & { stream: false }): Promise<ChatResponse>
  chat(params: ChatParams & { stream: true }): AsyncGenerator<ChatChunk>
  chat(params: ChatParams): Promise<ChatResponse> | AsyncGenerator<ChatChunk>
}

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = "LLMError"
  }
}
