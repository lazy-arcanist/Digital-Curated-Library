'use client'

import { useId, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useLibrary } from '@/lib/library-store'

export function TypeManager() {
  const { types, resources, addType, deleteType } = useLibrary()
  const inputId = useId()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const resource of resources) {
      for (const typeName of resource.types) {
        map.set(typeName, (map.get(typeName) ?? 0) + 1)
      }
    }
    return map
  }, [resources])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (pending) return
    setPending(true)
    const result = await addType(name)
    setPending(false)
    if (result.ok) {
      setName('')
      setError(null)
    } else {
      setError(result.error)
    }
  }

  const handleDelete = async (id: string) => {
    if (pending) return
    setPending(true)
    const result = await deleteType(id)
    setPending(false)
    setError(result.ok ? null : result.error)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} noValidate className="space-y-1.5">
        <label htmlFor={inputId} className="text-sm font-medium">
          New type
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError(null)
            }}
            placeholder="e.g. Podcast"
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-card px-3.5 text-sm transition-shadow placeholder:text-muted-foreground focus:ring-4 focus:ring-ring/20 focus:outline-none aria-invalid:border-destructive"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-60"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add
          </button>
        </div>
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        )}
      </form>

      <ul className="divide-y divide-border rounded-xl border border-border">
        {types.map((item) => {
          const count = counts.get(item.name) ?? 0
          return (
            <li key={item.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
              <span className="min-w-0 truncate text-sm">{item.name}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {count} {count === 1 ? 'resource' : 'resources'}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={count > 0}
                  aria-label={`Delete type ${item.name}`}
                  title={count > 0 ? 'Only unused types can be deleted' : 'Delete type'}
                  className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
