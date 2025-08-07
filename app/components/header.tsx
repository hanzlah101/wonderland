import { Logo } from "@/components/logo"
import { ModeToggle } from "@/components/mode-toggle"
import { UserMenu } from "@/components/user-menu"

export function Header() {
  return (
    <header className="container sticky inset-x-0 top-0 z-50 mx-auto flex w-full items-center justify-between border-b bg-background/60 py-5 backdrop-blur-sm">
      <Logo />
      <div className="flex items-center gap-3">
        <ModeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
