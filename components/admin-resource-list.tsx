'use client'

import { useState } from 'react'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { formatDate, formatDateTime, getHostname } from '@/lib/format'
import type { Resource } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AdminResourceListProps {
  resources: Resource[]
  categoryNames: Map<string, string>
  editingId: string | null
  onEdit: (resource: Resource) => void
  onDelete: (id: string) => void
}

export function AdminResourceList({
  resources,
  categoryNames,
  editingId,
  onEdit,
  onDelete,
}: AdminResourceListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  if (resources.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        No resources yet. Add your first one using the form.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {resources.map((resource) => {
        const isEditing = editingId === resource.id
        const isConfirming = confirmingId === resource.id
        return (
          <li
            key={resource.id}
            className={cn(
              'rounded-2xl border bg-card p-4 transition-colors duration-200',
              isEditing ? 'border-primary ring-4 ring-ring/15' : 'border-border',
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold tracking-tight">{resource.name}</h3>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                    {categoryNames.get(resource.categoryId) ?? 'Uncategorized'}
                  </span>
                </div>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  {getHostname(resource.url)}
                  <ExternalLink className="size-3" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>

              {isConfirming ? (
                <div className="flex items-center gap-2" role="group" aria-label={`Confirm deleting ${resource.name}`}>
                  <span className="text-sm text-muted-foreground">Delete?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(resource.id)
                      setConfirmingId(null)
                    }}
                    className="rounded-full bg-destructive px-3 py-1.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
                  >
                    Yes, delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(resource)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Edit
                    <span className="sr-only">{resource.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(resource.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Delete
                    <span className="sr-only">{resource.name}</span>
                  </button>
                </div>
              )}
            </div>

            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{resource.description}</p>

            {resource.tags.length > 0 && (
              <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Tags">
                {resource.tags.map((tag) => (
                  <li key={tag} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    #{tag}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 text-xs text-muted-foreground" suppressHydrationWarning>
              Added {formatDate(resource.createdAt)} · Last edited {formatDateTime(resource.updatedAt)}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
