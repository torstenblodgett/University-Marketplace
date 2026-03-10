import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MessageSellerButton } from '@/components/listings/MessageSellerButton'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { StarRating } from '@/components/reviews/StarRating'

interface Props {
  params: Promise<{ id: string }>
}

const CATEGORY_LABELS: Record<string, string> = {
  textbooks: 'Textbooks', furniture: 'Furniture', electronics: 'Electronics',
  clothing: 'Clothing', winter_gear: 'Winter Gear', other_goods: 'Other Goods',
  tutoring: 'Tutoring', moving: 'Moving Help', cleaning: 'Cleaning',
  other_services: 'Services',
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('*, profiles(id, display_name, created_at)')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!listing) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === listing.seller_id
  const isVerified = !!user?.email_confirmed_at
  const isService = listing.listing_type === 'service'

  const sellerProfile = listing.profiles as { id: string; display_name: string } | null

  // Check if current user has had a conversation about this listing (trust gate for reviews)
  let hasConversation = false
  let existingReview = null

  if (user && !isOwner && isVerified) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listing.id)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .limit(1)
      .single()

    hasConversation = !!conv

    if (hasConversation) {
      const { data: review } = await supabase
        .from('reviews')
        .select('rating, content')
        .eq('listing_id', listing.id)
        .eq('reviewer_id', user.id)
        .single()
      existingReview = review ?? null
    }
  }

  // Fetch seller's aggregate rating for display
  const { data: sellerReviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', listing.seller_id)

  const avgRating = sellerReviews && sellerReviews.length > 0
    ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length
    : null

  const priceLabel = listing.price != null
    ? `$${Number(listing.price).toFixed(2)}${isService ? '/hr' : ''}`
    : isService ? 'Rate negotiable' : 'Free'

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <div className="grid md:grid-cols-5 gap-8">

        {/* Main content */}
        <div className="md:col-span-3 space-y-6">
          {/* Images */}
          {listing.images.length > 0 ? (
            <div className={listing.images.length === 1 ? '' : 'grid grid-cols-2 gap-2'}>
              {listing.images.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`${listing.title} — photo ${i + 1}`}
                  className={[
                    'w-full rounded-2xl object-cover border border-gray-200',
                    listing.images.length === 1 ? 'aspect-video' : 'aspect-square',
                  ].join(' ')}
                />
              ))}
            </div>
          ) : (
            <div className="aspect-video rounded-2xl bg-gray-100 flex items-center justify-center text-6xl border border-gray-200">
              {isService ? '🤝' : '🛍️'}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="category">{CATEGORY_LABELS[listing.category] ?? listing.category}</Badge>
              {isService && <Badge variant="neutral">Service</Badge>}
            </div>

            <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>

            <p className="text-2xl font-bold text-gray-900">{priceLabel}</p>

            {listing.location && (
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <span>📍</span> {listing.location}
              </p>
            )}

            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 sticky top-24">

            {/* Seller info */}
            <Link href={`/profile/${listing.seller_id}`} className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700 font-semibold">
                {sellerProfile?.display_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-red-700 transition-colors">
                  {sellerProfile?.display_name ?? 'McGill Student'}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="verified">✓ McGill Verified</Badge>
                  {avgRating !== null && (
                    <span className="flex items-center gap-1">
                      <StarRating rating={avgRating} size="sm" />
                      <span className="text-xs text-gray-500">{avgRating.toFixed(1)}</span>
                    </span>
                  )}
                </div>
              </div>
            </Link>

            <hr className="border-gray-100" />

            {/* Actions */}
            {isOwner ? (
              <div className="space-y-2">
                <Link href={`/listings/${listing.id}/edit`} className="block">
                  <Button variant="secondary" className="w-full">Edit listing</Button>
                </Link>
                <p className="text-xs text-center text-gray-400">This is your listing</p>
              </div>
            ) : isVerified ? (
              <div className="space-y-2">
                <MessageSellerButton listingId={listing.id} sellerId={listing.seller_id} />
                <Link href={`/report?listing=${listing.id}`} className="block">
                  <Button variant="ghost" size="sm" className="w-full text-gray-400">
                    Report listing
                  </Button>
                </Link>
              </div>
            ) : user ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-gray-600">Verify your McGill email to message sellers.</p>
                <Link href="/verify-email">
                  <Button variant="secondary" className="w-full">Verify email</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-sm text-gray-600">Sign in to message this seller.</p>
                <Link href={`/login?next=/listings/${listing.id}`}>
                  <Button className="w-full">Sign in to message</Button>
                </Link>
              </div>
            )}

            {/* Trust note */}
            <p className="text-xs text-gray-400 text-center">
              All users are verified McGill students.
            </p>
          </div>
        </div>
      </div>

      {/* Review section — only shown after confirmed contact */}
      {hasConversation && sellerProfile && (
        <div className="border-t border-gray-100 pt-8 max-w-lg">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Leave a review</h2>
          <ReviewForm
            listingId={listing.id}
            sellerId={listing.seller_id}
            sellerName={sellerProfile.display_name}
            existingReview={existingReview}
          />
        </div>
      )}
    </div>
  )
}
