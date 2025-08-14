import { ModeToggle } from "@/components/mode-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserMenu } from "@/components/user-menu"

export function Header() {
  return (
    <header className="sticky inset-x-0 top-0 z-50 container mx-auto flex w-full items-center justify-between border-b bg-background/60 py-6 backdrop-blur-sm">
      <SidebarTrigger />
      <div className="flex items-center gap-3">
        <ModeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
