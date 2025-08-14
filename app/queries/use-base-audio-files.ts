import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ref as dbRef, get, onValue, remove } from "firebase/database"
import { deleteObject, ref as storageRef } from "firebase/storage"
import { useEffect } from "react"
import { toast } from "sonner"
import { z } from "zod/mini"
import { db, storage } from "@/lib/firebase"
import { getErrorMessage } from "@/lib/firebase-errors"

// Declare regex literal at top-level for performance
const FIREBASE_DL_PATH_RE = /^\/v0\/b\/[^/]+\/o\//

const baseAudioFileSchema = z.object({
  title: z.string(),
  audioUrl: z.url(),
  clipUrl: z.url(),
  posterUrl: z.url(),
  duration: z.coerce.number()
})

export type BaseAudioFile = z.infer<typeof baseAudioFileSchema> & {
  id: string
}

function snapshotToArray(val: unknown): BaseAudioFile[] {
  if (!val || typeof val !== "object") return []
  return Object.entries(val)
    .filter(([, v]) => baseAudioFileSchema.safeParse(v).success)
    .map(([id, v]) => ({ id, ...(v as Omit<BaseAudioFile, "id">) }))
}

export function useBaseAudioFilesQuery() {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery<BaseAudioFile[]>({
    queryKey: ["base-audio-files"],
    queryFn: async () => {
      const nodeRef = dbRef(db, "audio-metadata/files")
      const snap = await get(nodeRef)
      return snapshotToArray(snap.val())
    }
  })

  useEffect(() => {
    const nodeRef = dbRef(db, "audio-metadata/files")
    const unsub = onValue(nodeRef, (snap) => {
      queryClient.setQueryData(
        ["base-audio-files"],
        snapshotToArray(snap.val())
      )
    })
    return () => unsub()
  }, [queryClient])

  return { files: (data ?? []) as BaseAudioFile[], isLoading, error, refetch }
}

const deleteFileFromUrl = async (url: string) => {
  try {
    const { pathname } = new URL(url)
    const decoded = decodeURIComponent(pathname)
    const bucketPath = decoded.replace(FIREBASE_DL_PATH_RE, "")
    await deleteObject(storageRef(storage, bucketPath))
  } catch {
    // ignore
  }
}

export function useDeleteBaseAudioFileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    // Delete DB entry, then try to delete storage assets from their download URLs
    mutationFn: async (file: BaseAudioFile) => {
      await remove(dbRef(db, `audio-metadata/files/${file.id}`))
      await Promise.allSettled([
        deleteFileFromUrl(file.audioUrl),
        deleteFileFromUrl(file.clipUrl),
        deleteFileFromUrl(file.posterUrl)
      ])
    },
    onError: (error, _file) => {
      toast.error(getErrorMessage(error))
    },
    onSuccess: (_data, file) => {
      toast.success(`Deleted "${file.title}"`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["base-audio-files"] })
    }
  })
}
