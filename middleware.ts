import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require a logged-in, verified account
const PROTECTED_ROUTES = [
  '/listings/new',
  '/messages',
  '/profile/me',
]

// Routes that require admin
const ADMIN_ROUTES = ['/admin']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not yet configured, allow all requests through
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-supabase')) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — required for SSR auth
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  const isProtected = PROTECTED_ROUTES.some(r => path.startsWith(r))
  const isAdmin = ADMIN_ROUTES.some(r => path.startsWith(r))
  const isAuthPage = path.startsWith('/login') || path.startsWith('/signup')

  // Not logged in trying to access protected route
  if (!user && (isProtected || isAdmin)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  // Logged in but email not verified, trying to access protected route
  if (user && !user.email_confirmed_at && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/verify-email'
    return NextResponse.redirect(url)
  }

  // Admin check — is_admin is validated in the admin layout via server client
  // Middleware only checks auth; admin flag is enforced server-side in layout

  // Already logged in, trying to access auth pages
  if (user && user.email_confirmed_at && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
