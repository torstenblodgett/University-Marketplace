import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { ListingCard } from '@/components/listings/ListingCard'
import type { Database, Category } from '@/types/database'

type Listing = Database['public']['Tables']['listings']['Row'] & {
  profiles?: { display_name: string } | null
}

const ALL_CATEGORIES = [
  { label: 'Textbooks',       slug: 'textbooks',       icon: '📚' },
  { label: 'Furniture',       slug: 'furniture',       icon: '🛋️' },
  { label: 'Electronics',     slug: 'electronics',     icon: '💻' },
  { label: 'Clothing',        slug: 'clothing',        icon: '🧥' },
  { label: 'Winter Gear',     slug: 'winter_gear',     icon: '🧤' },
  { label: 'Tutoring',        slug: 'tutoring',        icon: '🎓' },
  { label: 'Moving Help',     slug: 'moving',          icon: '📦' },
  { label: 'Cleaning',        slug: 'cleaning',        icon: '🧹' },
  { label: 'Snow Shovelling', slug: 'snow_shovelling', icon: '❄️' },
  { label: 'Other Goods',     slug: 'other_goods',     icon: '🛍️' },
  { label: 'Services',        slug: 'other_services',  icon: '🤝' },
]

const FEATURED: Array<{
  label: string
  icon: string
  slugs: Category[]
  searchSlug: string
}> = [
  { label: 'Textbooks',   icon: '📚', slugs: ['textbooks'],                                                           searchSlug: 'textbooks'   },
  { label: 'Furniture',   icon: '🛋️', slugs: ['furniture'],                                                           searchSlug: 'furniture'   },
  { label: 'Electronics', icon: '💻', slugs: ['electronics'],                                                          searchSlug: 'electronics' },
  { label: 'Winter Gear', icon: '🧤', slugs: ['winter_gear'],                                                          searchSlug: 'winter_gear' },
  { label: 'Services',    icon: '🤝', slugs: ['tutoring', 'moving', 'cleaning', 'snow_shovelling', 'other_services'],  searchSlug: 'tutoring'    },
]

export default async function HomePage() {
  const categoryListings: Record<string, Listing[]> = {}
  let hasAnyListings = false

  try {
    const supabase = await createClient()

    // Signed-in users go straight to the browse/search experience
    const { data: { user } } = await supabase.auth.getUser()
    if (user) redirect('/search')

    // Fetch recent listings per featured category in parallel
    const results = await Promise.all(
      FEATURED.map(cat =>
        supabase
          .from('listings')
          .select('*, profiles(display_name)')
          .in('category', cat.slugs)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(8)
      )
    )

    FEATURED.forEach((cat, i) => {
      const listings = (results[i].data ?? []) as Listing[]
      categoryListings[cat.label] = listings
      if (listings.length > 0) hasAnyListings = true
    })
  } catch {
    // Supabase not configured yet
  }

  return (
    <div className="mx-auto max-w-6xl px-4 space-y-6 py-5">

      {/* Compact hero */}
      <section className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs text-red-700 font-medium border border-red-100">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          Verified McGill students only
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
          The <span className="text-blue-600">marketplace</span> built for{' '}
          <span className="text-red-700">McGill students</span>
        </h1>
        <div className="flex gap-2 justify-center flex-wrap">
          <Link href="/signup">
            <Button size="sm">Get started free</Button>
          </Link>
          <Link href="/search">
            <Button variant="secondary" size="sm">Browse all listings</Button>
          </Link>
        </div>
        <p className="text-xs text-gray-400">
          Requires a @mail.mcgill.ca or @mcgill.ca email address
        </p>
      </section>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-gray-100" style={{ scrollbarWidth: 'none' }}>
        <Link
          href="/search"
          className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-red-300 hover:text-red-700 transition-colors whitespace-nowrap"
        >
          All
        </Link>
        {ALL_CATEGORIES.map(cat => (
          <Link
            key={cat.slug}
            href={`/search?category=${cat.slug}`}
            className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-red-300 hover:text-red-700 transition-colors whitespace-nowrap"
          >
            {cat.icon} {cat.label}
          </Link>
        ))}
      </div>

      {/* Listings by category */}
      {hasAnyListings ? (
        <div className="space-y-10 pb-10">
          {FEATURED.map(cat => {
            const listings = categoryListings[cat.label] ?? []
            if (listings.length === 0) return null
            return (
              <section key={cat.label}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-900">
                    {cat.icon} {cat.label}
                  </h2>
                  <Link
                    href={`/search?category=${cat.searchSlug}`}
                    className="text-xs text-red-700 hover:underline font-medium"
                  >
                    View all →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {listings.map(listing => (
                    <ListingCard
                      key={listing.id}
                      listing={listing as Parameters<typeof ListingCard>[0]['listing']}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center space-y-3">
          <p className="text-3xl">🛍️</p>
          <p className="font-medium text-gray-700">No listings yet</p>
          <p className="text-sm text-gray-500">Be the first to post something for McGill students.</p>
          <div className="pt-2">
            <Link href="/listings/new">
              <Button size="sm">Post the first listing</Button>
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}
