import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { StarRating } from '@/components/reviews/StarRating'
import { ListingCard } from '@/components/listings/ListingCard'

interface Props {
  params: Promise<{ userId: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, bio, created_at')
    .eq('id', userId)
    .single()

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === userId
  const isVerified = !!user?.email_confirmed_at

  // Fetch reviews received
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, content, created_at, reviewer:profiles!reviews_reviewer_id_fkey(display_name), listing:listings(title)')
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  // Compute average rating
  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  // Fetch active listings
  const { data: listings } = await supabase
    .from('listings')
    .select('*, profiles(display_name)')
    .eq('seller_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(8)

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-CA', {
    month: 'long', year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">

      {/* Profile header */}
      <div className="flex items-start gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 text-2xl font-bold">
          {profile.display_name[0].toUpperCase()}
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{profile.display_name}</h1>
            <Badge variant="verified">✓ McGill Verified</Badge>
          </div>
          {avgRating !== null && (
            <div className="flex items-center gap-2">
              <StarRating rating={avgRating} size="sm" />
              <span className="text-sm text-gray-600">
                {avgRating.toFixed(1)} · {reviews!.length} review{reviews!.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-400">Member since {memberSince}</p>
          {profile.bio && <p className="text-sm text-gray-600 mt-1">{profile.bio}</p>}
        </div>

        {/* Actions */}
        {!isOwnProfile && isVerified && (
          <Link href={`/report?user=${userId}`}>
            <Button variant="ghost" size="sm" className="text-gray-400 shrink-0">
              Report user
            </Button>
          </Link>
        )}
        {isOwnProfile && (
          <Link href="/profile/me/edit">
            <Button variant="secondary" size="sm" className="shrink-0">
              Edit profile
            </Button>
          </Link>
        )}
      </div>

      {/* Active listings */}
      {listings && listings.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            {isOwnProfile ? 'Your listings' : 'Listings'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {listings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing as Parameters<typeof ListingCard>[0]['listing']}
              />
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900">
          Reviews {reviews && reviews.length > 0 && `(${reviews.length})`}
        </h2>

        {!reviews || reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(review => {
              const reviewer = review.reviewer as { display_name: string } | null
              const listing = review.listing as { title: string } | null
              return (
                <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                        {reviewer?.display_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {reviewer?.display_name ?? 'McGill Student'}
                      </span>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  {review.content && (
                    <p className="text-sm text-gray-700 leading-relaxed">{review.content}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {listing?.title && `Re: ${listing.title} · `}
                    {new Date(review.created_at).toLocaleDateString('en-CA', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </section>

    </div>
  )
}
