import type { Route } from "./+types/login"
import { Navigate } from "react-router"
import { LoginForm } from "@/components/auth/login-form"
import { Spinner } from "@/components/ui/spinner"
import { useSessionQuery } from "@/queries/use-session-query"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Login - Wonderland Admin" },
    { name: "description", content: "Login to your Wonderland account" }
  ]
}

export default function Login() {
  const { user, isLoading } = useSessionQuery()

  if (isLoading) {
    return (
      <main className="flex h-svh w-full items-center justify-center">
        <Spinner size="md" />
      </main>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-svh items-center px-4 py-8">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to Wonderland Admin</CardTitle>
          <CardDescription>
            Please enter your credentials to access the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
