import { useState } from "react"
import { useSessionQuery } from "@/queries/use-session-query"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  KeyIcon,
  LogOutIcon,
  MonitorSmartphoneIcon,
  MoonIcon,
  MusicIcon,
  SunIcon
} from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router"
import { useTheme } from "next-themes"
import { ChangePasswordModal } from "./change-password-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

const THEME_ICONS = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorSmartphoneIcon
}

export function UserMenu() {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)

  const queryClient = useQueryClient()
  const { user } = useSessionQuery()
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    signOut(auth).then(() => {
      queryClient.setQueryData(["session"], null)
    })
  }

  const ThemeIcon = THEME_ICONS[(theme ?? "light") as keyof typeof THEME_ICONS]

  return (
    <>
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        setIsOpen={setIsChangePasswordOpen}
      />
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full">
          <Avatar>
            <AvatarImage
              src={user.photoURL ?? undefined}
              className="object-cover"
            />
            <AvatarFallback>
              {user.displayName?.charAt(0) ?? "A"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          alignOffset={-8}
          className="!max-h-auto"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="pb-0">
              {user.displayName ?? "Admin"}
            </DropdownMenuLabel>
            <p className="px-2 pb-1.5 text-[13px] text-muted-foreground">
              {user.email ?? "No email provided"}
            </p>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to="/create-playlist">
                <MusicIcon />
                Create Playlist
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2 [&_svg]:size-4 [&_svg]:text-muted-foreground">
                <ThemeIcon />
                Appearance
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className=" [&_svg]:text-muted-foreground">
                  {(["light", "dark", "system"] as const).map((th) => {
                    const Icon = THEME_ICONS[th]
                    return (
                      <DropdownMenuCheckboxItem
                        key={th}
                        className="capitalize"
                        checked={theme === th}
                        onSelect={() => setTheme(th)}
                      >
                        <Icon />
                        {th}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuItem onSelect={() => setIsChangePasswordOpen(true)}>
              <KeyIcon />
              Change Password
            </DropdownMenuItem>

            <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
              <LogOutIcon />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
