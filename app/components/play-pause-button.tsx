import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import { PauseIcon, PlayIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

const AnimatedButton = motion(Button)
const AnimatedPlayIcon = motion(PlayIcon)
const AnimatedPauseIcon = motion(PauseIcon)

type PlayPauseButtonProps = React.ComponentProps<typeof AnimatedButton> & {
  isPlaying: boolean
}

export function PlayPauseButton({
  isPlaying,
  className,
  ...props
}: PlayPauseButtonProps) {
  return (
    <AnimatedButton
      type="button"
      size="icon"
      initial="play"
      animate={isPlaying ? "pause" : "play"}
      aria-label={isPlaying ? "Pause" : "Play"}
      className={cn("relative rounded-full", className)}
      {...props}
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
  )
}
