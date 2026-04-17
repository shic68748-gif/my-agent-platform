import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">智能体平台</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground">
          登录/注册功能将在模块 1 实现
        </p>
      </CardContent>
    </Card>
  )
}
