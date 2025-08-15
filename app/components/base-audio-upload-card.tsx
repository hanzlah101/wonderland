import { CheckCircleIcon, XCircleIcon } from "lucide-react"
import { motion } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

type UploadItemCardProps = {
  id: string
  folder: string
  posterUrl?: string | null
  progress: number
  status: "pending" | "uploading" | "completed" | "failed"
  error?: string | null
}

export function BaseAudioUploadCard({
  folder,
  posterUrl,
  progress,
  status,
  error
}: UploadItemCardProps) {
  const isCompleted = status === "completed"
  const isFailed = status === "failed"
  const isUploading = status === "uploading"
  const isPending = status === "pending"

  // Circular progress calculation
  const circumference = 2 * Math.PI * 20 // radius = 20
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <Card className="overflow-hidden py-0 transition-colors">
      <CardContent className="p-0">
        <div className="relative">
          <div className="aspect-video w-full overflow-hidden bg-muted">
            {posterUrl ? (
              <img
                loading="eager"
                src={posterUrl}
                alt={`${folder} preview`}
                className="size-full object-cover"
              />
            ) : (
              <Skeleton className="size-full rounded-none" />
            )}
          </div>

          {/* Always present overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 dark:bg-black/60">
            {/* Progress circle for uploading/pending */}
            {(isPending || isUploading) && (
              <div className="relative">
                <svg className="size-12 -rotate-90" viewBox="0 0 44 44">
                  {/* Background circle */}
                  <circle
                    cx="22"
                    cy="22"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    className="text-white/20"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="22"
                    cy="22"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    className="text-white"
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
                  <span className="text-xs font-medium text-white">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            )}

            {/* Success/Error icons */}
            {isCompleted && (
              <motion.div
                className="rounded-full bg-emerald-500 p-2 text-white dark:bg-emerald-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 0.4,
                  type: "spring",
                  bounce: 0.4
                }}
              >
                <CheckCircleIcon className="size-6" />
              </motion.div>
            )}

            {isFailed && (
              <div className="flex flex-col items-center space-y-2">
                <motion.div
                  className="rounded-full bg-destructive p-2 text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    duration: 0.4,
                    type: "spring",
                    bounce: 0.4
                  }}
                >
                  <XCircleIcon className="size-6" />
                </motion.div>
                {/* Error message under the icon */}
                <p className="px-2 text-center text-xs leading-tight text-white">
                  {error || "Upload failed"}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h3 className="truncate text-sm font-medium" title={folder}>
              {folder}
            </h3>
            <div
              className={cn(
                "rounded-full px-2 py-1 text-xs font-medium transition-colors",
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
        </div>
      </CardContent>
    </Card>
  )
}
