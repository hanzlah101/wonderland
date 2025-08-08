import { useCallback, useState } from "react"
import { toast } from "sonner"
import { storage, db } from "@/lib/firebase"
import { ref as dbRef, set, get } from "firebase/database"
import type { DropzoneOptions } from "react-dropzone"
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL
} from "firebase/storage"

type OnDrop = NonNullable<DropzoneOptions["onDrop"]>

type MediaUpload = {
  folder: string
  audio: File
  video: File
  progress: number
  status: "pending" | "uploading" | "completed" | "failed"
  // Poster image URL generated from the video for quick preview
  posterUrl?: string | null
  // Error message to display in UI when failed
  error?: string | null
}

type FileEntry = {
  name: string
  file: File
  isDirectory: boolean
}

// Constants
const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp3",
  "audio/ogg",
  "audio/m4a"
]
const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/mov",
  "video/avi",
  "video/quicktime"
]
const MAX_FOLDERS = 10
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

// Utils
function getFileExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf(".")
  return lastDot !== -1 ? fileName.slice(lastDot) : ""
}

function isValidFileSize(file: File) {
  return file.size <= MAX_FILE_SIZE
}

function getTopFolderFromPath(path: string) {
  const parts = path.split("/").filter(Boolean)
  return parts.length > 1 ? parts[0] : ""
}

// Duration of an audio File (seconds)
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
    if (isValidFileSize(file)) {
      files.push({ name: entry.name, file, isDirectory: false })
    } else {
      toast.error(
        `File "${entry.name}" exceeds ${Math.floor(MAX_FILE_SIZE / 1024 / 1024)}MB`
      )
    }
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

// Validation
function validateFolderContents(folderName: string, files: FileEntry[]) {
  const audioFiles = files.filter((x) => AUDIO_MIME_TYPES.includes(x.file.type))
  const videoFiles = files.filter((x) => VIDEO_MIME_TYPES.includes(x.file.type))

  if (audioFiles.length !== 1) {
    toast.error(
      `Folder "${folderName}" must contain exactly one audio file (found ${audioFiles.length})`
    )
    return null
  }
  if (videoFiles.length !== 1) {
    toast.error(
      `Folder "${folderName}" must contain exactly one video file (found ${videoFiles.length})`
    )
    return null
  }

  return { audio: audioFiles[0].file, video: videoFiles[0].file }
}

function validateDroppedFolders(folderMap: Record<string, FileEntry[]>) {
  const names = Object.keys(folderMap)
  if (names.length > MAX_FOLDERS) {
    toast.error(
      `Too many folders dropped (${names.length}). Max: ${MAX_FOLDERS}`
    )
    return []
  }
  if (names.length === 0) {
    toast.error("Please drop folders, not individual files")
    return []
  }

  const uploads: MediaUpload[] = []
  for (const name of names) {
    const files = folderMap[name]
    const validated = validateFolderContents(name, files)
    if (validated) {
      uploads.push({
        folder: name,
        audio: validated.audio,
        video: validated.video,
        progress: 0,
        status: "pending"
      })
    }
  }

  return uploads
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

// Generate a quick poster image from a video File without loading the full video
async function generateVideoThumbnail(file: File): Promise<string> {
  const videoUrl = URL.createObjectURL(file)
  const video = document.createElement("video")
  video.preload = "metadata"
  video.muted = true
  video.src = videoUrl

  try {
    await new Promise<void>((resolve, reject) => {
      const onLoadedMeta = () => {
        const duration = Number.isFinite(video.duration) ? video.duration : 0
        const target = duration > 0 ? Math.min(0.1, duration * 0.01) : 0
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked)
          resolve()
        }
        video.addEventListener("seeked", onSeeked, { once: true })
        try {
          video.currentTime = target
        } catch {
          resolve()
        }
      }
      const onError = () => reject(new Error("Failed to load video metadata"))
      video.addEventListener("loadedmetadata", onLoadedMeta, { once: true })
      video.addEventListener("error", onError, { once: true })
    })

    const canvas = document.createElement("canvas")
    const width = Math.max(1, Math.floor(video.videoWidth || 1))
    const height = Math.max(1, Math.floor(video.videoHeight || 1))
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas not supported")
    ctx.drawImage(video, 0, 0, width, height)

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        0.8
      )
    })

    return URL.createObjectURL(blob)
  } finally {
    URL.revokeObjectURL(videoUrl)
  }
}

