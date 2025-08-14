import { UploadIcon } from "lucide-react"
import { useDropzone } from "react-dropzone"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useBaseAudioUpload } from "@/hooks/use-base-audio-upload"
import { cn } from "@/lib/utils"

function UploadPreviewItem({
  folder,
  posterUrl,
  progress,
  status,
  error
}: {
  folder: string
  posterUrl?: string | null
  progress: number
  status: "pending" | "uploading" | "completed" | "failed"
  error?: string | null
}) {
  const isFailed = status === "failed"
  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "aspect-video w-full overflow-hidden rounded-md border bg-accent",
          isFailed && "border-destructive"
        )}
      >
        {posterUrl ? (
          <img
            loading="eager"
            src={posterUrl}
            alt={`${folder} preview`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Loading...
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <p className="font-medium" title={folder}>
          {folder}
        </p>
        <Progress value={progress} />
        {isFailed && (
          <p className="text-sm text-destructive" aria-live="polite">
            {error || "Upload failed"}
          </p>
        )}
      </div>
    </div>
  )
}

export function BaseAudioUpload() {
  const { onDrop, mediaUploads } = useBaseAudioUpload()

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    onDrop
  })

  // Only show pending/uploading/failed items
  const activeUploads = mediaUploads.filter((u) => u.status !== "completed")

  if (activeUploads.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Uploading folders</CardTitle>
          <CardDescription>
            Your videos are uploading. You can leave this page open while
            uploads complete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeUploads.map((item) => (
              <UploadPreviewItem
                key={`${item.folder}-${item.video.name}`}
                folder={item.folder}
                posterUrl={item.posterUrl ?? null}
                progress={item.progress}
                status={item.status}
                error={item.error}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload base audio folders</CardTitle>
        <CardDescription>
          Drag and drop up to 10 folders. Each folder must contain exactly one
          audio and one video file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={cn(
            "flex h-76 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-input p-6",
            isDragActive
              ? "bg-input/60 text-accent-foreground"
              : "bg-input/30 text-muted-foreground"
          )}
        >
          <input {...getInputProps()} aria-label="Hidden file input" />
          <UploadIcon />
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="font-medium text-foreground">
              Drag and drop folders here
            </p>
            <p className="text-sm text-muted-foreground">
              Tip: Select multiple folders from your file explorer and drop them
              together.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
