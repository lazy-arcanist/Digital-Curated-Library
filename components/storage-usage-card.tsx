'use client'

import useSWR from 'swr'
import { Database, Info, RefreshCw } from 'lucide-react'
import { formatMegabytes, formatPercent } from '@/lib/format'
import { useLibrary } from '@/lib/library-store'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'supabase:storage-usage'
const REFRESH_INTERVAL_MS = 30_000
const WARNING_PERCENT = 90

const ENABLE_EXACT_SIZE_SQL = `create or replace function public.get_database_size()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$ select pg_catalog.pg_database_size(pg_catalog.current_database()); $$;

grant execute on function public.get_database_size() to anon, authenticated;`

export function StorageUsageCard({ className }: { className?: string }) {
  const { resources, categories, getStorageUsage } = useLibrary()

  // Resource and category counts are part of the key so the figure refreshes as soon as rows are added or removed.
  const { data, error, isValidating, mutate } = useSWR(
    [STORAGE_KEY, resources.length, categories.length],
    () => getStorageUsage(),
    { refreshInterval: REFRESH_INTERVAL_MS, keepPreviousData: true, revalidateOnFocus: true },
  )

  const barPercent = data ? Math.min(100, data.usedBytes > 0 ? Math.max(data.percent, 1) : 0) : 0
  const nearLimit = (data?.percent ?? 0) >= WARNING_PERCENT

  return (
    <section
      aria-labelledby="storage-heading"
      className={cn(
        'rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_oklch(0.2_0_0/0.04)] sm:p-6',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
            <Database className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="storage-heading" className="text-lg font-semibold tracking-tight">
              Database storage usage
            </h2>
            <p className="text-sm text-muted-foreground">Supabase Free plan, 500 MB limit</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void mutate()}
          disabled={isValidating}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none"
        >
          <RefreshCw className={cn('size-4', isValidating && 'animate-spin')} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {data ? (
        <div className="mt-6">
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm" role="status" aria-live="polite">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {formatMegabytes(data.usedBytes)}
            </span>
            <span className="text-muted-foreground tabular-nums">
              / {Math.round(data.limitBytes / (1024 * 1024))} MB used ({formatPercent(data.percent)})
            </span>
          </p>
          <div
            role="progressbar"
            aria-label="Database storage used"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(100, Number(data.percent.toFixed(2)))}
            aria-valuetext={`${formatMegabytes(data.usedBytes)} of 500 MB used`}
            className="mt-3 h-3 overflow-hidden rounded-full bg-secondary"
          >
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-700 ease-out',
                nearLimit ? 'bg-destructive' : 'bg-primary',
              )}
              style={{ width: `${barPercent}%` }}
            />
          </div>

          {data.source === 'estimate' && (
            <aside
              aria-label="Storage estimate"
              className="mt-5 flex gap-3 rounded-xl border border-border bg-secondary/60 p-4 text-sm"
            >
              <Info className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0 space-y-2">
                <p className="leading-relaxed text-pretty text-muted-foreground">
                  This is an estimate from the rows in your tables. Supabase does not expose database size
                  to the client by default. Run this once in the Supabase SQL editor to show the exact
                  size:
                </p>
                <pre className="overflow-x-auto rounded-lg bg-background p-3 font-mono text-xs leading-relaxed text-foreground select-all">
                  {ENABLE_EXACT_SIZE_SQL}
                </pre>
              </div>
            </aside>
          )}
        </div>
      ) : error ? (
        <p role="alert" className="mt-6 text-sm font-medium text-destructive">
          Could not measure database storage. Try refreshing.
        </p>
      ) : (
        <p role="status" className="mt-6 text-sm text-muted-foreground">
          Measuring storage…
        </p>
      )}
    </section>
  )
}