async function processFolderUpload(
  upload: MediaUpload,
  index: number,
  setMediaUploads: React.Dispatch<React.SetStateAction<MediaUpload[]>>
) {
  // Check for duplicate by folder key before starting uploads
  try {
    const nodeRef = dbRef(db, `audio-metadata/files/${upload.folder}`)
    const snap = await get(nodeRef)
    if (snap.exists()) {
      setMediaUploads((prev) =>
        prev.map((x, i) =>
          i === index
            ? {
                ...x,
                status: "failed",
                progress: 0,
                error: "A record for this folder already exists."
              }
            : x
        )
      )
      toast.error(`Folder "${upload.folder}" already exists`)
      return
    }
  } catch {
    // If we cannot check existence, proceed; upload path write will still fail if rules prevent overwrite.
  }

  setMediaUploads((prev) =>
    prev.map((x, i) =>
      i === index ? { ...x, status: "uploading", error: null } : x
    )
  )

  try {
    const audioExt = getFileExtension(upload.audio.name)
    const videoExt = getFileExtension(upload.video.name)
    const audioPath = `base-audio/${upload.folder}/audio${audioExt}`
    const videoPath = `base-audio/${upload.folder}/video${videoExt}`

    let audioPct = 0
    let videoPct = 0
    const update = () => {
      const combined = Math.round((audioPct + videoPct) / 2)
      // Cap upload progress at 90% until metadata is successfully saved
      const capped = Math.min(90, combined)
      setMediaUploads((prev) =>
        prev.map((x, i) => (i === index ? { ...x, progress: capped } : x))
      )
    }

    const durationSeconds = await getAudioDuration(upload.audio)

    const [audioUrl, clipUrl] = await Promise.all([
      uploadFileWithProgress(upload.audio, audioPath, (p) => {
        audioPct = p
        update()
      }),
      uploadFileWithProgress(upload.video, videoPath, (p) => {
        videoPct = p
        update()
      })
    ])

    // Save metadata in Realtime DB (final 10%)
    let metadataSaved = false
    try {
      const nodeRef = dbRef(db, `audio-metadata/files/${upload.folder}`)
      await set(nodeRef, {
        title: upload.folder,
        audioUrl,
        clipUrl,
        duration: durationSeconds
      })
      metadataSaved = true
    } catch {
      toast.error("Failed to save metadata for uploaded files")
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

      toast.success(`Uploaded folder "${upload.folder}"`)
    } else {
      setMediaUploads((prev) =>
        prev.map((x, i) =>
          i === index
            ? {
                ...x,
                status: "failed",
                progress: 90,
                error: "Failed to save metadata."
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
    toast.error(`Upload failed for "${upload.folder}": ${message}`)
  }
}

export function usePlaylistUpload() {
  const [mediaUploads, setMediaUploads] = useState<MediaUpload[]>([])

  const onDrop: OnDrop = useCallback(
    async (acceptedFiles, fileRejections, event) => {
      if (fileRejections.length > 0) {
        for (const rej of fileRejections) {
          toast.error(`File rejected: ${rej.file.name}`)
        }
      }

      try {
        const folderMap = await getFolderMapFromEvent(event, acceptedFiles)
        const uploads = validateDroppedFolders(folderMap)
        if (uploads.length === 0) return

        // Initialize state and kick off thumbnail generation ASAP
        setMediaUploads(
          uploads.map((u) => ({ ...u, posterUrl: null, error: null }))
        )

        const thumbPromises = uploads.map((u, i) =>
          generateVideoThumbnail(u.video)
            .then((url) => {
              setMediaUploads((prev) =>
                prev.map((x, j) => (j === i ? { ...x, posterUrl: url } : x))
              )
            })
            .catch(() => {
              // Ignore thumbnail errors
            })
        )
        // Fire-and-forget thumbnail creation
        Promise.allSettled(thumbPromises)

        // Start uploads in parallel
        const tasks = uploads.map((u, i) =>
          processFolderUpload(u, i, setMediaUploads).catch(() => {
            // Errors are handled inside
          })
        )
        await Promise.allSettled(tasks)
      } catch {
        toast.error("Error processing dropped folders")
      }
    },
    []
  )

  return { onDrop, mediaUploads }
}
