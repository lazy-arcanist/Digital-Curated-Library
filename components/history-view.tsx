'use client'

import { useMemo } from 'react'
import { ChevronRight, History, Pencil, Plus } from 'lucide-react'
import { describeActivity, formatDateTime, getHostname } from '@/lib/format'
import { useLibrary } from '@/lib/library-store'
import { cn } from '@/lib/utils'
import { BookmarkButton } from './bookmark-button'
import { PageHeader } from './page-header'
import { useResourceDetail } from './resource-detail'

export function HistoryView() {
  const { historyResources, categories } = useLibrary()
  const { openResource } = useResourceDetail()

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="History"
        title="Latest activity"
        description="Resources ordered by when they were last added or edited."
      />

      {historyResources.length > 0 ? (
        <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {historyResources.map((resource) => {
            const activity = describeActivity(resource.createdAt, resource.updatedAt)
            const Icon = activity.kind === 'added' ? Plus : Pencil
            return (
              <li
                key={resource.id}
                className="relative flex items-center gap-4 p-4 transition-colors has-[[data-row-trigger]:focus-visible]:bg-accent/40 hover:bg-accent/30 sm:px-5"
              >
                <span
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-full',
                    activity.kind === 'added' ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground',
                  )}
                  aria-hidden="true"
                >
                  <Icon className="size-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <h2 className="min-w-0 truncate text-base font-semibold tracking-tight">
                      <button
                        type="button"
                        data-row-trigger
                        onClick={() => openResource(resource.id)}
                        className="max-w-full cursor-pointer truncate text-left focus-visible:outline-none after:absolute after:inset-0 after:content-['']"
                      >
                        {resource.name}
                        <span className="sr-only"> (view details)</span>
                      </button>
                    </h2>
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                      {categoryNames.get(resource.categoryId) ?? 'Uncategorized'}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                    {getHostname(resource.url)}
                  </p>
                </div>

                <time
                  dateTime={activity.at}
                  title={formatDateTime(activity.at)}
                  suppressHydrationWarning
                  className="hidden shrink-0 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground sm:inline-block"
                >
                  {activity.label}
                </time>

                <BookmarkButton resource={resource} className="relative z-10" />
                <ChevronRight className="size-4.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </li>
            )
          })}
        </ol>
      ) : (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <History className="size-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold">No activity yet</h2>
          <p className="mt-1 max-w-sm text-sm text-pretty text-muted-foreground">
            Resources you add or edit will show up here.
          </p>
        </div>
      )}
    </div>
  )
}
