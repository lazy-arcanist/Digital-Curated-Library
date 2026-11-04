'use client'

import { useEffect, useRef, useState } from 'react'
import { Lock } from 'lucide-react'
import { ADMIN_PASSWORD } from '@/lib/admin-access'

interface AdminGateDialogProps {
  open: boolean
  onClose: () => void
  onUnlock: () => void
}

export function AdminGateDialog({ open, onClose, onUnlock }: AdminGateDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      setPassword('')
      setError(null)
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (password === ADMIN_PASSWORD) {
      onUnlock()
      return
    }
    setError('Incorrect password. Please try again.')
    setPassword('')
    inputRef.current?.focus()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      aria-labelledby="admin-gate-title"
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <span className="grid size-10 place-items-center rounded-full bg-accent text-accent-foreground">
          <Lock className="size-5" aria-hidden="true" />
        </span>
        <h2 id="admin-gate-title" className="mt-4 text-lg font-semibold tracking-tight">
          Admin access
        </h2>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          Enter the admin password to manage resources and categories.
        </p>

        <label htmlFor="admin-password" className="mt-5 block text-sm font-medium">
          Password
        </label>
        <input
          ref={inputRef}
          id="admin-password"
          type="password"
          autoComplete="off"
          autoFocus
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setError(null)
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'admin-password-error' : undefined}
          className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3.5 text-base focus:ring-4 focus:ring-ring/20 focus:outline-none aria-invalid:border-destructive"
        />
        {error && (
          <p id="admin-password-error" role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!password}
            className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            Unlock
          </button>
        </div>
      </form>
    </dialog>
  )
}
