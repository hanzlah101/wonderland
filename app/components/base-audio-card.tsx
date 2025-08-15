import { useEffect, useRef } from "react"
import { ChangeBaseAudioTitle } from "@/components/change-base-audio-title"
import { DeleteBaseAudio } from "@/components/delete-base-audio"
import { Card, CardContent } from "@/components/ui/card"
import { useBaseAudioStore } from "@/stores/use-base-audio-store"
import { PlayPauseButton } from "./play-pause-button"
import { type BaseAudioFile } from "@/queries/use-base-audio-files-query"
import { cn } from "@/lib/utils"

export function BaseAudioCard(file: BaseAudioFile) {
  const { playingId, toggle, pause } = useBaseAudioStore()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isActive = playingId === file.id

  const onAudioEnded = () => {
    const v = videoRef.current
    if (v) v.pause()
    pause()
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
  }, [isActive, pause])

  return (
    <Card className="group/video relative overflow-hidden py-0">
      <CardContent className="p-0">
        <div
          onClick={() => toggle(file.id)}
          className="relative cursor-pointer"
        >
          <video
            ref={videoRef}
            src={file.clipUrl}
            playsInline
            muted
            loop
            poster={file.posterUrl}
            preload="auto"
            className="aspect-video w-full bg-accent object-cover"
          >
            <track kind="captions" />
          </video>

          <audio
            ref={audioRef}
            src={file.audioUrl}
            onEnded={onAudioEnded}
            preload="auto"
          >
            <track kind="captions" />
          </audio>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <PlayPauseButton
              isPlaying={isActive}
              className={cn(
                isActive
                  ? "opacity-0 group-hover/video:opacity-100"
                  : "opacity-100"
              )}
            />
          </div>
        </div>

        <div className="group/actions flex max-w-full items-center justify-between gap-3 p-3">
          <ChangeBaseAudioTitle id={file.id} title={file.title} />
          <DeleteBaseAudio {...file} />
        </div>
      </CardContent>
    </Card>
  )
}
