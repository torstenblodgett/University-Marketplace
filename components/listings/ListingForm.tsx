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

      {/* Type selector */}
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

      {/* Category */}
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

      <Input
        label="Title"
        name="title"
        type="text"
        placeholder={listingType === 'good' ? 'e.g. MGCR 382 Textbook — like new' : 'e.g. French tutoring — McGill student'}
        defaultValue={listing?.title}
        error={fieldErrors.title}
        required
      />

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

      {/* Price */}
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

      {/* Location */}
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

      {/* Service-only fields */}
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

      {/* Photos */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-[#1A1A1A]">
          Photos <span className="text-gray-400 font-normal">(optional · up to {MAX_IMAGES})</span>
        </p>

        {/* Existing images (edit mode) */}
        {existingImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {existingImages.map((url, i) => (
              <div key={i} className="h-20 w-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Pending previews */}
        {pendingPreviews.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pendingPreviews.map((url, i) => (
              <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePending(i)}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-xs leading-none hover:bg-black/80"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* File picker */}
        {canAddMore && (
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 hover:border-[#ED1B2F] hover:text-[#ED1B2F] transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={handleImageChange}
              disabled={loading}
            />
            <span>+ Add photos</span>
            <span className="text-xs text-gray-400">JPEG, PNG, or WebP · max 5 MB each</span>
          </label>
        )}

        {!canAddMore && (
          <p className="text-xs text-gray-500">Maximum {MAX_IMAGES} photos reached.</p>
        )}
      </div>

      {serverError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">
          {serverError}
        </p>
      )}

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
