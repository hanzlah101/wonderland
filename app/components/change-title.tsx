import { useEffect, useState } from "react"
import type { FormEvent, KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { ref as dbRef, update } from "firebase/database"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/firebase-errors"

export function ChangeTitle({
  id,
  title,
  className
}: {
  id: string
  title: string
  className?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(title)
  const [isSaving, setIsSaving] = useState(false)

  // Keep local value in sync when not editing
  useEffect(() => {
    if (!isEditing) setValue(title)
  }, [title, isEditing])

  const onKeyDownView = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setIsEditing(true)
    }
  }

  const save = async () => {
    const next = value.trim()
    if (!next) {
      toast.error("Title cannot be empty")
      setIsEditing(false)
      setValue(title)
      return
    }
    if (next === title) {
      setIsEditing(false)
      return
    }

    try {
      setIsSaving(true)
      await update(dbRef(db, `audio-metadata/files/${id}`), { title: next })
      toast.success("Title updated")
      setIsEditing(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await save()
  }

  const onBlur = async () => {
    if (isSaving) return
    await save()
  }

  if (!isEditing) {
    return (
      <Button
        type="button"
        variant="link"
        title={title}
        onClick={() => setIsEditing(true)}
        onKeyDown={onKeyDownView}
        className={cn("truncate p-0", className)}
        aria-label={`Edit title: ${title}`}
      >
        {title}
      </Button>
    )
  }

  return (
    <form onSubmit={onSubmit} className={cn("w-full", className)}>
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        disabled={isSaving}
        aria-label="Title"
        className="h-8"
      />
    </form>
  )
}
