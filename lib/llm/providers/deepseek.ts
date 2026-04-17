import type {
  ChatChunk,
  ChatParams,
  ChatResponse,
  LLMProvider,
} from "../types"
import { LLMError } from "../types"

const BASE_URL = "https://api.deepseek.com/v1"
const TIMEOUT_MS = 60_000

export class DeepSeekProvider implements LLMProvider {
  private readonly apiKey: string

  constructor() {
    const key = process.env.DEEPSEEK_API_KEY
    if (!key) throw new LLMError("DEEPSEEK_API_KEY is not set", "CONFIG_ERROR")
    this.apiKey = key
  }

  chat(params: ChatParams & { stream: false }): Promise<ChatResponse>
  chat(params: ChatParams & { stream: true }): AsyncGenerator<ChatChunk>
  chat(params: ChatParams): Promise<ChatResponse> | AsyncGenerator<ChatChunk> {
    if (params.stream) {
      return this.streamChat(params)
    }
    return this.nonStreamChat(params)
  }

  private async nonStreamChat(
    params: ChatParams,
  ): Promise<ChatResponse> {
    const response = await this.fetchAPI(params, false)
    const data = await response.json()
    return {
      content: data.choices[0]?.message?.content ?? "",
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      finishReason: data.choices[0]?.finish_reason === "length" ? "length" : "stop",
    }
  }

  private async *streamChat(
    params: ChatParams,
  ): AsyncGenerator<ChatChunk> {
    const response = await this.fetchAPI(params, true)

    if (!response.body) {
      throw new LLMError("No response body", "STREAM_ERROR")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === ":") continue
          if (!trimmed.startsWith("data: ")) continue

          const data = trimmed.slice(6)
          if (data === "[DONE]") {
            yield { delta: "", done: true }
            return
          }

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content ?? ""
            const finishReason = parsed.choices?.[0]?.finish_reason

            if (finishReason) {
              const usage = parsed.usage
              yield {
                delta,
                done: true,
                usage: usage
                  ? {
                      promptTokens: usage.prompt_tokens ?? 0,
                      completionTokens: usage.completion_tokens ?? 0,
                      totalTokens: usage.total_tokens ?? 0,
                    }
                  : undefined,
              }
              return
            }

            if (delta) {
              yield { delta, done: false }
            }
          } catch {
            // skip malformed SSE line
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  private async fetchAPI(
    params: ChatParams,
    stream: boolean,
  ): Promise<Response> {
    let response: Response
    try {
      response = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: params.model,
          messages: params.messages,
          temperature: params.temperature ?? 0.7,
          ...(params.maxTokens ? { max_tokens: params.maxTokens } : {}),
          stream,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch (err) {
      if (err instanceof Error && err.name === "TimeoutError") {
        throw new LLMError("DeepSeek API timeout", "TIMEOUT", 408)
      }
      throw new LLMError(
        `Network error: ${err instanceof Error ? err.message : String(err)}`,
        "NETWORK_ERROR",
      )
    }

    if (!response.ok) {
      let errorMessage = `DeepSeek API error: ${response.status}`
      try {
        const errBody = await response.json()
        errorMessage = errBody?.error?.message ?? errorMessage
      } catch {
        // ignore JSON parse failure on error body
      }
      throw new LLMError(errorMessage, "API_ERROR", response.status)
    }

    return response
  }
}
