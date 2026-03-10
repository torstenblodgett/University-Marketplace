'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { listingSchema, CATEGORIES } from '@/lib/validators/listings'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { Database } from '@/types/database'

type Listing = Database['public']['Tables']['listings']['Row']

interface ListingFormProps {
  mode: 'create' | 'edit'
  sellerId: string
  listing?: Listing
}

type FieldErrors = Partial<Record<string, string>>

const LOCATION_SUGGESTIONS = [
  'Milton-Parc', 'Plateau-Mont-Royal', 'Côte-des-Neiges', 'NDG',
  'Downtown', 'McGill Residences', 'Other',
]

const MAX_IMAGES = 5
const MAX_FILE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/* ── Camera icon (Heroicons outline) ── */
function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
  )
}

export function ListingForm({ mode, sellerId, listing }: ListingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [listingType, setListingType] = useState<'good' | 'service'>(
    listing?.listing_type ?? 'good'
  )
  const locationRef = useRef<HTMLInputElement>(null)

  // Image state
  const existingImages: string[] = listing?.images ?? []
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([])

  // Revoke object URLs when component unmounts to avoid memory leaks
  useEffect(() => {
    return () => { pendingPreviews.forEach(URL.revokeObjectURL) }
  }, [pendingPreviews])

  const totalImages = existingImages.length + pendingFiles.length
  const canAddMore = totalImages < MAX_IMAGES

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // allow re-selecting same file

    const remaining = MAX_IMAGES - existingImages.length - pendingFiles.length
    const toAdd: File[] = []

    for (const f of files) {
      if (toAdd.length >= remaining) break
      if (!ALLOWED_TYPES.includes(f.type)) {
        setServerError(`${f.name}: only JPEG, PNG, or WebP images are allowed.`)
        return
      }
      if (f.size > MAX_FILE_BYTES) {
        setServerError(`${f.name}: images must be 5 MB or smaller.`)
        return
      }
      toAdd.push(f)
    }

    if (toAdd.length === 0) return
    setServerError('')

    const newPreviews = toAdd.map(f => URL.createObjectURL(f))
    setPendingFiles(prev => [...prev, ...toAdd])
    setPendingPreviews(prev => [...prev, ...newPreviews])
  }

  function removePending(index: number) {
    URL.revokeObjectURL(pendingPreviews[index])
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
    setPendingPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadPendingImages(): Promise<string[]> {
    if (pendingFiles.length === 0) return []
    const supabase = createClient()
    const urls: string[] = []

    for (const file of pendingFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${sellerId}/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(path, file, { contentType: file.type })
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
      const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
      urls.push(data.publicUrl)
    }

    return urls
  }

  const filteredCategories = CATEGORIES.filter(c => c.type === listingType)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError('')
    setFieldErrors({})

    const form = new FormData(e.currentTarget)
    const raw = {
      title: form.get('title') as string,
      description: form.get('description') as string,
      listing_type: form.get('listing_type') as string,
      category: form.get('category') as string,
      price: form.get('price') as string,
      location: form.get('location') as string,
      availability: form.get('availability') as string,
      service_area: form.get('service_area') as string,
    }

    const result = listingSchema.safeParse(raw)
    if (!result.success) {
      const errors: FieldErrors = {}
      result.error.issues.forEach(issue => {
        const field = String(issue.path[0])
        if (!errors[field]) errors[field] = issue.message
      })
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      const newImageUrls = await uploadPendingImages()
      const imageUrls = [...existingImages, ...newImageUrls]

      const supabase = createClient()

      if (mode === 'create') {
        const { data, error } = await supabase
          .from('listings')
          .insert({
            seller_id: sellerId,
            title: result.data.title,
            description: result.data.description,
            listing_type: result.data.listing_type,
            category: result.data.category as Listing['category'],
            price: result.data.price,
            location: result.data.location,
            images: imageUrls,
          })
          .select('id')
          .single()

        if (error) { setServerError(error.message); return }
        router.push(`/listings/${data.id}`)
      } else if (listing) {
        const { error } = await supabase
          .from('listings')
          .update({
            title: result.data.title,
            description: result.data.description,
            listing_type: result.data.listing_type,
            category: result.data.category as Listing['category'],
            price: result.data.price,
            location: result.data.location,
            images: imageUrls,
          })
          .eq('id', listing.id)
          .eq('seller_id', sellerId)

        if (error) { setServerError(error.message); return }
        router.push(`/listings/${listing.id}`)
      }

      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!listing || !confirm('Delete this listing? This cannot be undone.')) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('listings')
        .update({ status: 'removed' })
        .eq('id', listing.id)
        .eq('seller_id', sellerId)

      if (error) { setServerError(error.message); return }
      router.push('/profile/me')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>

      {/* ──────────────────────────────────────────────────────
          1. PHOTOS — top and prominent (Facebook Marketplace style)
         ────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[#1A1A1A]">
          Photos{' '}
          <span className="font-normal text-gray-400">(optional · up to {MAX_IMAGES})</span>
        </p>

        {/* 5-slot photo grid */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">

          {/* Existing images (edit mode) */}
          {existingImages.map((url, i) => (
            <div
              key={`exist-${i}`}
              className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-center text-[10px] font-medium text-white">
                  Cover
                </span>
              )}
            </div>
          ))}

          {/* Pending preview images */}
          {pendingPreviews.map((url, i) => {
            const isCover = existingImages.length + i === 0
            return (
              <div
                key={`pending-${i}`}
                className="relative aspect-square overflow-hidden rounded-xl border border-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                {isCover && (
                  <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-center text-[10px] font-medium text-white">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePending(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-xs hover:bg-black/80"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            )
          })}

          {/* Add-more slot — camera icon */}
          {canAddMore && (
            <label className="group flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-[#ED1B2F] hover:bg-red-50">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={handleImageChange}
                disabled={loading}
              />
              <CameraIcon className="h-6 w-6 text-gray-400 transition-colors group-hover:text-[#ED1B2F]" />
              <span className="text-[11px] text-gray-400 transition-colors group-hover:text-[#ED1B2F]">
                {totalImages === 0 ? 'Add photos' : 'Add more'}
              </span>
            </label>
          )}

          {/* Empty placeholder slots (visual fill) */}
          {Array.from({
            length: Math.max(0, MAX_IMAGES - totalImages - (canAddMore ? 1 : 0)),
          }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="aspect-square rounded-xl border border-dashed border-gray-200 bg-gray-50"
            />
          ))}
        </div>

        <p className="text-xs text-gray-400">
          First photo is the cover · JPEG, PNG, or WebP · max 5 MB each
        </p>
      </div>

      {/* ──────────────────────────────────────────────────────
          2. TYPE SELECTOR
         ────────────────────────────────────────────────────── */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[#1A1A1A]">What are you posting?</legend>
        <div className="grid grid-cols-2 gap-3">
          {(['good', 'service'] as const).map(type => (
            <label
              key={type}
              className={[
                'flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-3.5 text-sm font-medium transition-colors',
                listingType === type
                  ? 'border-[#ED1B2F] bg-red-50 text-[#ED1B2F]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300',
              ].join(' ')}
            >
              <input
                type="radio"
                name="listing_type"
                value={type}
                checked={listingType === type}
                onChange={() => setListingType(type)}
                className="sr-only"
              />
              {type === 'good' ? '🛍️ Goods / Items' : '🤝 Services'}
            </label>
          ))}
        </div>
        {fieldErrors.listing_type && (
          <p className="text-xs text-red-600">{fieldErrors.listing_type}</p>
        )}
      </fieldset>

      {/* ──────────────────────────────────────────────────────
          3. CATEGORY
         ────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <label htmlFor="category" className="text-sm font-medium text-[#1A1A1A]">Category</label>
        <select
          id="category"
          name="category"
          defaultValue={listing?.category ?? ''}
          className={[
            'w-full rounded-lg border px-3 py-2 text-sm text-[#1A1A1A]',
            'focus:outline-none focus:ring-1 focus:ring-[#ED1B2F] focus:border-[#ED1B2F]',
            fieldErrors.category ? 'border-red-500' : 'border-gray-200',
          ].join(' ')}
        >
          <option value="">Choose a category</option>
          {filteredCategories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        {fieldErrors.category && <p className="text-xs text-red-600">{fieldErrors.category}</p>}
      </div>

      {/* ──────────────────────────────────────────────────────
          4. TITLE
         ────────────────────────────────────────────────────── */}
      <Input
        label="Title"
        name="title"
        type="text"
        placeholder={listingType === 'good' ? 'e.g. MGCR 382 Textbook — like new' : 'e.g. French tutoring — McGill student'}
        defaultValue={listing?.title}
        error={fieldErrors.title}
        required
      />

      {/* ──────────────────────────────────────────────────────
          5. PRICE
         ────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <label htmlFor="price" className="text-sm font-medium text-[#1A1A1A]">
          {listingType === 'good' ? 'Price (CAD)' : 'Rate (CAD/hr or flat)'}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="Leave blank for free / negotiable"
            defaultValue={listing?.price ?? ''}
            className={[
              'w-full rounded-lg border pl-7 pr-3 py-2 text-sm text-[#1A1A1A]',
              'focus:outline-none focus:ring-1 focus:ring-[#ED1B2F] focus:border-[#ED1B2F]',
              fieldErrors.price ? 'border-red-500' : 'border-gray-200',
            ].join(' ')}
          />
        </div>
        {fieldErrors.price && <p className="text-xs text-red-600">{fieldErrors.price}</p>}
        <p className="text-xs text-gray-500">Leave empty to show as &quot;Free&quot; or &quot;Negotiable&quot;</p>
      </div>

      {/* ──────────────────────────────────────────────────────
          6. DESCRIPTION
         ────────────────────────────────────────────────────── */}
      <Textarea
        label="Description"
        name="description"
        placeholder={listingType === 'good'
          ? 'Describe the item — condition, edition, what\'s included...'
          : 'Describe your service — your experience, what you offer, your approach...'}
        defaultValue={listing?.description}
        error={fieldErrors.description}
        required
      />

      {/* ──────────────────────────────────────────────────────
          7. LOCATION
         ────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Input
          ref={locationRef}
          label={listingType === 'good' ? 'Pickup area' : 'Location / service area'}
          name="location"
          type="text"
          placeholder="e.g. Milton-Parc, McGill Residences"
          defaultValue={listing?.location ?? ''}
          error={fieldErrors.location}
        />
        <div className="flex flex-wrap gap-2">
          {LOCATION_SUGGESTIONS.map(loc => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                if (locationRef.current) locationRef.current.value = loc
              }}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-[#ED1B2F] hover:text-[#ED1B2F] transition-colors"
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────
          8. SERVICE-ONLY FIELDS
         ────────────────────────────────────────────────────── */}
      {listingType === 'service' && (
        <>
          <Input
            label="Availability"
            name="availability"
            type="text"
            placeholder="e.g. Weekdays after 4pm, weekends flexible"
            error={fieldErrors.availability}
          />
          <Input
            label="Service area"
            name="service_area"
            type="text"
            placeholder="e.g. Downtown Montreal, anywhere near campus"
            error={fieldErrors.service_area}
          />
        </>
      )}

      {/* ── Error banner ── */}
      {serverError && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </p>
      )}

      {/* ── Submit / Delete ── */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" size="lg" loading={loading} className="flex-1">
          {mode === 'create' ? 'Post listing' : 'Save changes'}
        </Button>
        {mode === 'edit' && (
          <Button
            type="button"
            variant="danger"
            size="lg"
            onClick={handleDelete}
            disabled={loading}
          >
            Delete
          </Button>
        )}
      </div>

    </form>
  )
}
