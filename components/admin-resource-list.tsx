'use client'

import { useState } from 'react'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { formatDate, getHostname } from '@/lib/format'
import type { Resource } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AdminResourceListProps {
  resources: Resource[]
  categoryNames: Map<string, string>
  editingId: string | null
  onEdit: (resource: Resource) => void
  onDelete: (id: string) => void
}

const headClass = 'px-5 py-3.5 text-left text-sm font-medium text-muted-foreground'

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
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[0_1px_2px_oklch(0.2_0_0/0.04)]">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className={headClass}>
              Name
            </th>
            <th scope="col" className={headClass}>
              Category
            </th>
            <th scope="col" className={headClass}>
              Type
            </th>
            <th scope="col" className={headClass}>
              Updated
            </th>
            <th scope="col" className={cn(headClass, 'text-right')}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {resources.map((resource) => {
            const isEditing = editingId === resource.id
            const isConfirming = confirmingId === resource.id
            return (
              <tr
                key={resource.id}
                className={cn(
                  'border-b border-border transition-colors last:border-b-0',
                  isEditing ? 'bg-accent/40' : 'hover:bg-secondary/40',
                )}
              >
                <td className="px-5 py-3.5 align-middle">
                  <div className="font-medium">{resource.name}</div>
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
                </td>

                <td className="px-5 py-3.5 align-middle text-sm text-muted-foreground">
                  {categoryNames.get(resource.categoryId) ?? 'Uncategorized'}
                </td>

                <td className="px-5 py-3.5 align-middle">
                  <ul className="flex flex-wrap gap-1.5" aria-label="Types">
                    {resource.types.map((typeName) => (
                      <li
                        key={typeName}
                        className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
                      >
                        {typeName}
                      </li>
                    ))}
                  </ul>
                </td>

                <td
                  className="px-5 py-3.5 align-middle font-mono text-xs whitespace-nowrap text-muted-foreground"
                  suppressHydrationWarning
                >
                  {formatDate(resource.updatedAt)}
                </td>

                <td className="px-5 py-3.5 align-middle">
                  {isConfirming ? (
                    <div
                      className="flex items-center justify-end gap-2"
                      role="group"
                      aria-label={`Confirm deleting ${resource.name}`}
                    >
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
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(resource)}
                        className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        <span className="sr-only">Edit {resource.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(resource.id)}
                        className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        <span className="sr-only">Delete {resource.name}</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
