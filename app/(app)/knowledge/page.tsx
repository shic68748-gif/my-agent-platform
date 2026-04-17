import { BookOpen } from "lucide-react"

export default function KnowledgePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <BookOpen className="h-16 w-16 text-muted-foreground/50" />
      <h1 className="mt-6 text-2xl font-bold">知识库功能即将上线</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        很快你就能上传文档,让智能体基于你的专属知识回答问题。
      </p>
    </div>
  )
}
