import { get, ref } from "firebase/database"
import { db } from "@/lib/firebase"

export async function getIsAdmin(userId: string) {
  const snap = await get(ref(db, `users/${userId}/role`))
  return snap.val() === "admin"
}
