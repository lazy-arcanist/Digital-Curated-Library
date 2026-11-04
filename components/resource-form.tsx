'use client'

import { useId, useState } from 'react'
import { Check, ChevronDown, Plus, Save, Trash2, X } from 'lucide-react'
import { getHostname, normalizeUrl } from '@/lib/format'
import type {
  ActionResult,
  Category,
  Resource,
  ResourceInput,
  ResourceLink,
  ResourceType,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { TagInput } from './tag-input'

interface ResourceFormProps {
  categories: Category[]
  types: ResourceType[]
  editing: Resource | null
  onSubmit: (input: ResourceInput) => Promise<ActionResult>
  onCancel: () => void
}

type FieldErrors = Partial<Record<'name' | 'description' | 'categoryId' | 'types' | 'links', string>>

interface LinkDraft {
  key: number
  label: string
  url: string
}

let draftCounter = 0
const createDraft = (link?: ResourceLink): LinkDraft => ({
  key: draftCounter++,
  label: link?.label ?? '',
  url: link?.url ?? '',
})

const fieldClass =
  'w-full rounded-xl border border-input bg-card px-3.5 text-sm transition-shadow placeholder:text-muted-foreground focus:ring-4 focus:ring-ring/20 focus:outline-none aria-invalid:border-destructive'

export function ResourceForm({ categories, types, editing, onSubmit, onCancel }: ResourceFormProps) {
  const uid = useId()
  const [name, setName] = useState(editing?.name ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? '')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(editing?.types ?? [])
  const [tags, setTags] = useState<string[]>(editing?.tags ?? [])
  const [links, setLinks] = useState<LinkDraft[]>(() =>
    editing && editing.links.length > 0 ? editing.links.map((link) => createDraft(link)) : [createDraft()],
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const [linkErrors, setLinkErrors] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const reset = () => {
    setName('')
    setDescription('')
    setCategoryId('')
    setSelectedTypes([])
    setTags([])
    setLinks([createDraft()])
    setErrors({})
    setLinkErrors({})
  }

  const toggleType = (typeName: string) => {
    setSelectedTypes((current) =>
      current.includes(typeName) ? current.filter((item) => item !== typeName) : [...current, typeName],
    )
    setErrors((current) => ({ ...current, types: undefined }))
  }

  const updateLink = (key: number, patch: Partial<Pick<LinkDraft, 'label' | 'url'>>) => {
    setLinks((current) => current.map((link) => (link.key === key ? { ...link, ...patch } : link)))
    setLinkErrors((current) => {
      if (!(key in current)) return current
      const { [key]: _removed, ...rest } = current
      return rest
    })
  }

  const addLink = () => setLinks((current) => [...current, createDraft()])

  const removeLink = (key: number) =>
    setLinks((current) => (current.length > 1 ? current.filter((link) => link.key !== key) : current))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return
    const nextErrors: FieldErrors = {}
    const nextLinkErrors: Record<number, string> = {}
    const cleanLinks: ResourceLink[] = []

    if (!name.trim()) nextErrors.name = 'Enter a name.'
    if (!description.trim()) nextErrors.description = 'Describe what this resource does.'
    if (!categoryId || !categories.some((category) => category.id === categoryId)) {
      nextErrors.categoryId = 'Choose a category.'
    }

    const validTypes = selectedTypes.filter((typeName) => types.some((item) => item.name === typeName))
    if (validTypes.length === 0) nextErrors.types = 'Choose at least one type.'

    for (const draft of links) {
      const isBlank = !draft.url.trim() && !draft.label.trim()
      if (isBlank && links.length > 1) continue // ignore empty extra rows
      const normalized = normalizeUrl(draft.url)
      if (!normalized) {
        nextLinkErrors[draft.key] = 'Enter a valid website address.'
        continue
      }
      cleanLinks.push({ label: draft.label.trim() || getHostname(normalized), url: normalized })
    }
    if (cleanLinks.length === 0 && Object.keys(nextLinkErrors).length === 0) {
      nextLinkErrors[links[0].key] = 'Enter a valid website address.'
    }

    setErrors(nextErrors)
    setLinkErrors(nextLinkErrors)
    if (Object.keys(nextErrors).length > 0 || Object.keys(nextLinkErrors).length > 0) return

    setSubmitting(true)
    setSubmitError(null)
    const result = await onSubmit({
      name: name.trim(),
      description: description.trim(),
      categoryId,
      types: validTypes,
      tags,
      links: cleanLinks,
    })
    setSubmitting(false)
    if (!result.ok) {
      setSubmitError(result.error)
      return
    }
    if (!editing) reset()
  }

  const errorId = (field: string) => `${uid}-${field}-error`

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={`${uid}-name`} className="text-sm font-medium">
          Name
        </label>
        <input
          id={`${uid}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Figma"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? errorId('name') : undefined}
          className={cn(fieldClass, 'h-11')}
        />
        <FieldError id={errorId('name')} message={errors.name} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${uid}-description`} className="text-sm font-medium">
          Description
        </label>
        <textarea
          id={`${uid}-description`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="What does it do and why is it useful?"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? errorId('description') : undefined}
          className={cn(fieldClass, 'resize-none py-2.5 leading-relaxed')}
        />
        <FieldError id={errorId('description')} message={errors.description} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${uid}-category`} className="text-sm font-medium">
          Category
        </label>
        <div className="relative">
          <select
            id={`${uid}-category`}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            aria-invalid={!!errors.categoryId}
            aria-describedby={errors.categoryId ? errorId('category') : undefined}
            className={cn(fieldClass, 'h-11 appearance-none pr-10', !categoryId && 'text-muted-foreground')}
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id} className="text-foreground">
                {category.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <FieldError id={errorId('category')} message={errors.categoryId} />
      </div>

      <fieldset className="min-w-0 space-y-1.5">
        <legend className="text-sm font-medium">
          Type <span className="font-normal text-muted-foreground">(pick one or more)</span>
        </legend>
        {types.length > 0 ? (
          <div
            className="flex flex-wrap gap-2 pt-1"
            aria-describedby={errors.types ? errorId('types') : undefined}
          >
            {types.map((option) => {
              const active = selectedTypes.includes(option.name)
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleType(option.name)}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none active:scale-95',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
                  )}
                >
                  {active && <Check className="size-3.5" aria-hidden="true" />}
                  {option.name}
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No types yet. Add some in the type manager first.</p>
        )}
        <FieldError id={errorId('types')} message={errors.types} />
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor={`${uid}-tags`} className="text-sm font-medium">
          Tags <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <TagInput id={`${uid}-tags`} tags={tags} onChange={setTags} />
        <p className="text-xs text-muted-foreground">Press Enter or comma to add a tag.</p>
      </div>

      <fieldset className="min-w-0 space-y-2">
        <legend className="text-sm font-medium">Links</legend>
        <ul className="space-y-3 pt-1">
          {links.map((draft, index) => {
            const linkError = linkErrors[draft.key]
            const linkErrorId = `${uid}-link-${draft.key}-error`
            return (
              <li key={draft.key} className="space-y-2 rounded-xl border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={draft.label}
                    onChange={(event) => updateLink(draft.key, { label: event.target.value })}
                    placeholder="Link name, e.g. Official website"
                    aria-label={`Link ${index + 1} name`}
                    className={cn(fieldClass, 'h-10 min-w-0 flex-1')}
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(draft.key)}
                    disabled={links.length === 1}
                    aria-label={`Remove link ${index + 1}`}
                    className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="url"
                  value={draft.url}
                  onChange={(event) => updateLink(draft.key, { url: event.target.value })}
                  placeholder="https://example.com"
                  aria-label={`Link ${index + 1} URL`}
                  aria-invalid={!!linkError}
                  aria-describedby={linkError ? linkErrorId : undefined}
                  className={cn(fieldClass, 'h-10')}
                />
                <FieldError id={linkErrorId} message={linkError} />
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          onClick={addLink}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-input text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add another link
        </button>
      </fieldset>

      {submitError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {submitError}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
        >
          {editing ? (
            <Save className="size-4" aria-hidden="true" />
          ) : (
            <Plus className="size-4" aria-hidden="true" />
          )}
          {submitting ? 'Saving…' : editing ? 'Save changes' : 'Add resource'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-secondary px-5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <X className="size-4" aria-hidden="true" />
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  )
}
