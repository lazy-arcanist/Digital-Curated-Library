'use client'

import { createContext, useCallback, useContext, useMemo } from 'react'
import useSWR from 'swr'
import { getSupabase } from './supabase/client'
import type {
  ActionResult,
  BookmarkStorage,
  Category,
  Resource,
  ResourceInput,
  ResourceLink,
  ResourceType,
  StorageSource,
  StorageUsage,
} from './types'

const RECENT_LIMIT = 4

interface LibraryContextValue {
  resources: Resource[]
  categories: Category[]
  types: ResourceType[]

  /** Newest four resources by `created_at`. */
  recentResources: Resource[]
  /** Every resource ordered by its latest activity (`updated_at`). */

  historyResources: Resource[]
  bookmarkedResources: Resource[]
  bookmarkStorage: BookmarkStorage

  isLoading: boolean
  loadError: string | null
  reload: () => Promise<void>

  addResource: (input: ResourceInput) => Promise<ActionResult>
  updateResource: (id: string, input: ResourceInput) => Promise<ActionResult>
  deleteResource: (id: string) => Promise<ActionResult>

  toggleBookmark: (id: string) => Promise<ActionResult>

  addCategory: (name: string) => Promise<ActionResult>
  deleteCategory: (id: string) => Promise<ActionResult>

  addType: (name: string) => Promise<ActionResult>
  deleteType: (id: string) => Promise<ActionResult>

  getStorageUsage: () => Promise<StorageUsage>
}

interface CategoryRow {
  id: number
  name: string
  created_at: string
}

interface TypeRow {
  id: number
  name: string
  created_at: string
}

interface ResourceRow {
  id: number
  name: string
  description: string | null
  category_id: number | null
  /** Legacy single type, kept in sync with the first entry of `types`. */
  type: string | null
  types: string[] | null
  tags: string[] | null
  /** Legacy single URL, kept in sync with the first entry of `links`. */
  url: string | null
  links: unknown
  created_at: string
  updated_at: string
  is_bookmarked?: boolean | null
}

interface LibraryData {
  resources: Resource[]
  categories: Category[]
  types: ResourceType[]
  bookmarkStorage: BookmarkStorage
}

const LIBRARY_KEY = 'supabase:library'
const LOCAL_BOOKMARKS_KEY = 'library:bookmarks'
const UNDEFINED_COLUMN = '42703'
const UNIQUE_VIOLATION = '23505'
const FOREIGN_KEY_VIOLATION = '23503'

const BASE_COLUMNS = 'id, name, description, category_id, type, types, tags, url, links, created_at, updated_at'

const LibraryContext = createContext<LibraryContextValue | null>(null)

function readLocalBookmarks(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(LOCAL_BOOKMARKS_KEY) ?? '[]')
    return new Set(Array.isArray(parsed) ? parsed.map(String) : [])
  } catch {
    return new Set()
  }
}

function writeLocalBookmarks(ids: Set<string>) {
  window.localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify([...ids]))
}

const toCategory = (row: CategoryRow): Category => ({
  id: String(row.id),
  name: row.name,
  createdAt: row.created_at,
})

const toType = (row: TypeRow): ResourceType => ({
  id: String(row.id),
  name: row.name,
  createdAt: row.created_at,
})

/** Reads the `links` JSON column, falling back to the legacy `url` column for rows without links. */
function toLinks(raw: unknown, legacyUrl: string | null): ResourceLink[] {
  if (Array.isArray(raw)) {
    const links = raw.flatMap((item): ResourceLink[] => {
      if (!item || typeof item !== 'object') return []
      const { label, url } = item as { label?: unknown; url?: unknown }
      if (typeof url !== 'string' || !url) return []
      return [{ label: typeof label === 'string' ? label : '', url }]
    })
    if (links.length > 0) return links
  }
  return legacyUrl ? [{ label: 'Link', url: legacyUrl }] : []
}

