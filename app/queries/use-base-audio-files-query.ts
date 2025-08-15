import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ref as dbRef, get, onValue } from "firebase/database"
import { useEffect } from "react"
import { z } from "zod/mini"
import { db } from "@/lib/firebase"
import { BASE_DB_PATH } from "@/lib/constants"

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
      const nodeRef = dbRef(db, BASE_DB_PATH)
      const snap = await get(nodeRef)
      return snapshotToArray(snap.val())
    }
  })

  useEffect(() => {
    const nodeRef = dbRef(db, BASE_DB_PATH)
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
