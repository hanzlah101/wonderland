import type { Route } from "./+types/create-playlist"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Create Playlist - Wonderland Admin" },
    { name: "description", content: "Create and manage your playlists" }
  ]
}

export default function CreatePlaylist() {
  return <div />
}
