import { redirect, notFound } from 'next/navigation'
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4 border-b border-[#E5E5E5] pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700 font-semibold text-sm">
          {otherParty?.display_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="font-semibold text-[#1A1A1A]">{otherParty?.display_name ?? 'McGill Student'}</p>
          {listing && (
            <p className="text-xs text-gray-500">Re: {listing.title}</p>
          )}
        </div>
      </div>

      <MessageThread
        conversationId={conversationId}
        currentUserId={user.id}
        initialMessages={messages ?? []}
      />
    </div>
  )
}
