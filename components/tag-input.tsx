'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { normalizeTag } from '@/lib/format'

interface TagInputProps {
  id: string
  tags: string[]
  onChange: (tags: string[]) => void
}

export function TagInput({ id, tags, onChange }: TagInputProps) {
  const [draft, setDraft] = useState('')

  const commit = (raw: string) => {
    const additions = raw
      .split(',')
      .map(normalizeTag)
      .filter((tag) => tag && !tags.includes(tag))
    if (additions.length > 0) onChange([...tags, ...new Set(additions)])
    setDraft('')
  }

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-input bg-card px-2.5 py-2 transition-shadow focus-within:ring-4 focus-within:ring-ring/20">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-accent py-0.5 pr-1 pl-2 text-xs font-medium text-accent-foreground"
        >
          #{tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((current) => current !== tag))}
            aria-label={`Remove tag ${tag}`}
            className="grid size-4 place-items-center rounded transition-colors hover:bg-primary/15"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => {
          const value = event.target.value
          if (value.includes(',')) commit(value)
          else setDraft(value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            if (event.nativeEvent.isComposing || event.keyCode === 229) return
            commit(draft)
          } else if (event.key === 'Backspace' && !draft && tags.length > 0) {
            onChange(tags.slice(0, -1))
          }
        }}
        onBlur={() => draft && commit(draft)}
        placeholder={tags.length === 0 ? 'Type a tag and press Enter' : 'Add another…'}
        className="min-w-32 flex-1 bg-transparent py-0.5 text-sm placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  )
}
