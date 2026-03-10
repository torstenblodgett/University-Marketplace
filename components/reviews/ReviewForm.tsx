'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { StarRatingInput, StarRating } from '@/components/reviews/StarRating'

interface ExistingReview {
  rating: number
  content: string | null
}

interface Props {
  listingId: string
  sellerId: string
  sellerName: string
  existingReview: ExistingReview | null
}

export function ReviewForm({ listingId, sellerId, sellerName, existingReview }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [content, setContent] = useState(existingReview?.content ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (done || existingReview) {
    const displayReview = done ? { rating, content } : existingReview!
    return (
      <div className="rounded-lg border border-[#E5E5E5] bg-gray-50 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <StarRating rating={displayReview.rating} size="sm" />
          <span className="text-xs text-gray-500">Your review</span>
        </div>
        {displayReview.content && (
          <p className="text-sm text-gray-700">{displayReview.content}</p>
        )}
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Please select a star rating.'); return }

    setSubmitting(true)
    setError('')

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
        reviewee_id: sellerId,
        rating,
        content: content.trim() || null,
      }),
    })

    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Something went wrong.')
      return
    }

    setDone(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-medium text-[#1A1A1A]">
        Rate your experience with {sellerName}
      </p>

      <StarRatingInput value={rating} onChange={setRating} />

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Share details about your experience (optional)"
        className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ED1B2F] focus:border-[#ED1B2F]"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button type="submit" loading={submitting} size="sm">
        Submit review
      </Button>
    </form>
  )
}
