import { Button } from "@/components/ui/button"
import { signOut } from "firebase/auth"
import type { Route } from "./+types/home"
import { auth } from "@/lib/firebase"
import { useQueryClient } from "@tanstack/react-query"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Wonderland Admin" },
    { name: "description", content: "Manage your Wonderland Playlists" }
  ]
}

export default function Home() {
  const queryClient = useQueryClient()

  return (
    <div>
      <Button
        onClick={async () => {
          await signOut(auth)
          queryClient.setQueryData(["session"], null)
        }}
      >
        Sign Out
      </Button>
    </div>
  )
}
