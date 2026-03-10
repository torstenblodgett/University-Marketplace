import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/messages')
  if (!user.email_confirmed_at) redirect('/verify-email')

  // Fetch all conversations the user is part of
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id,
      listing_id,
      buyer_id,
      seller_id,
      last_message_at,
      listings(title),
      buyer:profiles!conversations_buyer_id_fkey(id, display_name),
      seller:profiles!conversations_seller_id_fkey(id, display_name)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

      {!conversations || conversations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center space-y-3">
          <p className="text-3xl">💬</p>
          <p className="font-medium text-gray-700">No messages yet</p>
          <p className="text-sm text-gray-500">
            When you message a seller or get a message, it will appear here.
          </p>
          <div className="pt-2">
            <Link
              href="/search"
              className="inline-flex rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 transition-colors"
            >
              Browse listings
            </Link>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          {conversations.map(conv => {
            const isbuyer = conv.buyer_id === user.id
            const otherParty = isbuyer
              ? (conv.seller as { id: string; display_name: string } | null)
              : (conv.buyer as { id: string; display_name: string } | null)
            const listing = conv.listings as { title: string } | null

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 font-semibold text-sm">
                  {otherParty?.display_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {otherParty?.display_name ?? 'McGill Student'}
                  </p>
                  {listing?.title && (
                    <p className="text-xs text-gray-500 truncate">Re: {listing.title}</p>
                  )}
                </div>
                {conv.last_message_at && (
                  <p className="shrink-0 text-xs text-gray-400">
                    {new Date(conv.last_message_at).toLocaleDateString('en-CA', {
                      month: 'short', day: 'numeric',
                    })}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
