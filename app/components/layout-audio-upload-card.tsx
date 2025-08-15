import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CheckCircleIcon, XCircleIcon, Volume2Icon } from "lucide-react"
import { motion } from "motion/react"

type AudioUpload = {
  id: string
  title: string
  file: File
  progress: number
  status: "pending" | "uploading" | "completed" | "failed"
  error?: string | null
}

export function LayoutAudioUploadCard(upload: AudioUpload) {
  const { title, progress, status, error, file } = upload

  const isCompleted = status === "completed"
  const isFailed = status === "failed"
  const isUploading = status === "uploading"
  const isPending = status === "pending"

  // Circular progress calculation - radius = 10 (matches the SVG circle)
  const circumference = 2 * Math.PI * 10
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Audio icon with status indicator */}
          <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Volume2Icon className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Status indicator overlay */}
            <div className="absolute -right-1 -bottom-1">
              {isCompleted && (
                <motion.div
                  className="rounded-full bg-emerald-500 p-1 text-white dark:bg-emerald-400"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    duration: 0.4,
                    type: "spring",
                    bounce: 0.4
                  }}
                >
                  <CheckCircleIcon className="size-3" />
                </motion.div>
              )}

              {isFailed && (
                <motion.div
                  className="rounded-full bg-destructive p-1 text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    duration: 0.4,
                    type: "spring",
                    bounce: 0.4
                  }}
                >
                  <XCircleIcon className="size-3" />
                </motion.div>
              )}

              {(isPending || isUploading) && (
                <div className="relative">
                  <svg className="size-6 -rotate-90" viewBox="0 0 24 24">
                    {/* Background circle */}
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-muted-foreground/20"
                    />
                    {/* Progress circle */}
                    <motion.circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      className="text-blue-500"
                      initial={{
                        strokeDasharray: circumference,
                        strokeDashoffset: circumference
                      }}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      style={{
                        strokeDasharray: circumference
                      }}
                    />
                  </svg>
                  {/* Progress percentage */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[8px] font-medium text-foreground">
                      {Math.round(progress)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-sm font-medium" title={title}>
                {title}
              </h3>
              <div
                className={cn(
                  "shrink-0 rounded-full px-2 py-1 text-xs font-medium transition-colors",
                  isPending && "bg-muted text-muted-foreground",
                  isUploading &&
                    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                  isCompleted &&
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                  isFailed &&
                    "bg-destructive/10 text-destructive dark:bg-destructive/20"
                )}
              >
                {isPending && "Pending"}
                {isUploading && "Uploading"}
                {isCompleted && "Completed"}
                {isFailed && "Failed"}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatFileSize(file.size)}</span>
              {isUploading && <span>{Math.round(progress)}% uploaded</span>}
              {isFailed && error && (
                <span className="text-destructive">{error}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
