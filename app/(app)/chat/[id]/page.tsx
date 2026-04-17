export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div>
      <h1 className="text-2xl font-bold">会话详情</h1>
      <p className="mt-2 text-muted-foreground">Session ID: {id} — 模块 3 实现</p>
    </div>
  )
}
