import slugify from "slugify"
import { toast } from "sonner"
import { useCallback, useState } from "react"
import { db, storage } from "@/lib/firebase"
import { ref as dbRef, get, set } from "firebase/database"
import { DB_PATH, STORAGE_PATH, MAX_FOLDERS, MIME_TYPES } from "@/lib/constants"
import { type DropzoneOptions } from "react-dropzone"
import { type BaseAudioFile } from "@/queries/use-base-audio-files-query"
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable
} from "firebase/storage"

type OnDrop = NonNullable<DropzoneOptions["onDrop"]>

type MediaUpload = {
  id: string // Unique identifier for the upload
  folder: string // Original folder name for display
  audio: File
  video: File
  progress: number
  status: "pending" | "uploading" | "completed" | "failed"
  // Poster image URL generated from the video for quick preview
  posterUrl?: string | null
  // Error message to display in UI when failed
  error?: string | null
}

// Extended type for uploads during processing that includes temporary files
type MediaUploadWithFiles = MediaUpload & {
  _files: FileEntry[]
}

type FileEntry = {
  name: string
  file: File
  isDirectory: boolean
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
    const snapshot = await get(dbRef(db, DB_PATH))
    if (!snapshot.exists()) return false

    const data = snapshot.val() as Record<string, BaseAudioFile>
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
      const nodeRef = dbRef(db, `${DB_PATH}/${id}`)
      const snap = await get(nodeRef)
      if (!snap.exists()) {
        return id
      }
    } catch {
      // If we can't check, return the generated ID
      return id
    }

    attempts++
  }

  // Fallback with timestamp if all attempts failed
  return `${generateUniqueId(title)}-${Date.now()}`
}

// Utils
function getFileExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf(".")
  return lastDot !== -1 ? fileName.slice(lastDot) : ""
}

function getTopFolderFromPath(path: string) {
  const parts = path.split("/").filter(Boolean)
  return parts.length > 1 ? parts[0] : ""
}

// Duration of an audio File (seconds)
function getAudioDuration(file: File) {
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

// Read all entries in a directory
async function readAllDirectoryEntries(dirReader: FileSystemDirectoryReader) {
  const all: FileSystemEntry[] = []

  async function readBatch() {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      dirReader.readEntries(resolve, reject)
    })
    if (batch.length > 0) {
      all.push(...batch)
      await readBatch()
    }
  }

  await readBatch()
  return all
}

// Traverse a FileSystemEntry and return files
async function traverseEntry(entry: FileSystemEntry) {
  const files: FileEntry[] = []

  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry
    const file = await new Promise<File>((resolve, reject) => {
      fileEntry.file(resolve, reject)
    })
    files.push({ name: entry.name, file, isDirectory: false })
    return files
  }

  if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry
    const reader = dirEntry.createReader()
    const entries = await readAllDirectoryEntries(reader)
    const results = await Promise.all(entries.map(traverseEntry))
    for (const child of results) files.push(...child)
  }

  return files
}

// Build folder map from DataTransfer items (drag-n-drop)
async function buildFolderMapFromItems(items: DataTransferItemList) {
  const map: Record<string, FileEntry[]> = {}
  const tasks: Promise<void>[] = []

  for (const dtItem of Array.from(items)) {
    if (dtItem.kind !== "file") continue

    type EntryItem = DataTransferItem & {
      webkitGetAsEntry?: () => (FileSystemEntry & { fullPath?: string }) | null
    }

    const entry = (dtItem as EntryItem).webkitGetAsEntry?.()
    if (!entry) continue

    if (entry.isDirectory) {
      tasks.push(
        traverseEntry(entry).then((files) => {
          const key = (entry as FileSystemDirectoryEntry).name
          if (!map[key]) map[key] = []
          map[key].push(...files)
        })
      )
    } else if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry & { fullPath?: string }
      tasks.push(
        new Promise<void>((resolve) => {
          fileEntry.file(
            (file) => {
              const top = getTopFolderFromPath(fileEntry.fullPath ?? "")
              if (top) {
                if (!map[top]) map[top] = []
                map[top].push({
                  name: fileEntry.name,
                  file,
                  isDirectory: false
                })
              }
              resolve()
            },
            () => resolve()
          )
        })
      )
    }
  }

  await Promise.allSettled(tasks)
  return map
}

