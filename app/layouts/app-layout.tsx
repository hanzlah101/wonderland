import { Header } from "@/components/header"
import { Navigate, Outlet } from "react-router"
import { useSessionQuery } from "@/queries/use-session-query"
import { Spinner } from "@/components/ui/spinner"

export default function AppLayout() {
  const { user, isLoading } = useSessionQuery()

  if (isLoading) {
    return (
      <main className="flex h-svh w-full items-center justify-center">
        <Spinner size="md" />
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <main className="px-4">
      <Header />
      <main className="container mx-auto py-12">
        <Outlet />
      </main>
    </main>
  )
}
