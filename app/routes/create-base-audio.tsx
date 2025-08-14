import { BaseAudioUpload } from "@/components/base-audio-upload"
import type { Route } from "./+types/create-base-audio"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Create Base Audio - Wonderland Admin" },
    { name: "description", content: "Create and manage your base audio files" }
  ]
}

export default function CreateBaseAudio() {
  return <BaseAudioUpload />
}
