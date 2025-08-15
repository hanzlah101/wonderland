import { useEffect } from "react"
import { BaseAudioCard } from "@/components/base-audio-card"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useBaseAudioFilesQuery } from "@/queries/use-base-audio-files-query"
import { useBaseAudioStore } from "@/stores/use-base-audio-store"
import type { Route } from "./+types/base-audio"
import { Button } from "@/components/ui/button"
import { Link } from "react-router"
import {
  AlertCircleIcon,
  ListMusicIcon,
  PlusIcon,
  RefreshCcwIcon
} from "lucide-react"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Wonderland Admin" },
    { name: "description", content: "Manage your Wonderland Base Audio" }
  ]
}

export default function BaseAudio() {
  const { files, isLoading, error, refetch } = useBaseAudioFilesQuery()
  const { playingId, pause, cleanup } = useBaseAudioStore()

  // If the currently playing item is deleted, reset playingId
  useEffect(() => {
    if (playingId && !files.some((f) => f.id === playingId)) {
      pause()
    }
  }, [files, playingId, pause])

  // Cleanup when component unmounts
  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="overflow-hidden py-0">
              <CardContent className="p-0">
                <Skeleton className="aspect-video w-full rounded-none" />
                <div className="p-3">
                  <div className="flex h-8 shrink-0 items-center">
                    <Skeleton className="h-6 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-2 size-10 shrink-0 rounded-full bg-destructive/15 p-2">
          <AlertCircleIcon className="size-6 text-destructive" />
        </div>
        <div className="mb-4 flex flex-col items-center justify-center space-y-0.5 text-center">
          <h2 className="font-serif text-2xl font-semibold">
            Failed to load base audio files
          </h2>
          <p className="text-sm text-muted-foreground">
            There was an error loading your files. Please try again.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="h-9">
          <RefreshCcwIcon />
          Try Again
        </Button>
      </div>
    )
  }

  // Empty state
  if (files.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-2 size-10 shrink-0 rounded-full bg-muted p-2">
          <ListMusicIcon className="size-6" />
        </div>
        <div className="mb-4 flex flex-col items-center justify-center space-y-0.5 text-center">
          <h2 className="font-serif text-2xl font-semibold">
            No base audio files
          </h2>
          <p className="text-sm text-muted-foreground">
            Get started by creating your first base audio file
          </p>
        </div>
        <Button asChild className="h-9">
          <Link to="/create-base-audio">
            <PlusIcon />
            Create Base Audio
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {files.map((file) => (
          <BaseAudioCard key={file.id} {...file} />
        ))}
      </div>
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-serif text-3xl font-semibold">Base Audio</h2>
      <Button size="sm" asChild>
        <Link to="/create-base-audio">
          <PlusIcon />
          New Base Audio
        </Link>
      </Button>
    </div>
  )
}
