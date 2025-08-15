import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { deleteFileFromUrl } from "@/lib/firebase-storage"
import { db } from "@/lib/firebase"
import { ref as dbRef, remove } from "firebase/database"
import { Trash2Icon } from "lucide-react"
import { LAYOUT_DB_PATH } from "@/lib/constants"
import { type LayoutAudioFile } from "@/queries/use-layout-audio-files-query"
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

export function DeleteLayoutAudio(file: LayoutAudioFile) {
  const queryClient = useQueryClient()

  const { mutate: deleteFile, isPending } = useMutation({
    mutationKey: ["delete-layout-audio", file.id],
    // Delete DB entry, then try to delete storage assets from their download URLs
    mutationFn: async (f: LayoutAudioFile) => {
      await remove(dbRef(db, `${LAYOUT_DB_PATH}/${f.id}`))
      await Promise.allSettled([deleteFileFromUrl(f.audioUrl)])
    },
    onSuccess: () => {
      toast.success("Layout audio deleted")
      queryClient.invalidateQueries({ queryKey: ["layout-audio-files"] })
    },
    onError: () => {
      toast.error("Failed to delete layout audio")
    }
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="icon"
          variant="destructive"
          className="hidden size-7 shrink-0 transition-opacity group-hover:flex peer-data-[state=editing]:hidden data-[state=open]:flex"
          disabled={isPending}
        >
          <Trash2Icon size={14} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete layout audio</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &apos;{file.title}&apos;? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteFile(file)}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
