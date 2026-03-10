import Link from 'next/link'
import type { Database } from '@/types/database'

type Listing = Database['public']['Tables']['listings']['Row']

interface ListingCardProps {
  listing: Listing & { profiles?: { display_name: string } | null }
}

export function ListingCard({ listing }: ListingCardProps) {
  const isService = listing.listing_type === 'service'
  const priceLabel = listing.price != null
    ? `$${Number(listing.price).toFixed(2)}${isService ? '/hr' : ''}`
    : isService ? 'Rate negotiable' : 'Free'

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col rounded-lg border border-[#E5E5E5] bg-white overflow-hidden hover:border-[#ED1B2F] transition-colors"
    >
      {/* 4:3 image */}
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        {listing.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-gray-300">
            {isService ? '🤝' : '🛍️'}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3 space-y-0.5">
        <p className="text-sm font-semibold text-[#1A1A1A] line-clamp-2 leading-snug group-hover:text-[#ED1B2F] transition-colors">
          {listing.title}
        </p>
        <p className="text-sm font-bold text-[#1A1A1A]">{priceLabel}</p>
        {listing.location && (
          <p className="text-xs text-gray-500 truncate">{listing.location}</p>
        )}
        <p className="text-xs text-gray-400">
          {listing.profiles?.display_name} ·{' '}
          {new Date(listing.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </Link>
  )
}
