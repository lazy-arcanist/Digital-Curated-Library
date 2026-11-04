'use client'

import { useState } from 'react'
import { LibraryProvider, useLibrary } from '@/lib/library-store'
import { AdminGateDialog } from './admin-gate-dialog'
import { AdminView } from './admin-view'
import { BookmarksView } from './bookmarks-view'
import { HistoryView } from './history-view'
import { HomeView } from './home-view'
import { LibraryView } from './library-view'
import { ResourceDetailProvider } from './resource-detail'
import { SidebarNav, type View } from './sidebar-nav'

export function LibraryApp() {
  const [view, setView] = useState<View>('home')
  const [libraryCategory, setLibraryCategory] = useState<string | undefined>()
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)

  const select = (next: View) => {
    if (next === 'admin' && !adminUnlocked) {
      setGateOpen(true)
      return
    }
    if (next === 'library') setLibraryCategory(undefined)
    setView(next)
  }

  const openCategory = (categoryId: string) => {
    setLibraryCategory(categoryId)
    setView('library')
  }

  const lockAdmin = () => {
    setAdminUnlocked(false)
    if (view === 'admin') setView('home')
  }

  return (
    <LibraryProvider>
      <ResourceDetailProvider>
      <div className="min-h-dvh md:pl-64">
        <SidebarNav view={view} adminUnlocked={adminUnlocked} onSelect={select} onLockAdmin={lockAdmin} />

        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:px-10 md:py-14">
          <div
            key={`${view}:${libraryCategory ?? ''}`}
            className="animate-in duration-300 fade-in slide-in-from-bottom-1"
          >
            <ActiveView
              view={view}
              libraryCategory={libraryCategory}
              onOpenCategory={openCategory}
              onOpenAll={() => select('library')}
            />
          </div>
        </main>

        <AdminGateDialog
          open={gateOpen}
          onClose={() => setGateOpen(false)}
          onUnlock={() => {
            setAdminUnlocked(true)
            setGateOpen(false)
            setView('admin')
          }}
        />
      </div>
      </ResourceDetailProvider>
    </LibraryProvider>
  )
}

interface ActiveViewProps {
  view: View
  libraryCategory: string | undefined
  onOpenCategory: (categoryId: string) => void
  onOpenAll: () => void
}

function ActiveView({ view, libraryCategory, onOpenCategory, onOpenAll }: ActiveViewProps) {
  const { isLoading, loadError, reload } = useLibrary()

  if (loadError) {
    return (
      <div role="alert" className="max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
        <p className="text-sm font-medium text-destructive">{loadError}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-3 inline-flex h-10 items-center rounded-full bg-secondary px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Try again
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading your library…
      </p>
    )
  }

  switch (view) {
    case 'home':
      return <HomeView onOpenCategory={onOpenCategory} onOpenAll={onOpenAll} />
    case 'library':
      return <LibraryView initialCategory={libraryCategory} />
    case 'history':
      return <HistoryView />
    case 'bookmarks':
      return <BookmarksView />
    case 'admin':
      return <AdminView />
  }
}
