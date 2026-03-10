import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import type { Database } from '@/types/database'

type Listing = Database['public']['Tables']['listings']['Row']

interface ListingCardProps {
  listing: Listing & { profiles?: { display_name: string } | null }
}

const CATEGORY_LABELS: Record<string, string> = {
  textbooks: 'Textbooks', furniture: 'Furniture', electronics: 'Electronics',
  clothing: 'Clothing', winter_gear: 'Winter Gear', other_goods: 'Other Goods',
  tutoring: 'Tutoring', moving: 'Moving Help', cleaning: 'Cleaning',
  other_services: 'Services',
}

export function ListingCard({ listing }: ListingCardProps) {
  const isService = listing.listing_type === 'service'
  const priceLabel = listing.price != null
    ? `$${Number(listing.price).toFixed(2)}${isService ? '/hr' : ''}`
    : isService ? 'Rate negotiable' : 'Free'

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-red-200 hover:shadow-sm transition-all"
    >
      {/* Image */}
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {listing.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            {isService ? '🤝' : '🛍️'}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-red-700 transition-colors">
            {listing.title}
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="category">{CATEGORY_LABELS[listing.category] ?? listing.category}</Badge>
          {isService && <Badge variant="neutral">Service</Badge>}
        </div>

        <p className="text-sm font-semibold text-gray-900 mt-auto">
          {priceLabel}
        </p>

        {listing.location && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span>📍</span> {listing.location}
          </p>
        )}

        <p className="text-xs text-gray-400">
          {listing.profiles?.display_name} ·{' '}
          {new Date(listing.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </Link>
  )
}
