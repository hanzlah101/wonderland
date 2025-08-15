import { LayoutAudioUpload } from "@/components/layout-audio-upload"
import type { Route } from "./+types/create-layout-audio"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Create Layout Audio - Wonderland Admin" },
    {
      name: "description",
      content: "Create and manage your layout audio files"
    }
  ]
}

export default function CreateLayoutAudio() {
  return <LayoutAudioUpload />
}
