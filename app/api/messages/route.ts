import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/messages — create or retrieve a conversation, redirect to thread
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!user.email_confirmed_at) {
    return NextResponse.json({ error: 'Email not verified' }, { status: 403 })
  }

  const body = await request.json() as { listing_id?: string; seller_id?: string }
  const { listing_id, seller_id } = body

  if (!seller_id) {
    return NextResponse.json({ error: 'seller_id required' }, { status: 400 })
  }

  // Cannot message yourself
  if (seller_id === user.id) {
    return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
  }

  // Check if conversation already exists
  let query = supabase
    .from('conversations')
    .select('id')
    .eq('buyer_id', user.id)
    .eq('seller_id', seller_id)

  if (listing_id) {
    query = query.eq('listing_id', listing_id)
  } else {
    query = query.is('listing_id', null)
  }

  const { data: existing } = await query.maybeSingle()

  if (existing) {
    return NextResponse.json({ conversationId: existing.id })
  }

  // Create new conversation
  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      buyer_id: user.id,
      seller_id,
      listing_id: listing_id ?? null,
    })
    .select('id')
    .single()

  if (error || !created) {
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }

  return NextResponse.json({ conversationId: created.id })
}
