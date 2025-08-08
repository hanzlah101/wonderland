import { useEffect } from "react"
import { db, storage } from "@/lib/firebase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ref as dbRef, get, onValue, remove } from "firebase/database"
import { ref as storageRef, deleteObject } from "firebase/storage"
import { toast } from "sonner"
import { z } from "zod/mini"
import { getErrorMessage } from "@/lib/firebase-errors"

// Declare regex literal at top-level for performance
const FIREBASE_DL_PATH_RE = /^\/v0\/b\/[^/]+\/o\//

const audioFileSchema = z.object({
  title: z.string(),
  audioUrl: z.url(),
  clipUrl: z.url(),
  duration: z.coerce.number()
})

export type AudioFile = z.infer<typeof audioFileSchema> & {
  id: string
}

function snapshotToArray(val: unknown): AudioFile[] {
  if (!val || typeof val !== "object") return []
  return Object.entries(val)
    .filter(([, v]) => audioFileSchema.safeParse(v).success)
    .map(([id, v]) => ({ id, ...(v as Omit<AudioFile, "id">) }))
}

export function useAudioFilesQuery() {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery<AudioFile[]>({
    queryKey: ["audio-files"],
    queryFn: async () => {
      const nodeRef = dbRef(db, "audio-metadata/files")
      const snap = await get(nodeRef)
      return snapshotToArray(snap.val())
    }
  })

  useEffect(() => {
    const nodeRef = dbRef(db, "audio-metadata/files")
    const unsub = onValue(nodeRef, (snap) => {
      queryClient.setQueryData(["audio-files"], snapshotToArray(snap.val()))
    })
    return () => unsub()
  }, [queryClient])

  return { files: (data ?? []) as AudioFile[], isLoading, error, refetch }
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

export function useDeleteAudioFileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    // Delete DB entry, then try to delete storage assets from their download URLs
    mutationFn: async (file: AudioFile) => {
      await remove(dbRef(db, `audio-metadata/files/${file.id}`))
      await Promise.allSettled([
        deleteFileFromUrl(file.audioUrl),
        deleteFileFromUrl(file.clipUrl)
      ])
    },
    onError: (error, _file) => {
      toast.error(getErrorMessage(error))
    },
    onSuccess: (_data, file) => {
      toast.success(`Deleted “${file.title}”`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["audio-files"] })
    }
  })
}
