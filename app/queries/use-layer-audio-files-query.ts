import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ref as dbRef, get, onValue } from "firebase/database"
import { useEffect } from "react"
import { z } from "zod/mini"
import { db } from "@/lib/firebase"
import { LAYER_DB_PATH } from "@/lib/constants"

const layerAudioFileSchema = z.object({
  title: z.string(),
  audioUrl: z.url(),
  duration: z.coerce.number()
})

export type LayerAudioFile = z.infer<typeof layerAudioFileSchema> & {
  id: string
}

function snapshotToArray(val: unknown): LayerAudioFile[] {
  if (!val || typeof val !== "object") return []
  return Object.entries(val)
    .filter(([, v]) => layerAudioFileSchema.safeParse(v).success)
    .map(([id, v]) => ({ id, ...(v as Omit<LayerAudioFile, "id">) }))
}

export function useLayerAudioFilesQuery() {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery<LayerAudioFile[]>({
    queryKey: ["layer-audio-files"],
    queryFn: async () => {
      const nodeRef = dbRef(db, LAYER_DB_PATH)
      const snap = await get(nodeRef)
      return snapshotToArray(snap.val())
    }
  })

  useEffect(() => {
    const nodeRef = dbRef(db, LAYER_DB_PATH)
    const unsub = onValue(nodeRef, (snap) => {
      queryClient.setQueryData(
        ["layer-audio-files"],
        snapshotToArray(snap.val())
      )
    })
    return () => unsub()
  }, [queryClient])

  return { files: (data ?? []) as LayerAudioFile[], isLoading, error, refetch }
}
