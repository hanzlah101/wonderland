import { useQuery, useQueryClient } from "@tanstack/react-query"
import { onAuthStateChanged, type User } from "firebase/auth"
import { useEffect } from "react"
import { auth } from "@/lib/firebase"

export function useSessionQuery() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<User | null>({
    queryKey: ["session"],
    initialData: auth.currentUser ?? undefined,
    queryFn: () => {
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe()
          resolve(user)
        })
      })
    },
    staleTime: Number.POSITIVE_INFINITY
  })

  // Keep the session synced
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      queryClient.setQueryData(["session"], user ?? null)
    })

    return () => unsubscribe()
  }, [queryClient])

  return { user: data as NonNullable<typeof data>, isLoading }
}
