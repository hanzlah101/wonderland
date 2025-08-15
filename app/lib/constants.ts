// Firebase Database paths
export const BASE_DB_PATH = "audio-metadata/files"
export const LAYOUT_DB_PATH = "layout-audio/files"

// Firebase Storage paths
export const BASE_STORAGE_PATH = "base-audio"
export const LAYOUT_STORAGE_PATH = "layout-audio"

// File constraints
export const MAX_FOLDERS = 10
export const MAX_LAYOUT_AUDIO_FILES = 10

// Supported MIME types
export const MIME_TYPES = {
  AUDIO: ["audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg", "audio/m4a"],
  VIDEO: [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/mov",
    "video/avi",
    "video/quicktime"
  ]
}
