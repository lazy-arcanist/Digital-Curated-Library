'use client'

import { Bookmark } from 'lucide-react'
import { useLibrary } from '@/lib/library-store'
import { cn } from '@/lib/utils'
import type { Resource } from '@/lib/types'

export function BookmarkButton({ resource, className }: { resource: Resource; className?: string }) {
  const { toggleBookmark } = useLibrary()
  const saved = resource.isBookmarked

  return (
    <button
      type="button"
      onClick={() => void toggleBookmark(resource.id)}
      aria-pressed={saved}
      aria-label={`${saved ? 'Remove bookmark from' : 'Bookmark'} ${resource.name}`}
      title={saved ? 'Remove bookmark' : 'Save for later'}
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-90',
        saved
          ? 'bg-primary/15 text-primary hover:bg-primary/25'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        className,
      )}
    >
      <Bookmark className={cn('size-4.5', saved && 'fill-current')} aria-hidden="true" />
    </button>
  )
}
