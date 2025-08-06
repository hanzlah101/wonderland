import { useEffect } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { auth } from "@/lib/firebase"

export function useSessionQuery() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<User | null>({
    queryKey: ["session"],
    initialData: auth.currentUser ?? undefined,
    queryFn: () => {
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          unsubscribe()
          if (!user) return resolve(null)
          const { claims } = await user.getIdTokenResult()
          resolve(claims.role === "admin" ? user : null)
        })
      })
    },
    staleTime: Number.POSITIVE_INFINITY
  })

  // Keep the session synced
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        queryClient.setQueryData(["session"], null)
        return
      }

      const { claims } = await user.getIdTokenResult()
      queryClient.setQueryData(
        ["session"],
        claims.role === "admin" ? user : null
      )
    })

    return () => unsubscribe()
  }, [queryClient])

  return { user: data as NonNullable<typeof data>, isLoading }
}
