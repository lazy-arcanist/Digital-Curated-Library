const pad = (value: number) => String(value).padStart(2, '0')

/** DD/MM/YYYY */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

/** DD/MM/YYYY, HH:mm */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return `${formatDate(iso)}, ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

/** "2 hours ago", "yesterday", "just now". Future timestamps (clock skew) read as "just now". */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  if (seconds > -60) return 'just now'
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) return relativeFormatter.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

export interface Activity {
  kind: 'added' | 'modified'
  at: string
  label: string
}

/** A resource counts as modified once `updated_at` moves meaningfully past `created_at`. */
export function describeActivity(createdAt: string, updatedAt: string, now: number = Date.now()): Activity {
  const wasModified = new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 2_000
  const kind = wasModified ? 'modified' : 'added'
  const at = wasModified ? updatedAt : createdAt
  const prefix = kind === 'added' ? 'Added' : 'Modified'
  return { kind, at, label: `${prefix} ${formatRelativeTime(at, now)}` }
}

const BYTES_PER_MB = 1024 * 1024

/** "0.45 MB", or "<0.01 MB" for anything smaller than a visible step. */
export function formatMegabytes(bytes: number): string {
  const megabytes = bytes / BYTES_PER_MB
  if (megabytes > 0 && megabytes < 0.01) return '<0.01 MB'
  return `${megabytes.toFixed(2)} MB`
}

/** "0.09%", or "<0.01%" for anything smaller than a visible step. */
export function formatPercent(percent: number): string {
  if (percent > 0 && percent < 0.01) return '<0.01%'
  return `${percent.toFixed(2)}%`
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Adds https:// when missing and returns null if the result is not a valid http(s) URL. */
export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const parsed = new URL(candidate)
    if (!parsed.hostname.includes('.')) return null
    return parsed.toString()
  } catch {
    return null
  }
}

export function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/^#/, '')
}
