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
    <div className="mx-auto max-w-2xl">

      {/* ── Header ── */}
      <div className="border-b border-[#E5E5E5] px-4 py-4">
        <h1 className="text-base font-bold text-[#1A1A1A]">Messages</h1>
      </div>

      {!conversations || conversations.length === 0 ? (
        /* ── Empty state ── */
        <div className="px-4 py-24 text-center space-y-3">
          <p className="text-5xl">💬</p>
          <p className="font-semibold text-[#1A1A1A]">No messages yet</p>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            When you message a seller or get a message from a buyer, it will appear here.
          </p>
          <div className="pt-2">
            <Link
              href="/search"
              className="inline-flex rounded-full bg-[#ED1B2F] px-5 py-2 text-sm font-semibold text-white hover:bg-[#C41525] transition-colors"
            >
              Browse listings
            </Link>
          </div>
        </div>
      ) : (
        /* ── Conversation list — Instagram DM style ── */
        <ul>
          {conversations.map(conv => {
            const isBuyer = conv.buyer_id === user.id
            const otherParty = isBuyer
              ? (conv.seller as { id: string; display_name: string } | null)
              : (conv.buyer as { id: string; display_name: string } | null)
            const listing = conv.listings as { title: string } | null
            const initial = otherParty?.display_name?.[0]?.toUpperCase() ?? '?'

            return (
              <li key={conv.id}>
                <Link
                  href={`/messages/${conv.id}`}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar — gradient circle, Instagram style */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold text-lg">
                    {initial}
                  </div>

                  {/* Name + listing */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-[#1A1A1A] truncate">
                        {otherParty?.display_name ?? 'McGill Student'}
                      </p>
                      {conv.last_message_at && (
                        <p className="shrink-0 text-xs text-gray-400">
                          {new Date(conv.last_message_at).toLocaleDateString('en-CA', {
                            month: 'short', day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                    {listing?.title && (
                      <p className="text-xs text-gray-500 truncate">{listing.title}</p>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

    </div>
  )
}
