import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'

const CATEGORIES = [
  { label: 'Textbooks',    slug: 'textbooks',     icon: '📚' },
  { label: 'Furniture',    slug: 'furniture',     icon: '🛋️' },
  { label: 'Electronics',  slug: 'electronics',   icon: '💻' },
  { label: 'Clothing',     slug: 'clothing',      icon: '🧥' },
  { label: 'Winter Gear',  slug: 'winter_gear',   icon: '🧤' },
  { label: 'Tutoring',     slug: 'tutoring',      icon: '🎓' },
  { label: 'Moving Help',  slug: 'moving',        icon: '📦' },
  { label: 'Cleaning',     slug: 'cleaning',      icon: '🧹' },
  { label: 'Other Goods',  slug: 'other_goods',   icon: '🛍️' },
  { label: 'Services',     slug: 'other_services',icon: '🤝' },
]

export default async function HomePage() {
  let recentListings = null
  let user = null

  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    user = authData.user

    const { data } = await supabase
      .from('listings')
      .select('*, profiles(display_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20)
    recentListings = data
  } catch {
    // Supabase not configured yet
  }

  return (
    <div>

      {/* Announcement bar — only for logged-out visitors */}
      {!user && (
        <div className="border-b border-[#E5E5E5] bg-white px-4 py-3">
          <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-[#1A1A1A]">McGill Marketplace</span>
              {' '}— buy, sell, and find services. Verified McGill students only.
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/login" className="text-sm text-gray-600 hover:text-[#1A1A1A]">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-[#ED1B2F] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#C41525] transition-colors"
              >
                Sign up free
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Category bar */}
      <div className="border-b border-[#E5E5E5] bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            <Link
              href="/search"
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-[#E5E5E5] px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-[#ED1B2F] hover:text-[#ED1B2F] transition-colors"
            >
              All
            </Link>
            {CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                href={`/search?category=${cat.slug}`}
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-[#E5E5E5] px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-[#ED1B2F] hover:text-[#ED1B2F] transition-colors"
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        {!recentListings || recentListings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#E5E5E5] py-24 text-center">
            <p className="text-2xl mb-3">🛍️</p>
            <p className="font-medium text-[#1A1A1A]">No listings yet</p>
            <p className="mt-1 text-sm text-gray-500">Be the first to post something for McGill students.</p>
            {user && (
              <Link
                href="/listings/new"
                className="mt-4 inline-block rounded-md bg-[#ED1B2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#C41525] transition-colors"
              >
                Post a listing
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Recent listings
              </h2>
              <Link href="/search" className="text-sm text-[#ED1B2F] hover:underline">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
              {recentListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing as Parameters<typeof ListingCard>[0]['listing']}
                />
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  )
}
