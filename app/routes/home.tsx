import type { Route } from "./+types/home"
import { Button } from "@/components/ui/button"
import { Link } from "react-router"
import { PlusIcon } from "lucide-react"
import { AudioGrid } from "@/components/audio-grid"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Wonderland Admin" },
    { name: "description", content: "Manage your Wonderland Playlists" }
  ]
}

export default function Home() {
  return (
    <>
      <AudioGrid />
      <Button
        asChild
        size="icon"
        className="fixed right-7 bottom-7 z-40 aspect-square size-13 rounded-full duration-300 hover:scale-110 active:scale-90"
      >
        <Link to="/create-playlist">
          <PlusIcon className="size-7" />
        </Link>
      </Button>
    </>
  )
}