const toResource = (row: ResourceRow, isBookmarked: boolean): Resource => {
  const links = toLinks(row.links, row.url)
  return {
    id: String(row.id),
    name: row.name,
    description: row.description ?? '',
    categoryId: row.category_id === null ? '' : String(row.category_id),
    types: row.types && row.types.length > 0 ? row.types : row.type ? [row.type] : [],
    tags: row.tags ?? [],
    links,
    url: links[0]?.url ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isBookmarked,
  }
}

const toResourceColumns = (input: ResourceInput) => ({
  name: input.name,
  description: input.description,
  category_id: Number(input.categoryId),
  types: input.types,
  tags: input.tags,
  links: input.links,
  // Legacy single-value columns stay in sync with the first entry so older constraints keep working.
  type: input.types[0] ?? null,
  url: input.links[0]?.url ?? '',
})

async function fetchResourceRows() {
  const supabase = getSupabase()
  const withBookmarks = await supabase
    .from('resources')
    .select(`${BASE_COLUMNS}, is_bookmarked`)
    .order('created_at', { ascending: false })

  if (withBookmarks.error?.code !== UNDEFINED_COLUMN) {
    return { result: withBookmarks, bookmarkStorage: 'database' as const }
  }

  // The `is_bookmarked` column has not been added yet, so read without it and keep bookmarks in this browser.
  const withoutBookmarks = await supabase
    .from('resources')
    .select(BASE_COLUMNS)
    .order('created_at', { ascending: false })
  return { result: withoutBookmarks, bookmarkStorage: 'browser' as const }
}

async function fetchLibrary(): Promise<LibraryData> {
  const [categoriesResult, typesResult, { result: resourcesResult, bookmarkStorage }] = await Promise.all([
    getSupabase().from('categories').select('id, name, created_at').order('id', { ascending: true }),
    getSupabase().from('types').select('id, name, created_at').order('id', { ascending: true }),
    fetchResourceRows(),
  ])
  if (categoriesResult.error) throw categoriesResult.error
  if (typesResult.error) throw typesResult.error
  if (resourcesResult.error) throw resourcesResult.error

  const localBookmarks = bookmarkStorage === 'browser' ? readLocalBookmarks() : null
  return {
    bookmarkStorage,
    categories: (categoriesResult.data as CategoryRow[]).map(toCategory),
    types: (typesResult.data as TypeRow[]).map(toType),
    resources: (resourcesResult.data as unknown as ResourceRow[]).map((row) =>
      toResource(row, localBookmarks ? localBookmarks.has(String(row.id)) : Boolean(row.is_bookmarked)),
    ),
  }
}

/** Supabase Free plan database size limit. */
const STORAGE_LIMIT_BYTES = 500 * 1024 * 1024

/** Tuple header, line pointer, fixed-width columns and the primary-key index entry for one row. */
const ROW_OVERHEAD_BYTES = 96

const textEncoder = new TextEncoder()
const byteLength = (value: string | null | undefined) => (value ? textEncoder.encode(value).length : 0)

const toStorageUsage = (usedBytes: number, source: StorageSource): StorageUsage => ({
  usedBytes,
  limitBytes: STORAGE_LIMIT_BYTES,
  percent: (usedBytes / STORAGE_LIMIT_BYTES) * 100,
  source,
})

/** Approximates table size from the text actually stored, used when the size function is not installed. */
async function estimateTableBytes(): Promise<number> {
  const supabase = getSupabase()
  const [resourcesResult, categoriesResult] = await Promise.all([
    supabase.from('resources').select('name, description, tags, url, links'),
    supabase.from('categories').select('name'),
  ])
  if (resourcesResult.error) throw resourcesResult.error
  if (categoriesResult.error) throw categoriesResult.error

  const resourceRows = resourcesResult.data as Pick<ResourceRow, 'name' | 'description' | 'tags' | 'url' | 'links'>[]
  const categoryRows = categoriesResult.data as Pick<CategoryRow, 'name'>[]

  const resourceBytes = resourceRows.reduce(
    (total, row) =>
      total +
      ROW_OVERHEAD_BYTES +
      byteLength(row.name) +
      byteLength(row.description) +
      byteLength(row.url) +
      byteLength(JSON.stringify(row.links ?? [])) +
      (row.tags ?? []).reduce((tagBytes, tag) => tagBytes + byteLength(tag) + 4, 0),
    0,
  )
  const categoryBytes = categoryRows.reduce((total, row) => total + ROW_OVERHEAD_BYTES + byteLength(row.name), 0)
  return resourceBytes + categoryBytes
}

