import { LayerAudioUpload } from "@/components/layer-audio-upload"
import type { Route } from "./+types/create-layer-audio"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Create Layer Audio - Wonderland Admin" },
    {
      name: "description",
      content: "Create and manage your layer audio files"
    }
  ]
}

export default function CreateLayerAudio() {
  return <LayerAudioUpload />
}
