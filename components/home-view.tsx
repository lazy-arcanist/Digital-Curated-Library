
'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, SearchX } from 'lucide-react'
import { useLibrary } from '@/lib/library-store'
import { PageHeader } from './page-header'
import { ResourceCard } from './resource-card'
import { SearchInput } from './search-input'

interface HomeViewProps {
  onOpenCategory: (categoryId: string) => void
  onOpenAll: () => void
}

export function HomeView({ onOpenCategory, onOpenAll }: HomeViewProps) {
  const { resources, categories, recentResources } = useLibrary()
  const [query, setQuery] = useState('')

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  const countsByCategory = useMemo(() => {
    const counts = new Map<string, number>()
    for (const resource of resources) {
      counts.set(resource.categoryId, (counts.get(resource.categoryId) ?? 0) + 1)
    }
    return counts
  }, [resources])

  const largestCount = Math.max(1, ...countsByCategory.values())
  const term = query.trim().toLowerCase().replace(/^#/, '')

  const results = useMemo(() => {
    if (!term) return []
    return resources.filter((resource) =>
      [resource.name, resource.description, categoryNames.get(resource.categoryId) ?? '', ...resource.tags]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [resources, term, categoryNames])

  const cardFor = (resource: (typeof resources)[number]) => (
      <li key={resource.id} className="h-full animate-in duration-300 fade-in slide-in-from-bottom-2">
      <ResourceCard
        resource={resource}
        categoryName={categoryNames.get(resource.categoryId) ?? 'Uncategorized'}
        onTagClick={setQuery}
      />
    </li>
  )

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Home"
          title="The tools worth bookmarking."
          description="A hand-picked collection of websites and utilities. Search everything from here."
        />
        <div className="max-w-2xl">
          <SearchInput value={query} onChange={setQuery} />
        </div>
      </div>

      {term ? (
        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="text-sm text-muted-foreground" role="status" aria-live="polite">
            {results.length} {results.length === 1 ? 'result' : 'results'} for “{query.trim()}”
          </h2>
          {results.length > 0 ? (
            <ul className="mt-4 grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">{results.map(cardFor)}</ul>
          ) : (
            <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold">No resources found</h3>
              <p className="mt-1 max-w-sm text-sm text-pretty text-muted-foreground">
                Try a different search term.
              </p>
            </div>
          )}
        </section>
      ) : (
        <>
          <section aria-labelledby="recent-heading">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="recent-heading" className="text-xl font-semibold tracking-tight">
                  Recently added
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">The four newest resources.</p>
              </div>
              <button
                type="button"
                onClick={onOpenAll}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                View all
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
            {recentResources.length > 0 ? (
              <ul className="mt-5 grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">{recentResources.map(cardFor)}</ul>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                No resources yet. Add the first one from the Admin view.
              </p>
            )}
          </section>

          <section aria-labelledby="breakdown-heading">
            <div>
              <h2 id="breakdown-heading" className="text-xl font-semibold tracking-tight">
                Browse by category
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {resources.length} {resources.length === 1 ? 'resource' : 'resources'} across{' '}
                {categories.length} {categories.length === 1 ? 'category' : 'categories'}.
              </p>
            </div>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => {
                const count = countsByCategory.get(category.id) ?? 0
                return (
                  <li key={category.id}>
                    <button
                      type="button"
                      onClick={() => onOpenCategory(category.id)}
                      className="group w-full rounded-2xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/30 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.99]"
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm font-medium">{category.name}</span>
                        <span className="text-2xl font-semibold tracking-tight tabular-nums">{count}</span>
                      </span>
                      <span
                        className="mt-3 block h-1.5 overflow-hidden rounded-full bg-secondary"
                        aria-hidden="true"
                      >
                        <span
                          className="block h-full rounded-full bg-primary transition-[width] duration-500"
                          style={{ width: `${(count / largestCount) * 100}%` }}
                        />
                      </span>
                      <span className="sr-only">
                        {count} {count === 1 ? 'resource' : 'resources'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
