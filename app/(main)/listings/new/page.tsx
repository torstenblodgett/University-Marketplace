import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ListingForm } from '@/components/listings/ListingForm'

export default async function NewListingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Double-check on server: must be logged in and verified
  if (!user) redirect('/login?next=/listings/new')
  if (!user.email_confirmed_at) redirect('/verify-email')

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Post a listing</h1>
        <p className="text-sm text-gray-500">List a good or offer a service to McGill students.</p>
      </div>
      <ListingForm mode="create" sellerId={user.id} />
    </div>
  )
}
