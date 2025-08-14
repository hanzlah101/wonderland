import { useEffect } from "react"
import { BaseAudioCard } from "@/components/base-audio-card"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useBaseAudioFilesQuery } from "@/queries/use-base-audio-files-query"
import { useBaseAudioStore } from "@/stores/use-base-audio-store"
import type { Route } from "./+types/base-audio"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Wonderland Admin" },
    { name: "description", content: "Manage your Wonderland Base Audio" }
  ]
}

export default function BaseAudio() {
  const { files, isLoading } = useBaseAudioFilesQuery()
  const { playingId, pause } = useBaseAudioStore()

  // If the currently playing item is deleted, reset playingId
  useEffect(() => {
    if (playingId && !files.some((f) => f.id === playingId)) {
      pause()
    }
  }, [files, playingId, pause])

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {isLoading
        ? Array.from({ length: 20 }).map((_, i) => (
            <Card key={i} className="overflow-hidden py-0">
              <CardContent className="p-0">
                <Skeleton className="aspect-video w-full rounded-none" />
                <div className="p-3">
                  <Skeleton className="h-6 w-32 rounded-sm" />
                </div>
              </CardContent>
            </Card>
          ))
        : files.map((file) => <BaseAudioCard key={file.id} {...file} />)}
    </div>
  )
}
