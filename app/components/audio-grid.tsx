import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PauseIcon, PlayIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useAudioFilesQuery } from "@/queries/use-audio-files"
import { DeleteAudio } from "@/components/delete-audio"
import { ChangeTitle } from "@/components/change-title"

export function AudioCard({
  id,
  title,
  clipUrl,
  audioUrl,
  isActive,
  onRequestPlay,
  onRequestPause
}: {
  id: string
  title: string
  clipUrl: string
  audioUrl: string
  isActive: boolean
  onRequestPlay: (id: string) => void
  onRequestPause: (id: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [poster, setPoster] = useState<string>()

  const toggle = () => {
    if (isActive) onRequestPause(id)
    else onRequestPlay(id)
  }

  const onAudioEnded = () => {
    const v = videoRef.current
    if (v) v.pause()
    onRequestPause(id)
  }

  // Sync media with parent state so only one plays at a time
  useEffect(() => {
    const v = videoRef.current
    const a = audioRef.current
    if (!v) return
    if (!a) return

    if (isActive) {
      v.muted = true
      v.loop = true
      ;(async () => {
        try {
          await Promise.allSettled([v.play(), a.play()])
        } catch {
          // ignore autoplay errors
        }
      })()
    } else {
      v.pause()
      a.pause()
    }
  }, [isActive])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      // Jump to the middle of the video
      video.currentTime = video.duration / 2
    }

    const handleSeeked = () => {
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        setPoster(canvas.toDataURL("image/jpeg"))
      }
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("seeked", handleSeeked)

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("seeked", handleSeeked)
    }
  }, [])

  return (
    <Card className="group relative overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="relative">
          <video
            ref={videoRef}
            src={clipUrl}
            playsInline
            muted
            loop
            poster={poster}
            preload="metadata"
            className="aspect-video w-full bg-accent object-cover"
          >
            <track kind="captions" />
          </video>

          <audio ref={audioRef} src={audioUrl} onEnded={onAudioEnded}>
            <track kind="captions" />
          </audio>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Button
              type="button"
              size="icon"
              onClick={toggle}
              className={cn(
                "pointer-events-auto rounded-full shadow-md transition-opacity",
                isActive ? "opacity-0 group-hover:opacity-100" : "opacity-100"
              )}
              aria-label={isActive ? "Pause" : "Play"}
            >
              {isActive ? (
                <PauseIcon className="size-5" />
              ) : (
                <PlayIcon className="size-5" />
              )}
            </Button>
          </div>

          <div className="absolute right-2 bottom-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <DeleteAudio
              id={id}
              title={title}
              audioUrl={audioUrl}
              clipUrl={clipUrl}
            />
          </div>
        </div>

        <div className="p-3">
          <ChangeTitle id={id} title={title} />
        </div>
      </CardContent>
    </Card>
  )
}

export function AudioGrid() {
  const { files, isLoading } = useAudioFilesQuery()
  const [playingId, setPlayingId] = useState<string | null>(null)

  const handlePlay = (id: string) => setPlayingId(id)
  const handlePause = () => setPlayingId(null)

  // If the currently playing item is deleted, reset playingId
  useEffect(() => {
    if (playingId && !files.some((f) => f.id === playingId)) {
      setPlayingId(null)
    }
  }, [files, playingId])

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        : files.map((f) => (
            <AudioCard
              key={f.id}
              id={f.id}
              title={f.title}
              clipUrl={f.clipUrl}
              audioUrl={f.audioUrl}
              isActive={playingId === f.id}
              onRequestPlay={handlePlay}
              onRequestPause={handlePause}
            />
          ))}
    </div>
  )
}
