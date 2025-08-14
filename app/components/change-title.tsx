import type { FormEvent, KeyboardEvent } from "react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { db } from "@/lib/firebase"
import { getErrorMessage } from "@/lib/firebase-errors"
import { DB_PATH } from "@/lib/constants"
import {
  query,
  orderByChild,
  equalTo,
  get,
  update,
  ref as dbRef
} from "firebase/database"

async function isTitleTaken(title: string) {
  const q = query(dbRef(db, DB_PATH), orderByChild("title"), equalTo(title))
  const snapshot = await get(q)
  return snapshot.exists()
}

export function ChangeTitle({ id, title }: { id: string; title: string }) {
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
    const newTitle = value.trim()
    if (!newTitle) {
      toast.error("Title cannot be empty")
      setIsEditing(false)
      setValue(title)
      return
    }
    if (newTitle === title) {
      setIsEditing(false)
      return
    }

    try {
      setIsSaving(true)

      const taken = await isTitleTaken(newTitle)
      if (taken) {
        toast.error("Title already exists")
        setIsSaving(false)
        setIsEditing(false)
        return
      }

      await update(dbRef(db, `${DB_PATH}/${id}`), { title: newTitle })
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
      <div className="min-w-0 flex-1">
        <Button
          type="button"
          variant="link"
          title={title}
          onClick={() => setIsEditing(true)}
          onKeyDown={onKeyDownView}
          aria-label={`Edit title: ${title}`}
          className="h-8 w-fit max-w-full justify-start p-0 text-left"
        >
          <span className="block truncate">{title}</span>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} data-state="editing" className="peer w-full">
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
