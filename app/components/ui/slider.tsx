import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value: number
  max: number
  disabled?: boolean
  onChange: (value: number) => void
  onSeek: (value: number) => void
  className?: string
}

export const Slider = React.memo(function Slider({
  value,
  max,
  disabled,
  onChange,
  onSeek,
  className
}: SliderProps) {
  const sliderRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragValue, setDragValue] = React.useState(value)

  const percentage =
    max > 0
      ? Math.max(
          0,
          Math.min(((isDragging ? dragValue : value) / max) * 100, 100)
        )
      : 0

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (disabled || !sliderRef.current) return

      e.preventDefault()
      setIsDragging(true)

      const rect = sliderRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const newValue = Math.max(0, Math.min((clickX / rect.width) * max, max))

      setDragValue(newValue)
      onChange(newValue)
    },
    [disabled, max, onChange]
  )

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current || disabled) return

      const rect = sliderRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const newValue = Math.max(0, Math.min((clickX / rect.width) * max, max))

      setDragValue(newValue)
      onChange(newValue)
    },
    [isDragging, disabled, max, onChange]
  )

  const handleMouseUp = React.useCallback(() => {
    if (!isDragging) return

    setIsDragging(false)
    onSeek(dragValue)
  }, [isDragging, dragValue, onSeek])

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={sliderRef}
      className={cn(
        "relative h-1.5 w-full cursor-pointer rounded-full bg-muted",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onMouseDown={handleMouseDown}
    >
      {/* Progress bar */}
      <div
        className="absolute top-0 left-0 h-full rounded-l-full bg-primary transition-all duration-75"
        style={{ width: `${percentage}%` }}
      />

      {/* Thumb */}
      <div
        className={cn(
          "absolute top-1/2 h-4.5 w-2 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow-sm transition-all duration-75",
          isDragging && "scale-110",
          disabled && "border-muted-foreground"
        )}
        style={{ left: `${percentage}%` }}
      />
    </div>
  )
})
