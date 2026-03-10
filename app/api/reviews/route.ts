import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.email_confirmed_at) return NextResponse.json({ error: 'Email not verified' }, { status: 403 })

  const body = await request.json()
  const { listing_id, reviewee_id, rating, content } = body

  if (!listing_id || !reviewee_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
  }

  // Cannot review yourself
  if (reviewee_id === user.id) {
    return NextResponse.json({ error: 'Cannot review yourself' }, { status: 400 })
  }

  // Trust gate: a conversation must exist between reviewer and reviewee for this listing
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listing_id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .or(`buyer_id.eq.${reviewee_id},seller_id.eq.${reviewee_id}`)
    .limit(1)
    .single()

  if (!conversation) {
    return NextResponse.json(
      { error: 'You can only review someone you have messaged about this listing' },
      { status: 403 }
    )
  }

  const { error } = await supabase.from('reviews').insert({
    reviewer_id: user.id,
    reviewee_id,
    listing_id,
    rating,
    content: content ?? null,
  })

  if (error) {
    // Unique constraint violation = already reviewed
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You have already reviewed this listing' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
