import { Trash2 } from "lucide-react"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  type BaseAudioFile,
  useDeleteBaseAudioFileMutation
} from "@/queries/use-base-audio-files"

export function DeleteAudio({
  id,
  title,
  audioUrl,
  clipUrl,
  posterUrl
}: BaseAudioFile) {
  const [open, setOpen] = useState(false)
  const { isPending, mutate: deleteAudio } = useDeleteBaseAudioFileMutation()

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          aria-label={`Delete ${title}`}
          className="hidden size-7 shrink-0 transition-opacity group-hover/actions:flex peer-data-[state=editing]:hidden data-[state=open]:flex"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove this item. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() =>
              deleteAudio({
                id,
                title,
                audioUrl,
                clipUrl,
                posterUrl,
                duration: 0
              })
            }
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
