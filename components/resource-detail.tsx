'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, CalendarDays, Pencil, X } from 'lucide-react'
import { formatDate, formatDateTime, getHostname } from '@/lib/format'
import { useLibrary } from '@/lib/library-store'
import { BookmarkButton } from './bookmark-button'

interface ResourceDetailContextValue {
  openResource: (id: string) => void
}

const ResourceDetailContext = createContext<ResourceDetailContextValue | null>(null)

/** Renders one shared detail modal and lets any card open it by resource id. Must sit inside `LibraryProvider`. */
export function ResourceDetailProvider({ children }: { children: React.ReactNode }) {
  const { resources, categories } = useLibrary()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Looked up live so bookmarking inside the modal updates the icon immediately.
  const resource = useMemo(
    () => resources.find((candidate) => candidate.id === selectedId) ?? null,
    [resources, selectedId],
  )
  const categoryName = useMemo(
    () => categories.find((category) => category.id === resource?.categoryId)?.name ?? 'Uncategorized',
    [categories, resource],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (resource && !dialog.open) dialog.showModal()
    else if (!resource && dialog.open) dialog.close()
  }, [resource])

  useEffect(() => {
    if (!resource) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [resource])

  const openResource = useCallback((id: string) => setSelectedId(id), [])
  const close = useCallback(() => setSelectedId(null), [])
  const value = useMemo(() => ({ openResource }), [openResource])

  return (
    <ResourceDetailContext.Provider value={value}>
      {children}
      <dialog
        ref={dialogRef}
        onClose={close}
        onClick={(event) => {
          if (event.target === event.currentTarget) close()
        }}
        aria-labelledby="resource-detail-title"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        {resource && (
          <div className="animate-in p-6 duration-200 fade-in zoom-in-95 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex max-w-full items-center truncate rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                {categoryName}
              </span>
              <div className="-mt-1.5 -mr-2 flex items-center gap-1">
                <BookmarkButton resource={resource} />
                <button
                  type="button"
                  onClick={close}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <X className="size-4.5" aria-hidden="true" />
                  <span className="sr-only">Close details</span>
                </button>
              </div>
            </div>

            <h2
              id="resource-detail-title"
              className="mt-5 text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
            >
              {resource.name}
            </h2>

            <p className="mt-5 text-base leading-relaxed text-pretty whitespace-pre-line text-muted-foreground">
              {resource.description || 'No description provided.'}
            </p>

            {resource.types.length > 0 && (
              <section aria-labelledby="resource-detail-type" className="mt-6">
                <h3
                  id="resource-detail-type"
                  className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                  {resource.types.length === 1 ? 'Type' : 'Types'}
                </h3>
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {resource.types.map((typeName) => (
                    <li key={typeName}>
                      <span className="inline-flex max-w-full items-center truncate rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                        {typeName}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {resource.tags.length > 0 && (
              <section aria-labelledby="resource-detail-tags" className="mt-6">
                <h3
                  id="resource-detail-tags"
                  className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                  Tags
                </h3>
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {resource.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-md bg-secondary px-2.5 py-1 text-sm text-secondary-foreground"
                    >
                      #{tag}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <dl className="mt-6 grid gap-4 border-t border-border pt-6 text-sm sm:grid-cols-2">
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  Date added
                </dt>
                <dd className="mt-1.5 font-medium tabular-nums">
                  <time dateTime={resource.createdAt}>{formatDate(resource.createdAt)}</time>
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Last edited
                </dt>
                <dd className="mt-1.5 font-medium tabular-nums">
                  <time dateTime={resource.updatedAt}>{formatDateTime(resource.updatedAt)}</time>
                </dd>
              </div>
            </dl>

            {resource.links.length > 0 && (
              <section aria-labelledby="resource-detail-links" className="mt-8">
                <h3
                  id="resource-detail-links"
                  className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                  {resource.links.length === 1 ? 'Link' : 'Links'}
                </h3>
                <ul className="mt-2.5 space-y-2">
                  {resource.links.map((link, index) => (
                    <li key={`${link.url}-${index}`}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/40 px-4 py-3 transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.99]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {link.label || getHostname(link.url)}
                          </span>
                          <span className="block truncate font-mono text-xs text-muted-foreground group-hover:text-primary-foreground/80">
                            {getHostname(link.url)}
                          </span>
                        </span>
                        <ArrowUpRight
                          className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden="true"
                        />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </dialog>
    </ResourceDetailContext.Provider>
  )
}

export function useResourceDetail() {
  const context = useContext(ResourceDetailContext)
  if (!context) throw new Error('useResourceDetail must be used within a ResourceDetailProvider')
  return context
}