/**
 * Reads the real database size through the `get_database_size` RPC. PostgREST does not expose system
 * catalogs, so when that function has not been created yet this falls back to an estimate from the rows.
 */
export async function fetchStorageUsage(): Promise<StorageUsage> {
  const { data, error } = await getSupabase().rpc('get_database_size')
  const exactBytes = Number(data)
  if (!error && data !== null && Number.isFinite(exactBytes)) {
    return toStorageUsage(exactBytes, 'database')
  }
  return toStorageUsage(await estimateTableBytes(), 'estimate')
}

const failure = (message: string): ActionResult => ({ ok: false, error: message })

const byNewest = (a: Resource, b: Resource) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

const byLatestActivity = (a: Resource, b: Resource) =>
  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()

/** Single source of truth for resources and categories, backed by the Supabase `categories` and `resources` tables. */
export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { data, error, isLoading, mutate } = useSWR<LibraryData>(LIBRARY_KEY, fetchLibrary, {
    revalidateOnFocus: false,
  })

  const resources = useMemo(() => data?.resources ?? [], [data])
  const categories = useMemo(() => data?.categories ?? [], [data])
  const types = useMemo(() => data?.types ?? [], [data])
  const bookmarkStorage = data?.bookmarkStorage ?? 'database'

  const recentResources = useMemo(() => [...resources].sort(byNewest).slice(0, RECENT_LIMIT), [resources])
  const historyResources = useMemo(() => [...resources].sort(byLatestActivity), [resources])
  const bookmarkedResources = useMemo(
    () => resources.filter((resource) => resource.isBookmarked).sort(byLatestActivity),
    [resources],
  )

  const reload = useCallback(async () => {
    await mutate()
  }, [mutate])

  const addResource = useCallback(
    async (input: ResourceInput): Promise<ActionResult> => {
      if (!Number.isFinite(Number(input.categoryId))) return failure('Choose a category.')
      const { error: insertError } = await getSupabase().from('resources').insert(toResourceColumns(input))
      if (insertError) return failure('Could not save the resource. Please try again.')
      await mutate()
      return { ok: true }
    },
    [mutate],
  )

  const updateResource = useCallback(
    async (id: string, input: ResourceInput): Promise<ActionResult> => {
      if (!Number.isFinite(Number(input.categoryId))) return failure('Choose a category.')
      const { error: updateError } = await getSupabase()
        .from('resources')
        .update({ ...toResourceColumns(input), updated_at: new Date().toISOString() })
        .eq('id', Number(id))
      if (updateError) return failure('Could not update the resource. Please try again.')
      await mutate()
      return { ok: true }
    },
    [mutate],
  )

  const deleteResource = useCallback(
    async (id: string): Promise<ActionResult> => {
      const { error: deleteError } = await getSupabase().from('resources').delete().eq('id', Number(id))
      if (deleteError) return failure('Could not delete the resource. Please try again.')
      if (bookmarkStorage === 'browser') {
        const ids = readLocalBookmarks()
        if (ids.delete(id)) writeLocalBookmarks(ids)
      }
      await mutate()
      return { ok: true }
    },
    [bookmarkStorage, mutate],
  )

  const toggleBookmark = useCallback(
    async (id: string): Promise<ActionResult> => {
      const current = resources.find((resource) => resource.id === id)
      if (!current) return failure('This resource no longer exists.')
      const next = !current.isBookmarked

      // Flip the icon immediately; bookmarking never touches `updated_at`, so History order is unaffected.
      await mutate(
        (snapshot) =>
          snapshot && {
            ...snapshot,
            resources: snapshot.resources.map((resource) =>
              resource.id === id ? { ...resource, isBookmarked: next } : resource,
            ),
          },
        { revalidate: false },
      )

      if (bookmarkStorage === 'browser') {
        const ids = readLocalBookmarks()
        if (next) ids.add(id)
        else ids.delete(id)
        writeLocalBookmarks(ids)
        return { ok: true }
      }

      const { error: updateError } = await getSupabase()
        .from('resources')
        .update({ is_bookmarked: next })
        .eq('id', Number(id))
      if (updateError) {
        await mutate()
        return failure('Could not update the bookmark. Please try again.')
      }
      return { ok: true }
    },
    [resources, bookmarkStorage, mutate],
  )

  const addCategory = useCallback(
    async (name: string): Promise<ActionResult> => {
      const trimmed = name.trim().replace(/\s+/g, ' ')
      if (!trimmed) return failure('Enter a category name.')
      if (trimmed.length > 40) return failure('Keep the name under 40 characters.')
      if (categories.some((category) => category.name.toLowerCase() === trimmed.toLowerCase())) {
        return failure('A category with this name already exists.')
      }
      const { error: insertError } = await getSupabase().from('categories').insert({ name: trimmed })
      if (insertError) {
        return failure(
          insertError.code === UNIQUE_VIOLATION
            ? 'A category with this name already exists.'
            : 'Could not add the category. Please try again.',
        )
      }
      await mutate()
      return { ok: true }
    },
    [categories, mutate],
  )

  const deleteCategory = useCallback(
    async (id: string): Promise<ActionResult> => {
      if (resources.some((resource) => resource.categoryId === id)) {
        return failure('Move or delete the resources in this category first.')
      }
      const { error: deleteError } = await getSupabase().from('categories').delete().eq('id', Number(id))
      if (deleteError) {
        return failure(
          deleteError.code === FOREIGN_KEY_VIOLATION
            ? 'Move or delete the resources in this category first.'
            : 'Could not delete the category. Please try again.',
        )
      }
      await mutate()
      return { ok: true }
    },
    [resources, mutate],
  )

  const addType = useCallback(
    async (name: string): Promise<ActionResult> => {
      const trimmed = name.trim().replace(/\s+/g, ' ')
      if (!trimmed) return failure('Enter a type name.')
      if (trimmed.length > 40) return failure('Keep the name under 40 characters.')
      if (types.some((item) => item.name.toLowerCase() === trimmed.toLowerCase())) {
        return failure('A type with this name already exists.')
      }
      const { error: insertError } = await getSupabase().from('types').insert({ name: trimmed })
      if (insertError) {
        return failure(
          insertError.code === UNIQUE_VIOLATION
            ? 'A type with this name already exists.'
            : 'Could not add the type. Please try again.',
        )
      }
      await mutate()
      return { ok: true }
    },
    [types, mutate],
  )

  const deleteType = useCallback(
    async (id: string): Promise<ActionResult> => {
      const target = types.find((item) => item.id === id)
      if (!target) return failure('This type no longer exists.')
      if (resources.some((resource) => resource.types.includes(target.name))) {
        return failure('Move or delete the resources of this type first.')
      }
      const { error: deleteError } = await getSupabase().from('types').delete().eq('id', Number(id))
      if (deleteError) return failure('Could not delete the type. Please try again.')
      await mutate()
      return { ok: true }
    },
    [types, resources, mutate],
  )

  const value = useMemo(
    () => ({
      resources,
      categories,
      types,
      recentResources,
      historyResources,
      bookmarkedResources,
      bookmarkStorage,
      isLoading,
      loadError: error ? 'Could not load the library from Supabase.' : null,
      reload,
      addResource,
      updateResource,
      deleteResource,
      toggleBookmark,
      addCategory,
      deleteCategory,
      addType,
      deleteType,
      getStorageUsage: fetchStorageUsage,
    }),
    [
      resources,
      categories,
      types,
      recentResources,
      historyResources,
      bookmarkedResources,
      bookmarkStorage,
      isLoading,
      error,
      reload,
      addResource,
      updateResource,
      deleteResource,
      toggleBookmark,
      addCategory,
      deleteCategory,
      addType,
      deleteType,
    ],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const context = useContext(LibraryContext)
  if (!context) throw new Error('useLibrary must be used within a LibraryProvider')
  return context
}
