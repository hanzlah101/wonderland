import { PlusIcon, UploadIcon } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useLayerAudioUpload } from "@/hooks/use-layer-audio-upload"
import { LayerAudioUploadCard } from "@/components/layer-audio-upload-card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MAX_LAYER_AUDIO_FILES, MIME_TYPES } from "@/lib/constants"

export function LayerAudioUpload() {
  const { onDrop, audioUploads, allResolved, clearUploads } =
    useLayerAudioUpload()

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    maxFiles: MAX_LAYER_AUDIO_FILES,
    accept: {
      "audio/*": MIME_TYPES.AUDIO
    },
    onDrop
  })

  if (audioUploads.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl font-semibold">
            Uploading {audioUploads.length}{" "}
            {audioUploads.length === 1 ? "file" : "files"}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {audioUploads.map((item) => (
            <LayerAudioUploadCard key={item.id} {...item} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h2 className="font-serif text-3xl font-semibold">
          Upload layer audio files
        </h2>
        <p className="text-sm text-muted-foreground">
          Drag and drop up to {MAX_LAYER_AUDIO_FILES} audio files. Supported
          formats: MP3, WAV, OGG, M4A.
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
            Drag and drop audio files here
          </p>
          <p className="text-sm text-muted-foreground">
            Or click to select files from your computer.
          </p>
        </div>
      </div>
    </div>
  )
}
