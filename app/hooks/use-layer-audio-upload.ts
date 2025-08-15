import slugify from "slugify"
import startCase from "lodash.startcase"
import { toast } from "sonner"
import { useCallback, useState } from "react"
import { db, storage } from "@/lib/firebase"
import { ref as dbRef, get, set } from "firebase/database"
import {
  LAYER_DB_PATH,
  LAYER_STORAGE_PATH,
  MAX_LAYER_AUDIO_FILES,
  MIME_TYPES
} from "@/lib/constants"
import { type DropzoneOptions } from "react-dropzone"
import { type LayerAudioFile } from "@/queries/use-layer-audio-files-query"
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable
} from "firebase/storage"

type OnDrop = NonNullable<DropzoneOptions["onDrop"]>

type AudioUpload = {
  id: string
  title: string
  file: File
  progress: number
  status: "pending" | "uploading" | "completed" | "failed"
  error?: string | null
}

// Generate unique ID for uploads from title
function generateUniqueId(title: string) {
  const slug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
    remove: /[*+~.()'"!:@]/g
  })
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${slug}-${randomSuffix}-${Date.now()}`
}

// Check if title already exists in database
async function checkTitleExists(title: string) {
  try {
    const snapshot = await get(dbRef(db, LAYER_DB_PATH))
    if (!snapshot.exists()) return false

    const data = snapshot.val() as Record<string, LayerAudioFile>
    return Object.values(data).some(
      (item) => item?.title?.toLowerCase() === title.toLowerCase()
    )
  } catch {
    return false
  }
}

// Generate unique ID that doesn't exist in database
async function generateUniqueIdSafe(title: string) {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const id = generateUniqueId(title)

    try {
      const nodeRef = dbRef(db, `${LAYER_DB_PATH}/${id}`)
      const snap = await get(nodeRef)
      if (!snap.exists()) {
        return id
      }
    } catch {
      return id
    }

    attempts++
  }

  return `${generateUniqueId(title)}-${Date.now()}`
}

// Get file extension
function getFileExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf(".")
  return lastDot !== -1 ? fileName.slice(lastDot) : ""
}

// Get audio duration in seconds
function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audioEl = document.createElement("audio")
    audioEl.preload = "metadata"
    const url = URL.createObjectURL(file)
    audioEl.src = url

    const cleanup = () => {
      URL.revokeObjectURL(url)
      audioEl.removeAttribute("src")
    }

    audioEl.onloadedmetadata = () => {
      const duration = Number.isFinite(audioEl.duration) ? audioEl.duration : 0
      cleanup()
      resolve(duration)
    }

    audioEl.onerror = () => {
      cleanup()
      reject(new Error("Failed to read audio duration"))
    }
  })
}

// Upload with progress
function uploadFileWithProgress(
  file: File,
  path: string,
  onProgress: (progress: number) => void
) {
  const sRef = storageRef(storage, path)
  const task = uploadBytesResumable(sRef, file)

  return new Promise<string>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress(Math.round(pct))
      },
      () => {
        reject(new Error("Upload failed"))
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          resolve(url)
        } catch (e) {
          reject(e as Error)
        }
      }
    )
  })
}

async function processAudioUpload(
  upload: AudioUpload,
  index: number,
  setAudioUploads: React.Dispatch<React.SetStateAction<AudioUpload[]>>
) {
  // Check for title duplicates
  const titleExists = await checkTitleExists(upload.title)
  if (titleExists) {
    setAudioUploads((prev) =>
      prev.map((x, i) =>
        i === index
          ? {
              ...x,
              status: "failed",
              progress: 0,
              error: "Title already exists"
            }
          : x
      )
    )
    return
  }

  // Check for ID collision and regenerate if needed
  let finalId = upload.id
  try {
    const nodeRef = dbRef(db, `${LAYER_DB_PATH}/${finalId}`)
    const snap = await get(nodeRef)
    if (snap.exists()) {
      finalId = await generateUniqueIdSafe(upload.title)
      setAudioUploads((prev) =>
        prev.map((x, i) => (i === index ? { ...x, id: finalId } : x))
      )
    }
  } catch {
    // If we cannot check existence, proceed with current ID
  }

  setAudioUploads((prev) =>
    prev.map((x, i) =>
      i === index ? { ...x, status: "uploading", error: null } : x
    )
  )

  try {
    const audioExt = getFileExtension(upload.file.name)
    const audioPath = `${LAYER_STORAGE_PATH}/${finalId}/audio${audioExt}`

    let uploadProgress = 0
    const updateProgress = () => {
      // Cap upload progress until metadata is successfully saved
      const capped = Math.min(90, uploadProgress)
      setAudioUploads((prev) =>
        prev.map((x, i) => (i === index ? { ...x, progress: capped } : x))
      )
    }

    const durationSeconds = await getAudioDuration(upload.file)

    const audioUrl = await uploadFileWithProgress(
      upload.file,
      audioPath,
      (p) => {
        uploadProgress = p
        updateProgress()
      }
    )

    // Save metadata in Realtime DB (final 10%)
    let metadataSaved = false
    try {
      const nodeRef = dbRef(db, `${LAYER_DB_PATH}/${finalId}`)
      await set(nodeRef, {
        id: finalId,
        title: upload.title,
        audioUrl,
        duration: durationSeconds,
        createdAt: Date.now()
      })
      metadataSaved = true
    } catch {
      toast.error("Failed to save metadata")
    }

    if (metadataSaved) {
      setAudioUploads((prev) =>
        prev.map((x, i) =>
          i === index ? { ...x, status: "completed", progress: 100 } : x
        )
      )
    } else {
      setAudioUploads((prev) =>
        prev.map((x, i) =>
          i === index
            ? {
                ...x,
                status: "failed",
                progress: 90,
                error: "Save failed"
              }
            : x
        )
      )
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed"
    setAudioUploads((prev) =>
      prev.map((x, i) =>
        i === index ? { ...x, status: "failed", error: message } : x
      )
    )
  }
}

export function useLayerAudioUpload() {
  const [audioUploads, setAudioUploads] = useState<AudioUpload[]>([])

  // Check if all uploads are resolved
  const allResolved =
    audioUploads.length > 0 &&
    audioUploads.every(
      (upload) => upload.status === "completed" || upload.status === "failed"
    )

  // Clear uploads only if all are resolved
  const clearUploads = useCallback(() => {
    if (allResolved) {
      setAudioUploads([])
    }
  }, [allResolved])

  const onDrop: OnDrop = useCallback(async (acceptedFiles, fileRejections) => {
    if (fileRejections.length > 0) {
      for (const rej of fileRejections) {
        toast.error(`File rejected: ${rej.file.name}`)
      }
    }

    if (acceptedFiles.length === 0) return

    if (acceptedFiles.length > MAX_LAYER_AUDIO_FILES) {
      toast.error(`Too many files (max ${MAX_LAYER_AUDIO_FILES})`)
      return
    }

    // Filter only audio files
    const audioFiles = acceptedFiles.filter((file) =>
      MIME_TYPES.AUDIO.includes(file.type)
    )

    if (audioFiles.length === 0) {
      toast.error("No valid audio files found")
      return
    }

    // Create uploads from audio files
    const uploads: AudioUpload[] = audioFiles.map((file) => {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
      const title = startCase(nameWithoutExt)
      const id = generateUniqueId(title)

      return {
        id,
        title,
        file,
        progress: 0,
        status: "pending",
        error: null
      }
    })

    setAudioUploads(uploads)

    // Start upload processing in parallel
    const tasks = uploads.map((upload, index) =>
      processAudioUpload(upload, index, setAudioUploads).catch(() => {
        // Errors are handled inside
      })
    )
    await Promise.allSettled(tasks)
  }, [])

  return {
    onDrop,
    audioUploads,
    allResolved,
    clearUploads
  }
}
