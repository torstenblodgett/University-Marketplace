import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { ListingCard } from '@/components/listings/ListingCard'
import { HeroCollage } from '@/components/home/HeroCollage'

const CATEGORIES = [
  { label: 'Textbooks',   slug: 'textbooks',      icon: '📚' },
  { label: 'Furniture',   slug: 'furniture',      icon: '🛋️' },
  { label: 'Electronics', slug: 'electronics',    icon: '💻' },
  { label: 'Clothing',    slug: 'clothing',        icon: '🧥' },
  { label: 'Winter Gear', slug: 'winter_gear',    icon: '🧤' },
  { label: 'Tutoring',    slug: 'tutoring',        icon: '🎓' },
  { label: 'Moving Help',     slug: 'moving',          icon: '📦' },
  { label: 'Cleaning',        slug: 'cleaning',        icon: '🧹' },
  { label: 'Snow Shovelling', slug: 'snow_shovelling', icon: '❄️' },
  { label: 'Other Goods',     slug: 'other_goods',     icon: '🛍️' },
  { label: 'Services',        slug: 'other_services',  icon: '🤝' },
]

export default async function HomePage() {
  let recentListings = null

  try {
    const supabase = await createClient()

    // Signed-in users go straight to the browse/search experience
    const { data: { user } } = await supabase.auth.getUser()
    if (user) redirect('/search')

    const { data } = await supabase
      .from('listings')
      .select('*, profiles(display_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8)
    recentListings = data
  } catch {
    // Supabase not configured yet
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-14">

      {/* Hero */}
      <section className="relative text-center space-y-5 pt-6 pb-2 -mx-4 px-4 rounded-2xl overflow-hidden">
        {/* Subtle background collage — decorative SVG silhouettes at 15% opacity */}
        <HeroCollage />

        {/* Hero content sits above the collage */}
        <div className="relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-sm text-red-700 font-medium border border-red-100">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
            McGill students only — verified &amp; trusted
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
            The marketplace built<br />
            <span className="text-red-700">for McGill students</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Buy and sell textbooks, furniture, and electronics. Find tutors and student services.
            Every account is verified with a McGill email.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/signup">
              <Button size="lg">Get started free</Button>
            </Link>
            <Link href="/search">
              <Button variant="secondary" size="lg">Browse listings</Button>
            </Link>
          </div>

          <p className="text-xs text-gray-400">
            Requires a @mail.mcgill.ca or @mcgill.ca email address
          </p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 border-y border-gray-100 py-6">
        {[
          'Verified McGill emails only',
          'In-app messaging — no personal info shared',
          'Reviews and ratings',
          'Report and moderation tools',
        ].map(item => (
          <div key={item} className="flex items-center gap-2">
            <span className="text-green-600">✓</span> {item}
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Browse by category</h2>
          <Link href="/search" className="text-sm text-red-700 hover:underline font-medium">See all</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              href={`/search?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center hover:border-red-200 hover:bg-red-50 transition-colors group"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-medium text-gray-700 group-hover:text-red-700 transition-colors">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent listings */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Recent listings</h2>
          <Link href="/search" className="text-sm text-red-700 hover:underline font-medium">View all</Link>
        </div>

        {!recentListings || recentListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center space-y-3">
            <p className="text-3xl">🛍️</p>
            <p className="font-medium text-gray-700">No listings yet</p>
            <p className="text-sm text-gray-500">Be the first to post something for McGill students.</p>
            <div className="pt-2">
              <Link href="/listings/new">
                <Button size="sm">Post the first listing</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {recentListings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing as Parameters<typeof ListingCard>[0]['listing']}
              />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="rounded-2xl bg-gray-50 border border-gray-200 p-8 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 text-center">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Verify your McGill email', desc: 'Sign up with your @mail.mcgill.ca or @mcgill.ca address. We send a verification link.' },
            { step: '2', title: 'Post or browse listings', desc: 'List items, offer services, or search what other McGill students have posted.' },
            { step: '3', title: 'Connect safely', desc: 'Message through the platform. Reviews and ratings build trust over time.' },
          ].map(item => (
            <div key={item.step} className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-700 text-white text-sm font-bold">
                {item.step}
              </div>
              <div className="space-y-1">
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4 pb-10">
        <h2 className="text-2xl font-semibold text-gray-900">Ready to join?</h2>
        <p className="text-gray-500">It takes 2 minutes to verify and start posting.</p>
        <Link href="/signup">
          <Button size="lg">Create your account</Button>
        </Link>
      </section>

    </div>
  )
}
