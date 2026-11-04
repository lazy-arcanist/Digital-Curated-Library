'use client'

import { useMemo } from 'react'
import { Bookmark, Info } from 'lucide-react'
import { useLibrary } from '@/lib/library-store'
import { PageHeader } from './page-header'
import { ResourceCard } from './resource-card'

const ADD_COLUMN_SQL =
  'alter table public.resources add column if not exists is_bookmarked boolean not null default false;'

export function BookmarksView() {
  const { bookmarkedResources, categories, bookmarkStorage } = useLibrary()

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Bookmarks"
        title="Saved for later"
        description="Interesting tools you want to read or open later."
      />

      {bookmarkStorage === 'browser' && (
        <aside
          className="flex max-w-3xl gap-3 rounded-2xl border border-border bg-secondary/60 p-4 text-sm"
          aria-label="Bookmark storage"
        >
          <Info className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 space-y-2">
            <p className="leading-relaxed text-pretty text-muted-foreground">
              Your <code className="font-mono text-foreground">resources</code> table has no{' '}
              <code className="font-mono text-foreground">is_bookmarked</code> column yet, so bookmarks are
              saved in this browser only. Run this in the Supabase SQL editor to sync them to your database:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-background p-3 font-mono text-xs leading-relaxed text-foreground select-all">
              {ADD_COLUMN_SQL}
            </pre>
          </div>
        </aside>
      )}

      {bookmarkedResources.length > 0 ? (
        <ul className="grid auto-row-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {bookmarkedResources.map((resource) => (
            <li key={resource.id} className="h-full animate-in duration-300 fade-in slide-in-from-bottom-2">
              <ResourceCard
                resource={resource}
                categoryName={categoryNames.get(resource.categoryId) ?? 'Uncategorized'}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <Bookmark className="size-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold">Nothing saved yet</h2>
          <p className="mt-1 max-w-sm text-sm text-pretty text-muted-foreground">
            Tap the bookmark icon on any resource to keep it here.
          </p>
        </div>
      )}
    </div>
  )
}
