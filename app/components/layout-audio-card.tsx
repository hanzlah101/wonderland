import * as React from "react"
import { Howl } from "howler"
import { Card, CardContent } from "@/components/ui/card"
import { useLayoutAudioStore } from "@/stores/use-layout-audio-store"
import { ChangeLayoutAudioTitle } from "@/components/change-layout-audio-title"
import { DeleteLayoutAudio } from "@/components/delete-layout-audio"
import { PlayPauseButton } from "./play-pause-button"
import { Slider } from "@/components/ui/slider"
import { type LayoutAudioFile } from "@/queries/use-layout-audio-files-query"

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function LayoutAudioCard(file: LayoutAudioFile) {
  const { playingId, toggle, pause } = useLayoutAudioStore()
  const howlRef = React.useRef<Howl | null>(null)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragTime, setDragTime] = React.useState(0)
  const isActive = playingId === file.id

  const displayTime = isDragging ? dragTime : currentTime

  // Memoize formatted times to avoid unnecessary recalculations
  const formattedCurrentTime = React.useMemo(() => {
    return formatDuration(displayTime)
  }, [displayTime])

  const formattedDuration = React.useMemo(() => {
    return formatDuration(file.duration)
  }, [file.duration])

  // Create Howl instance
  React.useEffect(() => {
    const howl = new Howl({
      src: [file.audioUrl],
      html5: true,
      preload: "metadata",
      onload: () => {
        setIsLoading(false)
      },
      onloaderror: () => {
        setIsLoading(false)
        console.log("Fauled to load audio")
      },
      onplay: () => {
        setIsLoading(false)
      },
      onend: () => {
        pause()
        setCurrentTime(0)
      }
    })

    howlRef.current = howl
    setIsLoading(true)

    return () => {
      howl.unload()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [file.audioUrl, pause])

  // Update current time with better performance
  React.useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (!isActive || isDragging) return

    const updateTime = () => {
      const howl = howlRef.current
      if (howl && howl.playing()) {
        const seekTime = howl.seek()
        if (typeof seekTime === "number" && !isNaN(seekTime)) {
          setCurrentTime(seekTime)
        }
      }
    }

    // Update immediately
    updateTime()

    // Then set interval
    intervalRef.current = setInterval(updateTime, 100)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive, isDragging])

  // Sync audio with parent state
  React.useEffect(() => {
    const howl = howlRef.current
    if (!howl) return

    if (isActive) {
      if (!howl.playing()) {
        howl.play()
      }
    } else {
      if (howl.playing()) {
        howl.pause()
      }
    }
  }, [isActive])

  const handleSliderChange = React.useCallback((value: number) => {
    setDragTime(value)
    setIsDragging(true)
  }, [])

  const handleSliderSeek = React.useCallback(
    (value: number) => {
      const howl = howlRef.current
      if (howl && file.duration > 0) {
        howl.seek(value)
        setCurrentTime(value)
      }
      setIsDragging(false)
    },
    [file.duration]
  )

  return (
    <Card className="group overflow-hidden py-0">
      <CardContent className="p-4">
        {/* Player controls */}
        <div className="flex items-center gap-4">
          <PlayPauseButton
            isPlaying={isActive}
            loading={isLoading}
            onClick={() => toggle(file.id)}
            className="mb-4 rounded-md"
          />

          <div className="min-w-0 flex-1 space-y-2">
            {/* Progress slider */}
            <Slider
              value={displayTime}
              max={file.duration}
              onChange={handleSliderChange}
              onSeek={handleSliderSeek}
              disabled={!file.duration || file.duration <= 0}
              className="w-full"
            />

            {/* Time display */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono">{formattedCurrentTime}</span>
              <span className="font-mono">{formattedDuration}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <ChangeLayoutAudioTitle id={file.id} title={file.title} />
          <DeleteLayoutAudio {...file} />
        </div>
      </CardContent>
    </Card>
  )
}
