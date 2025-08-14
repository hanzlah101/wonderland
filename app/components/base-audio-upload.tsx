import { PlusIcon, UploadIcon } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useBaseAudioUpload } from "@/hooks/use-base-audio-upload"
import { UploadItemCard } from "@/components/upload-item-card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MAX_FOLDERS } from "@/lib/constants"

export function BaseAudioUpload() {
  const { onDrop, mediaUploads, allResolved, clearUploads } =
    useBaseAudioUpload()

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    onDrop
  })

  if (mediaUploads.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl font-semibold">
            Uploading {mediaUploads.length}{" "}
            {mediaUploads.length === 1 ? "file" : "files"}
          </h2>
          <Button
            size="sm"
            variant="secondary"
            disabled={!allResolved}
            onClick={clearUploads}
          >
            <PlusIcon />
            Add more files
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mediaUploads.map((item) => (
            <UploadItemCard key={item.id} {...item} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h2 className="font-serif text-3xl font-semibold">
          Upload base audio folders
        </h2>
        <p className="text-sm text-muted-foreground">
          Drag and drop up to {MAX_FOLDERS} folders. Each folder must contain
          exactly one audio and one video file.
        </p>
      </div>

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
    </div>
  )
}
