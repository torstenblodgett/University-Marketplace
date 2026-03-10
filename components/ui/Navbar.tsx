import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from './Button'

export async function Navbar() {
  let user = null
  let profile = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user

    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, is_admin')
        .eq('id', user.id)
        .single()
      profile = profileData
    }
  } catch {
    // Supabase not yet configured — render logged-out nav
  }

  const isVerified = !!user?.email_confirmed_at

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-700">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <span className="font-semibold text-gray-900">
              McGill <span className="text-red-700">Marketplace</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Browse
            </Link>
            <Link href="/search" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Search
            </Link>
            {isVerified && (
              <Link href="/listings/new" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Post Listing
              </Link>
            )}
            {profile?.is_admin && (
              <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Admin
              </Link>
            )}
          </div>

          {/* Auth actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {isVerified && (
                  <Link href="/messages" className="hidden text-sm text-gray-600 hover:text-gray-900 md:block transition-colors">
                    Messages
                  </Link>
                )}
                <Link href="/profile/me">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700 text-sm font-semibold">
                    {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                </Link>
                <form action="/auth/logout" method="POST">
                  <button type="submit" className="hidden text-sm text-gray-500 hover:text-gray-900 md:block transition-colors">
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden">
        <div className="flex">
          <Link href="/" className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-gray-500 hover:text-red-700 transition-colors">
            <span className="text-base leading-none">⊞</span>
            <span className="text-[10px] font-medium">Browse</span>
          </Link>
          <Link href="/search" className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-gray-500 hover:text-red-700 transition-colors">
            <span className="text-base leading-none">⌕</span>
            <span className="text-[10px] font-medium">Search</span>
          </Link>
          <Link href="/listings/new" className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-gray-500 hover:text-red-700 transition-colors">
            <span className="text-base leading-none">＋</span>
            <span className="text-[10px] font-medium">Post</span>
          </Link>
          <Link href={user ? '/messages' : '/login'} className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-gray-500 hover:text-red-700 transition-colors">
            <span className="text-base leading-none">✉</span>
            <span className="text-[10px] font-medium">Messages</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
