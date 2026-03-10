import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { SearchFilters } from '@/components/search/SearchFilters'
import Link from 'next/link'

interface SearchParams {
  q?: string
  category?: string
  type?: string
  min?: string
  max?: string
  sort?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams
  const { q, category, type, min, max, sort } = params

  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select('*, profiles(display_name)')
    .eq('status', 'active')

  if (q?.trim()) {
    query = query.or(`title.ilike.%${q.trim()}%,description.ilike.%${q.trim()}%`)
  }
  if (category) query = query.eq('category', category as import('@/types/database').Category)
  if (type === 'good' || type === 'service') query = query.eq('listing_type', type)
  if (min) query = query.gte('price', Number(min))
  if (max) query = query.lte('price', Number(max))

  if (sort === 'price_asc') query = query.order('price', { ascending: true })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  query = query.limit(48)

  const { data: listings } = await query

  const hasFilters = !!(q || category || type || min || max || sort)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <SearchFilters q={q} category={category} type={type} min={min} max={max} sort={sort} />

      {/* Results */}
      {!listings || listings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-16 text-center space-y-2">
          <p className="text-3xl">🔍</p>
          <p className="font-medium text-[#1A1A1A]">No listings found</p>
          <p className="text-sm text-gray-500">
            {hasFilters
              ? 'Try adjusting your filters or search terms.'
              : 'Be the first to post a listing for McGill students.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            {hasFilters && (
              <Link
                href="/search"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Clear filters
              </Link>
            )}
            <Link
              href="/listings/new"
              className="rounded-lg bg-[#ED1B2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#C41525] transition-colors"
            >
              Post a listing
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            {q ? `${listings.length} result${listings.length !== 1 ? 's' : ''} for "${q}"` : `${listings.length} listing${listings.length !== 1 ? 's' : ''}`}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {listings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing as Parameters<typeof ListingCard>[0]['listing']}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
