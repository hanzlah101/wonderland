import { useEffect } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { auth, db } from "@/lib/firebase"
import { getIsAdmin } from "@/lib/auth"
import { onValue, ref } from "firebase/database"

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
          const isAdmin = await getIsAdmin(user.uid)
          resolve(isAdmin ? user : null)
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

      const isAdmin = await getIsAdmin(user.uid)
      queryClient.setQueryData(["session"], isAdmin ? user : null)
    })

    return unsubscribe
  }, [queryClient])

  // Sync role changes in real-time
  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const roleRef = ref(db, `users/${user.uid}/role`)
    const unsubscribe = onValue(roleRef, (snap) => {
      const role = snap.val()
      queryClient.setQueryData(["session"], role === "admin" ? user : null)
    })

    return () => unsubscribe()
  }, [queryClient])

  return {
    user: data,
    isLoading
  }
}
