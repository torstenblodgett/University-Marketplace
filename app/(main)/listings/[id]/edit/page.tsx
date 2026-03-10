import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ListingForm } from '@/components/listings/ListingForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditListingPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (!user.email_confirmed_at) redirect('/verify-email')

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()

  if (!listing) notFound()

  // Only the owner can edit
  if (listing.seller_id !== user.id) redirect(`/listings/${id}`)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Edit listing</h1>
        <p className="text-sm text-gray-500">Update your listing details.</p>
      </div>
      <ListingForm mode="edit" sellerId={user.id} listing={listing} />
    </div>
  )
}
