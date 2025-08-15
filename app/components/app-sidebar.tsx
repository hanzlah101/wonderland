import { Link, useLocation } from "react-router"
import { Logo } from "@/components/logo"
import {
  CircleFadingPlusIcon,
  Disc3Icon,
  MusicIcon,
  PlusIcon
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="px-2 pt-4">
            <Logo />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Base Audio</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              <Item icon={MusicIcon} label="Base Audio" href="/" />
              <Item
                icon={PlusIcon}
                label="Create Base Audio"
                href="/create-base-audio"
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Layer Audio</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              <Item icon={Disc3Icon} label="Layer Audio" href="/layer-audio" />
              <Item
                icon={CircleFadingPlusIcon}
                label="Create Layer Audio"
                href="/create-layer-audio"
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}

function Item({
  icon: Icon,
  label,
  href
}: {
  icon: React.ElementType
  label: string
  href: string
}) {
  const { pathname } = useLocation()

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={pathname === href} tooltip={label}>
        <Link to={href}>
          <Icon />
          {label}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
