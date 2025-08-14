import { Navigate, Outlet } from "react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { useSessionQuery } from "@/queries/use-session-query"

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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="container mx-auto min-h-svh px-6">
        <Header />
        <main className="flex-1 py-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
