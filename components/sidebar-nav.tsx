'use client'

import { Bookmark, History, House, LayoutGrid, Library, Lock, LockOpen } from 'lucide-react'
import { useLibrary } from '@/lib/library-store'
import { cn } from '@/lib/utils'

export type View = 'home' | 'library' | 'history' | 'bookmarks' | 'admin'

const mainItems: { id: View; label: string; icon: typeof House }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'library', label: 'All Resources', icon: LayoutGrid },
  { id: 'history', label: 'History', icon: History },
  { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
]

interface SidebarNavProps {
  view: View
  adminUnlocked: boolean
  onSelect: (view: View) => void
  onLockAdmin: () => void
}

export function SidebarNav({ view, adminUnlocked, onSelect, onLockAdmin }: SidebarNavProps) {
  const { bookmarkedResources } = useLibrary()

  return (
    <aside className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-md md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col md:border-r md:border-b-0 md:px-4 md:py-6">
      <div className="flex h-14 items-center gap-2.5 px-4 md:h-auto md:px-2 md:pb-6">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Library className="size-5" aria-hidden="true" />
        </span>
        <span className="text-base font-semibold tracking-tight">Curated Library</span>
      </div>

      <nav aria-label="Primary" className="md:flex md:flex-1 md:flex-col">
        <ul className="flex gap-1 overflow-x-auto px-3 pb-2 md:flex-1 md:flex-col md:overflow-visible md:px-0 md:pb-0">
          {mainItems.map(({ id, label, icon: Icon }) => (
            <li key={id} className="shrink-0">
              <NavButton active={view === id} onClick={() => onSelect(id)}>
                <Icon className="size-4.5" aria-hidden="true" />
                <span>{label}</span>
                {id === 'bookmarks' && bookmarkedResources.length > 0 && (
                  <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary tabular-nums">
                    {bookmarkedResources.length}
                  </span>
                )}
              </NavButton>
            </li>
          ))}

          <li className="shrink-0 md:mt-auto md:border-t md:border-border/70 md:pt-3">
            <NavButton active={view === 'admin'} onClick={() => onSelect('admin')}>
              {adminUnlocked ? (
                <LockOpen className="size-4.5" aria-hidden="true" />
              ) : (
                <Lock className="size-4.5" aria-hidden="true" />
              )}
              <span>Admin</span>
            </NavButton>
            {adminUnlocked && (
              <button
                type="button"
                onClick={onLockAdmin}
                className="mt-1 hidden w-full rounded-lg px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:block"
              >
                Lock admin
              </button>
            )}
          </li>
        </ul>
      </nav>
    </aside>
  )
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:py-2.5',
        active
          ? 'bg-secondary text-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
