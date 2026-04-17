import type { LLMProvider } from "./types"
import { DeepSeekProvider } from "./providers/deepseek"

export function getProvider(model: string): LLMProvider {
  if (model.startsWith("deepseek-")) {
    return new DeepSeekProvider()
  }
  // Future:
  // if (model.startsWith("gpt-")) return new OpenAIProvider()
  // if (model.startsWith("glm-")) return new ZhipuProvider()
  throw new Error(`Unsupported model: ${model}`)
}

export type { LLMProvider, ChatParams, ChatResponse, ChatChunk, Message, Role } from "./types"
export { LLMError } from "./types"
