"use client"

import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"
import type { MessageRole } from "@/types"

interface MessageBubbleProps {
  role: MessageRole
  content: string
  streaming?: boolean
}

export function MessageBubble({ role, content, streaming }: MessageBubbleProps) {
  const isUser = role === "user"

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted rounded-bl-sm",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            <ReactMarkdown>{content}</ReactMarkdown>
            {streaming && (
              <span className="inline-block w-1 h-4 bg-current animate-pulse ml-0.5 align-text-bottom" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
