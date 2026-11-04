'use client'

import { useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useLibrary } from '@/lib/library-store'
import type { ActionResult, Resource, ResourceInput } from '@/lib/types'
import { AdminResourceList } from './admin-resource-list'
import { CategoryManager } from './category-manager'
import { TypeManager } from './type-manager'
import { ResourceForm } from './resource-form'
import { StorageUsageCard } from './storage-usage-card'

const cardClass =
  'rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_oklch(0.2_0_0/0.04)] sm:p-6'

export function AdminView() {
  const { resources, categories, types, addResource, updateResource, deleteResource } = useLibrary()
  const [editing, setEditing] = useState<Resource | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const formRef = useRef<HTMLElement>(null)

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  const [query, setQuery] = useState('')

  // Every word typed must appear somewhere in the resource's searchable text.
  const filteredResources = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (words.length === 0) return resources
    return resources.filter((resource) => {
      const haystack = [
        resource.name,
        resource.description,
        categoryNames.get(resource.categoryId) ?? '',
        ...resource.types,
        ...resource.tags,
        ...resource.links.flatMap((link) => [link.label, link.url]),
      ]
        .join(' ')
        .toLowerCase()
      return words.every((word) => haystack.includes(word))
    })
  }, [resources, categoryNames, query])

  const isSearching = query.trim().length > 0

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

      {/* Top area: wide form on the left, storage + categories + types on the right */}
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section ref={formRef} aria-labelledby="form-heading" className={`scroll-mt-24 ${cardClass}`}>
          <h2 id="form-heading" className="mb-5 text-lg font-semibold tracking-tight">
            {editing ? `Edit “${editing.name}”` : 'New resource'}
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

        <div className="space-y-6">
          <StorageUsageCard />

          <section aria-labelledby="categories-heading" className={cardClass}>
            <h2 id="categories-heading" className="mb-4 text-lg font-semibold tracking-tight">
              Add category
            </h2>
            <CategoryManager />
          </section>

          <section aria-labelledby="types-heading" className={cardClass}>
            <h2 id="types-heading" className="mb-4 text-lg font-semibold tracking-tight">
              Add type
            </h2>
            <TypeManager />
          </section>
        </div>
      </div>

      {/* Bottom area: full-width resources table */}
      <section aria-labelledby="resources-heading" className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 id="resources-heading" className="text-lg font-semibold tracking-tight">
            All resources
          </h2>
          <span className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
            {isSearching ? `${filteredResources.length} of ${resources.length}` : `${resources.length} total`}
          </span>
        </div>

        <div className="relative mb-4">
          <label htmlFor="admin-resource-search" className="sr-only">
            Search resources
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="admin-resource-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, description, category, type or tag…"
            autoComplete="off"
            className="h-12 w-full rounded-full border border-input bg-card pr-11 pl-11 text-sm transition-shadow placeholder:text-muted-foreground focus:ring-4 focus:ring-ring/20 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute top-1/2 right-2.5 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {deleteError && (
          <p role="alert" className="mb-3 text-sm font-medium text-destructive">
            {deleteError}
          </p>
        )}

        {isSearching && filteredResources.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
            No resources match “{query.trim()}”. Try a different word.
          </p>
        ) : (
          <AdminResourceList
            resources={filteredResources}
            categoryNames={categoryNames}
            editingId={editing?.id ?? null}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </section>
    </div>
  )
}
