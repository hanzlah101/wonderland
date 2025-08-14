import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { db, storage } from "@/lib/firebase"
import { getErrorMessage } from "@/lib/firebase-errors"
import { deleteObject, ref as storageRef } from "firebase/storage"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ref as dbRef, remove } from "firebase/database"
import { type BaseAudioFile } from "@/queries/use-base-audio-files-query"
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

const FIREBASE_DL_PATH_RE = /^\/v0\/b\/[^/]+\/o\//

const deleteFileFromUrl = async (url: string) => {
  try {
    const { pathname } = new URL(url)
    const decoded = decodeURIComponent(pathname)
    const bucketPath = decoded.replace(FIREBASE_DL_PATH_RE, "")
    await deleteObject(storageRef(storage, bucketPath))
  } catch (error) {
    console.log("Failed to delete file from storage", url, error)
  }
}

export function DeleteAudio(file: BaseAudioFile) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const { isPending, mutate: deleteAudio } = useMutation({
    // Delete DB entry, then try to delete storage assets from their download URLs
    mutationFn: async (f: BaseAudioFile) => {
      await remove(dbRef(db, `audio-metadata/files/${f.id}`))
      await Promise.allSettled([
        deleteFileFromUrl(f.audioUrl),
        deleteFileFromUrl(f.clipUrl),
        deleteFileFromUrl(f.posterUrl)
      ])
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
    onSuccess: (_data, f) => {
      toast.success(`Deleted "${f.title}"`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["base-audio-files"] })
    }
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          aria-label={`Delete ${file.title}`}
          className="hidden size-7 shrink-0 transition-opacity group-hover/actions:flex peer-data-[state=editing]:hidden data-[state=open]:flex"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{file.title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove this item. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() => deleteAudio(file)}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
