'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronRight, Pencil } from 'lucide-react'
import { formatDate, formatDateTime, getHostname } from '@/lib/format'
import type { Resource } from '@/lib/types'
import { BookmarkButton } from './bookmark-button'
import { useResourceDetail } from './resource-detail'

// Mengukur berapa tag yang muat dalam maxRows baris, lalu menyisakan tempat untuk chip +N
function useFittedTags(tags: string[], maxRows = 2) {
  const listRef = useRef<HTMLUListElement>(null)
  const [width, setWidth] = useState(0)
  const key = `${width}:${tags.join('\u0000')}`
  const [fit, setFit] = useState({ key, count: tags.length })

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return
    if (fit.key !== key) {
      setFit({ key, count: tags.length })
      return
    }
    const rows = new Set(Array.from(el.children, (child) => (child as HTMLElement).offsetTop))
    if (rows.size > maxRows && fit.count > 0) {
      setFit({ key, count: fit.count - 1 })
    }
  }, [fit, key, tags.length, maxRows])

  return { listRef, count: fit.key === key ? fit.count : tags.length }
}

interface ResourceCardProps {
  resource: Resource
  categoryName: string
  onTagClick?: (tag: string) => void
}

export function ResourceCard({ resource, categoryName, onTagClick }: ResourceCardProps) {
  const { openResource } = useResourceDetail()
  const wasEdited = resource.updatedAt !== resource.createdAt

  const { listRef, count } = useFittedTags(resource.tags)
  const visibleTags = resource.tags.slice(0, count)
  const hiddenCount = resource.tags.length - count

  return (
      <article className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_oklch(0.2_0_0/0.04)] transition-[transform,box-shadow,border-color] duration-300 ease-out transform-gpu will-change-transform has-[[data-card-trigger]:focus-visible]:ring-2 has-[[data-card-trigger]:focus-visible]:ring-ring hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_24px_-8px_oklch(0.4_0.15_272/0.18)]">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex max-w-full items-center truncate rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
          {categoryName}
        </span>
        <BookmarkButton resource={resource} className="relative z-10 -mt-1.5 -mr-2" />
      </div>

      <h3 className="mt-4 line-clamp-2 min-h-[3.5rem] text-lg leading-7 font-semibold tracking-tight text-balance text-card-foreground">
        <button
          type="button"
          data-card-trigger
          onClick={() => openResource(resource.id)}
          className="cursor-pointer text-left focus-visible:outline-none after:absolute after:inset-0 after:rounded-2xl after:content-['']"
        >
          {resource.name}
          <span className="sr-only"> (view details)</span>
        </button>
      </h3>

<p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
  {getHostname(resource.url)}
  {resource.links.length > 1 && <span> · +{resource.links.length - 1} more</span>}
</p>

      <p className="mt-3 line-clamp-3 min-h-[4.27rem] break-words text-sm leading-relaxed text-pretty text-muted-foreground">
        {resource.description}
      </p>

      <ul
        ref={listRef}
        className="mt-4 flex min-h-[2.875rem] flex-wrap content-start gap-1.5"
        aria-label="Tags"
      >
        {visibleTags.map((tag) => (
          <li key={tag} className="max-w-full">
            <button
              type="button"
              onClick={() => onTagClick?.(tag)}
              title={`#${tag}`}
              className="relative z-10 block max-w-full truncate rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              #{tag}
            </button>
          </li>
        ))}
        
        {hiddenCount > 0 && (
          <li className="shrink-0">
            <span
              title={resource.tags
                .slice(count)
                .map((t) => `#${t}`)
                .join(', ')}
              className="relative z-10 block whitespace-nowrap rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground"
            >
              +{hiddenCount}
            </span>
          </li>
        )}

      </ul>

      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <dl className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Date added</dt>
            <dd>
              Added{' '}
              <time dateTime={resource.createdAt} suppressHydrationWarning>
                {formatDate(resource.createdAt)}
              </time>
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Pencil className="size-3.5 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Last edited</dt>
            <dd>
              {wasEdited ? 'Edited' : 'Last edited'}{' '}
              <time dateTime={resource.updatedAt} suppressHydrationWarning>
                {formatDateTime(resource.updatedAt)}
              </time>
            </dd>
          </div>
        </dl>

        <span
          aria-hidden="true"
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-3.5 py-2 text-sm font-medium text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
        >
          Details
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  )
}
