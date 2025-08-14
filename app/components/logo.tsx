import { Link } from "react-router"
import logo from "@/assets/logo.png"
import { cn } from "@/lib/utils"

type LogoProps = {
  href?: string
  className?: string
}

export function Logo({ href = "/", className }: LogoProps) {
  return (
    <Link to={href} className={cn("flex h-6 w-fit shrink-0", className)}>
      <img
        src={logo}
        loading="eager"
        alt="Wonderland"
        draggable={false}
        className="h-full object-contain invert select-none dark:invert-0"
      />
    </Link>
  )
}
