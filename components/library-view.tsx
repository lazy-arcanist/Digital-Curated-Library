'use client'

import { useMemo, useState } from 'react'
import { SearchX } from 'lucide-react'
import { useLibrary } from '@/lib/library-store'
import { cn } from '@/lib/utils'
import { PageHeader } from './page-header'
import { ResourceCard } from './resource-card'
import { SearchInput } from './search-input'

const ALL = 'all'

export function LibraryView({ initialCategory }: { initialCategory?: string }) {
  const { resources, categories } = useLibrary()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory ?? ALL)

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

  const effectiveCategory = categoryNames.has(activeCategory) ? activeCategory : ALL
  const selectedCategory = categoryNames.get(effectiveCategory) ?? null

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase().replace(/^#/, '')
    return resources.filter((resource) => {
      if (effectiveCategory !== ALL && resource.categoryId !== effectiveCategory) return false
      if (!term) return true
      const haystack = [
        resource.name,
        resource.description,
        categoryNames.get(resource.categoryId) ?? '',
        ...resource.tags,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [resources, query, effectiveCategory, categoryNames])

  return (
    <div>
      <PageHeader
        eyebrow="All Resources"
        title="Browse the full library"
        description="Search by name, topic or tag, or filter by category."
      />
      <div className="mt-6 max-w-2xl">
        <SearchInput value={query} onChange={setQuery} />
      </div>

      <nav aria-label="Filter by category" className="mt-6">
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <li className="shrink-0">
            <CategoryTab
              label="All"
              count={resources.length}
              active={effectiveCategory === ALL}
              onClick={() => setActiveCategory(ALL)}
            />
          </li>
          {categories.map((category) => (
            <li key={category.id} className="shrink-0">
              <CategoryTab
                label={category.name}
                count={countsByCategory.get(category.id) ?? 0}
                active={effectiveCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
              />
            </li>
          ))}
        </ul>
      </nav>

      <p className="mt-8 text-sm text-muted-foreground" role="status" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'resource' : 'resources'}
        {selectedCategory ? ` in ${selectedCategory}` : ''}
        {query.trim() ? ` matching “${query.trim()}”` : ''}
      </p>

      {filtered.length > 0 ? (
          <ul className="mt-4 grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((resource) => (
              <li key={resource.id} className="h-full animate-in duration-300 fade-in slide-in-from-bottom-2">
              <ResourceCard
                resource={resource}
                categoryName={categoryNames.get(resource.categoryId) ?? 'Uncategorized'}
                onTagClick={setQuery}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold">No resources found</h2>
          <p className="mt-1 max-w-sm text-sm text-pretty text-muted-foreground">
            Try a different search term or switch to another category.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setActiveCategory(ALL)
            }}
            className="mt-5 rounded-full bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  )
}

interface CategoryTabProps {
  label: string
  count: number
  active: boolean
  onClick: () => void
}

function CategoryTab({ label, count, active, onClick }: CategoryTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:scale-95',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
      )}
    >
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-xs tabular-nums',
          active ? 'bg-primary-foreground/20' : 'bg-secondary',
        )}
      >
        {count}
      </span>
    </button>
  )
}
