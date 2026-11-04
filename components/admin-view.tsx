'use client'

import { useMemo, useRef, useState } from 'react'
import { useLibrary } from '@/lib/library-store'
import type { ActionResult, Resource, ResourceInput } from '@/lib/types'
import { AdminResourceList } from './admin-resource-list'
import { CategoryManager } from './category-manager'
import { TypeManager } from './type-manager'
import { ResourceForm } from './resource-form'
import { StorageUsageCard } from './storage-usage-card'

export function AdminView() {
  const { resources, categories, types, addResource, updateResource, deleteResource } = useLibrary()
  const [editing, setEditing] = useState<Resource | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const formRef = useRef<HTMLElement>(null)

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  const handleEdit = (resource: Resource) => {
    setEditing(resource)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSubmit = async (input: ResourceInput): Promise<ActionResult> => {
    if (editing) {
      const result = await updateResource(editing.id, input)
      if (result.ok) setEditing(null)
      return result
    }
    return addResource(input)
  }

  const handleDelete = async (id: string) => {
    const result = await deleteResource(id)
    setDeleteError(result.ok ? null : result.error)
    if (result.ok && editing?.id === id) setEditing(null)
  }

  return (
    <div>
      <header className="max-w-2xl">
        <p className="text-sm font-medium text-primary">Admin dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Manage your library
        </h1>
        <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">
          Add, edit and remove resources, and keep the category list up to date.
        </p>
      </header>

      <StorageUsageCard className="mt-8" />

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-labelledby="resources-heading" className="order-2 lg:order-1">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="resources-heading" className="text-lg font-semibold tracking-tight">
              All resources
            </h2>
            <span className="text-sm text-muted-foreground tabular-nums">{resources.length} total</span>
          </div>
          {deleteError && (
            <p role="alert" className="mb-3 text-sm font-medium text-destructive">
              {deleteError}
            </p>
          )}
          <AdminResourceList
            resources={resources}
            categoryNames={categoryNames}
            editingId={editing?.id ?? null}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </section>

<div className="order-1 space-y-6 lg:sticky lg:top-24 lg:order-2 lg:max-h-[calc(100dvh-7.5rem)] lg:overflow-y-auto lg:pr-2">
          <section
            ref={formRef}
            aria-labelledby="form-heading"
            className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_oklch(0.2_0_0/0.04)]"
          >
            <h2 id="form-heading" className="mb-4 text-lg font-semibold tracking-tight">
              {editing ? `Edit “${editing.name}”` : 'Add a resource'}
            </h2>
            <ResourceForm
              key={editing?.id ?? 'new'}
              categories={categories}
              types={types}
              editing={editing}
              onSubmit={handleSubmit}
              onCancel={() => setEditing(null)}
            />
          </section>


          <section
            aria-labelledby="categories-heading"
            className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_oklch(0.2_0_0/0.04)]"
          >
            <h2 id="categories-heading" className="mb-4 text-lg font-semibold tracking-tight">
              Categories
            </h2>
            <CategoryManager />
          </section>

          <section
            aria-labelledby="types-heading"
            className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_oklch(0.2_0_0/0.04)]"
          >
            <h2 id="types-heading" className="mb-4 text-lg font-semibold tracking-tight">
              Types
            </h2>
            <TypeManager />
          </section>
        </div>
      </div>
    </div>
  )
}
