export default async function AgentConfigPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div>
      <h1 className="text-2xl font-bold">智能体配置</h1>
      <p className="mt-2 text-muted-foreground">Agent ID: {id} — 模块 2 实现</p>
    </div>
  )
}
