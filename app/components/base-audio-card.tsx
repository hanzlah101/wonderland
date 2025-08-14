import { useEffect, useRef } from "react"
import { motion } from "motion/react"
import { ChangeTitle } from "@/components/change-title"
import { DeleteAudio } from "@/components/delete-audio"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useBaseAudioStore } from "@/stores/use-base-audio-store"
import { PauseIcon, PlayIcon } from "lucide-react"
import { type BaseAudioFile } from "@/queries/use-base-audio-files-query"

const AnimatedButton = motion(Button)
const AnimatedPlayIcon = motion(PlayIcon)
const AnimatedPauseIcon = motion(PauseIcon)

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
            <AnimatedButton
              type="button"
              size="icon"
              initial="play"
              animate={isActive ? "pause" : "play"}
              aria-label={isActive ? "Pause" : "Play"}
              className={cn(
                "pointer-events-auto relative rounded-full shadow-md transition-opacity",
                isActive
                  ? "opacity-0 group-hover/video:opacity-100"
                  : "opacity-100"
              )}
            >
              <AnimatedPlayIcon
                className="absolute top-1/2 -translate-y-1/2 fill-current"
                transition={{ duration: 0.2, ease: "easeInOut" }}
                variants={{
                  play: { opacity: 1, scale: 1 },
                  pause: { opacity: 0, scale: 0.8 }
                }}
              />

              <AnimatedPauseIcon
                className="absolute top-1/2 -translate-y-1/2 fill-current"
                transition={{ duration: 0.2, ease: "easeInOut" }}
                variants={{
                  play: { opacity: 0, scale: 0.8 },
                  pause: { opacity: 1, scale: 1 }
                }}
              />
            </AnimatedButton>
          </div>
        </div>

        <div className="group/actions flex max-w-full items-center justify-between gap-3 p-3">
          <ChangeTitle id={file.id} title={file.title} />
          <DeleteAudio {...file} />
        </div>
      </CardContent>
    </Card>
  )
}
