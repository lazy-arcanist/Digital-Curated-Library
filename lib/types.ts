export interface Category {
  id: string
  name: string
  createdAt: string
}

export interface ResourceType {
  id: string
  name: string
  createdAt: string
}

export interface ResourceLink {
  /** Display name, e.g. "Official website". */
  label: string
  url: string
}

export interface Resource {
  id: string
  name: string
  description: string
  /** Every resource belongs to exactly one category. */
  categoryId: string
  /** One or more type names, e.g. ["Website", "GitHub"]. */
  types: string[]
  tags: string[]
  /** Every link of this resource, in the order they were added. */
  links: ResourceLink[]
  /** URL of the first link, for cards and lists that show a single address. */
  url: string
  createdAt: string
  updatedAt: string
  isBookmarked: boolean
}

/** Where bookmark state lives: the `is_bookmarked` column in Supabase, or this browser until that column exists. */
export type BookmarkStorage = 'database' | 'browser'

export interface ResourceInput {
  name: string
  description: string
  categoryId: string
  types: string[]
  tags: string[]
  links: ResourceLink[]
}

export type ActionResult = { ok: true } | { ok: false; error: string }

/** `database` is the exact size reported by Postgres; `estimate` is derived from the stored rows. */
export type StorageSource = 'database' | 'estimate'

export interface StorageUsage {
  usedBytes: number
  limitBytes: number
  /** 0-100, not clamped for display so an over-limit database is visible. */
  percent: number
  source: StorageSource
}
