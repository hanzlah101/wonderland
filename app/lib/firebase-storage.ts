import { deleteObject, ref as storageRef } from "firebase/storage"
import { storage } from "@/lib/firebase"

const FIREBASE_DL_PATH_RE = /^\/v0\/b\/[^/]+\/o\//

export const deleteFileFromUrl = async (url: string) => {
  try {
    const { pathname } = new URL(url)
    if (!FIREBASE_DL_PATH_RE.test(pathname)) return

    const path = decodeURIComponent(pathname.replace(FIREBASE_DL_PATH_RE, ""))
    const fileRef = storageRef(storage, path)
    await deleteObject(fileRef)
  } catch {
    // Ignore deletion errors - file might already be deleted
  }
}
