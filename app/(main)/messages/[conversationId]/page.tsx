import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MessageThread } from '@/components/messaging/MessageThread'

interface Props {
  params: Promise<{ conversationId: string }>
}

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (!user.email_confirmed_at) redirect('/verify-email')

  // Fetch conversation — RLS will enforce ownership
  const { data: conversation } = await supabase
    .from('conversations')
    .select(`
      id,
      listing_id,
      buyer_id,
      seller_id,
      listings(id, title, status),
      buyer:profiles!conversations_buyer_id_fkey(id, display_name),
      seller:profiles!conversations_seller_id_fkey(id, display_name)
    `)
    .eq('id', conversationId)
    .single()

  if (!conversation) notFound()

  // Hard permission check: user must be buyer or seller
  if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
    notFound()
  }

  // Fetch messages
  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at, read_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  // Mark unread messages as read
  const unreadIds = (messages ?? [])
    .filter(m => m.sender_id !== user.id && !m.read_at)
    .map(m => m.id)

  if (unreadIds.length > 0) {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds)
      .eq('conversation_id', conversationId)
  }

  const otherParty = conversation.buyer_id === user.id
    ? (conversation.seller as { id: string; display_name: string } | null)
    : (conversation.buyer as { id: string; display_name: string } | null)

  const listing = conversation.listings as { id: string; title: string; status: string } | null
  const initial = otherParty?.display_name?.[0]?.toUpperCase() ?? '?'

  return (
    /*
     * Full-height column: desktop = 100dvh minus sticky navbar (57px)
     *                     mobile  = 100dvh minus navbar (57px) minus bottom-nav (64px)
     * max-w-2xl keeps it readable on wide screens.
     */
    <div
      className="mx-auto flex max-w-2xl flex-col h-[calc(100dvh-121px)] md:h-[calc(100dvh-57px)]"
    >
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[#E5E5E5] bg-white px-3 py-3">
        {/* Back arrow */}
        <Link
          href="/messages"
          className="flex h-8 w-8 -ml-1 shrink-0 items-center justify-center rounded-full text-[#1A1A1A] hover:bg-gray-100 transition-colors"
          aria-label="Back to messages"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>

        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold text-sm">
          {initial}
        </div>

        {/* Name + listing */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#1A1A1A] text-sm leading-snug">
            {otherParty?.display_name ?? 'McGill Student'}
          </p>
          {listing && (
            <p className="truncate text-xs text-gray-500">{listing.title}</p>
          )}
        </div>

        {/* View listing link */}
        {listing && (
          <Link
            href={`/listings/${listing.id}`}
            className="shrink-0 rounded-md border border-[#E5E5E5] px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 transition-colors"
          >
            View listing
          </Link>
        )}
      </div>

      {/* ── Thread — fills remaining height ── */}
      <div className="flex-1 min-h-0">
        <MessageThread
          conversationId={conversationId}
          currentUserId={user.id}
          initialMessages={messages ?? []}
          otherPartyInitial={initial}
        />
      </div>
    </div>
  )
}
