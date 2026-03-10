import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4 border-b border-gray-200 pb-4">
        <h1 className="text-lg font-semibold text-gray-900">Admin</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin/reports" className="text-gray-600 hover:text-gray-900 transition-colors">
            Reports
          </Link>
          <Link href="/admin/users" className="text-gray-600 hover:text-gray-900 transition-colors">
            Users
          </Link>
          <Link href="/admin/listings" className="text-gray-600 hover:text-gray-900 transition-colors">
            Listings
          </Link>
        </nav>
      </div>
      {children}
    </div>
  )
}