// Build folder map from FileList (click selection with webkitRelativePath)
function buildFolderMapFromFileList(files: FileList) {
  const map: Record<string, FileEntry[]> = {}
  for (const f of Array.from(files)) {
    const withRel = f as File & { webkitRelativePath?: string; path?: string }
    const rel = withRel.webkitRelativePath || withRel.path || ""
    if (!rel.includes("/")) continue
    const top = getTopFolderFromPath(rel)
    if (!top) continue
    if (!map[top]) map[top] = []
    map[top].push({ name: f.name, file: f, isDirectory: false })
  }
  return map
}

// Build folder map from react-dropzone accepted files
function buildFolderMapFromAccepted(accepted: File[]) {
  const map: Record<string, FileEntry[]> = {}
  for (const f of accepted) {
    const withRel = f as File & { webkitRelativePath?: string; path?: string }
    const rel = withRel.path || withRel.webkitRelativePath || ""
    if (!rel.includes("/")) continue
    const top = getTopFolderFromPath(rel)
    if (!top) continue
    if (!map[top]) map[top] = []
    map[top].push({ name: f.name, file: f, isDirectory: false })
  }
  return map
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <>
async function getFolderMapFromEvent(event?: unknown, accepted?: File[]) {
  // 1) Try accepted files
  if (accepted && accepted.length > 0) {
    const map = buildFolderMapFromAccepted(accepted)
    if (Object.keys(map).length > 0) return map
  }

  // 2) Try native DragEvent items
  if (
    event &&
    typeof event === "object" &&
    "dataTransfer" in (event as DragEvent)
  ) {
    const drag = event as DragEvent
    if (drag.dataTransfer?.items) {
      const map = await buildFolderMapFromItems(drag.dataTransfer.items)
      if (Object.keys(map).length > 0) return map
    }
    if (drag.dataTransfer?.files?.length) {
      const map = buildFolderMapFromFileList(drag.dataTransfer.files)
      if (Object.keys(map).length > 0) return map
    }
  }

  return {}
}

// Validation - returns error message or validated files
function validateFolderContents(
  _folderName: string,
  files: FileEntry[]
): string | { audio: File; video: File } {
  const audioFiles = files.filter((x) => MIME_TYPES.AUDIO.includes(x.file.type))
  const videoFiles = files.filter((x) => MIME_TYPES.VIDEO.includes(x.file.type))

  if (audioFiles.length === 0 && videoFiles.length === 0) {
    return "Missing audio & video file"
  }
  if (audioFiles.length === 0) {
    return "Missing audio file"
  }
  if (audioFiles.length > 1) {
    return "Too many audio files"
  }
  if (videoFiles.length === 0) {
    return "Missing video file"
  }
  if (videoFiles.length > 1) {
    return "Too many video files"
  }

  return { audio: audioFiles[0].file, video: videoFiles[0].file }
}

// Create uploads immediately without validation
function createUploadsFromFolders(
  folderMap: Record<string, FileEntry[]>
): MediaUploadWithFiles[] {
  const names = Object.keys(folderMap)

  if (names.length > MAX_FOLDERS) {
    toast.error(`Too many folders (max ${MAX_FOLDERS})`)
    return []
  }
  if (names.length === 0) {
    toast.error("Drop folders, not files")
    return []
  }

  const uploads: MediaUploadWithFiles[] = []

  for (const name of names) {
    const files = folderMap[name]
    const id = generateUniqueId(name) // Generate ID immediately

    // Create upload entry immediately, we'll validate later
    // Use placeholder files that will be replaced during validation
    const placeholderFile = new File([], "placeholder")

    uploads.push({
      id,
      folder: name,
      audio: placeholderFile, // Temporary, will be validated later
      video: placeholderFile, // Temporary, will be validated later
      progress: 0,
      status: "pending",
      posterUrl: null,
      error: null,
      _files: files
    })
  }

  return uploads
}

// Upload with progress (supports both File and Blob)
function uploadFileWithProgress(
  file: File | Blob,
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

// Simple poster generation from video center
function generateVideoPosterBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      reject(new Error("Canvas not supported"))
      return
    }

    video.onloadedmetadata = () => {
      // Set canvas to 16:9 aspect ratio, max 800px width for performance
      canvas.width = 800
      canvas.height = 450

      // Jump to center of video
      video.currentTime = video.duration / 2
    }

    video.onseeked = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Failed to generate poster"))
        },
        "image/jpeg",
        0.8
      )
    }

    video.onerror = () => reject(new Error("Failed to load video"))
    video.src = URL.createObjectURL(file)
  })
}

