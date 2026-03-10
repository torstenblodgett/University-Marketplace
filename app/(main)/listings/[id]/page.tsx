import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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

  const sellerProfile = listing.profiles as { id: string; display_name: string; created_at: string } | null

  // Trust gate for reviews
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

  // Seller's aggregate rating
  const { data: sellerReviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', listing.seller_id)

  const avgRating = sellerReviews && sellerReviews.length > 0
    ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length
    : null

  // Seller's completed transaction count
  const { count: transactionCount } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', listing.seller_id)
    .in('status', ['sold', 'closed'])

  const priceLabel = listing.price != null
    ? `$${Number(listing.price).toFixed(2)}${isService ? '/hr' : ''}`
    : isService ? 'Rate negotiable' : 'Free'

  const memberSince = sellerProfile?.created_at
    ? new Date(sellerProfile.created_at).getFullYear()
    : null

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">

      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span>/</span>
        <Link href={`/search?category=${listing.category}`} className="hover:text-gray-600">
          {CATEGORY_LABELS[listing.category] ?? listing.category}
        </Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-[200px]">{listing.title}</span>
      </div>

      {/* Main grid: Left = images, Right = details */}
      <div className="grid md:grid-cols-5 gap-8">

        {/* LEFT: Image gallery */}
        <div className="md:col-span-3">
          {listing.images.length > 0 ? (
            <div className="space-y-2">
              {/* Primary image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full rounded-lg object-cover border border-[#E5E5E5] aspect-[4/3]"
              />
              {/* Additional images */}
              {listing.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {listing.images.slice(1).map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt={`${listing.title} — photo ${i + 2}`}
                      className="aspect-square w-full rounded object-cover border border-[#E5E5E5]"
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-lg bg-gray-100 border border-[#E5E5E5] flex items-center justify-center text-5xl text-gray-300">
              {isService ? '🤝' : '🛍️'}
            </div>
          )}

          {/* Description — below images on desktop */}
          <div className="mt-6 hidden md:block">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Description</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{listing.description}</p>

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-400">
              <span>Category: {CATEGORY_LABELS[listing.category] ?? listing.category}</span>
              <span>·</span>
              <span>Posted {new Date(listing.created_at).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              {isService && <><span>·</span><span>Service</span></>}
            </div>
          </div>
        </div>

        {/* RIGHT: Title, price, seller, action */}
        <div className="md:col-span-2">
          <div className="sticky top-20 space-y-4">

            {/* Title + Price */}
            <div>
              <h1 className="text-xl font-bold text-[#1A1A1A] leading-snug">{listing.title}</h1>
              <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">{priceLabel}</p>
              {listing.location && (
                <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                  <span>📍</span> {listing.location}
                </p>
              )}
            </div>

            <hr className="border-[#E5E5E5]" />

            {/* Seller trust card */}
            <div className="rounded-lg border border-[#E5E5E5] bg-white p-4 space-y-3">
              <Link
                href={`/profile/${listing.seller_id}`}
                className="flex items-center gap-3 group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 font-bold text-sm">
                  {sellerProfile?.display_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#ED1B2F] transition-colors">
                    {sellerProfile?.display_name ?? 'McGill Student'}
                  </p>
                  {avgRating !== null && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <StarRating rating={avgRating} size="sm" />
                      <span className="text-xs text-gray-500">{avgRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </Link>

              <div className="space-y-1 text-xs text-gray-600">
                <p className="flex items-center gap-1.5">
                  <span className="text-green-600 font-medium">✔</span>
                  Verified McGill Email
                </p>
                {memberSince && (
                  <p className="flex items-center gap-1.5">
                    <span className="text-gray-400">·</span>
                    Member since {memberSince}
                  </p>
                )}
                {typeof transactionCount === 'number' && transactionCount > 0 && (
                  <p className="flex items-center gap-1.5">
                    <span className="text-gray-400">·</span>
                    {transactionCount} completed {transactionCount === 1 ? 'transaction' : 'transactions'}
                  </p>
                )}
              </div>
            </div>

            {/* Action */}
            <div>
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
                <div className="space-y-2 text-center">
                  <p className="text-sm text-gray-600">Verify your McGill email to message sellers.</p>
                  <Link href="/verify-email">
                    <Button variant="secondary" className="w-full">Verify email</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 text-center">
                  <p className="text-sm text-gray-600">Sign in to message this seller.</p>
                  <Link href={`/login?next=/listings/${listing.id}`}>
                    <Button className="w-full">Sign in to message</Button>
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Description on mobile (below the grid) */}
      <div className="mt-6 md:hidden">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Description</h2>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{listing.description}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-400">
          <span>Category: {CATEGORY_LABELS[listing.category] ?? listing.category}</span>
          <span>·</span>
          <span>Posted {new Date(listing.created_at).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Review section */}
      {hasConversation && sellerProfile && (
        <div className="mt-10 border-t border-[#E5E5E5] pt-8 max-w-lg">
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Leave a review</h2>
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
