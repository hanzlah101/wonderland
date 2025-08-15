import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ref as dbRef, get, onValue } from "firebase/database"
import { useEffect } from "react"
import { z } from "zod/mini"
import { db } from "@/lib/firebase"
import { LAYOUT_DB_PATH } from "@/lib/constants"

const layoutAudioFileSchema = z.object({
  title: z.string(),
  audioUrl: z.url(),
  duration: z.coerce.number()
})

export type LayoutAudioFile = z.infer<typeof layoutAudioFileSchema> & {
  id: string
}

function snapshotToArray(val: unknown): LayoutAudioFile[] {
  if (!val || typeof val !== "object") return []
  return Object.entries(val)
    .filter(([, v]) => layoutAudioFileSchema.safeParse(v).success)
    .map(([id, v]) => ({ id, ...(v as Omit<LayoutAudioFile, "id">) }))
}

export function useLayoutAudioFilesQuery() {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery<LayoutAudioFile[]>({
    queryKey: ["layout-audio-files"],
    queryFn: async () => {
      const nodeRef = dbRef(db, LAYOUT_DB_PATH)
      const snap = await get(nodeRef)
      return snapshotToArray(snap.val())
    }
  })

  useEffect(() => {
    const nodeRef = dbRef(db, LAYOUT_DB_PATH)
    const unsub = onValue(nodeRef, (snap) => {
      queryClient.setQueryData(
        ["layout-audio-files"],
        snapshotToArray(snap.val())
      )
    })
    return () => unsub()
  }, [queryClient])

  return { files: (data ?? []) as LayoutAudioFile[], isLoading, error, refetch }
}
