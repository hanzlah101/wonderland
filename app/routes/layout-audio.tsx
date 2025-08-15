import { useEffect } from "react"
import { LayoutAudioCard } from "@/components/layout-audio-card"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLayoutAudioFilesQuery } from "@/queries/use-layout-audio-files-query"
import { useLayoutAudioStore } from "@/stores/use-layout-audio-store"
import type { Route } from "./+types/layout-audio"
import { Button } from "@/components/ui/button"
import { Link } from "react-router"
import {
  AlertCircleIcon,
  Volume2Icon,
  PlusIcon,
  RefreshCcwIcon
} from "lucide-react"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Layout Audio - Wonderland Admin" },
    { name: "description", content: "Manage your Wonderland Layout Audio" }
  ]
}

export default function LayoutAudio() {
  const { files, isLoading, error, refetch } = useLayoutAudioFilesQuery()
  const { playingId, pause, cleanup } = useLayoutAudioStore()

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="overflow-hidden py-0">
              <CardContent className="p-4">
                <div className="mb-4 flex items-center gap-4">
                  <Skeleton className="aspect-square size-9 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-2.5 w-full rounded" />
                    <Skeleton className="h-4 w-full rounded" />
                  </div>
                </div>
                <div className="flex h-8 items-end">
                  <Skeleton className="h-6 w-full max-w-2/3 rounded" />
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
            Failed to load layout audio files
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
          <Volume2Icon className="size-6" />
        </div>
        <div className="mb-4 flex flex-col items-center justify-center space-y-0.5 text-center">
          <h2 className="font-serif text-2xl font-semibold">
            No layout audio files
          </h2>
          <p className="text-sm text-muted-foreground">
            Get started by creating your first layout audio file
          </p>
        </div>
        <Button asChild className="h-9">
          <Link to="/create-layout-audio">
            <PlusIcon />
            Create Layout Audio
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((file) => (
          <LayoutAudioCard key={file.id} {...file} />
        ))}
      </div>
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-serif text-3xl font-semibold">Layout Audio</h2>
      <Button size="sm" asChild>
        <Link to="/create-layout-audio">
          <PlusIcon />
          New Layout Audio
        </Link>
      </Button>
    </div>
  )
}