// Generate preview thumbnail for upload UI
async function generateVideoThumbnail(file: File): Promise<string> {
  const blob = await generateVideoPosterBlob(file)
  return URL.createObjectURL(blob)
}

async function processFolderUpload(
  upload: MediaUploadWithFiles,
  index: number,
  setMediaUploads: React.Dispatch<React.SetStateAction<MediaUpload[]>>
) {
  // Step 1: Validate folder contents
  const validation = validateFolderContents(upload.folder, upload._files)
  if (typeof validation === "string") {
    // Validation failed - set error and stop
    setMediaUploads((prev) =>
      prev.map((x, i) =>
        i === index
          ? {
              ...x,
              status: "failed",
              progress: 0,
              error: validation
            }
          : x
      )
    )
    return
  }

  // Update with correct audio/video files
  setMediaUploads((prev) =>
    prev.map((x, i) =>
      i === index
        ? {
            ...x,
            audio: validation.audio,
            video: validation.video
          }
        : x
    )
  )

  // Update local reference
  upload.audio = validation.audio
  upload.video = validation.video

  // Step 2: Check for title duplicates
  const titleExists = await checkTitleExists(upload.folder)
  if (titleExists) {
    setMediaUploads((prev) =>
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

  // Step 3: Check for ID collision and regenerate if needed
  let finalId = upload.id
  try {
    const nodeRef = dbRef(db, `${DB_PATH}/${finalId}`)
    const snap = await get(nodeRef)
    if (snap.exists()) {
      // Regenerate ID if collision detected
      finalId = await generateUniqueIdSafe(upload.folder)
      setMediaUploads((prev) =>
        prev.map((x, i) => (i === index ? { ...x, id: finalId } : x))
      )
    }
  } catch {
    // If we cannot check existence, proceed with current ID
  }

  setMediaUploads((prev) =>
    prev.map((x, i) =>
      i === index ? { ...x, status: "uploading", error: null } : x
    )
  )

  try {
    const audioExt = getFileExtension(upload.audio.name)
    const videoExt = getFileExtension(upload.video.name)
    const audioPath = `${STORAGE_PATH}/${finalId}/audio${audioExt}`
    const videoPath = `${STORAGE_PATH}/${finalId}/video${videoExt}`
    const posterPath = `${STORAGE_PATH}/${finalId}/poster.jpg`

    let audioPct = 0
    let videoPct = 0
    let posterPct = 0
    const update = () => {
      const combined = Math.round((audioPct + videoPct + posterPct) / 3)
      // Cap upload progress until metadata is successfully saved
      const capped = Math.min(90, combined)
      setMediaUploads((prev) =>
        prev.map((x, i) => (i === index ? { ...x, progress: capped } : x))
      )
    }

    const durationSeconds = await getAudioDuration(upload.audio)
    const posterBlob = await generateVideoPosterBlob(upload.video)

    const [audioUrl, clipUrl, posterUrl] = await Promise.all([
      uploadFileWithProgress(upload.audio, audioPath, (p) => {
        audioPct = p
        update()
      }),
      uploadFileWithProgress(upload.video, videoPath, (p) => {
        videoPct = p
        update()
      }),
      uploadFileWithProgress(posterBlob, posterPath, (p) => {
        posterPct = p
        update()
      })
    ])

    // Save metadata in Realtime DB (final 10%)
    let metadataSaved = false
    try {
      const nodeRef = dbRef(db, `${DB_PATH}/${finalId}`)
      await set(nodeRef, {
        id: finalId,
        title: upload.folder,
        originalFolderName: upload.folder,
        audioUrl,
        clipUrl,
        posterUrl,
        duration: durationSeconds,
        createdAt: Date.now()
      })
      metadataSaved = true
    } catch {
      toast.error("Failed to save metadata")
    }

    if (metadataSaved) {
      // Revoke poster URL to avoid memory leaks when we mark completed
      let toRevoke: string | null = null
      setMediaUploads((prev) => {
        toRevoke = prev.at(index)?.posterUrl ?? null
        return prev.map((x, i) =>
          i === index ? { ...x, status: "completed", progress: 100 } : x
        )
      })
      if (toRevoke) URL.revokeObjectURL(toRevoke)
    } else {
      setMediaUploads((prev) =>
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
    setMediaUploads((prev) =>
      prev.map((x, i) =>
        i === index ? { ...x, status: "failed", error: message } : x
      )
    )
  }
}

export function useBaseAudioUpload() {
  const [mediaUploads, setMediaUploads] = useState<MediaUpload[]>([])

  // Check if all uploads are resolved (either completed or failed)
  const allResolved =
    mediaUploads.length > 0 &&
    mediaUploads.every(
      (upload) => upload.status === "completed" || upload.status === "failed"
    )

  // Clear uploads only if all are resolved
  const clearUploads = useCallback(() => {
    if (allResolved) {
      // Revoke any remaining poster URLs to prevent memory leaks
      mediaUploads.forEach((upload) => {
        if (upload.posterUrl) {
          URL.revokeObjectURL(upload.posterUrl)
        }
      })
      setMediaUploads([])
    }
  }, [allResolved, mediaUploads])

  const onDrop: OnDrop = useCallback(
    async (acceptedFiles, fileRejections, event) => {
      if (fileRejections.length > 0) {
        for (const rej of fileRejections) {
          toast.error(`File rejected: ${rej.file.name}`)
        }
      }

      try {
        const folderMap = await getFolderMapFromEvent(event, acceptedFiles)
        const uploads = createUploadsFromFolders(folderMap)
        if (uploads.length === 0) return

        // INSTANTLY set uploads to state - no validation yet
        setMediaUploads(uploads)

        // Start thumbnail generation for valid video files
        const thumbPromises = uploads.map(async (u, i) => {
          // Only generate thumbnail if we have files to work with
          const files = u._files
          const videoFiles = files.filter((x) =>
            MIME_TYPES.VIDEO.includes(x.file.type)
          )

          if (videoFiles.length === 1) {
            try {
              const url = await generateVideoThumbnail(videoFiles[0].file)
              setMediaUploads((prev) =>
                prev.map((x, j) => (j === i ? { ...x, posterUrl: url } : x))
              )
            } catch {
              // Ignore thumbnail errors
            }
          }
        })

        // Fire-and-forget thumbnail creation
        Promise.allSettled(thumbPromises)

        // Start upload processing in parallel (validation happens inside)
        const tasks = uploads.map((u, i) =>
          processFolderUpload(u, i, setMediaUploads).catch(() => {
            // Errors are handled inside
          })
        )
        await Promise.allSettled(tasks)
      } catch {
        toast.error("Processing failed")
      }
    },
    []
  )

  return {
    onDrop,
    mediaUploads,
    allResolved,
    clearUploads
  }
}
